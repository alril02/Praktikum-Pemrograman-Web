import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  console.log(`API berjalan di http://localhost:${PORT}/api/v1`);
});

// Tutup koneksi database dengan rapi
async function berhenti() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", berhenti);
process.on("SIGTERM", berhenti);
