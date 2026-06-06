# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# Event Platform Backend API

Ini adalah repositori _backend_ untuk aplikasi Event & Ticketing Platform. _Backend_ ini dibangun menggunakan **Node.js** dan **Express.js**, serta menggunakan **MySQL** sebagai basis data relasional. Sistem ini juga mengimplementasikan **WebSocket** untuk fitur _chat rooms_ dan notifikasi secara _real-time_.

## 🛠️ Teknologi yang Digunakan

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL
- **Real-time Engine:** Socket.io / ws
- **Authentication:** JWT (JSON Web Token) & OAuth 2.0 (Google)
- **Email Service:** SMTP (Nodemailer)

## 📁 Struktur Direktori

\`\`\`text
/backend
├── /config # Konfigurasi koneksi MySQL, OAuth 2.0 (Google), dan SMTP
├── /controllers # Inti logika bisnis (misal: EventController, ChatController)
├── /middlewares # Pengecekan otorisasi (misal: cek token JWT, cek role Admin/Organizer)
├── /models # Definisi skema dan query ke MySQL
├── /routes # Daftar endpoint API (misal: router.get('/events', ...))
├── /services # Logika eksternal (misal: fungsi Axios untuk tarik event luar, generate PDF tiket)
├── /sockets # Khusus menangani event WebSocket (join room, send message real-time)
├── /utils # Fungsi bantuan kecil (misal: format tanggal, generator kode voucher acak)
├── .env # Tempat menyimpan kredensial rahasia (Tidak di-commit ke Git)
├── package.json # Daftar dependency dan script backend
└── server.js # Entry point aplikasi (menjalankan server Express & inisialisasi Socket)
\`\`\`

## 🚀 Cara Instalasi & Menjalankan Server

### 1. Persyaratan Sistem

Pastikan sistem kamu sudah terinstal:

- [Node.js](https://nodejs.org/) (versi 16.x atau lebih baru)
- [MySQL](https://dev.mysql.com/downloads/) (Server berjalan dan siap menerima koneksi)

### 2. Langkah Instalasi

Kloning repositori ini (atau masuk ke folder backend jika sudah ada):
\`\`\`bash
cd backend
\`\`\`

Instal semua _dependencies_:
\`\`\`bash
npm install
\`\`\`

### 3. Konfigurasi Environment Variables (`.env`)

Buat sebuah file bernama `.env` di _root_ folder `/backend`. Kamu bisa menyalin format di bawah ini dan menyesuaikannya dengan kredensial milikmu:

\`\`\`env

# Konfigurasi Server

PORT=5000
NODE_ENV=development

# Konfigurasi Database (MySQL)

DB_HOST=localhost
DB_USER=root
DB_PASS=password_database_kamu
DB_NAME=nama_database_event

# Konfigurasi JWT (Authentication)

JWT_SECRET=buat_string_rahasia_yang_panjang_di_sini
JWT_EXPIRES_IN=1d

# Konfigurasi OAuth 2.0 (Google)

GOOGLE_CLIENT_ID=client_id_dari_google_cloud
GOOGLE_CLIENT_SECRET=client_secret_dari_google_cloud

# Konfigurasi SMTP (Nodemailer)

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email_pengirim@gmail.com
SMTP_PASS=password_aplikasi_email
\`\`\`

### 4. Menjalankan Aplikasi

Untuk mode pengembangan (dengan _auto-reload_ menggunakan `nodemon`):
\`\`\`bash
npm run dev
\`\`\`

Untuk mode produksi:
\`\`\`bash
npm start
\`\`\`

Server akan berjalan di \`http://localhost:5000\` (atau _port_ lain sesuai konfigurasi `.env`).

## 🔐 Autentikasi & Otorisasi

Sistem ini menggunakan pembagian akses berbasis peran (Role-Based Access Control):

- **Admin:** Memiliki akses penuh, termasuk menyetujui _event_ dan pendaftaran _organizer_.
- **Organizer:** Dapat membuat dan mengelola _event_.
- **User:** Dapat membeli tiket dan berinteraksi di _chat rooms_.

Token JWT harus disertakan di _header_ `Authorization: Bearer <token>` untuk mengakses _endpoint_ yang dilindungi (_protected routes_).
