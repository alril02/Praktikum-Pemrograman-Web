// Uji state machine pesanan.  Jalankan: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { bolehTransisi, statusDariEvent, putuskanTransisi, STATUS } from "../src/domain/pesanan.status.js";

test("transisi yang sah", () => {
  assert.equal(bolehTransisi("menunggu_pembayaran", "dibayar"), true);
  assert.equal(bolehTransisi("menunggu_pembayaran", "kedaluwarsa"), true);
  assert.equal(bolehTransisi("menunggu_pembayaran", "gagal"), true);
  assert.equal(bolehTransisi("dibayar", "dikirim"), true);
  assert.equal(bolehTransisi("dikirim", "selesai"), true);
});

test("transisi yang tidak sah", () => {
  assert.equal(bolehTransisi("kedaluwarsa", "dibayar"), false);
  assert.equal(bolehTransisi("gagal", "dibayar"), false);
  assert.equal(bolehTransisi("dibayar", "menunggu_pembayaran"), false);
  assert.equal(bolehTransisi("selesai", "dikirim"), false);
  assert.equal(bolehTransisi("menunggu_pembayaran", "selesai"), false);
});

test("status tak dikenal -> false (tidak melempar galat)", () => {
  assert.equal(bolehTransisi("entah", "dibayar"), false);
  assert.equal(bolehTransisi("dibayar", "entah"), false);
  assert.equal(bolehTransisi(undefined, "dibayar"), false);
});

test("pemetaan jenis peristiwa -> status", () => {
  assert.equal(statusDariEvent("charge.paid"), "dibayar");
  assert.equal(statusDariEvent("charge.expired"), "kedaluwarsa");
  assert.equal(statusDariEvent("charge.failed"), "gagal");
  assert.equal(statusDariEvent("charge.refunded"), null);
  assert.equal(statusDariEvent(""), null);
});

test("putuskanTransisi: terapkan", () => {
  assert.equal(putuskanTransisi(STATUS.MENUNGGU, STATUS.DIBAYAR), "terapkan");
  assert.equal(putuskanTransisi(STATUS.MENUNGGU, STATUS.KEDALUWARSA), "terapkan");
});

test("putuskanTransisi: duplikat/sudah tercapai -> abaikan (idempoten)", () => {
  assert.equal(putuskanTransisi(STATUS.DIBAYAR, STATUS.DIBAYAR), "abaikan");
  assert.equal(putuskanTransisi(STATUS.KEDALUWARSA, STATUS.KEDALUWARSA), "abaikan");
});

test("putuskanTransisi: peristiwa tak dikenal -> abaikan", () => {
  assert.equal(putuskanTransisi(STATUS.MENUNGGU, null), "abaikan");
});

test("putuskanTransisi: paid setelah kedaluwarsa -> rekonsiliasi", () => {
  assert.equal(putuskanTransisi(STATUS.KEDALUWARSA, STATUS.DIBAYAR), "rekonsiliasi");
  assert.equal(putuskanTransisi(STATUS.GAGAL, STATUS.DIBAYAR), "rekonsiliasi");
  assert.equal(putuskanTransisi(STATUS.DIBAYAR, STATUS.KEDALUWARSA), "rekonsiliasi");
});
