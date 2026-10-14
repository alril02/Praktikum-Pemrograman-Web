// KUNCI JAWABAN DOSEN - salin ke src/validation/produk.schema.js
import { z } from "zod";

export const KATEGORI = ["kopi", "teh", "gula", "alat"];

const bilanganBulat = (nama) =>
  z
    .number({ invalid_type_error: `${nama} harus berupa angka`, required_error: `${nama} wajib diisi` })
    .int(`${nama} harus bilangan bulat`)
    .min(0, `${nama} tidak boleh negatif`);

export const skemaBuat = z
  .object({
    nama: z
      .string({ invalid_type_error: "Nama harus berupa teks", required_error: "Nama wajib diisi" })
      .trim()
      .min(3, "Nama minimal 3 karakter")
      .max(100, "Nama maksimal 100 karakter"),
    harga: bilanganBulat("Harga"),
    stok: bilanganBulat("Stok"),
    kategori: z.enum(KATEGORI, {
      errorMap: () => ({ message: `Kategori tidak dikenal. Pilih salah satu: ${KATEGORI.join(", ")}` }),
    }),
    deskripsi: z.string().max(500, "Deskripsi maksimal 500 karakter").nullable().optional(),
  })
  .strict();

export const skemaUbah = skemaBuat.partial().strict();

export function parse(skema, data) {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return { detail: [{ field: "_body", pesan: "Body harus berupa object JSON" }] };
  }
  const hasil = skema.safeParse(data);
  if (hasil.success) return { data: hasil.data };

  const detail = [];
  for (const issue of hasil.error.issues) {
    if (issue.code === "unrecognized_keys") {
      for (const key of issue.keys) detail.push({ field: key, pesan: "Field tidak dikenal" });
    } else {
      detail.push({ field: issue.path.join(".") || "_body", pesan: issue.message });
    }
  }
  return { detail };
}
