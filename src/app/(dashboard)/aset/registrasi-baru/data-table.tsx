"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Loader2, FolderOpen } from "lucide-react";
import { deleteRegistrasiAset, deleteBulkRegistrasiAset } from "@/actions/aset";
import { formatTanggalIndo } from "@/lib/utils"; // <-- IMPORT FUNGSI UTILS KITA

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
};

export default function DataTableRegistrasi({ data, onEdit, onRefresh }: { data: any[], onEdit: (item: any) => void, onRefresh: () => void }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // STATE BARU: Untuk simpan ID yang dipilih
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // FUNGSI BARU: Select All
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(data.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  // FUNGSI BARU: Select per baris
  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // FUNGSI BARU: Hapus Massal
  const handleBulkDelete = async () => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} data terpilih?`)) return;
    
    setIsBulkDeleting(true);
    const res = await deleteBulkRegistrasiAset(selectedIds);
    setIsBulkDeleting(false);

    if (res.success) {
      setSelectedIds([]); // Reset pilihan
      onRefresh(); 
    } else {
      alert(res.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data aset ini?")) return;
    
    setDeletingId(id);
    const res = await deleteRegistrasiAset(id);
    setDeletingId(null);

    if (res.success) {
      // Hapus dari state selectedIds kalau item ini kehapus
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
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
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden relative">
      
      {/* BAR AKSI MASSAL MUNCUL KALAU ADA YANG DIPILIH */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-50/90 backdrop-blur-sm border-b border-indigo-100 px-4 py-3 flex items-center justify-between animate-in slide-in-from-top-2">
          <span className="text-sm text-indigo-700 font-bold">{selectedIds.length} data dipilih</span>
          <button
            onClick={handleBulkDelete}
            disabled={isBulkDeleting}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isBulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Hapus Terpilih
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table className="min-w-max">
          <TableHeader className="bg-slate-50/80 border-b border-slate-200">
            <TableRow className="hover:bg-transparent">
              {/* CHECKBOX HEADER */}
              <TableHead className="w-[40px] text-center">
                <input 
                  type="checkbox" 
                  checked={selectedIds.length === data.length && data.length > 0} 
                  onChange={handleSelectAll} 
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer accent-indigo-600" 
                />
              </TableHead>
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
            {data.map((row, index) => {
              const isSelected = selectedIds.includes(row.id);
              return (
                <TableRow key={row.id} className={`transition-colors group ${isSelected ? 'bg-indigo-50/50 hover:bg-indigo-50/80' : 'hover:bg-slate-50'}`}>
                  {/* CHECKBOX ROW */}
                  <TableCell className="text-center">
                    <input 
                      type="checkbox" 
                      checked={isSelected} 
                      onChange={() => handleSelectRow(row.id)} 
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer accent-indigo-600" 
                    />
                  </TableCell>
                  <TableCell className="text-center font-medium text-slate-500">{index + 1}</TableCell>
                  <TableCell className="font-semibold text-slate-800">{row.nomorRegisterAset}</TableCell>
                  <TableCell className="text-slate-700">{row.namaAset}</TableCell>
                  
                  <TableCell>
                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold tracking-wide">
                      {row.golonganAset}
                    </span>
                  </TableCell>

                  <TableCell className="text-center font-medium text-slate-700">{row.jumlah}</TableCell>
                  <TableCell className="text-slate-600">{formatTanggalIndo(row.tanggalPerolehan)}</TableCell> {/* <-- UBAHAN DI SINI */}
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
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}