import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("⏳ Memulai reset data Gudang & Logistik...")

  // 1. Hapus detail transaksi dulu untuk menghindari konflik relasi
  await prisma.requisitionDetail.deleteMany({})
  await prisma.inboundDetail.deleteMany({})

  // 2. Hapus header transaksi
  await prisma.requisitionHeader.deleteMany({})
  await prisma.inboundHeader.deleteMany({})

  // 3. Hapus master barang terakhir
  await prisma.barang.deleteMany({})

  console.log("✅ Reset sukses! Semua data Barang, Inbound, dan Requisition sudah kosong.")
  console.log("🔒 Data Manajemen Aset dan User dipastikan aman.")
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })