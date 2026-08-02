// Skrip seed Lokasi tipe CABANG dari scripts/lokasi-master-cabang.csv (hasil
// generate-lokasi-master.ts, diturunkan dari kode_cabang.xlsx -- normalisasi-
// lokasi.md bagian B.1, follow-up setelah data cabang lengkap tersedia).
//
// Menggantikan pendekatan lama (seed-lokasi-master.ts + histori MutasiAset,
// yang cuma dapat 13/84 cabang dan sempat salah satu -- MCL kepetakan ULS
// padahal master bilang KCP). kode_cabang.xlsx sekarang satu-satunya sumber
// kebenaran untuk CABANG: skrip ini MENGGANTI SELURUH baris Lokasi tipe
// CABANG (hapus lalu insert ulang), bukan upsert per baris -- supaya kode
// yang sudah terbukti salah (mis. ULS-MCL) tidak nyangkut berdampingan
// dengan kode yang benar (KCP-MCL). Baris tipe KANTOR_PUSAT dan WISMA TIDAK
// disentuh.
//
// Baris aktif=FALSE (kode_usul kosong di CSV -- initial tidak ada atau
// prefix non-standar) tetap di-insert sebagai placeholder aktif=false, TIDAK
// dilewati, supaya cabang itu tercatat "ada tapi belum bisa dipakai" bukan
// hilang diam-diam. Karena tidak ada kode TIPE-INITIAL untuk baris ini,
// `kode` fallback ke NO (mis. "039") -- unik, jelas bukan kode asli.
//
// Jalankan dengan:
//   npx tsx scripts/seed-lokasi-master-cabang.ts [input.csv]

import * as fs from "fs";
import { prisma } from "../src/lib/prisma";
import { parseCsvRecords } from "./csvUtil";

async function main() {
  const inPath = process.argv[2] ?? "scripts/lokasi-master-cabang.csv";
  const text = fs.readFileSync(inPath, "utf-8");
  const records = parseCsvRecords(text);

  const toInsert = records.map((rec) => {
    const no = (rec.no ?? "").trim();
    const kodeUsul = (rec.kode_usul ?? "").trim();
    const namaCabang = (rec.nama_cabang ?? "").trim();
    const initial = (rec.initial ?? "").trim().toUpperCase();
    const aktif = (rec.aktif ?? "").trim().toUpperCase() === "TRUE";

    if (!/^\d{3}$/.test(no)) {
      throw new Error(`kolom "no" tidak 3 digit: "${no}" (baris "${namaCabang}")`);
    }

    return {
      kode: kodeUsul || no, // fallback ke NO kalau tidak ada kode TIPE-INITIAL (placeholder non-aktif)
      kodeCabang: no,
      nama: namaCabang,
      initial,
      tipe: "CABANG" as const,
      aktif,
    };
  });

  const aktifCount = toInsert.filter((r) => r.aktif).length;
  const nonAktifCount = toInsert.length - aktifCount;

  await prisma.$transaction(async (tx) => {
    const deleted = await tx.lokasi.deleteMany({ where: { tipe: "CABANG" } });
    console.log(`${deleted.count} baris Lokasi tipe CABANG lama dihapus.`);

    for (const row of toInsert) {
      await tx.lokasi.create({ data: row });
    }
  });

  console.log(`${toInsert.length} baris Lokasi CABANG baru di-insert (aktif: ${aktifCount}, non-aktif: ${nonAktifCount}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
