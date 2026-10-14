import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";
import { pasangShutdown } from "./lib/shutdown.js";

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  console.log(JSON.stringify({ level: "info", pesan: "API berjalan", port: PORT, env: process.env.NODE_ENV ?? "development" }));
});

// Batas waktu keep-alive lebih besar dari proxy/load balancer (umumnya 60 detik) agar tidak ada reset koneksi
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

pasangShutdown({
  server,
  timeoutMs: 10_000,
  onTutup: async () => {
    await prisma.$disconnect();
  },
});
