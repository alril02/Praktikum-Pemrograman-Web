import { randomUUID } from "node:crypto";

const produksi = process.env.NODE_ENV === "production";

// Log akses. Produksi: JSON satu baris (mudah dicari/dikorelasikan). Lokal: teks ringkas.
// Menyertakan ID permintaan (header X-Request-Id dari proxy bila ada) untuk penelusuran.
export function logger(req, res, next) {
  const mulai = performance.now();
  const id = req.get("x-request-id") ?? randomUUID();
  req.id = id;
  res.setHeader("X-Request-Id", id);

  res.on("finish", () => {
    const ms = Number((performance.now() - mulai).toFixed(1));
    if (produksi) {
      console.log(
        JSON.stringify({
          level: res.statusCode >= 500 ? "error" : "info",
          waktu: new Date().toISOString(),
          idPermintaan: id,
          metode: req.method,
          path: req.originalUrl.split("?")[0], // tanpa query string (dapat memuat data sensitif)
          status: res.statusCode,
          durasiMs: ms,
        })
      );
    } else {
      console.log(`${new Date().toISOString()}  ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms} ms)`);
    }
  });

  next();
}
