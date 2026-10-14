import { Router } from "express";
import { autentikasi, otorisasi } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { cache } from "../lib/cache.js";

export const adminRouter = Router();
adminRouter.use(autentikasi, otorisasi("admin"));

const batas = (q) => Math.min(200, Math.max(1, Number.parseInt(q, 10) || 50));

// GET /api/v1/admin/jobs?status=&jenis=&kunciUnik=
adminRouter.get("/jobs", async (req, res) => {
  const { status, jenis, kunciUnik } = req.query;
  const data = await prisma.job.findMany({
    where: {
      ...(typeof status === "string" && status ? { status } : {}),
      ...(typeof jenis === "string" && jenis ? { jenis } : {}),
      ...(typeof kunciUnik === "string" && kunciUnik ? { kunciUnik } : {}),
    },
    orderBy: { id: "desc" },
    take: batas(req.query.batas),
  });
  res.json({ data: data.map((j) => ({ ...j, payload: JSON.parse(j.payload) })) });
});

// GET /api/v1/admin/notifikasi?pesananId=
adminRouter.get("/notifikasi", async (req, res) => {
  const pesananId = Number(req.query.pesananId);
  const data = await prisma.notifikasi.findMany({
    where: Number.isInteger(pesananId) ? { pesananId } : undefined,
    orderBy: { id: "desc" },
    take: batas(req.query.batas),
  });
  res.json({ data });
});

// GET /api/v1/admin/invoice?pesananId=
adminRouter.get("/invoice", async (req, res) => {
  const pesananId = Number(req.query.pesananId);
  const data = await prisma.invoice.findMany({
    where: Number.isInteger(pesananId) ? { pesananId } : undefined,
    orderBy: { id: "desc" },
    take: batas(req.query.batas),
  });
  res.json({ data });
});

// GET /api/v1/admin/cache  -> statistik cache aplikasi
adminRouter.get("/cache", (req, res) => {
  res.json({ data: { ukuran: cache.ukuran, ...cache.statistik } });
});
