// Skrip generate CSV master 84 cabang dari kode_cabang.xlsx (normalisasi-lokasi.md
// bagian 5, follow-up Bagian B setelah data cabang lengkap tersedia).
//
// Beda dari generate-lokasi-master-suggestions.ts (yang menurunkan TIPE dari
// histori MutasiAset dan cuma dapat 13/84 cabang): file kode_cabang.xlsx
// sudah punya prefix TIPE (KC/KCP/ULS/dst) menempel di kolom NAMA CABANG,
// jadi kode TIPE-INITIAL diturunkan LANGSUNG dari master -- bukan tebakan,
// bukan histori. Read-only, TIDAK PERNAH menulis ke DB. Jalankan dengan:
//   npx tsx scripts/generate-lokasi-master.ts ["kode cabang.xlsx" path] [output.csv]

import * as fs from "fs";
import * as XLSX from "xlsx";
import { toCsv } from "./csvUtil";

// Urutan dicoba dari atas, yang cocok pertama dipakai. Urutan WAJIB begini:
// "KCP ULS" sebelum "KCP" dan "KCU" (supaya tidak salah potong jadi "KCP"
// polos), "KCP"/"KCU" sebelum "KC" (supaya "KCP Kenari"/"KCU Palembang"
// tidak ikut kepotong jadi tipe "KC").
const PREFIX_ORDER = ["KCP ULS", "KCU", "KCP", "KC", "ULS", "KF BUR", "Sentra"] as const;
// "Sentra" sengaja BUKAN tipe standar -- dimasukkan ke urutan coba supaya
// baris dengan prefix ini dikenali dan dapat alasan spesifik, bukan jatuh ke
// bucket "prefix tidak dikenal" generik.
const NON_STANDARD_PREFIX = "Sentra";

interface OutRow {
  no: string;
  kodeUsul: string;
  namaCabang: string;
  initial: string;
  aktif: boolean;
  alasan: string;
}

function parseInitial(raw: string): string {
  return String(raw ?? "").replace(/[()]/g, "").trim().toUpperCase();
}

function main() {
  const xlsxPath = process.argv[2] ?? "C:/Users/indra/Downloads/kode cabang.xlsx";
  const outPath = process.argv[3] ?? "scripts/lokasi-master-cabang.csv";

  const wb = XLSX.readFile(xlsxPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  const [header, ...body] = rows;
  if (!header || header[0] !== "NO" || header[1] !== "NAMA CABANG") {
    throw new Error(`Format kolom tidak sesuai ekspektasi (NO, NAMA CABANG, INTIAL). Header: ${JSON.stringify(header)}`);
  }

  const out: OutRow[] = [];
  let kantorPusatExcluded = 0;

  for (const row of body) {
    const noRaw = String(row[0] ?? "").trim();
    const namaCabang = String(row[1] ?? "").trim();
    const initial = parseInitial(row[2]);

    if (noRaw === "999") {
      // Kantor Pusat -- bukan cabang, unit kerja KP sudah ditangani skrip
      // generate-lokasi-master-suggestions.ts (dari histori). Dilewati di sini.
      kantorPusatExcluded += 1;
      continue;
    }

    const no = noRaw.padStart(3, "0");

    if (!initial) {
      out.push({ no, kodeUsul: "", namaCabang, initial: "", aktif: false, alasan: `Tidak ada initial untuk "${namaCabang}"` });
      continue;
    }

    let matchedPrefix: string | null = null;
    for (const prefix of PREFIX_ORDER) {
      if (namaCabang.startsWith(prefix)) {
        matchedPrefix = prefix;
        break;
      }
    }

    if (!matchedPrefix) {
      out.push({ no, kodeUsul: "", namaCabang, initial, aktif: false, alasan: `Prefix TIPE tidak dikenal di "${namaCabang}"` });
      continue;
    }

    if (matchedPrefix === NON_STANDARD_PREFIX) {
      out.push({
        no,
        kodeUsul: "",
        namaCabang,
        initial,
        aktif: false,
        alasan: `Prefix "${NON_STANDARD_PREFIX}" bukan tipe standar (KC/KCP/KCU/ULS/KF BUR)`,
      });
      continue;
    }

    const tipe = matchedPrefix === "KCP ULS" ? "KCP" : matchedPrefix;
    out.push({
      no,
      kodeUsul: `${tipe}-${initial}`,
      namaCabang,
      initial,
      aktif: true,
      alasan: matchedPrefix === "KCP ULS" ? `Prefix "KCP ULS" diringkas jadi "KCP"` : `Prefix "${matchedPrefix}" dari master`,
    });
  }

  const header_ = ["no", "kode_usul", "nama_cabang", "initial", "aktif", "alasan"];
  const csvRows = out.map((r) => [r.no, r.kodeUsul, r.namaCabang, r.initial, r.aktif ? "TRUE" : "FALSE", r.alasan]);
  fs.writeFileSync(outPath, toCsv(header_, csvRows), "utf-8");

  const aktifCount = out.filter((r) => r.aktif).length;
  const nonAktifCount = out.filter((r) => !r.aktif).length;

  console.log(`${out.length} baris cabang ditulis ke ${outPath} (Kantor Pusat dilewati: ${kantorPusatExcluded})`);
  console.log(`  aktif=TRUE: ${aktifCount}`);
  console.log(`  aktif=FALSE: ${nonAktifCount}`);
  if (nonAktifCount > 0) {
    console.log("  Baris aktif=FALSE:");
    for (const r of out.filter((x) => !x.aktif)) {
      console.log(`    - NO ${r.no} (${r.namaCabang}): ${r.alasan}`);
    }
  }

  if (aktifCount !== 81 || nonAktifCount !== 3) {
    console.error(`\nPERINGATAN: hasil (${aktifCount} aktif / ${nonAktifCount} non-aktif) TIDAK sesuai ekspektasi (81/3). Cek parsing prefix di atas sebelum lanjut seed.`);
    process.exitCode = 1;
  }
}

main();
