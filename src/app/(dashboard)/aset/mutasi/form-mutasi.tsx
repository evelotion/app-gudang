"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mutasiAsetSchema } from "@/lib/validations";
import { createMutasiAset } from "@/actions/aset";
import { getSession } from "@/actions/auth";
import { toast } from "sonner";
import { Loader2, Save, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function FormMutasi({ initialData, onCancel, onSuccess }: any) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operator, setOperator] = useState("Loading...");

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(mutasiAsetSchema),
    defaultValues: initialData || {
      tanggalInput: new Date().toISOString().split('T')[0],
      tanggalMutasi: new Date().toISOString().split('T')[0],
      tanggalPerolehan: new Date().toISOString().split('T')[0],
      jumlah: 1,
      hargaPerolehan: 0,
      akmPenyusutan: 0,
    }
  });

  useEffect(() => {
    getSession().then((session) => {
      if (session && session.nama) {
        setOperator(session.nama);
        setValue("operatorName", session.nama);
      }
    });

    if (initialData) {
      // Format tanggal biar pas masuk ke <input type="date">
      const formatDate = (isoString: string) => isoString ? new Date(isoString).toISOString().split('T')[0] : "";
      setValue("tanggalInput", formatDate(initialData.tanggalInput));
      setValue("tanggalMutasi", formatDate(initialData.tanggalMutasi));
      setValue("tanggalPerolehan", formatDate(initialData.tanggalPerolehan));
    }
  }, [initialData, setValue]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    const toastId = toast.loading("Menyimpan data mutasi...");
    
    const res = await createMutasiAset(data);
    
    if (res.success) {
      toast.success("Data mutasi berhasil disimpan!", { id: toastId });
      reset();
      onSuccess();
    } else {
      toast.error(res.error || "Gagal menyimpan data", { id: toastId });
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="border-indigo-100/60 shadow-lg shadow-indigo-500/5 mb-8">
      <div className="bg-indigo-50/50 p-5 border-b border-indigo-100 flex justify-between items-center rounded-t-2xl">
        <div>
          <h2 className="text-lg font-bold text-indigo-900">Form Mutasi Aset</h2>
          <p className="text-sm text-indigo-600/80">Pindahkan lokasi operasional aset.</p>
        </div>
        <button onClick={onCancel} className="p-2 bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-sm">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <CardContent className="p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* BARIS 1: TANGGAL & REGISTER */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">Tanggal Input <span className="text-rose-500">*</span></label>
              <input type="date" {...register("tanggalInput")} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
              {errors.tanggalInput && <p className="text-xs text-rose-500 font-medium">{errors.tanggalInput.message as string}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">Tanggal Mutasi <span className="text-rose-500">*</span></label>
              <input type="date" {...register("tanggalMutasi")} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
              {errors.tanggalMutasi && <p className="text-xs text-rose-500 font-medium">{errors.tanggalMutasi.message as string}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">No. Register Aset <span className="text-rose-500">*</span></label>
              <input type="text" placeholder="Contoh: 301/225/..." {...register("nomorRegisterAset")} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20" />
              {errors.nomorRegisterAset && <p className="text-xs text-rose-500 font-medium">{errors.nomorRegisterAset.message as string}</p>}
            </div>
          </div>

          {/* BARIS 2: NAMA ASET, GOL, JUMLAH */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">Nama Aset <span className="text-rose-500">*</span></label>
              <input type="text" {...register("namaAset")} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
              {errors.namaAset && <p className="text-xs text-rose-500 font-medium">{errors.namaAset.message as string}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">Golongan Aset <span className="text-rose-500">*</span></label>
              <input type="text" {...register("golonganAset")} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
              {errors.golonganAset && <p className="text-xs text-rose-500 font-medium">{errors.golonganAset.message as string}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">Jumlah <span className="text-rose-500">*</span></label>
              <input type="number" {...register("jumlah")} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
              {errors.jumlah && <p className="text-xs text-rose-500 font-medium">{errors.jumlah.message as string}</p>}
            </div>
          </div>

          {/* BARIS 3: HARGA & PENYUSUTAN */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">Tanggal Perolehan <span className="text-rose-500">*</span></label>
              <input type="date" {...register("tanggalPerolehan")} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">Harga Perolehan (Rp) <span className="text-rose-500">*</span></label>
              <input type="number" {...register("hargaPerolehan")} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">Akm. Penyusutan (Rp) <span className="text-rose-500">*</span></label>
              <input type="number" {...register("akmPenyusutan")} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>

          {/* BARIS 4: LOKASI & ALASAN (MUTASI SPESIFIK) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-700 uppercase">Lokasi Awal <span className="text-rose-500">*</span></label>
              <input type="text" {...register("lokasiAwal")} placeholder="Contoh: KP-Logistik" className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500/20" />
              {errors.lokasiAwal && <p className="text-xs text-rose-500 font-medium">{errors.lokasiAwal.message as string}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-emerald-700 uppercase">Lokasi Tujuan <span className="text-rose-500">*</span></label>
              <input type="text" {...register("lokasiTujuan")} placeholder="Contoh: KCP Cikarang Selatan" className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
              {errors.lokasiTujuan && <p className="text-xs text-rose-500 font-medium">{errors.lokasiTujuan.message as string}</p>}
            </div>
            <div className="col-span-1 md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-indigo-700 uppercase">Alasan Mutasi <span className="text-rose-500">*</span></label>
              <textarea {...register("alasanMutasi")} rows={2} placeholder="Sebutkan alasan dipindahkannya aset..." className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"></textarea>
              {errors.alasanMutasi && <p className="text-xs text-rose-500 font-medium">{errors.alasanMutasi.message as string}</p>}
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
            <div className="text-sm text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-full sm:w-auto">
              Operator: <span className="font-bold text-slate-700">{operator}</span>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button type="button" onClick={onCancel} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">Batal</button>
              <button disabled={isSubmitting} type="submit" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSubmitting ? "Menyimpan..." : "Simpan Mutasi"}
              </button>
            </div>
          </div>

        </form>
      </CardContent>
    </Card>
  );
}