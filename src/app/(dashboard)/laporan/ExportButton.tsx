"use client"

import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export default function ExportButton({ riwayat }: { riwayat: any[] }) {
  const handleExport = () => {
    if (!riwayat || riwayat.length === 0) {
      toast.error("Tidak ada data untuk diexport!");
      return;
    }

    const toastId = toast.loading("Menyiapkan file Excel...");

    try {
      // Ratakan (flatten) data dari database supaya enak dibaca di kolom Excel
      const dataExcel = riwayat.flatMap((r) => 
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

      // Bikin worksheet dan workbook pakai library xlsx
      const worksheet = XLSX.utils.json_to_sheet(dataExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Barang Keluar");

      // Generate file dan otomatis download
      XLSX.writeFile(workbook, `Laporan_Barang_Keluar_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success("Berhasil didownload!", { id: toastId });
    } catch (error) {
      toast.error("Gagal membuat file Excel.", { id: toastId });
    }
  };

  return (
    <button 
      onClick={handleExport} 
      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-emerald-600/20"
    >
      <Download className="w-5 h-5" /> 
      Export to Excel
    </button>
  );
}