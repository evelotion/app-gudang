"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { registrasiAsetSchema, hapusBukuAsetSchema } from "@/lib/validations";

// ==========================================
// SERVER ACTIONS REGISTRASI
// ==========================================

export async function createRegistrasiAset(data: z.infer<typeof registrasiAsetSchema>) {
  try {
    const parsedData = registrasiAsetSchema.parse(data);
    await prisma.registrasiAset.create({ data: { ...parsedData, hargaPerolehan: parsedData.hargaPerolehan }});
    revalidatePath("/aset/registrasi-baru");
    return { success: true, message: "Data registrasi aset berhasil disimpan!" };
  } catch (error) { return { success: false, message: "Gagal menyimpan data." }; }
}

export async function updateRegistrasiAset(id: string, data: z.infer<typeof registrasiAsetSchema>) {
  try {
    const parsedData = registrasiAsetSchema.parse(data);
    await prisma.registrasiAset.update({ where: { id }, data: { ...parsedData, hargaPerolehan: parsedData.hargaPerolehan }});
    revalidatePath("/aset/registrasi-baru");
    return { success: true, message: "Data registrasi aset berhasil diupdate!" };
  } catch (error) { return { success: false, message: "Gagal mengupdate data." }; }
}

export async function deleteRegistrasiAset(id: string) {
  try {
    await prisma.registrasiAset.delete({ where: { id } });
    revalidatePath("/aset/registrasi-baru");
    return { success: true, message: "Data registrasi aset berhasil dihapus!" };
  } catch (error) { return { success: false, message: "Gagal menghapus data." }; }
}

export async function getRegistrasiAset() {
  try { return await prisma.registrasiAset.findMany({ orderBy: { createdAt: "desc" }}); } 
  catch (error) { return []; }
}

// ==========================================
// SERVER ACTIONS HAPUS BUKU (SUDAH ADA CRUD)
// ==========================================

export async function createHapusBukuAset(data: z.infer<typeof hapusBukuAsetSchema>) {
  try {
    const parsedData = hapusBukuAsetSchema.parse(data);
    await prisma.hapusBukuAset.create({ data: { ...parsedData }});
    revalidatePath("/aset/hapus-buku");
    return { success: true, message: "Data hapus buku berhasil disimpan!" };
  } catch (error) { return { success: false, message: "Gagal menyimpan data hapus buku." }; }
}

export async function updateHapusBukuAset(id: string, data: z.infer<typeof hapusBukuAsetSchema>) {
  try {
    const parsedData = hapusBukuAsetSchema.parse(data);
    await prisma.hapusBukuAset.update({ where: { id }, data: { ...parsedData }});
    revalidatePath("/aset/hapus-buku");
    return { success: true, message: "Data hapus buku berhasil diupdate!" };
  } catch (error) { return { success: false, message: "Gagal mengupdate data hapus buku." }; }
}

export async function deleteHapusBukuAset(id: string) {
  try {
    await prisma.hapusBukuAset.delete({ where: { id }});
    revalidatePath("/aset/hapus-buku");
    return { success: true, message: "Data hapus buku berhasil dihapus!" };
  } catch (error) { return { success: false, message: "Gagal menghapus data hapus buku." }; }
}

export async function getHapusBukuAset() {
  try { return await prisma.hapusBukuAset.findMany({ orderBy: { createdAt: "desc" }}); } 
  catch (error) { return []; }
}

// Tambahkan di dalam src/actions/aset.ts

// Hapus Massal Registrasi Aset
export async function deleteBulkRegistrasiAset(ids: string[]) {
  try {
    await prisma.registrasiAset.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/aset/registrasi-baru");
    return { success: true, message: `${ids.length} data berhasil dihapus!` };
  } catch (error) { 
    return { success: false, message: "Gagal menghapus data massal." }; 
  }
}

// Hapus Massal Hapus Buku Aset
export async function deleteBulkHapusBukuAset(ids: string[]) {
  try {
    await prisma.hapusBukuAset.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/aset/hapus-buku");
    return { success: true, message: `${ids.length} data berhasil dihapus!` };
  } catch (error) { 
    return { success: false, message: "Gagal menghapus data massal." }; 
  }
}

// Tambahkan di bagian bawah src/actions/aset.ts

export async function getMutasiAset() {
  try {
    const data = await prisma.mutasiAset.findMany({
      orderBy: { tanggalInput: 'desc' }
    });
    return data;
  } catch (error) {
    console.error("Gagal mengambil data Mutasi Aset:", error);
    return [];
  }
}

export async function createMutasiAset(data: any) {
  try {
    const newMutasi = await prisma.mutasiAset.create({
      data: {
        tanggalInput: new Date(data.tanggalInput),
        tanggalMutasi: new Date(data.tanggalMutasi),
        nomorRegisterAset: data.nomorRegisterAset,
        namaAset: data.namaAset,
        golonganAset: data.golonganAset,
        jumlah: Number(data.jumlah),
        tanggalPerolehan: new Date(data.tanggalPerolehan),
        hargaPerolehan: Number(data.hargaPerolehan),
        akmPenyusutan: Number(data.akmPenyusutan),
        lokasiAwal: data.lokasiAwal,
        lokasiTujuan: data.lokasiTujuan,
        alasanMutasi: data.alasanMutasi,
        operatorName: data.operatorName,
      }
    });
    return { success: true, data: newMutasi };
  } catch (error: any) {
    console.error("Gagal membuat Mutasi Aset:", error);
    return { success: false, error: "Terjadi kesalahan saat menyimpan data mutasi." };
  }
}