// Pemeriksaan sintaks sederhana (tanpa dependensi): menjalankan `node --check` pada setiap berkas .js/.mjs.
// Pada proyek nyata gunakan ESLint; skrip ini cukup untuk CI praktikum.
import { readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { spawnSync } from "node:child_process";

const ABAIKAN = new Set(["node_modules", ".git", "dist", "uploads", "_solusi_dosen"]);
const berkas = [];

function telusuri(dir) {
  for (const nama of readdirSync(dir)) {
    if (ABAIKAN.has(nama)) continue;
    const path = join(dir, nama);
    if (statSync(path).isDirectory()) telusuri(path);
    else if ([".js", ".mjs"].includes(extname(nama))) berkas.push(path);
  }
}

for (const akar of ["src", "scripts", "tests", "prisma"]) {
  try {
    telusuri(akar);
  } catch {
    /* folder tidak ada */
  }
}

let gagal = 0;
for (const f of berkas) {
  const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8" });
  if (r.status !== 0) {
    gagal++;
    console.error(`GAGAL  ${f}\n${r.stderr}`);
  }
}

console.log(`${berkas.length - gagal}/${berkas.length} berkas lolos pemeriksaan sintaks`);
process.exitCode = gagal ? 1 : 0;
