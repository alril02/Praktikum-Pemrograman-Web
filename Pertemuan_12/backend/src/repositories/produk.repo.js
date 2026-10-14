import { prisma } from "../lib/prisma.js";

// Bentuk keluaran: { id, nama, harga, stok, kategori, deskripsi, gambar }
// `gambar` berupa URL path relatif ("/uploads/<uuid>.png") atau null.
export function bentukProduk(p) {
  return {
    id: p.id,
    nama: p.nama,
    harga: p.harga,
    stok: p.stok,
    kategori: p.kategori.slug,
    deskripsi: p.deskripsi ?? null,
    gambar: p.gambar ? `/uploads/${p.gambar}` : null,
  };
}

const sertakanKategori = { kategori: { select: { slug: true } } };

export async function daftar({ kategori, q, kolom, arah, halaman, batas }) {
  const where = {
    ...(kategori ? { kategori: { slug: kategori } } : {}),
    ...(q ? { nama: { contains: q } } : {}),
  };
  const orderBy = kolom ? [{ [kolom]: arah }, { id: "asc" }] : [{ id: "asc" }];

  const [baris, total] = await prisma.$transaction([
    prisma.produk.findMany({ where, orderBy, skip: (halaman - 1) * batas, take: batas, include: sertakanKategori }),
    prisma.produk.count({ where }),
  ]);
  return { data: baris.map(bentukProduk), total };
}

// Mengembalikan baris mentah (termasuk nama berkas gambar) untuk keperluan internal
export function cariMentah(id) {
  return prisma.produk.findUnique({ where: { id } });
}

export async function cariId(id) {
  const p = await prisma.produk.findUnique({ where: { id }, include: sertakanKategori });
  return p ? bentukProduk(p) : undefined;
}

function petakanData({ kategori, ...sisa }) {
  return kategori ? { ...sisa, kategori: { connect: { slug: kategori } } } : sisa;
}

export async function tambah(data) {
  const p = await prisma.produk.create({ data: petakanData(data), include: sertakanKategori });
  return bentukProduk(p);
}

export async function ganti(id, data) {
  const p = await prisma.produk.update({ where: { id }, data: petakanData(data), include: sertakanKategori });
  return bentukProduk(p);
}

export async function ubah(id, data) {
  const p = await prisma.produk.update({ where: { id }, data: petakanData(data), include: sertakanKategori });
  return bentukProduk(p);
}

// Menetapkan nama berkas gambar; mengembalikan { produk, gambarLama }
export async function setGambar(id, namaBerkas) {
  const lama = await prisma.produk.findUnique({ where: { id }, select: { gambar: true } });
  const p = await prisma.produk.update({
    where: { id },
    data: { gambar: namaBerkas },
    include: sertakanKategori,
  });
  return { produk: bentukProduk(p), gambarLama: lama?.gambar ?? null };
}

export async function hapus(id) {
  try {
    await prisma.produk.delete({ where: { id } });
    return true;
  } catch (e) {
    if (e?.code === "P2025") return false;
    throw e;
  }
}
