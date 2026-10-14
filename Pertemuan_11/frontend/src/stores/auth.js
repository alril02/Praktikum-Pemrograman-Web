// Store sesi pengguna.  Uji dengan:  npm test  (tests/auth.store.test.mjs)
//
// Keputusan desain: token disimpan di MEMORI (bukan localStorage) agar tidak dapat dicuri dari
// storage persisten. Konsekuensinya sesi hilang saat muat ulang (kompromi yang disengaja).
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { api } from "../api.js";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(null);
  const pengguna = ref(null);

  // TODO 1: true bila token ada
  const masuk = computed(() => false);

  // TODO 2: true bila pengguna?.peran === "admin"
  const adalahAdmin = computed(() => false);

  // TODO 3: login(email, password)
  //   - api.post("/auth/masuk", { email, password }, { tanpaAuth: true })
  //     (tanpaAuth: 401 karena sandi salah TIDAK boleh memicu logout/redirect)
  //   - sukses: token.value = hasil.data.token ; pengguna.value = hasil.data.pengguna
  //   - gagal : biarkan galat (ApiError) merambat; state tetap kosong
  async function login(email, password) {
    void [api, email, password];
  }

  // TODO 4: kosongkan token dan pengguna
  function logout() {}

  return { token, pengguna, masuk, adalahAdmin, login, logout };
});
