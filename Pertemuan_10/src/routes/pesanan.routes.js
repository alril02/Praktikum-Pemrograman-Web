import { Router } from "express";
import * as c from "../controllers/pesanan.controller.js";
import { autentikasi } from "../middleware/auth.js";

export const pesananRouter = Router();

// TODO: seluruh rute pesanan membutuhkan autentikasi. Pasang sekali dengan
//   pesananRouter.use(autentikasi);  sebelum definisi rute di bawah.
void autentikasi;

pesananRouter.get("/", c.daftar);
pesananRouter.post("/", c.buat);
pesananRouter.get("/:id", c.detail);
