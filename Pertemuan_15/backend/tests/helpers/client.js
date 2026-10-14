import request from "supertest";
import { app } from "../../src/app.js";

export const api = () => request(app);

// Kredensial seed (prisma/seed.js)
export const KRED = {
  admin: { email: "admin@contoh.id", password: "AdminRahasia#2026" },
  budi: { email: "budi@contoh.id", password: "BudiRahasia#2026" },
  sari: { email: "sari@contoh.id", password: "SariRahasia#2026" },
};

const cacheToken = new Map();

// Mengembalikan { token, pengguna }; di-cache agar tidak login berulang
export async function masuk(nama) {
  if (cacheToken.has(nama)) return cacheToken.get(nama);
  const r = await api().post("/api/v1/auth/masuk").send(KRED[nama]);
  if (r.status !== 200) throw new Error(`Login ${nama} gagal: ${r.status} ${JSON.stringify(r.body)}`);
  const hasil = { token: r.body.data.token, pengguna: r.body.data.pengguna };
  cacheToken.set(nama, hasil);
  return hasil;
}

export const bearer = (token) => ({ Authorization: `Bearer ${token}` });

// Produk dengan stok besar dibuat per tes agar tidak bergantung data seed bersama
export async function buatProdukUji(admin, sebagian = {}) {
  const r = await api()
    .post("/api/v1/produk")
    .set(bearer(admin.token))
    .send({ nama: `Produk Uji ${Math.random().toString(36).slice(2, 8)}`, harga: 10000, stok: 50, kategori: "alat", ...sebagian });
  if (r.status !== 201) throw new Error(`buatProdukUji gagal: ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.data;
}
