"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/actions/auth";
import {
  registrasiAsetSchema,
  hapusBukuAsetSchema,
  mutasiAsetSchema
} from "@/lib/validations";
import { parseTanggalInput } from "@/lib/date";
import { buildJurnalExport, ExportJurnalError } from "@/lib/exportJournal";
import { findLokasiErrors } from "@/lib/lokasiValidation";
import type { LokasiRefEntry } from "@/lib/mappings";

function isUnauthorized(error: unknown) {
  return error instanceof Error && error.message === "UNAUTHORIZED";
}

// Dipakai di seluruh server action mutasi (create/update, tunggal/bulk) dan
// export jurnal supaya tabel pengecualian LokasiRef cuma di-query sekali per
// aksi, bukan per baris (normalisasi-lokasi.md bagian A.5 & B.3).
async function loadLokasiRefMap(): Promise<Map<string, LokasiRefEntry>> {
  const rows = await prisma.lokasiRef.findMany();
  return new Map(
    rows.map((r) => [
      r.raw,
      { kodeCabang: r.kodeCabang, label: r.label, initial: r.initial, tipe: r.tipe as LokasiRefEntry["tipe"] },
    ])
  );
}

// Prisma.Decimal bukan plain object, jadi gagal melewati batas Server->Client
// (baik lewat props maupun return value Server Action). Konversi ke number
// sebelum data ini menyeberang ke komponen client.
function serializeDecimals<T extends Record<string, any>>(rows: T[], keys: (keyof T)[]): T[] {
  return rows.map((row) => {
    const copy = { ...row };
    for (const key of keys) {
      if (copy[key] != null) copy[key] = Number(copy[key]) as T[typeof key];
    }
    return copy;
  });
}

// ==========================================
// SERVER ACTIONS REGISTRASI
// ==========================================

export async function createRegistrasiAset(data: z.infer<typeof registrasiAsetSchema>) {
  try {
    await requireSession();
    const parsedData = registrasiAsetSchema.parse(data);
    await prisma.registrasiAset.create({ data: { ...parsedData, status: "PENDING" } });
    revalidatePath("/aset/registrasi-baru");
    return { success: true, message: "Data registrasi aset berhasil disimpan!" };
  } catch (error) {
    if (isUnauthorized(error)) return { success: false, message: "Anda harus login." };
    return { success: false, message: "Gagal menyimpan data." };
  }
}

export async function createBulkRegistrasiAset(dataArray: any[]) {
  try {
    const session = await requireSession();
    const parsed = z.array(registrasiAsetSchema).safeParse(dataArray);
    if (!parsed.success) {
      return { success: false, message: "Data tidak valid.", errors: parsed.error.issues };
    }
    const data = parsed.data.map((item) => ({ ...item, inputerName: session.nama, status: "PENDING" }));
    await prisma.registrasiAset.createMany({ data });
    revalidatePath("/aset/registrasi-baru");
    return { success: true, message: `${data.length} data registrasi aset berhasil disimpan!` };
  } catch (error) {
    if (isUnauthorized(error)) return { success: false, message: "Anda harus login." };
    console.error("Bulk Insert Registrasi Error:", error);
    return { success: false, message: "Gagal menyimpan data massal." };
  }
}

export async function updateRegistrasiAset(id: string, data: z.infer<typeof registrasiAsetSchema>) {
  try {
    await requireSession();
    const parsedData = registrasiAsetSchema.parse(data);
    await prisma.registrasiAset.update({ where: { id }, data: { ...parsedData } });
    revalidatePath("/aset/registrasi-baru");
    return { success: true, message: "Data registrasi aset berhasil diupdate!" };
  } catch (error) {
    if (isUnauthorized(error)) return { success: false, message: "Anda harus login." };
    return { success: false, message: "Gagal mengupdate data." };
  }
}

export async function updateBulkRegistrasiAset(dataArray: any[]) {
  try {
    await requireSession();
    const transactions = dataArray.map((item) =>
      prisma.registrasiAset.update({
        where: { id: item.id },
        data: {
          tanggalInput: new Date(item.tanggalInput),
          nomorRegisterAset: item.nomorRegisterAset,
          namaAset: item.namaAset,
          golonganAset: item.golonganAset,
          jumlah: Number(item.jumlah),
          tanggalPerolehan: new Date(item.tanggalPerolehan),
          hargaPerolehan: Number(item.hargaPerolehan),
          cabangUnitKerja: item.cabangUnitKerja,
          userPengguna: item.userPengguna,
          lokasiPosisiAset: item.lokasiPosisiAset,
        },
      })
    );

    await prisma.$transaction(transactions);
    revalidatePath("/aset/registrasi-baru");
    return { success: true, message: `${dataArray.length} data berhasil diupdate massal!` };
  } catch (error) {
    if (isUnauthorized(error)) return { success: false, message: "Anda harus login." };
    console.error("Bulk Update Error:", error);
    return { success: false, message: "Gagal melakukan update massal." };
  }
}

export async function deleteRegistrasiAset(id: string) {
  try {
    await requireSession();
    await prisma.registrasiAset.delete({ where: { id } });
    revalidatePath("/aset/registrasi-baru");
    return { success: true, message: "Data registrasi aset berhasil dihapus!" };
  } catch (error) {
    if (isUnauthorized(error)) return { success: false, message: "Anda harus login." };
    return { success: false, message: "Gagal menghapus data." };
  }
}

export async function deleteBulkRegistrasiAset(ids: string[]) {
  try {
    await requireSession();
    await prisma.registrasiAset.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/aset/registrasi-baru");
    return { success: true, message: `${ids.length} data berhasil dihapus!` };
  } catch (error) {
    if (isUnauthorized(error)) return { success: false, message: "Anda harus login." };
    return { success: false, message: "Gagal menghapus data massal." };
  }
}

export async function getRegistrasiAset() {
  try {
    const rows = await prisma.registrasiAset.findMany({ orderBy: { createdAt: "desc" }});
    return serializeDecimals(rows, ["hargaPerolehan"]);
  } catch (error) {
    return [];
  }
}

// ==========================================
// SERVER ACTIONS HAPUS BUKU
// ==========================================

export async function createHapusBukuAset(data: z.infer<typeof hapusBukuAsetSchema>) {
  try {
    const session = await requireSession();
    const parsedData = hapusBukuAsetSchema.parse(data);
    await prisma.hapusBukuAset.create({ data: { ...parsedData, operatorName: session.nama, status: "PENDING" }});
    revalidatePath("/aset/hapus-buku");
    return { success: true, message: "Data hapus buku berhasil disimpan!" };
  } catch (error) {
    if (isUnauthorized(error)) return { success: false, message: "Anda harus login." };
    return { success: false, message: "Gagal menyimpan data hapus buku." };
  }
}

export async function createBulkHapusBukuAset(dataArray: any[]) {
  try {
    const session = await requireSession();
    const parsed = z.array(hapusBukuAsetSchema).safeParse(dataArray);
    if (!parsed.success) {
      return { success: false, message: "Data tidak valid.", errors: parsed.error.issues };
    }
    const data = parsed.data.map((item) => ({ ...item, operatorName: session.nama, status: "PENDING" }));
    await prisma.hapusBukuAset.createMany({ data });
    revalidatePath("/aset/hapus-buku");
    return { success: true, message: `${data.length} data hapus buku berhasil disimpan!` };
  } catch (error) {
    if (isUnauthorized(error)) return { success: false, message: "Anda harus login." };
    console.error("Bulk Insert Hapus Buku Error:", error);
    return { success: false, message: "Gagal menyimpan data massal hapus buku." };
  }
}

export async function updateHapusBukuAset(id: string, data: z.infer<typeof hapusBukuAsetSchema>) {
  try {
    await requireSession();
    const parsedData = hapusBukuAsetSchema.parse(data);
    await prisma.hapusBukuAset.update({ where: { id }, data: { ...parsedData }});
    revalidatePath("/aset/hapus-buku");
    return { success: true, message: "Data hapus buku berhasil diupdate!" };
  } catch (error) {
    if (isUnauthorized(error)) return { success: false, message: "Anda harus login." };
    return { success: false, message: "Gagal mengupdate data hapus buku." };
  }
}

// FUNGSI BARU: Untuk Update Massal (Bulk Edit) Hapus Buku
export async function updateBulkHapusBukuAset(dataArray: any[]) {
  try {
    await requireSession();
    const transactions = dataArray.map((item) =>
      prisma.hapusBukuAset.update({
        where: { id: item.id },
        data: {
          tanggalHapusBuku: new Date(item.tanggalHapusBuku),
          nomorRegisterAset: item.nomorRegisterAset,
          namaAset: item.namaAset,
          golonganAset: item.golonganAset,
          jumlah: Number(item.jumlah),
          tanggalPerolehan: new Date(item.tanggalPerolehan),
          hargaPerolehan: Number(item.hargaPerolehan),
          akmPenyusutan: Number(item.akmPenyusutan),
          nilaiBuku: Number(item.nilaiBuku),
          cabangUnitKerja: item.cabangUnitKerja,
          alasanHapusBuku: item.alasanHapusBuku,
        },
      })
    );
    await prisma.$transaction(transactions);
    revalidatePath("/aset/hapus-buku");
    return { success: true, message: `${dataArray.length} data hapus buku berhasil diupdate!` };
  } catch (error) {
    if (isUnauthorized(error)) return { success: false, message: "Anda harus login." };
    console.error("Bulk Update Hapus Buku Error:", error);
    return { success: false, message: "Gagal melakukan update massal hapus buku." };
  }
}

export async function deleteHapusBukuAset(id: string) {
  try {
    await requireSession();
    await prisma.hapusBukuAset.delete({ where: { id }});
    revalidatePath("/aset/hapus-buku");
    return { success: true, message: "Data hapus buku berhasil dihapus!" };
  } catch (error) {
    if (isUnauthorized(error)) return { success: false, message: "Anda harus login." };
    return { success: false, message: "Gagal menghapus data hapus buku." };
  }
}

export async function deleteBulkHapusBukuAset(ids: string[]) {
  try {
    await requireSession();
    await prisma.hapusBukuAset.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/aset/hapus-buku");
    return { success: true, message: `${ids.length} data berhasil dihapus!` };
  } catch (error) {
    if (isUnauthorized(error)) return { success: false, message: "Anda harus login." };
    return { success: false, message: "Gagal menghapus data massal." };
  }
}

export async function getHapusBukuAset() {
  try {
    const rows = await prisma.hapusBukuAset.findMany({ orderBy: { createdAt: "desc" }});
    return serializeDecimals(rows, ["hargaPerolehan", "akmPenyusutan", "nilaiBuku"]);
  } catch (error) {
    return [];
  }
}

// ==========================================
// SERVER ACTIONS MUTASI ASET
// ==========================================

export async function createMutasiAset(data: z.infer<typeof mutasiAsetSchema>) {
  try {
    await requireSession();
    const parsedData = mutasiAsetSchema.parse(data);

    const lokasiErrors = findLokasiErrors([parsedData], await loadLokasiRefMap());
    if (lokasiErrors.length > 0) {
      return { success: false, message: lokasiErrors[0] };
    }

    await prisma.mutasiAset.create({ data: { ...parsedData, status: "PENDING" } });
    revalidatePath("/aset/mutasi");
    return { success: true, message: "Data mutasi aset berhasil disimpan!" };
  } catch (error) {
    if (isUnauthorized(error)) return { success: false, message: "Anda harus login." };
    return { success: false, message: "Gagal menyimpan data mutasi." };
  }
}

export async function createBulkMutasiAset(dataArray: any[]) {
  try {
    const session = await requireSession();

    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return { success: false, message: "Tidak ada data yang dikirim." };
    }

    const parsed = z.array(mutasiAsetSchema).safeParse(dataArray);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const baris = typeof first.path[0] === "number" ? first.path[0] + 1 : "?";
      return {
        success: false,
        message: `Baris ${baris}: ${first.message}`,
        errors: parsed.error.issues,
      };
    }

    const lokasiErrors = findLokasiErrors(parsed.data, await loadLokasiRefMap());
    if (lokasiErrors.length > 0) {
      return {
        success: false,
        message: lokasiErrors.length === 1 ? lokasiErrors[0] : `${lokasiErrors[0]} (+${lokasiErrors.length - 1} lainnya)`,
        errors: lokasiErrors,
      };
    }

    const data = parsed.data.map((item) => ({ ...item, operatorName: session.nama, status: "PENDING" }));
    const hasil = await prisma.mutasiAset.createMany({ data });
    revalidatePath("/aset/mutasi");
    return { success: true, message: `${hasil.count} data mutasi aset berhasil disimpan!` };
  } catch (error) {
    if (isUnauthorized(error)) return { success: false, message: "Anda harus login." };
    console.error("Bulk Insert Mutasi Error:", error);
    const detail = error instanceof Error ? error.message.split("\n").pop()?.trim() : "";
    return {
      success: false,
      message: `Gagal menyimpan data massal mutasi.${detail ? ` (${detail})` : ""}`,
    };
  }
}

export async function updateMutasiAset(id: string, data: z.infer<typeof mutasiAsetSchema>) {
  try {
    await requireSession();
    const parsedData = mutasiAsetSchema.parse(data);

    const lokasiErrors = findLokasiErrors([parsedData], await loadLokasiRefMap());
    if (lokasiErrors.length > 0) {
      return { success: false, message: lokasiErrors[0] };
    }

    await prisma.mutasiAset.update({ where: { id }, data: { ...parsedData } });
    revalidatePath("/aset/mutasi");
    return { success: true, message: "Data mutasi aset berhasil diupdate!" };
  } catch (error) {
    if (isUnauthorized(error)) return { success: false, message: "Anda harus login." };
    return { success: false, message: "Gagal mengupdate data mutasi." };
  }
}

// FUNGSI BARU: Untuk Update Massal (Bulk Edit) Mutasi
export async function updateBulkMutasiAset(dataArray: any[]) {
  try {
    await requireSession();

    const lokasiErrors = findLokasiErrors(dataArray, await loadLokasiRefMap());
    if (lokasiErrors.length > 0) {
      return {
        success: false,
        message: lokasiErrors.length === 1 ? lokasiErrors[0] : `${lokasiErrors[0]} (+${lokasiErrors.length - 1} lainnya)`,
        errors: lokasiErrors,
      };
    }

    const transactions = dataArray.map((item) =>
      prisma.mutasiAset.update({
        where: { id: item.id },
        data: {
          tanggalMutasi: new Date(item.tanggalMutasi),
          nomorRegisterAset: item.nomorRegisterAset,
          namaAset: item.namaAset,
          golonganAset: item.golonganAset,
          jumlah: Number(item.jumlah),
          tanggalPerolehan: new Date(item.tanggalPerolehan),
          hargaPerolehan: Number(item.hargaPerolehan),
          akmPenyusutan: Number(item.akmPenyusutan),
          lokasiAwal: item.lokasiAwal,
          lokasiTujuan: item.lokasiTujuan,
          alasanMutasi: item.alasanMutasi,
        },
      })
    );
    await prisma.$transaction(transactions);
    revalidatePath("/aset/mutasi");
    return { success: true, message: `${dataArray.length} data mutasi berhasil diupdate!` };
  } catch (error) {
    if (isUnauthorized(error)) return { success: false, message: "Anda harus login." };
    console.error("Bulk Update Mutasi Error:", error);
    return { success: false, message: "Gagal melakukan update massal mutasi." };
  }
}

export async function deleteMutasiAset(id: string) {
  try {
    await requireSession();
    await prisma.mutasiAset.delete({ where: { id } });
    revalidatePath("/aset/mutasi");
    return { success: true, message: "Data mutasi aset berhasil dihapus!" };
  } catch (error) {
    if (isUnauthorized(error)) return { success: false, message: "Anda harus login." };
    return { success: false, message: "Gagal menghapus data mutasi." };
  }
}

export async function deleteBulkMutasiAset(ids: string[]) {
  try {
    await requireSession();
    await prisma.mutasiAset.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/aset/mutasi");
    return { success: true, message: `${ids.length} data berhasil dihapus!` };
  } catch (error) {
    if (isUnauthorized(error)) return { success: false, message: "Anda harus login." };
    return { success: false, message: "Gagal menghapus data massal mutasi." };
  }
}

export async function getMutasiAset() {
  try {
    const rows = await prisma.mutasiAset.findMany({ orderBy: { tanggalInput: 'desc' } });
    return serializeDecimals(rows, ["hargaPerolehan", "akmPenyusutan"]);
  } catch (error) {
    return [];
  }
}

// FUNGSI BARU: Export jurnal mutasi ke .xls BIFF8 untuk upload CBS.
// Client cuma mengirim tanggal — data mutasi di-query di server, supaya
// tidak bisa dimanipulasi dari browser sebelum jadi jurnal (bagian 1.1).
export async function exportJurnalMutasi(tanggalMutasiStr: string) {
  try {
    const session = await requireSession();

    const tanggal = parseTanggalInput(tanggalMutasiStr);
    if (!tanggal) {
      return { success: false, message: "Tanggal tidak valid." };
    }

    const nextDay = new Date(tanggal.getTime() + 24 * 60 * 60 * 1000);
    const [rows, lokasiRefMap] = await Promise.all([
      prisma.mutasiAset.findMany({
        where: { tanggalMutasi: { gte: tanggal, lt: nextDay } },
      }),
      loadLokasiRefMap(),
    ]);

    if (rows.length === 0) {
      return { success: false, message: "Tidak ada data mutasi untuk tanggal ini." };
    }

    const { buffer, fileName } = buildJurnalExport(rows, {
      operatorName: session.nama,
      tanggalMutasi: tanggal,
      lokasiRefMap,
    });

    return { success: true, fileName, base64: buffer.toString("base64") };
  } catch (error) {
    if (isUnauthorized(error)) return { success: false, message: "Anda harus login." };
    if (error instanceof ExportJurnalError) return { success: false, message: error.message };
    console.error("Export Jurnal Error:", error);
    return { success: false, message: "Gagal membuat file jurnal." };
  }
}