"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// PASTIKAN BARIS INI BENAR: Mengambil schema HANYA dari file validations
import { registrasiAsetSchema, hapusBukuAsetSchema } from "@/lib/validations";

// ==========================================
// SERVER ACTIONS
// ==========================================

export async function createRegistrasiAset(data: z.infer<typeof registrasiAsetSchema>) {
  try {
    const parsedData = registrasiAsetSchema.parse(data);

    await prisma.registrasiAset.create({
      data: {
        ...parsedData,
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