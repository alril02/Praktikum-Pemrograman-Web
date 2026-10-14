// KUNCI JAWABAN DOSEN - salin ke src/routes/produk.routes.js
import { Router } from "express";
import * as c from "../controllers/produk.controller.js";
import { autentikasi, otorisasi } from "../middleware/auth.js";

export const produkRouter = Router();

produkRouter.get("/", c.daftar);
produkRouter.get("/:id", c.detail);

const hanyaAdmin = [autentikasi, otorisasi("admin")];
produkRouter.post("/", ...hanyaAdmin, c.buat);
produkRouter.put("/:id", ...hanyaAdmin, c.ganti);
produkRouter.patch("/:id", ...hanyaAdmin, c.ubah);
produkRouter.delete("/:id", ...hanyaAdmin, c.hapus);
