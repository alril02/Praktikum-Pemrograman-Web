// State machine status pesanan (fungsi murni, mudah diuji).

export const STATUS = {
  MENUNGGU: "menunggu_pembayaran",
  DIBAYAR: "dibayar",
  DIKIRIM: "dikirim",
  SELESAI: "selesai",
  KEDALUWARSA: "kedaluwarsa",
  GAGAL: "gagal",
};

// Transisi yang diizinkan (sudah jadi)
export const TRANSISI = {
  [STATUS.MENUNGGU]: [STATUS.DIBAYAR, STATUS.KEDALUWARSA, STATUS.GAGAL],
  [STATUS.DIBAYAR]: [STATUS.DIKIRIM],
  [STATUS.DIKIRIM]: [STATUS.SELESAI],
  [STATUS.SELESAI]: [],
  [STATUS.KEDALUWARSA]: [],
  [STATUS.GAGAL]: [],
};

// TODO 1: true bila `ke` termasuk TRANSISI[dari]. Status tak dikenal -> false.
export function bolehTransisi(dari, ke) {
  return false;
}

// TODO 2: petakan jenis peristiwa gateway ke status target.
//   "charge.paid"    -> "dibayar"
//   "charge.expired" -> "kedaluwarsa"
//   "charge.failed"  -> "gagal"
//   lainnya          -> null
export function statusDariEvent(jenis) {
  return null;
}

// TODO 3: putuskan tindakan untuk peristiwa yang tiba.
//   - target null                                    -> "abaikan"
//   - statusSaatIni === target (sudah tercapai)      -> "abaikan"   (idempoten)
//   - bolehTransisi(statusSaatIni, target)           -> "terapkan"
//   - selain itu (mis. paid setelah kedaluwarsa)     -> "rekonsiliasi" (butuh keputusan manusia)
export function putuskanTransisi(statusSaatIni, target) {
  return "abaikan";
}
