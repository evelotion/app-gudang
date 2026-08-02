// Skrip usulan tabel master Lokasi (normalisasi-lokasi.md bagian B.1).
//
// Read-only terhadap DB. TIDAK PERNAH menulis ke Lokasi — hanya menghasilkan
// CSV. Jalankan dengan:
//   npx tsx scripts/generate-lokasi-master-suggestions.ts [output.csv]
//
// Kenapa tidak sekadar dump 84 initial dari CABANG_INITIAL_MAP: tabel itu
// cuma initial -> kodeCabang, tidak tahu prefix TIPE (KC/KCP/ULS) per cabang
// -- lookupCabang() sengaja mengabaikan TIPE (initial-lah yang menentukan
// kodeCabang). Skrip ini menurunkan TIPE kanonik dari histori MutasiAset:
// kalau satu initial cuma pernah dipakai dengan satu TIPE dalam format bersih
// (bukan free-text), itu bukan tebakan -- itu nilai yang sudah dipercaya
// export selama ini. Initial tanpa histori bersih dilewatkan dengan
// keyakinan RENDAH dan kode_usul kosong; jangan ditebak (bagian 0).

import * as fs from "fs";
import { prisma } from "../src/lib/prisma";
import {
  splitLokasi,
  isKnownCabangInitial,
  cabangCodeForInitial,
  allKnownCabangInitials,
} from "../src/lib/mappings";
import { toCsv } from "./csvUtil";

const WISMA_PREFIX_RE = /^W\d+L\d+-/i;

interface Row {
  kodeUsul: string;
  kodeCabang: string;
  namaUsul: string;
  initial: string;
  tipe: "CABANG" | "KANTOR_PUSAT" | "WISMA";
  jumlahKemunculan: number;
  keyakinan: "TINGGI" | "RENDAH";
  alasan: string;
}

async function main() {
  const outPath = process.argv[2] ?? "scripts/lokasi-master-suggestions.csv";

  const rows = await prisma.mutasiAset.findMany({
    select: { lokasiAwal: true, lokasiTujuan: true },
  });

  const rawCount = new Map<string, number>();
  for (const r of rows) {
    for (const raw of [r.lokasiAwal.trim(), r.lokasiTujuan.trim()]) {
      rawCount.set(raw, (rawCount.get(raw) ?? 0) + 1);
    }
  }

  // initial -> tipe -> jumlah kemunculan (khusus CABANG, dari pola bersih)
  const cabangTipeCount = new Map<string, Map<string, number>>();
  // "KP-XXX" (uppercased) -> jumlah kemunculan
  const kpCount = new Map<string, number>();
  // "W..L..-XXX" (bentuk asli, sudah persis satu varian per lokasi wisma
  // yang teramati) -> jumlah kemunculan
  const wismaCount = new Map<string, number>();

  for (const [raw, count] of rawCount) {
    if (WISMA_PREFIX_RE.test(raw)) {
      wismaCount.set(raw, (wismaCount.get(raw) ?? 0) + count);
      continue;
    }
    const split = splitLokasi(raw);
    if (!split) continue; // free-text, sudah ditangani LokasiRef (bagian A)
    const { tipe, initial } = split;
    if (tipe.toUpperCase() === "KP") {
      const kode = `KP-${initial}`;
      kpCount.set(kode, (kpCount.get(kode) ?? 0) + count);
      continue;
    }
    if (initial === "LOG") continue; // kasus khusus KP, bukan cabang
    if (!isKnownCabangInitial(initial)) continue;
    if (!cabangTipeCount.has(initial)) cabangTipeCount.set(initial, new Map());
    const m = cabangTipeCount.get(initial)!;
    m.set(tipe.toUpperCase(), (m.get(tipe.toUpperCase()) ?? 0) + count);
  }

  const out: Row[] = [];

  // --- CABANG: seluruh 84 initial dikenal, bukan hanya yang ada histori ---
  // Termasuk initial dari tabel 84 cabang yang belum tersentuh histori,
  // supaya masuk laporan (dan kelihatan jelas belum lengkap), bukan cuma
  // diam-diam hilang dari CSV.
  const allInitials = new Set<string>(allKnownCabangInitials());
  for (const initial of cabangTipeCount.keys()) allInitials.add(initial);

  for (const initial of [...allInitials].sort()) {
    const kodeCabang = cabangCodeForInitial(initial)!;
    const tipes = cabangTipeCount.get(initial);
    if (tipes && tipes.size === 1) {
      const [tipe, jumlah] = [...tipes.entries()][0];
      out.push({
        kodeUsul: `${tipe}-${initial}`,
        kodeCabang,
        namaUsul: `${tipe}-${initial}`,
        initial,
        tipe: "CABANG",
        jumlahKemunculan: jumlah,
        keyakinan: "TINGGI",
        alasan: `Satu-satunya TIPE di histori bersih (${jumlah}x kemunculan)`,
      });
    } else if (tipes && tipes.size > 1) {
      out.push({
        kodeUsul: "",
        kodeCabang,
        namaUsul: "",
        initial,
        tipe: "CABANG",
        jumlahKemunculan: [...tipes.values()].reduce((a, b) => a + b, 0),
        keyakinan: "RENDAH",
        alasan: `AMBIGU: >1 TIPE ditemukan di histori (${[...tipes.entries()].map(([t, c]) => `${t}=${c}x`).join(", ")}) — putuskan manual`,
      });
    } else {
      out.push({
        kodeUsul: "",
        kodeCabang,
        namaUsul: "",
        initial,
        tipe: "CABANG",
        jumlahKemunculan: 0,
        keyakinan: "RENDAH",
        alasan: "Tidak ada histori TIPE-INITIAL bersih untuk initial ini — TIPE (KC/KCP/ULS) belum diketahui, tunggu kode_cabang.xlsx",
      });
    }
  }

  // --- KANTOR_PUSAT ---
  for (const [kode, jumlah] of [...kpCount.entries()].sort()) {
    const initial = kode.slice(3);
    out.push({
      kodeUsul: kode,
      kodeCabang: "999",
      namaUsul: kode,
      initial,
      tipe: "KANTOR_PUSAT",
      jumlahKemunculan: jumlah,
      keyakinan: "TINGGI",
      alasan: `Ditemukan di histori (${jumlah}x kemunculan); nama unit kerja lengkap belum ada, pakai kode sementara`,
    });
  }

  // --- WISMA ---
  for (const [raw, jumlah] of [...wismaCount.entries()].sort()) {
    const hyphenIdx = raw.indexOf("-");
    const initial = raw.slice(hyphenIdx + 1).trim().toUpperCase();
    out.push({
      kodeUsul: raw,
      kodeCabang: "999",
      namaUsul: raw,
      initial,
      tipe: "WISMA",
      jumlahKemunculan: jumlah,
      keyakinan: "TINGGI",
      alasan: `Ditemukan di histori (${jumlah}x kemunculan); label deskriptif belum ada, pakai kode sementara`,
    });
  }

  const header = [
    "kode_usul",
    "kodeCabang",
    "nama_usul",
    "initial",
    "tipe",
    "jumlah_kemunculan",
    "keyakinan",
    "alasan",
  ];
  const csvRows = out.map((r) => [
    r.kodeUsul,
    r.kodeCabang,
    r.namaUsul,
    r.initial,
    r.tipe,
    String(r.jumlahKemunculan),
    r.keyakinan,
    r.alasan,
  ]);

  fs.writeFileSync(outPath, toCsv(header, csvRows), "utf-8");

  const tinggi = out.filter((r) => r.keyakinan === "TINGGI").length;
  const rendah = out.filter((r) => r.keyakinan === "RENDAH").length;
  console.log(`${out.length} baris ditulis ke ${outPath} (TINGGI: ${tinggi}, RENDAH/belum diketahui: ${rendah})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
