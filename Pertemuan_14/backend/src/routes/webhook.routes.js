import { Router } from "express";
import express from "express";
import { terima } from "../controllers/webhook.controller.js";

export const webhookRouter = Router();

// BODY MENTAH wajib untuk verifikasi HMAC; JANGAN diurai oleh express.json() lebih dulu.
// Batas ukuran kecil: webhook tidak membutuhkan body besar.
webhookRouter.post("/gateway", express.raw({ type: "application/json", limit: "50kb" }), terima);
