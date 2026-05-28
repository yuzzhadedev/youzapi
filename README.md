# 🚀 Youz API — REST API Gratis untuk Semua

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=flat-square&logo=nodedotjs)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express)
![EJS](https://img.shields.io/badge/EJS-Template-90C53F?style=flat-square&logo=ejs)
![MongoDB](https://img.shields.io/badge/MongoDB-Ready-13AA52?style=flat-square&logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)
![Status](https://img.shields.io/badge/Status-Active-success?style=flat-square)

**REST API modern, modular, dan siap production dengan autentikasi ganda, middleware keamanan, dashboard lengkap, serta sistem plugin yang mudah dikembangkan.**

[🌐 Website](#) • [📖 Dokumentasi](#-dokumentasi) • [🐛 Issues](https://github.com/yuzzhadedev/youzapi/issues) • [⭐ Beri Bintang](https://github.com/yuzzhadedev/youzapi)

</div>

---

## ✨ Fitur Unggulan

<table>
<tr>
<td width="50%">

### 🔐 Keamanan Berlapis
- Login session (web) + API key (endpoint)
- Rate limiting anti spam
- Validasi input & output
- Middleware keamanan terintegrasi

</td>
<td width="50%">

### 🧩 Arsitektur Modular
- Plugin sistem otomatis load
- Endpoint terstruktur & mudah dikembangkan
- Library reusable siap pakai
- Middleware pluggable

</td>
</tr>
<tr>
<td width="50%">

### 🌐 Web Dashboard Lengkap
- Halaman login & register responsif
- Dashboard user dengan profil
- API key management
- Documentation page interaktif

</td>
<td width="50%">

### 📦 Library Pendukung
- Web scraper multi-platform
- File uploader (Imgur, Catbox, lokal)
- HTTP fetcher dengan retry
- Fungsi helper lengkap

</td>
</tr>
<tr>
<td width="50%">

### 💾 Database & Session
- ✅ **MongoDB support** (production-ready)
- File-based database (development)
- Session storage fleksibel
- Easy migration path

</td>
<td width="50%">

### 🎨 Frontend Modern
- EJS templating system
- CSS terstruktur & responsive
- JS vanilla tanpa dependency berat
- Easy to customize

</td>
</tr>
</table>

---

## 🚀 Quickstart

### 📋 Prasyarat
- Node.js 18.x atau lebih tinggi
- npm atau yarn
- Git (untuk clone)
- MongoDB (opsional, untuk production)

### 💻 Instalasi

```bash
# Clone repositori
git clone https://github.com/yuzzhadedev/youzapi.git
cd youzapi

# Install dependencies
npm install

# Setup environment variables (opsional)
cp .env.example .env

# Jalankan server
npm start
```

**Server berjalan di:** `http://localhost:3000`

### 🔑 Dapatkan API Key

1. **Buka registrasi:** http://localhost:3000/register
2. **Buat akun** dengan username & password
3. **Login:** http://localhost:3000/login
4. **Copy API Token** dari halaman profil (`/profile`)

Untuk development, lihat langsung di `database/users.json`

---

## 📚 Dokumentasi

### 🔌 Membuat Endpoint Baru (Plugin)

Plugin adalah cara termudah menambah endpoint baru. Cukup buat file `.js` di `routes/plugins/`:

```javascript
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

**Gunakan endpoint:**
```bash
curl "http://localhost:3000/api/myplugin/hello?nama=Andi&apitoken=YOUR_TOKEN"
```

**Fitur Plugin:**
- ✅ Otomatis diload saat server start
- ✅ Middleware keamanan otomatis (API key validation)
- ✅ Rate limiting otomatis
- ✅ Error handling built-in

---

### 📡 Built-in Endpoints

| Endpoint | Method | Deskripsi | Parameter |
|----------|--------|-----------|-----------|
| `/api/server-status` | `GET` | Status server & uptime | `apitoken` |
| `/api/text2qr` | `GET` | Generate QR code | `text`, `apitoken` |
| `/api/yt-search` | `GET` | Cari video YouTube | `q`, `apitoken` |

**Contoh Request:**
```bash
# Text to QR Code
curl "http://localhost:3000/api/text2qr?text=YouzAPI&apitoken=xxx"

# Server Status
curl "http://localhost:3000/api/server-status?apitoken=xxx"

# YouTube Search
curl "http://localhost:3000/api/yt-search?q=tutorial&apitoken=xxx"
```

---

## 📊 MongoDB Migration Guide

### 🔄 Migrasi dari JSON ke MongoDB

Youz API mendukung migrasi seamless dari file-based JSON ke MongoDB untuk production environment.

#### Langkah 1: Install MongoDB Driver

```bash
npm install mongoose dotenv
```

#### Langkah 2: Setup Environment Variables

Buat file `.env` di root project:

```env
# Development (gunakan JSON)
NODE_ENV=development
DB_TYPE=file

# Production (gunakan MongoDB)
# NODE_ENV=production
# DB_TYPE=mongodb
# MONGODB_URI=mongodb://username:password@host:port/youz-api
# MONGODB_USER=admin
# MONGODB_PASSWORD=your_secure_password
```

#### Langkah 3: Struktur Database MongoDB

Schema User yang digunakan:

```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (bcrypt hashed),
  apitoken: String (unique),
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date,
  isActive: Boolean
}
```

#### Langkah 4: Update Middleware & Controllers

Middleware keamanan otomatis mendukung kedua database:

```javascript
// middleware/apikey.js - kompatibel dengan JSON & MongoDB
const user = await getUserByApiToken(apitoken);
// Fungsi ini otomatis menggunakan driver yang sesuai
```

#### Langkah 5: Migrasi Data Existing

Script migrasi dari JSON ke MongoDB:

```bash
# Jalankan setelah setup MongoDB
node scripts/migrate-to-mongodb.js
```

Script ini akan:
- ✅ Koneksi ke MongoDB
- ✅ Baca data dari `database/users.json`
- ✅ Backup data original
- ✅ Insert ke MongoDB dengan validasi
- ✅ Verify integrity data

#### Langkah 6: Verifikasi Migrasi

```bash
# Cek jumlah users di MongoDB
mongosh
> use youz-api
> db.users.countDocuments()

# Cek struktur data
> db.users.findOne()
```

#### Langkah 7: Rollback (jika diperlukan)

Jika ada masalah, rollback ke JSON:

```bash
# Restore dari backup
cp database/users.json.backup database/users.json

# Update .env
NODE_ENV=development
DB_TYPE=file
```

---

### 🗂️ Struktur Proyek (Post-MongoDB)

```
youz-api/
│
├── 📄 index.js                    # Entry point server
├── 📦 package.json
├── 📖 README.md
├── 📝 .env                        # Environment variables
├── 📝 .env.example                # Template environment
│
├── 💾 database/                   # File-based (development)
│   └── users.json                 # Local user data backup
│
├── 📊 models/                     # MongoDB Schemas (NEW)
│   ├── User.js                    # User model
│   ├── Session.js                 # Session model (Redis-ready)
│   └── Log.js                     # Request logs model
│
├── 🔄 db/                         # Database drivers (NEW)
│   ├── mongodb.js                 # MongoDB connection & queries
│   ├── file.js                    # JSON file backend
│   └── index.js                   # Smart DB selector
│
├── 🌐 public/                     # Static assets
│   ├── css/
│   │   └── style.css              # Main stylesheet
│   ├── js/
│   │   └── main.js                # Client-side JavaScript
│   └── img/
│       └── logo.png               # Branding assets
│
├── 🔗 routes/
│   ├── config.js                  # Auto-loader & main routing
│   └── plugins/                   # API endpoints (modular)
│       ├── server-status.js
│       ├── text2qr.js
│       ├── yt-search.js
│       └── [your-plugins].js
│
├── 🎨 views/                      # EJS templates
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
├── 🛡️ middleware/                 # Express middleware
│   ├── auth.js                    # Session validation
│   ├── apikey.js                  # API token validation (DB-agnostic)
│   └── limiter.js                 # Rate limiting
│
├── 📚 lib/                        # Utility library
│   ├── function.js
│   ├── scraper.js
│   ├── uploader.js
│   └── fetcher.js
│
├── 🔧 scripts/                    # Utility scripts (NEW)
│   ├── migrate-to-mongodb.js      # JSON → MongoDB
│   └── backup-mongodb.js          # MongoDB → JSON
│
├── 💬 session/                    # Session storage
│   └── session.json
│
└── 📋 logs/                       # Request logs
    └── request.log
```

---

## ⚙️ Middleware & Keamanan

Youz API dilengkapi 3 middleware keamanan utama (kompatibel JSON & MongoDB):

| Middleware | Lokasi | Fungsi |
|------------|--------|--------|
| **auth.js** | `middleware/auth.js` | Validasi session untuk halaman web (dashboard, profil) |
| **apikey.js** | `middleware/apikey.js` | Cek API token di query string, cocokkan dengan database |
| **limiter.js** | `middleware/limiter.js` | Rate limiting per IP (default: 100 request/15 menit) |

> **Catatan:** Semua endpoint API (`/api/*`) otomatis menggunakan `apikey.js` + `limiter.js`. Fungsi database-agnostic, bekerja dengan JSON dan MongoDB.

---

## 📚 Library Reference

### 🔧 function.js
Helper functions untuk task umum:
```javascript
const { formatDate, generateRandomString, validateEmail } = require('../../lib/function');

// Format tanggal
const date = formatDate(new Date()); // "27 Jan 2025, 10:30"

// Random string
const token = generateRandomString(32); // "aB3xYz9..."

// Validasi email
validateEmail('user@example.com'); // true
```

### 🕷️ scraper.js
Web scraping dari berbagai platform:
```javascript
const { scrapeTikTok, scrapeInstagram, scrapeYouTube } = require('../../lib/scraper');

// Scrape TikTok
const video = await scrapeTikTok('https://tiktok.com/@user/video/123');
```

### 📤 uploader.js
Upload file ke layanan eksternal atau lokal:
```javascript
const { uploadToImgur, uploadToLocal } = require('../../lib/uploader');

// Upload ke Imgur
const result = await uploadToImgur(fileBuffer);

// Upload lokal
const path = await uploadToLocal(fileBuffer, 'images/');
```

### 🌐 fetcher.js
HTTP client dengan timeout & retry:
```javascript
const { fetchJSON, fetchHTML } = require('../../lib/fetcher');

// Fetch JSON
const data = await fetchJSON('https://api.example.com/data');

// Fetch HTML
const html = await fetchHTML('https://example.com');
```

---

## 💬 Session & Logging

### Session Management
- **Development:** `session/session.json` (file-based)
- **Production:** MongoDB atau Redis (recommended)
- **Framework:** Express-session dengan multiple store support
- **Upgrade Path:** Zero-downtime migration dengan dual-write strategy

### Request Logging
Setiap request dicatat otomatis:
- **File-based:** `logs/request.log` (development)
- **MongoDB:** Collection `logs` (production)

```
[2025-01-27T10:00:00.000Z] GET /api/server-status - 200 - 45ms
[2025-01-27T10:00:05.123Z] POST /api/upload - 201 - 234ms
[2025-01-27T10:00:10.456Z] GET /profile - 403 - 12ms
```

---

## 🛠️ Development Guide

### Menambah Dependency
```bash
npm install <package-name>
```

### Jalankan di Mode Development (JSON-based)
```bash
# Pastikan .env memiliki:
# NODE_ENV=development
# DB_TYPE=file

# Install nodemon jika belum
npm install --save-dev nodemon

# Jalankan dengan auto-reload
nodemon index.js
```

### Jalankan di Mode Production (MongoDB)
```bash
# Update .env dengan MongoDB credentials
# NODE_ENV=production
# DB_TYPE=mongodb
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/youz-api

# Build & start
npm run build
npm start
```

### Testing Manual Endpoint
```bash
# Gunakan curl
curl "http://localhost:3000/api/text2qr?text=test&apitoken=xxx"

# Atau gunakan Postman/Insomnia
# Import cURL di aplikasi REST client favorit Anda
```

### Local MongoDB Testing
```bash
# Gunakan MongoDB Community atau Atlas free tier
# Download: https://www.mongodb.com/try/download/community

# Jalankan MongoDB
mongod

# Test connection
mongosh "mongodb://localhost:27017"
```

---

## 🤝 Kontribusi

Kami sangat menerima kontribusi! Ikuti langkah berikut:

1. **Fork** repository ini
2. **Buat branch fitur** (`git checkout -b fitur/amazing-feature`)
3. **Commit perubahan** (`git commit -m 'Tambah fitur amazing'`)
4. **Push ke branch** (`git push origin fitur/amazing-feature`)
5. **Buka Pull Request**

### Panduan Kontribusi
- ✅ Ikuti code style yang ada
- ✅ Tambahkan test jika diperlukan
- ✅ Update dokumentasi
- ✅ Buat commit message yang deskriptif
- ✅ Pastikan kompatibel dengan JSON dan MongoDB

---

## 📋 Lisensi

MIT License © **Youz API**

Bebas digunakan, dimodifikasi, dan didistribusikan untuk keperluan komersial maupun non-komersial.

Lihat file [LICENSE](./LICENSE) untuk detail lengkap.

---

## 🙋 Support & Community

- **Issues & Bug Report:** [GitHub Issues](https://github.com/yuzzhadedev/youzapi/issues)
- **Feature Request:** [GitHub Discussions](https://github.com/yuzzhadedev/youzapi/discussions)
- **Email:** [support@youzapi.com](mailto:support@youzapi.com) (contoh)
- **Website:** [youzapi.com](https://youzapi.com) (contoh)

---

## 🚀 Roadmap

- [x] ✅ Database migration ke MongoDB (ready, production-tested)
- [ ] Session migration ke Redis
- [ ] Authentication dengan OAuth2 (Google, GitHub)
- [ ] WebSocket support untuk real-time features
- [ ] Admin dashboard dengan analytics
- [ ] Mobile app (React Native)
- [ ] Docker & containerization
- [ ] API versioning system
- [ ] GraphQL endpoint support

---

<div align="center">

### ⭐ Jika proyek ini bermanfaat, jangan lupa beri bintang!

[⬆ Back to top](#-youz-api--rest-api-gratis-untuk-semua)

**Made with ❤️ by [yuzzhadedev](https://github.com/yuzzhadedev)**

</div>


## MongoDB Quick Setup

1. Install MongoDB locally or use MongoDB Atlas.
2. Copy environment template:
   - `cp .env.example .env`
3. Update `.env`:
   - `DB_TYPE=mongodb`
   - `MONGODB_URI=mongodb://localhost:27017/youzapi` (or Atlas URI)
   - `MONGODB_DB=youzapi`
   - `SESSION_SECRET=<strong-random-secret>`
4. Start app: `npm start`
5. Verify connection from startup logs (`[DB]` messages).

### MongoDB Atlas Link
- Create cluster in Atlas.
- Add DB user + allow network access (IP allowlist).
- Use generated URI in `MONGODB_URI`.
- Recommended URI format:
  - `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/youzapi?retryWrites=true&w=majority`
