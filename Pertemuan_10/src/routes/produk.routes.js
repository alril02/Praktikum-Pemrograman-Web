import { Router } from "express";
import * as c from "../controllers/produk.controller.js";
import { autentikasi, otorisasi } from "../middleware/auth.js";

export const produkRouter = Router();

// Publik
produkRouter.get("/", c.daftar);
produkRouter.get("/:id", c.detail);

// TODO: lindungi operasi tulis dengan  autentikasi  lalu  otorisasi("admin")
//   urutan WAJIB: autentikasi -> otorisasi -> controller
produkRouter.post("/", c.buat);
produkRouter.put("/:id", c.ganti);
produkRouter.patch("/:id", c.ubah);
produkRouter.delete("/:id", c.hapus);

void [autentikasi, otorisasi];
