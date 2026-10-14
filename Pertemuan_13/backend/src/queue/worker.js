import { klaimBerikut, tandaiSelesai, tandaiGagal, pulihkanMacet, JobGagalPermanen } from "./queue.js";
import { config } from "../config.js";

const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));

// TODO 1: jalankan SATU job yang sudah diklaim.
//   - handler = handlers[job.jenis]; tidak ada -> tandaiGagal(job, new JobGagalPermanen("Handler tidak ditemukan: ...")); return "gagal"
//   - payload = JSON.parse(job.payload)   (JSON rusak -> JobGagalPermanen)
//   - try: hasil = await handler(payload, job); await tandaiSelesai(job.id, hasil); return "selesai"
//   - catch (e): return await tandaiGagal(job, e, new Date(), opsiBackoff)   // "diulang" | "gagal"
export async function prosesJob(job, handlers, opsiBackoff = {}) {
  void [tandaiSelesai, tandaiGagal, JobGagalPermanen, handlers, opsiBackoff];
  return "gagal";
}

// Mengklaim dan memproses satu job. Mengembalikan null bila tidak ada job siap.
export async function jalankanSatu(handlers, opsiBackoff = {}) {
  const job = await klaimBerikut(new Date());
  if (!job) return null;
  const hasil = await prosesJob(job, handlers, opsiBackoff);
  return { id: job.id, jenis: job.jenis, hasil };
}

// TODO 2: loop worker sampai `signal` dibatalkan (AbortSignal).
//   while (!signal.aborted):
//     - tiap ~30 detik panggil pulihkanMacet()
//     - r = await jalankanSatu(handlers, { jitter: 0.2 })
//     - bila r null -> await tunggu(config.jobPollMs)
//   GRACEFUL: setelah signal dibatalkan, selesaikan job yang SEDANG berjalan lalu berhenti (jangan klaim job baru).
export async function mulaiWorker(handlers, { signal, log = console.log } = {}) {
  void [pulihkanMacet, tunggu, config, log];
  while (!signal?.aborted) {
    await tunggu(config.jobPollMs);
  }
}
