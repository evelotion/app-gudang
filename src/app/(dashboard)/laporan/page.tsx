import { prisma } from "@/lib/prisma";
import { FileText, Calendar, User, Building, Inbox, TicketCheck } from "lucide-react";
import ExportButton from "./ExportButton"; // <-- Pastikan tombol ini pakai desain yang seragam

export default async function Laporan() {
  const riwayat = await prisma.requisitionHeader.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { barang: true } } }
  });

  return (
    // 1. Tambahkan spacing utama biar nggak sesak (gap-y-10)
    <div className="space-y-10 pb-12 max-w-7xl mx-auto relative">
      
      {/* Dekorasi Background Halus */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />

      {/* Header dengan Tombol Export - Beri margin bottom (mb-10) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 border-b border-slate-100 pb-6 mb-10">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 rounded-2xl">
              <FileText className="w-7 h-7 text-amber-600" />
            </div>
            Laporan Barang Keluar
          </h2>
          <p className="text-slate-500 text-sm md:text-base font-medium mt-1">Riwayat lengkap pengeluaran stok berdasarkan Media Request.</p>
        </div>
        
        {/* Render tombol export */}
        <div className="shrink-0">
          <ExportButton riwayat={riwayat} />
        </div>
      </div>

      {/* Daftar Kartu Riwayat */}
      <div className="space-y-8">
        {!riwayat.length ? (
          <div className="p-16 text-center bg-white border border-slate-200 border-dashed rounded-3xl shadow-sm">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-semibold text-lg">Belum ada riwayat transaksi barang keluar.</p>
          </div>
        ) : (
          riwayat.map((r) => (
            // 2. Tambah Padding Kartu (p-8) dan Shadow yang Halus
            <div key={r.id} className="bg-white/90 backdrop-blur-xl shadow-lg shadow-slate-900/5 border border-slate-100 rounded-3xl p-8 hover:border-indigo-100 hover:shadow-xl transition-all duration-300">
              
              {/* Header Kartu (Doc No & Tgl) - Beri margin bottom (mb-6) */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                    <TicketCheck className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xl font-extrabold text-indigo-700 tracking-tight">{r.no_dokumen}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">Dibuat: {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(r.createdAt)}</p>
                  </div>
                </div>
                <span className="px-4 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {r.jenis_permintaan}
                </span>
              </div>

              {/* 3. GROUPING INFORMASI META - Bikin grid yang rapi dengan padding yang lega */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-slate-50 border border-slate-100 rounded-2xl mb-8">
                <div className="flex items-center gap-3">
                  <Inbox className="w-5 h-5 text-slate-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Media Request</span>
                    <span className="text-slate-900 font-bold text-sm truncate" title={r.media_request}>{r.media_request}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-slate-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cabang / Unit</span>
                    <span className="text-slate-900 font-bold text-sm truncate" title={r.cabang}>{r.cabang}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tanggal Request</span>
                    <span className="text-slate-900 font-bold text-sm">{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(r.tanggal_request)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">PIC Pengambil</span>
                    <span className="text-slate-900 font-bold text-sm truncate" title={r.pic_nama}>{r.pic_nama}</span>
                  </div>
                </div>
              </div>

              {/* 4. Rincian Item Dikeluarkan - Desain yang clean dan premium */}
              <div>
                <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 px-1">Rincian Item Dikeluarkan</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {r.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center font-bold text-indigo-600 text-lg shadow-inner">
                          {item.qty_diambil}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-slate-800 font-bold text-sm truncate" title={item.barang.nama_barang}>
                            {item.barang.nama_barang}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 mt-1">Kode: {item.barang.kode_barang}</span>
                        </div>
                      </div>
                      <span className="shrink-0 inline-block px-3 py-1.5 rounded-lg text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100">
                        {item.barang.satuan}
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
  );
}