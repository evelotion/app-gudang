"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Save, Loader2, Info } from "lucide-react";
import { createHapusBukuAset, updateHapusBukuAset } from "@/actions/aset"; 

// Schema lokal khusus form (semua string) untuk nerima multi-line/paste dari Excel
const bulkHapusBukuSchema = z.object({
  tanggalInput: z.string().min(1, "Wajib diisi"), // <--- TAMBAHAN BATCH DATE
  tanggalHapusBuku: z.string().min(1, "Wajib diisi"),
  nomorRegisterAset: z.string().min(1, "Wajib diisi"),
  namaAset: z.string().min(1, "Wajib diisi"),
  golonganAset: z.string().min(1, "Wajib diisi"),
  jumlah: z.string().min(1, "Wajib diisi"),
  tanggalPerolehan: z.string().min(1, "Wajib diisi"),
  hargaPerolehan: z.string().min(1, "Wajib diisi"),
  akmPenyusutan: z.string().min(1, "Wajib diisi"),
  nilaiBuku: z.string().min(1, "Wajib diisi"),
  cabangUnitKerja: z.string().min(1, "Wajib diisi"),
  alasanHapusBuku: z.string().min(1, "Wajib diisi"),
  operatorName: z.string().min(1, "Wajib diisi"),
  supervisorName: z.string().optional(),
});

type FormValues = z.infer<typeof bulkHapusBukuSchema>;

export default function FormHapusBuku({ initialData, onSuccess, onCancel }: { initialData?: any, onSuccess: () => void, onCancel: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(bulkHapusBukuSchema),
    defaultValues: initialData ? {
      ...initialData,
      jumlah: String(initialData.jumlah),
      hargaPerolehan: String(initialData.hargaPerolehan),
      akmPenyusutan: String(initialData.akmPenyusutan),
      nilaiBuku: String(initialData.nilaiBuku),
      tanggalInput: new Date(initialData.tanggalInput).toISOString().split('T')[0], // <--- DEFAULT BATCH DATE
      tanggalHapusBuku: new Date(initialData.tanggalHapusBuku).toISOString().split('T')[0],
      tanggalPerolehan: new Date(initialData.tanggalPerolehan).toISOString().split('T')[0],
    } : {
      tanggalInput: new Date().toISOString().split('T')[0], // <--- DEFAULT HARI INI
      jumlah: "1", hargaPerolehan: "0", akmPenyusutan: "0", nilaiBuku: "0", operatorName: "Indra Dwi Ananda"
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      const splitLines = (str: string) => str.split('\n').map(s => s.trim()).filter(Boolean);
      
      const tglHapus = splitLines(data.tanggalHapusBuku);
      const noReg = splitLines(data.nomorRegisterAset);
      const nama = splitLines(data.namaAset);
      const gol = splitLines(data.golonganAset);
      const jml = splitLines(data.jumlah);
      const tglPerolehan = splitLines(data.tanggalPerolehan);
      const hrg = splitLines(data.hargaPerolehan);
      const akm = splitLines(data.akmPenyusutan);
      const nBuku = splitLines(data.nilaiBuku);
      const cabang = splitLines(data.cabangUnitKerja);
      const alasan = splitLines(data.alasanHapusBuku);
      
      const maxRows = Math.max(noReg.length, nama.length, tglHapus.length, hrg.length, alasan.length);
      
      for (let i = 0; i < maxRows; i++) {
        const payload = {
          tanggalInput: new Date(data.tanggalInput), // <--- TERAPKAN KE SEMUA BARIS YANG DIPASTE
          tanggalHapusBuku: new Date(tglHapus[i] || tglHapus[0] || new Date()),
          nomorRegisterAset: noReg[i] || noReg[0] || "-",
          namaAset: nama[i] || nama[0] || "-",
          golonganAset: gol[i] || gol[0] || "-",
          jumlah: Number(jml[i] || jml[0] || 1),
          tanggalPerolehan: new Date(tglPerolehan[i] || tglPerolehan[0] || new Date()),
          hargaPerolehan: Number(hrg[i] || hrg[0] || 0),
          akmPenyusutan: Number(akm[i] || akm[0] || 0),
          nilaiBuku: Number(nBuku[i] || nBuku[0] || 0),
          cabangUnitKerja: cabang[i] || cabang[0] || "-",
          alasanHapusBuku: alasan[i] || alasan[0] || "-",
          operatorName: data.operatorName,
          supervisorName: data.supervisorName || ""
        };
        
        if (initialData) {
          await updateHapusBukuAset(initialData.id, payload as any);
        } else {
          await createHapusBukuAset(payload as any);
        }
      }
      onSuccess();
    } catch (error) {
      alert("Terjadi kesalahan sistem saat menyimpan data hapus buku.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {initialData ? "Edit Hapus Buku Aset" : "Tambah Hapus Buku (Bulk Insert)"}
            </h2>
            {!initialData && (
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" /> Paste data dari kolom Excel langsung ke dalam form di bawah.
              </p>
            )}
          </div>
          <button onClick={onCancel} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="hapusForm" onSubmit={handleSubmit(onSubmit)} className="space-y-5"> 
            
            {/* UI BATCH DATE BARU (Nuansa Merah/Rose) */}
            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 mb-6">
              <label className="text-sm font-bold text-rose-900 block mb-2">Tanggal Input Sistem (Batch Date)</label>
              <input type="date" {...register("tanggalInput")} className="w-full md:w-1/3 text-sm p-2.5 border border-rose-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500" />
              <p className="text-xs text-rose-600 mt-1">Tanggal ini digunakan untuk mengelompokkan data saat dicetak (Bisa di-backdate).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Tgl Hapus Buku</label><textarea {...register("tanggalHapusBuku")} rows={2} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-y" placeholder="2026-04-13" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Nomor Register</label><textarea {...register("nomorRegisterAset")} rows={2} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-y" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Nama Aset</label><textarea {...register("namaAset")} rows={2} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-y" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Golongan</label><textarea {...register("golonganAset")} rows={2} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-y" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Jumlah (Qty)</label><textarea {...register("jumlah")} rows={2} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-y" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Tgl Perolehan</label><textarea {...register("tanggalPerolehan")} rows={2} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-y" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Harga Perolehan (Rp)</label><textarea {...register("hargaPerolehan")} rows={2} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-y" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Akm. Penyusutan (Rp)</label><textarea {...register("akmPenyusutan")} rows={2} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-y" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Nilai Buku (Rp)</label><textarea {...register("nilaiBuku")} rows={2} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-y" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Cabang/Unit Kerja</label><textarea {...register("cabangUnitKerja")} rows={2} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-y" /></div>
              <div className="space-y-1 md:col-span-2"><label className="text-xs font-semibold text-slate-700">Alasan Hapus Buku</label><textarea {...register("alasanHapusBuku")} rows={2} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-y" placeholder="Cth: Rusak Berat" /></div>
              
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Nama Operator</label><input {...register("operatorName")} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none bg-slate-50" readOnly /></div>
              <div className="space-y-1 md:col-span-2"><label className="text-xs font-semibold text-slate-700">Nama Supervisi (Opsional)</label><input {...register("supervisorName")} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" /></div>
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button type="button" onClick={onCancel} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-sm">Batal</button>
          <button form="hapusForm" type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm disabled:opacity-70">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {initialData ? "Simpan Perubahan" : "Simpan Data"}
          </button>
        </div>
      </div>
    </div>
  );
}