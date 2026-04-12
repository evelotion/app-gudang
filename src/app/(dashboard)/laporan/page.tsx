import { prisma } from "@/lib/prisma";
import { FileText, Calendar, User, Building, Inbox, Archive } from "lucide-react";
import ExportButton from "./ExportButton";

export default async function Laporan() {
  // 1. Fetch data Master Stok (Untuk laporan format .PRN)
  const persediaan = await prisma.barang.findMany({
    orderBy: { kode_barang: 'asc' }
  });

  // 2. Fetch data Riwayat Barang Keluar
  const riwayat = await prisma.requisitionHeader.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { barang: true } } }
  });

  return (
    <div className="space-y-8 pb-10 max-w-6xl mx-auto">
      
      {/* SECTION 1: LAPORAN PERSEDIAAN (MASTER STOK) */}
      <div className="bg-white/80 backdrop-blur-xl shadow-sm border border-slate-200/60 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* Dekorasi Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-2 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 rounded-xl">
                <Archive className="w-6 h-6 text-emerald-600" />
              </div>
              Daftar Stok / Persediaan
            </h2>
            <p className="text-slate-500 text-sm md:text-base font-medium">Laporan master data inventaris lengkap dengan format standar bank.</p>
          </div>
          
          {/* Export Persediaan */}
          <ExportButton type="persediaan" data={persediaan} />
        </div>
      </div>

      {/* SECTION 2: LAPORAN BARANG KELUAR */}
      <div className="bg-white/80 backdrop-blur-xl shadow-sm border border-slate-200/60 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8 border-b border-slate-100 pb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-2 flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 rounded-xl">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              Riwayat Barang Keluar
            </h2>
            <p className="text-slate-500 text-sm md:text-base font-medium">Histori pengeluaran barang dan potong stok cabang.</p>
          </div>
          
          {/* Export Riwayat */}
          <ExportButton type="keluar" data={riwayat} />
        </div>

        <div className="space-y-5">
          {!riwayat.length ? (
            <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center">
              <Inbox className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Belum ada riwayat transaksi barang keluar.</p>
            </div>
          ) : (
            riwayat.map((r) => (
              <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-md transition-all duration-300">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                  <div className="space-y-3 w-full">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-extrabold text-indigo-700">{r.no_dokumen}</h3>
                        <span className="px-3 py-1 rounded-lg text-[11px] font-extrabold tracking-wider uppercase bg-indigo-50 text-indigo-600 border border-indigo-100">
                          {r.jenis_permintaan}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="flex items-center gap-2.5 font-medium"><Inbox className="w-4 h-4 text-slate-400" /> {r.media_request}</span>
                      <span className="flex items-center gap-2.5 font-medium"><Building className="w-4 h-4 text-slate-400" /> <strong className="text-slate-800">{r.cabang}</strong></span>
                      <span className="flex items-center gap-2.5 font-medium"><Calendar className="w-4 h-4 text-slate-400" /> {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(r.tanggal_request)}</span>
                      <span className="flex items-center gap-2.5 font-medium"><User className="w-4 h-4 text-slate-400" /> <strong className="text-slate-800">{r.pic_nama}</strong></span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Rincian Item Dikeluarkan:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {r.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex flex-col">
                          <span className="text-slate-800 font-bold">{item.barang.nama_barang}</span>
                          <span className="text-slate-400 text-xs font-mono mt-0.5">{item.barang.kode_barang}</span>
                        </div>
                        <span className="text-indigo-700 font-extrabold text-sm bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                          {item.qty_diambil} {item.barang.satuan}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}