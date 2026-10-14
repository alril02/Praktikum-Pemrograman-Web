// Menyajikan dokumentasi interaktif (Swagger UI) dari openapi.yaml.
//   GET /api/docs            -> Swagger UI
//   GET /api/v1/openapi.json -> spesifikasi mentah (untuk alat/klien)
//
// KEAMANAN: dokumentasi menyingkap seluruh permukaan API. Aktifkan hanya bila memang diinginkan
// (DOCS_ENABLED=1) dan pertimbangkan perlindungan pada produksi.
import { readFileSync } from "node:fs";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";

export function muatSpesifikasi() {
  const teks = readFileSync(new URL("../../openapi.yaml", import.meta.url), "utf8");
  return YAML.parse(teks);
}

export function pasangDokumentasi(app) {
  if (process.env.DOCS_ENABLED === "0") return;

  const spec = muatSpesifikasi();

  app.get("/api/v1/openapi.json", (req, res) => res.json(spec));

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customSiteTitle: "API Toko UMKM",
      swaggerOptions: { persistAuthorization: false, docExpansion: "list" },
    })
  );
}
