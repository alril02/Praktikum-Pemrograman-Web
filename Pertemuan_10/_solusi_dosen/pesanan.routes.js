// KUNCI JAWABAN DOSEN - salin ke src/routes/pesanan.routes.js
import { Router } from "express";
import * as c from "../controllers/pesanan.controller.js";
import { autentikasi } from "../middleware/auth.js";

export const pesananRouter = Router();

pesananRouter.use(autentikasi);

pesananRouter.get("/", c.daftar);
pesananRouter.post("/", c.buat);
pesananRouter.get("/:id", c.detail);
