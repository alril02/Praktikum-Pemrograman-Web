// KUNCI JAWABAN DOSEN - salin ke src/routes/health.routes.js
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { status as statusShutdown } from "../lib/shutdown.js";

const mulai = Date.now();
const versi = process.env.APP_VERSION ?? process.env.npm_package_version ?? "dev";

export function buatHealthRouter({
  cekDb = async () => {
    await prisma.$queryRaw`SELECT 1`;
  },
} = {}) {
  const router = Router();

  router.get("/kesehatan", (req, res) => {
    res.json({
      status: "ok",
      versi,
      uptimeDetik: Math.round((Date.now() - mulai) / 1000),
      waktu: new Date().toISOString(),
    });
  });

  router.get("/siap", async (req, res) => {
    if (statusShutdown.berhenti) {
      return res.status(503).json({ status: "berhenti" });
    }

    let timer;
    try {
      await Promise.race([
        cekDb(),
        new Promise((_, tolak) => {
          timer = setTimeout(() => tolak(new Error("timeout")), 2000);
        }),
      ]);
      res.json({ status: "siap", db: "ok" });
    } catch {
      res.status(503).json({ status: "tidak_siap", db: "gagal" });
    } finally {
      clearTimeout(timer);
    }
  });

  return router;
}

export const healthRouter = buatHealthRouter();
