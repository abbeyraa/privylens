# PrivyLens — Node-based Automation Editor + Playwright Runner

## Ringkasan

PrivyLens adalah aplikasi **Next.js (App Router)** dengan UI **node-based editor** untuk merancang “Automation Plan” (rencana otomasi) pengisian form berbasis browser, lalu mengeksekusinya di server menggunakan **Playwright (Chromium)**.

- **Home (`/`)** langsung membuka **Editor**.
- Route lama **`/automate`** sudah **redirect** ke home (Editor).

---

## Konsep UI (Node-based)

Di Editor, user **klik node/card** di canvas untuk mengisi detail di panel kanan.

Saat ini Editor mendukung 2 mode:

### 1) Data-driven

Cocok untuk input form berdasarkan dataset.

- **Sumber Data**: upload CSV/XLSX (diparse di browser) atau input manual
- **Mode data**:
  - `single` (1 baris)
  - `batch` (semua baris)
- **Field Mapping**: definisi field bisnis → label di halaman → `dataKey`
- **Alur Aksi** bisa berisi `fill`, `click`, `wait`, `navigate`, `handleDialog`

Eksekusi mengikuti mode data (`single/batch`).

### 2) Action-only (bulk)

Cocok untuk otomasi aksi berulang tanpa dataset (mis. bulk delete).

- Tidak butuh **Sumber Data** dan **Field Mapping**
- Alur aksi biasanya `click/wait/navigate/handleDialog`
- Mendukung **loop** sampai kondisi terpenuhi (contoh: berhenti saat data habis)

Konfigurasi loop disimpan di `plan.execution`:

- `execution.mode`: `once` atau `loop`
- `execution.loop.indicator`: selector/text/url yang dipakai sebagai trigger
- `execution.loop.stopWhen`: `visible` atau `notVisible`

---

## Cara kerja (arsitektur singkat)

1. UI Editor menyusun `plan`.
2. Tombol **“Jalankan Automation Plan”** memanggil Server Action `runAutomation(plan)`.
3. Server Action memanggil runner Playwright `executeAutomationPlan(plan)`.
4. Runner mengembalikan **execution report** → UI menampilkan ringkasan + detail.

Komponen kunci:

- UI editor: `src/app/editor/page.jsx`
- Server action: `src/app/actions/runAutomation.js`
- Runner: `src/lib/playwright-runner.js`
- Parsing CSV/XLSX: `src/lib/api.js` (langsung di frontend)
- Canvas/node editor: `@xyflow/react`

---

## Contoh Automation Plan

### A) Data-driven (disederhanakan)

```json
{
  "target": {
    "url": "https://example.com/form",
    "pageReadyIndicator": { "type": "selector", "value": ".form-root" }
  },
  "dataSource": {
    "type": "upload",
    "rows": [{ "nama": "A", "email": "a@example.com" }],
    "mode": "single",
    "selectedRowIndex": 0
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
  ]
}
```

### B) Action-only bulk delete (loop sampai data habis)

```json
{
  "target": {
    "url": "https://example.com/transactions",
    "pageReadyIndicator": { "type": "selector", "value": ".table" }
  },
  "dataSource": { "type": "manual", "rows": [{}], "mode": "single", "selectedRowIndex": 0 },
  "fieldMappings": [],
  "execution": {
    "mode": "loop",
    "loop": {
      "maxIterations": 200,
      "delaySeconds": 0,
      "stopWhen": "notVisible",
      "indicator": { "type": "selector", "value": "button.btn-delete" }
    }
  },
  "actions": [
    { "type": "click", "target": "button.btn-delete" },
    { "type": "handleDialog" }
  ]
}
```

---

## Menjalankan aplikasi

### Prasyarat

- **Node.js** 18+
- **npm**

> Catatan: repo ini menginstall browser Playwright Chromium via script `postinstall`.

### Instalasi

```bash
npm install
```

### Development

```bash
npm run dev
```

Akses: `http://localhost:3000` (Editor)

### Production build

```bash
npm run build
npm start
```

---

## Catatan penting (Playwright / environment)

- Runner berjalan **server-side** (Server Action).
- Di `src/lib/playwright-runner.js`, browser diluncurkan dengan `headless: false` (Chromium akan muncul).
  - Untuk CI / server tanpa display, ubah ke `headless: true`.
- Kredensial login (jika dipakai) ikut terkirim sebagai bagian dari plan → gunakan hanya untuk dev/test.

---

## Testing & Lint

```bash
npm run lint
```

```bash
npx playwright test
```

---

## Struktur proyek (ringkas)

```text
privylens/
├── public/
├── src/
│   ├── app/
│   │   ├── actions/
│   │   │   └── runAutomation.js
│   │   ├── automate/                 # route lama (redirect ke /)
│   │   │   └── page.jsx
│   │   ├── editor/
│   │   │   ├── components/
│   │   │   │   └── CardNode.jsx
│   │   │   └── page.jsx              # Editor (node-based)
│   │   ├── layout.jsx
│   │   └── page.jsx                  # Home -> Editor
│   ├── components/
│   │   └── Header.jsx
│   └── lib/
│       ├── api.js
│       └── playwright-runner.js
└── tests/
```
