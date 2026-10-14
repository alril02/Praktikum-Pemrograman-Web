import { createRouter, createWebHistory } from "vue-router";
import { useCartStore } from "../stores/cart.js";
import { useAuthStore } from "../stores/auth.js";
import KatalogView from "../views/KatalogView.vue";

// Guard di klien hanyalah PENGALAMAN PENGGUNA. Otorisasi sesungguhnya ditegakkan server.
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
      meta: { judul: "Checkout", butuhKeranjang: true, butuhLogin: true },
    },
    {
      path: "/masuk",
      name: "login",
      component: () => import("../views/LoginView.vue"),
      meta: { judul: "Masuk" },
    },
    {
      path: "/admin/produk",
      name: "admin-produk",
      component: () => import("../views/AdminProdukView.vue"),
      meta: { judul: "Kelola Produk", butuhLogin: true, peran: "admin" },
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
  const auth = useAuthStore();

  if (to.meta.butuhLogin && !auth.masuk) {
    return { name: "login", query: { next: to.fullPath } };
  }
  if (to.meta.peran && auth.pengguna?.peran !== to.meta.peran) {
    return { name: "katalog" };
  }
  if (to.meta.butuhKeranjang && useCartStore().jumlahItem === 0) {
    return { name: "keranjang", query: { info: "kosong" } };
  }
  return true;
});

router.afterEach((to) => {
  document.title = `${to.meta.judul ?? "Toko UMKM"} — Toko UMKM`;
});
