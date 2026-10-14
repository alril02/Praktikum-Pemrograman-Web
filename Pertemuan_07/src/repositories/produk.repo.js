// Repositori produk: SATU-SATUNYA tempat yang berbicara dengan Prisma untuk entitas ini.
import { prisma } from "../lib/prisma.js";

// Bentuk keluaran sama dengan pertemuan 6: { id, nama, harga, stok, kategori: "kopi" }
export function bentukProduk(p) {
  return {
    id: p.id,
    nama: p.nama,
    harga: p.harga,
    stok: p.stok,
    kategori: p.kategori.slug,
    // TODO (Migrasi #2): sertakan  deskripsi: p.deskripsi ?? null
  };
}

const sertakanKategori = { kategori: { select: { slug: true } } };

// TODO 1: ambil daftar produk + total.
//   Parameter: { kategori?, q?, kolom?, arah, halaman, batas }
//   - where: kategori.slug === kategori (bila ada); nama contains q (bila ada)
//   - orderBy: [{ [kolom]: arah }, { id: "asc" }]  (tie-breaker id agar halaman stabil);
//              bila kolom kosong cukup [{ id: "asc" }]
//   - skip = (halaman - 1) * batas, take = batas
//   - jalankan findMany dan count dengan where yang SAMA di dalam prisma.$transaction([...])
//   - kembalikan { data: baris.map(bentukProduk), total }
export async function daftar({ kategori, q, kolom, arah, halaman, batas }) {
  const baris = await prisma.produk.findMany({ include: sertakanKategori, orderBy: { id: "asc" } });
  return { data: baris.map(bentukProduk), total: baris.length };
}

// TODO 2: findUnique + include kategori; kembalikan bentukProduk atau undefined bila tidak ada
export async function cariId(id) {
  return undefined;
}

// TODO 3: create dengan kategori: { connect: { slug: data.kategori } }; sertakan kategori pada hasil
export async function tambah(data) {
  throw new Error("Belum diimplementasikan: tambah");
}

// TODO 4: update seluruh field (nama, harga, stok, kategori via connect); kembalikan bentukProduk
export async function ganti(id, data) {
  throw new Error("Belum diimplementasikan: ganti");
}

// TODO 5: update sebagian. Hanya sertakan field yang ada di `data`.
//   Bila data.kategori ada ubah menjadi { kategori: { connect: { slug } } } dan hapus properti `kategori` mentah.
export async function ubah(id, data) {
  throw new Error("Belum diimplementasikan: ubah");
}

// TODO 6: delete; kembalikan true bila terhapus, false bila tidak ditemukan (kode P2025).
//   Biarkan galat lain (mis. P2003 produk masih dipesan) merambat ke errorHandler.
export async function hapus(id) {
  throw new Error("Belum diimplementasikan: hapus");
}
