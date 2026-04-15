"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Save, Loader2, Info, Sparkles, Eye, ArrowLeft, CheckCircle2 } from "lucide-react";
import { createRegistrasiAset, updateRegistrasiAset } from "@/actions/aset";
import { formatTanggalIndo } from "@/lib/utils";

// ==========================================
// KAMUS GOLONGAN ASET
// ==========================================
const GOLONGAN_MAP: Record<string, string> = {
  "101": "Tanah", "102": "Gedung", "103": "Gudang", "104": "Wisma", "105": "Gedung Baru",
  "106": "Gedung Baru", "107": "Gedung", "150": "Properti Terbengkalai", "180": "Instalasi",
  "181": "INSTALASI FIRE ALARM", "201": "Alat Transportasi", "211": "ALAT TRANSPORTASI GOL. II",
  "301": "PERABOT KANTOR GOL. I", "311": "PERABOT KANTOR GOL. II", "340": "Buku Perpustakaan",
  "390": "Perlengkapan Lainnya", "400": "Mesin Kantor", "401": "MESIN KANTOR GOL. I",
  "402": "MESIN KANTOR GOL. II", "440": "Alat Telekomunikasi", "460": "ALAT PERLENGKAPAN LAINNYA",
  "500": "KOMPUTER", "510": "Komputer Software", "511": "Lisensi", "512": "Software",
  "513": "LISENSI", "514": "SOFTWARE", "515": "LISENSI", "900": "ASET NON-INVENTARIS",
};

const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/\d{4}$/;

const bulkFormSchema = z.object({
  tanggalInput: z.string().min(1, "Wajib diisi"), 
  nomorRegisterAset: z.string().min(1, "Wajib diisi"),
  namaAset: z.string().min(1, "Wajib diisi"),
  golonganAset: z.string().min(1, "Wajib diisi"),
  jumlah: z.string().min(1, "Wajib diisi"),
  tanggalPerolehan: z.string().min(1, "Wajib diisi").refine((val) => {
    const lines = val.split('\n').map(s => s.trim()).filter(Boolean);
    return lines.every(line => dateRegex.test(line));
  }, { message: "Format wajib DD/MM/YYYY (Cth: 01/01/2026)" }),
  hargaPerolehan: z.string().min(1, "Wajib diisi"),
  cabangUnitKerja: z.string().min(1, "Wajib diisi"),
  userPengguna: z.string().min(1, "Wajib diisi"),
  lokasiPosisiAset: z.string().min(1, "Wajib diisi"),
  inputerName: z.string().min(1, "Wajib diisi"),
  supervisorName: z.string().optional(),
});

type FormValues = z.infer<typeof bulkFormSchema>;

const formatToDDMMYYYY = (dateVal: any) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
};

const parseDDMMYYYY = (dateStr: string) => {
  if (!dateStr || !dateStr.includes('/')) return new Date();
  const [day, month, year] = dateStr.split('/');
  return new Date(`${year}-${month}-${day}T00:00:00Z`); 
};

export default function FormRegistrasi({ initialData, onSuccess, onCancel }: { initialData?: any, onSuccess: () => void, onCancel: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false); // State untuk toggle Preview
  const [previewRows, setPreviewRows] = useState<any[]>([]);

  const { register, handleSubmit, formState: { errors }, watch, setValue, getValues, trigger } = useForm<FormValues>({
    resolver: zodResolver(bulkFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      jumlah: String(initialData.jumlah),
      hargaPerolehan: String(initialData.hargaPerolehan),
      tanggalInput: new Date(initialData.tanggalInput).toISOString().split('T')[0], 
      tanggalPerolehan: formatToDDMMYYYY(initialData.tanggalPerolehan) 
    } : {
      tanggalInput: new Date().toISOString().split('T')[0], 
      jumlah: "1",
      hargaPerolehan: "0",
      inputerName: "Indra Dwi Ananda", 
    },
  });

  const watchNomorRegister = watch("nomorRegisterAset");

  // Auto-Detect Golongan
  useEffect(() => {
    if (watchNomorRegister !== undefined) {
      const lines = watchNomorRegister.split('\n');
      const autoGolongan = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return "";
        const kode = trimmed.split('/')[0]; 
        return GOLONGAN_MAP[kode] || ""; 
      }).join('\n');

      if (getValues("golonganAset") !== autoGolongan) {
        setValue("golonganAset", autoGolongan, { shouldValidate: true });
      }
    }
  }, [watchNomorRegister, setValue, getValues]);

  // Fungsi untuk Generate Data Preview
  const handleGeneratePreview = async () => {
    const isValid = await trigger(); // Validasi form dulu
    if (!isValid) return;

    const data = getValues();
    const splitLines = (str: string) => str.split('\n').map(s => s.trim()).filter(Boolean);
    
    const noReg = splitLines(data.nomorRegisterAset);
    const nama = splitLines(data.namaAset);
    const gol = splitLines(data.golonganAset);
    const jml = splitLines(data.jumlah);
    const tgl = splitLines(data.tanggalPerolehan);
    const hrg = splitLines(data.hargaPerolehan);
    const cabang = splitLines(data.cabangUnitKerja);
    const user = splitLines(data.userPengguna);
    const lokasi = splitLines(data.lokasiPosisiAset);

    const maxRows = Math.max(noReg.length, nama.length, gol.length, jml.length, tgl.length, hrg.length, cabang.length, user.length, lokasi.length);
    
    const rows = [];
    for (let i = 0; i < maxRows; i++) {
      rows.push({
        nomorRegisterAset: noReg[i] || noReg[0],
        namaAset: nama[i] || nama[0],
        golonganAset: gol[i] || gol[0],
        jumlah: jml[i] || jml[0],
        tanggalPerolehan: tgl[i] || tgl[0],
        hargaPerolehan: Number(hrg[i] || hrg[0]),
        cabangUnitKerja: cabang[i] || cabang[0],
        userPengguna: user[i] || user[0],
        lokasiPosisiAset: lokasi[i] || lokasi[0]
      });
    }

    setPreviewRows(rows);
    setShowPreview(true);
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Logic pemecahan baris sama seperti handleGeneratePreview
      const splitLines = (str: string) => str.split('\n').map(s => s.trim()).filter(Boolean);
      const noReg = splitLines(data.nomorRegisterAset);
      const nama = splitLines(data.namaAset);
      const gol = splitLines(data.golonganAset);
      const jml = splitLines(data.jumlah);
      const tgl = splitLines(data.tanggalPerolehan);
      const hrg = splitLines(data.hargaPerolehan);
      const cabang = splitLines(data.cabangUnitKerja);
      const user = splitLines(data.userPengguna);
      const lokasi = splitLines(data.lokasiPosisiAset);
      
      const maxRows = Math.max(noReg.length, nama.length, gol.length, jml.length, tgl.length, hrg.length, cabang.length, user.length, lokasi.length);
      
      for (let i = 0; i < maxRows; i++) {
        const payload = {
          tanggalInput: new Date(data.tanggalInput), 
          nomorRegisterAset: noReg[i] || noReg[0],
          namaAset: nama[i] || nama[0],
          golonganAset: gol[i] || gol[0],
          jumlah: Number(jml[i] || jml[0]),
          tanggalPerolehan: parseDDMMYYYY(tgl[i] || tgl[0]), 
          hargaPerolehan: Number(hrg[i] || hrg[0]),
          cabangUnitKerja: cabang[i] || cabang[0],
          userPengguna: user[i] || user[0],
          lokasiPosisiAset: lokasi[i] || lokasi[0],
          inputerName: data.inputerName,
          supervisorName: data.supervisorName || ""
        };
        
        if (initialData) {
          await updateRegistrasiAset(initialData.id, payload as any);
        } else {
          await createRegistrasiAset(payload as any);
        }
      }
      onSuccess();
    } catch (error) {
      alert("Gagal menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] my-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            {showPreview && (
              <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {showPreview ? "Preview Data Sebelum Simpan" : initialData ? "Edit Registrasi Aset" : "Bulk Insert Aset"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {showPreview ? `Menampilkan ${previewRows.length} baris data yang akan diproses.` : "Gunakan tombol Preview untuk melihat hasil parsing."}
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
          
          {/* TAMPILAN 1: FORM INPUT (HIDDEN SAAT PREVIEW) */}
          {!showPreview ? (
            <form id="asetForm" onSubmit={handleSubmit(onSubmit)} className="space-y-5"> 
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <label className="text-sm font-bold text-indigo-900 block mb-2">Batch Date (Tanggal Input Sistem)</label>
                <input type="date" {...register("tanggalInput")} className="w-full md:w-1/3 text-sm p-2.5 border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Field-field Textarea (Sama seperti sebelumnya) */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Nomor Register Aset</label>
                  <textarea {...register("nomorRegisterAset")} rows={3} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="900/493/00056/2026" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Nama Aset</label>
                  <textarea {...register("namaAset")} rows={3} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    Golongan Aset <Sparkles className="w-3 h-3 text-amber-500" />
                  </label>
                  <textarea {...register("golonganAset")} rows={3} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none bg-amber-50/30" readOnly />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Jumlah (Qty)</label>
                  <textarea {...register("jumlah")} rows={3} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Tanggal Perolehan (DD/MM/YYYY)</label>
                  <textarea {...register("tanggalPerolehan")} rows={3} className={`w-full text-sm p-2.5 border rounded-lg ${errors.tanggalPerolehan ? "border-rose-500" : "border-slate-300"}`} />
                  {errors.tanggalPerolehan && <p className="text-[10px] text-rose-500">{errors.tanggalPerolehan.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Harga Perolehan</label>
                  <textarea {...register("hargaPerolehan")} rows={3} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg" />
                </div>

                <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Cabang</label><textarea {...register("cabangUnitKerja")} rows={2} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg" /></div>
                <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">User</label><textarea {...register("userPengguna")} rows={2} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg" /></div>
                <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Lokasi</label><textarea {...register("lokasiPosisiAset")} rows={2} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg" /></div>
              </div>
            </form>
          ) : (
            
            /* TAMPILAN 2: TABLE PREVIEW (MUNCUL SAAT KLIK PREVIEW) */
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-[11px] uppercase font-bold text-slate-600">
                  <tr>
                    <th className="p-3 border-b">No</th>
                    <th className="p-3 border-b">Register</th>
                    <th className="p-3 border-b">Nama Aset</th>
                    <th className="p-3 border-b">Golongan</th>
                    <th className="p-3 border-b">Qty</th>
                    <th className="p-3 border-b">Tgl Perolehan</th>
                    <th className="p-3 border-b text-right">Harga</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-700">
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                      <td className="p-3 font-medium text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-900">{row.nomorRegisterAset}</td>
                      <td className="p-3">{row.namaAset}</td>
                      <td className="p-3"><span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">{row.golonganAset}</span></td>
                      <td className="p-3 text-center">{row.jumlah}</td>
                      <td className="p-3">{formatTanggalIndo(row.tanggalPerolehan)}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">Rp {row.hargaPerolehan.toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
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
              <button form="asetForm" type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg disabled:opacity-70 transition-all">
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