"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createHapusBukuAset } from "@/actions/aset";
import { hapusBukuAsetSchema } from "@/lib/validations";
import { X, Save, Loader2 } from "lucide-react";

type FormValues = z.infer<typeof hapusBukuAsetSchema>;

export default function FormHapusBuku({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(hapusBukuAsetSchema) as any, // <--- TAMBAHKAN as any DI SINI
    defaultValues: {
      jumlah: 1,
      hargaPerolehan: 0,
      akmPenyusutan: 0,
      nilaiBuku: 0,
      operatorName: "Indra Dwi Ananda", // Pre-filled name
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    const res = await createHapusBukuAset(data);
    setIsSubmitting(false);

    if (res.success) {
      alert(res.message); // Bisa diganti toast() kalau lo pakai Sonner
      onSuccess();
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-800">Form Catat Hapus Buku Aset</h2>
        <button onClick={onCancel} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4"> {/* <--- TAMBAHKAN as any DI SINI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Baris 1 */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal Hapus Buku</label>
            <input type="date" {...register("tanggalHapusBuku")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-red-500" />
            {errors.tanggalHapusBuku && <span className="text-[10px] text-red-500">{errors.tanggalHapusBuku.message}</span>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nomor Register Aset</label>
            <input {...register("nomorRegisterAset")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-red-500" placeholder="Contoh: 500/503/00200/2016" />
            {errors.nomorRegisterAset && <span className="text-[10px] text-red-500">{errors.nomorRegisterAset.message}</span>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nama Aset</label>
            <input {...register("namaAset")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-red-500" placeholder="Contoh: Printer Computer SP40+" />
            {errors.namaAset && <span className="text-[10px] text-red-500">{errors.namaAset.message}</span>}
          </div>

          {/* Baris 2 */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Golongan Aset</label>
            <input {...register("golonganAset")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-red-500" placeholder="Contoh: KOMPUTER" />
            {errors.golonganAset && <span className="text-[10px] text-red-500">{errors.golonganAset.message}</span>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Jumlah</label>
            <input type="number" {...register("jumlah")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-red-500" />
            {errors.jumlah && <span className="text-[10px] text-red-500">{errors.jumlah.message}</span>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal Perolehan Awal</label>
            <input type="date" {...register("tanggalPerolehan")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-red-500" />
            {errors.tanggalPerolehan && <span className="text-[10px] text-red-500">{errors.tanggalPerolehan.message}</span>}
          </div>

          {/* Baris 3 - Keuangan */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Harga Perolehan (Rp)</label>
            <input type="number" {...register("hargaPerolehan")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-red-500" />
            {errors.hargaPerolehan && <span className="text-[10px] text-red-500">{errors.hargaPerolehan.message}</span>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Akm. Penyusutan (Rp)</label>
            <input type="number" {...register("akmPenyusutan")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-red-500" />
            {errors.akmPenyusutan && <span className="text-[10px] text-red-500">{errors.akmPenyusutan.message}</span>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nilai Buku (Rp)</label>
            <input type="number" {...register("nilaiBuku")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-red-500" />
            {errors.nilaiBuku && <span className="text-[10px] text-red-500">{errors.nilaiBuku.message}</span>}
          </div>

          {/* Baris 4 - Detail Operasional */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Cabang/Unit Kerja</label>
            <input {...register("cabangUnitKerja")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-red-500" placeholder="Contoh: KCP ULS Solo" />
            {errors.cabangUnitKerja && <span className="text-[10px] text-red-500">{errors.cabangUnitKerja.message}</span>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Alasan Hapus Buku</label>
            <input {...register("alasanHapusBuku")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-red-500" placeholder="Contoh: Trade In / Rusak Total" />
            {errors.alasanHapusBuku && <span className="text-[10px] text-red-500">{errors.alasanHapusBuku.message}</span>}
          </div>

          {/* Baris 5 - Track Record */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nama Operator</label>
            <input {...register("operatorName")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-red-500 bg-slate-50" />
            {errors.operatorName && <span className="text-[10px] text-red-500">{errors.operatorName.message}</span>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nama Supervisi (Opsional)</label>
            <input {...register("supervisorName")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-red-500" placeholder="Contoh: Novianti Siswandi" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
            Batal
          </button>
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-70">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Hapus Buku
          </button>
        </div>
      </form>
    </div>
  );
}