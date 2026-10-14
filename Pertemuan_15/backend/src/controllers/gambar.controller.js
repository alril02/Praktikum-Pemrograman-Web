// KUNCI JAWABAN DOSEN - salin ke src/controllers/gambar.controller.js
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

import { config } from "../config.js";
import * as repo from "../repositories/produk.repo.js";
import { deteksiGambar } from "../utils/deteksiGambar.js";
import { HttpError, tidakDitemukan, validasiGagal } from "../utils/httpError.js";

export async function unggah(req, res) {
  if (!/^\d+$/.test(req.params.id)) {
    throw new HttpError(400, "ID_TIDAK_VALID", "ID harus berupa bilangan bulat positif");
  }
  const id = Number(req.params.id);
  if (!(await repo.cariId(id))) throw tidakDitemukan("Produk tidak ditemukan");

  if (!req.file) {
    throw validasiGagal([{ field: "gambar", pesan: "Berkas gambar wajib diunggah" }]);
  }

  const jenis = deteksiGambar(req.file.buffer);
  if (!jenis) {
    throw new HttpError(415, "TIPE_BERKAS_TIDAK_DIDUKUNG", "Hanya gambar JPEG, PNG, atau WebP yang diperbolehkan", [
      { field: "gambar", pesan: "Isi berkas bukan gambar JPEG, PNG, atau WebP" },
    ]);
  }

  const nama = `${randomUUID()}.${jenis.ext}`; // nama dari server; nama asli klien tidak dipakai
  await mkdir(config.uploadDir, { recursive: true });
  await writeFile(path.join(config.uploadDir, nama), req.file.buffer);

  const { produk, gambarLama } = await repo.setGambar(id, nama);
  if (gambarLama) {
    await unlink(path.join(config.uploadDir, path.basename(gambarLama))).catch(() => {});
  }

  res.json({ data: produk });
}
