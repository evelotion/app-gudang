import { getSemuaBarang } from "@/actions/barang";
import { Package } from "lucide-react";
import { DataTable } from "./data-table"; // Import komponen tabel yang baru kita bikin

export default async function MasterBarang() {
  const { data: barang, success } = await getSemuaBarang();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Package className="w-8 h-8 text-indigo-500" />
          Master Barang
        </h2>
        <p className="text-slate-500">Daftar seluruh inventaris aset, cetakan, dan ATK.</p>
      </div>

      {/* Validasi kalau gagal fetch API */}
      {!success ? (
        <div className="p-4 bg-rose-50 text-rose-500 rounded-xl border border-rose-100 font-medium">
          Gagal memuat data barang dari server.
        </div>
      ) : (
        /* Panggil DataTable dan lempar data barangnya ke sana */
        <DataTable data={barang || []} />
      )}
    </div>
  );
}