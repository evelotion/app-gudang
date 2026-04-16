"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PackageOpen, Pencil, Trash2, Loader2, CheckCircle2, Edit2, Check, X as XIcon } from "lucide-react";
import { deleteMutasiAset, deleteBulkMutasiAset, updateMutasiAset } from "@/actions/aset";
import { formatTanggalIndo } from "@/lib/utils";

// HELPER FORMAT
const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
const formatToDDMMYYYY = (dateVal: any) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
};

// ==========================================
// KOMPONEN: CELL INLINE EDITING
// ==========================================
const EditableCell = ({ row, field, value, displayValue, onSave, isSaving, editingCell, setEditingCell }: any) => {
  const isEditing = editingCell?.id === row.id && editingCell?.field === field;
  const [localVal, setLocalVal] = useState(value);
  useEffect(() => { setLocalVal(value) }, [value, isEditing]);

  if (isEditing) {
    return (
      <div className="flex items-center gap-1.5 w-full min-w-[120px]">
        <input 
          type="text" autoFocus
          className="w-full text-xs p-1.5 border border-amber-400 rounded focus:ring-2 focus:ring-amber-500/20 outline-none bg-white"
          value={localVal}
          onChange={e => setLocalVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') onSave(row, field, localVal);
            if (e.key === 'Escape') setEditingCell(null);
          }}
        />
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-amber-600" /> : (
          <div className="flex items-center gap-1">
            <button onClick={() => onSave(row, field, localVal)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Check className="w-3.5 h-3.5"/></button>
            <button onClick={() => setEditingCell(null)} className="p-1 text-rose-600 hover:bg-rose-50 rounded"><XIcon className="w-3.5 h-3.5"/></button>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="group flex items-center gap-2 cursor-pointer hover:bg-amber-50/50 px-1.5 py-1 rounded transition-all" onClick={() => setEditingCell({ id: row.id, field })}>
      <div className="flex-grow">{displayValue}</div>
      <Edit2 className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

export default function DataTableMutasi({ data, onEdit, onRefresh }: { data: any[], onEdit: (item: any) => void, onRefresh: () => void }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [editingCell, setEditingCell] = useState<{id: string, field: string} | null>(null);
  const [savingCell, setSavingCell] = useState<{id: string, field: string} | null>(null);

  const handleSelectAll = (e: any) => setSelectedIds(e.target.checked ? data.map(item => item.id) : []);
  const handleSelectRow = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleInlineSave = async (row: any, field: string, newValue: string) => {
    if (field === 'tanggalPerolehan' || field === 'tanggalMutasi') {
      if (!/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/\d{4}$/.test(newValue)) return alert("Format wajib DD/MM/YYYY");
    }
    setSavingCell({ id: row.id, field });
    try {
      const payload = { ...row, 
        jumlah: Number(row.jumlah), hargaPerolehan: Number(row.hargaPerolehan), akmPenyusutan: Number(row.akmPenyusutan),
        tanggalInput: new Date(row.tanggalInput),
        tanggalMutasi: new Date(row.tanggalMutasi),
        tanggalPerolehan: new Date(row.tanggalPerolehan),
      };
      
      if (['jumlah', 'hargaPerolehan', 'akmPenyusutan'].includes(field)) {
        payload[field] = Number(String(newValue).replace(/\D/g, ''));
      } else if (field === 'tanggalPerolehan' || field === 'tanggalMutasi') {
        const [d, m, y] = newValue.split('/');
        payload[field] = new Date(`${y}-${m}-${d}T00:00:00Z`);
      } else {
        payload[field] = newValue;
      }

      const res = await updateMutasiAset(row.id, payload);
      if (res.success) { setEditingCell(null); onRefresh(); } else alert(res.message);
    } catch (e) { alert("Gagal simpan."); } finally { setSavingCell(null); }
  };

  if (!data?.length) return (
    <div className="flex flex-col items-center justify-center py-12 bg-slate-50 border-2 border-dashed rounded-2xl">
      <PackageOpen className="w-12 h-12 text-slate-300 mb-3" />
      <p className="text-slate-500 font-medium">Belum ada data mutasi.</p>
    </div>
  );

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden relative">
      {selectedIds.length > 0 && (
        <div className="bg-amber-50/90 border-b px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-amber-900 font-bold">{selectedIds.length} data dipilih</span>
          <button onClick={async () => { if(confirm("Hapus?")) { setIsBulkDeleting(true); await deleteBulkMutasiAset(selectedIds); setSelectedIds([]); onRefresh(); setIsBulkDeleting(false); }}} className="flex items-center gap-2 bg-rose-600 text-white px-3 py-1.5 rounded-lg text-sm">
            {isBulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Hapus
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <Table className="min-w-max">
          <TableHeader className="bg-slate-50/80 border-b">
            <TableRow>
              <TableHead className="w-[40px] text-center"><input type="checkbox" checked={selectedIds.length === data.length} onChange={handleSelectAll} className="accent-amber-600" /></TableHead>
              <TableHead className="w-[50px] text-center">No</TableHead>
              <TableHead>Tgl Mutasi</TableHead>
              <TableHead>No. Register</TableHead>
              <TableHead>Nama Aset</TableHead>
              <TableHead className="text-center">Jml</TableHead>
              <TableHead className="text-right">Lokasi Awal</TableHead>
              <TableHead className="text-right">Lokasi Tujuan</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={row.id} className={selectedIds.includes(row.id) ? 'bg-amber-50/40' : 'hover:bg-slate-50'}>
                <TableCell className="text-center"><input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => handleSelectRow(row.id)} className="accent-amber-600" /></TableCell>
                <TableCell className="text-center text-slate-500">{idx + 1}</TableCell>
                <TableCell><EditableCell row={row} field="tanggalMutasi" value={formatToDDMMYYYY(row.tanggalMutasi)} displayValue={formatTanggalIndo(row.tanggalMutasi)} onSave={handleInlineSave} isSaving={savingCell?.id === row.id && savingCell?.field === "tanggalMutasi"} editingCell={editingCell} setEditingCell={setEditingCell} /></TableCell>
                <TableCell><EditableCell row={row} field="nomorRegisterAset" value={row.nomorRegisterAset} displayValue={<span className="font-mono text-xs">{row.nomorRegisterAset}</span>} onSave={handleInlineSave} isSaving={savingCell?.id === row.id && savingCell?.field === "nomorRegisterAset"} editingCell={editingCell} setEditingCell={setEditingCell} /></TableCell>
                <TableCell><EditableCell row={row} field="namaAset" value={row.namaAset} displayValue={<span className="font-bold">{row.namaAset}</span>} onSave={handleInlineSave} isSaving={savingCell?.id === row.id && savingCell?.field === "namaAset"} editingCell={editingCell} setEditingCell={setEditingCell} /></TableCell>
                <TableCell><EditableCell row={row} field="jumlah" value={row.jumlah} displayValue={<span className="text-center block">{row.jumlah}</span>} onSave={handleInlineSave} isSaving={savingCell?.id === row.id && savingCell?.field === "jumlah"} editingCell={editingCell} setEditingCell={setEditingCell} /></TableCell>
                <TableCell><EditableCell row={row} field="lokasiAwal" value={row.lokasiAwal} displayValue={<span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-xs">{row.lokasiAwal}</span>} onSave={handleInlineSave} isSaving={savingCell?.id === row.id && savingCell?.field === "lokasiAwal"} editingCell={editingCell} setEditingCell={setEditingCell} /></TableCell>
                <TableCell><EditableCell row={row} field="lokasiTujuan" value={row.lokasiTujuan} displayValue={<span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs">{row.lokasiTujuan}</span>} onSave={handleInlineSave} isSaving={savingCell?.id === row.id && savingCell?.field === "lokasiTujuan"} editingCell={editingCell} setEditingCell={setEditingCell} /></TableCell>
                <TableCell>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => onEdit(row)} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded"><Pencil className="w-4 h-4" /></button>
                    <button onClick={async () => { if(confirm("Hapus?")) { setDeletingId(row.id); await deleteMutasiAset(row.id); onRefresh(); setDeletingId(null); }}} className="p-1.5 text-rose-600 hover:bg-rose-100 rounded">{deletingId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}