import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

import { config } from "../config.js";
import * as repo from "../repositories/produk.repo.js";
import { deteksiGambar } from "../utils/deteksiGambar.js";
import { HttpError, tidakDitemukan, validasiGagal } from "../utils/httpError.js";

// POST /api/v1/produk/:id/gambar   (admin; field multipart "gambar")
//
// TODO (urut):
//  1. id dari req.params harus /^\d+$/ (400 ID_TIDAK_VALID); produk harus ada (404)
//  2. req.file tidak ada -> validasiGagal([{ field: "gambar", pesan: "Berkas gambar wajib diunggah" }])
//  3. jenis = deteksiGambar(req.file.buffer); null -> HttpError(415, "TIPE_BERKAS_TIDAK_DIDUKUNG",
//        "Hanya gambar JPEG, PNG, atau WebP yang diperbolehkan")
//  4. nama berkas BARU dari server: `${randomUUID()}.${jenis.ext}`  (JANGAN pakai req.file.originalname)
//  5. mkdir(config.uploadDir, { recursive: true }); writeFile(path.join(config.uploadDir, nama), buffer)
//  6. repo.setGambar(id, nama) -> produk terbaru; hapus berkas lama (unlink, abaikan galat) bila ada
//  7. res.json({ data: produk })
export async function unggah(req, res) {
  void [randomUUID, mkdir, writeFile, unlink, path, config, repo, deteksiGambar, tidakDitemukan, validasiGagal];
  throw new HttpError(501, "BELUM_DIIMPLEMENTASIKAN", "Unggah gambar belum diimplementasikan");
}
