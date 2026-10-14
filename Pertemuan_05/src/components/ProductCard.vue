<script setup>
// Komponen presentasional: menerima props, memancarkan event. TIDAK memutasi props.
import { computed } from "vue";

const props = defineProps({
  produk: { type: Object, required: true },
  jumlah: { type: Number, default: 0 },     // jumlah produk ini di keranjang
});

const emit = defineEmits(["tambah"]);

const formatRupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

// TODO 1: computed `habis` -> true bila produk.stok === 0
// TODO 2: computed `penuh` -> true bila jumlah >= produk.stok (tidak bisa ditambah lagi)
// TODO 3: computed `labelTombol` -> "Habis" | "Stok penuh di keranjang" | "Tambah ke keranjang"
const habis = computed(() => false);
const penuh = computed(() => false);
const labelTombol = computed(() => "Tambah ke keranjang");

function klik() {
  // TODO 4: pancarkan event "tambah" dengan payload minimal (id produk)
}
</script>

<template>
  <article class="kartu">
    <h2>{{ produk.nama }}</h2>
    <p class="kategori">{{ produk.kategori }}</p>
    <p class="harga">{{ formatRupiah(produk.harga) }}</p>
    <p class="stok">
      <!-- TODO 5: tampilkan "Habis" bila habis, selain itu "Stok: n" -->
      Stok: {{ produk.stok }}
    </p>
    <p v-if="jumlah > 0" class="di-keranjang">Di keranjang: {{ jumlah }}</p>

    <!-- TODO 6: :disabled bila habis atau penuh; @click="klik" -->
    <button type="button">{{ labelTombol }}</button>
  </article>
</template>

<style scoped>
.kartu {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem;
  border: 1px solid var(--batas);
  border-radius: 0.5rem;
}
h2 { margin: 0; font-size: 1.05rem; }
p { margin: 0; }
.kategori { color: var(--redup); font-size: 0.9rem; text-transform: capitalize; }
.harga { font-weight: 700; }
.di-keranjang { color: var(--aksen); font-weight: 600; }
button { margin-top: auto; }
</style>
