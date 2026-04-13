import { getSemuaBarang } from "@/actions/barang";
import { Package } from "lucide-react";
import { DataTable } from "./data-table";

export default async function MasterBarang() {
  const { data: barang, success } = await getSemuaBarang();

  return (
    // Tambahin margin bottom dan max-width biar konsisten sama halaman lain
    <div className="space-y-8 pb-12 max-w-7xl mx-auto relative">
      
      {/* Header Section - Udah pakai ukuran font global yang baru */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 border-b border-slate-100 pb-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
            <div className="p-2.5 bg-indigo-100 rounded-2xl">
              <Package className="w-7 h-7 text-indigo-600" />
            </div>
            Master Barang
          </h1>
          <p className="text-slate-500 text-sm md:text-base font-medium mt-2">
            Kelola daftar buku tabungan dan item inventaris lainnya.
          </p>
        </div>
      </div>

      {/* Validasi kalau gagal fetch API */}
      {!success ? (
        <div className="p-6 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 font-semibold">
          Gagal memuat data barang dari server. Silakan muat ulang halaman.
        </div>
      ) : (
        /* Tabel dibungkus Card putih biar estetikanya nyambung */
        <div className="bg-white/90 backdrop-blur-xl shadow-sm border border-slate-100 rounded-3xl p-6 md:p-8">
          <DataTable data={barang || []} />
        </div>
      )}
    </div>
  );
}