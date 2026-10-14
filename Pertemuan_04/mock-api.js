// Praktikum Pertemuan 4 - API Tiruan (tanpa dependensi)
// Jalankan: node mock-api.js   -> http://localhost:4000
//
// Parameter simulasi pada GET /api/produk:
//   ?kategori=kopi      filter kategori
//   ?q=gayo             pencarian nama (tidak peka huruf besar-kecil)
//   ?delay=2000         tunda respons (ms, maks 10000)
//   ?gagal=500          kembalikan status error tersebut (400-599)
//   ?json_rusak=1       kirim body yang bukan JSON valid
//   ?kosong=1           kembalikan array kosong
//   ?acak=1             gagal 50% (500) untuk menguji coba ulang

import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const PORT = process.env.PORT || 4000;
const __dirname = dirname(fileURLToPath(import.meta.url));

const ORIGINS_DIIZINKAN = new Set([
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://localhost:8080",
]);

function corsHeaders(req) {
  const origin = req.headers.origin;
  if (origin && ORIGINS_DIIZINKAN.has(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      Vary: "Origin",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
  }
  return { Vary: "Origin" };
}

function kirim(req, res, status, body, tipe = "application/json; charset=utf-8") {
  const isi = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": tipe,
    "Content-Length": Buffer.byteLength(isi),
    "Cache-Control": "no-store",
    ...corsHeaders(req),
  });
  res.end(isi);
}

const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));

async function muatProduk() {
  const teks = await readFile(join(__dirname, "products.json"), "utf8");
  return JSON.parse(teks);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  console.log(`${new Date().toISOString()}  ${req.method} ${req.url}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders(req));
    return res.end();
  }

  if (req.method === "GET" && url.pathname === "/api/produk") {
    const p = url.searchParams;

    const delay = Math.min(Number(p.get("delay")) || 0, 10000);
    if (delay) await tunggu(delay);

    const gagal = Number(p.get("gagal"));
    if (gagal >= 400 && gagal <= 599) {
      return kirim(req, res, gagal, { pesan: `Kegagalan simulasi (${gagal})` });
    }
    if (p.get("acak") === "1" && Math.random() < 0.5) {
      return kirim(req, res, 500, { pesan: "Kegagalan acak, coba lagi" });
    }
    if (p.get("json_rusak") === "1") {
      return kirim(req, res, 200, '{"data": [ {"id": 1, ', "application/json; charset=utf-8");
    }
    if (p.get("kosong") === "1") return kirim(req, res, 200, []);

    let data = await muatProduk();
    const kategori = p.get("kategori");
    const q = (p.get("q") || "").trim().toLowerCase();
    if (kategori && kategori !== "semua") data = data.filter((x) => x.kategori === kategori);
    if (q) data = data.filter((x) => x.nama.toLowerCase().includes(q));

    return kirim(req, res, 200, data);
  }

  if (req.method === "GET" && url.pathname === "/api/produk/kategori") {
    const data = await muatProduk();
    return kirim(req, res, 200, [...new Set(data.map((x) => x.kategori))]);
  }

  const m = url.pathname.match(/^\/api\/produk\/(\d+)$/);
  if (req.method === "GET" && m) {
    const data = await muatProduk();
    const item = data.find((x) => x.id === Number(m[1]));
    return item ? kirim(req, res, 200, item) : kirim(req, res, 404, { pesan: "Produk tidak ditemukan" });
  }

  kirim(req, res, 404, { pesan: "Rute tidak ditemukan" });
});

server.listen(PORT, () => console.log(`API tiruan aktif di http://localhost:${PORT}/api/produk`));
