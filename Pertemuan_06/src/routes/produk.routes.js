import { Router } from "express";
import * as c from "../controllers/produk.controller.js";

export const produkRouter = Router();

produkRouter.get("/", c.daftar);
produkRouter.post("/", c.buat);
produkRouter.get("/:id", c.detail);
produkRouter.put("/:id", c.ganti);
produkRouter.patch("/:id", c.ubah);
produkRouter.delete("/:id", c.hapus);
