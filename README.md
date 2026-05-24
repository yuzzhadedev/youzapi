Youz API — Rest API Gratis Untuk Semua

Youz API adalah project REST API sederhana, ringan, dan mudah dikembangkan.
Versi ini memakai struktur seperti Obito API agar lebih rapi, modular, dan cocok untuk ditambah banyak endpoint.

Fitur Utama

- Server utama memakai Express.js
- Tampilan halaman memakai EJS
- Sistem login dan register
- Dashboard user
- Profil user
- API key untuk akses endpoint
- Auto-load plugin endpoint
- Struktur folder rapi dan mudah dipahami
- Cocok untuk deploy ke Vercel atau VPS
- Mudah ditambah fitur baru

Struktur Project

youz-api/
├── index.js
├── package.json
├── database/
│   └── users.json
├── public/
│   └── css/
├── routes/
│   ├── config.js
│   └── plugins/
│       ├── server-status.js
│       ├── text2qr.js
│       └── yt-search.js
└── views/
    ├── login.ejs
    ├── register.ejs
    ├── dashboard.ejs
    └── profile.ejs

Penjelasan Folder

"index.js"

File utama untuk menjalankan server Express, mengatur middleware, route halaman, session, dan konfigurasi utama website.

"views/"

Berisi tampilan halaman EJS seperti:

- Login
- Register
- Dashboard
- Profile

"routes/config.js"

Berfungsi untuk:

- Validasi API key
- Auto-load endpoint dari folder plugin
- Menghubungkan semua endpoint API ke server utama

"routes/plugins/"

Tempat menyimpan semua endpoint API secara modular.
Setiap file plugin akan otomatis aktif jika formatnya benar.

"database/users.json"

Database sederhana berbasis file JSON untuk menyimpan data user.

"public/css/"

Folder untuk menyimpan asset styling website.

Jalankan Lokal

Install dependency:

npm install

Jalankan server:

npm start

Buka di browser:

http://localhost:3000

Sistem API Key

Setiap user akan memiliki API key.
API key digunakan untuk mengakses endpoint API.

Format penggunaan:

?apitoken=KEY_KAMU

Contoh:

/api/server/status?apitoken=KEY_KAMU

Endpoint Bawaan

Server Status

/api/server/status?apitoken=KEY_KAMU

Berfungsi untuk mengecek status server.

Text To QR

/api/tools/text2qr?text=halo&apitoken=KEY_KAMU

Berfungsi untuk membuat QR code dari teks.

YouTube Search

/api/search/yt?q=lagu&apitoken=KEY_KAMU

Berfungsi untuk mencari video YouTube.

Cara Tambah Endpoint

Buat file baru di folder:

routes/plugins/

Contoh:

module.exports = {
  rota: '/api/tools/contoh',

  async run(req, res) {
    return res.json({
      success: true,
      creator: 'Youz API',
      result: 'Hello Youz API'
    });
  }
};

Setelah itu endpoint otomatis aktif:

/api/tools/contoh?apitoken=KEY_KAMU

Format Plugin

Setiap plugin wajib memiliki:

module.exports = {
  rota: '/api/category/nama-endpoint',

  async run(req, res) {
    // kode endpoint
  }
};

Keterangan:

- "rota" adalah alamat endpoint
- "run" adalah fungsi utama endpoint
- "req" untuk mengambil query/body
- "res" untuk mengirim response JSON

Contoh Response Sukses

{
  "success": true,
  "creator": "Youz API",
  "result": "Data berhasil diproses"
}

Contoh Response Error

{
  "success": false,
  "message": "Apitoken tidak valid"
}

Rekomendasi Pengembangan

Beberapa fitur yang cocok ditambahkan:

- Admin panel
- Limit request harian
- Statistik penggunaan API
- Sistem premium user
- Dokumentasi endpoint otomatis
- Riwayat request user
- Search endpoint di dashboard
- Dark mode
- MongoDB database
- Rate limit per user

Deploy Ke Vercel

Tambahkan file "vercel.json":

{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.js"
    }
  ]
}

Lalu deploy:

vercel

Catatan

Project ini cocok untuk:

- Belajar membuat REST API
- Membuat API pribadi
- Membuat dashboard API
- Menyediakan endpoint tools/search/downloader
- Dikembangkan menjadi layanan API publik

Creator

Youz API dibuat sebagai REST API gratis untuk semua.

Dibuat dengan Node.js, Express.js, dan EJS.
