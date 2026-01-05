# Template Storage - JSON File Storage Implementation

## 📋 Overview

Template storage sekarang menggunakan **JSON file storage** yang disimpan di file system melalui Electron, dengan fallback ke localStorage untuk mode web.

## 🗂️ Lokasi Penyimpanan

### Electron (Desktop App)
- **Windows**: `%APPDATA%/otomate/templates.json`
- **macOS**: `~/Library/Application Support/otomate/templates.json`
- **Linux**: `~/.config/otomate/templates.json`

### Web Mode
- Fallback ke `localStorage` dengan key `otomate_templates`

## 🔧 Struktur Implementasi

### 1. Electron Main Process
- **File**: `electron/templateStorage.js`
- **Fungsi**: 
  - `readTemplates()` - Membaca template dari file
  - `writeTemplates(templates)` - Menulis template ke file
  - `migrateFromLocalStorage(data)` - Migrasi dari localStorage
  - `getStorageInfo()` - Info tentang storage

### 2. IPC Handlers
- **File**: `electron/main.js`
- **Handlers**:
  - `template-storage:read` - Read templates
  - `template-storage:write` - Write templates
  - `template-storage:migrate` - Migrate from localStorage
  - `template-storage:info` - Get storage info

### 3. Preload Script
- **File**: `electron/preload.js`
- **Exposed API**: `window.electronAPI.templateStorage`

### 4. Frontend Service
- **File**: `src/lib/templateStorage.js`
- **Fungsi**:
  - `getTemplates()` - Async read dengan auto-fallback
  - `saveTemplates(templates)` - Async write dengan auto-fallback
  - `migrateToFileStorage()` - Auto-migration on mount
  - `getStorageInfo()` - Get storage information
  - `isFileStorageAvailable()` - Check if Electron available

## 🔄 Auto-Migration

Migration dari localStorage ke file storage dilakukan otomatis:
- **Trigger**: Saat aplikasi pertama kali dibuka setelah update
- **Behavior**: 
  - Hanya migrasi sekali (flag: `otomate_migrated_to_file`)
  - Tidak overwrite jika file sudah ada
  - Data tetap ada di localStorage sebagai backup

## 📝 Penggunaan

### Di Component React

```javascript
import { getTemplates, saveTemplates } from "@/lib/templateStorage";

// Read templates
const templates = await getTemplates();

// Save templates
const success = await saveTemplates(templates);
```

### Auto-Migration

```javascript
import { migrateToFileStorage } from "@/lib/templateStorage";

// Di useEffect on mount
useEffect(() => {
  migrateToFileStorage();
}, []);
```

## ✅ Keuntungan

1. **Persistensi**: Data tersimpan di file system, tidak hilang saat clear browser cache
2. **Portabilitas**: File bisa di-copy/backup dengan mudah
3. **Backward Compatible**: Fallback ke localStorage untuk web mode
4. **Auto-Migration**: Migrasi otomatis tanpa kehilangan data
5. **No Dependencies**: Tidak perlu install database library

## 🔍 Debugging

### Check Storage Info

```javascript
import { getStorageInfo } from "@/lib/templateStorage";

const info = await getStorageInfo();
console.log(info);
// Output: { type: 'file', path: '...', size: 1234, templateCount: 5 }
```

### Manual File Access

File JSON bisa dibuka langsung dengan text editor untuk:
- Backup manual
- Debugging struktur data
- Manual editing (tidak disarankan)

## ⚠️ Catatan Penting

1. **File Format**: JSON dengan pretty formatting (2 spaces indent)
2. **Error Handling**: Semua error di-handle dengan fallback ke localStorage
3. **Concurrent Access**: File operations di-handle secara sequential oleh Electron IPC
4. **Data Validation**: Template harus berupa array, invalid data akan di-reject

## 🚀 Next Steps (Optional)

Jika di masa depan perlu fitur lebih advanced:
- **SQLite**: Untuk query kompleks dan indexing
- **Encryption**: Untuk encrypt sensitive data (login credentials)
- **Cloud Sync**: Sync ke cloud storage
- **Version Control**: Git-like versioning untuk templates

