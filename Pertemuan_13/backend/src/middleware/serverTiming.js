// Menambahkan header Server-Timing agar durasi sisi server terlihat di DevTools (tab Network > Timing).
export function serverTiming(req, res, next) {
  const mulai = process.hrtime.bigint();
  const asli = res.writeHead;

  res.writeHead = function (...args) {
    const ms = Number(process.hrtime.bigint() - mulai) / 1e6;
    if (!res.headersSent) res.setHeader("Server-Timing", `app;dur=${ms.toFixed(1)}`);
    return asli.apply(this, args);
  };
  next();
}
