<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";

const props = defineProps({
  produk: { type: Object, required: true },
  jumlah: { type: Number, default: 0 }, // jumlah di keranjang
});
const emit = defineEmits(["tambah"]);

const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const habis = computed(() => props.produk.stok === 0);
const penuh = computed(() => props.jumlah >= props.produk.stok);
</script>

<template>
  <article class="kartu">
    <h2>
      <RouterLink :to="{ name: 'produk', params: { id: produk.id } }">{{ produk.nama }}</RouterLink>
    </h2>
    <p class="kategori">{{ produk.kategori }}</p>
    <p class="harga">{{ rupiah(produk.harga) }}</p>
    <p>{{ habis ? "Habis" : `Stok: ${produk.stok}` }}</p>
    <p v-if="jumlah > 0">Di keranjang: {{ jumlah }}</p>

    <div class="aksi">
      <button type="button" :disabled="habis || penuh" @click="emit('tambah', produk)">
        {{ habis ? "Habis" : penuh ? "Stok penuh" : "Tambah" }}
      </button>
    </div>
  </article>
</template>
