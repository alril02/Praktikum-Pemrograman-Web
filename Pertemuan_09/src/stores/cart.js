// Store keranjang (Pinia, setup store).
// Uji dengan:  npm test     (tests/cart.store.test.mjs)
//
// Bentuk state:  items = { [idProduk]: { produk: { id, nama, harga, stok }, jumlah } }
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const KUNCI_STORAGE = "toko:keranjang:v1";

// Akses storage yang aman (bisa tidak ada / diblokir)
function penyimpanan() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

// TODO 1: validasi bentuk data yang dimuat dari storage (storage bisa dimodifikasi pengguna).
//   Kembalikan true hanya jika: object biasa (bukan array/null); setiap entri memiliki
//   jumlah bilangan bulat > 0 dan produk { id: int, nama: string, harga: int, stok: int }.
function valid(data) {
  return false;
}

// TODO 2: baca KUNCI_STORAGE, JSON.parse, validasi dengan valid(); kembalikan {} bila apa pun salah.
//   Bungkus dengan try/catch: aplikasi TIDAK BOLEH rusak karena storage.
function muat() {
  return {};
}

export const useCartStore = defineStore("cart", () => {
  const items = ref(muat());

  // ---------- Getter ----------
  // TODO 3: jumlah seluruh kuantitas (bukan jumlah jenis produk)
  const jumlahItem = computed(() => 0);

  // TODO 4: total harga = jumlah (harga * jumlah)
  const total = computed(() => 0);

  // TODO 5: daftar [{ produkId, jumlah }] untuk dikirim ke server
  //         (HANYA id dan jumlah: harga dan stok dihitung server saat checkout)
  const itemUntukServer = computed(() => []);

  // ---------- Persistensi ----------
  // TODO 6: simpan items sebagai JSON ke KUNCI_STORAGE; abaikan galat (kuota penuh/diblokir)
  function simpan() {
    // ...
  }

  // ---------- Action ----------
  // TODO 7: tambahkan `n` unit. Jumlah akhir tidak boleh melebihi produk.stok.
  //   Kembalikan true bila ada perubahan, false bila tidak (stok 0 / sudah penuh).
  //   Panggil simpan() setelah mutasi.
  function tambah(produk, n = 1) {
    return false;
  }

  // TODO 8: set jumlah mutlak. jumlah <= 0 -> hapus item; jumlah > stok -> dibatasi stok.
  function ubahJumlah(id, jumlah) {
    // ...
  }

  // TODO 9
  function hapus(id) {
    // ...
  }

  // TODO 10
  function kosongkan() {
    // ...
  }

  return { items, jumlahItem, total, itemUntukServer, tambah, ubahJumlah, hapus, kosongkan };
});
