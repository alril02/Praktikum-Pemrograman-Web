// KUNCI JAWABAN DOSEN - salin ke tests-unit/LoginView.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import LoginView from "../src/views/LoginView.vue";
import { pasangAuth } from "../src/api.js";

const jawab = (status, body) => () =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

async function pasang(next) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "katalog", component: { template: "<div>beranda</div>" } },
      { path: "/admin/produk", component: { template: "<div>admin</div>" } },
      { path: "/masuk", name: "login", component: LoginView },
    ],
  });
  await router.push({ path: "/masuk", query: next ? { next } : {} });
  await router.isReady();
  const w = mount(LoginView, { global: { plugins: [pinia, router] } });
  return { w, router };
}

async function isi(w, email, password) {
  await w.get("#email").setValue(email);
  await w.get("#password").setValue(password);
}

beforeEach(() => pasangAuth({ token: () => null, onTidakSah: () => {} }));
afterEach(() => vi.unstubAllGlobals());

describe("LoginView", () => {
  it("menampilkan pesan generik ketika server membalas 401", async () => {
    vi.stubGlobal("fetch", vi.fn(jawab(401, { error: { kode: "KREDENSIAL_SALAH", pesan: "Email atau kata sandi salah" } })));
    const { w } = await pasang();

    await isi(w, "budi@contoh.id", "salah-salah");
    await w.get("form").trigger("submit");
    await flushPromises();

    expect(w.text()).toContain("Email atau kata sandi salah.");
  });

  it("tidak mengirim request bila email/kata sandi kosong", async () => {
    const f = vi.fn(jawab(200, {}));
    vi.stubGlobal("fetch", f);
    const { w } = await pasang();

    await w.get("form").trigger("submit");
    await flushPromises();

    expect(f).not.toHaveBeenCalled();
    expect(w.text()).toMatch(/wajib diisi/i);
  });

  it("setelah sukses mengalihkan ke path `next` internal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(jawab(200, { data: { token: "T", pengguna: { id: 1, nama: "Admin", email: "a@b.c", peran: "admin" } } }))
    );
    const { w, router } = await pasang("/admin/produk");

    await isi(w, "admin@contoh.id", "AdminRahasia#2026");
    await w.get("form").trigger("submit");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/admin/produk");
  });

  it("mengabaikan `next` eksternal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(jawab(200, { data: { token: "T", pengguna: { id: 2, nama: "Budi", email: "b@b.c", peran: "user" } } }))
    );
    const { w, router } = await pasang("https://situs-jahat.example");

    await isi(w, "budi@contoh.id", "BudiRahasia#2026");
    await w.get("form").trigger("submit");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/");
  });

  it("menonaktifkan tombol selama request berlangsung", async () => {
    let selesai;
    vi.stubGlobal("fetch", vi.fn(() => new Promise((r) => (selesai = r))));
    const { w } = await pasang();

    await isi(w, "budi@contoh.id", "BudiRahasia#2026");
    await w.get("form").trigger("submit");
    await flushPromises();
    expect(w.get("button[type=submit]").attributes("disabled")).toBeDefined();

    selesai(new Response(JSON.stringify({ error: { pesan: "x" } }), { status: 401 }));
    await flushPromises();
    expect(w.get("button[type=submit]").attributes("disabled")).toBeUndefined();
  });
});
