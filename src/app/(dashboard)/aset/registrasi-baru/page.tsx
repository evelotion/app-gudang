"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FormRegistrasi from "./form-registrasi";
import DataTableRegistrasi from "./data-table";
import { FilePlus, Download, Printer } from "lucide-react"; 
import { getRegistrasiAset } from "@/actions/aset";

// --- IMPORT LIBRARY PDF ---
import jsPDF from "jspdf";
import "jspdf-autotable";

// ==========================================
// FUNGSI HELPER & CETAK PDF
// ==========================================
const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
};

const handlePrintPDF = (tanggalTerpilih: string, dataHarian: any[]) => {
  const doc = new jsPDF("l", "mm", "a4"); 

  // --- HEADER ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("REGISTRASI ASET DAN BARANG NON INVENTARIS BARU", 148, 15, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("PT BANK BCA SYARIAH TAHUN 2026", 148, 22, { align: "center" });

  // --- TABLE DATA ---
  let totalHarga = 0;
  const tableData = dataHarian.map((item, index) => {
    totalHarga += Number(item.hargaPerolehan);
    return [
      index + 1,
      item.nomorRegisterAset,
      item.namaAset,
      item.golonganAset,
      item.jumlah,
      new Date(item.tanggalPerolehan).toLocaleDateString("id-ID"),
      formatRupiah(item.hargaPerolehan),
      item.cabangUnitKerja,
      item.userPengguna,
      item.lokasiPosisiAset,
    ];
  });

  // --- RENDER TABLE ---
  (doc as any).autoTable({
    startY: 30,
    head: [["No", "Nomor Register Aset", "Nama Aset", "Golongan Aset", "Jumlah", "Tgl Perolehan", "Harga Perolehan", "Cabang/Unit", "User Pengguna", "Lokasi/Posisi"]],
    body: tableData,
    foot: [
      [{ content: "Total", colSpan: 6, styles: { halign: "center", fontStyle: "bold" } }, 
       { content: formatRupiah(totalHarga), styles: { halign: "right", fontStyle: "bold" } }, 
       "", "", ""]
    ],
    theme: "grid",
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], halign: 'center' },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'right' },
    }
  });

  // --- FOOTER TANDA TANGAN ---
  const finalY = (doc as any).lastAutoTable.finalY + 20; 
  const tglCetak = new Date(tanggalTerpilih).toLocaleDateString("id-ID");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Supervisi", 100, finalY, { align: "center" });
  doc.text("Inputer", 200, finalY, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.text("Novianti Siswandi", 100, finalY + 20, { align: "center" });
  doc.text("Indra Dwi Ananda", 200, finalY + 20, { align: "center" });
  
  doc.text(`Tanggal : ${tglCetak}`, 100, finalY + 25, { align: "center" });
  doc.text(`Tanggal : ${tglCetak}`, 200, finalY + 25, { align: "center" });

  doc.save(`Registrasi_Aset_${tanggalTerpilih}.pdf`);
};

// ==========================================
// KOMPONEN UTAMA
// ==========================================
export default function RegistrasiAsetPage() {
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // State baru untuk Grouping berdasarkan Tanggal
  const [groupedData, setGroupedData] = useState<Record<string, any[]>>({});
  const [selectedDate, setSelectedDate] = useState<string>("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const rawData = await getRegistrasiAset();
      
      const safeData = (rawData || []).map((item) => ({
        ...item,
        hargaPerolehan: Number(item.hargaPerolehan),
        tanggalPerolehan: item.tanggalPerolehan.toISOString(),
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }));
      
      // LOGIKA PENGELOMPOKAN DATA BERDASARKAN TANGGAL PEROLEHAN
      const grouped = safeData.reduce((acc: any, item: any) => {
        // Ambil bagian tanggalnya saja (YYYY-MM-DD)
        const dateKey = item.tanggalPerolehan.split('T')[0];
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(item);
        return acc;
      }, {});

      setGroupedData(grouped);
      
      // Otomatis pilih tanggal terbaru saat pertama kali load
      const availableDates = Object.keys(grouped).sort().reverse();
      if (availableDates.length > 0) {
        setSelectedDate(availableDates[0]);
      }
      
    } catch (error) {
      console.error("Gagal memuat data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSuccess = () => {
    setShowForm(false);
    loadData(); 
  };

  // Data yang akan ditampilkan di tabel berdasarkan tanggal yang dipilih
  const currentData = groupedData[selectedDate] || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Registrasi Aset Baru</h1>
          <p className="text-sm text-slate-500">Pencatatan aset dan barang non-inventaris baru.</p>
        </div>
        
        {!showForm && (
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Opsi Pilih Tanggal & Tombol Cetak PDF (Muncul kalau ada data) */}
            {Object.keys(groupedData).length > 0 && (
              <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
                <select 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium py-1.5 pl-3 pr-8 outline-none cursor-pointer"
                >
                  {Object.keys(groupedData).sort().reverse().map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                    </option>
                  ))}
                </select>
                
                <button 
                  onClick={() => handlePrintPDF(selectedDate, currentData)}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                >
                  <Printer className="w-4 h-4" /> Cetak PDF
                </button>
              </div>
            )}

            <button 
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
            >
              <FilePlus className="w-4 h-4" /> Tambah Registrasi
            </button>
          </div>
        )}
      </div>

      {/* Form Input */}
      {showForm && (
        <FormRegistrasi onCancel={() => setShowForm(false)} onSuccess={handleSuccess} />
      )}

      {/* Area Tabel */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-base text-slate-800">
            Daftar Registrasi {selectedDate ? `- ${new Date(selectedDate).toLocaleDateString('id-ID', { dateStyle: 'long' })}` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-500">Memuat data...</div>
          ) : (
             <DataTableRegistrasi data={currentData} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}