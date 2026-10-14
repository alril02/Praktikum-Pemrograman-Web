// KUNCI JAWABAN DOSEN - salin ke src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { useCartStore } from "../stores/cart.js";
import KatalogView from "../views/KatalogView.vue";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "katalog", component: KatalogView, meta: { judul: "Katalog" } },
    {
      path: "/produk/:id(\\d+)",
      name: "produk",
      component: () => import("../views/ProdukDetailView.vue"),
      props: true,
      meta: { judul: "Detail Produk" },
    },
    {
      path: "/keranjang",
      name: "keranjang",
      component: () => import("../views/KeranjangView.vue"),
      meta: { judul: "Keranjang" },
    },
    {
      path: "/checkout",
      name: "checkout",
      component: () => import("../views/CheckoutView.vue"),
      meta: { judul: "Checkout", butuhKeranjang: true },
    },
    {
      path: "/:pathMatch(.*)*",
      name: "tidak-ditemukan",
      component: () => import("../views/NotFoundView.vue"),
      meta: { judul: "Tidak ditemukan" },
    },
  ],
  scrollBehavior: (to, from, saved) => saved ?? { top: 0 },
});

router.beforeEach((to) => {
  if (to.meta.butuhKeranjang) {
    const cart = useCartStore();
    if (cart.jumlahItem === 0) return { name: "keranjang", query: { info: "kosong" } };
  }
  return true;
});

router.afterEach((to) => {
  document.title = `${to.meta.judul ?? "Toko UMKM"} — Toko UMKM`;
});
