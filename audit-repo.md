# Audit Repo: app-gudang — Sebelum Hapus Modul Gudang & Logistik

Tolong audit dulu kondisi repo ini sebelum kita ubah apa pun. **Jangan edit file apa pun di tahap ini** — cuma laporan.

## 1. Cek status commit

- Jalankan `git status` dan `git log --oneline -5`
- Jalankan `git diff cce27ee..HEAD --stat`, `git diff --stat` (uncommitted), dan `git diff --cached --stat` (staged)
- Laporkan: apakah HEAD lokal sama persis dengan commit `cce27ee` di GitHub (`origin/main`)? Kalau beda, apa isinya, dan apakah ada perubahan yang belum di-commit/push?

## 2. Cek env & jalan/nggaknya aplikasi

- Ada `.env` atau `.env.local`? Isinya cukup buat `npm run dev` jalan? (jangan print isi `DATABASE_URL`/`JWT_SECRET`, cukup bilang ada/tidak)
- Jalankan `npx tsc --noEmit` dan `npm run build`, laporkan error kalau ada
- Jalankan `npx prisma generate`, laporkan errornya kalau gagal

## 3. Petakan semua fitur "Gudang & Logistik" yang bakal dibuang

Aplikasi ini punya dua modul:

- **(a) Gudang/Logistik lama** — barang masuk/keluar, master barang, requisition, laporan stok — sudah dipindah ke aplikasi WMS terpisah, mau dibuang dari repo ini
- **(b) Aset** — registrasi, hapus buku, mutasi — aktif dipakai sekarang, **jangan disentuh**

Tugasnya: cari dan daftar SEMUA yang termasuk kategori (a), termasuk:

- Model Prisma yang berhubungan (kemungkinan: `Barang`, `Kategori`, dan model `Requisition`/`Inbound` apa pun) — cek foreign key yang menyambung ke model Aset, karena kalau ada FK campuran, hapusnya harus hati-hati
- `src/actions/barang.ts`, `src/actions/transaksi.ts`, dan cek isi `src/actions/dashboard.ts` — apakah isinya murni data gudang atau ada juga data aset yang perlu dipertahankan
- Semua halaman di bawah rute gudang (kemungkinan `barang-masuk`, `barang-keluar`, `master-barang`, `laporan`, atau nama serupa) — list path lengkapnya
- Halaman `/` (dashboard utama) — apakah nampilin data gudang, dan seberapa besar bagian yang harus diganti
- Item menu di Sidebar yang mengarah ke rute-rute itu
- Endpoint API export yang isinya data gudang (**bukan** `/api/export/excel/registrasi`, `/api/export/excel/hapus-buku`, `/api/export/excel/mutasi` — itu punya Aset dan **HARUS tetap ada**)
- File `reset-gudang.ts` di root
- Referensi branding "GudangSync" di README/layout/title

Untuk tiap item, tandai salah satu:

- **AMAN DIHAPUS** — murni fitur gudang, tidak ada yang bergantung ke modul Aset
- **PERLU DICEK** — ada kemungkinan disenggol modul Aset (jelaskan kenapa)
- **JANGAN DIHAPUS** — walau namanya mirip, ternyata dipakai modul Aset juga

## 4. Keluarkan laporan

Bikin ringkasan dalam bentuk tabel: nama file/model, kategori (di atas), dan alasan singkat.

**Jangan hapus atau ubah apa pun dulu** — tunggu konfirmasi urutan penghapusannya setelah laporan ini dilihat.
