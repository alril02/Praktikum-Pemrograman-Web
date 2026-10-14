// KUNCI JAWABAN DOSEN - salin ke src/lib/shutdown.js
export const status = { berhenti: false };

export function tutupDenganRapi(server, { timeoutMs = 10_000 } = {}) {
  status.berhenti = true;

  return new Promise((selesai) => {
    let paksa = false;

    const pemaksa = setTimeout(() => {
      paksa = true;
      server.closeAllConnections?.();
    }, timeoutMs);

    // Koneksi keep-alive yang TADINYA sibuk menjadi menganggur setelah request selesai; karena itu
    // pembersihan diulang berkala sampai server benar-benar tertutup.
    const pembersih = setInterval(() => server.closeIdleConnections?.(), 100);

    server.close(() => {
      clearTimeout(pemaksa);
      clearInterval(pembersih);
      selesai({ paksa });
    });

    server.closeIdleConnections?.();
  });
}

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
