"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Loader2, FolderMinus } from "lucide-react";
import { deleteHapusBukuAset } from "@/actions/aset";

const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
const formatTanggal = (tanggal: string) => new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(tanggal));

export default function DataTableHapusBuku({ data, onEdit, onRefresh }: { data: any[], onEdit: (item: any) => void, onRefresh: () => void }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data hapus buku ini?")) return;
    setDeletingId(id);
    const res = await deleteHapusBukuAset(id);
    setDeletingId(null);
    if (res.success) onRefresh(); else alert(res.message);
  };

  if (!data || data.length === 0) return (
    <div className="h-64 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-500 bg-slate-50">
      <FolderMinus className="w-10 h-10 text-slate-300 mb-2" />
      <p className="font-medium">Belum ada data hapus buku aset di tanggal ini.</p>
    </div>
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <Table className="min-w-max">
        <TableHeader className="bg-slate-50/80 border-b border-slate-200">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[50px] text-center font-bold text-slate-600">No</TableHead>
            <TableHead className="font-bold text-slate-600">Tgl Hapus</TableHead>
            <TableHead className="font-bold text-slate-600">No. Register</TableHead>
            <TableHead className="font-bold text-slate-600">Nama Aset</TableHead>
            <TableHead className="text-right font-bold text-slate-600">Harga Perolehan</TableHead>
            <TableHead className="text-right font-bold text-slate-600">Akm. Susut</TableHead>
            <TableHead className="text-right font-bold text-slate-600">Nilai Buku</TableHead>
            <TableHead className="font-bold text-slate-600">Alasan</TableHead>
            <TableHead className="text-center font-bold text-slate-600">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={row.id} className="hover:bg-rose-50/50 transition-colors group">
              <TableCell className="text-center font-medium text-slate-500">{index + 1}</TableCell>
              <TableCell className="text-slate-600">{formatTanggal(row.tanggalHapusBuku)}</TableCell>
              <TableCell className="font-semibold text-slate-800">{row.nomorRegisterAset}</TableCell>
              <TableCell className="text-slate-700">{row.namaAset}</TableCell>
              <TableCell className="text-right text-slate-600">{formatRupiah(row.hargaPerolehan)}</TableCell>
              <TableCell className="text-right text-rose-600 font-medium">{formatRupiah(row.akmPenyusutan)}</TableCell>
              <TableCell className="text-right font-bold text-slate-800">{formatRupiah(row.nilaiBuku)}</TableCell>
              
              <TableCell className="max-w-[150px]">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium tracking-wide truncate block">
                  {row.alasanHapusBuku}
                </span>
              </TableCell>

              <TableCell>
                <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(row)} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors" title="Edit Data"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(row.id)} disabled={deletingId === row.id} className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-md transition-colors disabled:opacity-50" title="Hapus Data">
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