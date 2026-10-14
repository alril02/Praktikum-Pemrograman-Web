// KUNCI JAWABAN DOSEN - salin ke src/queue/queue.js
import { prisma } from "../lib/prisma.js";
import { config } from "../config.js";

export const STATUS_JOB = {
  MENUNGGU: "menunggu",
  BERJALAN: "berjalan",
  SELESAI: "selesai",
  GAGAL: "gagal",
};

export class JobGagalPermanen extends Error {
  constructor(pesan) {
    super(pesan);
    this.name = "JobGagalPermanen";
  }
}

export function hitungBackoff(percobaan, { dasarMs = config.jobBackoffMs, maksMs = 300_000, jitter = 0, acak = Math.random } = {}) {
  const dasar = Math.min(maksMs, dasarMs * 2 ** Math.max(0, percobaan - 1));
  if (!jitter) return dasar;
  return Math.round(dasar * (1 - jitter + acak() * 2 * jitter));
}

export async function enqueue(klien, { jenis, payload = {}, kunciUnik = null, runAt = new Date(), maksPercobaan = config.jobMaxPercobaan }) {
  if (kunciUnik) {
    const ada = await klien.job.findUnique({ where: { kunciUnik } });
    if (ada) return null;
  }
  try {
    return await klien.job.create({
      data: { jenis, payload: JSON.stringify(payload), kunciUnik, runAt, maksPercobaan },
    });
  } catch (e) {
    if (e?.code === "P2002") return null; // balapan pada kunciUnik
    throw e;
  }
}

export async function klaimBerikut(sekarang = new Date()) {
  const kandidat = await prisma.job.findFirst({
    where: { status: STATUS_JOB.MENUNGGU, runAt: { lte: sekarang } },
    orderBy: [{ runAt: "asc" }, { id: "asc" }],
  });
  if (!kandidat) return null;

  const klaim = await prisma.job.updateMany({
    where: { id: kandidat.id, status: STATUS_JOB.MENUNGGU },
    data: { status: STATUS_JOB.BERJALAN, dikunciPada: sekarang, percobaan: { increment: 1 } },
  });
  if (klaim.count === 0) return null;

  return prisma.job.findUnique({ where: { id: kandidat.id } });
}

export async function tandaiSelesai(id, hasil = null, sekarang = new Date()) {
  await prisma.job.update({
    where: { id },
    data: {
      status: STATUS_JOB.SELESAI,
      selesaiPada: sekarang,
      dikunciPada: null,
      hasil: hasil === null ? null : JSON.stringify(hasil),
    },
  });
}

export async function tandaiGagal(job, galat, sekarang = new Date(), opsiBackoff = {}) {
  const pesan = String(galat?.message ?? galat).slice(0, 500);
  const permanen = galat instanceof JobGagalPermanen || job.percobaan >= job.maksPercobaan;

  if (permanen) {
    await prisma.job.update({
      where: { id: job.id },
      data: { status: STATUS_JOB.GAGAL, galat: pesan, selesaiPada: sekarang, dikunciPada: null },
    });
    return "gagal";
  }

  const jeda = hitungBackoff(job.percobaan, opsiBackoff);
  await prisma.job.update({
    where: { id: job.id },
    data: {
      status: STATUS_JOB.MENUNGGU,
      runAt: new Date(sekarang.getTime() + jeda),
      galat: pesan,
      dikunciPada: null,
    },
  });
  return "diulang";
}

export async function pulihkanMacet(sekarang = new Date(), timeoutMs = config.jobLockTimeoutMs) {
  const batas = new Date(sekarang.getTime() - timeoutMs);
  const r = await prisma.job.updateMany({
    where: { status: STATUS_JOB.BERJALAN, dikunciPada: { lt: batas } },
    data: { status: STATUS_JOB.MENUNGGU, dikunciPada: null },
  });
  return r.count;
}

export { prisma };
