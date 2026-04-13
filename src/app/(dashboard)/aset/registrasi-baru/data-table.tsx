"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Loader2, FolderOpen } from "lucide-react";
import { deleteRegistrasiAset } from "@/actions/aset";

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
};

const formatTanggal = (tanggal: string) => {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(tanggal));
};

export default function DataTableRegistrasi({ data, onEdit, onRefresh }: { data: any[], onEdit: (item: any) => void, onRefresh: () => void }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data aset ini?")) return;
    
    setDeletingId(id);
    const res = await deleteRegistrasiAset(id);
    setDeletingId(null);

    if (res.success) {
      onRefresh(); 
    } else {
      alert(res.message);
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-64 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-500 bg-slate-50">
        <FolderOpen className="w-10 h-10 text-slate-300 mb-2" />
        <p className="font-medium">Belum ada data registrasi aset di tanggal ini.</p>
      </div>
    );
  }

  return (
    // BORDER & SHADOW TABEL YANG LEBIH MODERN
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <Table className="min-w-max">
        <TableHeader className="bg-slate-50/80 border-b border-slate-200">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[50px] text-center font-bold text-slate-600">No</TableHead>
            <TableHead className="font-bold text-slate-600">Nomor Register</TableHead>
            <TableHead className="font-bold text-slate-600">Nama Aset</TableHead>
            <TableHead className="font-bold text-slate-600">Golongan</TableHead>
            <TableHead className="text-center font-bold text-slate-600">Jumlah</TableHead>
            <TableHead className="font-bold text-slate-600">Tgl Perolehan</TableHead>
            <TableHead className="text-right font-bold text-slate-600">Harga Perolehan</TableHead>
            <TableHead className="font-bold text-slate-600">Cabang / Unit</TableHead>
            <TableHead className="font-bold text-slate-600">User Pengguna</TableHead>
            <TableHead className="text-center font-bold text-slate-600">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={row.id} className="hover:bg-indigo-50/50 transition-colors group">
              <TableCell className="text-center font-medium text-slate-500">{index + 1}</TableCell>
              <TableCell className="font-semibold text-slate-800">{row.nomorRegisterAset}</TableCell>
              <TableCell className="text-slate-700">{row.namaAset}</TableCell>
              
              {/* EFEK BADGE UNTUK GOLONGAN ASET */}
              <TableCell>
                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold tracking-wide">
                  {row.golonganAset}
                </span>
              </TableCell>

              <TableCell className="text-center font-medium text-slate-700">{row.jumlah}</TableCell>
              <TableCell className="text-slate-600">{formatTanggal(row.tanggalPerolehan)}</TableCell>
              <TableCell className="text-right font-semibold text-emerald-600">{formatRupiah(row.hargaPerolehan)}</TableCell>
              <TableCell className="text-slate-600">{row.cabangUnitKerja}</TableCell>
              <TableCell className="text-slate-600">{row.userPengguna}</TableCell>
              
              <TableCell>
                <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onEdit(row)} 
                    className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors"
                    title="Edit Data"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(row.id)} 
                    disabled={deletingId === row.id}
                    className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-md transition-colors disabled:opacity-50"
                    title="Hapus Data"
                  >
                    {deletingId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}