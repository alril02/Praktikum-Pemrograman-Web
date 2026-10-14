<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";
import { ApiError, pesanGalat } from "../api.js";
import { pathInternal } from "../lib/aman.js";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const email = ref("");
const password = ref("");
const mengirim = ref(false);
const galat = ref("");

async function kirim() {
  if (mengirim.value) return;
  galat.value = "";

  if (!email.value.trim() || !password.value) {
    galat.value = "Email dan kata sandi wajib diisi.";
    return;
  }

  mengirim.value = true;
  try {
    await auth.login(email.value.trim(), password.value);
    // `next` berasal dari URL (tidak tepercaya): hanya path internal yang diterima
    await router.replace(pathInternal(route.query.next, "/"));
  } catch (e) {
    // Pesan generik untuk 401: tidak membocorkan keberadaan akun
    galat.value =
      e instanceof ApiError && e.status === 401 ? "Email atau kata sandi salah." : pesanGalat(e);
  } finally {
    mengirim.value = false;
  }
}
</script>

<template>
  <h1>Masuk</h1>

  <p v-if="route.query.info === 'sesi-berakhir'" class="pesan" role="status">
    Sesi Anda berakhir. Silakan masuk kembali.
  </p>

  <form novalidate @submit.prevent="kirim" style="max-width: 24rem; display: grid; gap: 1rem">
    <div>
      <label for="email">Email</label>
      <input id="email" v-model="email" type="email" autocomplete="username" required />
    </div>
    <div>
      <label for="password">Kata sandi</label>
      <input id="password" v-model="password" type="password" autocomplete="current-password" required />
    </div>

    <p v-if="galat" class="pesan galat" role="alert">{{ galat }}</p>

    <button type="submit" :disabled="mengirim">{{ mengirim ? "Memproses…" : "Masuk" }}</button>
  </form>
</template>
