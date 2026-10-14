// Uji cache TTL (murni, tanpa jaringan/DB).  Jalankan: npm test
import { test } from "node:test";
import assert from "node:assert/strict";

// config.js mewajibkan variabel lingkungan; sediakan nilai uji bila belum ada
process.env.JWT_SECRET ??= "x".repeat(40);
process.env.GATEWAY_BASE_URL ??= "http://localhost:4100";
process.env.GATEWAY_API_KEY ??= "k".repeat(20);
process.env.GATEWAY_WEBHOOK_SECRET ??= "s".repeat(20);

const { TtlCache, ambilAtauHitung, cache } = await import("../src/lib/cache.js");

function buat(opsi = {}) {
  let t = 1_000_000;
  const c = new TtlCache({ sekarang: () => t, ...opsi });
  return { c, maju: (ms) => (t += ms) };
}

test("set lalu get mengembalikan nilai", () => {
  const { c } = buat();
  c.set("a", { x: 1 }, 1000);
  assert.deepEqual(c.get("a"), { x: 1 });
});

test("kunci tidak ada -> undefined", () => {
  const { c } = buat();
  assert.equal(c.get("tidak-ada"), undefined);
});

test("entri kedaluwarsa tidak dikembalikan dan dibuang", () => {
  const { c, maju } = buat();
  c.set("a", 1, 1000);
  maju(999);
  assert.equal(c.get("a"), 1);
  maju(2);
  assert.equal(c.get("a"), undefined);
  assert.equal(c.ukuran, 0);
});

test("statistik hit dan miss dihitung", () => {
  const { c } = buat();
  c.set("a", 1, 1000);
  c.get("a");
  c.get("a");
  c.get("b");
  assert.equal(c.statistik.hit, 2);
  assert.equal(c.statistik.miss, 1);
});

test("nilai falsy yang valid (0, '', false) tetap tersimpan", () => {
  const { c } = buat();
  c.set("nol", 0, 1000);
  c.set("kosong", "", 1000);
  c.set("salah", false, 1000);
  assert.equal(c.get("nol"), 0);
  assert.equal(c.get("kosong"), "");
  assert.equal(c.get("salah"), false);
});

test("hapus satu kunci", () => {
  const { c } = buat();
  c.set("a", 1, 1000);
  assert.equal(c.hapus("a"), true);
  assert.equal(c.hapus("a"), false);
  assert.equal(c.get("a"), undefined);
});

test("hapusAwalan membuang hanya kunci berawalan sama", () => {
  const { c } = buat();
  c.set("produk:1", 1, 1000);
  c.set("produk:2", 2, 1000);
  c.set("pesanan:1", 3, 1000);
  assert.equal(c.hapusAwalan("produk:"), 2);
  assert.equal(c.get("produk:1"), undefined);
  assert.equal(c.get("pesanan:1"), 3);
});

test("melebihi maksEntri membuang entri tertua", () => {
  const { c } = buat({ maksEntri: 2 });
  c.set("a", 1, 1000);
  c.set("b", 2, 1000);
  c.set("c", 3, 1000);
  assert.equal(c.ukuran, 2);
  assert.equal(c.get("a"), undefined);
  assert.equal(c.get("b"), 2);
  assert.equal(c.get("c"), 3);
});

test("set ulang kunci yang sama memperbarui nilai dan urutan sisip", () => {
  const { c } = buat({ maksEntri: 2 });
  c.set("a", 1, 1000);
  c.set("b", 2, 1000);
  c.set("a", 10, 1000); // a menjadi paling baru
  c.set("c", 3, 1000); // membuang b (tertua)
  assert.equal(c.get("a"), 10);
  assert.equal(c.get("b"), undefined);
});

test("jitter: TTL efektif berada dalam rentang ±jitter", () => {
  const rendah = buat({ jitter: 0.1, acak: () => 0 });
  rendah.c.set("a", 1, 1000);
  rendah.maju(899);
  assert.equal(rendah.c.get("a"), 1);
  rendah.maju(2); // 901 > 900
  assert.equal(rendah.c.get("a"), undefined);

  const tinggi = buat({ jitter: 0.1, acak: () => 1 });
  tinggi.c.set("a", 1, 1000);
  tinggi.maju(1099);
  assert.equal(tinggi.c.get("a"), 1);
  tinggi.maju(2);
  assert.equal(tinggi.c.get("a"), undefined);
});

test("ambilAtauHitung: miss lalu hit, fungsi hitung dipanggil sekali", async () => {
  cache.bersihkan();
  let dipanggil = 0;
  const hitung = async () => {
    dipanggil++;
    return { n: 42 };
  };
  const a = await ambilAtauHitung("uji:kunci", hitung, 10_000);
  const b = await ambilAtauHitung("uji:kunci", hitung, 10_000);
  assert.equal(a.hit, false);
  assert.equal(b.hit, true);
  assert.deepEqual(b.nilai, { n: 42 });
  assert.equal(dipanggil, 1);
  cache.bersihkan();
});
