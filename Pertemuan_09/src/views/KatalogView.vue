<script setup>
import { ref, watch, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useCartStore } from "../stores/cart.js";
import { api, pesanGalat } from "../api.js";
import ProductCard from "../components/ProductCard.vue";

const cart = useCartStore();
const { items } = storeToRefs(cart);

const KATEGORI = ["semua", "kopi", "teh", "gula", "alat"];

// TODO 1 (state di URL): ganti dua ref berikut menjadi computed yang membaca route.query,
//   dan setiap perubahan input memanggil router.replace({ query: {...} }).
//     const kategori = computed(() => route.query.kategori ?? "semua")
//     const kata     = computed(() => route.query.q ?? "")
//   Nilai bawaan ("semua" / "") dihapus dari query (undefined) agar URL bersih.
//   Dengan begitu filter bertahan saat muat ulang, dapat di-bookmark, dan Back berfungsi.
const kategori = ref("semua");
const kata = ref("");

const produk = ref([]);
const status = ref("loading"); // loading | success | empty | error
const galat = ref("");
let pengendali = null;

async function muat() {
  pengendali?.abort();
  pengendali = new AbortController();
  status.value = "loading";

  const query = new URLSearchParams({ batas: "100" });
  if (kategori.value !== "semua") query.set("kategori", kategori.value);
  if (kata.value.trim()) query.set("q", kata.value.trim());

  try {
    const hasil = await api.get(`/produk?${query}`, { signal: pengendali.signal });
    produk.value = hasil.data;
    status.value = hasil.data.length ? "success" : "empty";
  } catch (e) {
    if (e.name === "AbortError") return;
    galat.value = pesanGalat(e);
    status.value = "error";
  }
}

watch([kategori, kata], muat, { immediate: true });
onUnmounted(() => pengendali?.abort());
</script>

<template>
  <h1>Katalog Produk</h1>

  <form class="filter" role="search" @submit.prevent>
    <div>
      <label for="cari">Cari produk</label>
      <input id="cari" v-model="kata" type="search" autocomplete="off" placeholder="mis. gayo" />
    </div>
    <div>
      <label for="kategori">Kategori</label>
      <select id="kategori" v-model="kategori">
        <option v-for="k in KATEGORI" :key="k" :value="k">{{ k }}</option>
      </select>
    </div>
  </form>

  <p v-if="status === 'loading'" class="pesan" role="status">Memuat produk…</p>
  <div v-else-if="status === 'error'" class="pesan galat" role="alert">
    {{ galat }} <button type="button" class="sekunder" @click="muat">Coba lagi</button>
  </div>
  <p v-else-if="status === 'empty'" class="pesan">Produk tidak ditemukan.</p>

  <section v-else class="grid" aria-label="Daftar produk">
    <ProductCard
      v-for="p in produk"
      :key="p.id"
      :produk="p"
      :jumlah="items[p.id]?.jumlah ?? 0"
      @tambah="cart.tambah($event)"
    />
  </section>
</template>
