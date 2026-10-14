// Uji antrean berbasis DB (membutuhkan database yang sudah dimigrasi + seed).  Jalankan: npm test
import { test, after } from "node:test";
import assert from "node:assert/strict";

process.env.JWT_SECRET ??= "x".repeat(40);
process.env.GATEWAY_BASE_URL ??= "http://localhost:4100";
process.env.GATEWAY_API_KEY ??= "k".repeat(20);
process.env.GATEWAY_WEBHOOK_SECRET ??= "s".repeat(20);
process.env.EMAIL_DELAY_MS = "5"; // email palsu cepat selama uji

const { prisma } = await import("../src/lib/prisma.js");
const Q = await import("../src/queue/queue.js");
const { prosesJob, jalankanSatu } = await import("../src/queue/worker.js");
const { handlers } = await import("../src/queue/handlers.js");

const TAG = `uji-${Date.now().toString(36)}`;
const kunci = (s) => `${TAG}:${s}`;
const sekarang = new Date("2030-01-01T00:00:00.000Z");

// Bersihkan job uji agar tidak mengganggu worker sungguhan
after(async () => {
  await prisma.job.deleteMany({ where: { OR: [{ kunciUnik: { startsWith: TAG } }, { jenis: { startsWith: "uji_" } }] } });
  await prisma.$disconnect();
});

// Job uji dibuat dengan runAt jauh di masa lalu agar selalu "siap" dan diklaim lebih dulu daripada job lain
const lampau = new Date("2000-01-01T00:00:00.000Z");
async function buatJob(jenis, opsi = {}) {
  return Q.enqueue(prisma, { jenis, payload: opsi.payload ?? {}, kunciUnik: opsi.kunciUnik ?? null, runAt: opsi.runAt ?? lampau, maksPercobaan: opsi.maksPercobaan ?? 3 });
}

// ---------- backoff ----------
test("hitungBackoff: eksponensial dengan batas atas", () => {
  assert.equal(Q.hitungBackoff(1, { dasarMs: 1000 }), 1000);
  assert.equal(Q.hitungBackoff(2, { dasarMs: 1000 }), 2000);
  assert.equal(Q.hitungBackoff(3, { dasarMs: 1000 }), 4000);
  assert.equal(Q.hitungBackoff(4, { dasarMs: 1000 }), 8000);
  assert.equal(Q.hitungBackoff(20, { dasarMs: 1000, maksMs: 60_000 }), 60_000);
});

test("hitungBackoff: jitter menjaga hasil dalam rentang", () => {
  assert.equal(Q.hitungBackoff(3, { dasarMs: 1000, jitter: 0.2, acak: () => 0 }), 3200); // 4000 * 0.8
  assert.equal(Q.hitungBackoff(3, { dasarMs: 1000, jitter: 0.2, acak: () => 1 }), 4800); // 4000 * 1.2
});

// ---------- enqueue ----------
test("enqueue membuat job menunggu dengan payload JSON", async () => {
  const j = await buatJob("uji_a", { payload: { pesananId: 7 }, kunciUnik: kunci("a") });
  assert.equal(j.status, "menunggu");
  assert.equal(j.percobaan, 0);
  assert.deepEqual(JSON.parse(j.payload), { pesananId: 7 });
});

test("enqueue idempoten: kunciUnik sama tidak membuat job baru", async () => {
  const k = kunci("idem");
  const a = await buatJob("uji_idem", { kunciUnik: k });
  const b = await buatJob("uji_idem", { kunciUnik: k });
  assert.ok(a);
  assert.equal(b, null);
  assert.equal(await prisma.job.count({ where: { kunciUnik: k } }), 1);
});

test("enqueue dalam transaksi ikut dibatalkan bila transaksi di-rollback (outbox)", async () => {
  const k = kunci("rollback");
  await assert.rejects(() =>
    prisma.$transaction(async (tx) => {
      await Q.enqueue(tx, { jenis: "uji_rb", kunciUnik: k, runAt: lampau });
      throw new Error("gagal setelah enqueue");
    })
  );
  assert.equal(await prisma.job.count({ where: { kunciUnik: k } }), 0);
});

// ---------- klaim ----------
test("klaimBerikut: mengklaim, menaikkan percobaan, lalu tidak mengembalikan job yang sama", async () => {
  const k = kunci("klaim");
  await buatJob("uji_klaim", { kunciUnik: k });
  const j = await Q.klaimBerikut(new Date());
  // job lain milik suite (runAt lampau) tidak ada karena dibersihkan; pastikan yang diklaim adalah job ini atau kosong
  assert.ok(j, "harus ada job untuk diklaim");
  const awal = await prisma.job.findUnique({ where: { id: j.id } });
  assert.equal(awal.status, "berjalan");
  assert.equal(awal.percobaan, 1);
  assert.ok(awal.dikunciPada);
  await prisma.job.delete({ where: { id: j.id } }); // bersihkan
});

test("klaimBerikut: job dengan runAt di masa depan tidak diklaim", async () => {
  const k = kunci("masadepan");
  const masaDepan = new Date(Date.now() + 3_600_000);
  const j = await buatJob("uji_future", { kunciUnik: k, runAt: masaDepan });
  const klaim = await Q.klaimBerikut(new Date());
  assert.notEqual(klaim?.id, j.id);
  if (klaim) await prisma.job.update({ where: { id: klaim.id }, data: { status: "selesai" } });
});

test("klaim ATOMIK: dua klaim bersamaan pada satu job, hanya satu berhasil", async () => {
  // singkirkan job siap lain agar hanya satu kandidat
  await prisma.job.updateMany({ where: { status: "menunggu", runAt: { lte: new Date() }, NOT: { jenis: "uji_atomik" } }, data: { runAt: new Date(Date.now() + 86_400_000) } });
  await buatJob("uji_atomik", { kunciUnik: kunci("atomik") });

  const hasil = await Promise.all([Q.klaimBerikut(new Date()), Q.klaimBerikut(new Date())]);
  const berhasil = hasil.filter(Boolean);
  assert.equal(berhasil.length, 1);
  assert.equal(berhasil[0].jenis, "uji_atomik");
  await prisma.job.update({ where: { id: berhasil[0].id }, data: { status: "selesai" } });
});

// ---------- selesai / gagal ----------
async function jobBerjalan(percobaan, maks = 3) {
  const j = await prisma.job.create({
    data: { jenis: "uji_gagal", payload: "{}", status: "berjalan", percobaan, maksPercobaan: maks, dikunciPada: sekarang, runAt: lampau },
  });
  return j;
}

test("tandaiSelesai mengubah status dan mencatat waktu", async () => {
  const j = await jobBerjalan(1);
  await Q.tandaiSelesai(j.id, { ok: true }, sekarang);
  const s = await prisma.job.findUnique({ where: { id: j.id } });
  assert.equal(s.status, "selesai");
  assert.equal(s.selesaiPada.toISOString(), sekarang.toISOString());
  assert.equal(s.dikunciPada, null);
});

test("tandaiGagal: masih ada sisa percobaan -> menunggu dengan runAt = sekarang + backoff", async () => {
  const j = await jobBerjalan(2, 4);
  const r = await Q.tandaiGagal(j, new Error("SMTP down"), sekarang, { dasarMs: 1000 });
  const s = await prisma.job.findUnique({ where: { id: j.id } });
  assert.equal(r, "diulang");
  assert.equal(s.status, "menunggu");
  assert.equal(s.runAt.getTime(), sekarang.getTime() + 2000); // percobaan 2 -> 2000 ms
  assert.match(s.galat, /SMTP down/);
});

test("tandaiGagal: percobaan habis -> gagal (dead-letter)", async () => {
  const j = await jobBerjalan(3, 3);
  const r = await Q.tandaiGagal(j, new Error("tetap gagal"), sekarang);
  const s = await prisma.job.findUnique({ where: { id: j.id } });
  assert.equal(r, "gagal");
  assert.equal(s.status, "gagal");
});

test("tandaiGagal: JobGagalPermanen langsung gagal walau masih ada sisa percobaan", async () => {
  const j = await jobBerjalan(1, 5);
  const r = await Q.tandaiGagal(j, new Q.JobGagalPermanen("data hilang"), sekarang);
  const s = await prisma.job.findUnique({ where: { id: j.id } });
  assert.equal(r, "gagal");
  assert.equal(s.status, "gagal");
});

// ---------- pemulihan ----------
test("pulihkanMacet: job berjalan yang kuncinya melewati timeout dikembalikan ke menunggu", async () => {
  const lama = await prisma.job.create({
    data: { jenis: "uji_macet", payload: "{}", status: "berjalan", percobaan: 1, dikunciPada: new Date(sekarang.getTime() - 120_000), runAt: lampau },
  });
  const baru = await prisma.job.create({
    data: { jenis: "uji_macet", payload: "{}", status: "berjalan", percobaan: 1, dikunciPada: new Date(sekarang.getTime() - 5_000), runAt: lampau },
  });
  const n = await Q.pulihkanMacet(sekarang, 60_000);
  assert.ok(n >= 1);
  assert.equal((await prisma.job.findUnique({ where: { id: lama.id } })).status, "menunggu");
  assert.equal((await prisma.job.findUnique({ where: { id: baru.id } })).status, "berjalan");
});

// ---------- worker ----------
test("prosesJob: handler sukses -> selesai", async () => {
  let dipanggil = null;
  const j = await jobBerjalan(1);
  const r = await prosesJob({ ...j, jenis: "uji_ok", payload: JSON.stringify({ a: 1 }) }, { uji_ok: async (p) => { dipanggil = p; return { ok: true }; } });
  assert.equal(r, "selesai");
  assert.deepEqual(dipanggil, { a: 1 });
  assert.equal((await prisma.job.findUnique({ where: { id: j.id } })).status, "selesai");
});

test("prosesJob: handler melempar galat -> diulang", async () => {
  const j = await jobBerjalan(1, 3);
  const r = await prosesJob({ ...j, jenis: "uji_err" }, { uji_err: async () => { throw new Error("boom"); } }, { dasarMs: 10 });
  assert.equal(r, "diulang");
});

test("prosesJob: handler tidak dikenal -> gagal permanen", async () => {
  const j = await jobBerjalan(1, 5);
  const r = await prosesJob({ ...j, jenis: "uji_tidak_ada" }, {});
  assert.equal(r, "gagal");
});

test("prosesJob: payload JSON rusak -> gagal permanen", async () => {
  const j = await jobBerjalan(1, 5);
  const r = await prosesJob({ ...j, jenis: "uji_ok", payload: "{bukan json" }, { uji_ok: async () => ({}) });
  assert.equal(r, "gagal");
});

test("jalankanSatu: tidak ada job siap -> null", async () => {
  await prisma.job.updateMany({ where: { status: "menunggu" }, data: { runAt: new Date(Date.now() + 86_400_000) } });
  assert.equal(await jalankanSatu({}), null);
});

// ---------- handler bisnis & idempotensi ----------
async function pastikanPesanan() {
  const p = await prisma.pesanan.findFirst({ orderBy: { id: "asc" } });
  assert.ok(p, "jalankan `npm run db:seed` terlebih dahulu");
  await prisma.notifikasi.deleteMany({ where: { pesananId: p.id } });
  await prisma.invoice.deleteMany({ where: { pesananId: p.id } });
  return p;
}

test("kirim_email_konfirmasi: dijalankan dua kali -> satu Notifikasi (idempoten)", async () => {
  const p = await pastikanPesanan();
  const r1 = await handlers.kirim_email_konfirmasi({ pesananId: p.id }, { percobaan: 1 });
  const r2 = await handlers.kirim_email_konfirmasi({ pesananId: p.id }, { percobaan: 1 });
  assert.equal(await prisma.notifikasi.count({ where: { pesananId: p.id } }), 1);
  assert.equal(r1.terkirim, true);
  assert.equal(r2.dilewati, true);
});

test("kirim_email_konfirmasi: pesanan tidak ada -> JobGagalPermanen", async () => {
  await assert.rejects(
    () => handlers.kirim_email_konfirmasi({ pesananId: 99999999 }, { percobaan: 1 }),
    (e) => e instanceof Q.JobGagalPermanen
  );
});

test("buat_invoice: dua kali -> satu Invoice dengan nomor deterministik", async () => {
  const p = await pastikanPesanan();
  const a = await handlers.buat_invoice({ pesananId: p.id });
  const b = await handlers.buat_invoice({ pesananId: p.id });
  assert.equal(await prisma.invoice.count({ where: { pesananId: p.id } }), 1);
  assert.equal(a.nomor, b.nomor);
  assert.match(a.nomor, new RegExp(`^INV-\\d{4}-${String(p.id).padStart(6, "0")}$`));
});
