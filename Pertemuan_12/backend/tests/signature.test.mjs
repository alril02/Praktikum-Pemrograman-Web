// Uji verifikasi tanda tangan webhook (tanpa jaringan).  Jalankan: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { tandatangani, verifikasiTandaTangan } from "../src/utils/signature.js";

const RAHASIA = "whsec_uji_1234567890abcdef";
const BODY = JSON.stringify({ id: "evt_1", type: "charge.paid", data: { amount: 1000 } });
const T = 1_760_000_000;
const SEKARANG = T * 1000;

test("tandatangani menghasilkan format t=...,v1=<64 hex>", () => {
  const h = tandatangani(BODY, RAHASIA, T);
  assert.match(h, /^t=1760000000,v1=[0-9a-f]{64}$/);
});

test("nilai v1 sesuai HMAC-SHA256 dari `${t}.${body}`", () => {
  const harapan = createHmac("sha256", RAHASIA).update(`${T}.${BODY}`).digest("hex");
  assert.equal(tandatangani(BODY, RAHASIA, T), `t=${T},v1=${harapan}`);
});

test("tanda tangan benar diterima (string dan Buffer)", () => {
  const h = tandatangani(BODY, RAHASIA, T);
  assert.equal(verifikasiTandaTangan(BODY, h, RAHASIA, { sekarang: SEKARANG }), true);
  assert.equal(verifikasiTandaTangan(Buffer.from(BODY), h, RAHASIA, { sekarang: SEKARANG }), true);
});

test("body diubah satu karakter ditolak", () => {
  const h = tandatangani(BODY, RAHASIA, T);
  const diubah = BODY.replace("1000", "1001");
  assert.equal(verifikasiTandaTangan(diubah, h, RAHASIA, { sekarang: SEKARANG }), false);
});

test("rahasia salah ditolak", () => {
  const h = tandatangani(BODY, "rahasia-lain-yang-berbeda", T);
  assert.equal(verifikasiTandaTangan(BODY, h, RAHASIA, { sekarang: SEKARANG }), false);
});

test("timestamp terlalu lama (replay) ditolak, dalam toleransi diterima", () => {
  const h = tandatangani(BODY, RAHASIA, T);
  assert.equal(verifikasiTandaTangan(BODY, h, RAHASIA, { sekarang: (T + 301) * 1000 }), false);
  assert.equal(verifikasiTandaTangan(BODY, h, RAHASIA, { sekarang: (T + 299) * 1000 }), true);
});

test("timestamp di masa depan jauh juga ditolak", () => {
  const h = tandatangani(BODY, RAHASIA, T);
  assert.equal(verifikasiTandaTangan(BODY, h, RAHASIA, { sekarang: (T - 3600) * 1000 }), false);
});

test("timestamp dimodifikasi tanpa menghitung ulang HMAC ditolak", () => {
  const h = tandatangani(BODY, RAHASIA, T);
  const palsu = h.replace(`t=${T}`, `t=${T + 10}`);
  assert.equal(verifikasiTandaTangan(BODY, palsu, RAHASIA, { sekarang: SEKARANG }), false);
});

test("header rusak/hilang tidak melempar galat dan mengembalikan false", () => {
  for (const h of ["", "abc", "t=,v1=", "t=abc,v1=zzz", `t=${T}`, `v1=${"0".repeat(64)}`, `t=${T},v1=00`, undefined, null, 42]) {
    assert.equal(verifikasiTandaTangan(BODY, h, RAHASIA, { sekarang: SEKARANG }), false, `header: ${String(h)}`);
  }
});

test("v1 dengan panjang berbeda tidak melempar galat (timingSafeEqual aman)", () => {
  const pendek = `t=${T},v1=${"a".repeat(10)}`;
  const panjang = `t=${T},v1=${"a".repeat(130)}`;
  assert.equal(verifikasiTandaTangan(BODY, pendek, RAHASIA, { sekarang: SEKARANG }), false);
  assert.equal(verifikasiTandaTangan(BODY, panjang, RAHASIA, { sekarang: SEKARANG }), false);
});
