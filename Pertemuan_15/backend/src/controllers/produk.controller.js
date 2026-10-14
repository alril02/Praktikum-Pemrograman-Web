// KUNCI JAWABAN DOSEN - salin ke src/controllers/produk.controller.js
import * as repo from "../repositories/produk.repo.js";
import { HttpError, tidakDitemukan, validasiGagal } from "../utils/httpError.js";
import { skemaBuat, skemaUbah, parse } from "../validation/produk.schema.js";
import { ambilAtauHitung } from "../lib/cache.js";
import { config } from "../config.js";

const KOLOM_URUT = new Set(["nama", "harga"]);

function ambilId(req) {
  if (!/^\d+$/.test(req.params.id)) {
    throw new HttpError(400, "ID_TIDAK_VALID", "ID harus berupa bilangan bulat positif");
  }
  return Number(req.params.id);
}

export async function daftar(req, res) {
  const { kategori, q, urut } = req.query;

  let kolom = null;
  let arah = "asc";
  if (typeof urut === "string" && urut) {
    arah = urut.startsWith("-") ? "desc" : "asc";
    kolom = urut.replace(/^-/, "");
    if (!KOLOM_URUT.has(kolom)) {
      throw new HttpError(400, "URUT_TIDAK_VALID", `urut harus salah satu dari: ${[...KOLOM_URUT].join(", ")}`);
    }
  }

  const halaman = Math.max(1, Number.parseInt(req.query.halaman, 10) || 1);
  const batas = Math.min(100, Math.max(1, Number.parseInt(req.query.batas, 10) || 10));
  const param = {
    kategori: typeof kategori === "string" && kategori ? kategori : undefined,
    q: typeof q === "string" && q.trim() ? q.trim() : undefined,
    kolom,
    arah,
    halaman,
    batas,
  };

  const kunci = `produk:${JSON.stringify(param)}`;
  const { nilai, hit } = await ambilAtauHitung(kunci, async () => {
    const { data, total } = await repo.daftar(param);
    return { data, meta: { halaman, batas, total, totalHalaman: Math.max(1, Math.ceil(total / batas)) } };
  }, config.cacheTtlMs);

  res.set("X-Cache", hit ? "HIT" : "MISS");
  res.set("Cache-Control", "public, max-age=15");
  res.json(nilai);
}

export async function detail(req, res) {
  const item = await repo.cariId(ambilId(req));
  if (!item) throw tidakDitemukan("Produk tidak ditemukan");
  res.json({ data: item });
}

export async function buat(req, res) {
  const { data, detail } = parse(skemaBuat, req.body);
  if (detail) throw validasiGagal(detail);
  const baru = await repo.tambah(data);
  res.status(201).location(`/api/v1/produk/${baru.id}`).json({ data: baru });
}

export async function ganti(req, res) {
  const id = ambilId(req);
  if (!(await repo.cariId(id))) throw tidakDitemukan("Produk tidak ditemukan");
  const { data, detail } = parse(skemaBuat, req.body);
  if (detail) throw validasiGagal(detail);
  res.json({ data: await repo.ganti(id, data) });
}

export async function ubah(req, res) {
  const id = ambilId(req);
  if (!(await repo.cariId(id))) throw tidakDitemukan("Produk tidak ditemukan");
  const { data, detail } = parse(skemaUbah, req.body);
  if (detail) throw validasiGagal(detail);
  if (Object.keys(data).length === 0) {
    throw validasiGagal([{ field: "_body", pesan: "Sertakan minimal satu field yang diubah" }]);
  }
  res.json({ data: await repo.ubah(id, data) });
}

export async function hapus(req, res) {
  const id = ambilId(req);
  const berhasil = await repo.hapus(id);
  if (!berhasil) throw tidakDitemukan("Produk tidak ditemukan");
  res.status(204).end();
}
