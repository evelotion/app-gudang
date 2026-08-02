import { describe, it, expect } from "vitest";
import { findLokasiErrors } from "./lokasiValidation";
import type { LokasiRefEntry } from "./mappings";

describe("findLokasiErrors (normalisasi-lokasi.md bagian B.3)", () => {
  it("returns no errors when every row resolves", () => {
    const rows = [
      { lokasiAwal: "KCP-SGK", lokasiTujuan: "KP-ADP" },
      { lokasiAwal: "W1L5-DMR", lokasiTujuan: "ULS-DAR" },
    ];
    expect(findLokasiErrors(rows, new Map())).toEqual([]);
  });

  it("flags unresolved lokasiAwal and lokasiTujuan independently, with 1-based row numbers", () => {
    const rows = [
      { lokasiAwal: "KCP-SGK", lokasiTujuan: "ULS-XYZ" },
      { lokasiAwal: "Cabang Ngasal", lokasiTujuan: "KP-ADP" },
    ];
    expect(findLokasiErrors(rows, new Map())).toEqual([
      'Baris 1: Lokasi Tujuan "ULS-XYZ" tidak dikenal.',
      'Baris 2: Lokasi Awal "Cabang Ngasal" tidak dikenal.',
    ]);
  });

  it("does not require exact match against a Lokasi master table -- resolveLokasi rules are enough", () => {
    // ULS-BGR bukan salah satu dari 26 kode master yang sudah confirmed,
    // tapi tetap valid lewat tabel 84 cabang biasa (bagian 2 langkah 4).
    const rows = [{ lokasiAwal: "ULS-BGR", lokasiTujuan: "KC-SMH" }];
    expect(findLokasiErrors(rows, new Map())).toEqual([]);
  });

  it("an exact LokasiRef entry (bagian A exceptions) makes free-text values valid too", () => {
    const map = new Map<string, LokasiRefEntry>([
      ["KC Samanhudi", { kodeCabang: "003", label: "KC-SMH", initial: "SMH", tipe: "CABANG" }],
    ]);
    const rows = [{ lokasiAwal: "KC Samanhudi", lokasiTujuan: "KP-LOG" }];
    expect(findLokasiErrors(rows, map)).toEqual([]);
  });

  it("collects errors from every row instead of stopping at the first", () => {
    const rows = [
      { lokasiAwal: "Ngasal 1", lokasiTujuan: "KP-ADP" },
      { lokasiAwal: "Ngasal 2", lokasiTujuan: "KP-ADP" },
    ];
    expect(findLokasiErrors(rows, new Map())).toHaveLength(2);
  });
});
