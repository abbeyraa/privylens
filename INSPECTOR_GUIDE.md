# Interactive Automation Inspector Guide

## Overview

Interactive Automation Inspector adalah fitur yang memungkinkan pengguna mengamati dan memahami proses interaksi halaman web sebelum menyusun Automation Plan. Fitur ini membantu mengidentifikasi langkah-langkah yang diperlukan dalam automasi tanpa harus menebak atau melakukan trial and error.

## Fitur Utama

### 1. Browser Preview dengan Observasi
- Membuka halaman target dalam browser nyata (Playwright)
- Mode observasi tanpa eksekusi automasi
- Browser tetap terbuka untuk interaksi manual
- Real-time monitoring perubahan halaman

### 2. Process Timeline
- Menampilkan events secara kronologis
- Real-time update saat events terjadi
- Filter untuk menampilkan hanya events penting
- Visual timeline dengan icon dan color coding

### 3. Event Recording
Sistem mencatat berbagai jenis events:
- **Navigation** - Perubahan URL
- **Loading** - Status loading halaman
- **Network Idle** - Tidak ada request network aktif
- **Element Appear/Disappear** - Kemunculan/hilangnya elemen UI
- **Click** - Klik pengguna
- **Input** - Input data ke field
- **Submit** - Submit form
- **Modal/Toast** - Kemunculan modal atau toast notification
- **Spinner** - Loading spinner

### 4. Event Management
- **Select Events** - Pilih events untuk dijadikan action flow
- **Mark as Important** - Tandai events penting
- **Filter** - Tampilkan hanya events penting
- **View Details** - Lihat detail setiap event

### 5. Action Flow Generation
- Generate draft action flow dari selected events
- Konversi otomatis events ke actions:
  - Navigation → navigate action
  - Click → click action
  - Input → fill action
  - Network Idle/Element Appear → wait action
- Export ke Editor untuk editing lebih lanjut

### 6. Draft Management
- **Save Draft** - Simpan events dan selections
- **Load Draft** - Muat draft yang sudah disimpan
- **Import to Editor** - Import langsung ke Automation Plan editor

## Cara Menggunakan

### 1. Membuka Inspector
1. Klik menu "Inspector" di sidebar
2. Masukkan URL target di input field
3. Klik "Mulai Inspection"

### 2. Mengamati Halaman
- Browser Playwright akan terbuka dengan halaman target
- Interaksi manual di browser akan direkam sebagai events
- Events muncul secara real-time di timeline

### 3. Menandai Events Penting
- Klik icon check/cross di event card untuk menandai sebagai penting
- Gunakan filter "Hanya penting" untuk menyederhanakan view

### 4. Memilih Events untuk Action Flow
- Klik event card untuk memilih/deselect
- Selected events akan ditandai dengan border biru
- Pilih minimal satu event untuk generate action flow

### 5. Generate Action Flow
1. Pilih events yang ingin dijadikan actions
2. Klik "Generate Action Flow"
3. Pilih:
   - **OK** - Buka di Editor untuk editing
   - **Cancel** - Copy ke clipboard

### 6. Import ke Editor
- Jika memilih "OK", akan diarahkan ke Editor
- Actions akan otomatis ditambahkan ke canvas
- Actions dapat diedit seperti biasa

## Event Types dan Konversi

| Event Type | Konversi ke Action | Keterangan |
|------------|-------------------|------------|
| Navigation | `navigate` | Navigate ke URL |
| Click | `click` | Click element |
| Input | `fill` | Fill field (perlu field mapping) |
| Network Idle | `wait` | Wait for network idle |
| Element Appear | `wait` | Wait for element dengan selector |
| Submit | `click` | Click submit button |

## Tips Penggunaan

1. **Mulai dengan URL Target**
   - Pastikan URL target valid dan dapat diakses
   - Gunakan URL lengkap dengan protocol (https://)

2. **Tandai Events Penting**
   - Tandai events yang kritis untuk automasi
   - Contoh: Network Idle, Element Appear untuk form

3. **Pilih Events Secara Selektif**
   - Tidak semua events perlu dijadikan actions
   - Pilih events yang relevan dengan flow automasi

4. **Review di Editor**
   - Actions yang diimport perlu direview dan disesuaikan
   - Tambahkan field mappings untuk fill actions
   - Sesuaikan selectors jika perlu

5. **Save Draft**
   - Simpan draft jika ingin melanjutkan nanti
   - Berguna untuk iterasi dan perbaikan

## Integrasi dengan Editor

Actions yang diimport dari Inspector:
- Otomatis ditambahkan sebagai action nodes di canvas
- Terhubung secara sequential
- Dapat diedit seperti actions biasa
- Target URL otomatis diisi jika tersedia

## Catatan Implementasi

**Browser Preview**:
- Saat ini menggunakan placeholder UI
- Untuk implementasi penuh, diperlukan integrasi dengan Playwright browser instance
- Browser harus tetap terbuka selama inspection

**Event Recording**:
- `inspectorRecorder.js` menyediakan fungsi untuk setup listeners
- Real-time events memerlukan WebSocket atau polling mechanism
- Saat ini menggunakan simulasi events untuk demo

**Future Enhancements**:
- Real-time browser preview dengan iframe atau screenshot
- WebSocket connection untuk real-time events
- Screenshot capture untuk setiap event
- Video recording dari inspection session
- Auto-detect form fields dan generate field mappings
- Smart recommendations berdasarkan event patterns

