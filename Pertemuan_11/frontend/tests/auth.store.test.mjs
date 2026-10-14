// Uji store sesi dengan fetch palsu.  Jalankan: npm test
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createPinia, setActivePinia } from "pinia";
import { pasangAuth, ApiError } from "../src/api.js";
import { useAuthStore } from "../src/stores/auth.js";

let panggilan;
let balasan;

beforeEach(() => {
  panggilan = [];
  balasan = null;
  globalThis.fetch = async (url, opsi) => {
    panggilan.push({ url: String(url), opsi });
    return balasan();
  };
  pasangAuth({ token: () => null, onTidakSah: () => {} });
  setActivePinia(createPinia());
});

const ok = (data) => () => new Response(JSON.stringify({ data }), { status: 200, headers: { "Content-Type": "application/json" } });
const gagal = (status, error) => () => new Response(JSON.stringify({ error }), { status, headers: { "Content-Type": "application/json" } });

test("awal: belum masuk dan bukan admin", () => {
  const a = useAuthStore();
  assert.equal(a.token, null);
  assert.equal(a.masuk, false);
  assert.equal(a.adalahAdmin, false);
});

test("login sukses mengisi token dan pengguna (admin)", async () => {
  balasan = ok({ token: "JWT.ABC.DEF", pengguna: { id: 1, nama: "Admin", email: "admin@contoh.id", peran: "admin" } });
  const a = useAuthStore();
  await a.login("admin@contoh.id", "AdminRahasia#2026");

  assert.equal(a.token, "JWT.ABC.DEF");
  assert.equal(a.masuk, true);
  assert.equal(a.adalahAdmin, true);
  assert.equal(a.pengguna.email, "admin@contoh.id");
});

test("login mengirim POST /auth/masuk dengan JSON dan tanpa Authorization", async () => {
  balasan = ok({ token: "T", pengguna: { id: 2, nama: "Budi", email: "budi@contoh.id", peran: "user" } });
  pasangAuth({ token: () => "TOKEN-LAMA", onTidakSah: () => {} });
  await useAuthStore().login("budi@contoh.id", "rahasia-panjang");

  const { url, opsi } = panggilan[0];
  assert.ok(url.endsWith("/auth/masuk"));
  assert.equal(opsi.method, "POST");
  assert.equal(opsi.headers.Authorization, undefined);
  assert.deepEqual(JSON.parse(opsi.body), { email: "budi@contoh.id", password: "rahasia-panjang" });
});

test("pengguna biasa: masuk=true tetapi adalahAdmin=false", async () => {
  balasan = ok({ token: "T", pengguna: { id: 2, nama: "Budi", email: "budi@contoh.id", peran: "user" } });
  const a = useAuthStore();
  await a.login("budi@contoh.id", "rahasia-panjang");
  assert.equal(a.masuk, true);
  assert.equal(a.adalahAdmin, false);
});

test("login gagal (401): melempar ApiError dan state tetap kosong", async () => {
  balasan = gagal(401, { kode: "KREDENSIAL_SALAH", pesan: "Email atau kata sandi salah" });
  const a = useAuthStore();
  await assert.rejects(() => a.login("x@y.z", "salah"), (e) => e instanceof ApiError && e.status === 401);
  assert.equal(a.token, null);
  assert.equal(a.masuk, false);
});

test("logout mengosongkan sesi", async () => {
  balasan = ok({ token: "T", pengguna: { id: 1, nama: "A", email: "a@b.c", peran: "admin" } });
  const a = useAuthStore();
  await a.login("a@b.c", "rahasia-panjang");
  a.logout();
  assert.equal(a.token, null);
  assert.equal(a.pengguna, null);
  assert.equal(a.masuk, false);
  assert.equal(a.adalahAdmin, false);
});
