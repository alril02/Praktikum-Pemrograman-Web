// TUGAS: tulis tes untuk modul autentikasi dan RBAC (pertemuan 10).
import { describe, it } from "vitest";
// import { api, KRED, masuk, bearer } from "../helpers/client.js";

describe("POST /auth/masuk", () => {
  it.todo("200 dengan token JWT untuk kredensial benar dan tanpa field passwordHash");
  it.todo("401 dengan kode dan pesan IDENTIK untuk email tak terdaftar vs sandi salah");
  it.todo("422 bila email/password tidak berupa string");
});

describe("POST /auth/daftar", () => {
  it.todo("201 untuk data valid; peran selalu 'user' walau klien mengirim peran 'admin'");
  it.todo("409 untuk email yang sudah terdaftar");
  it.todo("422 untuk kata sandi < 10 karakter atau > 72 byte");
});

describe("token dan otorisasi", () => {
  it.todo("401 untuk token yang diubah satu karakter");
  it.todo("401 untuk token alg=none");
  it.todo("403 bagi peran user pada endpoint admin (/admin/jobs)");
  it.todo("GET /auth/saya mengembalikan pengguna tanpa passwordHash");
});
