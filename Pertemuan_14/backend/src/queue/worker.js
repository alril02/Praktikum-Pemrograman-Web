// KUNCI JAWABAN DOSEN - salin ke src/queue/worker.js
import { klaimBerikut, tandaiSelesai, tandaiGagal, pulihkanMacet, JobGagalPermanen } from "./queue.js";
import { config } from "../config.js";

const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));

export async function prosesJob(job, handlers, opsiBackoff = {}) {
  const handler = handlers[job.jenis];
  if (!handler) {
    return tandaiGagal(job, new JobGagalPermanen(`Handler tidak ditemukan: ${job.jenis}`), new Date(), opsiBackoff);
  }

  let payload;
  try {
    payload = JSON.parse(job.payload);
  } catch {
    return tandaiGagal(job, new JobGagalPermanen("Payload bukan JSON valid"), new Date(), opsiBackoff);
  }

  try {
    const hasil = await handler(payload, job);
    await tandaiSelesai(job.id, hasil ?? null);
    return "selesai";
  } catch (e) {
    return tandaiGagal(job, e, new Date(), opsiBackoff);
  }
}

export async function jalankanSatu(handlers, opsiBackoff = {}) {
  const job = await klaimBerikut(new Date());
  if (!job) return null;
  const hasil = await prosesJob(job, handlers, opsiBackoff);
  return { id: job.id, jenis: job.jenis, hasil };
}

export async function mulaiWorker(handlers, { signal, log = console.log } = {}) {
  let terakhirPulih = 0;

  while (!signal?.aborted) {
    if (Date.now() - terakhirPulih > 30_000) {
      terakhirPulih = Date.now();
      const n = await pulihkanMacet();
      if (n > 0) log(`[worker] memulihkan ${n} job macet`);
    }

    const r = await jalankanSatu(handlers, { jitter: 0.2 });
    if (r) {
      log(`[worker] job #${r.id} ${r.jenis} -> ${r.hasil}`);
    } else {
      await tunggu(config.jobPollMs);
    }
  }
}
