// KUNCI JAWABAN DOSEN - salin ke src/stores/cart.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const KUNCI_STORAGE = "toko:keranjang:v1";

function penyimpanan() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function valid(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  return Object.values(data).every(
    (it) =>
      it &&
      Number.isInteger(it.jumlah) &&
      it.jumlah > 0 &&
      it.produk &&
      Number.isInteger(it.produk.id) &&
      typeof it.produk.nama === "string" &&
      Number.isInteger(it.produk.harga) &&
      Number.isInteger(it.produk.stok)
  );
}

function muat() {
  try {
    const mentah = penyimpanan()?.getItem(KUNCI_STORAGE);
    if (!mentah) return {};
    const data = JSON.parse(mentah);
    return valid(data) ? data : {};
  } catch {
    return {};
  }
}

export const useCartStore = defineStore("cart", () => {
  const items = ref(muat());

  const jumlahItem = computed(() => Object.values(items.value).reduce((n, it) => n + it.jumlah, 0));
  const total = computed(() => Object.values(items.value).reduce((t, it) => t + it.jumlah * it.produk.harga, 0));
  const itemUntukServer = computed(() =>
    Object.values(items.value).map((it) => ({ produkId: it.produk.id, jumlah: it.jumlah }))
  );

  function simpan() {
    try {
      penyimpanan()?.setItem(KUNCI_STORAGE, JSON.stringify(items.value));
    } catch {
      /* kuota penuh / diblokir: abaikan */
    }
  }

  function tambah(produk, n = 1) {
    const sekarang = items.value[produk.id]?.jumlah ?? 0;
    const baru = Math.min(sekarang + n, produk.stok);
    if (baru <= sekarang) return false;
    items.value[produk.id] = {
      produk: { id: produk.id, nama: produk.nama, harga: produk.harga, stok: produk.stok },
      jumlah: baru,
    };
    simpan();
    return true;
  }

  function ubahJumlah(id, jumlah) {
    const it = items.value[id];
    if (!it) return;
    if (jumlah <= 0) delete items.value[id];
    else it.jumlah = Math.min(jumlah, it.produk.stok);
    simpan();
  }

  function hapus(id) {
    delete items.value[id];
    simpan();
  }

  function kosongkan() {
    items.value = {};
    simpan();
  }

  return { items, jumlahItem, total, itemUntukServer, tambah, ubahJumlah, hapus, kosongkan };
});
