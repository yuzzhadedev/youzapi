# Youz API — Rest Api Gratis Untuk semua

Versi ini memakai struktur seperti Obito API:

- `index.js` sebagai server utama Express
- `views/` untuk halaman EJS: login, register, dashboard, profil
- `routes/config.js` untuk validasi API key dan auto-load plugin
- `routes/plugins/` untuk endpoint API modular
- `database/users.json` untuk data user sederhana
- `public/css/` untuk asset dan styling

## Jalankan lokal

```bash
npm install
npm start
```

Buka:

```txt
http://localhost:3000
```

## Cara tambah endpoint

Buat file baru di `routes/plugins/nama-endpoint.js`:

```js
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

Endpoint otomatis memakai `apitoken`:

```txt
/api/tools/contoh?apitoken=KEY_KAMU
```

## Endpoint bawaan

- `/api/server/status?apitoken=KEY`
- `/api/tools/text2qr?text=halo&apitoken=KEY`
- `/api/search/yt?q=lagu&apitoken=KEY`
