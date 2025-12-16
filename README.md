# PrivyLens Automation Plan Builder

## Ringkasan

PrivyLens sekarang berfungsi sebagai **Automation Plan Builder** untuk otomasi input form berbasis browser.

- Fase **perancangan** automasi dilakukan di UI Next.js (halaman `/automate`, yang juga menjadi homepage).
- Fase **eksekusi teknis** dilakukan oleh **Playwright Runner** terpisah yang menjalankan browser nyata berdasarkan *Automation Plan* yang dihasilkan.
- PrivyLens **tidak lagi** mengeksekusi JavaScript di browser target secara langsung maupun menyimpan logika DOM-detail di UI.

Arsitektur ini memastikan pemisahan tegas antara:

- **Niat & konfigurasi bisnis** (PrivyLens / Automation Plan)
- **Eksekusi teknis di browser** (Playwright Runner)

---

## Fitur Utama

### 1. Automation Plan Builder

Halaman utama `/` merender halaman `automate` yang menyediakan:

- **Konfigurasi target halaman**
  - Target URL
  - Metode sesi: `new` (sesi baru) atau `reuse` (menggunakan sesi login yang sudah ada)
  - Optional `sessionId` untuk mengikat ke sesi tertentu
  - Page Ready Indicator (selector / text / URL pattern) untuk memastikan halaman benar-benar siap diinteraksikan sebelum Playwright mulai bekerja

- **Konfigurasi sumber data**
  - Upload file **CSV/XLSX** atau input manual di tabel
  - Mode eksekusi: `single` (satu baris) atau `batch` (semua baris)
  - Pratinjau data (beberapa baris pertama) agar pengguna memahami dataset yang akan dijalankan

- **Pemetaan field form berbasis maksud bisnis** (bukan selector DOM)
  - Nama field yang mudah dipahami pengguna (mis. "Nama Lengkap", "Email", "Status")
  - Tipe input: `text`, `select`, `checkbox`, `radio`, `textarea`
  - Kunci data (`dataKey`) yang mengacu ke kolom data
  - Status wajib / opsional
  - Daftar label utama (teks yang diharapkan muncul di halaman)
  - Daftar label cadangan (fallback) jika label utama tidak ditemukan
  - Logika kondisional sederhana:
    - Hanya isi jika data tersedia (`dataExists`)
    - Hanya isi jika elemen tertentu muncul (`elementExists`)

- **Definisi alur aksi eksplisit**
  - Jenis aksi:
    - `fill` – mengisi field berdasarkan mapping
    - `click` – menekan tombol/elemen
    - `wait` – menunggu sejumlah detik
    - `handleDialog` – menangani dialog/konfirmasi
  - Target aksi:
    - Untuk `fill`: nama field bisnis
    - Untuk aksi lain: label/selector konseptual (nantinya diterjemahkan oleh Runner)
  - `waitFor` indicator per aksi (selector / text / URL) untuk menyatakan kondisi pasca-aksi

- **Indikator hasil eksekusi**
  - **Success Indicator** (wajib): selector/text/url yang menandakan automasi berhasil
  - **Failure Indicator** (opsional): selector/text/url yang menandakan automasi gagal

### 2. Automation Plan (Output Terstandarisasi)

Setelah konfigurasi selesai, PrivyLens menghasilkan **Automation Plan** dalam bentuk struktur data JSON terstandarisasi, misalnya (disederhanakan):

```json
{
  "target": {
    "url": "https://example.com/form",
    "sessionMethod": "reuse",
    "sessionId": "session-123",
    "pageReadyIndicator": { "type": "selector", "value": ".form-root" }
  },
  "dataSource": {
    "type": "upload",
    "rows": [ { "nama": "A", "email": "a@example.com" } ],
    "mode": "batch"
  },
  "fieldMappings": [
    {
      "name": "Nama Lengkap",
      "type": "text",
      "dataKey": "nama",
      "required": true,
      "labels": ["Nama", "Nama Lengkap"],
      "fallbackLabels": ["Full Name"]
    }
  ],
  "actions": [
    { "type": "fill", "target": "Nama Lengkap" },
    { "type": "click", "target": "Submit" }
  ],
  "successIndicator": { "type": "text", "value": "Data berhasil disimpan" }
}
```

Automation Plan ini bersifat **final** dan **reproducible**, dan menjadi **satu-satunya input** untuk Playwright Runner.

### 3. Integrasi Playwright Runner (eksternal)

- Playwright Runner **tidak berada di repo ini**.
- PrivyLens mengirimkan Automation Plan (dan data terkait) ke endpoint Runner, misalnya:
  - `POST /api/automation/run` (Next.js API route atau service eksternal)
- Runner bertugas:
  - Menjalankan browser nyata (Chromium/Firefox/WebKit)
  - Mengelola sesi (baru / reuse)
  - Menavigasi ke target URL
  - Mencari elemen menggunakan strategi locator berlapis (label, teks, role, dsb.)
  - Mengeksekusi aksi-aksi yang didefinisikan
  - Menangani variasi struktur form secara defensif
  - Melaporkan hasil per baris data (success / partial / failed) beserta alasan
- Runner **tidak boleh** menyimpan state bisnis jangka panjang atau membuat keputusan lanjutan di luar Automation Plan.

### 4. Laporan Eksekusi

- Setelah eksekusi, Playwright Runner mengembalikan laporan dalam bentuk JSON.
- PrivyLens menampilkan laporan tersebut dengan:
  - Status global (berhasil / error)
  - Ringkasan jumlah baris sukses / gagal
  - Detail per baris:
    - Data yang dipakai
    - Aksi yang dijalankan dan statusnya
    - Error atau warning yang terjadi
- Pengguna dapat:
  - Memperbaiki Automation Plan (mis. label kurang spesifik, urutan aksi salah)
  - Menjalankan ulang **tanpa** harus membangun konfigurasi dari awal.

---

## Struktur Proyek

Setelah pembersihan backend dan folder `frontend`, struktur utama proyek menjadi:

```text
privylens/
├── .next/                  # Output build Next.js (otomatis)
├── public/                 # Asset statis (ikon, ilustrasi, dll.)
├── src/
│   ├── app/
│   │   ├── automate/
│   │   │   ├── components/
│   │   │   │   ├── ActionFlowSection.jsx
│   │   │   │   ├── AutomationPlanPreview.jsx
│   │   │   │   ├── DataSourceSection.jsx
│   │   │   │   ├── ExecutionReport.jsx
│   │   │   │   ├── FieldMappingSection.jsx
│   │   │   │   └── TargetConfiguration.jsx
│   │   │   └── page.jsx           # Halaman utama Automation Plan
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.jsx             # Layout global + Header
│   │   └── page.jsx               # Home → merender halaman automate
│   ├── components/
│   │   └── Header.jsx             # Navigasi sederhana (saat ini hanya Home/Automate)
│   └── lib/
│       └── api.js                 # Helper untuk ekstraksi CSV/XLSX (backend eksternal)
├── next.config.mjs
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── eslint.config.mjs
├── jsconfig.json
└── README.md
```

Catatan:

- Folder/fungsi lama untuk **analysis** dan **extraction** telah dihapus.
- Folder `backend/` sudah dihilangkan dari repo ini. Jika Anda ingin memakai backend terpisah, jalankan di repo/layanan lain dan sesuaikan `API_BASE_URL` di `src/lib/api.js`.

---

## Dependensi & Menjalankan Aplikasi

### Prasyarat

- **Node.js** 18 atau lebih baru
- **npm** (atau pnpm/yarn, sesuaikan sendiri)

### Instalasi

```bash
# Dari root project
npm install
```

### Menjalankan Dev Server

```bash
npm run dev
# Aplikasi akan tersedia di http://localhost:3000
```

Home (`/`) akan langsung menampilkan halaman **Automation Plan Builder**.

---

## Integrasi dengan Backend Ekstraksi & Playwright Runner

Secara default, helper `src/lib/api.js` mengarah ke:

```javascript
const API_BASE_URL = "http://localhost:8000";
```

Anda dapat:

- Menyediakan service ekstraksi CSV/XLSX sendiri di belakang `API_BASE_URL`, **atau**
- Mengubah `API_BASE_URL` menjadi `"/api"` dan mengimplementasikan Next.js API route (`src/app/api/...`) sesuai kebutuhan.

Playwright Runner diharapkan tersedia di endpoint seperti:

```http
POST /api/automation/run
Content-Type: application/json

{ "plan": { ...AutomationPlan... } }
```

Endpoint ini **belum** diimplementasikan di repo ini dan perlu Anda sediakan sendiri sesuai infrastruktur yang diinginkan.

---

## Prinsip Desain dan Pemisahan Fase

1. **PrivyLens mengelola niat & konfigurasi**:
   - Tidak menyimpan selector DOM teknis di UI
   - Semua yang didefinisikan bersifat konseptual (field bisnis, label, aksi logis)

2. **Playwright Runner mengeksekusi di browser**:
   - Mengambil Automation Plan sebagai input immutable
   - Melakukan pencarian elemen yang robust berdasarkan label & strategi locator berlapis
   - Meng-handle variasi DOM secara defensif

3. **Tidak ada skrip browser ad-hoc**:
   - Tidak ada lagi generator script `console.log` atau content-script Chrome extension di UI
   - Semua eksekusi harus melalui Playwright Runner yang mengonsumsi Automation Plan

Dengan arsitektur ini, PrivyLens menjadi alat perancangan otomasi yang stabil, dapat diulang, dan lebih mudah diintegrasikan dengan runner atau orkestrator lain di masa depan.
