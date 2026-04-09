import { getSemuaBarang } from "@/actions/barang";
import { Package } from "lucide-react";

export default async function MasterBarang() {
  const { data: barang, success } = await getSemuaBarang();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Package className="w-8 h-8 text-indigo-400" />
          Master Barang
        </h2>
        <p className="text-slate-400">Daftar seluruh inventaris aset, cetakan, dan ATK.</p>
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/5 text-slate-200 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium">Kode</th>
                <th className="px-6 py-4 font-medium">Nama Barang</th>
                <th className="px-6 py-4 font-medium">Kategori</th>
                <th className="px-6 py-4 font-medium">Stok</th>
                <th className="px-6 py-4 font-medium">Satuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!success || !barang?.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Belum ada data barang.
                  </td>
                </tr>
              ) : (
                barang.map((b) => (
                  <tr key={b.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-indigo-300">{b.kode_barang}</td>
                    <td className="px-6 py-4 text-white">{b.nama_barang}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-800 text-xs border border-white/10">
                        {b.kategori?.nama || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${b.stok < 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {b.stok}
                      </span>
                    </td>
                    <td className="px-6 py-4">{b.satuan}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}