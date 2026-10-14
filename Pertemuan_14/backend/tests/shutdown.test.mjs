// Uji penutupan rapi.  Jalankan: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { tutupDenganRapi, status } from "../src/lib/shutdown.js";

const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));

function mulaiServer(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

test("request yang sedang berjalan diselesaikan, lalu server berhenti", async () => {
  status.berhenti = false;
  const { server, port } = await mulaiServer(async (req, res) => {
    await tunggu(300);
    res.end("selesai");
  });

  const permintaan = fetch(`http://127.0.0.1:${port}/`).then((r) => r.text());
  await tunggu(50); // pastikan request sudah masuk

  const t0 = Date.now();
  const penutupan = tutupDenganRapi(server, { timeoutMs: 3000 });

  assert.equal(await permintaan, "selesai", "request berjalan harus tetap selesai");
  const { paksa } = await penutupan;
  assert.equal(paksa, false);
  assert.ok(Date.now() - t0 < 2000, "tidak boleh menunggu sampai timeout");
  assert.equal(status.berhenti, true, "status.berhenti harus true (readiness -> 503)");
  status.berhenti = false;
});

test("setelah ditutup, koneksi baru ditolak", async () => {
  const { server, port } = await mulaiServer((req, res) => res.end("ok"));
  await tutupDenganRapi(server, { timeoutMs: 1000 });
  await assert.rejects(() => fetch(`http://127.0.0.1:${port}/`));
  status.berhenti = false;
});

test("melewati batas waktu: koneksi dipaksa tutup dan paksa = true", async () => {
  const { server, port } = await mulaiServer((req, res) => {
    /* sengaja menggantung */
  });
  const permintaan = fetch(`http://127.0.0.1:${port}/`).then(
    () => "selesai",
    () => "terputus"
  );
  await tunggu(50);

  const { paksa } = await tutupDenganRapi(server, { timeoutMs: 150 });
  assert.equal(paksa, true);
  assert.equal(await permintaan, "terputus");
  status.berhenti = false;
});

test("koneksi keep-alive yang menganggur tidak menahan penutupan", async () => {
  const { server, port } = await mulaiServer((req, res) => res.end("ok"));
  // fetch memakai keep-alive: koneksi dibiarkan terbuka setelah respons
  assert.equal(await (await fetch(`http://127.0.0.1:${port}/`)).text(), "ok");

  const t0 = Date.now();
  const { paksa } = await tutupDenganRapi(server, { timeoutMs: 5000 });
  assert.equal(paksa, false);
  assert.ok(Date.now() - t0 < 1500, "harus menutup koneksi menganggur, bukan menunggu timeout");
  status.berhenti = false;
});
