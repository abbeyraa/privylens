# OtoMate — Automation Partner for Internal Operations

## Tentang OtoMate

OtoMate adalah platform automasi web berbasis **Playwright** dan **Electron** yang dirancang khusus untuk penggunaan internal kantor dan developer. Aplikasi ini menyediakan sistem automasi yang terkontrol, dapat diamati, dan dapat dipertanggungjawabkan untuk mendukung operasional harian yang efisien dan andal.

OtoMate bukan sekadar alat otomatisasi klik, melainkan solusi automasi yang komprehensif dengan pendekatan terstruktur untuk merancang, menjalankan, dan memelihara proses automasi web dalam lingkungan kerja yang nyata.

---

## Masalah yang Diselesaikan

Dalam operasional internal, tim sering menghadapi tantangan:

- **Tugas Berulang yang Membosankan**: Pengisian form, input data, atau proses administratif yang dilakukan berulang kali menghabiskan waktu dan rentan terhadap kesalahan manusia.
- **Kurangnya Kontrol dan Observabilitas**: Proses automasi yang tidak transparan membuat sulit untuk memahami apa yang terjadi, mengapa terjadi kegagalan, atau bagaimana memperbaikinya.
- **Ketidakstabilan dan Perubahan UI**: Website yang sering berubah membutuhkan pemeliharaan automasi yang terus-menerus, namun tanpa mekanisme yang jelas untuk mendeteksi dan menangani perubahan tersebut.
- **Kurangnya Akuntabilitas**: Tidak ada catatan yang jelas tentang apa yang telah dijalankan, kapan, dan dengan hasil seperti apa, sehingga sulit untuk audit atau troubleshooting.

OtoMate dirancang untuk mengatasi semua tantangan ini dengan pendekatan yang sistematis dan berkelanjutan.

---

## Filosofi Desain

### 1. Kontrol Penuh atas Proses

Setiap automasi di OtoMate dimulai dari **Automation Plan** yang terdefinisi dengan jelas. Plan ini bukan hanya urutan aksi, melainkan dokumen yang menjelaskan tujuan, konteks, dan parameter eksekusi. Dengan pendekatan ini, setiap automasi dapat direview, dimodifikasi, dan dipertanggungjawabkan.

### 2. Observabilitas yang Komprehensif

OtoMate menyediakan visibilitas penuh terhadap proses automasi. Setiap eksekusi menghasilkan laporan detail yang mencakup status setiap langkah, waktu eksekusi, dan konteks kegagalan jika terjadi. Sistem logging yang terstruktur memungkinkan pelacakan historis dan analisis pola.

### 3. Keandalan Jangka Panjang

Dengan fitur **versioning** untuk Automation Plan, perubahan dapat dilacak dan di-rollback jika diperlukan. **Safe Run** mode memungkinkan pengujian tanpa risiko, sementara **Session Reuse** mengoptimalkan penggunaan sumber daya dan menjaga konsistensi eksekusi.

### 4. Inteligensi dalam Menangani Kegagalan

**Failure Intelligence** secara otomatis mengklasifikasikan kegagalan berdasarkan kategori (perubahan selector, validasi form, session expired, dll.) dan memberikan rekomendasi perbaikan yang dapat ditindaklanjuti. **Assisted Repair** mode memungkinkan intervensi manual saat diperlukan, dengan kemampuan untuk pause, perbaiki, dan resume secara deterministik.

### 5. Pembelajaran dan Adaptasi

**Inspector Mode** membantu pengguna memahami proses interaksi halaman web sebelum menyusun automasi. Dengan observasi yang sistematis, pengguna dapat merancang automasi yang lebih robust dan sesuai dengan karakteristik halaman target.

---

## Fitur Utama

### Automation Plan

Automation Plan adalah dokumen terstruktur yang mendefinisikan seluruh proses automasi, meliputi:

- **Target Configuration**: URL target, indikator kesiapan halaman, dan konfigurasi login jika diperlukan
- **Data Source**: Sumber data (CSV/XLSX atau manual) dan mode eksekusi (single atau batch)
- **Field Mapping**: Pemetaan field bisnis ke elemen halaman dengan dukungan multiple label dan fallback
- **Action Flow**: Urutan aksi yang akan dieksekusi (fill, click, wait, navigate, handleDialog)
- **Execution Configuration**: Mode eksekusi (once atau loop) dengan kondisi penghentian yang dapat dikonfigurasi
- **Success/Failure Indicators**: Indikator untuk mendeteksi keberhasilan atau kegagalan proses

Plan ini dapat disimpan, di-version, dan digunakan kembali untuk eksekusi berulang.

### Versioning

Setiap perubahan pada Automation Plan dapat disimpan sebagai versi baru. Sistem versioning memungkinkan:

- Pelacakan perubahan dari waktu ke waktu
- Rollback ke versi sebelumnya jika diperlukan
- Perbandingan antar versi untuk memahami evolusi plan
- Dokumentasi alasan perubahan melalui metadata versi

### Safe Run Mode

Safe Run adalah mode pengujian yang mengeksekusi automasi tanpa melakukan aksi yang bersifat permanen (seperti submit form). Mode ini berguna untuk:

- Memvalidasi logika automasi sebelum eksekusi penuh
- Menguji perubahan pada plan tanpa risiko
- Debugging dan troubleshooting tanpa mempengaruhi data produksi

### Session Reuse

Session Reuse mengoptimalkan penggunaan browser session untuk mengurangi overhead dan menjaga konsistensi. Fitur ini:

- Memanfaatkan session yang sudah ada untuk mengurangi waktu loading
- Menjaga state browser antar eksekusi untuk proses yang berhubungan
- Mengurangi konsumsi sumber daya dengan menghindari inisialisasi berulang

### Failure Intelligence

Sistem Failure Intelligence secara otomatis menganalisis kegagalan dan memberikan insight yang dapat ditindaklanjuti:

- **Klasifikasi Otomatis**: Mengkategorikan kegagalan berdasarkan pola error (selector change, label change, form validation, session expired, timing issue, dll.)
- **Severity Assessment**: Menentukan tingkat keparahan kegagalan (critical, high, medium, low)
- **Rekomendasi Perbaikan**: Menghasilkan saran spesifik untuk mengatasi masalah berdasarkan klasifikasi
- **Pattern Analysis**: Menganalisis pola kegagalan dari multiple failures untuk mengidentifikasi masalah sistemik

### Assisted Repair

Assisted Repair mode memungkinkan intervensi manual saat terjadi kegagalan:

- **Pause on Failure**: Otomatis pause saat kegagalan terdeteksi
- **Manual Intervention**: Pengguna dapat memperbaiki masalah secara manual di browser
- **Deterministic Resume**: Resume eksekusi dari titik yang tepat setelah perbaikan
- **State Preservation**: Menyimpan state eksekusi untuk recovery yang akurat

### Inspector Mode

Inspector Mode adalah alat observasi interaktif untuk memahami proses interaksi halaman web:

- **Browser Preview**: Membuka halaman target dalam browser nyata untuk observasi
- **Process Timeline**: Menampilkan events secara kronologis (navigation, loading, element appear, click, input, dll.)
- **Event Recording**: Mencatat berbagai jenis events untuk analisis
- **Action Flow Generation**: Mengkonversi selected events menjadi draft Automation Plan
- **Draft Management**: Menyimpan dan memuat draft untuk iterasi desain

---

## Arsitektur Teknis

OtoMate dibangun dengan teknologi modern untuk memastikan keandalan dan performa:

- **Frontend**: Next.js (App Router) dengan React untuk UI yang responsif dan interaktif
- **Node-based Editor**: Menggunakan `@xyflow/react` untuk visual editor yang intuitif
- **Automation Engine**: Playwright (Chromium) untuk eksekusi automasi yang robust
- **Desktop App**: Electron untuk distribusi sebagai aplikasi desktop yang dapat dijalankan secara standalone
- **Modular Architecture**: Struktur kode yang modular untuk kemudahan maintenance dan pengembangan

### Struktur Runner

Playwright runner diorganisir dalam struktur modular:

- **Normalization**: Validasi dan normalisasi automation plan
- **Login Handler**: Manajemen proses autentikasi
- **Navigation Handler**: Penanganan navigasi dan routing
- **Action Executor**: Eksekusi berbagai jenis aksi dengan multiple strategies
- **Element Finder**: Pencarian elemen dengan berbagai strategi (selector, label, role, text, dll.)
- **Indicator Handlers**: Penanganan page ready, wait, dan check indicators
- **Dialog Handler**: Auto-handling untuk browser dialogs

---

## Penggunaan

### Prasyarat

- **Node.js** 18 atau lebih tinggi
- **npm** untuk manajemen dependensi

> **Catatan**: Repositori ini secara otomatis menginstall browser Playwright Chromium melalui script `postinstall`.

### Instalasi

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

Akses aplikasi di `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

### Electron Desktop App

```bash
# Development mode
npm run electron:dev

# Build untuk Windows
npm run electron:build:win

# Build untuk macOS
npm run electron:build:mac

# Build untuk Linux
npm run electron:build:linux
```

---

## Workflow Penggunaan

### 1. Merancang Automation Plan

Gunakan **Editor** untuk merancang Automation Plan dengan pendekatan visual:

- Konfigurasi target URL dan indikator kesiapan halaman
- Tambahkan sumber data (jika diperlukan) atau gunakan mode action-only
- Definisikan field mapping untuk data-driven automation
- Susun action flow dengan drag-and-drop node editor
- Konfigurasi execution mode dan indikator sukses/gagal

### 2. Observasi dengan Inspector (Opsional)

Sebelum menyusun plan, gunakan **Inspector Mode** untuk:

- Mengamati interaksi halaman secara real-time
- Mencatat events penting dalam timeline
- Generate draft action flow dari events yang terpilih

### 3. Pengujian dengan Safe Run

Sebelum eksekusi penuh, uji plan dengan **Safe Run Mode**:

- Validasi logika automasi tanpa risiko
- Identifikasi masalah potensial sebelum produksi
- Pastikan semua aksi dapat dieksekusi dengan benar

### 4. Eksekusi dan Monitoring

Jalankan automasi dan pantau proses:

- Eksekusi menghasilkan execution report yang detail
- Setiap langkah dicatat dengan status dan waktu
- Kegagalan otomatis dianalisis oleh Failure Intelligence

### 5. Penanganan Kegagalan

Jika terjadi kegagalan:

- Review klasifikasi dan rekomendasi dari Failure Intelligence
- Gunakan Assisted Repair untuk intervensi manual jika diperlukan
- Update Automation Plan berdasarkan insight yang diperoleh
- Simpan sebagai versi baru untuk pelacakan perubahan

---

## Keamanan dan Best Practices

### Kredensial dan Data Sensitif

- Kredensial login disimpan sebagai bagian dari Automation Plan → **Gunakan hanya untuk development/testing**
- Untuk produksi, pertimbangkan menggunakan environment variables atau sistem manajemen secret yang aman
- Jangan commit kredensial ke version control

### Safe Run untuk Testing

- Selalu uji plan baru dengan Safe Run mode sebelum eksekusi penuh
- Gunakan Safe Run untuk memvalidasi perubahan pada plan yang sudah ada

### Versioning dan Dokumentasi

- Simpan setiap perubahan signifikan sebagai versi baru
- Dokumentasikan alasan perubahan dalam metadata versi
- Review versi sebelumnya untuk memahami evolusi plan

### Monitoring dan Logging

- Review execution report secara rutin untuk mengidentifikasi pola kegagalan
- Gunakan Failure Intelligence untuk memahami akar masalah
- Maintain log eksekusi untuk audit dan troubleshooting

---

## Testing & Quality Assurance

```bash
# Linting
npm run lint

# Playwright tests
npx playwright test
```

---

## Struktur Proyek

```
otomate/
├── electron/              # Electron main process files
├── public/               # Static assets
├── src/
│   ├── app/
│   │   ├── actions/      # Server actions (runAutomation, startInspector)
│   │   ├── create-template/  # Template creation page
│   │   ├── editor/       # Main automation editor
│   │   │   ├── components/
│   │   │   │   ├── actions/        # Action node components
│   │   │   │   ├── data-source/    # Data source components
│   │   │   │   ├── execution/     # Execution & report components
│   │   │   │   ├── field-mapping/  # Field mapping components
│   │   │   │   ├── nodes/          # Base node components
│   │   │   │   └── target/         # Target configuration
│   │   │   ├── context/            # Editor state management
│   │   │   └── utils/              # Editor utilities
│   │   ├── inspector/    # Inspector mode page
│   │   ├── logs/         # Execution logs viewer
│   │   ├── settings/     # Application settings
│   │   └── templates/    # Automation plan templates
│   ├── components/        # Shared UI components
│   └── lib/
│       ├── api.js                    # CSV/XLSX parsing
│       ├── assistedRepair.js         # Assisted repair utilities
│       ├── failureIntelligence.js    # Failure analysis system
│       ├── inspectorRecorder.js     # Inspector event recording
│       └── playwright-runner/        # Modular Playwright runner
│           ├── index.js              # Entry point
│           ├── loader.js             # Playwright loader
│           ├── normalize.js          # Plan normalizer
│           ├── login.js              # Login handler
│           ├── navigation.js         # Navigation handler
│           ├── actions.js            # Action executor
│           ├── elementFinder.js      # Element finder
│           ├── clickHandler.js       # Click handler
│           ├── humanType.js          # Human-like typing
│           ├── indicators.js         # Indicator handlers
│           ├── dialog.js             # Dialog handler
│           └── utils.js              # Utilities
└── tests/                # Test files
```

---

## Visi Jangka Panjang

OtoMate dirancang sebagai alat kerja jangka panjang yang:

- **Stabil dan Dapat Diandalkan**: Arsitektur yang solid dan praktik pengembangan yang baik memastikan aplikasi dapat diandalkan untuk penggunaan sehari-hari
- **Mudah Dipelihara**: Struktur modular dan dokumentasi yang jelas memudahkan maintenance dan pengembangan lebih lanjut
- **Dapat Dikembangkan**: Ekstensibilitas memungkinkan penambahan fitur baru sesuai kebutuhan operasional
- **Berfokus pada Workflow Nyata**: Setiap fitur dirancang untuk menyelesaikan masalah nyata dalam lingkungan kerja internal

---

## Kontribusi dan Dukungan

OtoMate adalah aplikasi internal yang dikembangkan untuk mendukung operasional perusahaan. Untuk pertanyaan, saran, atau laporan masalah, silakan hubungi tim pengembang internal.

---

## Lisensi

Aplikasi ini adalah proprietary software untuk penggunaan internal perusahaan.

---

**OtoMate** — Automation Partner for Internal Operations

*Mengotomatisasi dengan kontrol, observabilitas, dan akuntabilitas.*
