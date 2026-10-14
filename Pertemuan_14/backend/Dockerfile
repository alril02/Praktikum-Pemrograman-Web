# syntax=docker/dockerfile:1
# Image backend (API dan worker memakai image yang SAMA, perintah start berbeda).
#
#   docker build -t toko-api:1.0.0 .
#   docker run --rm -p 3000:3000 --env-file .env toko-api:1.0.0
#   docker run --rm --env-file .env toko-api:1.0.0 node src/queue/worker-main.js     # worker

# ---------- Tahap 1: dependensi produksi ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# `npm ci` = instal persis sesuai lockfile; --omit=dev = tanpa dependensi pengembangan
RUN npm ci --omit=dev

# ---------- Tahap 2: Prisma Client ----------
FROM deps AS prisma
RUN apk add --no-cache openssl
COPY prisma ./prisma
# Prisma CLI ada pada devDependencies; dipasang sementara hanya pada tahap ini
RUN npm install --no-save prisma@^6 && npx prisma generate

# ---------- Tahap 3: image akhir ----------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Prisma membutuhkan OpenSSL pada Alpine
RUN apk add --no-cache openssl

# Jangan menjalankan sebagai root
RUN addgroup -S app && adduser -S app -G app

COPY --from=prisma /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma
COPY src ./src

# Folder unggahan dapat ditulis oleh pengguna non-root (pasang volume pada produksi)
RUN mkdir -p /app/uploads && chown -R app:app /app/uploads
USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/v1/kesehatan || exit 1

# Migrasi dijalankan sebagai LANGKAH RILIS terpisah pada produksi (lihat deploy/runbook.md);
# jika platform tidak mendukung, gunakan: npm run start:migrate
CMD ["node", "src/server.js"]
