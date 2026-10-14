// TUGAS: lengkapi tes berikut. Dua tes pertama adalah CONTOH; sisanya `it.todo` yang harus Anda tulis.
// Gunakan pola Arrange-Act-Assert, data unik per tes (buatProdukUji), dan jangan bergantung pada urutan tes.
import { describe, it, expect, beforeAll } from "vitest";
import { api, masuk, bearer, buatProdukUji } from "../helpers/client.js";

const BASE = "/api/v1/pesanan";

let admin;
let budi;
let sari;

beforeAll(async () => {
  admin = await masuk("admin");
  budi = await masuk("budi");
  sari = await masuk("sari");
});

const stok = async (id) => (await api().get(`/api/v1/produk/${id}`)).body.data.stok;

describe("POST /pesanan", () => {
  it("[CONTOH] checkout mengurangi stok dan menghitung total dari harga server", async () => {
    // Arrange
    const produk = await buatProdukUji(admin, { harga: 30000, stok: 10 });

    // Act
    const r = await api().post(BASE).set(bearer(budi.token)).send({ item: [{ produkId: produk.id, jumlah: 3 }] });

    // Assert
    expect(r.status).toBe(201);
    expect(r.body.data.total).toBe(90000);
    expect(r.body.data.item[0]).toMatchObject({ produkId: produk.id, jumlah: 3, hargaSatuan: 30000 });
    expect(await stok(produk.id)).toBe(7);
  });

  it("[CONTOH] pemilik pesanan berasal dari token, bukan dari body", async () => {
    const produk = await buatProdukUji(admin);

    const r = await api()
      .post(BASE)
      .set(bearer(budi.token))
      .send({ penggunaId: sari.pengguna.id, item: [{ produkId: produk.id, jumlah: 1 }] });

    expect(r.status).toBe(201);
    expect(r.body.data.pengguna.id).toBe(budi.pengguna.id);
  });

  it.todo("409 STOK_TIDAK_CUKUP ketika jumlah melebihi stok, dan stok tidak berubah");
  it.todo("atomik: item kedua gagal (stok 0) -> stok item pertama dikembalikan (rollback penuh)");
  it.todo("422 untuk item kosong, produk duplikat dalam satu pesanan, dan jumlah 0/1001");
  it.todo("401 tanpa token");
  it.todo("konkurensi: 5 request bersamaan pada stok 3 -> tepat 3 berhasil dan stok akhir 0 (tidak negatif)");
});

describe("GET /pesanan dan /pesanan/:id", () => {
  it.todo("pengguna biasa hanya melihat pesanan miliknya; admin melihat semua");
  it.todo("IDOR: pengguna lain membaca pesanan -> 404 (sama dengan id yang tidak ada)");
  it.todo("pemilik dan admin dapat membaca pesanan -> 200");
});
