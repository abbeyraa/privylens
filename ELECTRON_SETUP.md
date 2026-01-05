# Setup Electron untuk PrivyLens

Aplikasi PrivyLens sekarang sudah dikonfigurasi untuk berjalan sebagai aplikasi desktop menggunakan Electron.

## 📋 Prerequisites

Pastikan Anda sudah menginstall:
- Node.js (v18 atau lebih baru)
- npm atau yarn

## 🚀 Cara Menggunakan

### Development Mode

Jalankan aplikasi dalam mode development dengan hot-reload:

```bash
npm run electron:dev
```

Perintah ini akan:
1. Menjalankan Next.js dev server di `http://localhost:3000`
2. Membuka window Electron yang terhubung ke dev server
3. DevTools akan otomatis terbuka untuk debugging

### Build untuk Production

#### Build untuk Windows:
```bash
npm run electron:build:win
```

#### Build untuk macOS:
```bash
npm run electron:build:mac
```

#### Build untuk Linux:
```bash
npm run electron:build:linux
```

#### Build untuk semua platform:
```bash
npm run electron:build
```

File hasil build akan berada di folder `dist/`.

## 📁 Struktur File Electron

```
electron/
├── main.js      # Main process Electron (entry point)
└── preload.js   # Preload script untuk keamanan
```

## ⚙️ Konfigurasi

### Package.json Scripts

- `electron:dev` - Development mode dengan hot-reload
- `electron:build` - Build untuk semua platform
- `electron:build:win` - Build khusus Windows
- `electron:build:mac` - Build khusus macOS
- `electron:build:linux` - Build khusus Linux

### Electron Builder Config

Konfigurasi electron-builder ada di `package.json` bagian `build`:
- **App ID**: `com.privylens.app`
- **Product Name**: `PrivyLens`
- **Output Directory**: `dist/`

## 🔧 Troubleshooting

### Port 3000 sudah digunakan
Jika port 3000 sudah digunakan, ubah variabel `PORT` di `electron/main.js` atau set environment variable:
```bash
PORT=3001 npm run electron:dev
```

### Build gagal
Pastikan:
1. Next.js build berhasil: `npm run build`
2. Folder `.next/standalone` ada setelah build
3. Semua dependencies terinstall: `npm install`

### Window tidak muncul
- Periksa console untuk error messages
- Pastikan Next.js server berjalan dengan benar
- Cek apakah port yang digunakan tidak blocked

## 📝 Catatan Penting

1. **Standalone Output**: Next.js dikonfigurasi untuk menghasilkan standalone output yang diperlukan untuk Electron
2. **Images Unoptimized**: Images di Next.js di-set unoptimized untuk kompatibilitas dengan Electron
3. **Security**: Electron menggunakan context isolation dan node integration disabled untuk keamanan

## 🎯 Next Steps

Setelah build berhasil, Anda bisa:
- Distribusikan file installer dari folder `dist/`
- Sign aplikasi untuk distribusi (opsional)
- Update icon dan metadata sesuai kebutuhan

