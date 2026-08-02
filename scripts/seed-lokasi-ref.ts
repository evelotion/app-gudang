// Skrip seed LokasiRef (normalisasi-lokasi.md bagian A.4).
//
// Baca CSV hasil review manusia (lihat generate-lokasi-suggestions.ts + A.3)
// dan upsert ke tabel LokasiRef berdasarkan `raw`. Jalankan dengan:
//   npx tsx scripts/seed-lokasi-ref.ts [input.csv]

import * as fs from "fs";
import { prisma } from "../src/lib/prisma";
import { isKnownCabangInitial } from "../src/lib/mappings";
import { parseCsvRecords } from "./csvUtil";

const VALID_TIPE = new Set(["CABANG", "KANTOR_PUSAT", "WISMA"]);

interface SkipReason {
  raw: string;
  reason: string;
}

function validateRow(rec: Record<string, string>): string | null {
  const raw = (rec.raw ?? "").trim();
  const usulKode = (rec.usul_kode ?? "").trim();
  const usulLabel = (rec.usul_label ?? "").trim();
  const usulInitial = (rec.usul_initial ?? "").trim().toUpperCase();
  const usulTipe = (rec.usul_tipe ?? "").trim().toUpperCase();

  if (!raw || !usulKode || !usulLabel || !usulInitial || !usulTipe) {
    return "kolom wajib kosong (raw/usul_kode/usul_label/usul_initial/usul_tipe)";
  }
  if (!/^\d{3}$/.test(usulKode)) {
    return `usul_kode "${usulKode}" bukan 3 digit`;
  }
  if (!VALID_TIPE.has(usulTipe)) {
    return `usul_tipe "${usulTipe}" tidak dikenal (harus CABANG/KANTOR_PUSAT/WISMA)`;
  }
  if (usulTipe === "CABANG" && !isKnownCabangInitial(usulInitial)) {
    return `usul_tipe CABANG tapi initial "${usulInitial}" tidak ada di tabel 84 cabang`;
  }
  if ((usulTipe === "KANTOR_PUSAT" || usulTipe === "WISMA") && usulKode !== "999") {
    return `usul_tipe ${usulTipe} tapi usul_kode "${usulKode}" bukan "999"`;
  }
  return null;
}

async function main() {
  const inPath = process.argv[2] ?? "scripts/lokasi-suggestions.csv";
  const text = fs.readFileSync(inPath, "utf-8");
  const records = parseCsvRecords(text);

  const skipped: SkipReason[] = [];
  let upserted = 0;

  for (const rec of records) {
    const raw = (rec.raw ?? "").trim();
    const error = validateRow(rec);
    if (error) {
      skipped.push({ raw: raw || "(kosong)", reason: error });
      continue;
    }

    const kodeCabang = rec.usul_kode.trim();
    const label = rec.usul_label.trim();
    const initial = rec.usul_initial.trim().toUpperCase();
    const tipe = rec.usul_tipe.trim().toUpperCase() as "CABANG" | "KANTOR_PUSAT" | "WISMA";
    const catatan = (rec.alasan ?? "").trim() || null;

    await prisma.lokasiRef.upsert({
      where: { raw },
      update: { kodeCabang, label, initial, tipe, catatan },
      create: { raw, kodeCabang, label, initial, tipe, catatan },
    });
    upserted += 1;
  }

  console.log(`${upserted} baris di-upsert ke LokasiRef.`);
  if (skipped.length > 0) {
    console.log(`${skipped.length} baris dilewati:`);
    for (const s of skipped) {
      console.log(`  - "${s.raw}": ${s.reason}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
