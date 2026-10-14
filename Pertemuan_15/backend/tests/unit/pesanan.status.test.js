import { describe, it, expect } from "vitest";
import { bolehTransisi, statusDariEvent, putuskanTransisi } from "../../src/domain/pesanan.status.js";

describe("pesanan.status", () => {
  describe("bolehTransisi", () => {
    it.each([
      ["menunggu_pembayaran", "dibayar"],
      ["menunggu_pembayaran", "kedaluwarsa"],
      ["dibayar", "dikirim"],
      ["dikirim", "selesai"],
    ])("mengizinkan %s -> %s", (dari, ke) => {
      expect(bolehTransisi(dari, ke)).toBe(true);
    });

    it.each([
      ["kedaluwarsa", "dibayar"],
      ["gagal", "dibayar"],
      ["dibayar", "menunggu_pembayaran"],
      ["selesai", "dikirim"],
    ])("menolak %s -> %s", (dari, ke) => {
      expect(bolehTransisi(dari, ke)).toBe(false);
    });
  });

  describe("statusDariEvent", () => {
    it("memetakan jenis peristiwa gateway ke status", () => {
      expect(statusDariEvent("charge.paid")).toBe("dibayar");
      expect(statusDariEvent("charge.expired")).toBe("kedaluwarsa");
      expect(statusDariEvent("charge.failed")).toBe("gagal");
    });

    it("mengembalikan null untuk peristiwa tak dikenal", () => {
      expect(statusDariEvent("charge.refunded")).toBeNull();
    });
  });

  describe("putuskanTransisi", () => {
    it("menerapkan transisi yang sah", () => {
      expect(putuskanTransisi("menunggu_pembayaran", "dibayar")).toBe("terapkan");
    });

    it("mengabaikan peristiwa duplikat (idempoten)", () => {
      expect(putuskanTransisi("dibayar", "dibayar")).toBe("abaikan");
    });

    it("meminta rekonsiliasi untuk paid setelah kedaluwarsa", () => {
      expect(putuskanTransisi("kedaluwarsa", "dibayar")).toBe("rekonsiliasi");
    });
  });
});
