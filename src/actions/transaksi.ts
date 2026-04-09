"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

type ItemTransaksi = {
  barangId: string;
  qty: number;
}

export async function createRequisition(data: {
  no_form: string;
  pic_nama: string;
  departemen: string;
  keterangan?: string;
  items: ItemTransaksi[];
}) {
  try {
    // Jalankan operasi dalam Transaction biar aman (kalau 1 gagal, gagal semua)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cek apakah nomor form sudah dipakai
      const existingForm = await tx.requisitionHeader.findUnique({
        where: { no_form: data.no_form }
      })
      if (existingForm) throw new Error("Nomor Form ini sudah pernah diinput!")

      // 2. Loop tiap barang untuk cek stok dan kurangi stok
      for (const item of data.items) {
        const barang = await tx.barang.findUnique({ where: { id: item.barangId } })
        
        if (!barang) throw new Error(`Barang tidak ditemukan`)
        if (barang.stok < item.qty) {
          throw new Error(`Stok ${barang.nama_barang} tidak mencukupi! Sisa: ${barang.stok}`)
        }

        // Potong stok di Master Barang
        await tx.barang.update({
          where: { id: item.barangId },
          data: { stok: { decrement: item.qty } }
        })
      }

      // 3. Simpan Header & Detail Transaksi
      const transaksi = await tx.requisitionHeader.create({
        data: {
          no_form: data.no_form,
          pic_nama: data.pic_nama,
          departemen: data.departemen,
          keterangan: data.keterangan,
          items: {
            create: data.items.map(item => ({
              barangId: item.barangId,
              qty_diambil: item.qty
            }))
          }
        }
      })

      return transaksi
    })

    // Refresh halaman biar UI otomatis update stok terbarunya
    revalidatePath("/master-barang")
    revalidatePath("/barang-keluar")

    return { success: true, message: "Form berhasil disimpan dan stok dipotong!", data: result }

  } catch (error: any) {
    return { success: false, error: error.message || "Terjadi kesalahan sistem" }
  }
}
