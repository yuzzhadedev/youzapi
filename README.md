```markdown
# Youz API — REST API Gratis Untuk Semua

Youz API adalah layanan REST API gratis yang dirancang dengan struktur modular seperti Obito API. Proyek ini menggunakan Express.js sebagai server utama, EJS untuk tampilan halaman web (login, register, dashboard, profil), serta sistem autentikasi sederhana berbasis `apitoken` dan penyimpanan data user di `database/users.json`.

## Fitur

- ✅ Autentikasi menggunakan API key (`apitoken`)
- ✅ Struktur modular: cukup tambah file di `routes/plugins/` untuk membuat endpoint baru
- ✅ Halaman web interaktif dengan EJS (`views/`)
- ✅ CSS styling di `public/css/`
- ✅ Dukungan endpoint bawaan untuk cek status server, QR code, dan pencarian YouTube

## Instalasi & Menjalankan Lokal

1. Clone repositori ini
2. Install dependencies:
   ```bash
   npm install
   ```
3. Jalankan server:
   ```bash
   npm start
   ```
4. Buka browser di:
   ```
   http://localhost:3000
   ```

## Cara Menambahkan Endpoint Baru

Buat file JavaScript baru di folder `routes/plugins/` dengan struktur berikut:

```js
// routes/plugins/nama-endpoint.js
module.exports = {
  rota: '/api/tools/contoh',

  async run(req, res) {
    return res.json({
      success: true,
      data: 'Hello Youz API'
    });
  }
};
```

Setiap endpoint secara otomatis akan memerlukan parameter `apitoken` untuk validasi. Contoh pemanggilan:

```
/api/tools/contoh?apitoken=APIKEY_ANDA
```

## Endpoint Bawaan

| Endpoint | Deskripsi | Parameter |
|----------|-----------|-----------|
| `/api/server/status` | Cek status server | `apitoken` |
| `/api/tools/text2qr` | Generate QR code dari teks | `text`, `apitoken` |
| `/api/search/yt` | Mencari video di YouTube | `q` (query), `apitoken` |

> Catatan: Semua endpoint di atas wajib menyertakan `?apitoken=APIKEY_ANDA`.

## Struktur Proyek

```
Youz-API/
├── index.js              # Server utama Express
├── views/                # Halaman EJS (login, register, dashboard, profil)
├── routes/
│   ├── config.js         # Validasi API key & auto-load plugin
│   └── plugins/          # Semua endpoint API modular
├── database/
│   └── users.json        # Penyimpanan data user sederhana
├── public/
│   └── css/              # Asset styling
└── package.json
```

## Lisensi

MIT © Youz API
```
