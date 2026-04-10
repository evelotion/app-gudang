"use server"

import { prisma } from "@/lib/prisma"

export async function getSemuaBarang() {
  try {
    const data = await prisma.barang.findMany({
      include: { kategori: true },
      orderBy: { nama_barang: 'asc' }
    })
    // Tambahin error: undefined
    return { success: true, data, error: undefined } 
  } catch (error) {
    // Tambahin data: []
    return { success: false, data: [], error: "Gagal mengambil data barang" }
  }
}

export async function getKategori() {
  try {
    const data = await prisma.kategori.findMany()
    return { success: true, data, error: undefined }
  } catch (error) {
    return { success: false, data: [], error: "Gagal mengambil data kategori" }
  }
}