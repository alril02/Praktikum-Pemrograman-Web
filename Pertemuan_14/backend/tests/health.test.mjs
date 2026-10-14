// Uji endpoint kesehatan.  Jalankan: npm test
import { test, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";

process.env.JWT_SECRET ??= "Zk3pQ9vX2mR7tL5wY8nB4cD6fH1jK0aS2dF4gH6jL8zX";
process.env.DATABASE_URL ??= "file:./dev.db";
process.env.GATEWAY_BASE_URL ??= "http://localhost:4100";
process.env.GATEWAY_API_KEY ??= "k".repeat(20);
process.env.GATEWAY_WEBHOOK_SECRET ??= "s".repeat(20);
process.env.CORS_ORIGINS ??= "http://localhost:5173";

const { buatHealthRouter } = await import("../src/routes/health.routes.js");
const { status } = await import("../src/lib/shutdown.js");

const servers = [];
async function jalankan(opsi) {
  const app = express();
  app.use("/api/v1", buatHealthRouter(opsi));
  const server = await new Promise((r) => {
    const s = http.createServer(app).listen(0, "127.0.0.1", () => r(s));
  });
  servers.push(server);
  return `http://127.0.0.1:${server.address().port}/api/v1`;
}

after(() => {
  for (const s of servers) s.closeAllConnections?.();
  for (const s of servers) s.close();
  status.berhenti = false;
});

test("/kesehatan (liveness) selalu 200 dan tidak memeriksa database", async () => {
  let dipanggil = 0;
  const base = await jalankan({ cekDb: async () => { dipanggil++; throw new Error("DB mati"); } });
  const r = await fetch(`${base}/kesehatan`);
  const j = await r.json();
  assert.equal(r.status, 200);
  assert.equal(j.status, "ok");
  assert.equal(typeof j.uptimeDetik, "number");
  assert.equal(dipanggil, 0, "liveness tidak boleh menyentuh dependensi");
});

test("/siap 200 bila database sehat", async () => {
  const base = await jalankan({ cekDb: async () => {} });
  const r = await fetch(`${base}/siap`);
  const j = await r.json();
  assert.equal(r.status, 200);
  assert.equal(j.status, "siap");
  assert.equal(j.db, "ok");
});

test("/siap 503 bila database gagal, tanpa membocorkan pesan galat", async () => {
  const base = await jalankan({ cekDb: async () => { throw new Error("password authentication failed for user toko_admin"); } });
  const r = await fetch(`${base}/siap`);
  const teks = await r.text();
  assert.equal(r.status, 503);
  assert.match(teks, /tidak_siap/);
  assert.doesNotMatch(teks, /password|toko_admin|authentication/i);
});

test("/siap 503 bila pemeriksaan database melebihi batas waktu", async () => {
  const base = await jalankan({ cekDb: () => new Promise(() => {}) }); // menggantung selamanya
  const t0 = Date.now();
  const r = await fetch(`${base}/siap`);
  assert.equal(r.status, 503);
  assert.ok(Date.now() - t0 < 4000, "harus gagal cepat (batas ~2 detik)");
});

test("/siap 503 setelah shutdown dimulai (draining)", async () => {
  const base = await jalankan({ cekDb: async () => {} });
  status.berhenti = true;
  const r = await fetch(`${base}/siap`);
  const j = await r.json();
  status.berhenti = false;
  assert.equal(r.status, 503);
  assert.equal(j.status, "berhenti");
});
