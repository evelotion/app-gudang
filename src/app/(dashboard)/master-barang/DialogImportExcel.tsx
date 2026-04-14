"use client"

import { useState, useRef } from "react"
import { FileUp, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { importBarangExcel } from "@/actions/barang"
import * as XLSX from "xlsx" // Pakai library yang udah lo install

export default function DialogImportExcel({ onRefresh }: { onRefresh: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const toastId = toast.loading("Membaca file Excel...");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Convert Excel ke JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      // Mapping format Excel ke format Database kita
      const formattedData = jsonData.map((row) => ({
        kode_barang: row["Kode Barang"] || row["KODE"] || row["kode_barang"],
        nama_barang: row["Nama Barang"] || row["NAMA"] || row["nama_barang"],
        satuan: row["Satuan"] || row["SATUAN"] || row["satuan"],
        stok: row["Persediaan"] || row["Stok"] || row["stok"] || 0,
        stok_min: row["Stok Min"] || row["Stok Min."] || row["stok_min"] || 0,
        harga_satuan: row["Harga Satuan"] || row["Harga"] || row["harga_satuan"] || 0,
        nomorator: row["Nomorator"] || row["nomorator"] || "",
        supplier: row["Supplier"] || row["supplier"] || "",
      })).filter(item => item.kode_barang && item.nama_barang); // Pastikan kode & nama ada

      if (formattedData.length === 0) {
        toast.error("Data kosong atau format kolom tidak sesuai!", { id: toastId });
        setLoading(false);
        return;
      }

      toast.loading(`Menyimpan ${formattedData.length} barang ke database...`, { id: toastId });
      
      const res = await importBarangExcel(formattedData);
      
      if (res.success) {
        toast.success(`${res.count} Barang berhasil diimport!`, { id: toastId });
        setIsOpen(false);
        onRefresh();
      } else {
        toast.error(res.error, { id: toastId });
      }
    } catch (error) {
      toast.error("Gagal memproses file Excel.", { id: toastId });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input file
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-500/20 px-4 py-2 text-sm transition-all"
      >
        <FileUp className="w-4 h-4" />
        Import Excel
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileUp className="w-5 h-5 text-emerald-500" /> Import Data Master
              </h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Upload file Excel (.xlsx / .csv). Pastikan baris pertama memiliki *header* kolom seperti: <b>Kode Barang, Nama Barang, Satuan, Stok, Harga Satuan</b>.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
              {loading ? (
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-3" />
              ) : (
                <FileUp className="w-10 h-10 text-slate-400 group-hover:text-emerald-500 mb-3 transition-colors" />
              )}
              <p className="text-sm font-bold text-slate-700">Klik untuk pilih file Excel</p>
              <p className="text-xs text-slate-400 mt-1">.xlsx atau .csv maksimal 5MB</p>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={loading}
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button disabled={loading} type="button" onClick={() => setIsOpen(false)} className="w-full py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}