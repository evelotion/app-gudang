"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Save, Loader2, Eye, ArrowLeft, CheckCircle2 } from "lucide-react";
import { createMutasiAset, updateMutasiAset } from "@/actions/aset";
import { getSession } from "@/actions/auth";
import { toast } from "sonner";

// ==========================================
// SCHEMA LOKAL UNTUK BULK INSERT (Semua String)
// ==========================================
const bulkMutasiSchema = z.object({
  tanggalInput: z.string().min(1, "Wajib diisi"),
  tanggalMutasi: z.string().min(1, "Wajib diisi"),
  nomorRegisterAset: z.string().min(1, "Wajib diisi"),
  namaAset: z.string().min(1, "Wajib diisi"),
  golonganAset: z.string().min(1, "Wajib diisi"),
  jumlah: z.string().min(1, "Wajib diisi"),
  tanggalPerolehan: z.string().min(1, "Wajib diisi"),
  hargaPerolehan: z.string().min(1, "Wajib diisi"),
  akmPenyusutan: z.string().min(1, "Wajib diisi"),
  lokasiAwal: z.string().min(1, "Wajib diisi"),
  lokasiTujuan: z.string().min(1, "Wajib diisi"),
  alasanMutasi: z.string().min(1, "Wajib diisi"),
  operatorName: z.string().min(1, "Wajib diisi"),
  supervisorName: z.string().optional(),
});

type FormValues = z.infer<typeof bulkMutasiSchema>;

export default function FormMutasi({ initialData, onCancel, onSuccess }: any) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operator, setOperator] = useState("Loading...");

  // ==========================================
  // STATE PREVIEW
  // ==========================================
  const [showPreview, setShowPreview] = useState(false);
  const [previewRows, setPreviewRows] = useState<any[]>([]);

  const { register, handleSubmit, getValues, trigger, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(bulkMutasiSchema),
    defaultValues: initialData ? {
      ...initialData,
      jumlah: String(initialData.jumlah),
      hargaPerolehan: String(initialData.hargaPerolehan),
      akmPenyusutan: String(initialData.akmPenyusutan),
      tanggalInput: new Date(initialData.tanggalInput).toISOString().split('T')[0],
      tanggalMutasi: new Date(initialData.tanggalMutasi).toLocaleDateString('en-GB'), // DD/MM/YYYY
      tanggalPerolehan: new Date(initialData.tanggalPerolehan).toLocaleDateString('en-GB'), // DD/MM/YYYY
    } : {
      tanggalInput: new Date().toISOString().split('T')[0],
      jumlah: "1",
      hargaPerolehan: "0",
      akmPenyusutan: "0",
    }
  });

  useEffect(() => {
    getSession().then((session) => {
      if (session && session.nama) {
        setOperator(session.nama);
        setValue("operatorName", session.nama);
      }
    });
  }, [setValue]);

  // ==========================================
  // LOGIC GENERATE PREVIEW
  // ==========================================
  const handleGeneratePreview = async () => {
    const isValid = await trigger();
    if (!isValid) return toast.error("Mohon lengkapi semua field yang wajib diisi!");

    const data = getValues();
    const splitLines = (str: string) => str ? str.split('\n').map(s => s.trim()).filter(Boolean) : [];
    
    const tglMutasi = splitLines(data.tanggalMutasi);
    const noReg = splitLines(data.nomorRegisterAset);
    const nama = splitLines(data.namaAset);
    const gol = splitLines(data.golonganAset);
    const jml = splitLines(data.jumlah);
    const hrg = splitLines(data.hargaPerolehan);
    const akm = splitLines(data.akmPenyusutan);
    const lokAwal = splitLines(data.lokasiAwal);
    const lokTujuan = splitLines(data.lokasiTujuan);
    const alasan = splitLines(data.alasanMutasi);
    
    const maxRows = Math.max(noReg.length, nama.length, tglMutasi.length, hrg.length, lokAwal.length);
    
    const rows = [];
    for (let i = 0; i < maxRows; i++) {
      rows.push({
        tanggalMutasi: tglMutasi[i] || tglMutasi[0] || "-",
        nomorRegisterAset: noReg[i] || noReg[0] || "-",
        namaAset: nama[i] || nama[0] || "-",
        golonganAset: gol[i] || gol[0] || "-",
        jumlah: jml[i] || jml[0] || "1",
        hargaPerolehan: Number(hrg[i] || hrg[0] || 0),
        akmPenyusutan: Number(akm[i] || akm[0] || 0),
        lokasiAwal: lokAwal[i] || lokAwal[0] || "-",
        lokasiTujuan: lokTujuan[i] || lokTujuan[0] || "-",
        alasanMutasi: alasan[i] || alasan[0] || "-"
      });
    }

    setPreviewRows(rows);
    setShowPreview(true);
  };

  // ==========================================
  // LOGIC SUBMIT KE DATABASE
  // ==========================================
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    const toastId = toast.loading("Menyimpan data mutasi...");
    
    try {
      const splitLines = (str: string) => str.split('\n').map(s => s.trim()).filter(Boolean);
      
      const tglMutasi = splitLines(data.tanggalMutasi);
      const noReg = splitLines(data.nomorRegisterAset);
      const nama = splitLines(data.namaAset);
      const gol = splitLines(data.golonganAset);
      const jml = splitLines(data.jumlah);
      const tglPerolehan = splitLines(data.tanggalPerolehan);
      const hrg = splitLines(data.hargaPerolehan);
      const akm = splitLines(data.akmPenyusutan);
      const lokAwal = splitLines(data.lokasiAwal);
      const lokTujuan = splitLines(data.lokasiTujuan);
      const alasan = splitLines(data.alasanMutasi);
      
      const maxRows = Math.max(noReg.length, nama.length, tglMutasi.length, hrg.length, lokAwal.length);
      
      const parseDateStr = (dateStr: string) => {
        if (dateStr.includes('/')) {
          const [d, m, y] = dateStr.split('/');
          return new Date(`${y}-${m}-${d}T00:00:00Z`);
        }
        return new Date(dateStr);
      };

      for (let i = 0; i < maxRows; i++) {
        const payload = {
          tanggalInput: new Date(data.tanggalInput),
          tanggalMutasi: parseDateStr(tglMutasi[i] || tglMutasi[0]),
          nomorRegisterAset: noReg[i] || noReg[0] || "-",
          namaAset: nama[i] || nama[0] || "-",
          golonganAset: gol[i] || gol[0] || "-",
          jumlah: Number(jml[i] || jml[0] || 1),
          tanggalPerolehan: parseDateStr(tglPerolehan[i] || tglPerolehan[0]),
          hargaPerolehan: Number(hrg[i] || hrg[0] || 0),
          akmPenyusutan: Number(akm[i] || akm[0] || 0),
          lokasiAwal: lokAwal[i] || lokAwal[0] || "-",
          lokasiTujuan: lokTujuan[i] || lokTujuan[0] || "-",
          alasanMutasi: alasan[i] || alasan[0] || "-",
          operatorName: data.operatorName,
          supervisorName: data.supervisorName || ""
        };
        
        if (initialData) {
          await updateMutasiAset(initialData.id, payload as any);
        } else {
          await createMutasiAset(payload as any);
        }
      }
      toast.success("Data mutasi berhasil disimpan!", { id: toastId });
      onSuccess();
    } catch (error) {
      toast.error("Gagal menyimpan data mutasi.", { id: toastId });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-indigo-100 flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER DINAMIS */}
        <div className="flex justify-between items-center p-5 border-b border-indigo-100 bg-indigo-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            {showPreview && (
              <button type="button" onClick={() => setShowPreview(false)} className="p-2 hover:bg-indigo-200 rounded-full transition-colors text-indigo-700">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold text-indigo-900">
                {showPreview ? "Preview Data Mutasi" : initialData ? "Edit Mutasi Aset" : "Form Mutasi Aset (Bulk Insert)"}
              </h2>
              <p className="text-xs text-indigo-600/80 mt-0.5">
                {showPreview ? `Menampilkan ${previewRows.length} baris data yang akan dipindah.` : "Paste data dari Excel untuk memindahkan banyak aset sekaligus."}
              </p>
            </div>
          </div>
          <button onClick={onCancel} type="button" className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
          
          {/* TAMPILAN 1: FORM INPUT */}
          <form id="mutasiForm" onSubmit={handleSubmit(onSubmit)} className={showPreview ? "hidden" : "space-y-6"}>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Batch Date (Tgl Input)</label>
                <input type="date" {...register("tanggalInput")} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Tanggal Mutasi (DD/MM/YYYY)</label>
                <textarea {...register("tanggalMutasi")} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y" placeholder="13/04/2026" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">No. Register Aset</label>
                <textarea {...register("nomorRegisterAset")} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1"><label className="text-xs font-bold text-slate-700 uppercase">Nama Aset</label><textarea {...register("namaAset")} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-700 uppercase">Golongan Aset</label><textarea {...register("golonganAset")} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-700 uppercase">Jumlah</label><textarea {...register("jumlah")} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className="space-y-1"><label className="text-xs font-bold text-slate-700 uppercase">Tgl Perolehan (DD/MM/YYYY)</label><textarea {...register("tanggalPerolehan")} rows={2} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-700 uppercase">Harga Perolehan (Rp)</label><textarea {...register("hargaPerolehan")} rows={2} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-700 uppercase">Akm. Penyusutan (Rp)</label><textarea {...register("akmPenyusutan")} rows={2} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100">
              <div className="space-y-1"><label className="text-xs font-bold text-amber-700 uppercase">Lokasi Awal</label><textarea {...register("lokasiAwal")} rows={2} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 resize-y" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-emerald-700 uppercase">Lokasi Tujuan</label><textarea {...register("lokasiTujuan")} rows={2} className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 resize-y" /></div>
              <div className="col-span-1 md:col-span-2 space-y-1"><label className="text-xs font-bold text-indigo-700 uppercase">Alasan Mutasi</label><textarea {...register("alasanMutasi")} rows={2} className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y" /></div>
            </div>
          </form>

          {/* TAMPILAN 2: TABLE PREVIEW */}
          {showPreview && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
              <table className="w-full text-left border-collapse">
                <thead className="bg-indigo-50/50 text-[11px] uppercase font-bold text-indigo-900 border-b border-indigo-100">
                  <tr>
                    <th className="p-3 border-b">No</th>
                    <th className="p-3 border-b">Tgl Mutasi</th>
                    <th className="p-3 border-b">Register</th>
                    <th className="p-3 border-b">Nama Aset</th>
                    <th className="p-3 border-b text-center">Qty</th>
                    <th className="p-3 border-b">Lokasi Awal</th>
                    <th className="p-3 border-b">Lokasi Tujuan</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-700">
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                      <td className="p-3 font-medium text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-medium">{row.tanggalMutasi}</td>
                      <td className="p-3 font-mono text-slate-500">{row.nomorRegisterAset}</td>
                      <td className="p-3 font-bold">{row.namaAset}</td>
                      <td className="p-3 text-center">{row.jumlah}</td>
                      <td className="p-3"><span className="bg-amber-50 text-amber-700 px-2 py-1 rounded font-medium">{row.lokasiAwal}</span></td>
                      <td className="p-3"><span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded font-medium">{row.lokasiTujuan}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS DINAMIS */}
        <div className="flex justify-between items-center gap-3 p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <div className="text-sm text-slate-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            Operator: <span className="font-bold text-slate-700">{operator}</span>
          </div>
          
          <div className="flex gap-3">
            {!showPreview ? (
              <>
                <button type="button" onClick={onCancel} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition-colors">
                  Batal
                </button>
                <button type="button" onClick={handleGeneratePreview} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm transition-all">
                  <Eye className="w-4 h-4" /> Preview Data
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setShowPreview(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition-colors">
                  Edit Kembali
                </button>
                <button form="mutasiForm" type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg disabled:opacity-70 transition-all">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Simpan {previewRows.length} Mutasi
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}