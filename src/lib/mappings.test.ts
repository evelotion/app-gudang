import { describe, it, expect } from "vitest";
import { lookupGolongan, lookupCabang, normalizeGolonganKey, splitLokasi } from "./mappings";

describe("normalizeGolonganKey", () => {
  it("uppercases, trims, and collapses spaces", () => {
    expect(normalizeGolonganKey("  komputer  ")).toBe("KOMPUTER");
  });

  it("replaces -, /, . with spaces", () => {
    expect(normalizeGolonganKey("Aset Non-Inventaris")).toBe("ASET NON INVENTARIS");
    expect(normalizeGolonganKey("Aset Non/Inventaris")).toBe("ASET NON INVENTARIS");
    expect(normalizeGolonganKey("PERABOT KANTOR GOL. I")).toBe("PERABOT KANTOR GOL I");
  });
});

describe("lookupGolongan", () => {
  it("resolves known variants to the same canonical entry", () => {
    const a = lookupGolongan("Komputer");
    const b = lookupGolongan("KOMPUTER");
    expect(a).not.toBeNull();
    expect(a?.kanonik).toBe("Komputer");
    expect(b?.kanonik).toBe(a?.kanonik);
  });

  it("resolves Aset Non-Inventaris variants", () => {
    expect(lookupGolongan("Aset Non-Inventaris")?.kanonik).toBe("Aset Non-Inventaris");
    expect(lookupGolongan("Aset Non/Inventaris")?.kanonik).toBe("Aset Non-Inventaris");
    expect(lookupGolongan("NON INVENTARIS")?.kanonik).toBe("Aset Non-Inventaris");
  });

  it("returns null for the unresolved gap golongan (Alat Perlengkapan Lainnya)", () => {
    expect(lookupGolongan("Alat Perlengkapan Lainnya")).toBeNull();
  });

  it("returns null for a completely unknown golongan", () => {
    expect(lookupGolongan("Kendaraan Dinas")).toBeNull();
  });
});

describe("splitLokasi", () => {
  it("splits TIPE-INITIAL", () => {
    expect(splitLokasi("KP-LOG")).toEqual({ tipe: "KP", initial: "LOG" });
    expect(splitLokasi("W2L7-LOG")).toEqual({ tipe: "W2L7", initial: "LOG" });
  });

  it("returns null for free-text without exactly one hyphen", () => {
    expect(splitLokasi("Departemen Logistik")).toBeNull();
    expect(splitLokasi("KC Samanhudi")).toBeNull();
  });

  it("still parses a single-hyphen free-text string (rejection happens later, at lookupCabang)", () => {
    // "ULS -ULS Padang" has exactly one hyphen, so the TIPE-INITIAL pattern
    // technically matches — it's lookupCabang that rejects "ULS PADANG" as
    // an unknown initial. This is the spec's own example (bagian 1.5) and
    // it must surface as "Lokasi tidak dikenal", not "Format lokasi tidak
    // dikenal".
    expect(splitLokasi("ULS -ULS Padang")).toEqual({ tipe: "ULS", initial: "ULS PADANG" });
  });
});

describe("lookupCabang", () => {
  it("routes any *-LOG location to 999 (Logistik, bukan cabang)", () => {
    expect(lookupCabang("KP-LOG")).toEqual({ code: "999", abbr: "LOG" });
    expect(lookupCabang("W2L7-LOG")).toEqual({ code: "999", abbr: "LOG" });
  });

  it("routes KP-* (division suffix) to 999", () => {
    expect(lookupCabang("KP-ADP")).toEqual({ code: "999", abbr: "ADP" });
  });

  it("looks up known initials", () => {
    expect(lookupCabang("ULS-BGR")).toEqual({ code: "014", abbr: "BGR" });
    expect(lookupCabang("ULS-DAR")).toEqual({ code: "011", abbr: "DAR" });
    expect(lookupCabang("KC-DHA")).toEqual({ code: "005", abbr: "DHA" });
    expect(lookupCabang("ULS-SCI")).toEqual({ code: "083", abbr: "SCI" }); // bukan 084 seperti di acuan
  });

  it("returns null for unknown initials, including 039/045 which have none", () => {
    expect(lookupCabang("ULS-XYZ")).toBeNull();
    expect(lookupCabang("KF-CIB")).toBeNull();
    expect(lookupCabang("KF-CKR")).toBeNull();
  });

  it("returns null for free-text out of the TIPE-INITIAL pattern", () => {
    expect(lookupCabang("ULS -ULS Padang")).toBeNull();
  });
});
