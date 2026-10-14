// KUNCI JAWABAN DOSEN - salin ke src/domain/pesanan.status.js
export const STATUS = {
  MENUNGGU: "menunggu_pembayaran",
  DIBAYAR: "dibayar",
  DIKIRIM: "dikirim",
  SELESAI: "selesai",
  KEDALUWARSA: "kedaluwarsa",
  GAGAL: "gagal",
};

export const TRANSISI = {
  [STATUS.MENUNGGU]: [STATUS.DIBAYAR, STATUS.KEDALUWARSA, STATUS.GAGAL],
  [STATUS.DIBAYAR]: [STATUS.DIKIRIM],
  [STATUS.DIKIRIM]: [STATUS.SELESAI],
  [STATUS.SELESAI]: [],
  [STATUS.KEDALUWARSA]: [],
  [STATUS.GAGAL]: [],
};

export function bolehTransisi(dari, ke) {
  return Object.hasOwn(TRANSISI, dari) && TRANSISI[dari].includes(ke);
}

export function statusDariEvent(jenis) {
  switch (jenis) {
    case "charge.paid":
      return STATUS.DIBAYAR;
    case "charge.expired":
      return STATUS.KEDALUWARSA;
    case "charge.failed":
      return STATUS.GAGAL;
    default:
      return null;
  }
}

export function putuskanTransisi(statusSaatIni, target) {
  if (target === null || target === undefined) return "abaikan";
  if (statusSaatIni === target) return "abaikan";
  if (bolehTransisi(statusSaatIni, target)) return "terapkan";
  return "rekonsiliasi";
}
