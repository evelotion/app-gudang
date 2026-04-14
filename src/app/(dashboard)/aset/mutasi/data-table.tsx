"use client";

import { PackageOpen } from "lucide-react";

interface MutasiProps {
  data: any[];
  onEdit?: (item: any) => void;
  onRefresh?: () => void;
}

export default function DataTableMutasi({ data }: MutasiProps) {
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
        <PackageOpen className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium text-center">Belum ada data mutasi untuk tanggal ini.</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600">
            <tr>
              <th className="px-5 py-4 font-bold">No</th>
              <th className="px-5 py-4 font-bold">Tgl Mutasi</th>
              <th className="px-5 py-4 font-bold">No. Register</th>
              <th className="px-5 py-4 font-bold">Nama Aset</th>
              <th className="px-5 py-4 font-bold">Gol</th>
              <th className="px-5 py-4 font-bold text-center">Jml</th>
              <th className="px-5 py-4 font-bold text-right">Harga Perolehan</th>
              <th className="px-5 py-4 font-bold text-right">Akm. Penyusutan</th>
              <th className="px-5 py-4 font-bold">Lokasi Awal</th>
              <th className="px-5 py-4 font-bold">Lokasi Tujuan</th>
              <th className="px-5 py-4 font-bold">Alasan Mutasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item, index) => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-4 font-medium text-slate-500">{index + 1}</td>
                <td className="px-5 py-4 text-slate-600">
                  {new Date(item.tanggalMutasi).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-5 py-4 font-mono text-xs text-slate-500">{item.nomorRegisterAset}</td>
                <td className="px-5 py-4 font-bold text-slate-800">{item.namaAset}</td>
                <td className="px-5 py-4 text-slate-600">{item.golonganAset}</td>
                <td className="px-5 py-4 text-center font-bold text-slate-700">{item.jumlah}</td>
                <td className="px-5 py-4 text-right font-semibold text-slate-700">{formatRupiah(item.hargaPerolehan)}</td>
                <td className="px-5 py-4 text-right font-semibold text-rose-600">{formatRupiah(item.akmPenyusutan)}</td>
                <td className="px-5 py-4 font-medium text-amber-600 bg-amber-50/30">{item.lokasiAwal}</td>
                <td className="px-5 py-4 font-medium text-emerald-600 bg-emerald-50/30">{item.lokasiTujuan}</td>
                <td className="px-5 py-4 text-slate-600 truncate max-w-[200px]" title={item.alasanMutasi}>
                  {item.alasanMutasi}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}