# Rebrand: AsetKu → LogSync

Ganti semua referensi branding "AsetKu" jadi "LogSync" di seluruh repo. Ini
murni penggantian teks/tampilan, tidak menyentuh logika atau schema — tapi tetap
ikuti langkah verifikasi di bawah supaya tidak ada yang kelewat atau salah ganti.

## 1. Cari semua kemunculan dulu, jangan langsung ganti

Jalankan pencarian menyeluruh dan tampilkan hasilnya sebelum mulai edit:

```bash
grep -rn "AsetKu" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" .
```

Laporkan semua file yang ketemu. Kemungkinan lokasi:

- `src/app/layout.tsx` — metadata `title` dan/atau `description`
- `src/components/Sidebar.tsx` — teks brand di header sidebar
- `package.json` — field `name` (kalau memang diisi "asetku" atau serupa, cek
  case-nya, biasanya lowercase-kebab kalau ini yang dipakai)
- `README.md` — kalau ada
- Halaman `login` — kadang ada judul/logo teks brand di situ juga, cek
  `src/app/login/**` atau `src/app/(auth)/login/**` (sesuaikan dengan struktur
  folder yang ada)
- File konfigurasi PWA/manifest kalau ada (`manifest.json`, `manifest.ts`)

## 2. Ganti satu per satu, sesuaikan konteksnya

Jangan pakai `sed`/find-replace membabi buta di seluruh repo sekaligus — cek tiap
kemunculan, karena beberapa tempat mungkin butuh casing beda:

- Teks tampilan (title, sidebar header, halaman login) → `LogSync`
- `package.json` field `name` kalau ada → `logsync` (lowercase, sesuai konvensi
  npm package name)
- Kalau ada acronym/inisial brand yang dipakai di UI kecil (misal favicon teks,
  badge singkat) → sesuaikan jadi `LS` atau serupa, pakai penilaian yang wajar
  kalau tidak eksplisit disebutkan di sini

## 3. Cek tempat yang MUNGKIN kelewat dari grep biasa

- Favicon/logo berbentuk gambar (kalau ada file `favicon.ico`/`logo.svg` dengan
  teks brand ter-embed) — laporkan kalau ketemu, tapi jangan generate ulang aset
  visual, cukup flag ke user untuk diganti manual
- Environment variable atau config yang menyimpan nama aplikasi (misal
  `NEXT_PUBLIC_APP_NAME`) — cek `.env.example` kalau ada

## VERIFIKASI

```bash
grep -rn "AsetKu" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" .
```

Harus kosong (kecuali ada alasan spesifik untuk mempertahankan sebagian, jelaskan
kalau begitu).

```bash
npx tsc --noEmit && npm run build
```

Keduanya harus sukses.

Tes manual: `npm run dev`, buka halaman login dan dashboard, pastikan brand yang
tampil di browser tab title dan header sudah "LogSync", bukan campuran dua nama.

## Commit

Jangan gabung commit ini dengan perubahan security yang sedang berjalan di branch
lain. Kalau branch security-hardening masih aktif dan belum di-merge, buat
rebrand ini di branch terpisah (misal `rebrand-logsync`) dari `main` yang sudah
berisi hasil merge `remove-modul-gudang`, supaya riwayatnya tetap rapi dan mudah
di-review terpisah.

Laporkan daftar file yang diubah beserta hasil ketiga verifikasi di atas sebelum
push.
