# Absensi Chef — Martabak Pecenongan 78

Aplikasi absensi chef berbasis foto untuk 10 outlet, dengan dashboard yang bisa
diexport ke Excel. Dibangun dengan React + Vite + Firebase Firestore (realtime,
gratis untuk skala ini).

## 0. Yang perlu disiapkan
- Node.js versi 18+ (cek dengan `node -v`; unduh di nodejs.org kalau belum ada)
- Akun Google (untuk Firebase)
- Akun GitHub (untuk hosting via Vercel)

## 1. Buat backend data (Firebase Firestore)
1. Buka https://console.firebase.google.com → **Add project** → beri nama
   misal `absensi-martabak78` → lanjutkan (Google Analytics boleh dimatikan).
2. Di sidebar kiri pilih **Build → Firestore Database → Create database**.
   Pilih **Start in production mode**, pilih lokasi server (misal `asia-southeast2 (Jakarta)`).
3. Setelah database jadi, buka tab **Rules**, hapus isinya, lalu tempel isi
   file `firestore.rules` yang sudah disediakan di project ini → **Publish**.
   (Rules ini masih terbuka bebas — cukup untuk pemakaian internal 10 outlet;
   lihat catatan keamanan di bagian bawah.)
4. Klik ikon gerigi (Project settings) di sidebar → scroll ke **Your apps** →
   klik ikon **</>** (Web) → beri nickname bebas → **Register app**.
5. Firebase akan menampilkan blok `firebaseConfig = {...}`. Salin nilai-nilai
   di dalamnya (apiKey, authDomain, projectId, dst).
6. Buka file `src/firebase.js` di project ini, ganti setiap `"GANTI..."`
   dengan nilai yang baru disalin, lalu simpan.

## 2. Jalankan di komputer (opsional, untuk uji coba dulu)
```bash
npm install
npm run dev
```
Buka link yang muncul di terminal (biasanya `http://localhost:5173`) di browser
untuk mencoba aplikasinya sebelum online.

## 3. Deploy jadi website online (gratis, via Vercel)
1. Buat repo baru di GitHub, lalu upload/push seluruh folder project ini
   (kecuali `node_modules`, sudah diatur otomatis lewat `.gitignore`).
   ```bash
   git init
   git add .
   git commit -m "Absensi Martabak Pecenongan 78"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git push -u origin main
   ```
2. Buka https://vercel.com → daftar/login pakai akun GitHub.
3. Klik **Add New → Project** → pilih repo yang baru dipush.
4. Vercel akan otomatis mendeteksi framework **Vite** — biarkan default,
   klik **Deploy**.
5. Tunggu 1–2 menit, Vercel akan memberi URL publik, misal
   `https://absensi-martabak78.vercel.app`. Website sudah bisa diakses siapa
   saja yang punya link ini, dari HP maupun komputer.

## 4. Pemakaian sehari-hari di outlet
- Bagikan link Vercel ke semua chef/PIC outlet (lewat WhatsApp grup misalnya).
- Di HP, buka link tsb di browser → menu browser → **Add to Home Screen**,
  supaya muncul seperti ikon aplikasi biasa.
- Alur pakai: chef baru isi **Daftar Chef** sekali → setiap hari buka tab
  **Absen**, pilih nama, pilih Masuk/Pulang, upload foto, kirim.
- Owner/admin buka tab **Dashboard** kapan saja untuk lihat rekap dan klik
  **Download Excel** untuk laporan per outlet/tanggal.

## 5. (Opsional) Custom domain
Di dashboard Vercel → project ini → **Settings → Domains** → tambahkan domain
sendiri (misal `absensi.martabak78.com`) dan ikuti instruksi mengarahkan DNS.

## Catatan keamanan
Rules Firestore di atas (`allow read, write: if true`) membuat siapa pun yang
tahu **project ID** Firebase bisa membaca/menulis data lewat API langsung
(bukan cuma lewat website ini). Untuk pemakaian jangka panjang, sebaiknya
ditambahkan Firebase Authentication sederhana (misal login dengan
kode/PIN outlet) sebelum rules dibuat lebih ketat. Beri tahu saya kalau
mau dibuatkan bagian ini.

## Struktur data
- Koleksi `chefs`: nama, noHp, outlet, alamat, tanggalDaftar
- Koleksi `absensi`: chefId, namaChef, outlet, tanggal, jam, tipe (Masuk/Pulang), foto (base64 JPEG terkompresi)
