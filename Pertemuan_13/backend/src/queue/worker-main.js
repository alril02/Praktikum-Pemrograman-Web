// Titik masuk proses worker:  npm run worker
import { mulaiWorker } from "./worker.js";
import { handlers } from "./handlers.js";
import { prisma } from "../lib/prisma.js";

const kendali = new AbortController();

function berhenti(sinyal) {
  console.log(`[worker] menerima ${sinyal}; menyelesaikan job yang sedang berjalan lalu berhenti...`);
  kendali.abort();
}
process.on("SIGINT", () => berhenti("SIGINT"));
process.on("SIGTERM", () => berhenti("SIGTERM"));

console.log("[worker] aktif. Jenis job:", Object.keys(handlers).join(", "));

await mulaiWorker(handlers, { signal: kendali.signal });
await prisma.$disconnect();
console.log("[worker] berhenti dengan rapi.");
