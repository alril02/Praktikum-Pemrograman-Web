import { Router } from "express";
import * as c from "../controllers/pesanan.controller.js";

export const pesananRouter = Router();

pesananRouter.get("/", c.daftar);
pesananRouter.post("/", c.buat);
pesananRouter.get("/:id", c.detail);
