<script setup>
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useCartStore } from "../stores/cart.js";
import { api, pesanGalat } from "../api.js";

const router = useRouter();
const cart = useCartStore();
const { jumlahItem, total, itemUntukServer } = storeToRefs(cart);

const penggunaId = ref(1); // sementara: autentikasi baru ditambahkan pada pertemuan 10
const mengirim = ref(false);
const galat = ref("");
const galatField = ref({});
const sukses = ref(null);

const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

// TODO: kirim pesanan.
//   1. cegah pengiriman ganda: return bila mengirim.value; set true, dan set false pada finally
//   2. api.post("/pesanan", { penggunaId: Number(penggunaId.value), item: itemUntukServer.value })
//      (HANYA produkId + jumlah; harga dan stok dihitung server)
//   3. sukses -> sukses.value = data pesanan; cart.kosongkan()
//   4. ApiError 422 -> petakan error.detail ke galatField (field -> pesan)
//   5. ApiError 409 -> galat.value = pesan server (mis. stok tidak cukup); sarankan kembali ke keranjang
//   6. lainnya -> galat.value = pesanGalat(e)
async function kirim() {
  galat.value = "Belum diimplementasikan";
  void [router, api, pesanGalat, galatField, sukses, mengirim];
}
</script>

<template>
  <h1>Checkout</h1>

  <div v-if="sukses" class="pesan sukses" role="status">
    <p>Pesanan #{{ sukses.id }} berhasil dibuat. Total: {{ rupiah(sukses.total) }}.</p>
    <RouterLink class="tombol" :to="{ name: 'katalog' }">Kembali ke katalog</RouterLink>
  </div>

  <template v-else>
    <p>{{ jumlahItem }} item · Total perkiraan {{ rupiah(total) }}</p>

    <form novalidate @submit.prevent="kirim">
      <div>
        <label for="pengguna">ID pengguna (sementara)</label>
        <input id="pengguna" v-model="penggunaId" type="number" min="1" :aria-invalid="Boolean(galatField.penggunaId)" />
        <p v-if="galatField.penggunaId" class="kolom-galat">{{ galatField.penggunaId }}</p>
      </div>

      <p v-if="galat" class="pesan galat" role="alert" style="margin-top: 1rem">
        {{ galat }}
        <RouterLink :to="{ name: 'keranjang' }">Periksa keranjang</RouterLink>
      </p>

      <p style="margin-top: 1rem">
        <button type="submit" :disabled="mengirim">{{ mengirim ? "Mengirim…" : "Buat pesanan" }}</button>
      </p>
    </form>
  </template>
</template>
