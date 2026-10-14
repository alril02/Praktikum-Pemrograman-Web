import { createRouter, createWebHistory } from "vue-router";
import { useCartStore } from "../stores/cart.js";

import KatalogView from "../views/KatalogView.vue";
import ProdukDetailView from "../views/ProdukDetailView.vue";
import KeranjangView from "../views/KeranjangView.vue";
import CheckoutView from "../views/CheckoutView.vue";
import NotFoundView from "../views/NotFoundView.vue";

// TODO 1: ubah impor halaman selain Katalog menjadi lazy loading:
//   component: () => import("../views/KeranjangView.vue")
//   (hapus impor statis di atas yang tidak lagi dipakai)

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "katalog", component: KatalogView, meta: { judul: "Katalog" } },

    // TODO 2: batasi :id hanya angka -> "/produk/:id(\\d+)" dan teruskan sebagai props (props: true)
    { path: "/produk/:id", name: "produk", component: ProdukDetailView, meta: { judul: "Detail Produk" } },

    { path: "/keranjang", name: "keranjang", component: KeranjangView, meta: { judul: "Keranjang" } },

    // TODO 3: tambahkan meta: { butuhKeranjang: true } agar guard dapat membaca
    { path: "/checkout", name: "checkout", component: CheckoutView, meta: { judul: "Checkout" } },

    // TODO 4: catch-all 404 untuk path yang tak cocok: "/:pathMatch(.*)*"  (name: "tidak-ditemukan")
  ],

  // TODO 5: pulihkan posisi gulir saat Back/Forward, selain itu ke atas:  (to, from, saved) => saved ?? { top: 0 }
  scrollBehavior() {
    return { top: 0 };
  },
});

// TODO 6: guard. Jika to.meta.butuhKeranjang dan keranjang kosong,
//   kembalikan { name: "keranjang", query: { info: "kosong" } }.
//   Catatan: panggil useCartStore() DI DALAM fungsi guard (bukan di level modul).
router.beforeEach((to) => {
  void useCartStore;
  return true;
});

// TODO 7: perbarui document.title -> `${to.meta.judul ?? "Toko UMKM"} — Toko UMKM`
router.afterEach((to) => {
  void to;
});
