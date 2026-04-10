"use server"

import { prisma } from "@/lib/prisma"

export async function getDashboardStats() {
  try {
    // 1. Hitung Total Jenis Barang
    const totalBarang = await prisma.barang.count();

    // 2. Hitung Transaksi Masuk & Keluar Hari Ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const trxKeluarHariIni = await prisma.requisitionHeader.count({
      where: { createdAt: { gte: today } }
    });
    
    const trxMasukHariIni = await prisma.inboundHeader.count({
      where: { createdAt: { gte: today } }
    });

    // 3. Hitung Barang yang Stoknya Menipis (Di bawah 10)
    const stokMenipis = await prisma.barang.count({
      where: { stok: { lt: 10 } }
    });

    // 4. Ambil 5 Barang dengan Stok Paling Sedikit untuk Grafik
    const grafikStok = await prisma.barang.findMany({
      orderBy: { stok: 'asc' },
      take: 5,
      select: { nama_barang: true, stok: true }
    });

    return { 
      success: true, 
      data: { 
        totalBarang, 
        trxHariIni: trxKeluarHariIni + trxMasukHariIni, 
        stokMenipis,
        grafikStok
      },
      error: undefined
    };
  } catch (error) {
    return { success: false, data: null, error: "Gagal mengambil data dashboard" };
  }
}