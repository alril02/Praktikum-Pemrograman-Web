import { z } from "zod";

export const KATEGORI = ["kopi", "teh", "gula", "alat"];

// TODO 1: skemaBuat — z.object({...}).strict()
//   nama      : string (invalid_type_error/required_error dalam Bahasa Indonesia), trim, min 3, max 100
//   harga     : number bilangan bulat >= 0
//   stok      : number bilangan bulat >= 0
//   kategori  : enum KATEGORI (pesan: "Kategori tidak dikenal")
//   deskripsi : string maks 500, boleh null, opsional
//   .strict()  -> field asing ditolak (cegah mass assignment)
//   Pesan galat HARUS berbahasa Indonesia dan menjelaskan cara memperbaiki.
export const skemaBuat = z.object({}).strict();

// TODO 2: skemaUbah — turunan skemaBuat untuk PATCH: semua field opsional (.partial()), tetap strict.
export const skemaUbah = z.object({}).strict();

// TODO 3: parse(skema, data) -> { data } atau { detail: [{ field, pesan }] }
//   - gunakan skema.safeParse(data)
//   - setiap issue: field = path.join("."), pesan = message
//   - untuk issue.code === "unrecognized_keys": buat satu entri per key di issue.keys
//       dengan pesan "Field tidak dikenal"
//   - bila body bukan object, field "_body"
export function parse(skema, data) {
  return { data };
}
