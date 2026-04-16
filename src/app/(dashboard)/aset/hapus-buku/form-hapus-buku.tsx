"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Save, Loader2, Info, Eye, ArrowLeft, CheckCircle2 } from "lucide-react";
import { createHapusBukuAset, updateHapusBukuAset } from "@/actions/aset"; 

// Schema lokal khusus form (semua string) untuk nerima multi-line/paste dari Excel
const bulkHapusBukuSchema = z.object({
  tanggalInput: z.string().min(1, "Wajib diisi"), 
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
  
  // ==========================================
  // STATE BARU: UNTUK PREVIEW BULK INSERT
  // ==========================================
  const [showPreview, setShowPreview] = useState(false);
  const [previewRows, setPreviewRows] = useState<any[]>([]);

  // Tambahkan trigger & getValues dari useForm
  const { register, handleSubmit, getValues, trigger, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(bulkHapusBukuSchema),
    defaultValues: initialData ? {
      ...initialData,
      jumlah: String(initialData.jumlah),
      hargaPerolehan: String(initialData.hargaPerolehan),
      akmPenyusutan: String(initialData.akmPenyusutan),
      nilaiBuku: String(initialData.nilaiBuku),
      tanggalInput: new Date(initialData.tanggalInput).toISOString().split('T')[0], 
      tanggalHapusBuku: new Date(initialData.tanggalHapusBuku).toLocaleDateString('en-GB'), // DD/MM/YYYY
      tanggalPerolehan: new Date(initialData.tanggalPerolehan).toLocaleDateString('en-GB'), // DD/MM/YYYY
    } : {
      tanggalInput: new Date().toISOString().split('T')[0], 
      jumlah: "1", hargaPerolehan: "0", akmPenyusutan: "0", nilaiBuku: "0", operatorName: "Indra Dwi Ananda"
    },
  });

  // ==========================================
  // LOGIC BARU: GENERATE DATA PREVIEW
  // ==========================================
  const handleGeneratePreview = async () => {
    const isValid = await trigger(); // Cek validasi Zod dulu
    if (!isValid) return;

    const data = getValues();
    const splitLines = (str: string) => str ? str.split('\n').map(s => s.trim()).filter(Boolean) : [];
    
    const tglHapus = splitLines(data.tanggalHapusBuku);
    const noReg = splitLines(data.nomorRegisterAset);
    const nama = splitLines(data.namaAset);
    const gol = splitLines(data.golonganAset);
    const jml = splitLines(data.jumlah);
    const hrg = splitLines(data.hargaPerolehan);
    const akm = splitLines(data.akmPenyusutan);
    const nBuku = splitLines(data.nilaiBuku);
    const alasan = splitLines(data.alasanHapusBuku);
    
    const maxRows = Math.max(noReg.length, nama.length, tglHapus.length, hrg.length, alasan.length);
    
    const rows = [];
    for (let i = 0; i < maxRows; i++) {
      rows.push({
        tanggalHapusBuku: tglHapus[i] || tglHapus[0] || "-",
        nomorRegisterAset: noReg[i] || noReg[0] || "-",
        namaAset: nama[i] || nama[0] || "-",
        golonganAset: gol[i] || gol[0] || "-",
        jumlah: jml[i] || jml[0] || "1",
        hargaPerolehan: Number(hrg[i] || hrg[0] || 0),
        akmPenyusutan: Number(akm[i] || akm[0] || 0),
        nilaiBuku: Number(nBuku[i] || nBuku[0] || 0),
        alasanHapusBuku: alasan[i] || alasan[0] || "-"
      });
    }

    setPreviewRows(rows);
    setShowPreview(true);
  };

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
      
      // Helper function untuk konversi DD/MM/YYYY ke Date Object
      const parseDateStr = (dateStr: string) => {
        if (dateStr.includes('/')) {
          const [d, m, y] = dateStr.split('/');
          return new Date(`${y}-${m}-${d}T00:00:00Z`);
        }
        return new Date(dateStr); // Fallback ke format YYYY-MM-DD
      };

      for (let i = 0; i < maxRows; i++) {
        const payload = {
          tanggalInput: new Date(data.tanggalInput), 
          tanggalHapusBuku: parseDateStr(tglHapus[i] || tglHapus[0]),
          nomorRegisterAset: noReg[i] || noReg[0] || "-",
          namaAset: nama[i] || nama[0] || "-",
          golonganAset: gol[i] || gol[0] || "-",
          jumlah: Number(jml[i] || jml[0] || 1),
          tanggalPerolehan: parseDateStr(tglPerolehan[i] || tglPerolehan[0]),
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
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER DINAMIS */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            {showPreview && (
              <button type="button" onClick={() => setShowPreview(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {showPreview ? "Preview Data Hapus Buku" : initialData ? "Edit Hapus Buku Aset" : "Tambah Hapus Buku (Bulk Insert)"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {showPreview ? `Menampilkan ${previewRows.length} baris data yang akan diproses.` : "Gunakan tombol Preview untuk melihat hasil parsing."}
              </p>
            </div>
          </div>
          <button onClick={onCancel} type="button" className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
          
          {/* TAMPILAN 1: FORM INPUT */}
          <form id="hapusForm" onSubmit={handleSubmit(onSubmit)} className={showPreview ? "hidden" : "space-y-5"}> 
            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 mb-6">
              <label className="text-sm font-bold text-rose-900 block mb-2">Tanggal Input Sistem (Batch Date)</label>
              <input type="date" {...register("tanggalInput")} className="w-full md:w-1/3 text-sm p-2.5 border border-rose-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Tgl Hapus (DD/MM/YYYY)</label><textarea {...register("tanggalHapusBuku")} rows={3} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-y" placeholder="13/04/2026" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Nomor Register</label><textarea {...register("nomorRegisterAset")} rows={3} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-y" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Nama Aset</label><textarea {...register("namaAset")} rows={3} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-y" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Golongan</label><textarea {...register("golonganAset")} rows={3} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-y" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Jumlah (Qty)</label><textarea {...register("jumlah")} rows={3} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-y" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Tgl Perolehan (DD/MM/YYYY)</label><textarea {...register("tanggalPerolehan")} rows={3} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-y" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Harga Perolehan (Rp)</label><textarea {...register("hargaPerolehan")} rows={3} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-y" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Akm. Penyusutan (Rp)</label><textarea {...register("akmPenyusutan")} rows={3} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-y" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Nilai Buku (Rp)</label><textarea {...register("nilaiBuku")} rows={3} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-y" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Cabang/Unit Kerja</label><textarea {...register("cabangUnitKerja")} rows={3} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-y" /></div>
              <div className="space-y-1 md:col-span-2"><label className="text-xs font-semibold text-slate-700">Alasan Hapus Buku</label><textarea {...register("alasanHapusBuku")} rows={3} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-y" placeholder="Cth: Rusak Berat" /></div>
              
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Nama Operator</label><input {...register("operatorName")} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none bg-slate-50" readOnly /></div>
              
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Nama Supervisi (Opsional)</label>
                <select 
                  {...register("supervisorName")} 
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white cursor-pointer"
                >
                  <option value="">- Pilih Supervisi -</option>
                  <option value="Novianti Siswandi">Novianti Siswandi</option>
                </select>
              </div>
            </div>
          </form>

          {/* TAMPILAN 2: TABLE PREVIEW (MUNCUL SAAT KLIK PREVIEW) */}
          {showPreview && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
              <table className="w-full text-left border-collapse">
                <thead className="bg-rose-50/50 text-[11px] uppercase font-bold text-rose-800 border-b border-rose-100">
                  <tr>
                    <th className="p-3 border-b">No</th>
                    <th className="p-3 border-b">Tgl Hapus</th>
                    <th className="p-3 border-b">Register</th>
                    <th className="p-3 border-b">Nama Aset</th>
                    <th className="p-3 border-b text-center">Qty</th>
                    <th className="p-3 border-b text-right">Harga</th>
                    <th className="p-3 border-b text-right">Nilai Buku</th>
                    <th className="p-3 border-b">Alasan</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-700">
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                      <td className="p-3 font-medium text-slate-400">{idx + 1}</td>
                      <td className="p-3">{row.tanggalHapusBuku}</td>
                      <td className="p-3 font-semibold text-slate-900">{row.nomorRegisterAset}</td>
                      <td className="p-3">{row.namaAset}</td>
                      <td className="p-3 text-center">{row.jumlah}</td>
                      <td className="p-3 text-right">Rp {row.hargaPerolehan.toLocaleString("id-ID")}</td>
                      <td className="p-3 text-right font-bold text-rose-600">Rp {row.nilaiBuku.toLocaleString("id-ID")}</td>
                      <td className="p-3"><span className="truncate max-w-[150px] inline-block">{row.alasanHapusBuku}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS DINAMIS */}
        <div className="flex justify-end gap-3 p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          {!showPreview ? (
            <>
              <button type="button" onClick={onCancel} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm">
                Batal
              </button>
              <button type="button" onClick={handleGeneratePreview} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm transition-all">
                <Eye className="w-4 h-4" /> Preview Data
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setShowPreview(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm">
                Edit Kembali
              </button>
              <button form="hapusForm" type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-lg disabled:opacity-70 transition-all">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Konfirmasi & Simpan {previewRows.length} Data
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}