"use client";

import { useState } from "react";
import { X, Loader2, Save, ListChecks } from "lucide-react";
import { updateBulkMutasiAset } from "@/actions/aset";
import { toast } from "sonner";
import Modal from "@/components/Modal";

export default function FormBulkEditMutasi({ selectedData, onSuccess, onCancel }: { selectedData: any[], onSuccess: () => void, onCancel: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState(selectedData.map(item => ({
    ...item,
    tanggalMutasi: item.tanggalMutasi ? new Date(item.tanggalMutasi).toISOString().split('T')[0] : "",
  })));

  const handleInputChange = (index: number, field: string, value: string) => {
    const newData = [...formData];
    (newData[index] as any)[field] = value;
    setFormData(newData);
  };

  const onSubmit = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading(`Menyimpan ${formData.length} data mutasi...`);

    try {
      const res = await updateBulkMutasiAset(formData);
      if (res?.success) {
        toast.success(res.message, { id: toastId });
        onSuccess();
      } else {
        toast.error(res?.message || "Terjadi kesalahan", { id: toastId });
      }
    } catch (error) {
      toast.error("Gagal menyimpan data massal.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[95vh]">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-indigo-50/30 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><ListChecks className="w-5 h-5"/></div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Edit Massal Mutasi</h2>
              <p className="text-xs text-slate-500 mt-0.5">Edit data langsung di dalam tabel. Pastikan format tanggal sesuai.</p>
            </div>
          </div>
          <button type="button" onClick={onCancel} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABLE EDIT AREA */}
        <div className="p-0 overflow-y-auto overflow-x-auto flex-grow custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="bg-slate-100 text-[11px] uppercase font-bold text-slate-600 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-3 border-b border-slate-200">No</th>
                <th className="p-3 border-b border-slate-200 w-[140px]">Tgl Mutasi</th>
                <th className="p-3 border-b border-slate-200">No Register</th>
                <th className="p-3 border-b border-slate-200 min-w-[200px]">Nama Aset</th>
                <th className="p-3 border-b border-slate-200 w-[80px]">Jml</th>
                <th className="p-3 border-b border-slate-200">Lokasi Awal</th>
                <th className="p-3 border-b border-slate-200">Lokasi Tujuan</th>
                <th className="p-3 border-b border-slate-200 min-w-[200px]">Alasan</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-700 bg-white">
              {formData.map((row, idx) => (
                <tr key={row.id} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                  <td className="p-3 font-medium text-slate-400">{idx + 1}</td>
                  <td className="p-2">
                    <input type="date" value={row.tanggalMutasi} onChange={(e) => handleInputChange(idx, 'tanggalMutasi', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                  </td>
                  <td className="p-2">
                    <input type="text" value={row.nomorRegisterAset} onChange={(e) => handleInputChange(idx, 'nomorRegisterAset', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                  </td>
                  <td className="p-2">
                    <input type="text" value={row.namaAset} onChange={(e) => handleInputChange(idx, 'namaAset', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                  </td>
                  <td className="p-2">
                    <input type="number" value={row.jumlah} onChange={(e) => handleInputChange(idx, 'jumlah', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                  </td>
                  <td className="p-2">
                    <input type="text" value={row.lokasiAwal || row.cabangAsal} onChange={(e) => handleInputChange(idx, 'lokasiAwal', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                  </td>
                  <td className="p-2">
                    <input type="text" value={row.lokasiTujuan || row.cabangTujuan} onChange={(e) => handleInputChange(idx, 'lokasiTujuan', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                  </td>
                  <td className="p-2">
                    <input type="text" value={row.alasanMutasi} onChange={(e) => handleInputChange(idx, 'alasanMutasi', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex justify-end gap-3 p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex-shrink-0">
          <button type="button" onClick={onCancel} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition-colors">
            Batal
          </button>
          <button onClick={onSubmit} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
    </Modal>
  );
}