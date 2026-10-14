// Contract test: respons API nyata harus cocok dengan skema pada openapi.yaml,
// dan setiap operasi aplikasi harus terdokumentasi.
import { describe, it, expect, beforeAll } from "vitest";
import { api, masuk, bearer, buatProdukUji } from "../helpers/client.js";
import { muatSpec, operasiTerdokumentasi, validasiRespons } from "../helpers/openapi.js";

const spec = muatSpec();

function cocok(path, metode, status, body) {
  const { valid, errors } = validasiRespons(spec, path, metode, status, body);
  expect(valid, `${metode.toUpperCase()} ${path} -> ${status} tidak sesuai skema:\n  ${errors.join("\n  ")}`).toBe(true);
}

// Seluruh operasi yang diimplementasikan aplikasi (jaga daftar ini tetap mutakhir saat menambah endpoint)
const OPERASI_WAJIB = [
  "GET /kesehatan",
  "GET /siap",
  "POST /auth/daftar",
  "POST /auth/masuk",
  "GET /auth/saya",
  "GET /produk",
  "POST /produk",
  "GET /produk/{id}",
  "PUT /produk/{id}",
  "PATCH /produk/{id}",
  "DELETE /produk/{id}",
  "POST /produk/{id}/gambar",
  "GET /pesanan",
  "POST /pesanan",
  "GET /pesanan/{id}",
  "POST /pesanan/{id}/bayar",
  "POST /webhook/gateway",
  "GET /admin/jobs",
];

describe("kelengkapan dokumentasi", () => {
  it("spesifikasi adalah OpenAPI 3.1 dengan info dan security scheme", () => {
    expect(spec.openapi).toMatch(/^3\.1/);
    expect(spec.info?.title).toBeTruthy();
    expect(spec.components?.securitySchemes?.bearerAuth).toMatchObject({ type: "http", scheme: "bearer" });
  });

  it("setiap operasi aplikasi tercantum pada spesifikasi", () => {
    const ada = new Set(operasiTerdokumentasi(spec));
    const hilang = OPERASI_WAJIB.filter((o) => !ada.has(o));
    expect(hilang, `Operasi belum didokumentasikan: ${hilang.join(", ")}`).toEqual([]);
  });

  it("setiap operasi memiliki summary dan minimal satu respons", () => {
    for (const [path, item] of Object.entries(spec.paths)) {
      for (const metode of ["get", "post", "put", "patch", "delete"]) {
        const op = item[metode];
        if (!op) continue;
        expect(op.summary, `${metode.toUpperCase()} ${path} tanpa summary`).toBeTruthy();
        expect(Object.keys(op.responses ?? {}).length, `${metode.toUpperCase()} ${path} tanpa respons`).toBeGreaterThan(0);
      }
    }
  });
});

describe("respons sesuai skema", () => {
  let admin;
  let budi;

  beforeAll(async () => {
    admin = await masuk("admin");
    budi = await masuk("budi");
  });

  it("GET /kesehatan -> 200", async () => {
    const r = await api().get("/api/v1/kesehatan");
    expect(r.status).toBe(200);
    cocok("/kesehatan", "get", 200, r.body);
  });

  it("GET /siap -> 200", async () => {
    const r = await api().get("/api/v1/siap");
    expect(r.status).toBe(200);
    cocok("/siap", "get", 200, r.body);
  });

  it("POST /auth/masuk -> 200 dan 401", async () => {
    const ok = await api().post("/api/v1/auth/masuk").send({ email: "budi@contoh.id", password: "BudiRahasia#2026" });
    expect(ok.status).toBe(200);
    cocok("/auth/masuk", "post", 200, ok.body);

    const salah = await api().post("/api/v1/auth/masuk").send({ email: "budi@contoh.id", password: "salah-salah-salah" });
    expect(salah.status).toBe(401);
    cocok("/auth/masuk", "post", 401, salah.body);
  });

  it("GET /auth/saya -> 200", async () => {
    const r = await api().get("/api/v1/auth/saya").set(bearer(budi.token));
    expect(r.status).toBe(200);
    cocok("/auth/saya", "get", 200, r.body);
  });

  it("GET /produk -> 200 dan 400", async () => {
    const ok = await api().get("/api/v1/produk?batas=5");
    expect(ok.status).toBe(200);
    cocok("/produk", "get", 200, ok.body);

    const salah = await api().get("/api/v1/produk?urut=hash");
    expect(salah.status).toBe(400);
    cocok("/produk", "get", 400, salah.body);
  });

  it("GET /produk/{id} -> 200, 404, 400", async () => {
    const ok = await api().get("/api/v1/produk/2");
    expect(ok.status).toBe(200);
    cocok("/produk/{id}", "get", 200, ok.body);

    const tidak = await api().get("/api/v1/produk/999999");
    expect(tidak.status).toBe(404);
    cocok("/produk/{id}", "get", 404, tidak.body);

    const buruk = await api().get("/api/v1/produk/abc");
    expect(buruk.status).toBe(400);
    cocok("/produk/{id}", "get", 400, buruk.body);
  });

  it("POST /produk -> 201, 401, 403, 422", async () => {
    const baru = { nama: `Kontrak ${Date.now()}`, harga: 1000, stok: 1, kategori: "alat" };

    const ok = await api().post("/api/v1/produk").set(bearer(admin.token)).send(baru);
    expect(ok.status).toBe(201);
    cocok("/produk", "post", 201, ok.body);

    const tanpa = await api().post("/api/v1/produk").send(baru);
    expect(tanpa.status).toBe(401);
    cocok("/produk", "post", 401, tanpa.body);

    const user = await api().post("/api/v1/produk").set(bearer(budi.token)).send(baru);
    expect(user.status).toBe(403);
    cocok("/produk", "post", 403, user.body);

    const buruk = await api().post("/api/v1/produk").set(bearer(admin.token)).send({ nama: "K" });
    expect(buruk.status).toBe(422);
    cocok("/produk", "post", 422, buruk.body);
  });

  it("PATCH dan DELETE /produk/{id}", async () => {
    const p = await buatProdukUji(admin);

    const ubah = await api().patch(`/api/v1/produk/${p.id}`).set(bearer(admin.token)).send({ stok: 3 });
    expect(ubah.status).toBe(200);
    cocok("/produk/{id}", "patch", 200, ubah.body);

    const hapus = await api().delete(`/api/v1/produk/${p.id}`).set(bearer(admin.token));
    expect(hapus.status).toBe(204);
    cocok("/produk/{id}", "delete", 204, null);
  });

  it("POST /pesanan -> 201 dan 409; GET /pesanan -> 200", async () => {
    const p = await buatProdukUji(admin, { stok: 2 });

    const ok = await api().post("/api/v1/pesanan").set(bearer(budi.token)).send({ item: [{ produkId: p.id, jumlah: 1 }] });
    expect(ok.status).toBe(201);
    cocok("/pesanan", "post", 201, ok.body);

    const habis = await api().post("/api/v1/pesanan").set(bearer(budi.token)).send({ item: [{ produkId: p.id, jumlah: 99 }] });
    expect(habis.status).toBe(409);
    cocok("/pesanan", "post", 409, habis.body);

    const daftar = await api().get("/api/v1/pesanan").set(bearer(budi.token));
    expect(daftar.status).toBe(200);
    cocok("/pesanan", "get", 200, daftar.body);

    const detail = await api().get(`/api/v1/pesanan/${ok.body.data.id}`).set(bearer(budi.token));
    expect(detail.status).toBe(200);
    cocok("/pesanan/{id}", "get", 200, detail.body);
  });

  it("GET /admin/jobs -> 200 untuk admin dan 403 untuk user", async () => {
    const ok = await api().get("/api/v1/admin/jobs").set(bearer(admin.token));
    expect(ok.status).toBe(200);
    cocok("/admin/jobs", "get", 200, ok.body);

    const dilarang = await api().get("/api/v1/admin/jobs").set(bearer(budi.token));
    expect(dilarang.status).toBe(403);
    cocok("/admin/jobs", "get", 403, dilarang.body);
  });
});

describe("Swagger UI dan spesifikasi mentah", () => {
  it("GET /api/v1/openapi.json menyajikan spesifikasi", async () => {
    const r = await api().get("/api/v1/openapi.json");
    expect(r.status).toBe(200);
    expect(r.body.openapi).toMatch(/^3\.1/);
  });

  it("GET /api/docs/ menyajikan halaman Swagger UI", async () => {
    const r = await api().get("/api/docs/");
    expect(r.status).toBe(200);
    expect(r.headers["content-type"]).toMatch(/text\/html/);
    expect(r.text).toMatch(/swagger/i);
  });
});
