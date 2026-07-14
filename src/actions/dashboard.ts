"use server"

import { prisma } from "@/lib/prisma"

export async function getDashboardStats() {
  try {
    const totalBarang = await prisma.barang.count();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const trxKeluarHariIni = await prisma.requisitionHeader.count({
      where: { createdAt: { gte: today } }
    });
    
    const trxMasukHariIni = await prisma.inboundHeader.count({
      where: { createdAt: { gte: today } }
    });

    const stokMenipis = await prisma.barang.count({
      where: { stok: { lt: 10 } }
    });

    const grafikStok = await prisma.barang.findMany({
      orderBy: { stok: 'asc' },
      take: 5,
      select: { nama_barang: true, stok: true }
    });

    // --- FITUR BARU: Ambil data status PACKING ---
    const packingCount = await prisma.requisitionHeader.count({
      where: { status: "PACKING" }
    });

    const packingList = await prisma.requisitionHeader.findMany({
      where: { status: "PACKING" },
      include: { 
        items: { include: { barang: { select: { nama_barang: true } } } } 
      },
      orderBy: { createdAt: 'asc' } // Yang paling lama di-packing muncul duluan
    });

    return { 
      success: true, 
      data: { 
        totalBarang, 
        trxHariIni: trxKeluarHariIni + trxMasukHariIni, 
        stokMenipis,
        grafikStok,
        packingCount, // Dikirim ke frontend
        packingList   // Dikirim ke frontend
      },
      error: undefined
    };
  } catch (error) {
    return { success: false, data: null, error: "Gagal mengambil data dashboard" };
  }
}