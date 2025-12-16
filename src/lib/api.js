// API base URL untuk layanan pendukung (misalnya extractor CSV/XLSX).
// Secara default mengarah ke backend eksternal. Ubah ke "/api" jika
// Anda membungkusnya dengan Next.js API route / reverse proxy.
const API_BASE_URL = "http://localhost:8000";

/**
 * Ekstrak semua baris dari file CSV/XLSX ke array of object.
 * Digunakan oleh halaman Automation Plan untuk membaca sumber data.
 *
 * @param {File} file
 * @param {string|null} sheetName jika xlsx, nama sheet yang dipilih
 * @returns {Promise<Array<Object>>}
 */
export async function extractAllRows(file, sheetName = null) {
  const formData = new FormData();
  formData.append("file", file);

  const params = new URLSearchParams();
  if (sheetName) params.append("sheet_name", sheetName);

  const response = await fetch(
    `${API_BASE_URL}/variables/extract-rows?${params}`,
    {
      method: "POST",
      body: formData,
    }
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to extract rows");
  }

  return data.rows;
}

/**
 * Ambil daftar sheet dari file xlsx.
 *
 * @param {File} file
 * @returns {Promise<Array<string>>}
 */
export async function getXlsxSheets(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/variables/xlsx-sheets`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to get sheets");
  }

  return data.sheets;
}
