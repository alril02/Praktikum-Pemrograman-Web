// TUGAS: lengkapi tes komponen LoginView. Gunakan fetch palsu (vi.stubGlobal) dan router in-memory.
import { describe, it } from "vitest";
// import { mount, flushPromises } from "@vue/test-utils";
// import { createPinia, setActivePinia } from "pinia";
// import { createRouter, createMemoryHistory } from "vue-router";
// import LoginView from "../src/views/LoginView.vue";
// import { pasangAuth } from "../src/api.js";

describe("LoginView", () => {
  it.todo("menampilkan pesan generik 'Email atau kata sandi salah.' ketika server membalas 401");
  it.todo("tidak mengirim request dan menampilkan galat bila email/kata sandi kosong");
  it.todo("setelah login sukses mengalihkan ke path `next` yang INTERNAL");
  it.todo("mengabaikan `next` eksternal (https://situs-jahat.example) dan mengalihkan ke '/'");
  it.todo("menonaktifkan tombol 'Masuk' selama request berlangsung (cegah kirim ganda)");
});
