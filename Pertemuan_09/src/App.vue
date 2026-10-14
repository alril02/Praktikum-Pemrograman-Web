<script setup>
import { ref, watch, nextTick } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useCartStore } from "./stores/cart.js";

const route = useRoute();
const cart = useCartStore();
const { jumlahItem, total } = storeToRefs(cart);

const utama = ref(null);
const pengumuman = ref("");

const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

// TODO (aksesibilitas SPA): setelah setiap navigasi
//   1. tunggu DOM diperbarui (await nextTick())
//   2. pindahkan fokus ke <main> (utama.value?.focus())
//   3. isi `pengumuman` agar pembaca layar mengumumkan halaman baru, mis. `Halaman ${judul} dimuat`
watch(
  () => route.fullPath,
  async () => {
    await nextTick();
    void utama;
    void pengumuman;
  }
);
</script>

<template>
  <a class="skip-link" href="#konten">Lewati ke konten utama</a>

  <header class="bar">
    <RouterLink class="merek" :to="{ name: 'katalog' }">Toko UMKM</RouterLink>

    <nav aria-label="Navigasi utama">
      <RouterLink :to="{ name: 'katalog' }">Katalog</RouterLink>
      <RouterLink :to="{ name: 'keranjang' }">
        Keranjang
        <span class="lencana" aria-live="polite">{{ jumlahItem }} item · {{ rupiah(total) }}</span>
      </RouterLink>
    </nav>
  </header>

  <main id="konten" ref="utama" tabindex="-1">
    <RouterView />
  </main>

  <!-- Wilayah pengumuman untuk pembaca layar -->
  <p class="sr-only" role="status" aria-live="polite">{{ pengumuman }}</p>
</template>
