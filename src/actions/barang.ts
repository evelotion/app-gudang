"use server"

import { prisma } from "@/lib/prisma"

export async function getSemuaBarang() {
  try {
    const data = await prisma.barang.findMany({
      // Hapus include kategori karena flat schema
      orderBy: { nama_barang: 'asc' }
    })
    return { success: true, data, error: undefined } 
  } catch (error) {
    return { success: false, data: [], error: "Gagal mengambil data barang" }
  }
}