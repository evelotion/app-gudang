"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// --- SETUP ZOD SCHEMAS ---
const ItemRequisitionSchema = z.object({
  barangId: z.string().min(1, "ID Barang tidak valid"),
  qty: z.number().int().positive("Qty harus lebih dari 0"),
  nomorator: z.string().optional() // Tambahan untuk update sisa nomorator
})

const ItemInboundSchema = z.object({
  barangId: z.string().min(1, "ID Barang tidak valid"),
  qty: z.number().int().positive("Qty harus lebih dari 0"),
  nomorator: z.string().optional(),
  harga_satuan: z.number().min(0, "Harga tidak valid")
})

const RequisitionSchema = z.object({
  media_request: z.string().min(1, "Media request wajib diisi"),
  no_dokumen: z.string().min(1, "Nomor dokumen wajib diisi"),
  tanggal_dokumen: z.string().min(1, "Tanggal dokumen tidak valid"),
  cabang: z.string().min(1, "Cabang wajib diisi"),
  tanggal_request: z.string().min(1, "Tanggal request tidak valid"),
  jenis_permintaan: z.string().min(1, "Jenis permintaan wajib diisi"),
  pic_nama: z.string().min(1, "Nama PIC wajib diisi"),
  status: z.string().default("PACKING"), // <--- TAMBAHAN: Validasi status
  items: z.array(ItemRequisitionSchema).min(1, "Minimal pilih 1 barang")
})

const InboundSchema = z.object({
  no_dokumen: z.string().min(1, "Nomor dokumen wajib diisi"),
  tanggal_masuk: z.string().min(1, "Tanggal masuk wajib diisi"),
  supplier: z.string().min(1, "Supplier wajib diisi"),
  penerima: z.string().min(1, "Penerima wajib diisi"),
  keterangan: z.string().optional(),
  items: z.array(ItemInboundSchema).min(1, "Minimal pilih 1 barang")
})

// --- ACTIONS ---
export async function createRequisition(rawData: unknown) {
  try {
    const data = RequisitionSchema.parse(rawData);

    const result = await prisma.$transaction(async (tx) => {
      const existingForm = await tx.requisitionHeader.findUnique({
        where: { no_dokumen: data.no_dokumen }
      })
      if (existingForm) throw new Error("Nomor Dokumen ini sudah pernah diinput!")

      for (const item of data.items) {
        // UPDATE MASTER BARANG: Kurangi stok dan update sisa nomorator
        const updatedBarang = await tx.barang.update({
          where: { id: item.barangId },
          data: { 
            stok: { decrement: item.qty },
            ...(item.nomorator ? { nomorator: item.nomorator } : {})
          }
        })

        if (updatedBarang.stok < 0) {
          throw new Error(`Stok ${updatedBarang.nama_barang} tidak mencukupi! Kurang ${Math.abs(updatedBarang.stok)} lagi.`)
        }
      }

      const transaksi = await tx.requisitionHeader.create({
        data: {
          media_request: data.media_request,
          no_dokumen: data.no_dokumen,
          tanggal_dokumen: new Date(data.tanggal_dokumen),
          cabang: data.cabang,
          tanggal_request: new Date(data.tanggal_request),
          jenis_permintaan: data.jenis_permintaan,
          pic_nama: data.pic_nama,
          status: data.status, // <--- TAMBAHAN: Simpan status ke database
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

    revalidatePath("/") // Revalidate dashboard agar list packing update
    revalidatePath("/master-barang")
    revalidatePath("/barang-keluar")
    revalidatePath("/laporan")

    return { success: true, message: "Form berhasil disimpan dan stok dipotong!", data: result }

  } catch (error: unknown) {
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0].message }
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan sistem" }
  }
}

export async function createInbound(rawData: unknown) {
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
          data: { 
            stok: { increment: item.qty },
            ...(item.nomorator ? { nomorator: item.nomorator } : {}),
            harga_satuan: item.harga_satuan,
            supplier: data.supplier
          }
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

    return { success: true, message: "Sukses! Stok dan Master Data berhasil diperbarui.", data: result }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0].message }
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan sistem" }
  }
}

// --- TAMBAHAN BARU: FUNGSI UNTUK UPDATE STATUS PACKING KE DIKIRIM ---
export async function updateStatusRequisition(id: string, newStatus: string) {
  try {
    await prisma.requisitionHeader.update({
      where: { id },
      data: { status: newStatus }
    });
    
    // Refresh halaman dashboard dan barang keluar biar datanya realtime
    revalidatePath("/");
    revalidatePath("/barang-keluar");
    
    return { success: true, message: "Status berhasil diupdate!" };
  } catch (error) {
    return { success: false, error: "Gagal mengupdate status" };
  }
}

// Tambahkan fungsi ini di Paling Bawah file src/actions/transaksi.ts

export async function getRequisitions() {
  try {
    const data = await prisma.requisitionHeader.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { barang: true } } }
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Gagal mengambil data monitoring" };
  }
}