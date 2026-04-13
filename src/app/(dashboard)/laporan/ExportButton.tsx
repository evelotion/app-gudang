"use client"

import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export default function ExportButton({ type, data }: { type: "persediaan" | "keluar", data: any[] }) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      toast.error("Tidak ada data untuk diexport!");
      return;
    }

    const toastId = toast.loading("Menyiapkan file Excel...");

    try {
      let dataExcel = [];
      let fileName = "";

      if (type === "persediaan") {
        // FORMAT 1: STANDAR BANK BCA SYARIAH (.PRN)
        dataExcel = data.map((item, index) => ({
          "No.": index + 1,
          "Kode Barang": item.kode_barang,
          "Nama Barang": item.nama_barang,
          "Satuan": item.satuan,
          "Nomorator": item.nomorator || "-",
          "Stok Min.": item.stok_min,
          "Persediaan": item.stok,
          "Harga Satuan": item.harga_satuan,
          "Harga Total": item.stok * item.harga_satuan, // Kalkulasi otomatis
          "Supplier": item.supplier || "-"
        }));
        fileName = `Laporan_Persediaan_${new Date().toISOString().split('T')[0]}.xlsx`;
      } else {
        // FORMAT 2: RIWAYAT BARANG KELUAR
        dataExcel = data.flatMap((r) => 
          r.items.map((item: any) => ({
            "No Dokumen": r.no_dokumen,
            "Tanggal Request": new Date(r.tanggal_request).toLocaleDateString('id-ID'),
            "Media Request": r.media_request,
            "Jenis Permintaan": r.jenis_permintaan,
            "Cabang / Unit": r.cabang,
            "PIC Pengambil": r.pic_nama,
            "Kode Barang": item.barang.kode_barang,
            "Nama Barang": item.barang.nama_barang,
            "Qty Diambil": item.qty_diambil,
            "Satuan": item.barang.satuan,
          }))
        );
        fileName = `Laporan_Barang_Keluar_${new Date().toISOString().split('T')[0]}.xlsx`;
      }

      // Bikin worksheet dan workbook pakai library xlsx
      const worksheet = XLSX.utils.json_to_sheet(dataExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, type === "persediaan" ? "Data Stok" : "Barang Keluar");

      // Generate file dan otomatis download
      XLSX.writeFile(workbook, fileName);
      
      toast.success("Berhasil didownload!", { id: toastId });
    } catch (error) {
      toast.error("Gagal membuat file Excel.", { id: toastId });
    }
  };

  return (
    <button 
      onClick={handleExport} 
      className={`flex items-center justify-center gap-2 px-5 py-2.5 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg ${
        type === "persediaan" 
          ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30" 
          : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30"
      }`}
    >
      <Download className="w-5 h-5" /> 
      Export to Excel
    </button>
  );
}