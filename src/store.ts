import { BUFFER_SIZE, SYMBOLS } from "./config";
import type { Market, Snapshot, Trade } from "./types";

const data: Snapshot = {};
for (const s of SYMBOLS) data[s] = { future: [], spot: [] };

let dirty = false;

const wib = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Jakarta",
  hour12: false,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});
export const toWIB = (ms: number) => wib.format(new Date(ms));

/** Tambah transaksi baru di posisi paling atas (terbaru dulu). */
export function addTrade(symbol: string, market: Market, trade: Trade) {
  const list = data[symbol]?.[market];
  if (!list) return;
  list.unshift(trade);
  if (list.length > BUFFER_SIZE) list.length = BUFFER_SIZE;
  dirty = true;
}

/** Isi awal (urutan: terbaru dulu). */
export function setTrades(symbol: string, market: Market, trades: Trade[]) {
  if (!data[symbol]) return;
  data[symbol][market] = trades.slice(0, BUFFER_SIZE);
  dirty = true;
}

export const getSnapshot = () => data;

export function consumeDirty() {
  const d = dirty;
  dirty = false;
  return d;
}