// Skrip usulan lokasi (normalisasi-lokasi.md bagian A.2).
//
// Read-only terhadap DB. TIDAK PERNAH menulis ke LokasiRef — hanya
// menghasilkan CSV untuk direview manusia (bagian A.3). Jalankan dengan:
//   npx tsx scripts/generate-lokasi-suggestions.ts [output.csv]

import * as fs from "fs";
import { prisma } from "../src/lib/prisma";
import {
  resolveLokasi,
  isKnownCabangInitial,
  cabangCodeForInitial,
  type LokasiTipe,
} from "../src/lib/mappings";
import { toCsv } from "./csvUtil";

const KNOWN_TIPE_PREFIX = new Set(["KC", "KCP", "ULS", "KF", "KP"]);

// Kamus kata kunci unit kerja Kantor Pusat. Sengaja minimal — daftar lengkap
// (DMR, ADP, ARP, BRK, dst) menyusul dari user dan tidak memblokir pekerjaan
// ini (bagian 5). Tambahkan entry baru di sini begitu nama unit kerjanya
// dikonfirmasi.
const KP_UNIT_KEYWORDS: Record<string, string> = {
  LOGISTIK: "LOG",
};

interface Suggestion {
  usulKode: string;
  usulLabel: string;
  usulInitial: string;
  usulTipe: LokasiTipe | "";
  keyakinan: "TINGGI" | "SEDANG" | "RENDAH";
  alasan: string;
}

function suggest(raw: string): Suggestion {
  const upper = raw.toUpperCase();
  const tokens = upper.split(/\s+/).filter(Boolean);

  // Pola Wisma dengan spasi, bukan tanda hubung: "W1L5 DMR"
  if (tokens.length === 2 && /^W\d+L\d+$/.test(tokens[0])) {
    const [tipe, initial] = tokens;
    return {
      usulKode: "999",
      usulLabel: `${tipe}-${initial}`,
      usulInitial: initial,
      usulTipe: "WISMA",
      keyakinan: "TINGGI",
      alasan: `Pola Wisma dengan spasi bukan tanda hubung: "${raw}" -> "${tipe}-${initial}"`,
    };
  }

  // TIPE INITIAL dengan spasi, prefix dan initial dikenal
  if (tokens.length === 2 && KNOWN_TIPE_PREFIX.has(tokens[0])) {
    const [tipe, initial] = tokens;
    if (tipe === "KP") {
      return {
        usulKode: "999",
        usulLabel: `KP-${initial}`,
        usulInitial: initial,
        usulTipe: "KANTOR_PUSAT",
        keyakinan: "TINGGI",
        alasan: `KP dengan spasi bukan tanda hubung: "${raw}" -> "KP-${initial}"`,
      };
    }
    if (isKnownCabangInitial(initial)) {
      return {
        usulKode: cabangCodeForInitial(initial)!,
        usulLabel: `${tipe}-${initial}`,
        usulInitial: initial,
        usulTipe: "CABANG",
        keyakinan: "TINGGI",
        alasan: `Beda separator dari pola dikenal: "${raw}" -> "${tipe}-${initial}"`,
      };
    }
  }

  // Mengandung token yang cocok initial dikenal, tapi struktur menyimpang
  // (jumlah token != 2, kata terduplikasi, dst) -> SEDANG.
  const knownInitialToken = tokens.find((t) => t.length === 3 && isKnownCabangInitial(t));
  if (knownInitialToken) {
    return {
      usulKode: cabangCodeForInitial(knownInitialToken)!,
      usulLabel: `?-${knownInitialToken}`,
      usulInitial: knownInitialToken,
      usulTipe: "CABANG",
      keyakinan: "SEDANG",
      alasan: `Mengandung initial dikenal "${knownInitialToken}" tapi bukan pola TIPE-INITIAL bersih: "${raw}" — cek TIPE-nya manual`,
    };
  }

  // Kata kunci unit kerja KP dikenal, muncul di mana saja dalam teks.
  for (const [keyword, abbr] of Object.entries(KP_UNIT_KEYWORDS)) {
    if (upper.includes(keyword)) {
      return {
        usulKode: "999",
        usulLabel: `KP-${abbr}`,
        usulInitial: abbr,
        usulTipe: "KANTOR_PUSAT",
        keyakinan: "SEDANG",
        alasan: `Mengandung kata kunci unit kerja KP "${keyword}": "${raw}"`,
      };
    }
  }

  return {
    usulKode: "",
    usulLabel: "",
    usulInitial: "",
    usulTipe: "",
    keyakinan: "RENDAH",
    alasan: `Kemungkinan nama cabang/lokasi, bukan initial — butuh tabel nama cabang atau pengetahuan manual untuk mapping yang benar: "${raw}"`,
  };
}

async function main() {
  const outPath = process.argv[2] ?? "scripts/lokasi-suggestions.csv";

  const rows = await prisma.mutasiAset.findMany({
    select: { lokasiAwal: true, lokasiTujuan: true, nomorRegisterAset: true },
  });

  const stats = new Map<string, { count: number; contoh: string }>();
  for (const r of rows) {
    for (const raw of [r.lokasiAwal, r.lokasiTujuan]) {
      const trimmed = raw.trim();
      const existing = stats.get(trimmed);
      if (existing) {
        existing.count += 1;
      } else {
        stats.set(trimmed, { count: 1, contoh: r.nomorRegisterAset });
      }
    }
  }

  const unresolved = [...stats.entries()]
    .filter(([raw]) => resolveLokasi(raw) === null)
    .sort((a, b) => a[0].localeCompare(b[0]));

  const header = [
    "raw",
    "jumlah_baris",
    "contoh_register",
    "usul_kode",
    "usul_label",
    "usul_initial",
    "usul_tipe",
    "keyakinan",
    "alasan",
  ];

  const csvRows = unresolved.map(([raw, info]) => {
    const s = suggest(raw);
    return [
      raw,
      String(info.count),
      info.contoh,
      s.usulKode,
      s.usulLabel,
      s.usulInitial,
      s.usulTipe,
      s.keyakinan,
      s.alasan,
    ];
  });

  fs.writeFileSync(outPath, toCsv(header, csvRows), "utf-8");

  console.log(`${unresolved.length} nilai lokasi belum ter-resolve, ditulis ke ${outPath}`);
  const byKeyakinan = { TINGGI: 0, SEDANG: 0, RENDAH: 0 };
  for (const [raw] of unresolved) byKeyakinan[suggest(raw).keyakinan] += 1;
  console.log(`  TINGGI: ${byKeyakinan.TINGGI}, SEDANG: ${byKeyakinan.SEDANG}, RENDAH: ${byKeyakinan.RENDAH}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
