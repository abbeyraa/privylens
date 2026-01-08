"use client";

export default function InputHelpModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-gray-900">
            Panduan Input
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-gray-500 hover:bg-gray-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="mt-4 space-y-3 text-sm text-gray-600">
          <p>
            Gunakan Label/Text untuk menemukan field atau tombol. Tambahkan
            Scope Selector jika ada label yang sama dalam halaman berbeda
            (contoh: <code>form#checkout</code>).
          </p>
          <p>
            Input type:
            <br />
            - Text/Number/Date: isi Value sesuai kebutuhan.
            <br />- Checkbox/Toggle: Value = <code>true</code> atau{" "}
            <code>false</code>.
            <br />
            - Radio: gunakan Label untuk opsi, atau isi Value untuk memilih
            berdasarkan value attribute.
            <br />- Select: Value = option value pada tag{" "}
            <code>&lt;option&gt;</code>.
          </p>
          <p>
            Date Format opsional: gunakan token <code>DD</code>,{" "}
            <code>MM</code>, <code>YYYY</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
