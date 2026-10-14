// KUNCI JAWABAN DOSEN - salin ke src/lib/aman.js
export function pathInternal(next, cadangan = "/") {
  if (typeof next !== "string") return cadangan;
  if (!next.startsWith("/")) return cadangan;
  if (next.startsWith("//") || next.startsWith("/\\")) return cadangan;
  if (/[\u0000-\u001f\u007f\\]/.test(next)) return cadangan;
  return next;
}
