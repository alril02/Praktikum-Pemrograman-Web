<script setup>
const props = defineProps({
  jumlah: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
});

const emit = defineEmits(["kosongkan"]);

const formatRupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
</script>

<template>
  <!-- TODO 1: tambahkan aria-live="polite" agar perubahan jumlah diumumkan pembaca layar -->
  <div class="keranjang">
    <p>
      Keranjang: <strong>{{ jumlah }}</strong> item &middot; <strong>{{ formatRupiah(total) }}</strong>
    </p>

    <!-- TODO 2: tampilkan tombol hanya bila jumlah > 0 (v-if); klik memancarkan "kosongkan" -->
    <button type="button">Kosongkan</button>
  </div>
</template>

<style scoped>
.keranjang { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
p { margin: 0; }
</style>
