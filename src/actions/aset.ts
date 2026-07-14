"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { 
  registrasiAsetSchema, 
  hapusBukuAsetSchema, 
  mutasiAsetSchema 
} from "@/lib/validations";

// ==========================================
// SERVER ACTIONS REGISTRASI
// ==========================================

export async function createRegistrasiAset(data: z.infer<typeof registrasiAsetSchema>) {
  try {
    const parsedData = registrasiAsetSchema.parse(data);
    await prisma.registrasiAset.create({ data: { ...parsedData } });
    revalidatePath("/aset/registrasi-baru");
    return { success: true, message: "Data registrasi aset berhasil disimpan!" };
  } catch (error) { 
    return { success: false, message: "Gagal menyimpan data." }; 
  }
}

// FUNGSI BARU: Untuk Bulk Insert Registrasi Aset (Lebih Cepat & Aman)
export async function createBulkRegistrasiAset(dataArray: any[]) {
  try {
    await prisma.registrasiAset.createMany({
      data: dataArray,
    });
    revalidatePath("/aset/registrasi-baru");
    return { success: true, message: `${dataArray.length} data registrasi aset berhasil disimpan!` };
  } catch (error) {
    console.error("Bulk Insert Registrasi Error:", error);
    return { success: false, message: "Gagal menyimpan data massal." };
  }
}

export async function updateRegistrasiAset(id: string, data: z.infer<typeof registrasiAsetSchema>) {
  try {
    const parsedData = registrasiAsetSchema.parse(data);
    await prisma.registrasiAset.update({ where: { id }, data: { ...parsedData } });
    revalidatePath("/aset/registrasi-baru");
    return { success: true, message: "Data registrasi aset berhasil diupdate!" };
  } catch (error) { 
    return { success: false, message: "Gagal mengupdate data." }; 
  }
}

// FUNGSI BARU: Untuk Update Massal (Bulk Edit) dari UI Modal
export async function updateBulkRegistrasiAset(dataArray: any[]) {
  try {
    // Kita pakai transaction biar update jalannya berbarengan dan aman
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
    console.error("Bulk Update Error:", error);
    return { success: false, message: "Gagal melakukan update massal." };
  }
}

export async function deleteRegistrasiAset(id: string) {
  try {
    await prisma.registrasiAset.delete({ where: { id } });
    revalidatePath("/aset/registrasi-baru");
    return { success: true, message: "Data registrasi aset berhasil dihapus!" };
  } catch (error) { 
    return { success: false, message: "Gagal menghapus data." }; 
  }
}

export async function deleteBulkRegistrasiAset(ids: string[]) {
  try {
    await prisma.registrasiAset.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/aset/registrasi-baru");
    return { success: true, message: `${ids.length} data berhasil dihapus!` };
  } catch (error) { 
    return { success: false, message: "Gagal menghapus data massal." }; 
  }
}

export async function getRegistrasiAset() {
  try { 
    return await prisma.registrasiAset.findMany({ orderBy: { createdAt: "desc" }}); 
  } catch (error) { 
    return []; 
  }
}

// ==========================================
// SERVER ACTIONS HAPUS BUKU
// ==========================================

export async function createHapusBukuAset(data: z.infer<typeof hapusBukuAsetSchema>) {
  try {
    const parsedData = hapusBukuAsetSchema.parse(data);
    await prisma.hapusBukuAset.create({ data: { ...parsedData }});
    revalidatePath("/aset/hapus-buku");
    return { success: true, message: "Data hapus buku berhasil disimpan!" };
  } catch (error) { 
    return { success: false, message: "Gagal menyimpan data hapus buku." }; 
  }
}

// FUNGSI BARU: Untuk Bulk Insert Hapus Buku
export async function createBulkHapusBukuAset(dataArray: any[]) {
  try {
    await prisma.hapusBukuAset.createMany({
      data: dataArray,
    });
    revalidatePath("/aset/hapus-buku");
    return { success: true, message: `${dataArray.length} data hapus buku berhasil disimpan!` };
  } catch (error) {
    console.error("Bulk Insert Hapus Buku Error:", error);
    return { success: false, message: "Gagal menyimpan data massal hapus buku." };
  }
}

export async function updateHapusBukuAset(id: string, data: z.infer<typeof hapusBukuAsetSchema>) {
  try {
    const parsedData = hapusBukuAsetSchema.parse(data);
    await prisma.hapusBukuAset.update({ where: { id }, data: { ...parsedData }});
    revalidatePath("/aset/hapus-buku");
    return { success: true, message: "Data hapus buku berhasil diupdate!" };
  } catch (error) { 
    return { success: false, message: "Gagal mengupdate data hapus buku." }; 
  }
}

export async function deleteHapusBukuAset(id: string) {
  try {
    await prisma.hapusBukuAset.delete({ where: { id }});
    revalidatePath("/aset/hapus-buku");
    return { success: true, message: "Data hapus buku berhasil dihapus!" };
  } catch (error) { 
    return { success: false, message: "Gagal menghapus data hapus buku." }; 
  }
}

export async function deleteBulkHapusBukuAset(ids: string[]) {
  try {
    await prisma.hapusBukuAset.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/aset/hapus-buku");
    return { success: true, message: `${ids.length} data berhasil dihapus!` };
  } catch (error) { 
    return { success: false, message: "Gagal menghapus data massal." }; 
  }
}

export async function getHapusBukuAset() {
  try { 
    return await prisma.hapusBukuAset.findMany({ orderBy: { createdAt: "desc" }}); 
  } catch (error) { 
    return []; 
  }
}

// ==========================================
// SERVER ACTIONS MUTASI ASET
// ==========================================

export async function createMutasiAset(data: z.infer<typeof mutasiAsetSchema>) {
  try {
    const parsedData = mutasiAsetSchema.parse(data);
    await prisma.mutasiAset.create({ data: { ...parsedData } });
    revalidatePath("/aset/mutasi");
    return { success: true, message: "Data mutasi aset berhasil disimpan!" };
  } catch (error) {
    return { success: false, message: "Gagal menyimpan data mutasi." };
  }
}

// FUNGSI BARU: Untuk Bulk Insert Mutasi Aset
export async function createBulkMutasiAset(dataArray: any[]) {
  try {
    await prisma.mutasiAset.createMany({
      data: dataArray,
    });
    revalidatePath("/aset/mutasi");
    return { success: true, message: `${dataArray.length} data mutasi aset berhasil disimpan!` };
  } catch (error) {
    console.error("Bulk Insert Mutasi Error:", error);
    return { success: false, message: "Gagal menyimpan data massal mutasi." };
  }
}

export async function updateMutasiAset(id: string, data: z.infer<typeof mutasiAsetSchema>) {
  try {
    const parsedData = mutasiAsetSchema.parse(data);
    await prisma.mutasiAset.update({ where: { id }, data: { ...parsedData } });
    revalidatePath("/aset/mutasi");
    return { success: true, message: "Data mutasi aset berhasil diupdate!" };
  } catch (error) {
    return { success: false, message: "Gagal mengupdate data mutasi." };
  }
}

export async function deleteMutasiAset(id: string) {
  try {
    await prisma.mutasiAset.delete({ where: { id } });
    revalidatePath("/aset/mutasi");
    return { success: true, message: "Data mutasi aset berhasil dihapus!" };
  } catch (error) {
    return { success: false, message: "Gagal menghapus data mutasi." };
  }
}

export async function deleteBulkMutasiAset(ids: string[]) {
  try {
    await prisma.mutasiAset.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/aset/mutasi");
    return { success: true, message: `${ids.length} data berhasil dihapus!` };
  } catch (error) { 
    return { success: false, message: "Gagal menghapus data massal mutasi." }; 
  }
}

export async function getMutasiAset() {
  try {
    return await prisma.mutasiAset.findMany({ orderBy: { tanggalInput: 'desc' } });
  } catch (error) {
    return [];
  }
}