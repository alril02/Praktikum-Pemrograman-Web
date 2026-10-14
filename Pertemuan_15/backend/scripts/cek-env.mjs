// Memeriksa konfigurasi lingkungan SEBELUM deploy.
//   NODE_ENV=production node scripts/cek-env.mjs
// Keluar dengan kode 1 bila ada masalah (cocok dipakai pada langkah CI/CD atau start command).
import { periksaEnv } from "../src/lib/env.js";

const hasil = periksaEnv(process.env);

console.log(`Lingkungan: ${process.env.NODE_ENV ?? "development"}`);
for (const m of hasil.masalah) console.log(`  MASALAH    ${m}`);
for (const p of hasil.peringatan) console.log(`  PERINGATAN ${p}`);
console.log(hasil.ok ? "Konfigurasi VALID" : "Konfigurasi TIDAK VALID");

process.exitCode = hasil.ok ? 0 : 1;
