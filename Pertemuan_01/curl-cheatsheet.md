# cURL Cheatsheet — Praktikum Pertemuan 1

> Windows PowerShell: gunakan `curl.exe`, bukan `curl` (alias `Invoke-WebRequest`).
> Di PowerShell, kutip JSON dengan `'...'` dan escape `"` seperlunya, atau pakai berkas: `-d "@body.json"`.

## 1. Dasar

```bash
curl.exe https://example.com                   # body saja
curl.exe -i https://example.com                # header + body
curl.exe -I https://example.com                # HEAD: header saja
curl.exe -v https://example.com                # verbose (handshake TLS, header req/res)
curl.exe -L http://github.com                  # ikuti redirect
```

## 2. Mengirim Data

```bash
# JSON
curl.exe -i -X POST http://localhost:3000/echo ^
  -H "Content-Type: application/json" ^
  -d "{\"nama\":\"Budi\",\"kelas\":\"TI-1\"}"

# Form
curl.exe -i -X POST http://localhost:3000/echo -d "nama=Budi&kelas=TI-1"

# Header kustom
curl.exe -i http://localhost:3000/echo -H "X-Praktikum: pertemuan-1"
```

## 3. Mengukur Waktu

```bash
curl.exe -s -o NUL -w "kode=%{http_code} dns=%{time_namelookup}s connect=%{time_connect}s tls=%{time_appconnect}s ttfb=%{time_starttransfer}s total=%{time_total}s\n" https://example.com
```

(Linux/macOS: ganti `NUL` dengan `/dev/null`.)

## 4. Eksperimen dengan Inspector Lokal

| Perintah | Yang diamati |
| :--- | :--- |
| `curl.exe -i http://localhost:3000/` | Status 200 + JSON ringkasan |
| `curl.exe -i http://localhost:3000/status/404` | Status 404 dengan body JSON |
| `curl.exe -i http://localhost:3000/status/204` | Status 204 tanpa body |
| `curl.exe -i http://localhost:3000/cache` | Catat nilai `ETag` |
| `curl.exe -i http://localhost:3000/cache -H "If-None-Match: \"<ETag>\""` | Status 304 tanpa body |
| `curl.exe -i http://localhost:3000/redirect` | 302 + `Location` |
| `curl.exe -iL http://localhost:3000/redirect` | Mengikuti redirect ke `/echo` |
| `curl.exe -s -o NUL -w "%{time_starttransfer}\n" "http://localhost:3000/lambat?ms=2000"` | TTFB sekitar 2 detik |

## 5. DNS

```bash
nslookup example.com
nslookup -type=MX gmail.com
nslookup -type=NS example.com
```
