<!-- KUNCI JAWABAN DOSEN - salin ke src/views/AdminProdukView.vue -->
<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from "vue";
import { api, ApiError, pesanGalat, urlAset } from "../api.js";
import { validasiProduk, KATEGORI } from "../lib/validasiProduk.js";

const BATAS_BYTE = 2 * 1024 * 1024;
const TIPE_DIIZINKAN = ["image/png", "image/jpeg", "image/webp"];

// ---------- State ----------
const daftar = ref([]);
const status = ref("loading"); // loading | success | empty | error
const galatMuat = ref("");

const mode = ref("tambah"); // tambah | ubah
const idEdit = ref(null);
const form = reactive({ nama: "", harga: "", stok: "", kategori: "kopi", deskripsi: "" });

const galat = ref({}); // { field: pesan }
const galatUmum = ref("");
const sukses = ref("");
const mengirim = ref(false);

const berkas = ref(null);
const pratinjau = ref("");
const galatBerkas = ref("");

const ringkasanEl = ref(null);
let pengendali = null;

const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

// ---------- Muat daftar ----------
async function muat() {
  pengendali?.abort();
  pengendali = new AbortController();
  status.value = "loading";
  try {
    const hasil = await api.get("/produk?batas=100", { signal: pengendali.signal });
    daftar.value = hasil.data;
    status.value = hasil.data.length ? "success" : "empty";
  } catch (e) {
    if (e.name === "AbortError") return;
    galatMuat.value = pesanGalat(e);
    status.value = "error";
  }
}

onMounted(muat);
onUnmounted(() => {
  pengendali?.abort();
  if (pratinjau.value) URL.revokeObjectURL(pratinjau.value);
});

// ---------- Form ----------
function resetForm() {
  mode.value = "tambah";
  idEdit.value = null;
  Object.assign(form, { nama: "", harga: "", stok: "", kategori: "kopi", deskripsi: "" });
  galat.value = {};
  galatUmum.value = "";
  bersihkanBerkas();
}

function mulaiUbah(p) {
  mode.value = "ubah";
  idEdit.value = p.id;
  Object.assign(form, {
    nama: p.nama,
    harga: String(p.harga),
    stok: String(p.stok),
    kategori: p.kategori,
    deskripsi: p.deskripsi ?? "",
  });
  galat.value = {};
  galatUmum.value = "";
  sukses.value = "";
  bersihkanBerkas();
}

function bersihkanBerkas() {
  if (pratinjau.value) URL.revokeObjectURL(pratinjau.value);
  berkas.value = null;
  pratinjau.value = "";
  galatBerkas.value = "";
}

// Pemeriksaan cepat sisi klien (UX). Server tetap memeriksa ISI berkas (magic bytes).
function pilihBerkas(event) {
  bersihkanBerkas();
  const f = event.target.files?.[0];
  if (!f) return;
  if (!TIPE_DIIZINKAN.includes(f.type)) {
    galatBerkas.value = "Gunakan gambar JPEG, PNG, atau WebP.";
    event.target.value = "";
    return;
  }
  if (f.size > BATAS_BYTE) {
    galatBerkas.value = "Ukuran gambar maksimal 2 MB.";
    event.target.value = "";
    return;
  }
  berkas.value = f;
  pratinjau.value = URL.createObjectURL(f);
}

async function fokusGalat() {
  await nextTick();
  ringkasanEl.value?.focus();
}

async function unggah(id) {
  const fd = new FormData();
  fd.append("gambar", berkas.value);
  return api.post(`/produk/${id}/gambar`, fd);
}

async function simpan() {
  if (mengirim.value) return;
  sukses.value = "";
  galatUmum.value = "";

  const cek = validasiProduk(form);
  galat.value = cek.galat;
  if (!cek.valid) {
    await fokusGalat();
    return;
  }

  mengirim.value = true;
  try {
    const hasil =
      mode.value === "tambah"
        ? await api.post("/produk", cek.data)
        : await api.patch(`/produk/${idEdit.value}`, cek.data);

    if (berkas.value) await unggah(hasil.data.id);

    sukses.value = "Produk berhasil disimpan.";
    resetForm();
    await muat();
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) {
      galat.value = e.galatField; // galat dari server dipetakan ke field
      galatUmum.value = Object.keys(galat.value).length ? "" : e.message;
      await fokusGalat();
    } else {
      galatUmum.value = pesanGalat(e);
    }
  } finally {
    mengirim.value = false;
  }
}

async function hapus(p) {
  if (!window.confirm(`Hapus "${p.nama}"?`)) return;
  sukses.value = "";
  galatUmum.value = "";
  try {
    await api.delete(`/produk/${p.id}`);
    sukses.value = "Produk dihapus.";
    await muat();
  } catch (e) {
    galatUmum.value =
      e instanceof ApiError && e.status === 409
        ? "Produk sudah pernah dipesan dan tidak dapat dihapus."
        : pesanGalat(e);
  }
}

const adaGalat = () => Object.keys(galat.value).length > 0;
</script>

<template>
  <h1>Kelola Produk</h1>

  <p v-if="sukses" class="pesan sukses" role="status">{{ sukses }}</p>
  <p v-if="galatUmum" class="pesan galat" role="alert">{{ galatUmum }}</p>

  <section aria-labelledby="judul-form">
    <h2 id="judul-form">{{ mode === "tambah" ? "Tambah produk" : `Ubah produk #${idEdit}` }}</h2>

    <!-- Ringkasan galat: fokus dipindahkan ke sini setelah submit gagal -->
    <div
      v-if="adaGalat()"
      ref="ringkasanEl"
      class="pesan galat"
      role="alert"
      tabindex="-1"
      aria-labelledby="judul-ringkasan"
    >
      <h3 id="judul-ringkasan" style="margin: 0">Terdapat {{ Object.keys(galat).length }} kesalahan</h3>
      <ul>
        <li v-for="(pesan, field) in galat" :key="field">
          <a :href="`#f-${field}`">{{ pesan }}</a>
        </li>
      </ul>
    </div>

    <form novalidate style="display: grid; gap: 1rem; max-width: 32rem" @submit.prevent="simpan">
      <div>
        <label for="f-nama">Nama produk</label>
        <input
          id="f-nama"
          v-model="form.nama"
          :aria-invalid="Boolean(galat.nama)"
          :aria-describedby="galat.nama ? 'e-nama' : undefined"
          autocomplete="off"
        />
        <p v-if="galat.nama" id="e-nama" class="kolom-galat">{{ galat.nama }}</p>
      </div>

      <div>
        <label for="f-harga">Harga (Rp)</label>
        <input
          id="f-harga"
          v-model="form.harga"
          type="text"
          inputmode="numeric"
          :aria-invalid="Boolean(galat.harga)"
          :aria-describedby="galat.harga ? 'e-harga' : undefined"
        />
        <p v-if="galat.harga" id="e-harga" class="kolom-galat">{{ galat.harga }}</p>
      </div>

      <div>
        <label for="f-stok">Stok</label>
        <input
          id="f-stok"
          v-model="form.stok"
          type="text"
          inputmode="numeric"
          :aria-invalid="Boolean(galat.stok)"
          :aria-describedby="galat.stok ? 'e-stok' : undefined"
        />
        <p v-if="galat.stok" id="e-stok" class="kolom-galat">{{ galat.stok }}</p>
      </div>

      <div>
        <label for="f-kategori">Kategori</label>
        <select
          id="f-kategori"
          v-model="form.kategori"
          :aria-invalid="Boolean(galat.kategori)"
          :aria-describedby="galat.kategori ? 'e-kategori' : undefined"
        >
          <option v-for="k in KATEGORI" :key="k" :value="k">{{ k }}</option>
        </select>
        <p v-if="galat.kategori" id="e-kategori" class="kolom-galat">{{ galat.kategori }}</p>
      </div>

      <div>
        <label for="f-deskripsi">Deskripsi (opsional)</label>
        <textarea
          id="f-deskripsi"
          v-model="form.deskripsi"
          rows="3"
          :aria-invalid="Boolean(galat.deskripsi)"
          :aria-describedby="galat.deskripsi ? 'e-deskripsi' : undefined"
        ></textarea>
        <p v-if="galat.deskripsi" id="e-deskripsi" class="kolom-galat">{{ galat.deskripsi }}</p>
      </div>

      <div>
        <label for="f-gambar">Gambar (JPEG/PNG/WebP, maks. 2 MB)</label>
        <input id="f-gambar" type="file" accept="image/png,image/jpeg,image/webp" @change="pilihBerkas" />
        <p v-if="galatBerkas" class="kolom-galat" role="alert">{{ galatBerkas }}</p>
        <img
          v-if="pratinjau"
          :src="pratinjau"
          alt="Pratinjau gambar yang akan diunggah"
          style="max-width: 12rem; margin-top: 0.5rem"
        />
      </div>

      <p style="display: flex; gap: 0.5rem; margin: 0">
        <button type="submit" :disabled="mengirim">{{ mengirim ? "Menyimpan…" : "Simpan" }}</button>
        <button v-if="mode === 'ubah'" type="button" class="sekunder" @click="resetForm">Batal ubah</button>
      </p>
    </form>
  </section>

  <section aria-labelledby="judul-daftar" style="margin-top: 2rem">
    <h2 id="judul-daftar">Daftar produk</h2>

    <p v-if="status === 'loading'" class="pesan" role="status">Memuat produk…</p>
    <p v-else-if="status === 'error'" class="pesan galat" role="alert">
      {{ galatMuat }} <button type="button" class="sekunder" @click="muat">Coba lagi</button>
    </p>
    <p v-else-if="status === 'empty'" class="pesan">Belum ada produk.</p>

    <table v-else>
      <caption class="sr-only">Daftar produk</caption>
      <thead>
        <tr>
          <th scope="col">Gambar</th>
          <th scope="col">Nama</th>
          <th scope="col">Kategori</th>
          <th scope="col" class="angka">Harga</th>
          <th scope="col" class="angka">Stok</th>
          <th scope="col"><span class="sr-only">Aksi</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in daftar" :key="p.id">
          <td>
            <img
              v-if="p.gambar"
              :src="urlAset(p.gambar)"
              :alt="`Gambar ${p.nama}`"
              width="48"
              height="48"
              style="object-fit: cover"
            />
            <span v-else class="lencana">—</span>
          </td>
          <th scope="row">{{ p.nama }}</th>
          <td>{{ p.kategori }}</td>
          <td class="angka">{{ rupiah(p.harga) }}</td>
          <td class="angka">{{ p.stok }}</td>
          <td style="white-space: nowrap">
            <button type="button" class="sekunder" @click="mulaiUbah(p)">Ubah</button>
            <button type="button" class="sekunder" @click="hapus(p)">Hapus</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
