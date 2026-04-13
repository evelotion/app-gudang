"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Save, Loader2 } from "lucide-react";

// Import update & create action
import { createRegistrasiAset, updateRegistrasiAset } from "@/actions/aset"; 
import { registrasiAsetSchema } from "@/lib/validations";

type FormValues = z.infer<typeof registrasiAsetSchema>;

// Tambahkan prop initialData
export default function FormRegistrasi({ initialData, onSuccess, onCancel }: { initialData?: any, onSuccess: () => void, onCancel: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(registrasiAsetSchema) as any,
    // Kalau ada initialData (mode edit), set nilai defaultnya
    defaultValues: initialData ? {
      ...initialData,
      tanggalPerolehan: new Date(initialData.tanggalPerolehan).toISOString().split('T')[0]
    } : {
      jumlah: 1,
      hargaPerolehan: 0,
      inputerName: "Indra Dwi Ananda", 
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    // Cek apakah ini mode Edit atau Tambah Baru
    const res = initialData 
      ? await updateRegistrasiAset(initialData.id, data) 
      : await createRegistrasiAset(data);
      
    setIsSubmitting(false);

    if (res.success) {
      onSuccess();
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-800">
          {initialData ? "Form Edit Registrasi Aset" : "Form Tambah Registrasi Aset"}
        </h2>
        <button onClick={onCancel} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4"> 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Baris 1 */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nomor Register Aset</label>
            <input {...register("nomorRegisterAset")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-indigo-500" placeholder="Contoh: 500/503/001" />
            {errors.nomorRegisterAset && <span className="text-[10px] text-red-500">{errors.nomorRegisterAset.message}</span>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nama Aset</label>
            <input {...register("namaAset")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-indigo-500" placeholder="Contoh: Printer Computer SP40+" />
            {errors.namaAset && <span className="text-[10px] text-red-500">{errors.namaAset.message}</span>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Golongan Aset</label>
            <input {...register("golonganAset")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-indigo-500" placeholder="Contoh: KOMPUTER" />
            {errors.golonganAset && <span className="text-[10px] text-red-500">{errors.golonganAset.message}</span>}
          </div>

          {/* Baris 2 */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Jumlah</label>
            <input type="number" {...register("jumlah")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-indigo-500" />
            {errors.jumlah && <span className="text-[10px] text-red-500">{errors.jumlah.message}</span>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal Perolehan</label>
            <input type="date" {...register("tanggalPerolehan")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-indigo-500" />
            {errors.tanggalPerolehan && <span className="text-[10px] text-red-500">{errors.tanggalPerolehan.message}</span>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Harga Perolehan (Rp)</label>
            <input type="number" {...register("hargaPerolehan")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-indigo-500" />
            {errors.hargaPerolehan && <span className="text-[10px] text-red-500">{errors.hargaPerolehan.message}</span>}
          </div>

          {/* Baris 3 */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Cabang/Unit Kerja</label>
            <input {...register("cabangUnitKerja")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-indigo-500" placeholder="Contoh: KCP ULS Solo" />
            {errors.cabangUnitKerja && <span className="text-[10px] text-red-500">{errors.cabangUnitKerja.message}</span>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">User Pengguna</label>
            <input {...register("userPengguna")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-indigo-500" />
            {errors.userPengguna && <span className="text-[10px] text-red-500">{errors.userPengguna.message}</span>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Lokasi/Posisi Aset</label>
            <input {...register("lokasiPosisiAset")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-indigo-500" />
            {errors.lokasiPosisiAset && <span className="text-[10px] text-red-500">{errors.lokasiPosisiAset.message}</span>}
          </div>

          {/* Baris 4 - Track Record */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nama Inputer</label>
            <input {...register("inputerName")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-indigo-500 bg-slate-50" />
            {errors.inputerName && <span className="text-[10px] text-red-500">{errors.inputerName.message}</span>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nama Supervisi (Opsional)</label>
            <input {...register("supervisorName")} className="w-full text-sm p-2 border rounded-md outline-none focus:border-indigo-500" placeholder="Contoh: Novianti Siswandi" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
            Batal
          </button>
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-70">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {initialData ? "Update Data" : "Simpan Data"}
          </button>
        </div>
      </form>
    </div>
  );
}