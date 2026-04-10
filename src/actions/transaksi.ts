"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

type ItemTransaksi = {
  barangId: string;
  qty: number;
}

export async function createRequisition(data: {
  media_request: string;
  no_dokumen: string;
  tanggal_dokumen: string;
  cabang: string;
  tanggal_request: string;
  jenis_permintaan: string;
  pic_nama: string;
  items: ItemTransaksi[];
}) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cek apakah nomor dokumen sudah dipakai
      const existingForm = await tx.requisitionHeader.findUnique({
        where: { no_dokumen: data.no_dokumen }
      })
      if (existingForm) throw new Error("Nomor Dokumen ini sudah pernah diinput!")

      // 2. Cek dan potong stok
      for (const item of data.items) {
        const barang = await tx.barang.findUnique({ where: { id: item.barangId } })
        
        if (!barang) throw new Error(`Barang tidak ditemukan`)
        if (barang.stok < item.qty) {
          throw new Error(`Stok ${barang.nama_barang} tidak mencukupi! Sisa: ${barang.stok}`)
        }

        await tx.barang.update({
          where: { id: item.barangId },
          data: { stok: { decrement: item.qty } }
        })
      }

      // 3. Simpan Transaksi dengan Field Baru
      const transaksi = await tx.requisitionHeader.create({
        data: {
          media_request: data.media_request,
          no_dokumen: data.no_dokumen,
          tanggal_dokumen: new Date(data.tanggal_dokumen), // Convert string ke Date
          cabang: data.cabang,
          tanggal_request: new Date(data.tanggal_request), // Convert string ke Date
          jenis_permintaan: data.jenis_permintaan,
          pic_nama: data.pic_nama,
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

    revalidatePath("/master-barang")
    revalidatePath("/barang-keluar")
    revalidatePath("/laporan")

    return { success: true, message: "Form berhasil disimpan dan stok dipotong!", data: result }

  } catch (error: any) {
    return { success: false, error: error.message || "Terjadi kesalahan sistem" }
  }
}

export async function createInbound(data: {
  no_dokumen: string;
  tanggal_masuk: string;
  supplier: string;
  penerima: string;
  keterangan?: string;
  items: ItemTransaksi[];
}) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cek nomor dokumen dobel
      const existingForm = await tx.inboundHeader.findUnique({
        where: { no_dokumen: data.no_dokumen }
      })
      if (existingForm) throw new Error("Nomor Dokumen/PO ini sudah pernah diinput!")

      // 2. Tambah stok barang (Increment)
      for (const item of data.items) {
        await tx.barang.update({
          where: { id: item.barangId },
          data: { stok: { increment: item.qty } }
        })
      }

      // 3. Simpan Riwayat Barang Masuk
      const transaksi = await tx.inboundHeader.create({
        data: {
          no_dokumen: data.no_dokumen,
          tanggal_masuk: new Date(data.tanggal_masuk),
          supplier: data.supplier,
          penerima: data.penerima,
          keterangan: data.keterangan,
          items: {
            create: data.items.map(item => ({
              barangId: item.barangId,
              qty_masuk: item.qty
            }))
          }
        }
      })
      return transaksi
    })

    revalidatePath("/master-barang")
    revalidatePath("/barang-masuk")

    return { success: true, message: "Sukses! Stok berhasil ditambah.", data: result }
  } catch (error: any) {
    return { success: false, error: error.message || "Terjadi kesalahan sistem" }
  }
}