// Penutupan rapi (graceful shutdown).  Uji dengan:  npm test   (tests/shutdown.test.mjs)

// Dibaca oleh /siap: setelah shutdown dimulai, readiness mengembalikan 503 agar load balancer
// berhenti mengirim trafik baru.
export const status = { berhenti: false };

// TODO: tutup `server` (http.Server) dengan rapi dan kembalikan { paksa: boolean }.
//   1. status.berhenti = true
//   2. server.close(callback)           -> berhenti menerima koneksi BARU; callback dipanggil setelah semua koneksi selesai
//   3. server.closeIdleConnections?.() -> tutup koneksi keep-alive yang menganggur. ULANGI tiap ~100 ms (setInterval)
//      sampai server tertutup: koneksi yang tadinya sibuk baru menganggur SETELAH request-nya selesai.
//   4. batas waktu: setelah timeoutMs panggil server.closeAllConnections?.() dan tandai paksa = true
//   5. resolve ketika callback close dipanggil; bersihkan timer
//   Request yang sedang berjalan HARUS dibiarkan selesai selama belum melewati batas waktu.
export function tutupDenganRapi(server, { timeoutMs = 10_000 } = {}) {
  void [server, timeoutMs];
  return Promise.resolve({ paksa: false });
}

// Pemasangan sinyal (sudah jadi): panggil sekali pada server.js
export function pasangShutdown({ server, onTutup = async () => {}, timeoutMs = 10_000, proses = process, log = console.log }) {
  let sedang = false;
  const tangani = async (sinyal) => {
    if (sedang) return;
    sedang = true;
    log(JSON.stringify({ level: "info", pesan: "shutdown dimulai", sinyal }));
    try {
      const { paksa } = await tutupDenganRapi(server, { timeoutMs });
      await onTutup();
      log(JSON.stringify({ level: "info", pesan: "shutdown selesai", paksa }));
      proses.exit(0);
    } catch (e) {
      log(JSON.stringify({ level: "error", pesan: "shutdown gagal", galat: String(e) }));
      proses.exit(1);
    }
  };
  proses.on("SIGTERM", () => tangani("SIGTERM"));
  proses.on("SIGINT", () => tangani("SIGINT"));
}
