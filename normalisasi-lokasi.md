# Instruksi: Normalisasi Lokasi & Validasi Input Mutasi

Lanjutan setelah PR `feature/export-jurnal-mutasi`. **Mulai setelah PR itu
merged.**

Masalah yang diselesaikan: kolom `lokasiAwal`/`lokasiTujuan` di `MutasiAset`
adalah free text, sehingga nilainya beragam. Export jurnal saat ini
hard-error untuk semua nilai di luar pola `TIPE-INITIAL` yang rapi — artinya
export hanya jalan untuk data yang kebetulan bersih.

Dokumen ini punya dua bagian yang bisa dikerjakan berurutan:
- **Bagian A** — resolve lokasi historis (bikin export jalan untuk data lama)
- **Bagian B** — kunci input baru (bikin masalahnya berhenti tumbuh)

Kerjakan **A dulu sampai selesai dan di-review**, baru B.

---

## 0. Prinsip

**Tabel data yang di-review manusia sekali, bukan algoritma tebak-tebakan
yang jalan tiap export.**

Fuzzy matching terlarang. Alasan konkret: tabel cabang punya `PDA=058`
(Padang?) dan `PDG=082` (Padang?). Nilai `ULS A Rivai Palembang` dan
`ULS -ULS Padang` tidak bisa dipetakan dengan yakin tanpa tabel nama cabang.
Salah tebak = jurnal masuk ke cabang yang salah, dan ketahuannya berbulan-bulan
kemudian saat proofing.

Semua pemetaan yang tidak deterministik **wajib melewati review manusia**
sebelum masuk database.

---

## 1. Tiga skema penamaan lokasi (penting)

Kolom lokasi memuat tiga skema berbeda yang hidup berdampingan:

### 1.1 Cabang — `TIPE-INITIAL`
`KCP-SGK`, `ULS-PDA`, `KC-DHA`. Initial 3 huruf → lookup ke tabel 84 cabang.
Sudah ditangani implementasi sekarang.

### 1.2 Kantor Pusat — `KP-UNITKERJA`
`KP-LOG`, `KP-ADP`, `KP-ARP`, `KP-BRK`. Suffix adalah **singkatan unit kerja**
di Kantor Pusat, bukan cabang. Semua → kode `999`.
Sudah ditangani implementasi sekarang (aturan `KP-*` → 999).

### 1.3 Wisma — `W{n}L{n}-UNITKERJA`  ← BARU, belum ditangani
`W1L5-DMR` = **Wisma 1 Lantai 5, unit kerja DMR**.
`W2L7-LOG` = **Wisma 2 Lantai 7, unit kerja Logistik**.

Ini lokasi fisik di lingkungan Kantor Pusat. Semua → kode **`999`**, sama
seperti `KP-*`.

> Catatan: `W2L7-LOG` kebetulan sudah menghasilkan 999 di implementasi
> sekarang karena ada aturan khusus `LOG` → 999. Tapi itu kebetulan, bukan
> aturan yang benar — `W1L5-DMR` akan tetap error. Perlu aturan prefix.

**Singkatan unit kerja** yang sudah diketahui: `LOG` (Logistik), `DMR`, `ADP`,
`ARP`, `BRK`. Daftar lengkap dan daftar lokasi wisma akan menyusul dari user —
**tidak memblokir pekerjaan ini** (lihat bagian 5).

---

## 2. Aturan resolusi lokasi (final)

Urutan dicoba dari atas. Yang cocok pertama dipakai.

```
1. Exact match di tabel LokasiRef            → pakai entry itu
2. Prefix cocok /^W\d+L\d+-/                 → 999, tipe = KANTOR_PUSAT
3. Prefix = "KP-"                            → 999, tipe = KANTOR_PUSAT
4. Pola TIPE-INITIAL, initial ada di tabel 84 → kode cabang, tipe = CABANG
5. selain itu                                → HARD ERROR
```

Langkah 2 adalah satu-satunya aturan baru yang deterministik. Langkah 3–5 sudah
berjalan dan **tidak boleh diubah perilakunya**.

Langkah 1 adalah tabel pengecualian: isinya hanya nilai-nilai menyimpang, bukan
menulis ulang 84 cabang.

### 2.1 Kenapa exact match, bukan normalisasi string

Sempat dipertimbangkan normalisasi (uppercase, rapatkan spasi, dsb) sebelum
lookup. **Jangan.** Nilai seperti `ULS -ULS Padang` dan `ULS ULS Cirebon`
mengandung duplikasi kata yang tidak bisa dinormalisasi dengan aturan umum
tanpa berisiko menggabungkan dua lokasi berbeda.

Cukup satu preprocessing yang aman: `trim()` untuk buang spasi di ujung. Selain
itu, cocokkan persis.

---

## BAGIAN A — Resolve lokasi historis

### A.1 Model Prisma baru

```prisma
model LokasiRef {
  id          String      @id @default(cuid())
  raw         String      @unique   // nilai persis dari MutasiAset
  kodeCabang  String                // 3 digit, mis. "003", "999"
  label       String                // untuk Sheet Lampiran, mis. "KC-SMH"
  initial     String                // untuk kolom Keterangan, mis. "SMH"
  tipe        LokasiTipe
  catatan     String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

enum LokasiTipe {
  CABANG
  KANTOR_PUSAT
  WISMA
}
```

- `raw` **case-sensitive dan persis** seperti di DB. Jangan di-normalisasi.
- `label` dipakai di kolom Lokasi Awal/Tujuan Sheet Lampiran.
- `initial` dipakai di kolom Keterangan Sheet Jurnal (yang dibatasi 50 char).

Perubahan schema → wajib migration + PR (aturan kerja repo).

### A.2 Skrip pembangkit usulan

Buat skrip yang **hanya menghasilkan CSV usulan**, tidak menulis ke DB.

```
scripts/generate-lokasi-suggestions.ts
```

Isi CSV, satu baris per nilai lokasi unik yang **belum** ter-resolve oleh
aturan 2–4:

| kolom | isi |
|---|---|
| `raw` | nilai persis dari DB |
| `jumlah_baris` | berapa baris MutasiAset memakainya |
| `contoh_register` | satu `nomorRegisterAset` sebagai sampel |
| `usul_kode` | tebakan kode cabang, atau kosong |
| `usul_label` | tebakan label |
| `usul_initial` | tebakan initial |
| `usul_tipe` | CABANG / KANTOR_PUSAT / WISMA |
| `keyakinan` | TINGGI / SEDANG / RENDAH |
| `alasan` | kenapa menebak begitu |

Aturan penilaian keyakinan:
- **TINGGI** — hanya beda separator/spasi dari pola yang sudah dikenal.
  Contoh: `ULS DAR` → `ULS-DAR` (DAR=011 ada di tabel).
- **SEDANG** — mengandung initial yang dikenal tapi strukturnya menyimpang.
  Contoh: `ULS ULS Cirebon` → CRB.
- **RENDAH** — pakai nama cabang, bukan initial. Contoh: `KC Samanhudi`,
  `ULS A Rivai Palembang`. **Skrip boleh menebak, tapi selalu RENDAH.**

⛔ **Jangan pernah menulis hasil skrip langsung ke DB.** Output hanya CSV
untuk direview user.

### A.3 Review manual

User mereview CSV, memperbaiki yang salah, mengisi yang kosong. Baris yang
tidak yakin dibiarkan kosong — akan tetap hard-error, dan itu benar.

Perhatian khusus untuk keyakinan RENDAH: tabel punya `PDA=058` dan `PDG=082`
yang dua-duanya bisa terbaca "Padang". Jangan diloloskan tanpa dicek.

### A.4 Seed

```
scripts/seed-lokasi-ref.ts
```

Baca CSV hasil review → upsert ke `LokasiRef` berdasarkan `raw`.

Validasi sebelum menulis:
- `kodeCabang` tepat 3 digit
- kalau `tipe = CABANG`, `initial` harus ada di tabel 84 cabang
- kalau `tipe = KANTOR_PUSAT` atau `WISMA`, `kodeCabang` harus `999`
- baris dengan kolom wajib kosong → **dilewati**, dan dilaporkan di akhir

### A.5 Integrasi ke export

Di `mappings.ts`, ubah fungsi resolusi lokasi mengikuti urutan bagian 2.

- Muat seluruh `LokasiRef` **sekali** di awal export (satu query), jangan query
  per baris.
- Fungsi resolusi tetap **pure** — terima map sebagai argumen, jangan akses
  Prisma dari dalamnya. Ini menjaga unit test yang sudah ada tetap jalan tanpa
  DB.
- Perilaku hard-error dan pengumpulan-semua-error **tidak berubah**.

### A.6 Jangan backfill data lama

**Jangan `UPDATE` 149 baris `MutasiAset` yang sudah ada.** Nilai mentah adalah
jejak audit. Bentuk kanonik cukup diturunkan lewat `LokasiRef` saat dibaca.

### A.7 Test

- `W1L5-DMR` → 999, tipe WISMA
- `W2L7-LOG` → 999, tipe WISMA
- `W10L12-XYZ` → 999 (pastikan regex menangani dua digit)
- `KP-ADP` → 999
- `KCP-SGK` → 078
- `ULS-SCI` → 083 (bukan 084)
- entry `LokasiRef` menang atas aturan lain (mis. `raw` = `KCP-SGK` dengan kode
  berbeda → yang dipakai entry tabel)
- nilai tak dikenal → masuk daftar error, bukan throw di tengah jalan
- **19 baris data 27 Juli tetap menghasilkan angka identik** dengan hasil PR
  sebelumnya — ini regression test terpenting

---

## BAGIAN B — Kunci input mutasi

Selama field lokasi masih free text, tiap mutasi baru bisa menambah varian
baru dan `LokasiRef` harus dirawat selamanya. Bagian ini menghentikan
pertumbuhan itu.

### B.1 Model master lokasi

```prisma
model Lokasi {
  id         String     @id @default(cuid())
  kode       String     @unique   // "KCP-SGK", "KP-LOG", "W1L5-DMR"
  kodeCabang String               // 3 digit
  nama       String               // "KCP Sungai Gerong"
  initial    String
  tipe       LokasiTipe
  aktif      Boolean    @default(true)
}
```

Seed dari:
- 84 cabang (tabel yang sudah ada) → tipe CABANG
- unit kerja KP → tipe KANTOR_PUSAT, kodeCabang 999
- lokasi wisma → tipe WISMA, kodeCabang 999 *(menunggu data user, bagian 5)*

`aktif` untuk menyembunyikan lokasi tutup/pindah dari dropdown tanpa merusak
data historis.

### B.2 Form mutasi: dropdown, bukan text input

Ganti input `lokasiAwal`/`lokasiTujuan` jadi select yang mengambil dari
`Lokasi` (filter `aktif = true`), dikelompokkan per `tipe`:

```
── Cabang ──
KC-DHA   (KC Dharmawangsa)
KCP-SGK  (KCP Sungai Gerong)
── Kantor Pusat ──
KP-LOG   (Logistik)
── Wisma ──
W1L5-DMR (Wisma 1 Lt.5 — DMR)
```

Simpan `kode` ke `lokasiAwal`/`lokasiTujuan` (tetap String, tidak perlu ubah
tipe kolom).

### B.3 Validasi server-side

Dropdown saja tidak cukup — server action yang menyimpan mutasi **wajib**
memvalidasi bahwa nilai lokasi ada di tabel `Lokasi` dan `aktif`. Tolak kalau
tidak.

### B.4 Yang TIDAK dilakukan

- Jangan ubah tipe kolom `lokasiAwal`/`lokasiTujuan` jadi relasi/foreign key.
  Data historis memuat nilai yang tidak ada di master, FK akan menolak migrasi.
  Cukup String + validasi di aplikasi.
- Jangan hapus `LokasiRef`. Setelah B jalan, `LokasiRef` tetap dibutuhkan untuk
  menerjemahkan data historis.

---

## 3. Urutan & PR

Kalau memungkinkan, pecah jadi dua PR:

**PR 1 — Bagian A** (`feature/normalisasi-lokasi`)
Migration `LokasiRef`, skrip usulan, skrip seed, integrasi ke `mappings.ts`,
test. Setelah merged, export jalan untuk data historis.

**PR 2 — Bagian B** (`feature/master-lokasi`)
Migration `Lokasi`, seed, dropdown di form, validasi server-side.

Dua-duanya menyentuh `prisma/schema.prisma` → wajib branch + PR, tidak boleh
langsung ke `main`.

Gate tetap: `npx tsc --noEmit`, `npm run build`, `npx vitest run`.

---

## 4. Nilai lokasi bermasalah yang sudah diketahui

Dari audit Fase 0. Bukan daftar lengkap — skrip A.2 yang menentukan.

| Nilai | Dugaan | Keyakinan |
|---|---|---|
| `ULS DAR` | `ULS-DAR` → 011 | TINGGI |
| `ULS -ULS Padang` | PDA atau PDG? | RENDAH |
| `ULS ULS Cirebon` | CRB → 081 | SEDANG |
| `KC Samanhudi` | SMH → 003 | RENDAH |
| `KC Sunter` | ? | RENDAH |
| `KCP Kelapa Gading` | KLG → 008 | RENDAH |
| `ULS Metro Pondok Indah` | PDI? MPG? | RENDAH |
| `ULS A Rivai Palembang` | ARV → 064? PLG → 052? | RENDAH |
| `Departemen Logistik` | LOG → 999 | SEDANG |
| `W1L5-DMR` | 999, WISMA | **deterministik** (aturan 2) |

Perhatikan `ULS A Rivai Palembang` — ada `ARV=064` dan `PLG=052`, dua-duanya
plausible. Persis kasus yang tidak boleh ditebak.

---

## 5. Menunggu data user (tidak memblokir)

User akan mengirim daftar singkatan unit kerja KP (LOG, DMR, ADP, ARP, BRK,
dst) dan daftar lokasi wisma.

Sampai data itu ada:
- Bagian A tetap bisa jalan penuh — aturan `W\d+L\d+` sudah deterministik
- Label wisma sementara pakai nilai `raw` apa adanya (`W1L5-DMR`)

Setelah data masuk, tinggal isi kolom `label` supaya tampil lebih terbaca
(`Wisma 1 Lt.5 — DMR`). Murni kosmetik, tidak mengubah logika atau kode GL.

Hal yang sama berlaku untuk `kode_cabang.xlsx` dengan kolom **nama cabang** —
kalau tersedia, keyakinan untuk `KC Samanhudi`, `KCP Kelapa Gading`, dan
sejenisnya naik dari RENDAH ke TINGGI dan review manualnya jauh lebih cepat.
