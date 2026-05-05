# Wedding Planner — Rinaldi & Naura Syifa

Aplikasi perencanaan pernikahan dengan **sync real-time via Firebase**, sehingga Anda dan pasangan bisa berbagi data secara langsung dari perangkat manapun.

---

## 🚀 Panduan Hosting ke GitHub Pages

### Langkah 1 — Buat Repository di GitHub

1. Login ke https://github.com
2. Klik **+** di kanan atas → **New repository**
3. Isi:
   - Repository name: `wedding-planner`
   - **Public** ✅ (wajib agar gratis)
   - JANGAN centang README, .gitignore, atau license
4. Klik **Create repository**

### Langkah 2 — Upload Semua File

1. Klik link **"uploading an existing file"** di halaman repo baru
2. Buka folder `wedding-app` (yang sudah di-extract)
3. Pilih SEMUA isinya (Ctrl+A) — termasuk folder `src/` dan `.github/`
4. Drag & drop ke browser
5. Tulis commit message: "Upload awal" → klik **Commit changes**

### Langkah 3 — Aktifkan GitHub Pages

1. Tab **Settings** → sidebar **Pages**
2. **Source**: pilih **GitHub Actions**

### Langkah 4 — Tunggu Build (1-3 menit)

Tab **Actions** → tunggu hingga centang hijau ✅

### Langkah 5 — Akses Aplikasi

```
https://USERNAME-ANDA.github.io/wedding-planner/
```

Bagikan URL ini ke pasangan — data akan sync real-time! 💕

---

## 🔥 Firebase Sudah Terkonfigurasi

- Project: `wedding-rinaldi-naura`
- Real-time sync aktif
- Indikator status di pojok kanan atas: ☁️ Tersinkron / 🔄 Menyimpan / ❌ Gagal

---

## 🔧 Troubleshooting

**Halaman blank?** Pastikan `base` di `vite.config.js` = `/wedding-planner/`

**Data tidak sync?** Cek indikator pojok kanan atas + koneksi internet

**Workflow gagal?** Pastikan folder `.github/` ter-upload

**Tidak ada opsi GitHub Actions?** Repository harus **Public**
