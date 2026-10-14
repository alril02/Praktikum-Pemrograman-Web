// KUNCI JAWABAN DOSEN - salin ke src/lib/validasiProduk.js
export const KATEGORI = ["kopi", "teh", "gula", "alat"];

function bilangan(nilai, label) {
  if (nilai === null || nilai === undefined || (typeof nilai === "string" && nilai.trim() === "")) {
    return { galat: `${label} wajib diisi` };
  }
  let n;
  if (typeof nilai === "number") n = nilai;
  else if (typeof nilai === "string" && /^-?\d+(\.\d+)?$/.test(nilai.trim())) n = Number(nilai.trim());
  else return { galat: `${label} harus berupa angka` };

  if (!Number.isFinite(n)) return { galat: `${label} harus berupa angka` };
  if (!Number.isInteger(n)) return { galat: `${label} harus bilangan bulat` };
  if (n < 0) return { galat: `${label} tidak boleh negatif` };
  return { nilai: n };
}

export function validasiProduk(form) {
  const galat = {};
  const data = {};

  const nama = typeof form.nama === "string" ? form.nama.trim() : "";
  if (nama.length < 3) galat.nama = "Nama minimal 3 karakter";
  else if (nama.length > 100) galat.nama = "Nama maksimal 100 karakter";
  else data.nama = nama;

  for (const [kunci, label] of [["harga", "Harga"], ["stok", "Stok"]]) {
    const h = bilangan(form[kunci], label);
    if (h.galat) galat[kunci] = h.galat;
    else data[kunci] = h.nilai;
  }

  if (!KATEGORI.includes(form.kategori)) galat.kategori = "Pilih kategori yang tersedia";
  else data.kategori = form.kategori;

  const deskripsi = typeof form.deskripsi === "string" ? form.deskripsi.trim() : "";
  if (deskripsi.length > 500) galat.deskripsi = "Deskripsi maksimal 500 karakter";
  else data.deskripsi = deskripsi === "" ? null : deskripsi;

  return { valid: Object.keys(galat).length === 0, galat, data };
}
