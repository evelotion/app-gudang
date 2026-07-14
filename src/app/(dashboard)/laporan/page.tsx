// src/app/(dashboard)/laporan/page.tsx
import { prisma } from "@/lib/prisma";
import { Archive, PackagePlus, ArrowRightLeft } from "lucide-react";
import ExportButton from "./ExportButton";
import FilterBulan from "./FilterBulan";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export default async function Laporan({ searchParams }: { searchParams: Promise<{ bulan?: string }> }) {
  const params = await searchParams;
  
  const today = new Date();
  const defaultBulan = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const selectedBulan = params.bulan || defaultBulan;

  // Cek apakah user meminta semua data
  const isAllTime = selectedBulan === "all";

  let startDate, endDate, namaBulan;

  if (!isAllTime) {
    const [year, month] = selectedBulan.split('-');
    startDate = new Date(Number(year), Number(month) - 1, 1);
    endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
    namaBulan = new Date(Number(year), Number(month) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  } else {
    namaBulan = "Keseluruhan Waktu";
  }

  // 1. Fetch data Master Stok
  const persediaan = await prisma.barang.findMany({
    orderBy: { kode_barang: 'asc' }
  });

  // 2. Fetch data Barang Masuk (Kondisional filter tanggal)
  const riwayatMasuk = await prisma.inboundHeader.findMany({
    where: isAllTime ? {} : { 
      tanggal_masuk: { gte: startDate, lte: endDate } 
    },
    orderBy: { tanggal_masuk: 'desc' },
    include: { items: { include: { barang: true } } }
  });

  // 3. Fetch data Barang Keluar (Kondisional filter tanggal)
  const riwayatKeluar = await prisma.requisitionHeader.findMany({
    where: isAllTime ? {} : { 
      tanggal_request: { gte: startDate, lte: endDate } 
    },
    orderBy: { tanggal_request: 'desc' },
    include: { items: { include: { barang: true } } }
  });

  return (
    <main className="flex-1 p-6 lg:p-10 w-full max-w-[1600px] mx-auto space-y-8 pb-12">
      
      <PageHeader 
        title="Pusat Unduh Laporan" 
        description="Unduh rekapitulasi data gudang dalam format Excel."
        actions={<FilterBulan currentBulan={selectedBulan} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: STOK TERKINI */}
        <Card className="relative overflow-hidden group flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Archive className="w-32 h-32" />
          </div>
          <CardContent className="p-6 flex flex-col h-full z-10 relative">
            <div className="p-3 bg-emerald-100 w-fit rounded-xl mb-4">
              <Archive className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Persediaan (Stok Terkini)</h3>
            <p className="text-sm text-slate-500 mt-2 mb-6 flex-1">
              Laporan <i>real-time</i> sisa stok barang, harga perolehan, dan minimum stok.
            </p>
            <ExportButton type="persediaan" data={persediaan} />
          </CardContent>
        </Card>

        {/* CARD 2: BARANG MASUK */}
        <Card className="relative overflow-hidden group flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <PackagePlus className="w-32 h-32" />
          </div>
          <CardContent className="p-6 flex flex-col h-full z-10 relative">
            <div className="p-3 bg-blue-100 w-fit rounded-xl mb-4">
              <PackagePlus className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Laporan Barang Masuk</h3>
            <p className="text-sm text-slate-500 mt-2 mb-4 flex-1">
              Rekap histori barang masuk dari Supplier untuk periode <strong className="text-slate-700">{namaBulan}</strong>.
            </p>
            <div className="flex items-center justify-between mb-4 px-3 py-2 bg-slate-50/80 rounded-lg border border-slate-100">
              <span className="text-xs font-bold text-slate-500">Total Transaksi</span>
              <span className="text-sm font-black text-blue-600">{riwayatMasuk.length}</span>
            </div>
            <ExportButton type="masuk" data={riwayatMasuk} disabled={riwayatMasuk.length === 0} />
          </CardContent>
        </Card>

        {/* CARD 3: BARANG KELUAR */}
        <Card className="relative overflow-hidden group flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ArrowRightLeft className="w-32 h-32" />
          </div>
          <CardContent className="p-6 flex flex-col h-full z-10 relative">
            <div className="p-3 bg-amber-100 w-fit rounded-xl mb-4">
              <ArrowRightLeft className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Laporan Barang Keluar</h3>
            <p className="text-sm text-slate-500 mt-2 mb-4 flex-1">
              Rekap distribusi barang ke Cabang/Unit Kerja untuk periode <strong className="text-slate-700">{namaBulan}</strong>.
            </p>
            <div className="flex items-center justify-between mb-4 px-3 py-2 bg-slate-50/80 rounded-lg border border-slate-100">
              <span className="text-xs font-bold text-slate-500">Total Transaksi</span>
              <span className="text-sm font-black text-amber-600">{riwayatKeluar.length}</span>
            </div>
            <ExportButton type="keluar" data={riwayatKeluar} disabled={riwayatKeluar.length === 0} />
          </CardContent>
        </Card>

      </div>
    </main>
  );
}