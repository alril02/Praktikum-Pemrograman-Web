// Contoh LENGKAP tes integrasi API (teladan pola Arrange-Act-Assert).
import { describe, it, expect, beforeAll } from "vitest";
import { api, masuk, bearer } from "../helpers/client.js";

const BASE = "/api/v1/produk";

describe("GET /produk", () => {
  it("mengembalikan daftar dengan meta paginasi", async () => {
    const r = await api().get(`${BASE}?batas=5`);

    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data)).toBe(true);
    expect(r.body.data.length).toBeLessThanOrEqual(5);
    expect(r.body.meta).toMatchObject({ halaman: 1, batas: 5 });
    expect(r.body.meta.total).toBeGreaterThanOrEqual(10);
  });

  it("menyaring berdasarkan kategori", async () => {
    const r = await api().get(`${BASE}?kategori=teh&batas=100`);

    expect(r.status).toBe(200);
    expect(r.body.data.length).toBeGreaterThan(0);
    expect(r.body.data.every((p) => p.kategori === "teh")).toBe(true);
  });

  it("mengurutkan menurun berdasarkan harga", async () => {
    const r = await api().get(`${BASE}?urut=-harga&batas=100`);
    const harga = r.body.data.map((p) => p.harga);

    expect(harga).toEqual([...harga].sort((a, b) => b - a));
  });

  it("membatasi `batas` maksimum 100", async () => {
    const r = await api().get(`${BASE}?batas=100000`);
    expect(r.body.meta.batas).toBe(100);
  });

  it("menolak kolom urut di luar whitelist dengan 400", async () => {
    const r = await api().get(`${BASE}?urut=passwordHash`);
    expect(r.status).toBe(400);
    expect(r.body.error.kode).toBe("URUT_TIDAK_VALID");
  });

  it("menandai respons cache (MISS lalu HIT) dengan header X-Cache", async () => {
    const url = `${BASE}?kategori=gula&batas=3`;
    const a = await api().get(url);
    const b = await api().get(url);

    expect(a.headers["x-cache"]).toBeDefined();
    expect(b.headers["x-cache"]).toBe("HIT");
  });
});

describe("GET /produk/:id", () => {
  it("mengembalikan satu produk", async () => {
    const r = await api().get(`${BASE}/1`);
    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({ id: 1, kategori: expect.any(String) });
  });

  it("404 untuk id yang tidak ada", async () => {
    const r = await api().get(`${BASE}/999999`);
    expect(r.status).toBe(404);
    expect(r.body.error.kode).toBe("TIDAK_DITEMUKAN");
  });

  it("400 untuk id bukan angka", async () => {
    const r = await api().get(`${BASE}/abc`);
    expect(r.status).toBe(400);
  });
});

describe("penulisan produk (admin)", () => {
  let admin;
  let user;

  beforeAll(async () => {
    admin = await masuk("admin");
    user = await masuk("budi");
  });

  const valid = () => ({ nama: `Kopi Uji ${Date.now()}`, harga: 55000, stok: 7, kategori: "kopi" });

  it("401 tanpa token", async () => {
    const r = await api().post(BASE).send(valid());
    expect(r.status).toBe(401);
    expect(r.headers["www-authenticate"]).toMatch(/^Bearer/);
  });

  it("403 untuk peran user", async () => {
    const r = await api().post(BASE).set(bearer(user.token)).send(valid());
    expect(r.status).toBe(403);
  });

  it("201 + Location untuk admin dengan data valid", async () => {
    const r = await api().post(BASE).set(bearer(admin.token)).send(valid());

    expect(r.status).toBe(201);
    expect(r.headers.location).toBe(`${BASE}/${r.body.data.id}`);
    expect(r.body.data).toMatchObject({ harga: 55000, stok: 7, kategori: "kopi", gambar: null });
  });

  it("422 dengan detail per field untuk data tidak valid", async () => {
    const r = await api()
      .post(BASE)
      .set(bearer(admin.token))
      .send({ nama: "K", harga: -1, stok: 1.5, kategori: "mobil" });

    expect(r.status).toBe(422);
    const fields = r.body.error.detail.map((d) => d.field).sort();
    expect(fields).toEqual(["harga", "kategori", "nama", "stok"]);
  });

  it("menolak field asing (mass assignment) dengan 422", async () => {
    const r = await api()
      .post(BASE)
      .set(bearer(admin.token))
      .send({ ...valid(), id: 9999, peran: "admin" });

    expect(r.status).toBe(422);
    const fields = r.body.error.detail.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(["id", "peran"]));
  });

  it("400 untuk JSON rusak", async () => {
    const r = await api()
      .post(BASE)
      .set(bearer(admin.token))
      .set("Content-Type", "application/json")
      .send('{"nama": "Kopi",');

    expect(r.status).toBe(400);
    expect(r.body.error.kode).toBe("JSON_RUSAK");
  });

  it("PATCH mengubah sebagian field dan menolak body kosong", async () => {
    const dibuat = (await api().post(BASE).set(bearer(admin.token)).send(valid())).body.data;

    const ok = await api().patch(`${BASE}/${dibuat.id}`).set(bearer(admin.token)).send({ stok: 99 });
    expect(ok.status).toBe(200);
    expect(ok.body.data).toMatchObject({ stok: 99, nama: dibuat.nama });

    const kosong = await api().patch(`${BASE}/${dibuat.id}`).set(bearer(admin.token)).send({});
    expect(kosong.status).toBe(422);
  });

  it("DELETE -> 204 lalu 404 pada pemanggilan kedua", async () => {
    const dibuat = (await api().post(BASE).set(bearer(admin.token)).send(valid())).body.data;

    const a = await api().delete(`${BASE}/${dibuat.id}`).set(bearer(admin.token));
    const b = await api().delete(`${BASE}/${dibuat.id}`).set(bearer(admin.token));

    expect(a.status).toBe(204);
    expect(b.status).toBe(404);
  });

  it("menghapus produk yang sudah pernah dipesan ditolak 409", async () => {
    // produk 7 (Gula Aren) ada pada pesanan seed? gunakan produk pada pesanan seed pertama
    const r = await api().delete(`${BASE}/1`).set(bearer(admin.token));
    expect(r.status).toBe(409);
  });
});
