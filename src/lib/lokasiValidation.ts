// Validasi lokasiAwal/lokasiTujuan sebelum simpan (normalisasi-lokasi.md
// bagian B.3).
//
// Pakai resolveLokasi() yang sama dengan export jurnal (bagian A) sebagai
// gerbang: kalau sebuah nilai tidak akan resolve saat export, tolak sejak
// input, jangan tunggu ketahuan bulan berikutnya saat export. Ini TIDAK
// lebih ketat dari export hari ini -- nilai yang lolos di sini pasti lolos
// export juga.
//
// Sengaja TIDAK mewajibkan exact match ke tabel master `Lokasi` (kode+aktif):
// tabel itu baru berisi 26 dari 84+ kode kanonik (menunggu kode_cabang.xlsx
// untuk sisanya, lihat scripts/lokasi-master-suggestions.csv). Mewajibkan
// exact match sekarang akan memblokir mutasi baru ke cabang yang sah tapi
// belum sempat masuk tabel master.

import { resolveLokasi, type LokasiRefEntry } from "./mappings";

export interface LokasiCheckRow {
  lokasiAwal: string;
  lokasiTujuan: string;
}

/**
 * Kumpulkan semua baris/kolom lokasi yang tidak dikenal, jangan berhenti di
 * kesalahan pertama -- konsisten dengan pola kumpulkan-semua-error di
 * exportJournal.ts.
 */
export function findLokasiErrors(
  rows: LokasiCheckRow[],
  lokasiRefMap: Map<string, LokasiRefEntry>
): string[] {
  const errors: string[] = [];
  rows.forEach((row, idx) => {
    const baris = idx + 1;
    if (!resolveLokasi(row.lokasiAwal, lokasiRefMap)) {
      errors.push(`Baris ${baris}: Lokasi Awal "${row.lokasiAwal}" tidak dikenal.`);
    }
    if (!resolveLokasi(row.lokasiTujuan, lokasiRefMap)) {
      errors.push(`Baris ${baris}: Lokasi Tujuan "${row.lokasiTujuan}" tidak dikenal.`);
    }
  });
  return errors;
}
