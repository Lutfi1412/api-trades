export type Market = "future" | "spot";

export interface Trade {
  price: number;
  qty: number; // nilai dalam USDT (price x jumlah koin)
  time: string; // HH:MM:SS WIB
  status: "BUY" | "SELL";
  ts: number; // epoch ms
}

export type Snapshot = Record<string, Record<Market, Trade[]>>;