"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// ==========================================
// ZOD SCHEMAS
// ==========================================

export const registrasiAsetSchema = z.object({
  nomorRegisterAset: z.string().min(1, "Nomor Register wajib diisi"),
  namaAset: z.string().min(1, "Nama Aset wajib diisi"),
  golonganAset: z.string().min(1, "Golongan Aset wajib diisi"),
  jumlah: z.coerce.number().min(1, "Jumlah minimal 1"),
  tanggalPerolehan: z.coerce.date(),
  hargaPerolehan: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  cabangUnitKerja: z.string().min(1, "Cabang/Unit Kerja wajib diisi"),
  userPengguna: z.string().min(1, "User Pengguna wajib diisi"),
  lokasiPosisiAset: z.string().min(1, "Lokasi/Posisi Aset wajib diisi"),
  inputerName: z.string().min(1, "Nama Inputer wajib diisi"),
  supervisorName: z.string().optional(),
});

export const hapusBukuAsetSchema = z.object({
  tanggalHapusBuku: z.coerce.date(),
  nomorRegisterAset: z.string().min(1, "Nomor Register wajib diisi"),
  namaAset: z.string().min(1, "Nama Aset wajib diisi"),
  golonganAset: z.string().min(1, "Golongan Aset wajib diisi"),
  jumlah: z.coerce.number().min(1, "Jumlah minimal 1"),
  tanggalPerolehan: z.coerce.date(),
  hargaPerolehan: z.coerce.number().min(0, "Harga Perolehan tidak valid"),
  akmPenyusutan: z.coerce.number().min(0, "Akumulasi Penyusutan tidak valid"),
  nilaiBuku: z.coerce.number().min(0, "Nilai Buku tidak valid"),
  cabangUnitKerja: z.string().min(1, "Cabang/Unit Kerja wajib diisi"),
  alasanHapusBuku: z.string().min(1, "Alasan wajib diisi"),
  operatorName: z.string().min(1, "Nama Operator wajib diisi"),
  supervisorName: z.string().optional(),
});

// ==========================================
// SERVER ACTIONS
// ==========================================

export async function createRegistrasiAset(data: z.infer<typeof registrasiAsetSchema>) {
  try {
    const parsedData = registrasiAsetSchema.parse(data);

    await prisma.registrasiAset.create({
      data: {
        ...parsedData,
        // Konversi otomatis ke format Decimal Prisma yang aman
        hargaPerolehan: parsedData.hargaPerolehan, 
      },
    });

    revalidatePath("/aset/registrasi-baru");
    return { success: true, message: "Data registrasi aset berhasil disimpan!" };
  } catch (error) {
    console.error("Error createRegistrasiAset:", error);
    return { success: false, message: "Gagal menyimpan data. Pastikan form valid." };
  }
}

export async function createHapusBukuAset(data: z.infer<typeof hapusBukuAsetSchema>) {
  try {
    const parsedData = hapusBukuAsetSchema.parse(data);

    await prisma.hapusBukuAset.create({
      data: {
        ...parsedData,
      },
    });

    revalidatePath("/aset/hapus-buku");
    return { success: true, message: "Data hapus buku berhasil disimpan!" };
  } catch (error) {
    console.error("Error createHapusBukuAset:", error);
    return { success: false, message: "Gagal menyimpan data hapus buku." };
  }
}

export async function getRegistrasiAset() {
  try {
    const data = await prisma.registrasiAset.findMany({
      orderBy: { createdAt: "desc" },
    });
    return data;
  } catch (error) {
    console.error("Error getRegistrasiAset:", error);
    return [];
  }
}

export async function getHapusBukuAset() {
  try {
    const data = await prisma.hapusBukuAset.findMany({
      orderBy: { createdAt: "desc" },
    });
    return data;
  } catch (error) {
    console.error("Error getHapusBukuAset:", error);
    return [];
  }
}