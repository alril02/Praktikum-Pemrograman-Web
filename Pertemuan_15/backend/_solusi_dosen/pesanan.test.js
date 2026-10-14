// KUNCI JAWABAN DOSEN - salin ke tests/api/pesanan.test.js
import { describe, it, expect, beforeAll, vi, afterEach } from "vitest";
import { api, masuk, bearer, buatProdukUji } from "../helpers/client.js";

const BASE = "/api/v1/pesanan";

let admin;
let budi;
let sari;

beforeAll(async () => {
  admin = await masuk("admin");
  budi = await masuk("budi");
  sari = await masuk("sari");
});

afterEach(() => vi.unstubAllGlobals());

const stok = async (id) => (await api().get(`/api/v1/produk/${id}`)).body.data.stok;
const pesan = (token, item) => api().post(BASE).set(bearer(token)).send({ item });

describe("POST /pesanan", () => {
  it("checkout mengurangi stok dan menghitung total dari harga server", async () => {
    const produk = await buatProdukUji(admin, { harga: 30000, stok: 10 });
    const r = await pesan(budi.token, [{ produkId: produk.id, jumlah: 3 }]);

    expect(r.status).toBe(201);
    expect(r.body.data.total).toBe(90000);
    expect(r.body.data.item[0]).toMatchObject({ produkId: produk.id, jumlah: 3, hargaSatuan: 30000 });
    expect(await stok(produk.id)).toBe(7);
  });

  it("pemilik pesanan berasal dari token, bukan dari body", async () => {
    const produk = await buatProdukUji(admin);
    const r = await api()
      .post(BASE)
      .set(bearer(budi.token))
      .send({ penggunaId: sari.pengguna.id, item: [{ produkId: produk.id, jumlah: 1 }] });

    expect(r.status).toBe(201);
    expect(r.body.data.pengguna.id).toBe(budi.pengguna.id);
  });

  it("409 STOK_TIDAK_CUKUP ketika jumlah melebihi stok, dan stok tidak berubah", async () => {
    const produk = await buatProdukUji(admin, { stok: 2 });
    const r = await pesan(budi.token, [{ produkId: produk.id, jumlah: 3 }]);

    expect(r.status).toBe(409);
    expect(r.body.error.kode).toBe("STOK_TIDAK_CUKUP");
    expect(await stok(produk.id)).toBe(2);
  });

  it("atomik: item kedua gagal -> stok item pertama dikembalikan", async () => {
    const a = await buatProdukUji(admin, { stok: 5 });
    const b = await buatProdukUji(admin, { stok: 0 });

    const r = await pesan(budi.token, [{ produkId: a.id, jumlah: 2 }, { produkId: b.id, jumlah: 1 }]);

    expect(r.status).toBe(409);
    expect(await stok(a.id)).toBe(5);
  });

  it("422 untuk item kosong, produk duplikat, dan jumlah di luar batas", async () => {
    const p = await buatProdukUji(admin);

    const kosong = await pesan(budi.token, []);
    const dobel = await pesan(budi.token, [{ produkId: p.id, jumlah: 1 }, { produkId: p.id, jumlah: 1 }]);
    const nol = await pesan(budi.token, [{ produkId: p.id, jumlah: 0 }]);
    const besar = await pesan(budi.token, [{ produkId: p.id, jumlah: 1001 }]);

    for (const r of [kosong, dobel, nol, besar]) {
      expect(r.status).toBe(422);
      expect(r.body.error.kode).toBe("VALIDASI");
    }
  });

  it("401 tanpa token", async () => {
    const r = await api().post(BASE).send({ item: [{ produkId: 1, jumlah: 1 }] });
    expect(r.status).toBe(401);
  });

  it("konkurensi: 5 request bersamaan pada stok 3 -> tepat 3 berhasil dan stok akhir 0", async () => {
    const produk = await buatProdukUji(admin, { stok: 3 });

    const hasil = await Promise.all(
      Array.from({ length: 5 }, () => pesan(budi.token, [{ produkId: produk.id, jumlah: 1 }]))
    );

    const berhasil = hasil.filter((r) => r.status === 201).length;
    const ditolak = hasil.filter((r) => r.status === 409).length;
    expect(berhasil).toBe(3);
    expect(ditolak).toBe(2);
    expect(await stok(produk.id)).toBe(0);
  });
});

describe("GET /pesanan dan /pesanan/:id", () => {
  it("pengguna biasa hanya melihat pesanan miliknya; admin melihat semua", async () => {
    const p = await buatProdukUji(admin);
    await pesan(budi.token, [{ produkId: p.id, jumlah: 1 }]);
    await pesan(sari.token, [{ produkId: p.id, jumlah: 1 }]);

    const milikBudi = await api().get(BASE).set(bearer(budi.token));
    const semua = await api().get(BASE).set(bearer(admin.token));

    expect(milikBudi.body.data.every((x) => x.pengguna.id === budi.pengguna.id)).toBe(true);
    const pemilik = new Set(semua.body.data.map((x) => x.pengguna.id));
    expect(pemilik.has(budi.pengguna.id) && pemilik.has(sari.pengguna.id)).toBe(true);
  });

  it("IDOR: pengguna lain membaca pesanan -> 404 (sama dengan id tidak ada)", async () => {
    const p = await buatProdukUji(admin);
    const dibuat = (await pesan(budi.token, [{ produkId: p.id, jumlah: 1 }])).body.data;

    const lain = await api().get(`${BASE}/${dibuat.id}`).set(bearer(sari.token));
    const tidakAda = await api().get(`${BASE}/99999999`).set(bearer(sari.token));

    expect(lain.status).toBe(404);
    expect(tidakAda.status).toBe(404);
    expect(lain.body.error.kode).toBe(tidakAda.body.error.kode);
  });

  it("pemilik dan admin dapat membaca pesanan -> 200", async () => {
    const p = await buatProdukUji(admin);
    const dibuat = (await pesan(budi.token, [{ produkId: p.id, jumlah: 1 }])).body.data;

    const pemilik = await api().get(`${BASE}/${dibuat.id}`).set(bearer(budi.token));
    const adm = await api().get(`${BASE}/${dibuat.id}`).set(bearer(admin.token));

    expect(pemilik.status).toBe(200);
    expect(adm.status).toBe(200);
  });
});
