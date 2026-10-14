// Cache TTL di memori proses.  Uji dengan:  npm test   (tests/cache.test.mjs)
import { config } from "../config.js";

export class TtlCache {
  constructor({ maksEntri = 500, sekarang = () => Date.now(), jitter = 0, acak = Math.random } = {}) {
    this.maksEntri = maksEntri;
    this.sekarang = sekarang;
    this.jitter = jitter; // 0.1 = TTL efektif bervariasi ±10%
    this.acak = acak;
    this.data = new Map(); // kunci -> { nilai, kedaluwarsaPada }
    this.statistik = { hit: 0, miss: 0 };
  }

  // TODO 1: simpan nilai dengan masa berlaku ttlMs.
  //   - ttl efektif = ttlMs * (1 - jitter + acak() * 2 * jitter)
  //   - kedaluwarsaPada = sekarang() + ttl efektif
  //   - bila kunci sudah ada: hapus dulu (agar urutan sisip diperbarui)
  //   - bila ukuran > maksEntri: buang entri TERTUA (Map menjaga urutan sisip)
  set(kunci, nilai, ttlMs) {
    throw new Error("Belum diimplementasikan: set");
  }

  // TODO 2: kembalikan nilai bila ada dan belum kedaluwarsa (sekarang() < kedaluwarsaPada);
  //   entri kedaluwarsa DIHAPUS dan dianggap miss. Perbarui statistik.hit / statistik.miss.
  //   Mengembalikan undefined bila tidak ada.
  get(kunci) {
    return undefined;
  }

  // TODO 3
  hapus(kunci) {
    return false;
  }

  // TODO 4: hapus semua kunci yang diawali `awalan`; kembalikan jumlah yang dihapus
  hapusAwalan(awalan) {
    return 0;
  }

  bersihkan() {
    this.data.clear();
  }

  get ukuran() {
    return this.data.size;
  }
}

// Instans bersama aplikasi
export const cache = new TtlCache({ maksEntri: config.cacheMaxEntries, jitter: 0.1 });

// Bantuan pemakaian: cache-aside
export async function ambilAtauHitung(kunci, hitung, ttlMs = config.cacheTtlMs) {
  const ada = cache.get(kunci);
  if (ada !== undefined) return { nilai: ada, hit: true };
  const nilai = await hitung();
  cache.set(kunci, nilai, ttlMs);
  return { nilai, hit: false };
}

export const invalidasiProduk = () => cache.hapusAwalan("produk:");
