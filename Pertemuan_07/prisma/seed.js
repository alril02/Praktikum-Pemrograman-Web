// Seeder idempoten: aman dijalankan berulang.
// Jalankan:  npm run db:seed   (otomatis juga oleh `prisma migrate reset`)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const KATEGORI = [
  { slug: "kopi", nama: "Kopi" },
  { slug: "teh", nama: "Teh" },
  { slug: "gula", nama: "Gula" },
  { slug: "alat", nama: "Alat" },
];

// URUTAN penting: id produk mengikuti urutan pembuatan pada database baru (1..10).
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
  { nama: "Budi Santoso", email: "budi@contoh.id" },
  { nama: "Sari Wulandari", email: "sari@contoh.id" },
];

async function main() {
  // Kategori
  const kategoriId = {};
  for (const k of KATEGORI) {
    const row = await prisma.kategori.upsert({ where: { slug: k.slug }, update: {}, create: k });
    kategoriId[k.slug] = row.id;
  }

  // Produk (urut, buat bila belum ada berdasarkan nama)
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

  // Pengguna
  const penggunaId = {};
  for (const u of PENGGUNA) {
    const row = await prisma.pengguna.upsert({ where: { email: u.email }, update: {}, create: u });
    penggunaId[u.email] = row.id;
  }

  // Pesanan contoh (hanya bila belum ada pesanan sama sekali)
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

  const ringkas = {
    kategori: await prisma.kategori.count(),
    produk: await prisma.produk.count(),
    pengguna: await prisma.pengguna.count(),
    pesanan: await prisma.pesanan.count(),
  };
  console.log("Seed selesai:", ringkas);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
