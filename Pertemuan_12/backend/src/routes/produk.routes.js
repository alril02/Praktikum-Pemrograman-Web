import { Router } from "express";
import * as c from "../controllers/produk.controller.js";
import { unggah } from "../controllers/gambar.controller.js";
import { autentikasi, otorisasi } from "../middleware/auth.js";
import { unggahGambar } from "../middleware/upload.js";

export const produkRouter = Router();

produkRouter.get("/", c.daftar);
produkRouter.get("/:id", c.detail);

const hanyaAdmin = [autentikasi, otorisasi("admin")];
produkRouter.post("/", ...hanyaAdmin, c.buat);
produkRouter.put("/:id", ...hanyaAdmin, c.ganti);
produkRouter.patch("/:id", ...hanyaAdmin, c.ubah);
produkRouter.delete("/:id", ...hanyaAdmin, c.hapus);

// Urutan: autentikasi -> otorisasi -> parser multipart -> controller
// (autentikasi lebih dulu agar penyerang anonim tidak dapat membuat server memproses berkas besar)
produkRouter.post("/:id/gambar", ...hanyaAdmin, unggahGambar, unggah);
