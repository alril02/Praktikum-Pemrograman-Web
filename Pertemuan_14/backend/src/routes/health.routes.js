import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { status as statusShutdown } from "../lib/shutdown.js";

const mulai = Date.now();
const versi = process.env.APP_VERSION ?? process.env.npm_package_version ?? "dev";

// Fabrik agar mudah diuji: `cekDb` dapat diganti dengan fungsi palsu.
export function buatHealthRouter({
  cekDb = async () => {
    await prisma.$queryRaw`SELECT 1`;
  },
} = {}) {
  const router = Router();

  // LIVENESS: proses hidup. Jangan memeriksa dependensi di sini (restart tidak memperbaiki DB mati).
  router.get("/kesehatan", (req, res) => {
    res.json({
      status: "ok",
      versi,
      uptimeDetik: Math.round((Date.now() - mulai) / 1000),
      waktu: new Date().toISOString(),
    });
  });

  // READINESS: siap melayani trafik.
  // TODO:
  //   - bila statusShutdown.berhenti -> 503 { status: "berhenti" }
  //   - jalankan cekDb() dengan batas waktu 2 detik (Promise.race dengan timer)
  //   - sukses  -> 200 { status: "siap", db: "ok" }
  //   - gagal/timeout -> 503 { status: "tidak_siap", db: "gagal" }  (JANGAN membocorkan pesan galat DB)
  router.get("/siap", async (req, res) => {
    void [cekDb, statusShutdown];
    res.json({ status: "siap", db: "ok" });
  });

  return router;
}

export const healthRouter = buatHealthRouter();
