/**
 * Util tanggal terpusat untuk modul aset.
 *
 * Aturan main:
 * - Semua tanggal disimpan sebagai UTC midnight (Date.UTC), jadi tidak pernah
 *   geser sehari gara-gara timezone browser/server.
 * - Semua pembacaan balik pakai getUTC*() atau Intl dengan timeZone "UTC".
 * - Parsing DD/MM/YYYY bersifat STRICT. Kalau tidak cocok -> null, bukan
 *   Invalid Date yang diam-diam lolos ke database.
 */

export function parseTanggalID(input: string | null | undefined): Date | null {
  if (!input) return null;
  const s = String(input).replace(/ /g, " ").trim();
  const m = s.match(/^(\d{1,2})[/](\d{1,2})[/](\d{4})$/);
  if (!m) return null;

  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const d = new Date(Date.UTC(year, month - 1, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    return null;
  }
  return d;
}

export function parseTanggalInput(input: string | null | undefined): Date | null {
  if (!input) return null;
  const m = String(input).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

export function toDDMMYYYY(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getUTCFullYear()}`;
}

export function formatTanggalDisplay(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "Tanggal invalid";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/**
 * Pecah isi textarea jadi baris, TANPA membuang baris kosong di tengah.
 * Baris kosong di ujung tetap dibuang karena itu cuma sisa enter.
 */
export function splitBaris(str: string | null | undefined): string[] {
  if (!str) return [];
  const rows = String(str)
    .replace(/\r/g, "")
    .split("\n")
    .map((s) => s.trim());
  while (rows.length > 0 && rows[rows.length - 1] === "") rows.pop();
  return rows;
}

/**
 * Ambil nilai kolom untuk baris ke-i.
 * Kalau kolom cuma diisi 1 baris, di-broadcast ke semua baris.
 * Kalau kolom diisi banyak baris, TIDAK ada fallback ke baris pertama.
 */
export function ambilSel(kolom: string[], i: number): string {
  if (kolom.length === 1) return kolom[0];
  return kolom[i] ?? "";
}
