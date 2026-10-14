// KUNCI JAWABAN DOSEN - salin ke tests/api/auth.test.js
import { describe, it, expect, beforeAll } from "vitest";
import { createHmac } from "node:crypto";
import { api, KRED, masuk, bearer } from "../helpers/client.js";

const b64url = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");

describe("POST /auth/masuk", () => {
  it("200 dengan token JWT untuk kredensial benar dan tanpa passwordHash", async () => {
    const r = await api().post("/api/v1/auth/masuk").send(KRED.budi);

    expect(r.status).toBe(200);
    expect(r.body.data.token.split(".")).toHaveLength(3);
    expect(JSON.stringify(r.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
  });

  it("401 dengan kode dan pesan IDENTIK untuk email tak terdaftar vs sandi salah", async () => {
    const a = await api().post("/api/v1/auth/masuk").send({ email: "tidak.ada@contoh.id", password: "SembarangSandi123!" });
    const b = await api().post("/api/v1/auth/masuk").send({ email: KRED.budi.email, password: "SandiSalahSekali!!" });

    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.error).toEqual(b.body.error);
  });

  it("422 bila email/password bukan string", async () => {
    const r = await api().post("/api/v1/auth/masuk").send({ email: 123, password: {} });
    expect(r.status).toBe(422);
  });
});

describe("POST /auth/daftar", () => {
  const baru = () => ({ nama: "Penguji", email: `uji.${Date.now()}.${Math.random().toString(36).slice(2, 6)}@contoh.id`, password: "KataSandiPanjang#1" });

  it("201; peran selalu 'user' walau klien mengirim 'admin'", async () => {
    const r = await api().post("/api/v1/auth/daftar").send({ ...baru(), peran: "admin" });

    expect(r.status).toBe(201);
    expect(r.body.data.peran).toBe("user");
    expect(r.body.data).not.toHaveProperty("passwordHash");
  });

  it("409 untuk email yang sudah terdaftar", async () => {
    const data = baru();
    await api().post("/api/v1/auth/daftar").send(data);
    const r = await api().post("/api/v1/auth/daftar").send(data);
    expect(r.status).toBe(409);
  });

  it("422 untuk kata sandi < 10 karakter atau > 72 byte", async () => {
    const pendek = await api().post("/api/v1/auth/daftar").send({ ...baru(), password: "pendek" });
    const panjang = await api().post("/api/v1/auth/daftar").send({ ...baru(), password: "x".repeat(80) });

    for (const r of [pendek, panjang]) {
      expect(r.status).toBe(422);
      expect(r.body.error.detail.some((d) => d.field === "password")).toBe(true);
    }
  });
});

describe("token dan otorisasi", () => {
  let budi;
  beforeAll(async () => {
    budi = await masuk("budi");
  });

  it("401 untuk token yang diubah satu karakter", async () => {
    const t = budi.token;
    const rusak = t.slice(0, -2) + (t.at(-2) === "A" ? "B" : "A") + t.at(-1);
    const r = await api().get("/api/v1/auth/saya").set(bearer(rusak));
    expect(r.status).toBe(401);
  });

  it("401 untuk token alg=none", async () => {
    const jahat = `${b64url({ alg: "none", typ: "JWT" })}.${b64url({ sub: "1", peran: "admin", iss: "toko-api", aud: "toko-web", exp: Math.floor(Date.now() / 1000) + 600 })}.`;
    const r = await api().get("/api/v1/admin/jobs").set(bearer(jahat));
    expect(r.status).toBe(401);
  });

  it("401 untuk token ditandatangani rahasia lain", async () => {
    const h = b64url({ alg: "HS256", typ: "JWT" });
    const p = b64url({ sub: "1", peran: "admin", iss: "toko-api", aud: "toko-web", exp: Math.floor(Date.now() / 1000) + 600 });
    const sig = createHmac("sha256", "rahasia-penyerang").update(`${h}.${p}`).digest("base64url");
    const r = await api().get("/api/v1/auth/saya").set(bearer(`${h}.${p}.${sig}`));
    expect(r.status).toBe(401);
  });

  it("403 bagi peran user pada endpoint admin", async () => {
    const r = await api().get("/api/v1/admin/jobs").set(bearer(budi.token));
    expect(r.status).toBe(403);
  });

  it("GET /auth/saya mengembalikan pengguna tanpa passwordHash", async () => {
    const r = await api().get("/api/v1/auth/saya").set(bearer(budi.token));
    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({ email: KRED.budi.email, peran: "user" });
    expect(r.body.data).not.toHaveProperty("passwordHash");
  });
});
