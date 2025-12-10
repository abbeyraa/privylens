# PrivyLens

### Local Document Intelligence Engine

PrivyLens adalah sistem analisis dokumen **offline-first** yang mampu membaca, mengekstraksi, dan menganalisis isi file seperti **PDF, DOCX, dan gambar/screenshot** menggunakan OCR dan model AI lokal. Semua proses berjalan pada perangkat pengguna, tanpa koneksi internet dan tanpa risiko kebocoran data.

---

## **Fitur Utama**

### **1. Ekstraksi Dokumen Offline**

PrivyLens mendukung:

- PDF (multi-page) - menggunakan pdfminer.six
- DOCX - menggunakan python-docx
- Gambar (PNG/JPG/JPEG) - menggunakan PaddleOCR
- Screenshot teks
- Dokumen hasil scan

Sistem otomatis mendeteksi tipe file dan mengekstraksi teks menggunakan parser dan OCR lokal.

### **2. Chat Kontekstual Dokumen (Offline)**

- Upload dokumen lalu ajukan pertanyaan berbasis konten dokumen.
- Model AI lokal menjawab tanpa koneksi internet.
- Seluruh percakapan dan konteks tidak keluar dari perangkat.

### **3. Privasi dan Keamanan Maksimal**

Tidak ada data yang dikirim ke server eksternal.  
Semua proses pemrosesan file, OCR, dan inferensi AI berlangsung pada perangkat pengguna.

### **4. UI yang Bersih dan Mudah Digunakan**

Aplikasi menyediakan antarmuka yang sederhana:

- Halaman upload dokumen
- Tampilan hasil ekstraksi
- Tampilan analisis AI

---

## **Persyaratan Sistem**

### **Backend (Python)**

- Python 3.10 atau lebih baru
- pip atau package manager Python lainnya

### **Frontend (Node.js)**

- Node.js 18 atau lebih baru
- npm atau yarn

### **AI Model (Ollama)**

- Ollama terinstall (https://ollama.ai)
- Model Llama3 sudah didownload

---

## **Instalasi dan Setup**

### **1. Setup Backend**

```bash
# Masuk ke direktori backend
cd backend

# Install dependencies Python
pip install -r requirements.txt
```

**Dependencies yang diinstall:**

- `fastapi` - Web framework
- `uvicorn[standard]` - ASGI server
- `python-multipart` - Untuk file upload
- `pdfminer.six` - Parser PDF
- `python-docx` - Parser DOCX
- `pillow` - Image processing
- `paddlepaddle` - Deep learning framework untuk OCR
- `paddleocr` - OCR engine
- `pydantic` - Data validation

### **2. Setup Frontend**

```bash
# Masuk ke direktori frontend
cd frontend

# Install dependencies Node.js
npm install
```

### **3. Setup Ollama (AI Model Lokal)**

**Install Ollama:**

1. Download dari https://ollama.ai
2. Install sesuai sistem operasi Anda
3. Pastikan Ollama service berjalan

**Download Model Llama3:**

```bash
ollama pull llama3
```

**Verifikasi:**

```bash
ollama list
# Harus menampilkan llama3 dalam daftar
```

---

## **Menjalankan Aplikasi**

### **1. Menjalankan Backend**

```bash
# Dari direktori backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend akan berjalan di `http://localhost:8000`

**Verifikasi:**

```bash
curl http://localhost:8000/
# Harus mengembalikan: {"status":"FastAPI backend running offline"}
```

### **2. Menjalankan Frontend**

```bash
# Dari direktori frontend (terminal baru)
cd frontend
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

### **3. Akses Aplikasi**

Buka browser dan akses: `http://localhost:3000`

---

## **Penggunaan API (cURL Examples)**

### **1. Upload dan Ekstrak Dokumen**

**Upload PDF:**

```bash
curl -X POST http://localhost:8000/ingest \
  -F "file=@/path/to/document.pdf"
```

**Upload DOCX:**

```bash
curl -X POST http://localhost:8000/ingest \
  -F "file=@/path/to/document.docx"
```

**Upload Gambar (OCR):**

```bash
curl -X POST http://localhost:8000/ingest \
  -F "file=@/path/to/image.png"
```

**Response:**

```json
{
  "success": true,
  "file_id": "uuid-here",
  "filename": "document.pdf",
  "extracted_text": "Teks yang diekstrak dari dokumen..."
}
```

### **2. Chat dengan Konteks Dokumen**

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Apa inti dokumen ini?",
    "document_context": "Teks dokumen yang sudah diekstrak"
  }'
```

**Response:**

```json
{
  "success": true,
  "response": "Jawaban berbasis konteks dokumen..."
}
```

---

## **Arsitektur**

### **Backend Structure**

```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── routers/             # API endpoints
│   │   ├── ingest.py        # Upload & extraction
│   │   ├── chat.py          # Chat berbasis konteks dokumen
│   │   ├── variables.py     # CSV/XLSX rows & sheets
│   │   ├── automation.py    # Playwright form automation
│   │   └── browser.py       # Playwright streaming & selector detect
│   ├── services/            # Business logic
│   │   ├── pdf_parser.py
│   │   ├── docx_parser.py
│   │   ├── ocr.py
│   │   ├── csv_parser.py
│   │   ├── xlsx_parser.py
│   │   ├── html_form_parser.py
│   │   ├── playwright_automation.py
│   │   └── ai_engine.py     # Local AI (Ollama) chat/analysis
│   └── utils/
│       ├── file_handler.py
│       └── text_cleaner.py
├── temp_files/
└── requirements.txt
```

### **Frontend Structure**

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.jsx         # Upload
│   │   ├── extraction/      # Hasil ekstraksi
│   │   ├── analysis/        # Chat dengan konteks dokumen
│   │   └── automate/        # Automate Input Form (Playwright)
│   └── components/
│       ├── FileUpload.jsx
│       ├── TextPanel.jsx
│       ├── MetadataPanel.jsx
│       └── PlaywrightBrowser.jsx
└── package.json
```

---

## **Offline-First Architecture**

PrivyLens dirancang untuk berjalan **sepenuhnya offline**:

1. **PDF/DOCX Parsing**: Menggunakan library Python lokal (pdfminer.six, python-docx)
2. **OCR**: Menggunakan PaddleOCR yang berjalan lokal tanpa koneksi internet
3. **AI Analysis**: Menggunakan Ollama dengan model lokal (Llama3)
4. **No External APIs**: Tidak ada panggilan ke API eksternal atau cloud services

**Catatan Penting:**

- Pastikan Ollama service berjalan sebelum menggunakan fitur analisis AI
- Model Llama3 harus sudah didownload (`ollama pull llama3`)
- Semua dependencies harus terinstall untuk ekstraksi dokumen

---

## **Troubleshooting**

### **Backend tidak bisa start**

- Pastikan Python dependencies terinstall: `pip install -r requirements.txt`
- Pastikan port 8000 tidak digunakan aplikasi lain
- Cek error log di terminal

### **OCR tidak bekerja**

- Pastikan PaddleOCR terinstall: `pip install paddleocr paddlepaddle`
- PaddleOCR akan download model pertama kali (sekali saja, kemudian offline)
- Pastikan file gambar valid (PNG, JPG, JPEG)

### **AI Analysis gagal**

- Pastikan Ollama terinstall dan berjalan
- Pastikan model llama3 sudah didownload: `ollama pull llama3`
- Cek apakah Ollama service berjalan: `ollama list`
- Restart Ollama service jika perlu

### **Frontend tidak connect ke backend**

- Pastikan backend berjalan di `http://localhost:8000`
- Cek CORS settings di `backend/app/main.py`
- Pastikan tidak ada firewall yang memblokir koneksi

---

## **Development**

### **Backend Development**

```bash
cd backend
uvicorn app.main:app --reload
```

### **Frontend Development**

```bash
cd frontend
npm run dev
```

### **Linting & Formatting**

```bash
# Backend (optional, menggunakan black/flake8 jika tersedia)
cd backend
# black app/
# flake8 app/

# Frontend
cd frontend
npm run lint
```

---

## **License**

MIT License
