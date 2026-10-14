// Seeder idempoten. Akun demo (HANYA untuk lokal/pelatihan, jangan dipakai di produksi):
//   admin@contoh.id / AdminRahasia#2026   (peran: admin)
//   budi@contoh.id  / BudiRahasia#2026    (peran: user)
//   sari@contoh.id  / SariRahasia#2026    (peran: user)
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const COST = Number(process.env.BCRYPT_COST) || 12;

const KATEGORI = [
  { slug: "kopi", nama: "Kopi" },
  { slug: "teh", nama: "Teh" },
  { slug: "gula", nama: "Gula" },
  { slug: "alat", nama: "Alat" },
];

const PRODUK = [
  { nama: "Kopi Gayo 250g",     harga: 65000,  stok: 12, kategori: "kopi" },
  { nama: "Kopi Toraja 250g",   harga: 72000,  stok: 0,  kategori: "kopi" },
  { nama: "Kopi Flores Bajawa", harga: 68000,  stok: 9,  kategori: "kopi" },
  { nama: "Teh Melati 100g",    harga: 30000,  stok: 25, kategori: "teh" },
  { nama: "Teh Hijau 100g",     harga: 28000,  stok: 8,  kategori: "teh" },
  { nama: "Teh Hitam Premium",  harga: 35000,  stok: 14, kategori: "teh" },
  { nama: "Gula Aren 500g",     harga: 22000,  stok: 40, kategori: "gula" },
  { nama: "Gula Kelapa Cair",   harga: 26000,  stok: 18, kategori: "gula" },
  { nama: "Cangkir Keramik",    harga: 45000,  stok: 5,  kategori: "alat" },
  { nama: "French Press 350ml", harga: 120000, stok: 3,  kategori: "alat" },
];

const PENGGUNA = [
  { nama: "Administrator",  email: "admin@contoh.id", sandi: "AdminRahasia#2026", peran: "admin" },
  { nama: "Budi Santoso",   email: "budi@contoh.id",  sandi: "BudiRahasia#2026",  peran: "user" },
  { nama: "Sari Wulandari", email: "sari@contoh.id",  sandi: "SariRahasia#2026",  peran: "user" },
];

async function main() {
  const kategoriId = {};
  for (const k of KATEGORI) {
    const row = await prisma.kategori.upsert({ where: { slug: k.slug }, update: {}, create: k });
    kategoriId[k.slug] = row.id;
  }

  const produkId = {};
  for (const p of PRODUK) {
    let row = await prisma.produk.findFirst({ where: { nama: p.nama } });
    if (!row) {
      row = await prisma.produk.create({
        data: { nama: p.nama, harga: p.harga, stok: p.stok, kategoriId: kategoriId[p.kategori] },
      });
    }
    produkId[p.nama] = row.id;
  }

  // Pengguna: pastikan hash dan peran terisi (juga untuk baris lama dari pertemuan 7)
  const penggunaId = {};
  for (const u of PENGGUNA) {
    const passwordHash = await bcrypt.hash(u.sandi, COST);
    const row = await prisma.pengguna.upsert({
      where: { email: u.email },
      update: { passwordHash, peran: u.peran, nama: u.nama },
      create: { nama: u.nama, email: u.email, passwordHash, peran: u.peran },
    });
    penggunaId[u.email] = row.id;
  }

  if ((await prisma.pesanan.count()) === 0) {
    const buat = async (email, status, baris) => {
      const item = baris.map(([nama, jumlah]) => {
        const p = PRODUK.find((x) => x.nama === nama);
        return { produkId: produkId[nama], jumlah, hargaSatuan: p.harga };
      });
      const total = item.reduce((t, i) => t + i.jumlah * i.hargaSatuan, 0);
      await prisma.pesanan.create({
        data: { penggunaId: penggunaId[email], status, total, item: { create: item } },
      });
    };
    await buat("budi@contoh.id", "dibayar", [["Kopi Gayo 250g", 2], ["Gula Aren 500g", 1]]);
    await buat("sari@contoh.id", "menunggu_pembayaran", [["Teh Melati 100g", 3]]);
    await buat("budi@contoh.id", "dikirim", [["French Press 350ml", 1]]);
  }

  console.log("Seed selesai:", {
    kategori: await prisma.kategori.count(),
    produk: await prisma.produk.count(),
    pengguna: await prisma.pengguna.count(),
    pesanan: await prisma.pesanan.count(),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
