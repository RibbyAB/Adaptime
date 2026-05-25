# ⏰ ADAPTIME

**Adaptive Energy-Based Smart Scheduling**
Aplikasi manajemen tugas berbasis level energi harian untuk mahasiswa.

---

## 🚀 Cara Menjalankan

### Prasyarat
- **Node.js** versi 16 ke atas ([download](https://nodejs.org))
- **npm** (sudah termasuk saat install Node.js)

### Langkah-langkah

```bash
# 1. Masuk ke folder project
cd adaptime

# 2. Install semua dependency
npm install

# 3. Jalankan aplikasi (mode development)
npm start
```

Browser akan otomatis terbuka di **http://localhost:3000**

### Build untuk Production
```bash
npm run build
```
Output ada di folder `build/` — siap di-deploy ke Netlify, Vercel, dsb.

---

## 📁 Struktur Folder

```
adaptime/
├── public/
│   └── index.html          # Template HTML utama
├── src/
│   ├── data/
│   │   └── seed.js         # Data awal (tasks, jadwal, energy default)
│   ├── utils/
│   │   └── helpers.js      # Helper functions (warna, label, hitung hari)
│   ├── components/
│   │   ├── Auth.jsx        # Halaman login & register
│   │   ├── Sidebar.jsx     # Navigasi sidebar
│   │   ├── Badge.jsx       # Komponen badge status & tipe
│   │   ├── TaskModal.jsx   # Modal tambah/edit task
│   │   └── SchedModal.jsx  # Modal tambah/edit jadwal
│   ├── pages/
│   │   ├── Dashboard.jsx   # Halaman utama / ringkasan
│   │   ├── Tasks.jsx       # Manajemen task
│   │   ├── Schedule.jsx    # Jadwal tetap mingguan
│   │   ├── Energy.jsx      # Pengaturan level energi
│   │   └── Analytics.jsx   # Statistik & insights
│   ├── App.jsx             # Root component & state management
│   ├── index.js            # Entry point React
│   └── index.css           # Global styles
└── package.json
```

---

## ✨ Fitur

| Fitur | Deskripsi |
|-------|-----------|
| 🔐 Auth | Login/Register (demo mode) |
| 📋 Task Management | Tambah, edit, hapus task dengan deadline & tingkat kesulitan |
| 📅 Jadwal Tetap | Jadwal mingguan dengan deteksi konflik otomatis |
| ⚡ Pengaturan Energi | Atur level energi per waktu (Morning Person / Night Owl / Custom) |
| 📊 Analytics | Statistik completion rate, distribusi kesulitan, produktivitas per waktu |
| 🎯 Smart Schedule | Banner info task besar yang siap dijadwalkan otomatis |

---

## 🛠 Tech Stack

- **React 18** — UI library
- **Create React App** — Build tool & dev server
- **CSS murni** — Tanpa Tailwind/UI library eksternal
- **Google Fonts (Outfit)** — Tipografi

---

## 💡 Tips Penggunaan

1. **Login demo**: masukkan email & password apapun untuk masuk
2. Mulai dari **Pengaturan Energi** untuk mengatur profil produktivitas kamu
3. Tambahkan task di **Task Management** dengan deadline dan estimasi jam
4. Lihat ringkasan di **Dashboard** setiap pagi
5. Pantau progress di **Analytics**
