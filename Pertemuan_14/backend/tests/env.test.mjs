// Uji validasi konfigurasi.  Jalankan: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { periksaEnv } from "../src/lib/env.js";

const baik = {
  NODE_ENV: "development",
  JWT_SECRET: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
  DATABASE_URL: "file:./dev.db",
  GATEWAY_BASE_URL: "http://localhost:4100",
  GATEWAY_API_KEY: "sk_test_praktikum_12345",
  GATEWAY_WEBHOOK_SECRET: "whsec_praktikum_67890abcdef",
  CORS_ORIGINS: "http://localhost:5173",
};

const produksiBaik = {
  ...baik,
  NODE_ENV: "production",
  JWT_SECRET: "Zk3pQ9vX2mR7tL5wY8nB4cD6fH1jK0aS2dF4gH6jL8zX",
  DATABASE_URL: "postgresql://u:p@db.contoh.id:5432/toko?schema=public",
  GATEWAY_BASE_URL: "https://api.gateway.contoh.id",
  CORS_ORIGINS: "https://toko.contoh.id",
  TRUST_PROXY: "1",
  BCRYPT_COST: "12",
};

const punyaMasalah = (r, kata) => r.masalah.some((m) => m.includes(kata));

test("konfigurasi pengembangan yang valid", () => {
  const r = periksaEnv(baik);
  assert.equal(r.ok, true, r.masalah.join("; "));
  assert.deepEqual(r.masalah, []);
});

test("JWT_SECRET hilang atau pendek -> masalah", () => {
  const a = periksaEnv({ ...baik, JWT_SECRET: undefined });
  const b = periksaEnv({ ...baik, JWT_SECRET: "pendek" });
  assert.equal(a.ok, false);
  assert.ok(punyaMasalah(a, "JWT_SECRET"));
  assert.equal(b.ok, false);
  assert.ok(punyaMasalah(b, "JWT_SECRET"));
});

test("variabel wajib lain yang hilang disebut namanya", () => {
  for (const kunci of ["DATABASE_URL", "GATEWAY_BASE_URL", "GATEWAY_API_KEY", "GATEWAY_WEBHOOK_SECRET", "CORS_ORIGINS"]) {
    const r = periksaEnv({ ...baik, [kunci]: "" });
    assert.equal(r.ok, false, `${kunci} kosong harus gagal`);
    assert.ok(punyaMasalah(r, kunci), `pesan harus menyebut ${kunci}`);
  }
});

test("GATEWAY_BASE_URL harus URL http(s)", () => {
  const r = periksaEnv({ ...baik, GATEWAY_BASE_URL: "bukan-url" });
  assert.equal(r.ok, false);
  assert.ok(punyaMasalah(r, "GATEWAY_BASE_URL"));
});

test("GATEWAY_API_KEY dan GATEWAY_WEBHOOK_SECRET minimal 16 karakter", () => {
  assert.equal(periksaEnv({ ...baik, GATEWAY_API_KEY: "pendek" }).ok, false);
  assert.equal(periksaEnv({ ...baik, GATEWAY_WEBHOOK_SECRET: "pendek" }).ok, false);
});

test("produksi: konfigurasi yang benar lolos", () => {
  const r = periksaEnv(produksiBaik);
  assert.equal(r.ok, true, r.masalah.join("; "));
});

test("produksi: SQLite (file:) ditolak", () => {
  const r = periksaEnv({ ...produksiBaik, DATABASE_URL: "file:./dev.db" });
  assert.equal(r.ok, false);
  assert.ok(punyaMasalah(r, "DATABASE_URL"));
});

test("produksi: gateway harus https", () => {
  const r = periksaEnv({ ...produksiBaik, GATEWAY_BASE_URL: "http://gateway.contoh.id" });
  assert.equal(r.ok, false);
  assert.ok(punyaMasalah(r, "GATEWAY_BASE_URL"));
});

test("produksi: CORS tidak boleh wildcard atau localhost", () => {
  for (const nilai of ["*", "http://localhost:5173", "https://toko.contoh.id,http://127.0.0.1:5173"]) {
    const r = periksaEnv({ ...produksiBaik, CORS_ORIGINS: nilai });
    assert.equal(r.ok, false, nilai);
    assert.ok(punyaMasalah(r, "CORS_ORIGINS"));
  }
});

test("produksi: TRUST_PROXY wajib bilangan bulat >= 1", () => {
  for (const nilai of [undefined, "0", "abc", "-1"]) {
    const r = periksaEnv({ ...produksiBaik, TRUST_PROXY: nilai });
    assert.equal(r.ok, false, String(nilai));
    assert.ok(punyaMasalah(r, "TRUST_PROXY"));
  }
});

test("produksi: JWT_SECRET placeholder atau satu karakter berulang ditolak", () => {
  for (const nilai of ["ganti-dengan-rahasia-acak-minimal-32-karakter-ya", "a".repeat(48), "changeme".repeat(6)]) {
    const r = periksaEnv({ ...produksiBaik, JWT_SECRET: nilai });
    assert.equal(r.ok, false, nilai);
    assert.ok(punyaMasalah(r, "JWT_SECRET"));
  }
});

test("produksi: BCRYPT_COST terlalu rendah ditolak", () => {
  const r = periksaEnv({ ...produksiBaik, BCRYPT_COST: "4" });
  assert.equal(r.ok, false);
  assert.ok(punyaMasalah(r, "BCRYPT_COST"));
});

test("produksi: LOGIN_MAX sangat tinggi hanya peringatan", () => {
  const r = periksaEnv({ ...produksiBaik, LOGIN_MAX: "500" });
  assert.equal(r.ok, true);
  assert.ok(r.peringatan.some((p) => p.includes("LOGIN_MAX")));
});

test("aturan produksi TIDAK berlaku pada development", () => {
  const r = periksaEnv({ ...baik, TRUST_PROXY: undefined });
  assert.equal(r.ok, true);
});
