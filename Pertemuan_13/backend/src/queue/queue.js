// Antrean job berbasis tabel `Job` (pola outbox). Setara konsep dengan BullMQ/SQS.
// Uji dengan:  npm test   (tests/queue.test.mjs)
import { prisma } from "../lib/prisma.js";
import { config } from "../config.js";

export const STATUS_JOB = {
  MENUNGGU: "menunggu",
  BERJALAN: "berjalan",
  SELESAI: "selesai",
  GAGAL: "gagal", // dead-letter
};

// Lempar dari handler untuk kegagalan PERMANEN (tidak ada gunanya retry)
export class JobGagalPermanen extends Error {
  constructor(pesan) {
    super(pesan);
    this.name = "JobGagalPermanen";
  }
}

// TODO 1: jeda sebelum percobaan berikutnya (ms).
//   jeda = min(maksMs, dasarMs * 2 ** (percobaan - 1))
//   lalu terapkan jitter: jeda * (1 - jitter + acak() * 2 * jitter)   (jitter 0 = deterministik)
//   Contoh dasar 1000: percobaan 1,2,3,4 -> 1000, 2000, 4000, 8000
export function hitungBackoff(percobaan, { dasarMs = config.jobBackoffMs, maksMs = 300_000, jitter = 0, acak = Math.random } = {}) {
  return dasarMs;
}

// TODO 2: masukkan job.  `klien` boleh prisma ATAU `tx` (agar dapat dalam transaksi pemanggil -> outbox).
//   - bila kunciUnik diberikan dan job dengan kunci itu SUDAH ada -> kembalikan null (idempoten, tidak membuat baru)
//   - selain itu klien.job.create({ data: { jenis, payload: JSON.stringify(payload), kunciUnik, runAt, maksPercobaan } })
//   - tangkap galat code "P2002" (balapan pada kunciUnik) -> kembalikan null
export async function enqueue(klien, { jenis, payload = {}, kunciUnik = null, runAt = new Date(), maksPercobaan = config.jobMaxPercobaan }) {
  throw new Error("Belum diimplementasikan: enqueue");
}

// TODO 3: klaim SATU job siap jalan secara ATOMIK.
//   a. cari job pertama: status "menunggu" dan runAt <= sekarang, urut runAt lalu id
//   b. tidak ada -> null
//   c. prisma.job.updateMany({ where: { id, status: "menunggu" },
//        data: { status: "berjalan", dikunciPada: sekarang, percobaan: { increment: 1 } } })
//      count === 0 (diklaim worker lain) -> null
//   d. kembalikan job terbaru (findUnique)
export async function klaimBerikut(sekarang = new Date()) {
  return null;
}

// TODO 4: tandai selesai: status "selesai", selesaiPada = sekarang, hasil = JSON string (opsional), dikunciPada = null
export async function tandaiSelesai(id, hasil = null, sekarang = new Date()) {
  throw new Error("Belum diimplementasikan: tandaiSelesai");
}

// TODO 5: tangani kegagalan. `job` adalah hasil klaimBerikut (percobaan SUDAH bertambah).
//   - galat instanceof JobGagalPermanen ATAU job.percobaan >= job.maksPercobaan
//       -> status "gagal", galat = pesan, selesaiPada = sekarang, dikunciPada = null; return "gagal"
//   - selain itu -> status "menunggu", runAt = sekarang + hitungBackoff(job.percobaan, opsiBackoff),
//       galat = pesan, dikunciPada = null; return "diulang"
export async function tandaiGagal(job, galat, sekarang = new Date(), opsiBackoff = {}) {
  throw new Error("Belum diimplementasikan: tandaiGagal");
}

// TODO 6: pulihkan job "berjalan" yang dikunciPada lebih tua dari timeoutMs (worker mati).
//   updateMany -> status "menunggu", dikunciPada null. Kembalikan jumlah job yang dipulihkan.
export async function pulihkanMacet(sekarang = new Date(), timeoutMs = config.jobLockTimeoutMs) {
  return 0;
}

export { prisma };
