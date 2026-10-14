// Dijalankan SEKALI sebelum seluruh tes: membuat database uji baru (skema + seed).
import { execSync } from "node:child_process";
import { rmSync, existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

function adaMigrasi() {
  const dir = resolve("prisma", "migrations");
  return existsSync(dir) && readdirSync(dir, { withFileTypes: true }).some((d) => d.isDirectory());
}

export default function setup() {
  const dbFile = resolve("prisma", "test.db");
  for (const f of [dbFile, `${dbFile}-journal`]) {
    if (existsSync(f)) rmSync(f);
  }

  const env = {
    ...process.env,
    DATABASE_URL: "file:./test.db",
    BCRYPT_COST: "4", // hash cepat hanya untuk uji
    JWT_SECRET: "uji-only-secret-0123456789-abcdefghijklmnopqrstuvwxyz",
  };

  // Utama: terapkan migrasi proyek (identik dengan produksi). Cadangan: `db push` dari schema.prisma
  // bila folder migrasi belum ada (mis. pada salinan latihan baru).
  if (adaMigrasi()) {
    execSync("npx prisma migrate deploy", { env, stdio: "pipe" });
  } else {
    execSync("npx prisma db push --skip-generate --accept-data-loss", { env, stdio: "pipe" });
  }
  execSync("node prisma/seed.js", { env, stdio: "pipe" });
}
