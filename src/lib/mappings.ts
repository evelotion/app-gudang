// src/lib/mappings.ts
//
// Tabel golongan & cabang untuk export jurnal mutasi aset.
// Sumber: audit-export-jurnal.md v3, bagian 3.2 (golongan) dan 7.2 (cabang).
// Ini daftar eksplisit, bukan fuzzy match — golongan/cabang yang tidak ada di
// sini harus hard error, jangan ditebak atau diberi default.

export interface GolonganEntry {
  nomorGolongan: number;
  kanonik: string;
  akunPerolehan: string;
  akunAkm: string | null;
  labelPendek: string;
  /**
   * Label akun akm penyusutan pada baris referensi akun (5.5), kalau beda
   * dari `Akm Peny - {kanonik}`. Contoh: golongan Komputer memakai akun
   * "Perangkat Keras/Lunak Komputer" tapi label akm-nya "Komputer Gol I"
   * (bagian 2.2 dokumen audit), bukan "Komputer".
   */
  labelAkm?: string;
}

/**
 * Golongan non-inventaris tidak pernah masuk Sheet `data` (jurnal) — hanya
 * masuk Lampiran (bagian 4.4). Diekspor supaya exportJournal.ts tidak perlu
 * duplikasi string literal.
 */
export const NON_INVENTARIS_KANONIK = "Aset Non-Inventaris";

/**
 * Normalisasi key golongan: uppercase, trim, ganti -/. jadi spasi, rapatkan
 * spasi ganda. Bagian 3.1.
 */
export function normalizeGolonganKey(raw: string): string {
  return String(raw ?? "")
    .toUpperCase()
    .trim()
    .replace(/[-/.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Golongan non-inventaris punya akunPerolehan (6551206) yang merupakan akun
 * BEBAN, bukan aset, dan tidak pernah dipakai di export (lihat 3.2 catatan
 * kaki). Golongan ini juga tidak punya akun akm karena tidak dikapitalisasi.
 */
const GOLONGAN_TABLE: Record<string, GolonganEntry> = {
  "ASET NON INVENTARIS": {
    nomorGolongan: 900,
    kanonik: NON_INVENTARIS_KANONIK,
    akunPerolehan: "6551206",
    akunAkm: null,
    labelPendek: "Non-Inventaris",
  },
  "NON INVENTARIS": {
    nomorGolongan: 900,
    kanonik: NON_INVENTARIS_KANONIK,
    akunPerolehan: "6551206",
    akunAkm: null,
    labelPendek: "Non-Inventaris",
  },
  "KOMPUTER": {
    nomorGolongan: 500,
    kanonik: "Komputer",
    akunPerolehan: "1311304",
    akunAkm: "1312304",
    labelPendek: "Komputer",
    labelAkm: "Komputer Gol I",
  },
  "ALAT TELEKOMUNIKASI": {
    nomorGolongan: 440,
    kanonik: "Alat Komunikasi",
    akunPerolehan: "1311304",
    akunAkm: "1312304",
    labelPendek: "Alat Komsi",
  },
  "MESIN KANTOR": {
    nomorGolongan: 400,
    kanonik: "Mesin Gol I",
    akunPerolehan: "1311302",
    akunAkm: "1312302",
    labelPendek: "Mesin I",
  },
  "MESIN GOL I": {
    nomorGolongan: 400,
    kanonik: "Mesin Gol I",
    akunPerolehan: "1311302",
    akunAkm: "1312302",
    labelPendek: "Mesin I",
  },
  "PERABOT GOL I": {
    nomorGolongan: 301,
    kanonik: "Perabot Gol I",
    akunPerolehan: "1311303",
    akunAkm: "1312303",
    labelPendek: "Perabot I",
  },
  "PERABOT KANTOR GOL I": {
    nomorGolongan: 301,
    kanonik: "Perabot Gol I",
    akunPerolehan: "1311303",
    akunAkm: "1312303",
    labelPendek: "Perabot I",
  },
  "PERABOT KANTOR": {
    nomorGolongan: 301,
    kanonik: "Perabot Gol I",
    akunPerolehan: "1311303",
    akunAkm: "1312303",
    labelPendek: "Perabot I",
  },
  "PERABOT GOL II": {
    nomorGolongan: 311,
    kanonik: "Perabot Gol II",
    akunPerolehan: "1311403",
    akunAkm: "1312403",
    labelPendek: "Perabot II",
  },
  // "ALAT PERLENGKAPAN LAINNYA" (gol 460) SENGAJA tidak ada di sini — gap
  // yang belum terkonfirmasi (lihat bagian 3.3 dokumen audit). Baris dengan
  // golongan ini harus hard error, bukan ditebak.
};

export function lookupGolongan(raw: string): GolonganEntry | null {
  const key = normalizeGolonganKey(raw);
  return GOLONGAN_TABLE[key] ?? null;
}

export interface CabangInfo {
  code: string;
  abbr: string;
}

/**
 * Kode cabang 3 digit per initial (bukan per nama cabang lengkap). Sumber:
 * bagian 7.2. 039 (KF BUR Cibinong) dan 045 (KF BUR Cikarang Utara) SENGAJA
 * tidak ada di sini — keduanya tidak punya initial, jadi harus error kalau
 * ketemu.
 */
const CABANG_INITIAL_MAP: Record<string, string> = {
  JTG: "001", MGD: "002", SMH: "003", STR: "004", DHA: "005", KNR: "006",
  BKS: "007", KLG: "008", TNA: "009", DEP: "010", DAR: "011", PDI: "012",
  TGR: "013", BGR: "014", VET: "015", SDA: "016", PSM: "017", CMS: "018",
  TPK: "019", KKP: "020", PDC: "021", SPG: "022", MLW: "023", GDP: "024",
  KMM: "025", MKJ: "026", MAB: "027", MCL: "028", PER: "029", SMG: "030",
  JDB: "031", GDG: "032", GSI: "033", MJP: "034", BDG: "035", PPI: "036",
  SLO: "037", MPG: "038", MCS: "040", MTG: "041", MCP: "042", MDP: "043",
  MCI: "044", YOG: "046", PLK: "047", SSR: "048", DAG: "049", MDN: "050",
  BTU: "051", PLG: "052", MLG: "053", KBP: "054", SDY: "055", KDS: "056",
  PMS: "057", PDA: "058", BBT: "059", SGN: "060", SRA: "061", MJK: "062",
  KPJ: "063", ARV: "064", BTR: "065", BDL: "066", BDA: "067", KDR: "068",
  SBU: "069", PSR: "070", PNK: "071", LSW: "072", BIR: "073", TPI: "074",
  SDP: "075", BWI: "076", CMH: "077", SGK: "078", MTO: "079", ARC: "080",
  CRB: "081", PDG: "082", SCI: "083",
};

/**
 * Pecah lokasi jadi { tipe, initial } sesuai pola TIPE-INITIAL (mis.
 * "KP-LOG", "ULS-BGR", "W2L7-LOG"). Harus persis satu tanda hubung dengan
 * kedua sisi terisi — kalau tidak, ini lokasi free-text di luar cakupan
 * Fase 1 (bagian 7.3).
 */
export function splitLokasi(lokasi: string): { tipe: string; initial: string } | null {
  const s = String(lokasi ?? "").trim();
  const parts = s.split("-");
  if (parts.length !== 2) return null;
  const tipe = parts[0].trim();
  const initial = parts[1].trim();
  if (!tipe || !initial) return null;
  return { tipe, initial: initial.toUpperCase() };
}

/**
 * Lookup kode cabang. Aturan bagian 7.1:
 * 1. Pecah TIPE-INITIAL.
 * 2. initial === LOG -> 999 (Logistik, departemen KP, bukan cabang).
 * 3. tipe === KP -> 999 (suffix adalah nama divisi, bukan cabang).
 * 4. Selain itu, lookup initial di tabel.
 * 5. Tidak ketemu -> null. Jangan pernah pakai default diam-diam.
 */
export function lookupCabang(lokasi: string): CabangInfo | null {
  const split = splitLokasi(lokasi);
  if (!split) return null;

  const { tipe, initial } = split;

  if (initial === "LOG") {
    return { code: "999", abbr: "LOG" };
  }
  if (tipe.toUpperCase() === "KP") {
    return { code: "999", abbr: initial };
  }

  const code = CABANG_INITIAL_MAP[initial];
  if (!code) return null;
  return { code, abbr: initial };
}

/**
 * `initial` di sini harus ada di tabel 84 cabang (dipakai A.4 seed validation).
 */
export function isKnownCabangInitial(initial: string): boolean {
  return Object.prototype.hasOwnProperty.call(CABANG_INITIAL_MAP, initial.toUpperCase());
}

/** Kode cabang 3 digit untuk initial dikenal, atau null. Dipakai skrip A.2. */
export function cabangCodeForInitial(initial: string): string | null {
  return CABANG_INITIAL_MAP[initial.toUpperCase()] ?? null;
}

// ==========================================
// RESOLUSI LOKASI (normalisasi-lokasi.md bagian 2)
// ==========================================

export type LokasiTipe = "CABANG" | "KANTOR_PUSAT" | "WISMA";

export interface LokasiRefEntry {
  kodeCabang: string;
  label: string;
  initial: string;
  tipe: LokasiTipe;
}

export interface LokasiInfo extends CabangInfo {
  label: string;
  tipe: LokasiTipe;
}

/**
 * Prefix Wisma: `W{n}L{n}-UNITKERJA` (mis. "W1L5-DMR", "W10L12-XYZ"). Lokasi
 * fisik di lingkungan Kantor Pusat -> selalu kode 999 (bagian 1.3).
 */
const WISMA_PREFIX_RE = /^W\d+L\d+-/i;

/**
 * Resolusi lokasi lengkap, urutan persis bagian 2 dokumen:
 * 1. Exact match di `lokasiRefMap` (tabel pengecualian hasil review manusia)
 * 2. Prefix Wisma -> 999, tipe WISMA
 * 3-5. Delegasi ke `lookupCabang` yang sudah ada (KP-x dan x-LOG -> 999,
 *      tabel 84 cabang, selain itu null) — perilakunya tidak diubah.
 *
 * Pure: tidak menyentuh Prisma. `lokasiRefMap` kosong secara default supaya
 * pemanggil lama (tanpa tabel pengecualian) tetap dapat perilaku steps 2-5.
 */
export function resolveLokasi(
  rawLokasi: string,
  lokasiRefMap: Map<string, LokasiRefEntry> = new Map()
): LokasiInfo | null {
  const raw = String(rawLokasi ?? "").trim();

  const ref = lokasiRefMap.get(raw);
  if (ref) {
    return { code: ref.kodeCabang, abbr: ref.initial, label: ref.label, tipe: ref.tipe };
  }

  if (WISMA_PREFIX_RE.test(raw)) {
    const hyphenIdx = raw.indexOf("-");
    const initial = raw.slice(hyphenIdx + 1).trim().toUpperCase();
    return { code: "999", abbr: initial || raw, label: raw, tipe: "WISMA" };
  }

  const cabang = lookupCabang(raw);
  if (!cabang) return null;
  return {
    code: cabang.code,
    abbr: cabang.abbr,
    label: raw,
    tipe: cabang.code === "999" ? "KANTOR_PUSAT" : "CABANG",
  };
}
