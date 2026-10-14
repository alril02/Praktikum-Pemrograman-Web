// Uji lapisan API dengan fetch palsu.  Jalankan: npm test
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { api, pasangAuth, ApiError } from "../src/api.js";

let panggilan;
let balasan;

function jawab(status, body, headers = {}) {
  return () =>
    new Response(body === null ? null : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json", ...headers },
    });
}

beforeEach(() => {
  panggilan = [];
  balasan = jawab(200, { data: [] });
  globalThis.fetch = async (url, opsi) => {
    panggilan.push({ url: String(url), opsi });
    return typeof balasan === "function" ? balasan() : balasan;
  };
  pasangAuth({ token: () => null, onTidakSah: () => {} });
});

test("menyertakan Authorization: Bearer bila ada token", async () => {
  pasangAuth({ token: () => "TOKEN-123", onTidakSah: () => {} });
  await api.get("/produk");
  assert.equal(panggilan[0].opsi.headers.Authorization, "Bearer TOKEN-123");
});

test("tanpa token: tidak ada header Authorization", async () => {
  await api.get("/produk");
  assert.equal(panggilan[0].opsi.headers.Authorization, undefined);
});

test("opsi tanpaAuth: token tidak dikirim walau tersedia", async () => {
  pasangAuth({ token: () => "TOKEN-123", onTidakSah: () => {} });
  await api.post("/auth/masuk", { email: "a@b.c", password: "x" }, { tanpaAuth: true });
  assert.equal(panggilan[0].opsi.headers.Authorization, undefined);
});

test("body objek dikirim sebagai JSON dengan Content-Type", async () => {
  await api.post("/produk", { nama: "Kopi" });
  const { opsi } = panggilan[0];
  assert.equal(opsi.headers["Content-Type"], "application/json");
  assert.equal(opsi.body, JSON.stringify({ nama: "Kopi" }));
});

test("FormData dikirim apa adanya TANPA Content-Type manual", async () => {
  const fd = new FormData();
  fd.append("gambar", new Blob(["x"], { type: "image/png" }), "a.png");
  await api.post("/produk/1/gambar", fd);
  const { opsi } = panggilan[0];
  assert.ok(opsi.body instanceof FormData);
  assert.equal(opsi.headers["Content-Type"], undefined);
});

test("401 pada request ber-token memanggil onTidakSah", async () => {
  let dipanggil = 0;
  let token = "T";
  pasangAuth({ token: () => token, onTidakSah: () => { dipanggil++; token = null; } });
  balasan = jawab(401, { error: { kode: "TOKEN_TIDAK_VALID", pesan: "Token tidak valid" } });

  await assert.rejects(() => api.get("/pesanan"), (e) => e instanceof ApiError && e.status === 401);
  assert.equal(dipanggil, 1);
});

test("401 tanpa token (mis. login salah) TIDAK memicu onTidakSah", async () => {
  let dipanggil = 0;
  pasangAuth({ token: () => null, onTidakSah: () => dipanggil++ });
  balasan = jawab(401, { error: { kode: "KREDENSIAL_SALAH", pesan: "Email atau kata sandi salah" } });

  await assert.rejects(() => api.post("/auth/masuk", {}, { tanpaAuth: true }), (e) => e.status === 401);
  assert.equal(dipanggil, 0);
});

test("beberapa 401 paralel hanya memicu onTidakSah SEKALI (single-flight)", async () => {
  let dipanggil = 0;
  let token = "T";
  pasangAuth({ token: () => token, onTidakSah: () => { dipanggil++; token = null; } });
  balasan = jawab(401, { error: { kode: "TOKEN_TIDAK_VALID", pesan: "x" } });

  const hasil = await Promise.allSettled([api.get("/a"), api.get("/b"), api.get("/c")]);
  assert.ok(hasil.every((h) => h.status === "rejected"));
  assert.equal(dipanggil, 1);
});

test("422: galatField memetakan detail ke object field -> pesan", async () => {
  balasan = jawab(422, {
    error: {
      kode: "VALIDASI",
      pesan: "Data tidak valid",
      detail: [{ field: "harga", pesan: "Harga tidak boleh negatif" }, { field: "nama", pesan: "Nama minimal 3 karakter" }],
    },
  });
  try {
    await api.post("/produk", {});
    assert.fail("seharusnya melempar");
  } catch (e) {
    assert.ok(e instanceof ApiError);
    assert.equal(e.status, 422);
    assert.deepEqual(e.galatField, { harga: "Harga tidak boleh negatif", nama: "Nama minimal 3 karakter" });
  }
});

test("galatField kosong bila tidak ada detail", () => {
  assert.deepEqual(new ApiError("x", { status: 500 }).galatField, {});
});

test("204 mengembalikan null", async () => {
  balasan = () => new Response(null, { status: 204 });
  assert.equal(await api.delete("/produk/1"), null);
});

test("kegagalan jaringan menjadi ApiError jenis 'jaringan'", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("fetch failed");
  };
  await assert.rejects(() => api.get("/produk"), (e) => e instanceof ApiError && e.jenis === "jaringan");
});

test("AbortError diteruskan apa adanya (bukan ApiError)", async () => {
  globalThis.fetch = async () => {
    throw new DOMException("dibatalkan", "AbortError");
  };
  await assert.rejects(() => api.get("/produk"), (e) => e.name === "AbortError" && !(e instanceof ApiError));
});

test("429 membawa retryAfter dari header Retry-After", async () => {
  balasan = jawab(429, { error: { kode: "TERLALU_BANYAK_PERCOBAAN", pesan: "x" } }, { "Retry-After": "30" });
  try {
    await api.get("/x");
    assert.fail("seharusnya melempar");
  } catch (e) {
    assert.equal(e.status, 429);
    assert.equal(e.retryAfter, 30);
  }
});
