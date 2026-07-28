# Perbaikan Menyeluruh app-gudang — Jalankan Berurutan, Berhenti di Tiap Gate

Kerjakan fase-fase di bawah **berurutan dari Fase 0**. Tiap fase punya bagian **VERIFIKASI**
dan **GATE** — jangan lanjut ke fase berikutnya kalau verifikasi gagal atau gate belum
dikonfirmasi. Laporkan hasil tiap fase sebelum lanjut, jangan jalankan semuanya lalu
lapor di akhir.

Konteks: aplikasi ini sekarang isinya dua modul — **Aset** (aktif dipakai, JANGAN
disentuh strukturnya kecuali diinstruksikan eksplisit di sini) dan **Gudang & Logistik**
(mau dibuang total, sudah pindah ke aplikasi WMS terpisah). Audit sebelumnya sudah
memastikan tidak ada foreign key yang menyambungkan kedua modul.

---

## FASE 0 — Backup database (WAJIB sebelum lanjut)

Repo ini pakai Neon Postgres. Sebelum ada perubahan schema apa pun di fase-fase
selanjutnya, harus ada snapshot yang bisa direstore.

1. Konfirmasi ke user (jangan asumsikan sudah dilakukan): apakah sudah dibuat Neon
   branch backup dari branch production sekarang, lewat Neon Console → Branches →
   Create branch → parent branch production → beri nama misal
   `backup-sebelum-hapus-gudang-<tanggal>`.
2. Kalau belum dikonfirmasi, **STOP** dan minta user melakukannya dulu sebelum Fase 3
   dan seterusnya (Fase 1 dan 2 aman dijalankan lebih dulu karena tidak mengubah
   schema/data, cuma kode aplikasi).

**GATE:** Jangan jalankan `prisma migrate` atau `prisma db push` apa pun (Fase 3)
sebelum user eksplisit mengonfirmasi backup Neon branch sudah dibuat.

---

## FASE 1 — Perbaiki build yang sudah rusak (modul Aset, bukan gudang)

`npx tsc --noEmit` melaporkan 2 error di `src/actions/aset.ts` — nama field yang
tidak cocok dengan `schema.prisma`. Ini harus dibenerin duluan supaya "build sukses"
di fase-fase berikutnya benar-benar berarti sesuatu.

### 1.1 — `updateBulkHapusBukuAset`

Cari fungsi ini di `src/actions/aset.ts`. Field yang ditulis ke `prisma.hapusBukuAset.update`
harus persis sama dengan kolom di model `HapusBukuAset` pada `prisma/schema.prisma`.
Ganti field yang salah:

- `tanggalHapus` → `tanggalHapusBuku`
- `alasanHapus` → `alasanHapusBuku`

Sekalian pastikan fungsi ini meng-update SEMUA kolom yang bisa diedit di form bulk-edit
Hapus Buku (cek `src/app/(dashboard)/aset/hapus-buku/form-bulk-edit.tsx` untuk field
apa saja yang dikirim), bukan cuma sebagian — sebelumnya beberapa kolom seperti
`hargaPerolehan`, `akmPenyusutan`, `nilaiBuku`, `golonganAset`, `tanggalPerolehan`,
`cabangUnitKerja` tidak ikut ter-update walau dikirim dari form.

### 1.2 — `updateBulkMutasiAset`

Field yang salah di `prisma.mutasiAset.update`:

- `cabangAsal` → `lokasiAwal`
- `cabangTujuan` → `lokasiTujuan`

Sekalian tambahkan kolom yang tadinya tidak ikut ter-update:
`golonganAset`, `tanggalPerolehan`, `hargaPerolehan`, `akmPenyusutan`, `alasanMutasi`.

Hasil akhir fungsi harus seperti ini:

```ts
export async function updateBulkMutasiAset(dataArray: any[]) {
  try {
    const transactions = dataArray.map((item) =>
      prisma.mutasiAset.update({
        where: { id: item.id },
        data: {
          tanggalMutasi: new Date(item.tanggalMutasi),
          nomorRegisterAset: item.nomorRegisterAset,
          namaAset: item.namaAset,
          golonganAset: item.golonganAset,
          jumlah: Number(item.jumlah),
          tanggalPerolehan: new Date(item.tanggalPerolehan),
          hargaPerolehan: Number(item.hargaPerolehan),
          akmPenyusutan: Number(item.akmPenyusutan),
          lokasiAwal: item.lokasiAwal,
          lokasiTujuan: item.lokasiTujuan,
          alasanMutasi: item.alasanMutasi,
        },
      })
    );
    await prisma.$transaction(transactions);
    revalidatePath("/aset/mutasi");
    return { success: true, message: `${dataArray.length} data berhasil diupdate!` };
  } catch (error) {
    console.error("Bulk Update Mutasi Error:", error);
    return { success: false, message: "Gagal melakukan update massal." };
  }
}
```

### 1.3 — `createBulkMutasiAset` — validasi + jangan telan error

Fungsi ini menangkap error sendiri lalu return `{ success: false }`, tapi pemanggilnya
(form) tidak pernah mengecek return value ini — jadi insert bisa gagal total sementara
UI tetap menampilkan toast sukses. Ganti isinya jadi:

```ts
export async function createBulkMutasiAset(dataArray: any[]) {
  try {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return { success: false, message: "Tidak ada data yang dikirim." };
    }

    for (let i = 0; i < dataArray.length; i++) {
      const row = dataArray[i];
      const cekTanggal: [string, unknown][] = [
        ["Tanggal Input", row.tanggalInput],
        ["Tgl Mutasi", row.tanggalMutasi],
        ["Tgl Perolehan", row.tanggalPerolehan],
      ];
      for (const [label, val] of cekTanggal) {
        const d = val instanceof Date ? val : new Date(val as string);
        if (Number.isNaN(d.getTime())) {
          return { success: false, message: `Baris ${i + 1}: ${label} tidak valid.` };
        }
      }
      const cekAngka: [string, unknown][] = [
        ["Jumlah", row.jumlah],
        ["Harga Perolehan", row.hargaPerolehan],
        ["Akm. Penyusutan", row.akmPenyusutan],
      ];
      for (const [label, val] of cekAngka) {
        if (!Number.isFinite(Number(val))) {
          return { success: false, message: `Baris ${i + 1}: ${label} bukan angka yang valid.` };
        }
      }
    }

    const hasil = await prisma.mutasiAset.createMany({ data: dataArray });
    revalidatePath("/aset/mutasi");
    return { success: true, message: `${hasil.count} data mutasi aset berhasil disimpan!` };
  } catch (error) {
    console.error("Bulk Insert Mutasi Error:", error);
    const detail = error instanceof Error ? error.message.split("\n").pop()?.trim() : "";
    return {
      success: false,
      message: `Gagal menyimpan data massal mutasi.${detail ? ` (${detail})` : ""}`,
    };
  }
}
```

**VERIFIKASI FASE 1:**

```bash
npx tsc --noEmit
npm run build
```

Keduanya harus sukses tanpa error. Ini gate paling penting — kalau masih gagal,
jangan lanjut ke fase lain.

**GATE:** Laporkan hasil build. Lanjut ke Fase 2 hanya kalau build sukses.

---

## FASE 2 — Perbaiki bug tanggal & baris geser di modul Mutasi

### Gejala yang harus hilang setelah fase ini
- Input data batch tanggal tertentu (misal 22 Juli 2026), tapi kolom "Tgl Mutasi" di
  tabel untuk salah satu baris menampilkan tanggal lain yang tidak pernah diinput user
  (contoh: 17 Jan 2026) — padahal baris itu ada di grup/dropdown tanggal yang benar.
- Ini terjadi karena kolom di textarea bulk-input di-split pakai
  `.filter(Boolean)` yang membuang baris kosong di tengah. Kalau user paste dari Excel
  dan salah satu sel di kolom "Tgl Mutasi" kosong, semua baris di bawahnya di kolom itu
  naik satu posisi — sementara kolom lain (No. Register, Nama Aset) yang selnya penuh
  tidak ikut naik. Akibatnya isi kolom Tgl Mutasi jadi milik baris yang salah.
- Diperparah oleh fallback `tglMutasi[i] || tglMutasi[0]` — kalau index kehabisan,
  diam-diam jatuh ke tanggal baris pertama, tanpa error apa pun.

### 2.1 — Buat file baru `src/lib/date.ts`

```ts
/**
 * Util tanggal terpusat untuk modul aset.
 *
 * Aturan main:
 * - Semua tanggal disimpan sebagai UTC midnight (Date.UTC), jadi tidak pernah
 *   geser sehari gara-gara timezone browser/server.
 * - Semua pembacaan balik pakai getUTC*() atau Intl dengan timeZone "UTC".
 * - Parsing DD/MM/YYYY bersifat STRICT. Kalau tidak cocok -> null, bukan
 *   Invalid Date yang diam-diam lolos ke database.
 */

export function parseTanggalID(input: string | null | undefined): Date | null {
  if (!input) return null;
  const s = String(input).replace(/\u00A0/g, " ").trim();
  const m = s.match(/^(\d{1,2})[/](\d{1,2})[/](\d{4})$/);
  if (!m) return null;

  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const d = new Date(Date.UTC(year, month - 1, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    return null;
  }
  return d;
}

export function parseTanggalInput(input: string | null | undefined): Date | null {
  if (!input) return null;
  const m = String(input).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

export function toDDMMYYYY(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getUTCFullYear()}`;
}

export function formatTanggalDisplay(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "Tanggal invalid";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/**
 * Pecah isi textarea jadi baris, TANPA membuang baris kosong di tengah.
 * Baris kosong di ujung tetap dibuang karena itu cuma sisa enter.
 */
export function splitBaris(str: string | null | undefined): string[] {
  if (!str) return [];
  const rows = String(str)
    .replace(/\r/g, "")
    .split("\n")
    .map((s) => s.trim());
  while (rows.length > 0 && rows[rows.length - 1] === "") rows.pop();
  return rows;
}

/**
 * Ambil nilai kolom untuk baris ke-i.
 * Kalau kolom cuma diisi 1 baris, di-broadcast ke semua baris.
 * Kalau kolom diisi banyak baris, TIDAK ada fallback ke baris pertama.
 */
export function ambilSel(kolom: string[], i: number): string {
  if (kolom.length === 1) return kolom[0];
  return kolom[i] ?? "";
}
```

### 2.2 — `src/app/(dashboard)/aset/mutasi/form-mutasi.tsx`

Lakukan penggantian berikut di file ini:

**a) Tambah import** di bagian atas (dekat import `sonner`):
```ts
import {
  parseTanggalID,
  parseTanggalInput,
  toDDMMYYYY,
  splitBaris,
  ambilSel,
} from "@/lib/date";
```

**b) Tambah helper** setelah deklarasi `type FormValues = z.infer<typeof bulkMutasiSchema>;`:
```ts
function bacaKolom(data: FormValues) {
  return {
    tglMutasi: splitBaris(data.tanggalMutasi),
    noReg: splitBaris(data.nomorRegisterAset),
    nama: splitBaris(data.namaAset),
    gol: splitBaris(data.golonganAset),
    jml: splitBaris(data.jumlah),
    tglPerolehan: splitBaris(data.tanggalPerolehan),
    hrg: splitBaris(data.hargaPerolehan),
    akm: splitBaris(data.akmPenyusutan),
    lokAwal: splitBaris(data.lokasiAwal),
    lokTujuan: splitBaris(data.lokasiTujuan),
    alasan: splitBaris(data.alasanMutasi),
  };
}

function hitungMaxRows(kolom: Record<string, string[]>) {
  return Math.max(0, ...Object.values(kolom).map((k) => k.length));
}

function bersihkanAngka(raw: string): number {
  if (!raw) return 0;
  const bersih = raw.replace(/[^\d,-]/g, "").replace(",", ".");
  const n = Number(bersih);
  return Number.isFinite(n) ? n : 0;
}
```

**c) Default value mode edit** — ganti pemakaian `toLocaleDateString('en-GB')` untuk
`tanggalMutasi` dan `tanggalPerolehan` menjadi `toDDMMYYYY(...)` dari util baru
(supaya konsisten UTC).

**d) Fungsi generate preview** — ganti seluruh logika `splitLines`/manual index jadi
pakai `bacaKolom()` + `hitungMaxRows()` + `ambilSel()`. Tambahkan flag validitas
tanggal per baris (`tanggalMutasiValid: parseTanggalID(...) !== null`) supaya preview
bisa menandai baris yang tanggalnya salah format.

**e) Fungsi submit** — ganti seluruh logika `splitLines`/`parseDateStr` manual jadi:
- Baca kolom pakai `bacaKolom()` + `hitungMaxRows()`.
- Validasi SEMUA baris dulu (tanggal wajib lolos `parseTanggalID`, angka wajib
  `Number.isFinite` setelah `bersihkanAngka`) SEBELUM membentuk payload. Kalau ada
  yang gagal, batalkan submit, tampilkan toast error yang menyebutkan nomor baris
  dan kolom yang bermasalah — jangan lanjut kirim ke server.
- Payload akhir pakai `parseTanggalID(...)!` dan `bersihkanAngka(...)` untuk semua
  baris, TIDAK ADA fallback `[i] || [0]` di mana pun.
- **Cek return value** dari `updateMutasiAset` dan `createBulkMutasiAset` — kalau
  `!res?.success`, tampilkan toast error dengan `res.message` dan `return` (jangan
  lanjut ke toast sukses). Ini yang menutup celah toast sukses palsu.
- Toast sukses akhir menyebutkan jumlah baris yang benar-benar tersimpan.

**f) Tampilan preview** — beri highlight visual (background merah muda + keterangan
kecil) pada sel tanggal yang gagal validasi, supaya user bisa langsung lihat baris
mana yang bermasalah sebelum submit.

### 2.3 — `src/app/(dashboard)/aset/mutasi/data-table.tsx`

- Hapus fungsi `formatToDDMMYYYY` dan `formatTanggalDisplay` lokal di file ini,
  ganti dengan import dari `@/lib/date` (`toDDMMYYYY`, `formatTanggalDisplay`).
  Alias `const formatToDDMMYYYY = toDDMMYYYY;` supaya pemakaian di JSX tidak perlu
  diubah semua.
- Guard regex format tanggal di inline-edit diganti pakai `parseTanggalID(newValue)`.
- Logika parse tanggal saat inline save (`new Date(\`${y}-${m}-${d}T00:00:00Z\`)`)
  diganti `parseTanggalID(newValue)`; kalau `null`, batalkan save dan tampilkan alert.

**VERIFIKASI FASE 2:**

```bash
npx tsc --noEmit
npm run build
```

Lalu tes manual di halaman `/aset/mutasi`:
1. Input batch dengan salah satu sel Tgl Mutasi sengaja dikosongkan → submit harus
   ditolak dengan pesan nomor baris, BUKAN diam-diam tersimpan dengan tanggal salah.
2. Input batch dengan Harga Perolehan berformat `1.500.000` → harus tersimpan sebagai
   1500000, bukan gagal atau NaN.
3. Input batch valid penuh → tanggal yang muncul di tabel harus persis sama dengan
   yang diketik user untuk setiap baris.

**GATE:** Laporkan hasil ketiga tes manual di atas. Lanjut ke Fase 3 hanya kalau user
sudah mengonfirmasi Neon branch backup (lihat Fase 0) DAN tes manual di atas lolos.

---

## FASE 3 — Hapus modul Gudang & Logistik

Urutan penghapusan **wajib** seperti ini supaya build tidak merah di tengah jalan
(hapus dari yang paling bergantung dulu, model Prisma paling terakhir):

### 3.1 — Hapus halaman (routes)
- `src/app/(dashboard)/master-barang/**`
- `src/app/(dashboard)/barang-masuk/page.tsx`
- `src/app/(dashboard)/barang-keluar/page.tsx`
- `src/app/(dashboard)/laporan/**`

### 3.2 — Sidebar
Di `src/components/Sidebar.tsx`:
- Hapus grup menu "Gudang & Logistik" beserta state `isGudangExpanded` dan item
  Master Barang / Barang Masuk / Barang Keluar / Laporan.
- **Item "Dashboard" (path `/`) JANGAN ikut terhapus** — pindahkan keluar dari grup
  gudang, jadi item menu mandiri (akan diisi ulang di Fase 4).
- Ganti teks brand "Gudang" + "Sync" jadi nama lain yang mencerminkan aplikasi aset
  (tanyakan user nama yang diinginkan kalau belum ada arahan; kalau tidak ada
  preferensi, pakai "AsetKu" sebagai default sementara).

### 3.3 — Server actions
- Hapus `src/actions/barang.ts`
- Hapus `src/actions/transaksi.ts`
- **Jangan hapus** `src/actions/dashboard.ts` — isinya akan ditulis ulang di Fase 4,
  bukan dihapus, karena route `/` masih memanggilnya.

### 3.4 — Endpoint API export gudang (kalau ada — audit belum menemukan endpoint
export khusus gudang; verifikasi ulang dengan `grep -rn "requisition\|inbound\|barang" src/app/api` sebelum menghapus apa pun di sini). **Jangan sentuh**
`/api/export/excel/registrasi`, `/api/export/excel/hapus-buku`,
`/api/export/excel/mutasi`, `/api/export/registrasi`, `/api/export/hapus-buku` —
semuanya punya data Aset walau dua yang terakhir namanya mirip pola gudang.

### 3.5 — Script root
- Hapus `reset-gudang.ts`

### 3.6 — Model Prisma (paling akhir)
Di `prisma/schema.prisma`, hapus model:
- `Barang`, `Kategori`
- `RequisitionHeader`, `RequisitionDetail`
- `InboundHeader`, `InboundDetail`

Setelah edit schema, buat migration (JANGAN pakai `db push` untuk perubahan ini —
pakai migration supaya ada jejak dan bisa direview sebelum diterapkan):

```bash
npx prisma migrate dev --name hapus_modul_gudang --create-only
```

**STOP** setelah `--create-only` — baca dulu isi file migration SQL yang dihasilkan
di `prisma/migrations/<timestamp>_hapus_modul_gudang/migration.sql`. Pastikan isinya
cuma `DROP TABLE` untuk 6 tabel gudang di atas, tidak ada yang menyentuh tabel Aset.
Tunjukkan isi SQL ini ke user untuk persetujuan eksplisit sebelum menjalankan
`npx prisma migrate deploy` atau apply lainnya.

### 3.7 — Branding
- `src/app/layout.tsx`: ganti `title`/`description` dari "GudangSync" ke nama baru.

**VERIFIKASI FASE 3:**

```bash
npx tsc --noEmit
npm run build
```

**GATE:** Jangan jalankan migration (3.6) sampai user menyetujui isi SQL-nya secara
eksplisit. Setelah migration diterapkan, laporkan hasil build sebelum lanjut Fase 4.

---

## FASE 4 — Rombak dashboard (`/`)

Route `/` (`src/app/(dashboard)/page.tsx`) sekarang menampilkan statistik gudang
(total barang, stok menipis, antrean packing) dan memanggil `getDashboardStats` dari
`src/actions/dashboard.ts` yang isinya query `barang`/`requisitionHeader`/`inboundHeader`
— semua tabel yang sudah dihapus di Fase 3. Kalau tidak diganti, halaman ini akan
crash.

1. Tulis ulang `getDashboardStats` di `src/actions/dashboard.ts` supaya query ke data
   Aset, misalnya: total aset per modul (registrasi/hapus buku/mutasi), aset yang
   masih berstatus PENDING, aktivitas terbaru.
2. Tulis ulang `src/app/(dashboard)/page.tsx` supaya menampilkan ringkasan itu,
   bukan data gudang.
3. Update Sidebar supaya item "Dashboard" tetap mengarah ke `/` seperti biasa.

**VERIFIKASI FASE 4:**

```bash
npx tsc --noEmit
npm run build
```

Buka `/` di browser (`npm run dev`), pastikan halaman render tanpa error dan
datanya masuk akal (bukan angka gudang, bukan kosong semua).

**GATE:** Laporkan hasil akhir semua fase dalam satu ringkasan sebelum push ke
`origin/main`.
