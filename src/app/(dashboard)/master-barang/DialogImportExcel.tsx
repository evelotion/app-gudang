"use client"

import { useState, useRef } from "react"
import { FileUp, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { importBarangExcel } from "@/actions/barang"
import * as XLSX from "xlsx"

export default function DialogImportExcel({ onRefresh }: { onRefresh: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // FUNGSI KHUSUS BACA FORMAT PRN BCA SYARIAH
  const parsePRN = (text: string) => {
    const lines = text.split('\n');
    let isDataMode = false;
    const parsedData = [];

    for (let line of lines) {
      // Deteksi mulai data (setelah garis '---')
      if (line.startsWith('---')) {
        isDataMode = true;
        continue;
      }
      // Berhenti kalau ketemu total atau '='
      if (line.includes('Total') || line.startsWith('===')) {
        isDataMode = false;
        continue;
      }

      if (isDataMode && line.trim().length > 20) {
        // Ambil berdasarkan hitungan spasi karakter (Fixed-Width)
        const kode_barang = line.substring(4, 15).trim();
        const nama_barang = line.substring(16, 45).trim();
        const satuan = line.substring(46, 56).trim();
        const nomorator = line.substring(57, 86).trim();
        const stok_min = parseInt(line.substring(87, 96).replace(/,/g, '')) || 0;
        const stok = parseInt(line.substring(97, 107).replace(/,/g, '')) || 0;
        const harga_satuan = parseFloat(line.substring(108, 122).replace(/,/g, '')) || 0;
        const supplier = line.substring(137).trim();

        if (kode_barang && nama_barang) {
          parsedData.push({
            kode_barang, nama_barang, satuan, nomorator, stok_min, stok, harga_satuan, supplier
          });
        }
      }
    }
    return parsedData;
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const toastId = toast.loading(`Membaca file ${file.name}...`);

    try {
      let formattedData: any[] = [];

      // CEK APAKAH FILE PRN ATAU EXCEL
      if (file.name.toUpperCase().endsWith('.PRN')) {
        const textData = await file.text();
        formattedData = parsePRN(textData);
      } else {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        formattedData = jsonData.map((row) => ({
          kode_barang: row["Kode Barang"] || row["KODE"] || row["kode_barang"],
          nama_barang: row["Nama Barang"] || row["NAMA"] || row["nama_barang"],
          satuan: row["Satuan"] || row["SATUAN"] || row["satuan"],
          stok: row["Persediaan"] || row["Stok"] || row["stok"] || 0,
          stok_min: row["Stok Min"] || row["Stok Min."] || row["stok_min"] || 0,
          harga_satuan: row["Harga Satuan"] || row["Harga"] || row["harga_satuan"] || 0,
          nomorator: row["Nomorator"] || row["nomorator"] || "",
          supplier: row["Supplier"] || row["supplier"] || "",
        })).filter(item => item.kode_barang && item.nama_barang);
      }

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
      toast.error("Gagal memproses file.", { id: toastId });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; 
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-500/20 px-4 py-2 text-sm transition-all"
      >
        <FileUp className="w-4 h-4" />
        Import Data
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileUp className="w-5 h-5 text-emerald-500" /> Import Master Barang
              </h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Upload file <b>.PRN</b> dari sistem lama, atau gunakan format <b>.xlsx / .csv</b>.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
              {loading ? (
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-3" />
              ) : (
                <FileUp className="w-10 h-10 text-slate-400 group-hover:text-emerald-500 mb-3 transition-colors" />
              )}
              <p className="text-sm font-bold text-slate-700">Klik untuk pilih file</p>
              <p className="text-xs text-slate-400 mt-1">Mendukung .PRN, .xlsx, .csv</p>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".xlsx, .xls, .csv, .prn, .PRN" // Tambah accept .PRN disini
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