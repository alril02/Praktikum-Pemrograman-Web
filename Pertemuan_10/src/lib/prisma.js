// SATU instance PrismaClient per proses. Jangan membuat instance baru di setiap request.
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: [{ emit: "event", level: "query" }],
});

// Penghitung kueri: dipakai untuk mendemonstrasikan masalah N+1 (header X-Jumlah-Query).
// Catatan: penghitung bersifat global proses, cukup untuk demo satu pengguna.
let jumlahKueri = 0;

prisma.$on("query", (e) => {
  jumlahKueri += 1;
  if (process.env.LOG_QUERY === "1") {
    console.log(`[sql ${e.duration}ms] ${e.query}`);
  }
});

export const hitungKueri = () => jumlahKueri;
