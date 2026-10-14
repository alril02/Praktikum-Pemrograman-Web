<script setup>
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useCartStore } from "../stores/cart.js";

const route = useRoute();
const cart = useCartStore();
const { items, jumlahItem, total } = storeToRefs(cart);

const daftar = computed(() => Object.values(items.value));
const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

function ubah(id, nilai) {
  cart.ubahJumlah(id, Number.parseInt(nilai, 10) || 0);
}
</script>

<template>
  <h1>Keranjang</h1>

  <p v-if="route.query.info === 'kosong'" class="pesan" role="status">
    Keranjang masih kosong. Tambahkan produk sebelum checkout.
  </p>

  <p v-if="daftar.length === 0" class="pesan">
    Keranjang kosong. <RouterLink :to="{ name: 'katalog' }">Lihat katalog</RouterLink>
  </p>

  <template v-else>
    <table>
      <caption class="sr-only">Isi keranjang</caption>
      <thead>
        <tr>
          <th scope="col">Produk</th>
          <th scope="col" class="angka">Harga</th>
          <th scope="col">Jumlah</th>
          <th scope="col" class="angka">Subtotal</th>
          <th scope="col"><span class="sr-only">Aksi</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="it in daftar" :key="it.produk.id">
          <th scope="row">{{ it.produk.nama }}</th>
          <td class="angka">{{ rupiah(it.produk.harga) }}</td>
          <td>
            <label class="sr-only" :for="`jml-${it.produk.id}`">Jumlah {{ it.produk.nama }}</label>
            <input
              :id="`jml-${it.produk.id}`"
              class="jumlah-input"
              type="number"
              min="0"
              :max="it.produk.stok"
              :value="it.jumlah"
              @change="ubah(it.produk.id, $event.target.value)"
            />
          </td>
          <td class="angka">{{ rupiah(it.jumlah * it.produk.harga) }}</td>
          <td><button type="button" class="sekunder" @click="cart.hapus(it.produk.id)">Hapus</button></td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th scope="row" colspan="3">Total ({{ jumlahItem }} item)</th>
          <td class="angka"><strong>{{ rupiah(total) }}</strong></td>
          <td></td>
        </tr>
      </tfoot>
    </table>

    <p class="aksi" style="margin-top: 1rem; display: flex; gap: .5rem">
      <RouterLink class="tombol" :to="{ name: 'checkout' }">Lanjut ke checkout</RouterLink>
      <button type="button" class="sekunder" @click="cart.kosongkan()">Kosongkan</button>
    </p>
  </template>
</template>
