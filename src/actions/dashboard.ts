"use server"

import { prisma } from "@/lib/prisma"

export async function getDashboardStats() {
  try {
    const [totalRegistrasi, totalHapusBuku, totalMutasi] = await Promise.all([
      prisma.registrasiAset.count(),
      prisma.hapusBukuAset.count(),
      prisma.mutasiAset.count(),
    ]);

    const [pendingRegistrasi, pendingHapusBuku, pendingMutasi] = await Promise.all([
      prisma.registrasiAset.count({ where: { status: "PENDING" } }),
      prisma.hapusBukuAset.count({ where: { status: "PENDING" } }),
      prisma.mutasiAset.count({ where: { status: "PENDING" } }),
    ]);

    const [recentRegistrasi, recentHapusBuku, recentMutasi] = await Promise.all([
      prisma.registrasiAset.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, namaAset: true, nomorRegisterAset: true, status: true, createdAt: true },
      }),
      prisma.hapusBukuAset.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, namaAset: true, nomorRegisterAset: true, status: true, createdAt: true },
      }),
      prisma.mutasiAset.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, namaAset: true, nomorRegisterAset: true, status: true, createdAt: true },
      }),
    ]);

    const recentActivity = [
      ...recentRegistrasi.map((item) => ({ ...item, jenis: "Registrasi Baru" as const, path: "/aset/registrasi-baru" }),),
      ...recentHapusBuku.map((item) => ({ ...item, jenis: "Hapus Buku" as const, path: "/aset/hapus-buku" }),),
      ...recentMutasi.map((item) => ({ ...item, jenis: "Mutasi Aset" as const, path: "/aset/mutasi" }),),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 8);

    return {
      success: true,
      data: {
        totalRegistrasi,
        totalHapusBuku,
        totalMutasi,
        totalPending: pendingRegistrasi + pendingHapusBuku + pendingMutasi,
        pendingRegistrasi,
        pendingHapusBuku,
        pendingMutasi,
        recentActivity,
      },
      error: undefined,
    };
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return { success: false, data: null, error: "Gagal mengambil data dashboard" };
  }
}
