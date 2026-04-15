"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Loader2, FolderOpen, Edit2, Check, X as XIcon } from "lucide-react";
import { deleteRegistrasiAset, deleteBulkRegistrasiAset, updateRegistrasiAset } from "@/actions/aset";
import { formatTanggalIndo } from "@/lib/utils"; 

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
};

const formatToDDMMYYYY = (dateVal: any) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
};

// ==========================================
// KOMPONEN: CELL BISA DI-EDIT (INLINE EDITING)
// ==========================================
const EditableCell = ({ row, field, value, displayValue, onSave, isSaving, editingCell, setEditingCell }: any) => {
  const isEditing = editingCell?.id === row.id && editingCell?.field === field;
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => { setLocalVal(value) }, [value, isEditing]);

  if (isEditing) {
    return (
      <div className="flex items-center gap-1.5 w-full min-w-[130px]">
        <input 
          type="text" 
          autoFocus
          className="w-full text-xs p-1.5 border border-indigo-400 rounded focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm bg-white"
          value={localVal}
          onChange={e => setLocalVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') onSave(row, field, localVal);
            if (e.key === 'Escape') setEditingCell(null);
          }}
        />
        {isSaving ? (
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600 flex-shrink-0" />
        ) : (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onSave(row, field, localVal)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="Simpan (Enter)">
              <Check className="w-3.5 h-3.5"/>
            </button>
            <button onClick={() => setEditingCell(null)} className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Batal (Esc)">
              <XIcon className="w-3.5 h-3.5"/>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="group flex items-center gap-2 cursor-pointer border border-transparent hover:border-indigo-200 hover:bg-indigo-50/50 px-1.5 py-1 rounded transition-all"
      onClick={() => setEditingCell({ id: row.id, field })}
      title="Klik untuk edit langsung"
    >
      <div className="flex-grow">{displayValue}</div>
      <Edit2 className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  );
};


export default function DataTableRegistrasi({ data, onEdit, onRefresh }: { data: any[], onEdit: (item: any) => void, onRefresh: () => void }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // STATE UNTUK INLINE EDITING
  const [editingCell, setEditingCell] = useState<{id: string, field: string} | null>(null);
  const [savingCell, setSavingCell] = useState<{id: string, field: string} | null>(null);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(data.map(item => item.id));
    else setSelectedIds([]);
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} data terpilih?`)) return;
    setIsBulkDeleting(true);
    const res = await deleteBulkRegistrasiAset(selectedIds);
    setIsBulkDeleting(false);

    if (res.success) {
      setSelectedIds([]);
      onRefresh(); 
    } else alert(res.message);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data aset ini?")) return;
    setDeletingId(id);
    const res = await deleteRegistrasiAset(id);
    setDeletingId(null);

    if (res.success) {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      onRefresh(); 
    } else alert(res.message);
  };

  // LOGIC SIMPAN INLINE EDITING KE DATABASE
  const handleInlineSave = async (row: any, field: string, newValue: string) => {
    // Validasi Tanggal
    if (field === 'tanggalPerolehan') {
      const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/\d{4}$/;
      if (!dateRegex.test(newValue)) {
        alert("Format tanggal wajib DD/MM/YYYY (Contoh: 01/01/2026)");
        return;
      }
    }

    setSavingCell({ id: row.id, field });
    
    try {
      // 1. Re-build Payload lengkap dari data row saat ini
      const payload = {
        tanggalInput: new Date(row.tanggalInput),
        nomorRegisterAset: row.nomorRegisterAset,
        namaAset: row.namaAset,
        golonganAset: row.golonganAset,
        jumlah: Number(row.jumlah),
        tanggalPerolehan: new Date(row.tanggalPerolehan),
        hargaPerolehan: Number(row.hargaPerolehan),
        cabangUnitKerja: row.cabangUnitKerja,
        userPengguna: row.userPengguna,
        lokasiPosisiAset: row.lokasiPosisiAset,
        inputerName: row.inputerName,
        supervisorName: row.supervisorName || "",
      };

      // 2. Timpa dengan field yang barusan diedit
      if (field === 'jumlah' || field === 'hargaPerolehan') {
        (payload as any)[field] = Number(String(newValue).replace(/\D/g, '')); // Buang huruf kalau ada
      } else if (field === 'tanggalPerolehan') {
        const [d, m, y] = newValue.split('/');
        (payload as any)[field] = new Date(`${y}-${m}-${d}T00:00:00Z`);
      } else {
        (payload as any)[field] = newValue;
      }

      // 3. Kirim ke Server Action
      const res = await updateRegistrasiAset(row.id, payload as any);
      if (res.success) {
        setEditingCell(null);
        onRefresh();
      } else {
        alert(res.message);
      }
    } catch (error) {
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setSavingCell(null);
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
      
      {/* BAR AKSI MASSAL */}
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
              <TableHead className="font-bold text-slate-600">Harga Perolehan</TableHead>
              <TableHead className="font-bold text-slate-600">Cabang / Unit</TableHead>
              <TableHead className="font-bold text-slate-600">User Pengguna</TableHead>
              <TableHead className="text-center font-bold text-slate-600">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => {
              const isSelected = selectedIds.includes(row.id);
              
              // Helper untuk mengecek apakah cell ini sedang disave
              const isSaving = (field: string) => savingCell?.id === row.id && savingCell?.field === field;

              return (
                <TableRow key={row.id} className={`transition-colors ${isSelected ? 'bg-indigo-50/50 hover:bg-indigo-50/80' : 'hover:bg-slate-50'}`}>
                  <TableCell className="text-center">
                    <input 
                      type="checkbox" 
                      checked={isSelected} 
                      onChange={() => handleSelectRow(row.id)} 
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer accent-indigo-600" 
                    />
                  </TableCell>
                  <TableCell className="text-center font-medium text-slate-500">{index + 1}</TableCell>
                  
                  <TableCell>
                    <EditableCell row={row} field="nomorRegisterAset" value={row.nomorRegisterAset} displayValue={<span className="font-semibold text-slate-800">{row.nomorRegisterAset}</span>} onSave={handleInlineSave} isSaving={isSaving("nomorRegisterAset")} editingCell={editingCell} setEditingCell={setEditingCell} />
                  </TableCell>
                  
                  <TableCell>
                    <EditableCell row={row} field="namaAset" value={row.namaAset} displayValue={<span className="text-slate-700">{row.namaAset}</span>} onSave={handleInlineSave} isSaving={isSaving("namaAset")} editingCell={editingCell} setEditingCell={setEditingCell} />
                  </TableCell>
                  
                  <TableCell>
                    <EditableCell row={row} field="golonganAset" value={row.golonganAset} displayValue={<span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold tracking-wide">{row.golonganAset}</span>} onSave={handleInlineSave} isSaving={isSaving("golonganAset")} editingCell={editingCell} setEditingCell={setEditingCell} />
                  </TableCell>

                  <TableCell>
                    <EditableCell row={row} field="jumlah" value={row.jumlah} displayValue={<span className="font-medium text-slate-700 text-center block">{row.jumlah}</span>} onSave={handleInlineSave} isSaving={isSaving("jumlah")} editingCell={editingCell} setEditingCell={setEditingCell} />
                  </TableCell>

                  <TableCell>
                    <EditableCell row={row} field="tanggalPerolehan" value={formatToDDMMYYYY(row.tanggalPerolehan)} displayValue={<span className="text-slate-600">{formatTanggalIndo(row.tanggalPerolehan)}</span>} onSave={handleInlineSave} isSaving={isSaving("tanggalPerolehan")} editingCell={editingCell} setEditingCell={setEditingCell} />
                  </TableCell>

                  <TableCell>
                    <EditableCell row={row} field="hargaPerolehan" value={row.hargaPerolehan} displayValue={<span className="font-semibold text-emerald-600">{formatRupiah(row.hargaPerolehan)}</span>} onSave={handleInlineSave} isSaving={isSaving("hargaPerolehan")} editingCell={editingCell} setEditingCell={setEditingCell} />
                  </TableCell>

                  <TableCell>
                    <EditableCell row={row} field="cabangUnitKerja" value={row.cabangUnitKerja} displayValue={<span className="text-slate-600">{row.cabangUnitKerja}</span>} onSave={handleInlineSave} isSaving={isSaving("cabangUnitKerja")} editingCell={editingCell} setEditingCell={setEditingCell} />
                  </TableCell>

                  <TableCell>
                    <EditableCell row={row} field="userPengguna" value={row.userPengguna} displayValue={<span className="text-slate-600">{row.userPengguna}</span>} onSave={handleInlineSave} isSaving={isSaving("userPengguna")} editingCell={editingCell} setEditingCell={setEditingCell} />
                  </TableCell>
                  
                  {/* AKSI DEFAULT (PENCIL & TRASH) TETAP ADA */}
                  <TableCell>
                    <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onEdit(row)} 
                        className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors"
                        title="Edit Full (Buka Modal)"
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