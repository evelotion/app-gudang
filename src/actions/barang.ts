"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getSemuaBarang() {
  try {
    const data = await prisma.barang.findMany({
      include: { kategori: true },
      orderBy: { nama_barang: 'asc' }
    })
    return { success: true, data }
  } catch (error) {
    return { success: false, error: "Gagal mengambil data barang" }
  }
}

export async function getKategori() {
  try {
    const data = await prisma.kategori.findMany()
    return { success: true, data }
  } catch (error) {
    return { success: false, error: "Gagal mengambil data kategori" }
  }
}
