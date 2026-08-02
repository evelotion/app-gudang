import { describe, it, expect } from "vitest";
import { buildKeterangan, MAX_KETERANGAN } from "./keteranganJurnal";

describe("buildKeterangan", () => {
  it("matches the exact 42-character example from the spec", () => {
    const s = buildKeterangan("perolehan", "Komputer", 5, "LOG", "SGK", "M270726-05");
    expect(s).toBe("Mutasi Komputer 5unit LOG>SGK [M270726-05]");
    expect(s?.length).toBe(42);
  });

  it("builds the akm variant with the 'Mutasi Peny.' prefix", () => {
    const s = buildKeterangan("akm", "Komputer", 5, "LOG", "SGK", "M270726-05");
    expect(s).toBe("Mutasi Peny. Komputer 5unit LOG>SGK [M270726-05]");
  });

  it("falls back to dropping the unit count when the full string is too long", () => {
    const s = buildKeterangan(
      "perolehan",
      "Perabot Kantor Golongan Satu",
      12,
      "JATINEGARA",
      "SUNGKONO",
      "M270726-01"
    );
    expect(s).not.toBeNull();
    expect(s!.length).toBeLessThanOrEqual(MAX_KETERANGAN);
    expect(s).not.toContain("unit");
  });

  it("never truncates the [kodeRef] suffix, even under the label-truncation fallback", () => {
    const s = buildKeterangan(
      "akm",
      "Perabot Kantor Golongan Satu Yang Sangat Panjang Sekali",
      12,
      "JATINEGARA",
      "SUNGKONO",
      "M270726-99"
    );
    expect(s).not.toBeNull();
    expect(s!.length).toBeLessThanOrEqual(MAX_KETERANGAN);
    expect(s).toContain("[M270726-99]");
  });

  it("returns null when even an empty label still doesn't fit (guardrail #6)", () => {
    const s = buildKeterangan(
      "perolehan",
      "X",
      1,
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      "B",
      "M270726-01"
    );
    expect(s).toBeNull();
  });
});
