// Contoh LENGKAP tes komponen: yang diuji adalah PERILAKU yang terlihat pengguna, bukan detail internal.
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ProductCard from "../src/components/ProductCard.vue";

const produk = (sebagian = {}) => ({ id: 1, nama: "Kopi Gayo 250g", harga: 65000, stok: 12, kategori: "kopi", ...sebagian });

function pasang(props) {
  return mount(ProductCard, {
    props,
    global: { stubs: { RouterLink: { props: ["to"], template: "<a><slot /></a>" } } },
  });
}

describe("ProductCard", () => {
  it("menampilkan nama, kategori, harga dalam rupiah, dan stok", () => {
    const w = pasang({ produk: produk() });
    const teks = w.text();

    expect(teks).toContain("Kopi Gayo 250g");
    expect(teks).toContain("kopi");
    expect(teks.replace(/\s/g, " ")).toMatch(/Rp\s?65\.000/);
    expect(teks).toContain("Stok: 12");
  });

  it("memancarkan 'tambah' dengan objek produk ketika tombol diklik", async () => {
    const p = produk();
    const w = pasang({ produk: p });

    await w.get("button").trigger("click");

    expect(w.emitted("tambah")).toHaveLength(1);
    expect(w.emitted("tambah")[0][0]).toEqual(p);
  });

  it("menonaktifkan tombol dan menampilkan 'Habis' bila stok 0", () => {
    const w = pasang({ produk: produk({ stok: 0 }) });

    expect(w.get("button").attributes("disabled")).toBeDefined();
    expect(w.text()).toContain("Habis");
  });

  it("tidak memancarkan event ketika tombol nonaktif", async () => {
    const w = pasang({ produk: produk({ stok: 0 }) });
    await w.get("button").trigger("click");
    expect(w.emitted("tambah")).toBeUndefined();
  });

  it("menonaktifkan tombol ketika jumlah di keranjang sudah mencapai stok", () => {
    const w = pasang({ produk: produk({ stok: 3 }), jumlah: 3 });

    expect(w.get("button").attributes("disabled")).toBeDefined();
    expect(w.text()).toContain("Stok penuh");
  });

  it("menampilkan jumlah di keranjang bila lebih dari nol", () => {
    const w = pasang({ produk: produk(), jumlah: 2 });
    expect(w.text()).toContain("Di keranjang: 2");
  });

  it("menampilkan nama produk berisi HTML sebagai teks (tidak dieksekusi)", () => {
    const jahat = "<img src=x onerror=alert(1)> Paket";
    const w = pasang({ produk: produk({ nama: jahat }) });

    expect(w.find("img").exists()).toBe(false);
    expect(w.text()).toContain("<img src=x onerror=alert(1)> Paket");
  });
});
