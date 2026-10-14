import { Router } from "express";
import * as c from "../controllers/pesanan.controller.js";
import { bayar } from "../controllers/pembayaran.controller.js";
import { autentikasi } from "../middleware/auth.js";

export const pesananRouter = Router();

pesananRouter.use(autentikasi);

pesananRouter.get("/", c.daftar);
pesananRouter.post("/", c.buat);
pesananRouter.get("/:id", c.detail);
pesananRouter.post("/:id/bayar", bayar);
