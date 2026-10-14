// Contoh LENGKAP: tes integrasi webhook (tanda tangan, idempotensi, state machine) dengan `fetch` palsu untuk gateway.
import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { api, masuk, bearer, buatProdukUji } from "../helpers/client.js";
import { tandatangani } from "../../src/utils/signature.js";
import { prisma } from "../../src/lib/prisma.js";

const RAHASIA = process.env.GATEWAY_WEBHOOK_SECRET;
const URL_WEBHOOK = "/api/v1/webhook/gateway";

let admin;
let budi;

beforeAll(async () => {
  admin = await masuk("admin");
  budi = await masuk("budi");
});

afterEach(() => {
  vi.unstubAllGlobals(); // jangan biarkan stub bocor ke tes lain
});

// Gateway palsu: selalu membuat charge baru dengan ID unik
function pasangGatewayPalsu() {
  let n = 0;
  const palsu = vi.fn(async (url, opsi) => {
    n++;
    const body = JSON.parse(opsi.body);
    return new Response(
      JSON.stringify({ id: `ch_uji${Date.now().toString(16)}${n}`, amount: body.amount, order_ref: body.order_ref, status: "pending", payment_url: "https://pay.uji.local/x" }),
      { status: 201, headers: { "content-type": "application/json" } }
    );
  });
  vi.stubGlobal("fetch", palsu);
  return palsu;
}

async function pesananMenungguBayar() {
  const produk = await buatProdukUji(admin, { harga: 25000, stok: 10 });
  const p = (
    await api().post("/api/v1/pesanan").set(bearer(budi.token)).send({ item: [{ produkId: produk.id, jumlah: 2 }] })
  ).body.data;
  const gateway = pasangGatewayPalsu();
  const b = (await api().post(`/api/v1/pesanan/${p.id}/bayar`).set(bearer(budi.token))).body.data;
  return { produk, pesanan: p, chargeId: b.chargeId, gateway };
}

const event = (jenis, { chargeId, pesanan, amount = pesanan.total, id = `evt_${Math.random().toString(16).slice(2)}` }) =>
  JSON.stringify({
    id,
    type: jenis,
    created: Math.floor(Date.now() / 1000),
    data: { charge_id: chargeId, order_ref: String(pesanan.id), amount, status: "x" },
  });

const kirim = (raw, header) =>
  api()
    .post(URL_WEBHOOK)
    .set("Content-Type", "application/json")
    .set("X-Signature", header ?? tandatangani(raw, RAHASIA))
    .send(raw);

describe("POST /pesanan/:id/bayar", () => {
  it("memanggil gateway dengan API key dan Idempotency-Key yang benar", async () => {
    const { pesanan, gateway } = await pesananMenungguBayar();

    expect(gateway).toHaveBeenCalledTimes(1);
    const [url, opsi] = gateway.mock.calls[0];
    expect(url).toMatch(/\/v1\/charges$/);
    expect(opsi.headers.Authorization).toBe(`Bearer ${process.env.GATEWAY_API_KEY}`);
    expect(opsi.headers["Idempotency-Key"]).toBe(`pesanan-${pesanan.id}`);
    expect(JSON.parse(opsi.body)).toEqual({ amount: pesanan.total, order_ref: String(pesanan.id) });
  });

  it("idempoten: pemanggilan kedua tidak memanggil gateway lagi", async () => {
    const { pesanan, chargeId, gateway } = await pesananMenungguBayar();

    const r = await api().post(`/api/v1/pesanan/${pesanan.id}/bayar`).set(bearer(budi.token));

    expect(r.status).toBe(200);
    expect(r.body.data.chargeId).toBe(chargeId);
    expect(gateway).toHaveBeenCalledTimes(1);
  });

  it("502 bila gateway menolak, dan tidak membocorkan detail vendor", async () => {
    const produk = await buatProdukUji(admin);
    const p = (await api().post("/api/v1/pesanan").set(bearer(budi.token)).send({ item: [{ produkId: produk.id, jumlah: 1 }] })).body.data;
    vi.stubGlobal("fetch", vi.fn(async () => new Response('{"rahasia":"detail internal vendor"}', { status: 503 })));

    const r = await api().post(`/api/v1/pesanan/${p.id}/bayar`).set(bearer(budi.token));

    expect(r.status).toBe(502);
    expect(r.body.error.kode).toBe("GATEWAY_ERROR");
    expect(JSON.stringify(r.body)).not.toContain("detail internal vendor");
  });
});

describe("POST /webhook/gateway", () => {
  it("menerima paid bertanda tangan benar -> pesanan dibayar dan job outbox tercatat", async () => {
    const { pesanan, chargeId } = await pesananMenungguBayar();

    const r = await kirim(event("charge.paid", { chargeId, pesanan }));

    expect(r.status).toBe(200);
    expect(r.body.status).toBe("diterapkan");

    const dibaca = await api().get(`/api/v1/pesanan/${pesanan.id}`).set(bearer(budi.token));
    expect(dibaca.body.data.status).toBe("dibayar");

    const jobs = await prisma.job.findMany({ where: { kunciUnik: { in: [`email:${pesanan.id}`, `invoice:${pesanan.id}`] } } });
    expect(jobs).toHaveLength(2);
  });

  it("401 untuk tanda tangan salah dan status tidak berubah", async () => {
    const { pesanan, chargeId } = await pesananMenungguBayar();
    const raw = event("charge.paid", { chargeId, pesanan });

    const r = await kirim(raw, tandatangani(raw, "rahasia-lain-yang-salah-123456"));

    expect(r.status).toBe(401);
    const dibaca = await api().get(`/api/v1/pesanan/${pesanan.id}`).set(bearer(budi.token));
    expect(dibaca.body.data.status).toBe("menunggu_pembayaran");
  });

  it("401 untuk replay (timestamp 1 jam lalu) walau tanda tangan sah", async () => {
    const { pesanan, chargeId } = await pesananMenungguBayar();
    const raw = event("charge.paid", { chargeId, pesanan });

    const r = await kirim(raw, tandatangani(raw, RAHASIA, Math.floor(Date.now() / 1000) - 3600));

    expect(r.status).toBe(401);
  });

  it("idempoten: ID peristiwa yang sama dikirim dua kali -> duplikat dan satu set job", async () => {
    const { pesanan, chargeId } = await pesananMenungguBayar();
    const raw = event("charge.paid", { chargeId, pesanan, id: "evt_dobel_uji_" + pesanan.id });

    const a = await kirim(raw);
    const b = await kirim(raw);

    expect(a.body.status).toBe("diterapkan");
    expect(b.status).toBe(200);
    expect(b.body.status).toBe("duplikat");
    expect(await prisma.job.count({ where: { kunciUnik: `email:${pesanan.id}` } })).toBe(1);
  });

  it("jumlah tidak cocok -> 200 diabaikan, status tetap menunggu", async () => {
    const { pesanan, chargeId } = await pesananMenungguBayar();

    const r = await kirim(event("charge.paid", { chargeId, pesanan, amount: 1 }));

    expect(r.body.status).toBe("jumlah_tidak_cocok");
    const dibaca = await api().get(`/api/v1/pesanan/${pesanan.id}`).set(bearer(budi.token));
    expect(dibaca.body.data.status).toBe("menunggu_pembayaran");
  });

  it("expired mengembalikan stok; paid sesudahnya hanya ditandai rekonsiliasi", async () => {
    const { produk, pesanan, chargeId } = await pesananMenungguBayar();
    const stokSetelahPesan = (await api().get(`/api/v1/produk/${produk.id}`)).body.data.stok;
    expect(stokSetelahPesan).toBe(8);

    const exp = await kirim(event("charge.expired", { chargeId, pesanan }));
    expect(exp.body.status).toBe("diterapkan");

    const stokAkhir = (await api().get(`/api/v1/produk/${produk.id}`)).body.data.stok;
    expect(stokAkhir).toBe(10);

    const paid = await kirim(event("charge.paid", { chargeId, pesanan }));
    expect(paid.body.status).toBe("rekonsiliasi");
    const dibaca = await api().get(`/api/v1/pesanan/${pesanan.id}`).set(bearer(budi.token));
    expect(dibaca.body.data.status).toBe("kedaluwarsa");
    expect(dibaca.body.data.catatan).toBeTruthy();
  });
});
