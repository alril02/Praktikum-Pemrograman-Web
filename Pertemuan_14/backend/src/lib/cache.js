// KUNCI JAWABAN DOSEN - salin ke src/lib/cache.js
import { config } from "../config.js";

export class TtlCache {
  constructor({ maksEntri = 500, sekarang = () => Date.now(), jitter = 0, acak = Math.random } = {}) {
    this.maksEntri = maksEntri;
    this.sekarang = sekarang;
    this.jitter = jitter;
    this.acak = acak;
    this.data = new Map();
    this.statistik = { hit: 0, miss: 0 };
  }

  set(kunci, nilai, ttlMs) {
    const efektif = ttlMs * (1 - this.jitter + this.acak() * 2 * this.jitter);
    if (this.data.has(kunci)) this.data.delete(kunci);
    this.data.set(kunci, { nilai, kedaluwarsaPada: this.sekarang() + efektif });
    while (this.data.size > this.maksEntri) {
      const tertua = this.data.keys().next().value;
      this.data.delete(tertua);
    }
  }

  get(kunci) {
    const e = this.data.get(kunci);
    if (!e) {
      this.statistik.miss++;
      return undefined;
    }
    if (this.sekarang() >= e.kedaluwarsaPada) {
      this.data.delete(kunci);
      this.statistik.miss++;
      return undefined;
    }
    this.statistik.hit++;
    return e.nilai;
  }

  hapus(kunci) {
    return this.data.delete(kunci);
  }

  hapusAwalan(awalan) {
    let n = 0;
    for (const k of [...this.data.keys()]) {
      if (k.startsWith(awalan)) {
        this.data.delete(k);
        n++;
      }
    }
    return n;
  }

  bersihkan() {
    this.data.clear();
  }

  get ukuran() {
    return this.data.size;
  }
}

export const cache = new TtlCache({ maksEntri: config.cacheMaxEntries, jitter: 0.1 });

export async function ambilAtauHitung(kunci, hitung, ttlMs = config.cacheTtlMs) {
  const ada = cache.get(kunci);
  if (ada !== undefined) return { nilai: ada, hit: true };
  const nilai = await hitung();
  cache.set(kunci, nilai, ttlMs);
  return { nilai, hit: false };
}

export const invalidasiProduk = () => cache.hapusAwalan("produk:");
