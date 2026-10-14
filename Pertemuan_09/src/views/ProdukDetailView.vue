<script setup>
import { ref, watch, onUnmounted, computed } from "vue";
import { RouterLink } from "vue-router";
import { useCartStore } from "../stores/cart.js";
import { api, pesanGalat } from "../api.js";

// Diteruskan oleh router (props: true). Selalu STRING.
const props = defineProps({ id: { type: String, required: true } });

const cart = useCartStore();
const produk = ref(null);
const status = ref("loading"); // loading | success | notfound | error
const galat = ref("");
let pengendali = null;

const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const jumlahDiKeranjang = computed(() => cart.items[produk.value?.id]?.jumlah ?? 0);
const bisaTambah = computed(() => produk.value && produk.value.stok > jumlahDiKeranjang.value);

// TODO: amati props.id (BUKAN hanya onMounted) agar pindah /produk/1 -> /produk/2 memuat ulang.
//   - batalkan request sebelumnya (AbortController)
//   - status "notfound" untuk 404, "error" untuk lainnya
//   - gunakan { immediate: true }
async function muat(id) {
  pengendali?.abort();
  pengendali = new AbortController();
  status.value = "loading";
  try {
    produk.value = (await api.get(`/produk/${id}`, { signal: pengendali.signal })).data;
    status.value = "success";
  } catch (e) {
    if (e.name === "AbortError") return;
    galat.value = pesanGalat(e);
    status.value = e.status === 404 ? "notfound" : "error";
  }
}

muat(props.id); // TODO: ganti dengan watch(() => props.id, muat, { immediate: true })
onUnmounted(() => pengendali?.abort());
</script>

<template>
  <p><RouterLink :to="{ name: 'katalog' }">← Kembali ke katalog</RouterLink></p>

  <p v-if="status === 'loading'" class="pesan" role="status">Memuat produk…</p>
  <p v-else-if="status === 'notfound'" class="pesan">Produk tidak ditemukan.</p>
  <p v-else-if="status === 'error'" class="pesan galat" role="alert">{{ galat }}</p>

  <article v-else-if="produk" class="kartu">
    <h1>{{ produk.nama }}</h1>
    <p class="kategori">{{ produk.kategori }}</p>
    <p class="harga">{{ rupiah(produk.harga) }}</p>
    <p>{{ produk.stok === 0 ? "Habis" : `Stok: ${produk.stok}` }}</p>
    <p v-if="jumlahDiKeranjang > 0">Di keranjang: {{ jumlahDiKeranjang }}</p>
    <div class="aksi">
      <button type="button" :disabled="!bisaTambah" @click="cart.tambah(produk)">Tambah ke keranjang</button>
      <RouterLink class="tombol sekunder" :to="{ name: 'keranjang' }">Lihat keranjang</RouterLink>
    </div>
  </article>
</template>
