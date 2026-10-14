import { prisma } from "../lib/prisma.js";

// Bentuk publik pengguna: TIDAK PERNAH menyertakan passwordHash.
const PUBLIK = { id: true, nama: true, email: true, peran: true };

// Hanya untuk proses login (butuh hash). Jangan dikembalikan ke klien.
export function cariEmailDenganHash(email) {
  return prisma.pengguna.findUnique({ where: { email } });
}

export function cariId(id) {
  return prisma.pengguna.findUnique({ where: { id }, select: PUBLIK });
}

export function buat({ nama, email, passwordHash }) {
  // peran SELALU "user" untuk pendaftaran publik (ditetapkan di server)
  return prisma.pengguna.create({
    data: { nama, email, passwordHash, peran: "user" },
    select: PUBLIK,
  });
}

export const bentukPublik = (p) => ({ id: p.id, nama: p.nama, email: p.email, peran: p.peran });
