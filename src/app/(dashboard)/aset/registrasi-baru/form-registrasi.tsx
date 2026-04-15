"use client";

import { useState, useEffect } from "react"; // <-- TAMBAHAN: Import useEffect
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Save, Loader2, Info, Sparkles } from "lucide-react"; // <-- TAMBAHAN: Icon Sparkles buat efek magic
import { createRegistrasiAset, updateRegistrasiAset } from "@/actions/aset"; 

// ==========================================
// KAMUS GOLONGAN ASET BERDASARKAN KODE
// ==========================================
const GOLONGAN_MAP: Record<string, string> = {
  "101": "Tanah",
  "102": "Gedung",
  "103": "Gudang",
  "104": "Wisma",
  "105": "Gedung Baru",
  "106": "Gedung Baru",
  "107": "Gedung",
  "150": "Properti Terbengkalai",
  "180": "Instalasi",
  "181": "INSTALASI FIRE ALARM",
  "201": "Alat Transportasi",
  "211": "ALAT TRANSPORTASI GOL. II",
  "301": "PERABOT KANTOR GOL. I",
  "311": "PERABOT KANTOR GOL. II",
  "340": "Buku Perpustakaan",
  "390": "Perlengkapan Lainnya",
  "400": "Mesin Kantor",
  "401": "MESIN KANTOR GOL. I",
  "402": "MESIN KANTOR GOL. II",
  "440": "Alat Telekomunikasi",
  "460": "ALAT PERLENGKAPAN LAINNYA",
  "500": "KOMPUTER",
  "510": "Komputer Software",
  "511": "Lisensi",
  "512": "Software",
  "513": "LISENSI",
  "514": "SOFTWARE",
  "515": "LISENSI",
  "900": "ASET NON-INVENTARIS",
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
  }, {
    message: "Format salah! Semua baris wajib DD/MM/YYYY (Cth: 01/01/2026)"
  }),
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

  const { register, handleSubmit, formState: { errors }, watch, setValue, getValues } = useForm<FormValues>({
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

  // ==========================================
  // LOGIC AUTO-DETECT GOLONGAN ASET
  // ==========================================
  const watchNomorRegister = watch("nomorRegisterAset");

  useEffect(() => {
    // Hanya jalan kalau lagi form "Tambah Baru" atau user ngetik di kolom Register
    if (watchNomorRegister !== undefined) {
      const lines = watchNomorRegister.split('\n');
      
      const autoGolongan = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return "";
        
        // Pecah "900/493/00056/2026" berdasarkan "/" dan ambil bagian pertama ("900")
        const kode = trimmed.split('/')[0]; 
        
        // Cari di kamus, kalau ga ada balikin string kosong
        return GOLONGAN_MAP[kode] || ""; 
      }).join('\n');

      // Cek biar ga infinite render, hanya update kalau isinya beda
      if (getValues("golonganAset") !== autoGolongan) {
        setValue("golonganAset", autoGolongan, { shouldValidate: true });
      }
    }
  }, [watchNomorRegister, setValue, getValues]);


  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
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
          nomorRegisterAset: noReg[i] || noReg[0] || "-",
          namaAset: nama[i] || nama[0] || "-",
          golonganAset: gol[i] || gol[0] || "-",
          jumlah: Number(jml[i] || jml[0] || 1),
          tanggalPerolehan: parseDDMMYYYY(tgl[i] || tgl[0]), 
          hargaPerolehan: Number(hrg[i] || hrg[0] || 0),
          cabangUnitKerja: cabang[i] || cabang[0] || "-",
          userPengguna: user[i] || user[0] || "-",
          lokasiPosisiAset: lokasi[i] || lokasi[0] || "-",
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
      alert("Terjadi kesalahan sistem saat menyimpan data.");
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
              {initialData ? "Edit Registrasi Aset" : "Tambah Aset Sekaligus (Bulk Insert)"}
            </h2>
            {!initialData && (
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" /> Anda bisa paste data dari kolom Excel langsung ke dalam form di bawah.
              </p>
            )}
          </div>
          <button onClick={onCancel} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="asetForm" onSubmit={handleSubmit(onSubmit)} className="space-y-5"> 
            
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mb-6">
              <label className="text-sm font-bold text-indigo-900 block mb-2">Tanggal Input Sistem (Batch Date)</label>
              <input type="date" {...register("tanggalInput")} className="w-full md:w-1/3 text-sm p-2.5 border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
              <p className="text-xs text-indigo-600 mt-1">Tanggal ini digunakan untuk mengelompokkan data saat dicetak (Bisa di-backdate).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Nomor Register Aset</label>
                <textarea {...register("nomorRegisterAset")} rows={2} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y" placeholder="Cth: 900/493/00056/2026&#10;500/123/00012/2026" />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Nama Aset</label>
                <textarea {...register("namaAset")} rows={2} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y" placeholder="Cth: Printer&#10;Scanner" />
              </div>

              {/* UBAHAN DI SINI: Tampilan Auto-Detect */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  Golongan Aset
                  <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" /> Auto
                  </span>
                </label>
                <textarea 
                  {...register("golonganAset")} 
                  rows={2} 
                  // Background sedikit diabu-abukan biar user tau ini otomatis diisi
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-y bg-amber-50/30" 
                  placeholder="Otomatis terisi dari Nomor Register" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Jumlah (Qty)</label>
                <textarea {...register("jumlah")} rows={2} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y" placeholder="1" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Tanggal Perolehan <span className="text-rose-500">*</span>
                </label>
                <textarea 
                  {...register("tanggalPerolehan")} 
                  rows={2} 
                  className={`w-full text-sm p-2.5 border rounded-lg outline-none focus:ring-2 resize-y ${
                    errors.tanggalPerolehan ? "border-rose-500 focus:ring-rose-500/20" : "border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-500"
                  }`} 
                  placeholder="Cth: 01/01/2026&#10;15/04/2026" 
                />
                {errors.tanggalPerolehan && (
                  <p className="text-xs text-rose-500 font-medium">{errors.tanggalPerolehan.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Harga Perolehan (Rp)</label>
                <textarea {...register("hargaPerolehan")} rows={2} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y" placeholder="Cth: 15000000" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Cabang/Unit Kerja</label>
                <textarea {...register("cabangUnitKerja")} rows={2} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y" placeholder="Cth: KCP ULS Solo" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">User Pengguna</label>
                <textarea {...register("userPengguna")} rows={2} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Lokasi/Posisi Aset</label>
                <textarea {...register("lokasiPosisiAset")} rows={2} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Nama Inputer</label>
                <input {...register("inputerName")} className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none bg-slate-50" readOnly />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Nama Supervisi (Opsional)</label>
                <select 
                  {...register("supervisorName")} 
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white cursor-pointer"
                >
                  <option value="">- Pilih Supervisi -</option>
                  <option value="Novianti Siswandi">Novianti Siswandi</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button type="button" onClick={onCancel} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-sm">
            Batal
          </button>
          <button form="asetForm" type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-70">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {initialData ? "Simpan Perubahan" : "Simpan Data"}
          </button>
        </div>
      </div>
    </div>
  );
}