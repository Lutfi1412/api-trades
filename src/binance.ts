import {
  BUFFER_SIZE, FUTURES_REST, FUTURES_WS, SPOT_REST, SPOT_WS, SYMBOLS,
} from "./config";
import { addTrade, setTrades, toWIB } from "./store";
import type { Market, Trade } from "./types";

const round2 = (n: number) => Math.round(n * 100) / 100;

type RestTrade = {
  price: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
};

// Isi awal dari REST supaya data tidak kosong saat server baru jalan
async function seed(market: Market, symbol: string) {
  const url =
    market === "future"
      ? `${FUTURES_REST}/fapi/v1/trades?symbol=${symbol}&limit=${BUFFER_SIZE}`
      : `${SPOT_REST}/api/v3/trades?symbol=${symbol}&limit=${BUFFER_SIZE}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);

  const rows = (await res.json()) as RestTrade[];
  const trades: Trade[] = rows.reverse().map((r) => ({
    price: parseFloat(r.price),
    qty: round2(parseFloat(r.quoteQty)),
    time: toWIB(r.time),
    status: r.isBuyerMaker ? "SELL" : "BUY",
    ts: r.time,
  }));
  setTrades(symbol, market, trades);
}

// Futures: <symbol>@aggTrade, Spot: <symbol>@trade
function connect(market: Market) {
  const suffix = market === "future" ? "aggTrade" : "trade";
  const streams = SYMBOLS.map((s) => `${s.toLowerCase()}@${suffix}`).join("/");
  const base = market === "future" ? FUTURES_WS : SPOT_WS;
  const url = `${base}?streams=${streams}`;
  let retry = 0;

  const open = () => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      retry = 0;
      console.log(`[${market}] terhubung: ${streams}`);
    };

    ws.onmessage = (ev) => {
      try {
        const d = JSON.parse(String(ev.data)).data;
        if (!d?.s) return;
        const price = parseFloat(d.p);
        addTrade(d.s, market, {
          price,
          qty: round2(price * parseFloat(d.q)),
          time: toWIB(d.T),
          status: d.m ? "SELL" : "BUY", // m = buyer is maker
          ts: d.T,
        });
      } catch (e) {
        console.error(`[${market}] pesan tidak valid`, e);
      }
    };

    ws.onerror = () => console.error(`[${market}] error koneksi`);

    ws.onclose = () => {
      const delay = Math.min(1000 * 2 ** retry++, 30_000);
      console.log(`[${market}] terputus, reconnect ${delay} ms`);
      setTimeout(open, delay);
    };
  };

  open();
}

export async function startBinance() {
  await Promise.all(
    SYMBOLS.flatMap((s) =>
      (["future", "spot"] as Market[]).map((m) =>
        seed(m, s).catch((e) => console.error(`[seed ${m} ${s}]`, e.message)),
      ),
    ),
  );
  connect("future");
  connect("spot");
}