import { prisma } from "@/lib/prisma";
import { FileText, Calendar, User, Building } from "lucide-react";

export default async function Laporan() {
  // Tarik data riwayat langsung dari database
  const riwayat = await prisma.requisitionHeader.findMany({
    orderBy: { tanggal: 'desc' },
    include: {
      items: {
        include: { barang: true }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <FileText className="w-8 h-8 text-amber-400" />
          Laporan Barang Keluar
        </h2>
        <p className="text-slate-400">Riwayat pengeluaran stok berdasarkan Requisition Form.</p>
      </div>

      <div className="space-y-4">
        {!riwayat.length ? (
          <div className="p-8 text-center bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
            <p className="text-slate-400">Belum ada riwayat transaksi barang keluar.</p>
          </div>
        ) : (
          riwayat.map((r) => (
            <div key={r.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-indigo-300">{r.no_form}</h3>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-400">
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(r.tanggal))}</span>
                    <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> PIC: {r.pic_nama}</span>
                    <span className="flex items-center gap-1.5"><Building className="w-4 h-4" /> Dept: {r.departemen}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Rincian Barang:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {r.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-black/20 px-4 py-2.5 rounded-xl border border-white/5">
                      <span className="text-slate-300 text-sm">{item.barang.kode_barang} - {item.barang.nama_barang}</span>
                      <span className="text-white font-bold text-sm bg-indigo-500/20 px-2 py-1 rounded-md border border-indigo-500/30">
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
  );
}