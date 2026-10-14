import { Router } from "express";
import * as c from "../controllers/auth.controller.js";
import { autentikasi } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/daftar", c.daftar);
authRouter.post("/masuk", c.masuk);
authRouter.get("/saya", autentikasi, c.saya);
