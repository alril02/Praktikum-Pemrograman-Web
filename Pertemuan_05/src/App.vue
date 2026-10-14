<script setup>
// App adalah PEMILIK STATE. Anak hanya menerima props dan memancarkan event.
import { ref, computed, onMounted, onUnmounted } from "vue";
import ProductCard from "./components/ProductCard.vue";
import FilterBadge from "./components/FilterBadge.vue";
import CartCounter from "./components/CartCounter.vue";

// ---------- State ----------
const produk = ref([]);
const status = ref("loading");     // loading | success | empty | error
const galat = ref("");
const kata = ref("");
const kategoriDipilih = ref("semua");
const keranjang = ref({});          // { [idProduk]: jumlah }

let pengendali = null;

// ---------- Data ----------
async function muat() {
  // TODO 1: ambil "/products.json" dengan AbortController.
  //   - status.value = "loading"
  //   - !r.ok -> lempar Error(`HTTP ${r.status}`)
  //   - produk.value = data; status.value = data.length ? "success" : "empty"
  //   - catch: abaikan AbortError; selain itu status = "error", galat = pesan ramah
}

onMounted(muat);
onUnmounted(() => pengendali?.abort());   // pembersihan

// ---------- Turunan (computed) ----------
// TODO 2: kategoriUnik -> ["semua", ...kategori unik dari produk]
const kategoriUnik = computed(() => ["semua"]);

// TODO 3: terfilter -> produk yang cocok dengan kategoriDipilih dan kata (tidak peka huruf besar-kecil)
const terfilter = computed(() => produk.value);

// TODO 4: ringkasan -> { jumlah, total } dari keranjang (jumlah item dan jumlah harga*qty)
const ringkasan = computed(() => ({ jumlah: 0, total: 0 }));

// ---------- Aksi (dipicu event anak) ----------
function tambah(id) {
  // TODO 5: tambah 1 ke keranjang.value[id], tetapi tidak boleh melebihi stok produk
}

function kosongkan() {
  // TODO 6: kosongkan keranjang
}
</script>

<template>
  <header class="bar">
    <h1>Toko UMKM</h1>
    <CartCounter :jumlah="ringkasan.jumlah" :total="ringkasan.total" @kosongkan="kosongkan" />
  </header>

  <main>
    <section aria-label="Filter">
      <label for="cari">Cari produk</label>
      <input id="cari" v-model="kata" type="search" autocomplete="off" placeholder="mis. gayo" />

      <div class="badges" role="group" aria-label="Kategori">
        <!-- TODO 7: v-for pada kategoriUnik dengan :key, kirim :label dan :aktif, dengarkan @pilih -->
        <FilterBadge label="semua" :aktif="true" />
      </div>
    </section>

    <!-- TODO 8: empat keadaan dengan v-if / v-else-if / v-else -->
    <p v-if="status === 'loading'" role="status">Memuat produk…</p>

    <!-- TODO 9: v-for ProductCard dengan :key="p.id", :produk, :jumlah (keranjang[p.id] ?? 0), @tambah -->
    <section class="grid" aria-label="Daftar produk">
      <ProductCard v-for="p in terfilter" :key="p.id" :produk="p" />
    </section>
  </main>
</template>

<style scoped>
.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid var(--batas);
}
h1 { margin: 0; font-size: 1.25rem; }
main { width: min(100% - 2rem, 70rem); margin: 1.5rem auto; }
label { display: block; font-weight: 600; margin-bottom: 0.25rem; }
.badges { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0; }
.grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); }
</style>
