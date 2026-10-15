import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { BROADCAST_MS, PORT, SYMBOLS } from "./config";
import { consumeDirty, getSnapshot } from "./store";
import { startBinance } from "./binance";

const TOPIC = "trades";

const app = new Elysia()
  .use(cors())
  .get("/", () => ({ ok: true, symbols: SYMBOLS, ws: "/ws", snapshot: "/trades" }))
  .get("/trades", () => getSnapshot())
  .ws("/ws", {
    open(ws) {
      ws.subscribe(TOPIC);
      ws.send(JSON.stringify(getSnapshot())); // kirim data terkini saat baru konek
    },
  })
  .listen(PORT);

// Kirim ke semua klien hanya jika ada data baru
setInterval(() => {
  if (!consumeDirty()) return;
  app.server?.publish(TOPIC, JSON.stringify(getSnapshot()));
}, BROADCAST_MS);

await startBinance();
console.log(`Server jalan di http://localhost:${PORT}`);