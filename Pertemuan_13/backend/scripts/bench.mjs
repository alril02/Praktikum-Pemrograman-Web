// Benchmark sederhana tanpa dependensi.
//   node scripts/bench.mjs <url> [jumlahRequest=200] [konkurensi=20] [header "Nama: nilai" ...]
//
// Contoh:
//   node scripts/bench.mjs "http://localhost:3000/api/v1/produk?batas=100" 300 20
//   node scripts/bench.mjs "http://localhost:3000/api/v1/produk?batas=100" 300 20 "Accept-Encoding: gzip"
//
// Mencetak: RPS, rata-rata, p50, p95, p99, galat, rasio X-Cache HIT, ukuran respons rata-rata.
// Gunakan untuk PERBANDINGAN RELATIF sebelum–sesudah di mesin dan kondisi yang sama.

const [url, n = "200", c = "20", ...hdr] = process.argv.slice(2);
if (!url) {
  console.error('Pemakaian: node scripts/bench.mjs <url> [jumlahRequest] [konkurensi] ["Header: nilai" ...]');
  process.exit(1);
}

const total = Number(n);
const konkurensi = Math.min(Number(c), total);
const headers = Object.fromEntries(hdr.map((h) => [h.slice(0, h.indexOf(":")).trim(), h.slice(h.indexOf(":") + 1).trim()]));

const latensi = [];
let galat = 0;
let hit = 0;
let byte = 0;
let berikut = 0;

async function pekerja() {
  while (true) {
    const i = berikut++;
    if (i >= total) return;
    const mulai = performance.now();
    try {
      const r = await fetch(url, { headers });
      const buf = await r.arrayBuffer();
      byte += buf.byteLength;
      if (!r.ok) galat++;
      if (r.headers.get("x-cache") === "HIT") hit++;
    } catch {
      galat++;
    }
    latensi.push(performance.now() - mulai);
  }
}

// Pemanasan 5 request (tidak dihitung)
for (let i = 0; i < 5; i++) await fetch(url, { headers }).then((r) => r.arrayBuffer()).catch(() => {});

const t0 = performance.now();
await Promise.all(Array.from({ length: konkurensi }, pekerja));
const durasi = (performance.now() - t0) / 1000;

latensi.sort((a, b) => a - b);
const pers = (p) => latensi[Math.min(latensi.length - 1, Math.floor((p / 100) * latensi.length))];
const rata = latensi.reduce((s, x) => s + x, 0) / latensi.length;

console.log(`URL         : ${url}`);
console.log(`Request     : ${total} (konkurensi ${konkurensi})`);
console.log(`Durasi      : ${durasi.toFixed(2)} detik`);
console.log(`Throughput  : ${(total / durasi).toFixed(1)} req/detik`);
console.log(`Latensi     : rata-rata ${rata.toFixed(1)} ms | p50 ${pers(50).toFixed(1)} | p95 ${pers(95).toFixed(1)} | p99 ${pers(99).toFixed(1)} ms`);
console.log(`Galat       : ${galat}`);
console.log(`Cache HIT   : ${((hit / total) * 100).toFixed(0)}%`);
console.log(`Ukuran rata2: ${(byte / total / 1024).toFixed(2)} KB / respons`);
