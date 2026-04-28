"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PackageOpen, Pencil, Trash2, Loader2, Edit2, Check, X as XIcon, Search, ArrowUpDown, ArrowUp, ArrowDown, FileSpreadsheet } from "lucide-react";
import { deleteMutasiAset, deleteBulkMutasiAset, updateMutasiAset } from "@/actions/aset";
import { toast } from "sonner";

// ==========================================
// HELPER FORMAT
// ==========================================
const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);

const formatToDDMMYYYY = (dateVal: any) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
};

const formatTanggalDisplay = (tanggal: string | Date) => {
  if (!tanggal) return "-";
  return new Intl.DateTimeFormat("id-ID", { 
    day: "numeric", 
    month: "short", 
    year: "numeric" 
  }).format(new Date(tanggal));
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
          className="w-full text-xs p-1.5 border border-indigo-400 rounded focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white shadow-sm"
          value={localVal}
          onChange={e => setLocalVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') onSave(row, field, localVal);
            if (e.key === 'Escape') setEditingCell(null);
          }}
        />
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600 flex-shrink-0" /> : (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onSave(row, field, localVal)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"><Check className="w-3.5 h-3.5"/></button>
            <button onClick={() => setEditingCell(null)} className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"><XIcon className="w-3.5 h-3.5"/></button>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="group flex items-center gap-2 cursor-pointer border border-transparent hover:border-indigo-200 hover:bg-indigo-50/50 px-1.5 py-1 rounded transition-all" onClick={() => setEditingCell({ id: row.id, field })}>
      <div className="flex-grow">{displayValue}</div>
      <Edit2 className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function DataTableMutasi({ data, onEdit, onRefresh }: { data: any[], onEdit: (item: any) => void, onRefresh: () => void }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editingCell, setEditingCell] = useState<{id: string, field: string} | null>(null);
  const [savingCell, setSavingCell] = useState<{id: string, field: string} | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/export/excel/mutasi');
      if (!response.ok) throw new Error('Gagal mengunduh file');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Data_Mutasi_Aset_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Excel berhasil diunduh");
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat export Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const filteredData = data.filter((item) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      item.nomorRegisterAset?.toLowerCase().includes(lowerQuery) ||
      item.namaAset?.toLowerCase().includes(lowerQuery) ||
      item.lokasiAwal?.toLowerCase().includes(lowerQuery) ||
      item.lokasiTujuan?.toLowerCase().includes(lowerQuery) ||
      item.alasanMutasi?.toLowerCase().includes(lowerQuery) ||
      item.golonganAset?.toLowerCase().includes(lowerQuery)
    );
  });

  const processedData = [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    let aValue = a[key];
    let bValue = b[key];
    if (typeof aValue === "string") aValue = aValue.toLowerCase();
    if (typeof bValue === "string") bValue = bValue.toLowerCase();
    if (aValue < bValue) return direction === "asc" ? -1 : 1;
    if (aValue > bValue) return direction === "asc" ? 1 : -1;
    return 0;
  });

  // LOGIKA GROUPING BERDASARKAN GOLONGAN
  const groupedData = processedData.reduce((acc: any, curr) => {
    const golongan = curr.golonganAset || "Tanpa Golongan";
    if (!acc[golongan]) acc[golongan] = [];
    acc[golongan].push(curr);
    return acc;
  }, {});

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 text-slate-300 ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />;
    if (sortConfig.direction === "asc") return <ArrowUp className="w-3 h-3 text-indigo-600 ml-1" />;
    return <ArrowDown className="w-3 h-3 text-indigo-600 ml-1" />;
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => setSelectedIds(e.target.checked ? processedData.map(item => item.id) : []);
  const handleSelectRow = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleBulkDelete = async () => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} data terpilih?`)) return;
    setIsBulkDeleting(true);
    const res = await deleteBulkMutasiAset(selectedIds);
    setIsBulkDeleting(false);
    if (res.success) { setSelectedIds([]); onRefresh(); } else alert(res.message);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
    setDeletingId(id);
    const res = await deleteMutasiAset(id);
    setDeletingId(null);
    if (res.success) { setSelectedIds(prev => prev.filter(selectedId => selectedId !== id)); onRefresh(); } else alert(res.message);
  };

  const handleInlineSave = async (row: any, field: string, newValue: string) => {
    if (field === 'tanggalPerolehan' || field === 'tanggalMutasi') {
      if (!/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/\d{4}$/.test(newValue)) return alert("Format wajib DD/MM/YYYY");
    }
    setSavingCell({ id: row.id, field });
    try {
      const payload = { ...row, 
        jumlah: Number(row.jumlah), hargaPerolehan: Number(row.hargaPerolehan), akmPenyusutan: Number(row.akmPenyusutan),
        tanggalInput: new Date(row.tanggalInput), tanggalMutasi: new Date(row.tanggalMutasi), tanggalPerolehan: new Date(row.tanggalPerolehan),
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

  let globalIdx = 1;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden relative">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" placeholder="Cari register, aset, atau lokasi..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={isExporting} className="text-emerald-700 border-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 w-full sm:w-auto">
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
          {isExporting ? "Memproses..." : "Export Excel"}
        </Button>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-indigo-50/90 backdrop-blur-sm border-b border-indigo-100 px-4 py-3 flex items-center justify-between animate-in slide-in-from-top-2">
          <span className="text-sm text-indigo-900 font-bold">{selectedIds.length} data dipilih</span>
          <button onClick={handleBulkDelete} disabled={isBulkDeleting} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50">
            {isBulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Hapus
          </button>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <Table className="min-w-max">
          <TableHeader className="bg-slate-50/80 border-b border-slate-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40px] text-center"><input type="checkbox" checked={selectedIds.length === processedData.length && processedData.length > 0} onChange={handleSelectAll} className="accent-indigo-600" /></TableHead>
              <TableHead className="w-[50px] text-center font-bold text-slate-600">No</TableHead>
              <TableHead className="font-bold text-slate-600 cursor-pointer hover:bg-slate-100 group select-none" onClick={() => handleSort('tanggalMutasi')}><div className="flex items-center">Tgl Mutasi <SortIcon columnKey="tanggalMutasi" /></div></TableHead>
              <TableHead className="font-bold text-slate-600 cursor-pointer hover:bg-slate-100 group select-none" onClick={() => handleSort('nomorRegisterAset')}><div className="flex items-center">No. Register <SortIcon columnKey="nomorRegisterAset" /></div></TableHead>
              <TableHead className="font-bold text-slate-600 cursor-pointer hover:bg-slate-100 group select-none" onClick={() => handleSort('namaAset')}><div className="flex items-center">Nama Aset <SortIcon columnKey="namaAset" /></div></TableHead>
              <TableHead className="text-center font-bold text-slate-600 cursor-pointer hover:bg-slate-100 group select-none" onClick={() => handleSort('jumlah')}><div className="flex items-center justify-center">Jml <SortIcon columnKey="jumlah" /></div></TableHead>
              <TableHead className="font-bold text-slate-600 cursor-pointer hover:bg-slate-100 group select-none" onClick={() => handleSort('tanggalPerolehan')}><div className="flex items-center">Tgl Perolehan <SortIcon columnKey="tanggalPerolehan" /></div></TableHead>
              <TableHead className="font-bold text-slate-600 cursor-pointer hover:bg-slate-100 group select-none" onClick={() => handleSort('hargaPerolehan')}><div className="flex items-center justify-end">Harga Perolehan <SortIcon columnKey="hargaPerolehan" /></div></TableHead>
              <TableHead className="font-bold text-slate-600 cursor-pointer hover:bg-slate-100 group select-none" onClick={() => handleSort('akmPenyusutan')}><div className="flex items-center justify-end">Akm. Susut <SortIcon columnKey="akmPenyusutan" /></div></TableHead>
              <TableHead className="font-bold text-slate-600 cursor-pointer hover:bg-slate-100 group select-none" onClick={() => handleSort('lokasiAwal')}><div className="flex items-center">Lokasi Awal <SortIcon columnKey="lokasiAwal" /></div></TableHead>
              <TableHead className="font-bold text-slate-600 cursor-pointer hover:bg-slate-100 group select-none" onClick={() => handleSort('lokasiTujuan')}><div className="flex items-center">Lokasi Tujuan <SortIcon columnKey="lokasiTujuan" /></div></TableHead>
              <TableHead className="font-bold text-slate-600 cursor-pointer hover:bg-slate-100 group select-none" onClick={() => handleSort('alasanMutasi')}><div className="flex items-center">Alasan <SortIcon columnKey="alasanMutasi" /></div></TableHead>
              <TableHead className="text-center font-bold text-slate-600">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(groupedData).map(([golongan, items]: [string, any]) => {
              let subTotalJumlah = 0;
              let subTotalHarga = 0;
              let subTotalAkm = 0;

              return (
                <React.Fragment key={golongan}>
                  {/* BARIS HEADER GOLONGAN */}
                  <TableRow className="bg-slate-100/80 hover:bg-slate-100 border-t-2 border-slate-200">
                    <TableCell colSpan={13} className="font-bold text-indigo-900 py-3 uppercase text-xs tracking-wider">
                      Golongan: {golongan}
                    </TableCell>
                  </TableRow>

                  {/* BARIS DATA PER GOLONGAN */}
                  {items.map((row: any) => {
                    subTotalJumlah += Number(row.jumlah);
                    subTotalHarga += Number(row.hargaPerolehan);
                    subTotalAkm += Number(row.akmPenyusutan);
                    const currentIdx = globalIdx++;

                    return (
                      <TableRow key={row.id} className={`transition-colors group ${selectedIds.includes(row.id) ? 'bg-indigo-50/50 hover:bg-indigo-50/80' : 'hover:bg-slate-50'}`}>
                        <TableCell className="text-center"><input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => handleSelectRow(row.id)} className="accent-indigo-600" /></TableCell>
                        <TableCell className="text-center font-medium text-slate-500">{currentIdx}</TableCell>
                        
                        <TableCell><EditableCell row={row} field="tanggalMutasi" value={formatToDDMMYYYY(row.tanggalMutasi)} displayValue={<span className="text-slate-600">{formatTanggalDisplay(row.tanggalMutasi)}</span>} onSave={handleInlineSave} isSaving={savingCell?.id === row.id && savingCell?.field === "tanggalMutasi"} editingCell={editingCell} setEditingCell={setEditingCell} /></TableCell>
                        <TableCell><EditableCell row={row} field="nomorRegisterAset" value={row.nomorRegisterAset} displayValue={<span className="font-mono text-xs font-semibold text-slate-800">{row.nomorRegisterAset}</span>} onSave={handleInlineSave} isSaving={savingCell?.id === row.id && savingCell?.field === "nomorRegisterAset"} editingCell={editingCell} setEditingCell={setEditingCell} /></TableCell>
                        <TableCell><EditableCell row={row} field="namaAset" value={row.namaAset} displayValue={<span className="font-semibold text-slate-800">{row.namaAset}</span>} onSave={handleInlineSave} isSaving={savingCell?.id === row.id && savingCell?.field === "namaAset"} editingCell={editingCell} setEditingCell={setEditingCell} /></TableCell>
                        <TableCell><EditableCell row={row} field="jumlah" value={row.jumlah} displayValue={<span className="block text-center w-full font-medium">{row.jumlah}</span>} onSave={handleInlineSave} isSaving={savingCell?.id === row.id && savingCell?.field === "jumlah"} editingCell={editingCell} setEditingCell={setEditingCell} /></TableCell>
                        
                        <TableCell><EditableCell row={row} field="tanggalPerolehan" value={formatToDDMMYYYY(row.tanggalPerolehan)} displayValue={<span className="text-slate-600">{formatTanggalDisplay(row.tanggalPerolehan)}</span>} onSave={handleInlineSave} isSaving={savingCell?.id === row.id && savingCell?.field === "tanggalPerolehan"} editingCell={editingCell} setEditingCell={setEditingCell} /></TableCell>

                        <TableCell><EditableCell row={row} field="hargaPerolehan" value={row.hargaPerolehan} displayValue={<span className="block text-right w-full text-slate-600">{formatRupiah(row.hargaPerolehan)}</span>} onSave={handleInlineSave} isSaving={savingCell?.id === row.id && savingCell?.field === "hargaPerolehan"} editingCell={editingCell} setEditingCell={setEditingCell} /></TableCell>
                        <TableCell><EditableCell row={row} field="akmPenyusutan" value={row.akmPenyusutan} displayValue={<span className="block text-right w-full text-rose-600 font-medium">{formatRupiah(row.akmPenyusutan)}</span>} onSave={handleInlineSave} isSaving={savingCell?.id === row.id && savingCell?.field === "akmPenyusutan"} editingCell={editingCell} setEditingCell={setEditingCell} /></TableCell>
                        
                        <TableCell><EditableCell row={row} field="lokasiAwal" value={row.lokasiAwal} displayValue={<span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md text-xs font-semibold">{row.lokasiAwal}</span>} onSave={handleInlineSave} isSaving={savingCell?.id === row.id && savingCell?.field === "lokasiAwal"} editingCell={editingCell} setEditingCell={setEditingCell} /></TableCell>
                        <TableCell><EditableCell row={row} field="lokasiTujuan" value={row.lokasiTujuan} displayValue={<span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-semibold">{row.lokasiTujuan}</span>} onSave={handleInlineSave} isSaving={savingCell?.id === row.id && savingCell?.field === "lokasiTujuan"} editingCell={editingCell} setEditingCell={setEditingCell} /></TableCell>
                        <TableCell><EditableCell row={row} field="alasanMutasi" value={row.alasanMutasi} displayValue={<span className="truncate max-w-[120px] inline-block text-slate-600" title={row.alasanMutasi}>{row.alasanMutasi}</span>} onSave={handleInlineSave} isSaving={savingCell?.id === row.id && savingCell?.field === "alasanMutasi"} editingCell={editingCell} setEditingCell={setEditingCell} /></TableCell>

                        <TableCell>
                          <div className="flex gap-2 justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onEdit(row)} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(row.id)} disabled={deletingId === row.id} className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-md transition-colors disabled:opacity-50">
                              {deletingId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {/* BARIS SUBTOTAL PER GOLONGAN */}
                  <TableRow className="bg-indigo-50/50 border-b-2 border-indigo-100 hover:bg-indigo-50/50">
                    <TableCell colSpan={5} className="text-right font-bold text-indigo-900 py-3">
                      SUBTOTAL {golongan.toUpperCase()}:
                    </TableCell>
                    <TableCell className="text-center font-bold text-indigo-900">{subTotalJumlah}</TableCell>
                    <TableCell></TableCell> {/* Kosong untuk Tgl Perolehan */}
                    <TableCell className="text-right font-bold text-indigo-900">{formatRupiah(subTotalHarga)}</TableCell>
                    <TableCell className="text-right font-bold text-rose-700">{formatRupiah(subTotalAkm)}</TableCell>
                    <TableCell colSpan={4}></TableCell> {/* Kosong untuk sisa kolom dikanan */}
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}