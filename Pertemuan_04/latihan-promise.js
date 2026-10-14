// Praktikum Pertemuan 4 - Latihan Promise & async/await
// Jalankan: node latihan-promise.js
// Selesaikan setiap fungsi. Pengecekan otomatis ada di bawah.

const tunggu = (ms, nilai) => new Promise((resolve) => setTimeout(() => resolve(nilai), ms));
const tolak = (ms, pesan) => new Promise((_, reject) => setTimeout(() => reject(new Error(pesan)), ms));

// 1. Jalankan dua pekerjaan PARALEL dan kembalikan array hasilnya [a, b].
//    Gunakan Promise.all. Total waktu harus mendekati yang terlama, bukan jumlahnya.
async function paralel(ambilA, ambilB) {
  // TODO
}

// 2. Kembalikan hasil `kerja()`; jika menolak, kembalikan `cadangan` (jangan melempar).
async function denganCadangan(kerja, cadangan) {
  // TODO
}

// 3. Jalankan `kerja()` dengan batas waktu. Jika melebihi `ms`, tolak dengan Error("timeout").
//    Petunjuk: Promise.race([kerja(), tolak(ms, "timeout")]).
async function denganTimeout(kerja, ms) {
  // TODO
}

// 4. Coba ulang `kerja` hingga `maks` kali. Berhenti pada keberhasilan pertama.
//    Jika semua gagal, lempar error terakhir. Jeda antar percobaan: 10 ms.
async function cobaUlang(kerja, maks) {
  // TODO
}

// 5. Jalankan semua pekerjaan dan kembalikan { berhasil: [...nilai], gagal: jumlahGagal }.
//    Gunakan Promise.allSettled.
async function kumpulkan(daftarKerja) {
  // TODO
}

// ====================== PENGECEKAN (jangan diubah) ======================
const hasil = [];
const cek = (nama, kondisi) => hasil.push({ nama, lulus: Boolean(kondisi) });

async function uji(nama, fn) {
  try {
    cek(nama, await fn());
  } catch (e) {
    cek(`${nama} (error: ${e?.message})`, false);
  }
}

await uji("1. paralel: hasil benar dan cepat", async () => {
  const t0 = Date.now();
  const r = await paralel(() => tunggu(150, "A"), () => tunggu(150, "B"));
  const dt = Date.now() - t0;
  return Array.isArray(r) && r[0] === "A" && r[1] === "B" && dt < 260;
});

await uji("2a. denganCadangan: sukses", async () => (await denganCadangan(() => tunggu(10, 1), 0)) === 1);
await uji("2b. denganCadangan: gagal -> cadangan", async () => (await denganCadangan(() => tolak(10, "x"), 99)) === 99);

await uji("3a. denganTimeout: selesai tepat waktu", async () => (await denganTimeout(() => tunggu(20, "ok"), 200)) === "ok");
await uji("3b. denganTimeout: melebihi batas", async () => {
  try { await denganTimeout(() => tunggu(300, "lambat"), 50); return false; }
  catch (e) { return e.message === "timeout"; }
});

await uji("4a. cobaUlang: berhasil pada percobaan ke-3", async () => {
  let n = 0;
  const r = await cobaUlang(async () => { n++; if (n < 3) throw new Error("gagal"); return "ok"; }, 5);
  return r === "ok" && n === 3;
});
await uji("4b. cobaUlang: menyerah setelah maks", async () => {
  let n = 0;
  try { await cobaUlang(async () => { n++; throw new Error("selalu gagal"); }, 3); return false; }
  catch (e) { return n === 3 && e.message === "selalu gagal"; }
});

await uji("5. kumpulkan: berhasil dan gagal terpisah", async () => {
  const r = await kumpulkan([() => tunggu(10, 1), () => tolak(10, "x"), () => tunggu(10, 3)]);
  return JSON.stringify(r.berhasil) === "[1,3]" && r.gagal === 1;
});

for (const h of hasil) console.log(`${h.lulus ? "LULUS" : "GAGAL"}  ${h.nama}`);
const total = hasil.filter((h) => h.lulus).length;
console.log(`\nSkor: ${total}/${hasil.length}`);
process.exitCode = total === hasil.length ? 0 : 1;
