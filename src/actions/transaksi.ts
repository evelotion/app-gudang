"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// --- SETUP ZOD SCHEMAS ---
const ItemTransaksiSchema = z.object({
  barangId: z.string().min(1, "ID Barang tidak valid"),
  qty: z.number().int().positive("Qty harus lebih dari 0")
})

const RequisitionSchema = z.object({
  media_request: z.string().min(1, "Media request wajib diisi"),
  no_dokumen: z.string().min(1, "Nomor dokumen wajib diisi"),
  tanggal_dokumen: z.string().min(1, "Tanggal dokumen tidak valid"),
  cabang: z.string().min(1, "Cabang wajib diisi"),
  tanggal_request: z.string().min(1, "Tanggal request tidak valid"),
  jenis_permintaan: z.string().min(1, "Jenis permintaan wajib diisi"),
  pic_nama: z.string().min(1, "Nama PIC wajib diisi"),
  items: z.array(ItemTransaksiSchema).min(1, "Minimal pilih 1 barang")
})

const InboundSchema = z.object({
  no_dokumen: z.string().min(1, "Nomor dokumen wajib diisi"),
  tanggal_masuk: z.string().min(1, "Tanggal masuk wajib diisi"),
  supplier: z.string().min(1, "Supplier wajib diisi"),
  penerima: z.string().min(1, "Penerima wajib diisi"),
  keterangan: z.string().optional(),
  items: z.array(ItemTransaksiSchema).min(1, "Minimal pilih 1 barang")
})

// --- ACTIONS ---
export async function createRequisition(rawData: z.infer<typeof RequisitionSchema>) {
  try {
    // 1. Validasi Input pakai Zod
    const data = RequisitionSchema.parse(rawData);

    const result = await prisma.$transaction(async (tx) => {
      // 2. Cek dokumen dobel
      const existingForm = await tx.requisitionHeader.findUnique({
        where: { no_dokumen: data.no_dokumen }
      })
      if (existingForm) throw new Error("Nomor Dokumen ini sudah pernah diinput!")

      // 3. SOLUSI RACE CONDITION: Potong (decrement) stok SECARA ATOMIK terlebih dahulu
      for (const item of data.items) {
        const updatedBarang = await tx.barang.update({
          where: { id: item.barangId },
          data: { stok: { decrement: item.qty } }
        })

        // Jika setelah dipotong stoknya minus, berarti stok asli tidak cukup.
        // Lempar error untuk me-ROLLBACK seluruh transaksi!
        if (updatedBarang.stok < 0) {
          throw new Error(`Stok ${updatedBarang.nama_barang} tidak mencukupi! Kurang ${Math.abs(updatedBarang.stok)} lagi.`)
        }
      }

      // 4. Simpan Transaksi
      const transaksi = await tx.requisitionHeader.create({
        data: {
          media_request: data.media_request,
          no_dokumen: data.no_dokumen,
          tanggal_dokumen: new Date(data.tanggal_dokumen),
          cabang: data.cabang,
          tanggal_request: new Date(data.tanggal_request),
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
    if (error instanceof z.ZodError) {
      // PERBAIKAN DI SINI: Ditambah <any> supaya TypeScript ga ngeluh property errors ga ada
      return { success: false, error: (error as z.ZodError<any>).errors[0].message }
    }
    return { success: false, error: error.message || "Terjadi kesalahan sistem" }
  }
}

export async function createInbound(rawData: z.infer<typeof InboundSchema>) {
  try {
    const data = InboundSchema.parse(rawData);

    const result = await prisma.$transaction(async (tx) => {
      const existingForm = await tx.inboundHeader.findUnique({
        where: { no_dokumen: data.no_dokumen }
      })
      if (existingForm) throw new Error("Nomor Dokumen/PO ini sudah pernah diinput!")

      for (const item of data.items) {
        await tx.barang.update({
          where: { id: item.barangId },
          data: { stok: { increment: item.qty } }
        })
      }

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
    if (error instanceof z.ZodError) {
      // PERBAIKAN DI SINI: Ditambah <any> supaya TypeScript ga ngeluh property errors ga ada
      return { success: false, error: (error as z.ZodError<any>).errors[0].message }
    }
    return { success: false, error: error.message || "Terjadi kesalahan sistem" }
  }
}