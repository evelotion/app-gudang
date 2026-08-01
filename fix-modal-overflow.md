# Fix: Modal Popup Kepotong Ukuran Tabel (bukan Full Screen)

## Akar masalah
Semua modal (Edit Massal, Export dengan filter tanggal) di-render sebagai child
langsung dari div pembungkus tabel yang punya class `overflow-hidden`
(dipakai supaya sudut rounded tabel rapi). Karena modal-nya (`fixed inset-0`)
jadi descendant dari div `overflow-hidden` itu, browser nge-clip
tampilannya jadi seukuran kartu tabel, bukan seluruh viewport.

Ini terjadi identik di 3 modul: `registrasi-baru`, `hapus-buku`, `mutasi` —
masing-masing punya `data-table.tsx` (pembungkus `overflow-hidden`) dan
`form-bulk-edit.tsx` (modal-nya).

## Solusi: Portal komponen Modal bersama

### 1. Buat komponen `src/components/Modal.tsx` (baru)

```tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Wrapper modal yang di-render lewat React Portal langsung ke document.body.
 * Ini memastikan modal SELALU menutup seluruh layar (fixed ke viewport),
 * lepas dari ancestor DOM apa pun -- termasuk ancestor yang punya
 * overflow-hidden, transform, atau filter yang bisa merusak posisi
 * position:fixed kalau modal di-render di tempat biasa.
 */
export default function Modal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(children, document.body);
}
```

### 2. Bungkus tiap modal yang ada dengan `<Modal>`

Untuk **6 tempat** ini, bungkus return JSX-nya dengan `<Modal>...</Modal>`
(bukan ganti isinya, cukup tambah wrapper):

- `src/app/(dashboard)/aset/registrasi-baru/form-bulk-edit.tsx`
- `src/app/(dashboard)/aset/hapus-buku/form-bulk-edit.tsx`
- `src/app/(dashboard)/aset/mutasi/form-bulk-edit.tsx`
- Modal export (filter tanggal) di dalam ketiga `data-table.tsx` (cari blok
  `{showExportModal && (<div className="fixed inset-0 ...">`)

Contoh untuk `form-bulk-edit.tsx` (pola yang sama untuk yang lain):

```tsx
// SEBELUM
return (
  <div className="fixed inset-0 z-50 flex items-center justify-center ...">
    ...
  </div>
);

// SESUDAH
import Modal from "@/components/Modal";
// ...
return (
  <Modal>
    <div className="fixed inset-0 z-50 flex items-center justify-center ...">
      ...
    </div>
  </Modal>
);
```

Untuk modal export yang inline di `data-table.tsx`, bungkus persis sama:

```tsx
{showExportModal && (
  <Modal>
    <div className="fixed inset-0 z-[60] flex items-center justify-center ...">
      ...
    </div>
  </Modal>
)}
```

### 3. Cek juga file lain yang mungkin punya pola serupa

Jalankan pencarian ini untuk pastikan tidak ada modal lain yang kelewat:

```bash
grep -rln "fixed inset-0" src/app
```

Untuk tiap hasil yang belum dibungkus `<Modal>`, terapkan pola yang sama —
kecuali kalau modal itu memang sudah di luar ancestor `overflow-hidden`
(cek dulu, jangan bungkus asal semua).

## VERIFIKASI

```bash
npx tsc --noEmit && npm run build
```

Tes manual di browser untuk **ketiga modul** (registrasi, hapus-buku, mutasi):
1. Scroll tabel sampai ke tengah/bawah (pastikan ada cukup banyak baris data
   untuk bisa scroll)
2. Centang beberapa baris, klik "Edit Terpilih"
3. Modal harus muncul menutupi **seluruh layar** (backdrop gelap sampai ke tepi
   browser, termasuk menutupi sidebar), bukan cuma area tabel
4. Ulangi untuk tombol "Export Excel" (modal filter tanggal)
5. Pastikan scroll di belakang modal terkunci (body tidak ikut scroll saat
   modal terbuka) -- kalau belum ada, boleh ditambahkan
   `overflow-hidden` ke `<body>` saat modal terbuka sebagai penyempurnaan,
   tapi ini opsional, laporkan dulu kalau mau ditambahkan.

Laporkan hasil tes ke-4 poin di atas untuk ketiga modul sebelum push.
