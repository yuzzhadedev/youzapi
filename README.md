🚀 Youz API — Modern Free REST API Platform

<div align="center"><img src="https://i.imgur.com/4M34hi2.png" width="120" />Fast • Modular • Modern • Free

REST API platform gratis dengan struktur modular ala Obito API, dibuat untuk developer modern yang ingin membuat API scalable, rapi, dan mudah dikembangkan.

"NodeJS" (https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
"Express" (https://img.shields.io/badge/Express.js-Backend-black?style=for-the-badge&logo=express)
"EJS" (https://img.shields.io/badge/EJS-Template-orange?style=for-the-badge)
"License" (https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

</div>---

✨ Features

- ⚡ High performance Express server
- 🔐 API Key authentication system
- 📦 Modular plugin endpoint system
- 🧩 Auto-load API routes
- 🎨 Modern EJS dashboard
- 👤 Login & Register system
- 📊 User profile & usage panel
- 🗂 Clean folder structure
- 🔄 Easy endpoint development
- 🌐 Ready for Vercel / VPS deployment
- 🛡 Simple request validation
- 🚀 Beginner friendly architecture

---

📁 Project Structure

youz-api/
│
├── index.js                # Main Express server
├── package.json
│
├── database/
│   └── users.json
│
├── public/
│   ├── css/
│   ├── js/
│   └── img/
│
├── routes/
│   ├── config.js           # API validator & plugin loader
│   │
│   └── plugins/
│       ├── server-status.js
│       ├── text2qr.js
│       └── yt-search.js
│
├── views/
│   ├── login.ejs
│   ├── register.ejs
│   ├── dashboard.ejs
│   └── profile.ejs
│
└── README.md

---

⚙️ Installation

Clone Project

git clone https://github.com/yourusername/youz-api.git

Masuk ke folder project

cd youz-api

Install dependencies

npm install

Jalankan server

npm start

---

🌐 Open In Browser

http://localhost:3000

---

🔑 API Authentication

Semua endpoint memakai parameter:

apitoken=YOUR_API_KEY

Contoh:

/api/server/status?apitoken=YOUR_API_KEY

---

🚀 Built-in Endpoints

Endpoint| Method| Description
"/api/server/status"| GET| Status server
"/api/tools/text2qr"| GET| Convert text ke QR
"/api/search/yt"| GET| Search YouTube

---

📌 Example Usage

Server Status

GET /api/server/status?apitoken=YOUR_API_KEY

Response:

{
  "success": true,
  "server": "online",
  "uptime": 1200
}

---

Generate QR Code

GET /api/tools/text2qr?text=Hello&apitoken=YOUR_API_KEY

---

YouTube Search

GET /api/search/yt?q=music&apitoken=YOUR_API_KEY

---

🧩 Create Custom Endpoint

Buat file baru di:

routes/plugins/

Contoh:

module.exports = {
  rota: '/api/tools/hello',

  async run(req, res) {

    return res.json({
      success: true,
      creator: 'Youz API',
      message: 'Hello World'
    });

  }
};

Endpoint otomatis aktif:

/api/tools/hello?apitoken=YOUR_API_KEY

---

🛡 API Validation System

Youz API menggunakan:

- API Key validation
- Auto route loader
- Plugin sandbox structure
- Request middleware system

Semua plugin otomatis diproses oleh:

routes/config.js

---

🎨 Dashboard System

Youz API memiliki dashboard modern:

- Login
- Register
- User Profile
- API Information
- API Key Panel
- Usage Counter
- Endpoint Documentation

---

☁️ Deployment

Vercel

Tambahkan file:

vercel.json

Contoh:

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

---

🧠 Recommended Stack

- Node.js 18+
- Express.js
- EJS
- Axios
- Moment.js
- UUID
- LowDB / MongoDB
- Cloudflare / Vercel

---

🔥 Future Plans

- AI Endpoint
- Image Generation
- User Rate Limit
- Admin Panel
- Analytics Dashboard
- API Documentation UI
- Usage Graph
- Premium System
- Team API Workspace

---

👑 Creator

Youz API

Modern REST API Platform for Everyone.

Built with ❤️ using Node.js & Express.

---

📜 License

MIT License © Youz API
