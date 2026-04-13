import { prisma } from "@/lib/prisma";
import { Archive, PackagePlus, ArrowRightLeft, FileSpreadsheet } from "lucide-react";
import ExportButton from "./ExportButton";
import FilterBulan from "./FilterBulan";

// Di Next.js 15+, searchParams adalah Promise
export default async function Laporan({ searchParams }: { searchParams: Promise<{ bulan?: string }> }) {
  const params = await searchParams;
  
  // Set default bulan ke bulan ini jika tidak ada di URL
  const today = new Date();
  const defaultBulan = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const selectedBulan = params.bulan || defaultBulan;

  // Hitung rentang tanggal (Awal bulan s/d Akhir bulan)
  const [year, month] = selectedBulan.split('-');
  const startDate = new Date(Number(year), Number(month) - 1, 1);
  const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);

  // 1. Fetch data Master Stok (Selalu data terkini, tidak terpengaruh bulan)
  const persediaan = await prisma.barang.findMany({
    orderBy: { kode_barang: 'asc' }
  });

  // 2. Fetch data Barang Masuk (Ter-filter bulan)
  const riwayatMasuk = await prisma.inboundHeader.findMany({
    where: { 
      tanggal_masuk: { gte: startDate, lte: endDate } 
    },
    orderBy: { tanggal_masuk: 'desc' },
    include: { items: { include: { barang: true } } }
  });

  // 3. Fetch data Barang Keluar (Ter-filter bulan)
  const riwayatKeluar = await prisma.requisitionHeader.findMany({
    where: { 
      tanggal_request: { gte: startDate, lte: endDate } 
    },
    orderBy: { tanggal_request: 'desc' },
    include: { items: { include: { barang: true } } }
  });

  // Nama bulan untuk display UI
  const namaBulan = new Date(Number(year), Number(month) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto relative mt-4">
      {/* Header & Filter Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
            <FileSpreadsheet className="w-7 h-7 text-indigo-600" />
            Pusat Unduh Laporan
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Unduh rekapitulasi data gudang dalam format Excel.
          </p>
        </div>
        
        {/* Render Client Component Filter Bulan */}
        <FilterBulan currentBulan={selectedBulan} />
      </div>

      {/* Grid Menu Laporan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: STOK TERKINI */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col h-full relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Archive className="w-32 h-32" />
          </div>
          <div className="p-3 bg-emerald-100 w-fit rounded-xl mb-4">
            <Archive className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Persediaan (Stok Terkini)</h3>
          <p className="text-sm text-slate-500 mt-2 mb-6 flex-1">
            Laporan *real-time* sisa stok barang, harga perolehan, dan minimum stok.
          </p>
          <ExportButton type="persediaan" data={persediaan} />
        </div>

        {/* CARD 2: BARANG MASUK */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col h-full relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <PackagePlus className="w-32 h-32" />
          </div>
          <div className="p-3 bg-blue-100 w-fit rounded-xl mb-4">
            <PackagePlus className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Laporan Barang Masuk</h3>
          <p className="text-sm text-slate-500 mt-2 mb-4 flex-1">
            Rekap histori barang masuk dari Supplier untuk periode <strong className="text-slate-700">{namaBulan}</strong>.
          </p>
          <div className="flex items-center justify-between mb-4 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs font-bold text-slate-400">Total Transaksi</span>
            <span className="text-sm font-black text-blue-600">{riwayatMasuk.length}</span>
          </div>
          <ExportButton type="masuk" data={riwayatMasuk} disabled={riwayatMasuk.length === 0} />
        </div>

        {/* CARD 3: BARANG KELUAR */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col h-full relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ArrowRightLeft className="w-32 h-32" />
          </div>
          <div className="p-3 bg-amber-100 w-fit rounded-xl mb-4">
            <ArrowRightLeft className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Laporan Barang Keluar</h3>
          <p className="text-sm text-slate-500 mt-2 mb-4 flex-1">
            Rekap distribusi barang ke Cabang/Unit Kerja untuk periode <strong className="text-slate-700">{namaBulan}</strong>.
          </p>
          <div className="flex items-center justify-between mb-4 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs font-bold text-slate-400">Total Transaksi</span>
            <span className="text-sm font-black text-amber-600">{riwayatKeluar.length}</span>
          </div>
          <ExportButton type="keluar" data={riwayatKeluar} disabled={riwayatKeluar.length === 0} />
        </div>

      </div>
    </div>
  );
}