// Praktikum Pertemuan 1 - HTTP Inspector Server
// Server HTTP sederhana TANPA dependensi untuk mengamati pesan HTTP mentah.
// Jalankan: node http-inspector-server.js
// Uji     : curl.exe -i http://localhost:3000/

const http = require('node:http');
const crypto = require('node:crypto');

const PORT = process.env.PORT || 3000;

// Menulis log terstruktur: request line, header, lalu body
function logRequest(req, body) {
  const line = '-'.repeat(60);
  console.log(`\n${line}`);
  console.log(`${new Date().toISOString()}`);
  console.log(`${req.method} ${req.url} HTTP/${req.httpVersion}`);
  for (const [name, value] of Object.entries(req.headers)) {
    console.log(`${name}: ${value}`);
  }
  console.log(body ? `\n${body}` : '\n(tanpa body)');
  console.log(line);
}

function sendJson(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...extraHeaders,
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf8');
    logRequest(req, body);

    const url = new URL(req.url, `http://${req.headers.host}`);

    // GET / -> ringkasan
    if (req.method === 'GET' && url.pathname === '/') {
      return sendJson(res, 200, {
        pesan: 'HTTP Inspector aktif',
        endpoint: ['/', '/echo', '/status/:kode', '/cache', '/redirect', '/lambat?ms=1500'],
      });
    }

    // /echo -> kembalikan apa yang diterima server
    if (url.pathname === '/echo') {
      return sendJson(res, 200, {
        method: req.method,
        path: url.pathname,
        query: Object.fromEntries(url.searchParams),
        headers: req.headers,
        body,
      });
    }

    // /status/404 -> balas dengan kode status pilihan
    const m = url.pathname.match(/^\/status\/(\d{3})$/);
    if (m) {
      const code = Number(m[1]);
      if (code < 200 || code > 599) {
        return sendJson(res, 400, { error: 'Kode status harus 200-599' });
      }
      const noBody = code === 204 || code === 304;
      if (noBody) {
        res.writeHead(code);
        return res.end();
      }
      return sendJson(res, code, { status: code });
    }

    // /cache -> demonstrasi ETag + 304
    if (url.pathname === '/cache') {
      const payload = JSON.stringify({ versi: 1, isi: 'konten statis demo caching' });
      const etag = `"${crypto.createHash('sha1').update(payload).digest('hex')}"`;
      if (req.headers['if-none-match'] === etag) {
        res.writeHead(304, { ETag: etag });
        return res.end();
      }
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
        ETag: etag,
      });
      return res.end(payload);
    }

    // /redirect -> demonstrasi 302 + Location
    if (url.pathname === '/redirect') {
      res.writeHead(302, { Location: '/echo?dari=redirect' });
      return res.end();
    }

    // /lambat?ms=1500 -> simulasi TTFB tinggi
    if (url.pathname === '/lambat') {
      const ms = Math.min(Number(url.searchParams.get('ms')) || 1000, 10000);
      return setTimeout(() => sendJson(res, 200, { menunggu_ms: ms }), ms);
    }

    sendJson(res, 404, { error: 'Tidak ditemukan', path: url.pathname });
  });
});

server.listen(PORT, () => {
  console.log(`HTTP Inspector berjalan di http://localhost:${PORT}`);
});
