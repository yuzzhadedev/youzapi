# Youz API — REST API Gratis Untuk Semua

![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![Express](https://img.shields.io/badge/Express-4.x-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Status](https://img.shields.io/badge/Status-Active-success)

**Youz API** adalah REST API gratis yang siap pakai dengan struktur proyek modern, modular, dan mudah dikembangkan. Dilengkapi autentikasi API key, middleware keamanan, sistem session, serta halaman web (login, register, dashboard, dokumentasi). Cocok untuk belajar, prototyping, atau production skala kecil.

---

## ✨ Fitur Unggulan

- 🔐 **Autentikasi ganda** — Login session (web) + API key (endpoint)
- 🧩 **Plugin modular** — Tambah endpoint cukup buat file di `routes/plugins/`
- 🛡️ **Middleware keamanan** — Rate limiter, validasi API key, auth session
- 📦 **Library pendukung** — Scraper, uploader, fetcher, fungsi umum di `lib/`
- 🌐 **Halaman web lengkap** — Login, register, dashboard, profil, docs
- 💾 **Session & logging** — Simpan session user, catat request log
- 🎨 **Asset terstruktur** — CSS, JS, gambar di folder `public/`

---

## 📦 Instalasi & Menjalankan Lokal

# Clone repositori
git clone https://github.com/username/youz-api.git
cd youz-api

# Install dependencies
npm install

# Jalankan server
npm start

Server berjalan di **http://localhost:3000**

---

## 🔑 Cara Mendapatkan API Key

1. Buka `http://localhost:3000/register` → buat akun
2. Login ke dashboard (`/login`)
3. Salin `apitoken` dari halaman profil

Atau buka langsung file `database/users.json` untuk melihat/ubah manual.

---

## 🛠️ Cara Membuat Endpoint Baru (Plugin)

Buat file `.js` di `routes/plugins/` dengan format:

// routes/plugins/myendpoint.js
module.exports = {
  rota: '/api/myplugin/hello',

  async run(req, res) {
    const { nama } = req.query;
    return res.json({
      success: true,
      message: `Halo ${nama || 'pengguna'}!`
    });
  }
};
```

Panggil dengan:
```
/api/myplugin/hello?nama=Andi&apitoken=KEY_KAMU

> Endpoint otomatis divalidasi `apitoken` oleh `middleware/apikey.js`

---

## 📌 Endpoint Bawaan

| Method | Endpoint | Deskripsi | Parameter |
|--------|----------|-----------|-----------|
| `GET` | `/api/server-status` | Cek status server & uptime | `apitoken` |
| `GET` | `/api/text2qr` | Generate QR code dari teks | `text`, `apitoken` |
| `GET` | `/api/yt-search` | Cari video YouTube | `q`, `apitoken` |

Contoh:
curl "http://localhost:3000/api/text2qr?text=YouzAPI&apitoken=xxx"

---

## 🗂️ Struktur Proyek (Lengkap)

```
youz-api/
│
├── index.js                 # Entry point server
├── package.json
├── README.md
│
├── database/
│   └── users.json           # Data user (username, password hash, apitoken)
│
├── public/                  # Aset statis
│   ├── css/style.css
│   ├── js/main.js
│   └── img/logo.png
│
├── routes/
│   ├── config.js            # Auto-load plugin & routing utama
│   └── plugins/             # Semua endpoint API (modular)
│       ├── server-status.js
│       ├── text2qr.js
│       ├── yt-search.js
│       └── contoh.js
│
├── views/                   # Template EJS
│   ├── partials/
│   │   ├── header.ejs
│   │   ├── navbar.ejs
│   │   └── footer.ejs
│   ├── login.ejs
│   ├── register.ejs
│   ├── dashboard.ejs
│   ├── profile.ejs
│   └── docs.ejs
│
├── middleware/              # Middleware Express
│   ├── auth.js              # Validasi session login (web)
│   ├── apikey.js            # Validasi apitoken (API)
│   └── limiter.js           # Rate limiting (mencegah spam)
│
├── lib/                     # Library pendukung
│   ├── function.js          # Fungsi umum (format tanggal, random, dll)
│   ├── scraper.js           # Web scraper untuk berbagai sumber
│   ├── uploader.js          # Upload file ke layanan pihak ketiga
│   └── fetcher.js           # HTTP client (axios wrapper)
│
├── session/                 # Session store (file-based)
│   └── session.json
│
└── logs/                    # Log request & error
    └── request.log
```

---

## 🔧 Middleware & Keamanan

| Middleware | Fungsi |
|------------|--------|
| `auth.js` | Memastikan user sudah login via session (untuk halaman dashboard, profil) |
| `apikey.js` | Memeriksa `apitoken` pada query string, cocokkan dengan `users.json` |
| `limiter.js` | Membatasi jumlah request per IP (misal 100 per 15 menit) |

> Semua endpoint API (`/api/*`) otomatis menggunakan `apikey.js` dan `limiter.js`.

---

## 📚 Library Pendukung (`lib/`)

- **function.js** — Kumpulan helper: `formatDate()`, `generateRandomString()`, `validateEmail()`, dll.
- **scraper.js** — Fungsi scraping dari website (YouTube, Instagram, TikTok, dll)
- **uploader.js** — Upload gambar/file ke Imgur, Catbox, atau server lokal
- **fetcher.js** — Wrapper `axios` dengan timeout & retry

Contoh penggunaan di plugin:
```js
const { fetchHTML } = require('../../lib/fetcher');
const { generateRandomString } = require('../../lib/function');

async run(req, res) {
  const html = await fetchHTML('https://example.com');
  const token = generateRandomString(32);
  // ...
}
```

---

## 🧪 Session & Logging

- **Session** — Disimpan di `session/session.json` (default express-session file store). Bisa diganti ke Redis/MongoDB nantinya.
- **Logging** — Setiap request dicatat di `logs/request.log` dengan format:
  ```
  [2025-01-27T10:00:00.000Z] GET /api/server-status - 200 - 45ms
  ```

---

## 🤝 Kontribusi

1. Fork repo ini
2. Buat branch fitur (`git checkout -b fitur-baru`)
3. Commit perubahan (`git commit -m 'Tambahkan fitur X'`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buka Pull Request

---

## 📄 Lisensi

MIT © **Youz API** — Bebas digunakan, dimodifikasi, dan didistribusikan.

---

## 🙋‍♂️ Dukungan

- [GitHub Issues](https://github.com/username/youz-api/issues)
- Email: support@youzapi.com (contoh)

---
**⭐ Jangan lupa beri bintang jika proyek ini bermanfaat!**
```
