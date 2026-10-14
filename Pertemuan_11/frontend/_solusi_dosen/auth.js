// KUNCI JAWABAN DOSEN - salin ke src/stores/auth.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { api } from "../api.js";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(null);
  const pengguna = ref(null);

  const masuk = computed(() => Boolean(token.value));
  const adalahAdmin = computed(() => pengguna.value?.peran === "admin");

  async function login(email, password) {
    const hasil = await api.post("/auth/masuk", { email, password }, { tanpaAuth: true });
    token.value = hasil.data.token;
    pengguna.value = hasil.data.pengguna;
  }

  function logout() {
    token.value = null;
    pengguna.value = null;
  }

  return { token, pengguna, masuk, adalahAdmin, login, logout };
});
