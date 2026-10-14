<script setup>
import { RouterLink } from "vue-router";
</script>

<template>
  <h1>Halaman tidak ditemukan</h1>
  <p>Alamat yang Anda tuju tidak tersedia.</p>
  <p><RouterLink class="tombol" :to="{ name: 'katalog' }">Kembali ke katalog</RouterLink></p>
</template>
