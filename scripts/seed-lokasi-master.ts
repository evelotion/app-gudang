// Skrip seed tabel master Lokasi (normalisasi-lokasi.md bagian B.1).
//
// Baca CSV dari generate-lokasi-master-suggestions.ts dan upsert ke `Lokasi`
// berdasarkan `kode`. Baris dengan kode_usul kosong (keyakinan RENDAH --
// TIPE cabang belum diketahui, atau initial ambigu) DILEWATI, bukan ditebak.
// Jalankan dengan:
//   npx tsx scripts/seed-lokasi-master.ts [input.csv]

import * as fs from "fs";
import { prisma } from "../src/lib/prisma";
import { isKnownCabangInitial } from "../src/lib/mappings";
import { parseCsvRecords } from "./csvUtil";

const VALID_TIPE = new Set(["CABANG", "KANTOR_PUSAT", "WISMA"]);

interface SkipReason {
  kode: string;
  reason: string;
}

function validateRow(rec: Record<string, string>): string | null {
  const kode = (rec.kode_usul ?? "").trim();
  const kodeCabang = (rec.kodeCabang ?? "").trim();
  const nama = (rec.nama_usul ?? "").trim();
  const initial = (rec.initial ?? "").trim().toUpperCase();
  const tipe = (rec.tipe ?? "").trim().toUpperCase();

  if (!kode || !kodeCabang || !nama || !initial || !tipe) {
    return null; // baris belum lengkap (RENDAH) -- dilewati diam-diam, ini ekspektasi normal
  }
  if (!/^\d{3}$/.test(kodeCabang)) {
    return `kodeCabang "${kodeCabang}" bukan 3 digit`;
  }
  if (!VALID_TIPE.has(tipe)) {
    return `tipe "${tipe}" tidak dikenal (harus CABANG/KANTOR_PUSAT/WISMA)`;
  }
  if (tipe === "CABANG" && !isKnownCabangInitial(initial)) {
    return `tipe CABANG tapi initial "${initial}" tidak ada di tabel 84 cabang`;
  }
  if ((tipe === "KANTOR_PUSAT" || tipe === "WISMA") && kodeCabang !== "999") {
    return `tipe ${tipe} tapi kodeCabang "${kodeCabang}" bukan "999"`;
  }
  return null;
}

async function main() {
  const inPath = process.argv[2] ?? "scripts/lokasi-master-suggestions.csv";
  const text = fs.readFileSync(inPath, "utf-8");
  const records = parseCsvRecords(text);

  const skipped: SkipReason[] = [];
  let upserted = 0;
  let incomplete = 0;

  for (const rec of records) {
    const kode = (rec.kode_usul ?? "").trim();
    if (!kode) {
      incomplete += 1;
      continue;
    }

    const error = validateRow(rec);
    if (error) {
      skipped.push({ kode, reason: error });
      continue;
    }

    const kodeCabang = rec.kodeCabang.trim();
    const nama = rec.nama_usul.trim();
    const initial = rec.initial.trim().toUpperCase();
    const tipe = rec.tipe.trim().toUpperCase() as "CABANG" | "KANTOR_PUSAT" | "WISMA";

    await prisma.lokasi.upsert({
      where: { kode },
      update: { kodeCabang, nama, initial, tipe },
      create: { kode, kodeCabang, nama, initial, tipe, aktif: true },
    });
    upserted += 1;
  }

  console.log(`${upserted} baris di-upsert ke Lokasi.`);
  console.log(`${incomplete} baris dilewati (kode_usul kosong -- TIPE belum diketahui, menunggu data).`);
  if (skipped.length > 0) {
    console.log(`${skipped.length} baris invalid dilewati:`);
    for (const s of skipped) {
      console.log(`  - "${s.kode}": ${s.reason}`);
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
