import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { buildJurnalExport, ExportJurnalError, type MutasiAsetRow } from "./exportJournal";

function row(overrides: Partial<MutasiAsetRow>): MutasiAsetRow {
  return {
    nomorRegisterAset: "500/001/00001/2026",
    namaAset: "PC Test",
    golonganAset: "Komputer",
    jumlah: 1,
    tanggalInput: new Date(Date.UTC(2026, 6, 27)),
    tanggalMutasi: new Date(Date.UTC(2026, 6, 27)),
    tanggalPerolehan: new Date(Date.UTC(2025, 0, 1)),
    hargaPerolehan: 1_000_000,
    akmPenyusutan: 100_000,
    lokasiAwal: "KP-LOG",
    lokasiTujuan: "KCP-SGK",
    alasanMutasi: "Rotasi",
    operatorName: "Budi",
    ...overrides,
  };
}

function readSheets(buffer: Buffer) {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const asAoa = (name: string) =>
    XLSX.utils.sheet_to_json<any[]>(wb.Sheets[name], { header: 1, defval: "" });
  return { data: asAoa("data"), referensi: asAoa("referensi"), sheet3: asAoa("Sheet3") };
}

describe("buildJurnalExport — happy path", () => {
  const rows: MutasiAsetRow[] = [
    // Grup 1: Komputer, KP-LOG -> KCP-SGK
    row({ nomorRegisterAset: "500/001/00001/2026", lokasiAwal: "KP-LOG", lokasiTujuan: "KCP-SGK" }),
    // Grup 2: Komputer, ULS-BGR -> KCP-SGK (lokasiTujuan sama, lokasiAwal beda -> sort setelah grup 1)
    row({ nomorRegisterAset: "500/002/00002/2026", lokasiAwal: "ULS-BGR", lokasiTujuan: "KCP-SGK" }),
    // Grup 3: Aset Non-Inventaris — masuk Lampiran, TIDAK masuk sheet data
    row({
      nomorRegisterAset: "900/001/00003/2026",
      golonganAset: "Aset Non-Inventaris",
      lokasiAwal: "KP-LOG",
      lokasiTujuan: "KCP-SGK",
      hargaPerolehan: 50_000,
      akmPenyusutan: 0,
    }),
  ];

  it("produces a real OLE2/BIFF8 .xls buffer", () => {
    const { buffer, fileName } = buildJurnalExport(rows, {
      operatorName: "Session User",
      tanggalMutasi: new Date(Date.UTC(2026, 6, 27)),
    });
    expect(buffer.subarray(0, 8).toString("hex")).toBe("d0cf11e0a1b11ae1");
    expect(fileName).toBe("Jurnal_Mutasi_27072026.xls");
  });

  it("sorts groups deterministically: kanonik A→Z, then lokasiTujuan, then lokasiAwal", () => {
    const { buffer } = buildJurnalExport(rows, {
      operatorName: "Session User",
      tanggalMutasi: new Date(Date.UTC(2026, 6, 27)),
    });
    const { sheet3 } = readSheets(buffer);
    // Header di baris 0. Golongan kanonik "Aset Non-Inventaris" < "Komputer" alfabetis,
    // jadi grup non-inventaris muncul duluan di Lampiran.
    expect(sheet3[1][5]).toBe("Aset Non-Inventaris");
    // Di antara dua grup Komputer dengan lokasiTujuan sama, KP-LOG (lokasiAwal) < ULS-BGR.
    const golonganCol = sheet3.map((r) => r[5]);
    const firstKomputerRowIdx = golonganCol.findIndex((v) => v === "Komputer");
    expect(sheet3[firstKomputerRowIdx][10]).toBe("KP-LOG"); // Lokasi Awal
  });

  it("excludes Aset Non-Inventaris from sheet `data` but includes it in Sheet3", () => {
    const { buffer } = buildJurnalExport(rows, {
      operatorName: "Session User",
      tanggalMutasi: new Date(Date.UTC(2026, 6, 27)),
    });
    const { data, sheet3 } = readSheets(buffer);
    const dataAccounts = data.slice(3).map((r) => String(r[2] ?? ""));
    expect(dataAccounts.some((acc) => acc.startsWith("6551206"))).toBe(false);

    const sheet3Golongan = sheet3.map((r) => r[5]);
    expect(sheet3Golongan).toContain("Aset Non-Inventaris");
  });

  it("reverses D/C direction for akm rows vs perolehan rows (contra-asset, 5.2b)", () => {
    const { buffer } = buildJurnalExport(rows, {
      operatorName: "Session User",
      tanggalMutasi: new Date(Date.UTC(2026, 6, 27)),
    });
    const { data } = readSheets(buffer);
    const body = data.slice(3).filter((r) => r[2] && String(r[2]).startsWith("1311304")); // akun perolehan Komputer
    const akmBody = data.slice(3).filter((r) => r[2] && String(r[2]).startsWith("1312304")); // akun akm Komputer

    // Perolehan: D ke cabang TUJUAN (078), C dari cabang ASAL
    const perolehanD = body.find((r) => r[3] === "D");
    const perolehanC = body.find((r) => r[3] === "C");
    expect(String(perolehanD?.[2])).toContain("-078-IDR");
    expect(String(perolehanC?.[2])).not.toContain("-078-IDR");

    // Akm: arah kebalik — D dari cabang ASAL, C ke cabang TUJUAN (078)
    const akmD = akmBody.find((r) => r[3] === "D");
    const akmC = akmBody.find((r) => r[3] === "C");
    expect(String(akmC?.[2])).toContain("-078-IDR");
    expect(String(akmD?.[2])).not.toContain("-078-IDR");
  });

  it("sums totals per group correctly", () => {
    const doubled: MutasiAsetRow[] = [
      row({ nomorRegisterAset: "500/001/00001/2026", hargaPerolehan: 1_000_000, akmPenyusutan: 100_000 }),
      row({ nomorRegisterAset: "500/002/00002/2026", hargaPerolehan: 2_000_000, akmPenyusutan: 200_000 }),
    ];
    const { buffer } = buildJurnalExport(doubled, {
      operatorName: "Session User",
      tanggalMutasi: new Date(Date.UTC(2026, 6, 27)),
    });
    const { data } = readSheets(buffer);
    const perolehanRow = data.slice(3).find((r) => r[3] === "D" && String(r[2]).startsWith("1311304"));
    expect(perolehanRow?.[4]).toBe(3_000_000);
  });

  it("labels the Komputer akm reference row 'Akm Peny - Komputer Gol I' (2.2), not 'Akm Peny - Komputer'", () => {
    const { buffer } = buildJurnalExport(rows, {
      operatorName: "Session User",
      tanggalMutasi: new Date(Date.UTC(2026, 6, 27)),
    });
    const { data } = readSheets(buffer);
    const refRow = data.find((r) => r[7] === "1312304");
    expect(refRow?.[8]).toBe("Akm Peny - Komputer Gol I");
  });

  it("copies the referensi sheet verbatim (30 values) followed by the full A-L legend", () => {
    const { buffer } = buildJurnalExport(rows, {
      operatorName: "Session User",
      tanggalMutasi: new Date(Date.UTC(2026, 6, 27)),
    });
    const { referensi } = readSheets(buffer);
    expect(referensi[0][0]).toBe("referensi kode_tx_class");
    expect(referensi[1][0]).toBe("");
    expect(referensi[2][0]).toBe("akum_depresiasi");
    expect(referensi[31][0]).toBe("write_off");

    // Legenda lengkap A2 dipindah ke sini karena batas 255 karakter BIFF8.
    expect(referensi[32][0]).toBe("");
    expect(referensi[33][0]).toBe("LEGENDA KOLOM SHEET 'data'");
    expect(referensi[34][0]).toBe("A. No : Nomor urut");
    expect(referensi[referensi.length - 1][0]).toContain("L. Override cabang");
  });

  it("keeps the A2 legend summary under the BIFF8 255-char cell limit", () => {
    const { buffer } = buildJurnalExport(rows, {
      operatorName: "Session User",
      tanggalMutasi: new Date(Date.UTC(2026, 6, 27)),
    });
    const { data } = readSheets(buffer);
    const a2 = String(data[1][0]);
    expect(a2.length).toBeLessThanOrEqual(255);
    expect(a2.startsWith("Keterangan Input Transaksi Massal")).toBe(true);
  });
});

describe("buildJurnalExport — error collection (bagian 1.5)", () => {
  it("collects multiple distinct issues into a single thrown error instead of failing on the first bad row", () => {
    const rows: MutasiAsetRow[] = [
      row({ nomorRegisterAset: "460/00042/2024", golonganAset: "Alat Perlengkapan Lainnya" }),
      row({ nomorRegisterAset: "460/00099/2024", golonganAset: "Alat Perlengkapan Lainnya" }),
      row({ nomorRegisterAset: "460/00100/2024", golonganAset: "Alat Perlengkapan Lainnya" }),
      row({ nomorRegisterAset: "500/501/00117/2023", lokasiTujuan: "ULS -ULS Padang" }),
    ];

    let caught: unknown;
    try {
      buildJurnalExport(rows, { operatorName: "X", tanggalMutasi: new Date(Date.UTC(2026, 6, 27)) });
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(ExportJurnalError);
    const err = caught as ExportJurnalError;
    expect(err.message).toContain("2 masalah ditemukan");
    expect(err.message).toContain('Golongan tidak dikenal: "Alat Perlengkapan Lainnya"');
    expect(err.message).toContain("3 baris terdampak");
    // Matches the spec's own bagian 1.5 example verbatim.
    expect(err.message).toContain('Lokasi tidak dikenal: "ULS -ULS Padang"');
  });

  it("hard-errors when the register segment doesn't match the golongan (3.4)", () => {
    const rows: MutasiAsetRow[] = [row({ nomorRegisterAset: "999/001/00001/2026", golonganAset: "Komputer" })];
    expect(() =>
      buildJurnalExport(rows, { operatorName: "X", tanggalMutasi: new Date(Date.UTC(2026, 6, 27)) })
    ).toThrow(ExportJurnalError);
  });

  it("never writes a file when there are validation issues", () => {
    const rows: MutasiAsetRow[] = [row({ golonganAset: "Unknown Golongan" })];
    expect(() =>
      buildJurnalExport(rows, { operatorName: "X", tanggalMutasi: new Date(Date.UTC(2026, 6, 27)) })
    ).toThrow(ExportJurnalError);
  });
});
