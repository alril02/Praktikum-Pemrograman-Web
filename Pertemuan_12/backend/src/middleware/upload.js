import multer from "multer";
import { config } from "../config.js";

// Memori (bukan disk) agar ISI divalidasi SEBELUM menulis apa pun ke storage.
// Batas ukuran dan jumlah berkas melindungi dari penghabisan sumber daya.
export const unggahGambar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 1, fields: 5 },
}).single("gambar");
