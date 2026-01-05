# Failure Intelligence & Assisted Repair Mode

## Overview

Sistem ini mengubah kegagalan automation dari error mentah menjadi informasi terstruktur yang dapat dipahami, diperbaiki, dan dilanjutkan tanpa mengulang proses dari awal.

## Failure Intelligence

### Klasifikasi Kegagalan

Sistem mengklasifikasikan kegagalan ke dalam kategori berikut:

1. **Selector Change** - Selector element tidak ditemukan atau berubah
2. **Label Change** - Label atau teks field tidak ditemukan
3. **Form Validation** - Validasi form gagal atau data tidak valid
4. **Session Expired** - Sesi login telah kadaluarsa
5. **Timing Issue** - Masalah timing atau delay yang tidak cukup
6. **Page Loading** - Halaman membutuhkan waktu loading lebih lama
7. **UI Change** - Perubahan UI atau elemen tidak terlihat
8. **Network Error** - Masalah koneksi jaringan atau server
9. **Element Not Found** - Elemen tidak ditemukan
10. **Action Failed** - Action gagal dieksekusi
11. **Unknown** - Kegagalan tidak dapat diklasifikasikan

### Metadata Kegagalan

Setiap kegagalan menyimpan metadata terstruktur:
- Error message dan stack trace
- Klasifikasi dengan confidence level
- Context eksekusi (row index, action index, field, dll.)
- Metadata browser dan viewport

### Rekomendasi Perbaikan

Sistem menghasilkan rekomendasi praktis berdasarkan klasifikasi:
- Langkah-langkah perbaikan spesifik
- Prioritas (critical, high, medium, low)
- Action yang disarankan (check_label, add_fallback, dll.)

### Execution Report dengan Intelligence

Report menampilkan:
- Analisis pola kegagalan (frekuensi kategori)
- Rekomendasi perbaikan untuk setiap kegagalan
- User-friendly messages (bukan error teknis)
- Summary dengan distribusi kegagalan

## Assisted Repair Mode

### Fitur

1. **Pause on Failure** - Automation pause saat terjadi kegagalan
2. **Browser State Preservation** - Browser tetap terbuka di state terakhir
3. **Manual Repair** - User dapat melakukan perbaikan manual di browser
4. **Resume Options**:
   - **Continue** - Lanjutkan ke baris berikutnya (skip row saat ini)
   - **Retry** - Ulangi action yang gagal
   - **Skip Row** - Skip baris saat ini
   - **Abort** - Hentikan batch

### State Management

Execution state disimpan untuk recovery deterministik:
- Row index dan action index
- Data row yang sedang diproses
- Page URL dan state
- Failure metadata

### UI Components

- **AssistedRepairDialog** - Dialog untuk memilih tindakan perbaikan
- Toggle "Assisted Repair" di editor
- Informasi kegagalan dengan rekomendasi
- Progress indicator

## Implementasi

### Files

1. `src/lib/failureIntelligence.js` - Sistem klasifikasi dan analisis
2. `src/lib/assistedRepair.js` - State management untuk repair mode
3. `src/app/editor/components/execution/IntelligentExecutionReport.jsx` - Report dengan intelligence
4. `src/app/editor/components/execution/AssistedRepairDialog.jsx` - UI untuk repair mode
5. `src/lib/playwright-runner/actions.js` - Integrasi failure intelligence ke runner

### Integrasi

Failure Intelligence terintegrasi di:
- `executeAction()` - Menangkap error dan membuat metadata
- `executeActionsForRow()` - Menyertakan context untuk klasifikasi
- Execution report - Menampilkan intelligence dan rekomendasi

## Usage

### Mengaktifkan Assisted Repair Mode

1. Centang checkbox "Assisted Repair" di editor
2. Jalankan automation plan
3. Saat terjadi kegagalan, dialog akan muncul
4. Browser tetap terbuka untuk perbaikan manual
5. Pilih tindakan perbaikan dan klik "Terapkan"

### Melihat Intelligence Report

1. Setelah execution selesai, buka panel "Preview & Report"
2. Report menampilkan:
   - Analisis pola kegagalan
   - Rekomendasi perbaikan untuk setiap kegagalan
   - User-friendly messages

## Catatan Implementasi

**Assisted Repair Mode dengan Pause/Resume Real-time**:
- Implementasi saat ini menyediakan UI dan struktur dasar
- Untuk pause/resume real-time, diperlukan komunikasi WebSocket atau polling antara client dan server-side runner
- Browser state preservation memerlukan modifikasi runner untuk tidak menutup browser saat failure
- Resume logic memerlukan mekanisme untuk melanjutkan dari state yang disimpan

**Future Enhancements**:
- WebSocket connection untuk real-time communication
- Browser state persistence across repair sessions
- Automatic retry dengan exponential backoff
- Historical failure analysis dashboard
- Auto-fix suggestions berdasarkan pattern learning

