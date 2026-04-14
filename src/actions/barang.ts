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
export async function tambahBarang(formData: any) {
  try {
    const barangBaru = await prisma.barang.create({
      data: {
        kode_barang: formData.kode_barang.toUpperCase(),
        nama_barang: formData.nama_barang,
        satuan: formData.satuan,
        stok: Number(formData.stok) || 0,
        stok_min: Number(formData.stok_min) || 0,
        harga_satuan: Number(formData.harga_satuan) || 0,
        nomorator: formData.nomorator || "",
        supplier: formData.supplier || "",
      }
    })
    return { success: true, data: barangBaru }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: "Kode barang sudah terdaftar!" }
    }
    return { success: false, error: "Gagal menambah barang baru" }
  }
}