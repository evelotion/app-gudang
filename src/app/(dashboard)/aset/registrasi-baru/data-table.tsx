"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { deleteRegistrasiAset } from "@/actions/aset"; // Import fungsi delete

// Helper format
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
      onRefresh(); // Refresh tabel setelah dihapus
    } else {
      alert(res.message);
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-64 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-500 bg-slate-50/50">
        Belum ada data registrasi aset.
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table className="min-w-max">
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[50px] text-center">No</TableHead>
            <TableHead>Nomor Register</TableHead>
            <TableHead>Nama Aset</TableHead>
            <TableHead>Golongan</TableHead>
            <TableHead className="text-center">Jumlah</TableHead>
            <TableHead>Tgl Perolehan</TableHead>
            <TableHead className="text-right">Harga Perolehan</TableHead>
            <TableHead>Cabang / Unit</TableHead>
            <TableHead>User Pengguna</TableHead>
            <TableHead className="text-center">Aksi</TableHead> {/* Ganti Status jadi Aksi */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={row.id}>
              <TableCell className="text-center font-medium">{index + 1}</TableCell>
              <TableCell>{row.nomorRegisterAset}</TableCell>
              <TableCell>{row.namaAset}</TableCell>
              <TableCell>{row.golonganAset}</TableCell>
              <TableCell className="text-center">{row.jumlah}</TableCell>
              <TableCell>{formatTanggal(row.tanggalPerolehan)}</TableCell>
              <TableCell className="text-right">{formatRupiah(row.hargaPerolehan)}</TableCell>
              <TableCell>{row.cabangUnitKerja}</TableCell>
              <TableCell>{row.userPengguna}</TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  <button 
                    onClick={() => onEdit(row)} 
                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
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