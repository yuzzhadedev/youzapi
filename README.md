# YOUZ API

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-111111?style=for-the-badge&logo=express&logoColor=white)
![EJS](https://img.shields.io/badge/EJS-Templates-9b59b6?style=for-the-badge)
![WebSocket](https://img.shields.io/badge/WebSocket-Realtime-2ecc71?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-Optional-13AA52?style=for-the-badge&logo=mongodb&logoColor=white)

**REST API modular berbasis Express + EJS dengan Playground interaktif, sistem plugin, akun pengguna, API key, storage JSON/MongoDB, dan monitor real-time via WebSocket.**

[Quickstart](#-quickstart) • [Fitur](#-fitur-utama) • [Endpoint](#-endpoint-bawaan) • [WebSocket Monitor](#-websocket-monitor) • [Plugin](#-membuat-plugin)

</div>

---

## ✨ Fitur Utama

| Area | Detail |
| --- | --- |
| **Plugin API** | File di `routes/plugins/*.js` otomatis diload sebagai endpoint API. |
| **GET + POST** | Endpoint plugin mendukung query string (`GET`) dan JSON/form body (`POST`) melalui `req.paramsInput`. |
| **Playground** | UI untuk memilih method, mengisi parameter, execute request, melihat Preview JSON, dan menyalin Curl. |
| **Realtime Monitor** | Dashboard `/monitor` memakai WebSocket `/ws/monitor` untuk request metrics, status code, latency, top endpoint, dan recent traffic. |
| **Auth & API Key** | Session web untuk login/profile, API token via `Authorization: Bearer` atau `apitoken`. |
| **Storage fleksibel** | Default development memakai JSON (`database/users.json`), production bisa memakai MongoDB. |
| **Security baseline** | Helmet, rate limit, sanitize input profile/register, cookie httpOnly, dan API middleware. |

---

## 🚀 Quickstart

### 1. Clone & install

```bash
git clone https://github.com/yuzzhadedev/youzapi.git
cd youzapi
npm install
```

### 2. Setup environment lokal

`.env` tidak di-commit karena berisi konfigurasi lokal/secret. Gunakan template aman:

```bash
cp .env.example .env
```

Default development:

```env
PORT=3000
NODE_ENV=development
SESSION_SECRET=change-this-in-production
DB_TYPE=json
```

### 3. Jalankan server

```bash
npm start
```

Aplikasi berjalan di:

- Home: `http://localhost:3000/`
- Playground: `http://localhost:3000/playground`
- Monitor realtime: `http://localhost:3000/monitor`
- Profile: `http://localhost:3000/perfil`

---

## ⚙️ Environment Variables

| Variable | Default | Keterangan |
| --- | --- | --- |
| `PORT` | `3000` | Port HTTP server. |
| `NODE_ENV` | `development` | Pakai `production` saat deploy. |
| `SESSION_SECRET` | fallback dev | Wajib ganti dengan secret panjang di production. |
| `DB_TYPE` | `json` | `json` untuk local file, `mongodb` untuk MongoDB. |
| `MONGODB_URI` | - | URI MongoDB jika `DB_TYPE=mongodb`. |
| `MONGODB_DB` | `youzapi` | Nama database MongoDB. |

> Jangan commit `.env`. Simpan secret di environment hosting atau file lokal saja.

---

## 🔌 Endpoint Bawaan

Endpoint plugin tersedia melalui `/api/plugins/list` dan otomatis dilindungi middleware API.

| Endpoint | Method | Status | Parameter | Fungsi |
| --- | --- | --- | --- | --- |
| `/api/server/status` | `GET`, `POST` | ready | - | Status server, uptime, timestamp. |
| `/api/tools/text2qr` | `GET`, `POST` | ready | `text` | Generate QR image URL dari teks. |
| `/api/s/youtube` | `GET`, `POST` | ready | `query` | Cari video YouTube. |
| `/api/tools/qr2text` | `GET`, `POST` | closed | `url` | Baca teks QR dari URL gambar. |

### Contoh GET

```bash
curl "http://localhost:3000/api/tools/text2qr?text=Halo"
```

### Contoh POST JSON

```bash
curl -X POST "http://localhost:3000/api/tools/text2qr" \
  -H "Content-Type: application/json" \
  -d '{"text":"Halo"}'
```

### Contoh dengan API token

```bash
curl "http://localhost:3000/api/server/status" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## 📡 WebSocket Monitor

Realtime monitoring aktif melalui endpoint WebSocket:

```text
ws://localhost:3000/ws/monitor
wss://your-domain.com/ws/monitor
```

Payload dikirim saat:

- client pertama connect,
- ada request baru (debounced agar ringan),
- interval heartbeat/tick tiap 1 detik.

Contoh payload:

```json
{
  "type": "monitor",
  "reason": "request",
  "uptime": 120.5,
  "activeConns": 2,
  "websocket": {
    "path": "/ws/monitor",
    "heartbeat": true,
    "intervalMs": 1000,
    "clients": 2
  },
  "stats": {
    "totalRequests": 42,
    "totalErrors": 1,
    "successRate": "97.6",
    "statusCodes": { "s2xx": 41, "s4xx": 1, "s5xx": 0 },
    "topEndpoints": [],
    "recent": []
  }
}
```

Dashboard `/monitor` sudah memiliki reconnect otomatis dan indikator status `CONNECTING WS`, `LIVE WS`, `WS ERROR`, atau `WS OFFLINE`.

---

## 🧩 Membuat Plugin

Buat file baru di `routes/plugins/`:

```js
// routes/plugins/hello.js
module.exports = {
  status: 'ready',
  rota: '/api/demo/hello',
  // opsional: method: 'GET' atau methods: ['GET', 'POST']

  async run(req, res) {
    const { name = 'developer' } = req.paramsInput || req.query;
    return res.json({
      success: true,
      message: `Halo ${name}!`
    });
  }
};
```

Plugin otomatis:

- diregistrasi saat server start,
- menerima `GET` dan `POST` secara default,
- memakai rate limit global `/api/*`,
- melewati status check `ready`, `maintenance`, atau `closed`,
- muncul di `/api/plugins/list` dan Playground.

---

## 🗄️ Database Mode

### JSON mode (default development)

```env
DB_TYPE=json
```

Data user tersimpan di `database/users.json`. Mode ini paling mudah untuk local development.

### MongoDB mode (production)

```env
NODE_ENV=production
DB_TYPE=mongodb
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/youzapi?retryWrites=true&w=majority
MONGODB_DB=youzapi
SESSION_SECRET=isi-dengan-secret-panjang-dan-acak
```

Saat MongoDB aktif, user dan session dapat memakai MongoDB (`connect-mongo`) dengan fallback yang jelas saat konfigurasi belum lengkap.

---

## 🗂️ Struktur Project

```text
youzapi/
├── index.js                  # Express app, session, auth, routes, HTTP server
├── lib/
│   └── user-store.js          # JSON/MongoDB user storage adapter
├── routes/
│   ├── config.js              # Plugin loader, API key middleware, method registry
│   ├── monitor-ws.js          # WebSocket realtime monitor
│   └── plugins/               # Endpoint plugin modules
├── views/                     # EJS pages: home, playground, monitor, auth, profile
├── public/                    # Static CSS/assets
├── database/users.json         # Local JSON user data
├── .env.example               # Safe env template
├── package.json
└── README.md
```

---

## 🧪 Testing & Quality Checks

```bash
npm test
```

Script ini menjalankan `node --check` untuk file server utama, WebSocket monitor, config route, dan plugin bawaan.

Tambahan check yang direkomendasikan sebelum PR:

```bash
git diff --check
npm test
```

---

## 🛡️ Catatan Security

- Jangan commit `.env`, token, URI database, atau credential hosting.
- Gunakan `SESSION_SECRET` yang panjang dan unik di production.
- Aktifkan HTTPS saat deploy agar cookie secure dan WebSocket `wss://` berjalan aman.
- Review plugin baru karena setiap file di `routes/plugins/*.js` akan diload saat startup.

---

## 🗺️ Roadmap

- [x] Plugin loader modular
- [x] Playground GET/POST + Preview/Curl
- [x] JSON storage untuk development
- [x] MongoDB-ready storage/session
- [x] WebSocket realtime monitor
- [ ] Admin analytics dashboard
- [ ] Dockerfile + compose template
- [ ] API versioning
- [ ] OAuth provider login

---

## 🤝 Kontribusi

1. Fork repository.
2. Buat branch fitur: `git checkout -b feat/nama-fitur`.
3. Jalankan check: `git diff --check && npm test`.
4. Commit perubahan dengan pesan jelas.
5. Buka Pull Request dengan ringkasan dan testing.

---

<div align="center">

**YOUZ API — build fast, monitor live, ship confidently.**

[⬆ Back to top](#youz-api)

</div>
