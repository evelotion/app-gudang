"use client"

import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export default function ExportButton({ 
  type, 
  data, 
  disabled 
}: { 
  type: "persediaan" | "keluar" | "masuk", 
  data: any[],
  disabled?: boolean
}) {
  const handleExport = () => {
    if (!data || data.length === 0 || disabled) {
      toast.error("Tidak ada data untuk diexport pada periode ini!");
      return;
    }

    const toastId = toast.loading("Menyiapkan file Excel...");

    try {
      let dataExcel = [];
      let fileName = "";
      const dateString = new Date().toISOString().split('T')[0];

      if (type === "persediaan") {
        dataExcel = data.map((item, index) => ({
          "No.": index + 1,
          "Kode Barang": item.kode_barang,
          "Nama Barang": item.nama_barang,
          "Satuan": item.satuan,
          "Nomorator": item.nomorator || "-",
          "Stok Min.": item.stok_min,
          "Persediaan": item.stok,
          "Harga Satuan": item.harga_satuan,
          "Harga Total": item.stok * item.harga_satuan, 
          "Supplier": item.supplier || "-"
        }));
        fileName = `Laporan_Persediaan_Terkini_${dateString}.xlsx`;
      
      } else if (type === "masuk") {
        // FORMAT BARU: RIWAYAT BARANG MASUK
        dataExcel = data.flatMap((r) => 
          r.items.map((item: any) => ({
            "No Dokumen": r.no_dokumen,
            "Tanggal Masuk": new Date(r.tanggal_masuk).toLocaleDateString('id-ID'),
            "Supplier": r.supplier,
            "Penerima": r.penerima,
            "Kode Barang": item.barang.kode_barang,
            "Nama Barang": item.barang.nama_barang,
            "Qty Masuk": item.qty_masuk,
            "Satuan": item.barang.satuan,
            "Keterangan": r.keterangan || "-"
          }))
        );
        fileName = `Laporan_Barang_Masuk_${dateString}.xlsx`;

      } else if (type === "keluar") {
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
        fileName = `Laporan_Barang_Keluar_${dateString}.xlsx`;
      }

      const worksheet = XLSX.utils.json_to_sheet(dataExcel);
      const workbook = XLSX.utils.book_new();
      
      let sheetName = "Data Stok";
      if (type === "masuk") sheetName = "Barang Masuk";
      if (type === "keluar") sheetName = "Barang Keluar";

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, fileName);
      
      toast.success("Berhasil didownload!", { id: toastId });
    } catch (error) {
      toast.error("Gagal membuat file Excel.", { id: toastId });
    }
  };

  return (
    <button 
      onClick={handleExport} 
      disabled={disabled}
      className={`flex w-full items-center justify-center gap-2 px-5 py-2.5 text-white rounded-xl font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
        type === "persediaan" 
          ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30" 
          : type === "masuk"
          ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"
          : "bg-amber-600 hover:bg-amber-700 shadow-amber-600/30"
      }`}
    >
      <Download className="w-5 h-5" /> 
      {disabled ? "Data Kosong" : "Export Excel"}
    </button>
  );
}