export const PORT = Number(process.env.PORT ?? 3000);
export const SYMBOLS = (process.env.SYMBOLS ?? "BTCUSDT,SOLUSDT")
  .split(",")
  .map((s) => s.trim().toUpperCase())
  .filter(Boolean);
export const BUFFER_SIZE = Number(process.env.BUFFER_SIZE ?? 50);
export const BROADCAST_MS = Number(process.env.BROADCAST_MS ?? 200);

export const FUTURES_REST = "https://fapi.binance.com";
export const SPOT_REST = "https://api.binance.com";
export const FUTURES_WS = "wss://fstream.binance.com/market/stream";
export const SPOT_WS = "wss://stream.binance.com:9443/stream";