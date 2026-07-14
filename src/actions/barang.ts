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

export async function importBarangExcel(data: any[]) {
  try {
    // Kita gunakan transaksi agar kalau gagal satu, gagal semua (aman untuk data)
    const result = await prisma.$transaction(
      data.map((item) => 
        prisma.barang.upsert({
          where: { kode_barang: String(item.kode_barang).toUpperCase() },
          update: {
            nama_barang: item.nama_barang,
            satuan: item.satuan,
            stok: Number(item.stok) || 0,
            stok_min: Number(item.stok_min) || 0,
            harga_satuan: Number(item.harga_satuan) || 0,
            nomorator: item.nomorator ? String(item.nomorator) : null,
            supplier: item.supplier ? String(item.supplier) : null,
          },
          create: {
            kode_barang: String(item.kode_barang).toUpperCase(),
            nama_barang: item.nama_barang,
            satuan: item.satuan,
            stok: Number(item.stok) || 0,
            stok_min: Number(item.stok_min) || 0,
            harga_satuan: Number(item.harga_satuan) || 0,
            nomorator: item.nomorator ? String(item.nomorator) : null,
            supplier: item.supplier ? String(item.supplier) : null,
          }
        })
      )
    );

    return { success: true, count: result.length };
  } catch (error) {
    console.error("Error import excel:", error);
    return { success: false, error: "Gagal memproses data import." };
  }
}