// Layanan email PALSU yang LAMBAT dan dapat dibuat gagal secara deterministik (untuk pelatihan).
//   penerima mengandung "+gagalN@"  -> gagal pada N percobaan pertama, lalu berhasil
//   penerima mengandung "+racun@"   -> SELALU gagal (poison job)
import { config } from "../config.js";

const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));

export async function kirimEmail({ to, subjek, percobaan = 1 }) {
  await tunggu(config.emailDelayMs); // simulasi layanan lambat

  if (/\+racun@/i.test(to)) {
    throw new Error("SMTP menolak penerima (simulasi racun)");
  }
  const m = /\+gagal(\d+)@/i.exec(to);
  if (m && percobaan <= Number(m[1])) {
    throw new Error(`SMTP sementara tidak tersedia (simulasi, percobaan ${percobaan})`);
  }
  return { messageId: `msg_${Date.now().toString(36)}`, to, subjek };
}
