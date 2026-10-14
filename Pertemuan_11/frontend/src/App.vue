<script setup>
import { ref, watch, nextTick } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useCartStore } from "./stores/cart.js";
import { useAuthStore } from "./stores/auth.js";

const route = useRoute();
const router = useRouter();
const cart = useCartStore();
const auth = useAuthStore();
const { jumlahItem, total } = storeToRefs(cart);
const { masuk, adalahAdmin, pengguna } = storeToRefs(auth);

const utama = ref(null);
const pengumuman = ref("");

const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

// Aksesibilitas SPA: setelah navigasi pindahkan fokus ke konten dan umumkan halaman baru
watch(
  () => route.fullPath,
  async () => {
    await nextTick();
    utama.value?.focus();
    pengumuman.value = `Halaman ${route.meta.judul ?? ""} dimuat`;
  }
);

function keluar() {
  auth.logout();
  router.push({ name: "katalog" });
}
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
      <RouterLink v-if="adalahAdmin" :to="{ name: 'admin-produk' }">Kelola Produk</RouterLink>
      <template v-if="masuk">
        <span class="lencana">{{ pengguna?.nama }}</span>
        <button type="button" class="sekunder" @click="keluar">Keluar</button>
      </template>
      <RouterLink v-else :to="{ name: 'login' }">Masuk</RouterLink>
    </nav>
  </header>

  <main id="konten" ref="utama" tabindex="-1">
    <RouterView />
  </main>

  <p class="sr-only" role="status" aria-live="polite">{{ pengumuman }}</p>
</template>
