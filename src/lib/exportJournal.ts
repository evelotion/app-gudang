// src/lib/exportJournal.ts
//
// Membangun file jurnal mutasi aset (.xls BIFF8, 3 sheet) untuk upload CBS.
// Pure — tidak menyentuh Prisma, session, atau DOM, supaya bisa dites
// langsung. Dipanggil dari server action `exportJurnalMutasi` di
// src/actions/aset.ts, yang bertanggung jawab query DB + requireSession.
//
// Kebijakan error (bagian 1.5 dokumen audit): tidak ada skip diam-diam.
// Validasi seluruh dataset dulu, kumpulkan semua masalah, lempar SATU error
// berisi daftar lengkap. Kalau ada masalah, tidak ada file yang ditulis.

import * as XLSX from "xlsx";
import {
  lookupGolongan,
  lookupCabang,
  splitLokasi,
  NON_INVENTARIS_KANONIK,
  type GolonganEntry,
  type CabangInfo,
} from "./mappings";
import { buildKeterangan, MAX_KETERANGAN } from "./keteranganJurnal";

export interface MutasiAsetRow {
  nomorRegisterAset: string;
  namaAset: string;
  golonganAset: string;
  jumlah: number;
  tanggalInput: Date;
  tanggalMutasi: Date;
  tanggalPerolehan: Date;
  hargaPerolehan: number | { toString(): string };
  akmPenyusutan: number | { toString(): string };
  lokasiAwal: string;
  lokasiTujuan: string;
  alasanMutasi: string;
  operatorName: string;
}

// ==========================================
// ERROR COLLECTION (bagian 1.5)
// ==========================================

type IssueType =
  | "golongan"
  | "register_mismatch"
  | "lokasi_pola"
  | "lokasi_tidak_dikenal"
  | "keterangan";

interface ValidationIssue {
  type: IssueType;
  value: string;
  message: string;
  nomorRegisterAset: string;
}

function formatIssues(issues: ValidationIssue[]): string {
  const groups = new Map<string, { message: string; count: number; example: string }>();
  for (const issue of issues) {
    const key = `${issue.type}::${issue.value}`;
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(key, { message: issue.message, count: 1, example: issue.nomorRegisterAset });
    }
  }

  const lines: string[] = [];
  let i = 1;
  for (const g of groups.values()) {
    lines.push(`${i}. ${g.message}`);
    lines.push(`   ${g.count} baris terdampak (contoh: ${g.example})`);
    i += 1;
  }

  return `Export dibatalkan. ${groups.size} masalah ditemukan:\n\n${lines.join("\n")}`;
}

export class ExportJurnalError extends Error {
  issues: ValidationIssue[];
  constructor(issues: ValidationIssue[]) {
    super(formatIssues(issues));
    this.name = "ExportJurnalError";
    this.issues = issues;
  }
}

// ==========================================
// VALIDASI PER BARIS (golongan, register silang, lokasi — bagian 3, 3.4, 7)
// ==========================================

interface ResolvedRow {
  row: MutasiAsetRow;
  golongan: GolonganEntry;
  cabangAwal: CabangInfo;
  cabangTujuan: CabangInfo;
}

function validateLokasi(
  lokasi: string,
  nomorRegisterAset: string,
  issues: ValidationIssue[]
): CabangInfo | null {
  if (!splitLokasi(lokasi)) {
    issues.push({
      type: "lokasi_pola",
      value: lokasi,
      message: `Format lokasi tidak dikenal: "${lokasi}"`,
      nomorRegisterAset,
    });
    return null;
  }
  const info = lookupCabang(lokasi);
  if (!info) {
    issues.push({
      type: "lokasi_tidak_dikenal",
      value: lokasi,
      message: `Lokasi tidak dikenal: "${lokasi}"`,
      nomorRegisterAset,
    });
    return null;
  }
  return info;
}

function validateAndResolve(rows: MutasiAsetRow[]): ResolvedRow[] {
  const issues: ValidationIssue[] = [];
  const resolved: ResolvedRow[] = [];

  for (const row of rows) {
    const golongan = lookupGolongan(row.golonganAset);
    if (!golongan) {
      issues.push({
        type: "golongan",
        value: row.golonganAset,
        message: `Golongan tidak dikenal: "${row.golonganAset}"`,
        nomorRegisterAset: row.nomorRegisterAset,
      });
    } else {
      const segmen = row.nomorRegisterAset.split("/")[0];
      if (Number(segmen) !== golongan.nomorGolongan) {
        issues.push({
          type: "register_mismatch",
          value: row.nomorRegisterAset,
          message: `Segmen nomor register tidak cocok dengan golongan: "${row.nomorRegisterAset}"`,
          nomorRegisterAset: row.nomorRegisterAset,
        });
      }
    }

    const cabangAwal = validateLokasi(row.lokasiAwal, row.nomorRegisterAset, issues);
    const cabangTujuan = validateLokasi(row.lokasiTujuan, row.nomorRegisterAset, issues);

    if (golongan && cabangAwal && cabangTujuan) {
      resolved.push({ row, golongan, cabangAwal, cabangTujuan });
    }
  }

  if (issues.length > 0) {
    throw new ExportJurnalError(issues);
  }
  return resolved;
}

// ==========================================
// GROUPING & URUTAN (bagian 4)
// ==========================================

interface Group {
  kanonik: string;
  golongan: GolonganEntry;
  lokasiAwal: string;
  lokasiTujuan: string;
  cabangAwal: CabangInfo;
  cabangTujuan: CabangInfo;
  totalHarga: number;
  totalAkm: number;
  totalJumlah: number;
  items: MutasiAsetRow[];
}

interface NumberedGroup extends Group {
  nomorGrup: number;
  kodeRef: string;
}

function buildGroups(resolved: ResolvedRow[]): Group[] {
  const map = new Map<string, Group>();
  for (const { row, golongan, cabangAwal, cabangTujuan } of resolved) {
    const key = `${golongan.kanonik}||${row.lokasiAwal}||${row.lokasiTujuan}`;
    let g = map.get(key);
    if (!g) {
      g = {
        kanonik: golongan.kanonik,
        golongan,
        lokasiAwal: row.lokasiAwal,
        lokasiTujuan: row.lokasiTujuan,
        cabangAwal,
        cabangTujuan,
        totalHarga: 0,
        totalAkm: 0,
        totalJumlah: 0,
        items: [],
      };
      map.set(key, g);
    }
    g.totalHarga += Number(row.hargaPerolehan);
    // Nilai buku Rp1 pada aset yang sudah habis disusutkan adalah kebijakan
    // yang disengaja, bukan pembulatan atau data kotor. Aset disisakan Rp1
    // supaya tetap terlihat di register, bukan hilang jadi nol.
    //
    // JANGAN pernah menambahkan normalisasi semacam
    // `if (akm >= harga) akm = harga` atau clamp nilai buku ke 0. Justru
    // kesalahan itu yang terjadi di jurnal manual sebelumnya: akm ditulis
    // sama dengan harga perolehan (menyalin angka), sehingga residu Rp1
    // terhapus di cabang tujuan dan saldo akm cabang asal menjadi -1.
    g.totalAkm += Number(row.akmPenyusutan);
    g.totalJumlah += Number(row.jumlah);
    g.items.push(row);
  }
  return [...map.values()];
}

function sortGroups(groups: Group[]): Group[] {
  return [...groups].sort(
    (a, b) =>
      a.kanonik.localeCompare(b.kanonik) ||
      a.lokasiTujuan.localeCompare(b.lokasiTujuan) ||
      a.lokasiAwal.localeCompare(b.lokasiAwal)
  );
}

function ddmmyy(d: Date): string {
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = String(d.getUTCFullYear()).slice(-2);
  return `${day}${month}${year}`;
}

function ddmmyyyyCompact(d: Date): string {
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${day}${month}${d.getUTCFullYear()}`;
}

function assignKodeRef(groups: Group[], tanggalMutasi: Date): NumberedGroup[] {
  const tag = ddmmyy(tanggalMutasi);
  return groups.map((g, i) => ({
    ...g,
    nomorGrup: i + 1,
    kodeRef: `M${tag}-${String(i + 1).padStart(2, "0")}`,
  }));
}

// ==========================================
// KETERANGAN PER GRUP (bagian 5.4, guardrail #6)
// ==========================================

function buildKeteranganForGroups(
  groups: NumberedGroup[]
): Map<number, { perolehan: string; akm: string }> {
  const issues: ValidationIssue[] = [];
  const result = new Map<number, { perolehan: string; akm: string }>();

  for (const g of groups) {
    if (g.kanonik === NON_INVENTARIS_KANONIK) continue; // tidak pernah masuk sheet `data`

    const perolehan = buildKeterangan(
      "perolehan",
      g.golongan.labelPendek,
      g.totalJumlah,
      g.cabangAwal.abbr,
      g.cabangTujuan.abbr,
      g.kodeRef
    );
    const akm = buildKeterangan(
      "akm",
      g.golongan.labelPendek,
      g.totalJumlah,
      g.cabangAwal.abbr,
      g.cabangTujuan.abbr,
      g.kodeRef
    );

    if (!perolehan || !akm) {
      issues.push({
        type: "keterangan",
        value: g.kodeRef,
        message: `Keterangan melebihi ${MAX_KETERANGAN} karakter setelah semua fallback: grup "${g.kodeRef}" (${g.golongan.kanonik}, ${g.lokasiAwal}>${g.lokasiTujuan})`,
        nomorRegisterAset: g.items[0]?.nomorRegisterAset ?? "-",
      });
      continue;
    }

    result.set(g.nomorGrup, { perolehan, akm });
  }

  if (issues.length > 0) {
    throw new ExportJurnalError(issues);
  }
  return result;
}

// ==========================================
// TANGGAL SEBAGAI SERIAL EXCEL (bukan string) — bagian 6.1
// ==========================================

const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);

function toExcelSerial(value: Date | string): number {
  const d = value instanceof Date ? value : new Date(value);
  return Math.round((d.getTime() - EXCEL_EPOCH_UTC) / 86400000);
}

// ==========================================
// SHEET `data` (JURNAL) — bagian 2.1, 5
// ==========================================

// Ringkasan saja — legenda lengkap A-L ada di sheet `referensi`. BIFF8 LABEL
// record (SheetJS) membatasi satu sel ke 255 karakter; teks lengkap (726
// karakter) terpotong di tengah kata kalau dipaksa masuk sel ini.
const LEGENDA_TEXT =
  "Keterangan Input Transaksi Massal (lengkap: lihat sheet 'referensi'). Tx Code 000 = GL. Jenis Mutasi: D/C. Kode kurs IDR: BOOKING. Kode tx class hanya untuk tx code 110. Override account/cabang hanya untuk tx code 002, 110, 004.";

const JURNAL_HEADER = [
  "No", "Tx Code", "Nomor Rekening", "Jenis Mutasi", "Nilai Mutasi",
  "Kode_Kurs", "Nilai_Kurs", "Kode_RC", "Keterangan",
  "kode_tx_class", "override_account", "override_cabang",
];

interface JurnalRowsResult {
  rows: (string | number)[][];
  totalAktiva: number;
  totalPenyusutan: number;
  coaRows: { akun: string; label: string }[];
}

function buildJurnalRows(
  groups: NumberedGroup[],
  keteranganMap: Map<number, { perolehan: string; akm: string }>
): JurnalRowsResult {
  const rows: (string | number)[][] = [];
  let no = 1;
  let totalAktiva = 0;
  let totalPenyusutan = 0;
  const coaRows: { akun: string; label: string }[] = [];
  const seenAkun = new Set<string>();

  for (const g of groups) {
    if (g.kanonik === NON_INVENTARIS_KANONIK) continue; // bagian 4.4
    const ket = keteranganMap.get(g.nomorGrup)!;

    if (g.totalHarga > 0) {
      rows.push([no++, "000", `${g.golongan.akunPerolehan}-${g.cabangTujuan.code}-IDR`, "D", g.totalHarga, "BOOKING", 1, "", ket.perolehan, "", "", ""]);
      rows.push([no++, "000", `${g.golongan.akunPerolehan}-${g.cabangAwal.code}-IDR`, "C", g.totalHarga, "BOOKING", 1, "", ket.perolehan, "", "", ""]);
      totalAktiva += g.totalHarga;
      if (!seenAkun.has(g.golongan.akunPerolehan)) {
        coaRows.push({ akun: g.golongan.akunPerolehan, label: g.golongan.kanonik });
        seenAkun.add(g.golongan.akunPerolehan);
      }
    }

    if (g.totalAkm > 0 && g.golongan.akunAkm) {
      // Arah kebalik dari perolehan — akm penyusutan contra-asset (5.2b)
      rows.push([no++, "000", `${g.golongan.akunAkm}-${g.cabangAwal.code}-IDR`, "D", g.totalAkm, "BOOKING", 1, "", ket.akm, "", "", ""]);
      rows.push([no++, "000", `${g.golongan.akunAkm}-${g.cabangTujuan.code}-IDR`, "C", g.totalAkm, "BOOKING", 1, "", ket.akm, "", "", ""]);
      totalPenyusutan += g.totalAkm;
      if (!seenAkun.has(g.golongan.akunAkm)) {
        coaRows.push({ akun: g.golongan.akunAkm, label: `Akm Peny - ${g.golongan.labelAkm ?? g.golongan.kanonik}` });
        seenAkun.add(g.golongan.akunAkm);
      }
    }
  }

  coaRows.sort((a, b) => a.akun.localeCompare(b.akun));
  return { rows, totalAktiva, totalPenyusutan, coaRows };
}

function buildDataSheet(
  groups: NumberedGroup[],
  keteranganMap: Map<number, { perolehan: string; akm: string }>,
  operatorName: string
): XLSX.WorkSheet {
  const { rows: bodyRows, totalAktiva, totalPenyusutan, coaRows } = buildJurnalRows(groups, keteranganMap);

  const aoa: (string | number)[][] = [];
  aoa.push(["TRANSAKSI UMUM MASSAL"]);
  aoa.push([LEGENDA_TEXT]);
  aoa.push(JURNAL_HEADER);
  for (const row of bodyRows) aoa.push(row);

  aoa.push([]); // 1 baris kosong sebelum blok ringkasan (5.5)

  const rowDibuat: (string | number)[] = new Array(9).fill("");
  rowDibuat[2] = "Dibuat";
  rowDibuat[3] = "Mengetahui";
  rowDibuat[4] = "Menyetujui";
  rowDibuat[7] = "KETERANGAN";
  aoa.push(rowDibuat);

  const totalAktivaRowIdx = aoa.length;
  const rowTotalAktiva: (string | number)[] = new Array(9).fill("");
  rowTotalAktiva[7] = "Total Aktiva";
  rowTotalAktiva[8] = totalAktiva;
  aoa.push(rowTotalAktiva);

  const rowTotalPeny: (string | number)[] = new Array(9).fill("");
  rowTotalPeny[7] = "Total Peny.";
  rowTotalPeny[8] = totalPenyusutan;
  aoa.push(rowTotalPeny);

  const rowTotal: (string | number)[] = new Array(9).fill("");
  rowTotal[7] = "Total";
  rowTotal[8] = totalAktiva + totalPenyusutan;
  aoa.push(rowTotal);

  const rowSign: (string | number)[] = new Array(9).fill("");
  rowSign[2] = operatorName;
  rowSign[3] = "Kamirina";
  rowSign[4] = "Andreanne Soetarman";
  if (coaRows[0]) {
    rowSign[7] = coaRows[0].akun;
    rowSign[8] = coaRows[0].label;
  }
  aoa.push(rowSign);

  for (let i = 1; i < coaRows.length; i += 1) {
    const r: (string | number)[] = new Array(9).fill("");
    r[7] = coaRows[i].akun;
    r[8] = coaRows[i].label;
    aoa.push(r);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  for (let i = 0; i < 3; i += 1) {
    const addr = XLSX.utils.encode_cell({ r: totalAktivaRowIdx + i, c: 8 });
    if (ws[addr]) ws[addr].z = "#,##0";
  }

  ws["!cols"] = [
    { wch: 5 }, { wch: 10 }, { wch: 22 }, { wch: 12 }, { wch: 15 },
    { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 70 },
    { wch: 14 }, { wch: 16 }, { wch: 16 },
  ];

  return ws;
}

// ==========================================
// SHEET `Sheet3` (LAMPIRAN) — bagian 6
// ==========================================

const LAMPIRAN_HEADER = [
  "No", "Tanggal Input", "Tgl Mutasi", "No. Register", "Nama Aset", "Golongan",
  "Jumlah", "Tgl Perolehan", "Harga Perolehan", "Akm. Penyusutan",
  "Lokasi Awal", "Lokasi Tujuan", "Alasan Mutasi", "Operator", "Kode Ref",
];

function computeGolonganTotals(groups: NumberedGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const g of groups) {
    totals.set(g.kanonik, (totals.get(g.kanonik) ?? 0) + g.totalJumlah);
  }
  return totals;
}

function buildLampiranSheet(groups: NumberedGroup[]): XLSX.WorkSheet {
  const golonganTotals = computeGolonganTotals(groups);
  const aoa: (string | number)[][] = [[...LAMPIRAN_HEADER]];
  const dateCells: { r: number; c: number }[] = [];
  let prevKanonik: string | null = null;

  for (const g of groups) {
    if (g.kanonik !== prevKanonik) {
      if (prevKanonik !== null) aoa.push([...LAMPIRAN_HEADER]); // ulang header saat ganti golongan (6.2)
      prevKanonik = g.kanonik;
    }

    let noInGroup = 1;
    for (const item of g.items) {
      const rIdx = aoa.length;
      aoa.push([
        noInGroup++,
        toExcelSerial(item.tanggalInput),
        toExcelSerial(item.tanggalMutasi),
        item.nomorRegisterAset,
        item.namaAset,
        g.kanonik,
        item.jumlah,
        toExcelSerial(item.tanggalPerolehan),
        Number(item.hargaPerolehan),
        Number(item.akmPenyusutan),
        g.lokasiAwal,
        g.lokasiTujuan,
        item.alasanMutasi,
        item.operatorName,
        g.kodeRef,
      ]);
      dateCells.push({ r: rIdx, c: 1 }, { r: rIdx, c: 2 }, { r: rIdx, c: 7 });
    }

    const subtotal: (string | number)[] = new Array(15).fill("");
    subtotal[4] = `SUBTOTAL ${g.kanonik.toUpperCase()}`;
    // Jumlah subtotal = total unit SELURUH golongan, bukan per grup rute
    // (bagian 6.3). Semua subtotal dalam satu golongan menampilkan angka
    // yang sama — ini perilaku acuan yang dipertahankan, bukan bug.
    subtotal[6] = golonganTotals.get(g.kanonik) ?? 0;
    subtotal[8] = g.totalHarga;
    subtotal[9] = g.totalAkm;
    subtotal[14] = g.kodeRef;
    aoa.push(subtotal);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  for (const { r, c } of dateCells) {
    const addr = XLSX.utils.encode_cell({ r, c });
    if (ws[addr]) ws[addr].z = "dd/mm/yyyy";
  }

  ws["!cols"] = [
    { wch: 5 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 28 }, { wch: 20 },
    { wch: 8 }, { wch: 14 }, { wch: 18 }, { wch: 18 },
    { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 18 }, { wch: 14 },
  ];

  return ws;
}

// ==========================================
// SHEET `referensi` — Lampiran B, disalin apa adanya
// ==========================================

const REFERENSI_VALUES = [
  "akum_depresiasi", "biaya_administrasi", "biaya_asuransi", "biaya_lainnya",
  "biaya_notaris", "by_ppap", "by_ppap_khusus", "denda_gp", "depresiasi", "escrow_jf",
  "hold_jaminan", "kwjb_denda", "margin_ditangguhkan", "margin_penyelesaian", "mukasah",
  "nilai_perolehan", "outstanding", "pdp_adm", "pdp_denda", "pdp_rev_ppap", "pembayaran",
  "pendapatan", "pendapatan_akru", "persediaan", "ppap_adjustment", "ppap_khusus",
  "ppap_umum", "titipan dropping", "tunggakan", "write_off",
];

// Legenda lengkap kolom A-L sheet `data`, dipindah ke sini karena BIFF8
// LABEL record membatasi sel A2 di sheet `data` ke 255 karakter (lihat
// LEGENDA_TEXT di atas). Ditambahkan setelah blok kode_tx_class, bukan
// menimpanya.
const LEGENDA_LINES = [
  "LEGENDA KOLOM SHEET 'data'",
  "A. No : Nomor urut",
  "B. Tx Code : [000, 002, 110, 004] --> 000 = GL , 002 = Rekening liabilitas, 110 = Financing, 004 = Rekening transaksi (umum)",
  "C. Nomor Rekening : Diinputkan dengan Nomor Rekening Tabungan/Giro atau Nomor GL(Dengan Format yang telah ditentukan)",
  "D. Jenis Mutasi  :  D/C",
  "E. Nilai Mutasi",
  "F. Kode kurs --> [BOOKING, TT_BELI, TT_JUAL, BN_JUAL, BN_BELI] , untuk transaksi IDR menggunakan kode BOOKING saja",
  "G. Nilai Kurs",
  "H. Kode RC",
  "I. Keterangan",
  "J. Kode tx class (diisi dengan sub jenis mutasi, untuk tx code 110)",
  "K. Override account (kode account override), berlaku untuk tx code 002, 110 dan 004",
  "L. Override cabang (kode cabang override), berlaku  untuk tx code 002, 110 dan 004",
];

function buildReferensiSheet(): XLSX.WorkSheet {
  const aoa: string[][] = [["referensi kode_tx_class"], []];
  for (const v of REFERENSI_VALUES) aoa.push([v]);
  aoa.push([]);
  for (const line of LEGENDA_LINES) aoa.push([line]);
  return XLSX.utils.aoa_to_sheet(aoa);
}

// ==========================================
// ORCHESTRATOR
// ==========================================

export interface BuildJurnalExportOptions {
  operatorName: string;
  tanggalMutasi: Date;
}

export interface BuildJurnalExportResult {
  buffer: Buffer;
  fileName: string;
}

export function buildJurnalExport(
  rows: MutasiAsetRow[],
  opts: BuildJurnalExportOptions
): BuildJurnalExportResult {
  const resolved = validateAndResolve(rows);
  const groups = assignKodeRef(sortGroups(buildGroups(resolved)), opts.tanggalMutasi);
  const keteranganMap = buildKeteranganForGroups(groups);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildDataSheet(groups, keteranganMap, opts.operatorName), "data");
  XLSX.utils.book_append_sheet(wb, buildReferensiSheet(), "referensi");
  XLSX.utils.book_append_sheet(wb, buildLampiranSheet(groups), "Sheet3");

  const buffer = XLSX.write(wb, { bookType: "biff8", type: "buffer" }) as Buffer;
  const fileName = `Jurnal_Mutasi_${ddmmyyyyCompact(opts.tanggalMutasi)}.xls`;

  return { buffer, fileName };
}
