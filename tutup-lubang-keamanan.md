# Tutup Lubang Keamanan + Perbaiki Nama Inputer di PDF — Jalankan Berurutan

Kerjakan fase berurutan dari Fase 0. Tiap fase punya **VERIFIKASI** dan **GATE**.
Laporkan tiap fase sebelum lanjut ke fase berikutnya, jangan jalankan semua lalu
lapor di akhir.

Konteks: setelah pembersihan modul gudang kemarin, struktur file mungkin sedikit
beda dari asumsi di sini (nama file/folder auth, actions, dsb). **Fase 0 wajib**
untuk memastikan instruksi berikutnya menunjuk ke lokasi yang benar.

---

## FASE 0 — Petakan ulang mekanisme auth yang ada

Jangan asumsikan lokasi file. Cari dan laporkan:

1. Di mana fungsi pembaca session server-side didefinisikan (kemungkinan
   `getSession()` di `src/actions/auth.ts` atau `src/lib/auth.ts`) — tunjukkan
   signature-nya dan apa yang dikembalikan (userId? nama? role?).
2. Isi `src/middleware.ts` sekarang — apakah `matcher` masih meng-exclude `api`?
   Apakah blok pengecekan role masih di-comment?
3. List semua file di `src/app/api/export/**` — untuk tiap route, cek apakah ada
   pemanggilan fungsi session di baris-baris awal handler-nya atau tidak.
4. List semua fungsi di `src/actions/aset.ts` yang melakukan `create`, `update`,
   `delete`, atau `createMany` ke Prisma — untuk tiap fungsi, cek apakah ada
   pengecekan session di awal fungsi atau tidak.
5. Cari semua tempat yang menghasilkan PDF (kemungkinan pakai `jspdf` atau
   sejenis) dan tempat yang generate Excel — di situ cari field seperti
   `inputerName`, `operatorName`, `preparedBy`, atau nama yang di-hardcode
   (misal ada string nama orang tertulis literal di kode).
6. Cek model `User` di `prisma/schema.prisma` — field apa saja yang ada
   (kemungkinan `nama`/`name`, `role`, `username`).

**GATE:** Laporkan semua temuan di atas sebelum lanjut. Fase-fase berikutnya akan
disesuaikan kalau ternyata strukturnya beda dari dugaan di sini.

---

## FASE 1 — Buat helper `requireSession()` terpusat

Tujuan: satu fungsi yang dipanggil di baris pertama setiap server action dan setiap
API route yang menyentuh data, supaya tidak ada lagi endpoint yang lupa dicek.

Di file tempat `getSession()` berada (dari temuan Fase 0), tambahkan:

```ts
export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
```

Sesuaikan tipe return dengan apa pun yang `getSession()` sudah kembalikan (harus
minimal berisi identitas user yang login — id/nama — supaya bisa dipakai di Fase 5
untuk nama inputer).

Kalau `getSession()` ternyata sudah melempar error sendiri saat tidak ada sesi,
laporkan itu di Fase 0 dan sesuaikan `requireSession()` supaya tidak duplikat logic.

**VERIFIKASI:** `npx tsc --noEmit` sukses, tidak ada pemanggil yang error karena
fungsi baru ini (belum dipanggil di mana-mana, jadi seharusnya aman).

**GATE:** Lanjut ke Fase 2.

---

## FASE 2 — Kunci endpoint `/api/export/*`

Ini yang paling urgent — endpoint ini sekarang bisa diakses siapa pun tanpa login
karena middleware meng-exclude path `api`.

Untuk **setiap** route handler di `src/app/api/export/**/route.ts`:

1. Di baris pertama function handler (`GET`/`POST`), panggil `requireSession()`
   dari Fase 1.
2. Bungkus dengan try/catch: kalau `requireSession()` melempar `UNAUTHORIZED`,
   return response 401:

```ts
export async function GET(request: Request) {
  try {
    await requireSession();
  } catch {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ...logika export yang sudah ada...
}
```

3. Kalau ada route yang menerima parameter role tertentu boleh akses (misal cuma
   ADMIN yang boleh export), tambahkan pengecekan role setelah `requireSession()`
   — tapi jangan asumsikan ini perlu kalau belum ada instruksi eksplisit soal role
   apa yang boleh akses export apa. Kalau ragu, tanyakan ke user sebelum menambah
   pembatasan role, cukup pastikan minimal harus login.

**VERIFIKASI:**
```bash
npx tsc --noEmit && npm run build
```
Lalu tes manual: buka salah satu URL export (misal
`/api/export/excel/registrasi`) di browser **dalam mode incognito / belum login**
— harus dapat 401, bukan file Excel.

**GATE:** Laporkan hasil tes manual (401 terkonfirmasi) sebelum lanjut ke Fase 3.

---

## FASE 3 — Authorization di server actions + validasi Zod di bulk create

### 3.1 — Tambahkan `requireSession()` di semua actions yang menulis data

Di **setiap** fungsi di `src/actions/aset.ts` yang melakukan `create`, `update`,
`delete`, atau `createMany` (dari daftar yang sudah dipetakan di Fase 0), tambahkan
di baris pertama badan fungsi:

```ts
const session = await requireSession();
```

Bungkus body fungsi dengan try/catch yang sudah ada supaya kalau `requireSession()`
melempar error, ditangkap dan dikembalikan sebagai `{ success: false, message: "Anda harus login." }` — bukan crash tanpa pesan jelas ke client.

Fungsi yang **hanya membaca** data (`get...`, `find...`) tidak wajib diubah di fase
ini kecuali user memang mau semua action butuh login (tanyakan kalau ragu; default
aman: minimal semua yang menulis data harus dikunci).

### 3.2 — Validasi Zod di semua fungsi bulk create

Untuk `createBulkRegistrasiAset`, `createBulkMutasiAset`, `createBulkHapusBukuAset`
(sesuaikan nama persis dengan yang ada di kode), ganti signature dari
`dataArray: any[]` menjadi tervalidasi Zod:

1. Cari skema Zod yang sudah ada untuk masing-masing modul (kemungkinan di
   `src/lib/validations.ts`, sudah ada `registrasiAsetSchema` dsb dari review
   sebelumnya). Kalau belum ada skema untuk item individual dalam array, buat.
2. Validasi array masuk pakai `z.array(schemaItem).safeParse(dataArray)` di awal
   fungsi. Kalau gagal, return `{ success: false, message: ..., errors: parsed.error.issues }`.
3. **Field yang tidak boleh dipercaya dari client**: `status`, `inputerName` (atau
   nama field serupa yang menandai siapa yang input). Field-field ini HARUS diisi
   dari `session` yang didapat dari `requireSession()`, bukan dari `dataArray` yang
   dikirim client — bahkan kalau client mengirim nilai untuk field ini, abaikan dan
   timpa dengan nilai dari session sebelum masuk ke `createMany`.

**VERIFIKASI:**
```bash
npx tsc --noEmit && npm run build
```
Tes manual: coba submit form registrasi/mutasi/hapus-buku seperti biasa (user
login normal) — harus tetap berhasil seperti sebelumnya. Lalu cek di database:
kolom `inputerName`/`status` pada baris baru harus konsisten dengan user yang
login, bukan apa pun yang mungkin dikirim dari form.

**GATE:** Laporkan hasil tes manual sebelum lanjut ke Fase 4.

---

## FASE 4 — Aktifkan kembali RBAC di middleware

Di `src/middleware.ts`, cari blok pengecekan role yang di-comment (biasanya ada
catatan "sementara dimatikan buat development" atau serupa). Aktifkan kembali.

Sebelum mengaktifkan, konfirmasi dulu ke user: role apa saja yang ada
(kemungkinan ADMIN/STAF dari yang terlihat di Sidebar sebelumnya), dan route mana
yang harus dibatasi ke role apa. **Jangan menebak aturan RBAC-nya sendiri** — kalau
tidak ada spesifikasi jelas di kode yang di-comment, tanyakan ke user dulu sebelum
menerapkan pembatasan supaya tidak ada halaman yang tiba-tiba terkunci buat role
yang seharusnya boleh akses.

**VERIFIKASI:**
```bash
npx tsc --noEmit && npm run build
```
Tes manual: login sebagai tiap role yang ada, coba akses route yang seharusnya
dibatasi — harus redirect/ditolak sesuai aturan yang dikonfirmasi.

**GATE:** Laporkan hasil tes manual per role sebelum lanjut ke Fase 5.

---

## FASE 5 — Nama inputer di PDF ikut user yang login

Sekarang nama di dokumen PDF (dan kemungkinan Excel) kemungkinan besar masih
hardcoded (string nama orang tertulis literal di kode, ditemukan di banyak
tempat pada review sebelumnya). Gantikan supaya selalu ambil dari user yang
sedang login.

1. Dari session (`requireSession()` di server action yang membentuk data sebelum
   dikirim ke fungsi pembuat PDF), ambil nama user — field persis tergantung apa
   yang dilaporkan di Fase 0 langkah 6 (kemungkinan `session.nama` atau perlu query
   tambahan ke tabel `User` pakai `session.userId` kalau session hanya menyimpan id).
2. Di semua tempat yang generate PDF/Excel dan menuliskan nama inputer/operator
   sebagai footer atau tanda tangan, ganti sumber datanya dari hardcoded string
   menjadi nilai yang dilewatkan dari server action (bukan dari input form yang
   bisa diubah user, dan bukan hardcoded).
3. Cek juga apakah nama ini sempat lewat client (misal disimpan sebagai default
   value di form lalu dikirim balik ke server). Kalau iya, hilangkan jalur itu —
   nama harus diambil di server dari session tiap kali dokumen dibuat, supaya
   tidak bisa dipalsukan dan selalu akurat sesuai siapa yang benar-benar login
   saat itu.
4. Field `supervisorName` (kalau ada dan memang diisi manual/dipilih dari daftar
   supervisor, bukan otomatis dari login) boleh tetap seperti sekarang kecuali
   user minta diubah juga — klarifikasi ke user kalau tidak yakin field mana yang
   dimaksud "nama inputer".

**VERIFIKASI:**
```bash
npx tsc --noEmit && npm run build
```
Tes manual: login sebagai dua user berbeda (kalau ada lebih dari satu akun),
masing-masing generate PDF dari data yang sama jenisnya, pastikan nama yang
muncul di PDF berubah sesuai siapa yang sedang login saat generate — bukan nama
yang sama terus.

**GATE:** Laporkan hasil tes dua-user di atas. Setelah ini semua fase selesai —
tunggu konfirmasi user sebelum commit & push ke `origin/main`.
