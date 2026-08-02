// src/lib/keteranganJurnal.ts
//
// Membangun kolom Keterangan sheet `data` (jurnal). Aturan bagian 5.4:
//   Perolehan : Mutasi {labelPendek} {n}unit {ASAL}>{TUJUAN} [{kodeRef}]
//   Akm       : Mutasi Peny. {labelPendek} {n}unit {ASAL}>{TUJUAN} [{kodeRef}]
// MAX_KETERANGAN = 50. Fallback kalau lebih:
//   1. buang ` {n}unit`
//   2. potong labelPendek dari kanan
//   3. kode [kodeRef] tidak pernah dipotong
// Kalau masih kepanjangan setelah kedua fallback, ini tidak bisa dibangun
// (caller wajib memperlakukannya sebagai hard error, bagian 8 guardrail #6).

export const MAX_KETERANGAN = 50;

export type KeteranganKind = "perolehan" | "akm";

export function buildKeterangan(
  kind: KeteranganKind,
  labelPendek: string,
  n: number,
  asalInitial: string,
  tujuanInitial: string,
  kodeRef: string
): string | null {
  const prefix = kind === "perolehan" ? "Mutasi" : "Mutasi Peny.";
  const kodeSuffix = `[${kodeRef}]`;

  const assembleWithUnit = (label: string) =>
    `${prefix} ${label} ${n}unit ${asalInitial}>${tujuanInitial} ${kodeSuffix}`;
  const assemble = (label: string) =>
    `${prefix} ${label} ${asalInitial}>${tujuanInitial} ${kodeSuffix}`;

  const attempt1 = assembleWithUnit(labelPendek);
  if (attempt1.length <= MAX_KETERANGAN) return attempt1;

  const attempt2 = assemble(labelPendek);
  if (attempt2.length <= MAX_KETERANGAN) return attempt2;

  const overhead = assemble("").length;
  const budget = MAX_KETERANGAN - overhead;
  if (budget < 0) return null;

  const truncatedLabel = labelPendek.slice(0, budget);
  const attempt3 = assemble(truncatedLabel);
  return attempt3.length <= MAX_KETERANGAN ? attempt3 : null;
}
