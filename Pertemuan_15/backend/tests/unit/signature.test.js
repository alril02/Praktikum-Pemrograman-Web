import { describe, it, expect } from "vitest";
import { tandatangani, verifikasiTandaTangan } from "../../src/utils/signature.js";

const RAHASIA = "whsec_uji_1234567890abcdef";
const BODY = JSON.stringify({ id: "evt_1", type: "charge.paid", data: { amount: 1000 } });
const T = 1_760_000_000;
const SEKARANG = T * 1000;

describe("verifikasiTandaTangan", () => {
  it("menerima tanda tangan yang benar", () => {
    const header = tandatangani(BODY, RAHASIA, T);
    expect(verifikasiTandaTangan(BODY, header, RAHASIA, { sekarang: SEKARANG })).toBe(true);
  });

  it("menolak body yang dimodifikasi", () => {
    const header = tandatangani(BODY, RAHASIA, T);
    expect(verifikasiTandaTangan(BODY.replace("1000", "9999"), header, RAHASIA, { sekarang: SEKARANG })).toBe(false);
  });

  it("menolak timestamp di luar toleransi (replay)", () => {
    const header = tandatangani(BODY, RAHASIA, T);
    expect(verifikasiTandaTangan(BODY, header, RAHASIA, { sekarang: (T + 3600) * 1000 })).toBe(false);
  });

  it.each(["", "abc", "t=abc,v1=zzz", `t=${T}`, `t=${T},v1=00`])("tidak melempar galat untuk header rusak: %j", (h) => {
    expect(verifikasiTandaTangan(BODY, h, RAHASIA, { sekarang: SEKARANG })).toBe(false);
  });
});
