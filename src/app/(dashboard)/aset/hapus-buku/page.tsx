"use client";

import { useState, useEffect } from "react";
import FormHapusBuku from "./form-hapus-buku";
import DataTableHapusBuku from "./data-table";
import { FileMinus, Printer } from "lucide-react"; 
import { getHapusBukuAset } from "@/actions/aset";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);

const handlePrintPDF = (tanggalTerpilih: string, dataHarian: any[]) => {
  if (!dataHarian || dataHarian.length === 0) return alert("Tidak ada data hapus buku untuk tanggal ini.");

  try {
    const doc = new jsPDF("l", "mm", "a4"); 
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("DAFTAR HAPUS BUKU ASET", 148, 15, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("PT BANK BCA SYARIAH TAHUN 2026", 148, 22, { align: "center" });

    let tHarga = 0, tSusut = 0, tBuku = 0;
    const tableData = dataHarian.map((item, index) => {
      tHarga += Number(item.hargaPerolehan);
      tSusut += Number(item.akmPenyusutan);
      tBuku += Number(item.nilaiBuku);
      return [
        index + 1, item.nomorRegisterAset, item.namaAset, item.golonganAset, item.jumlah,
        formatRupiah(item.hargaPerolehan), formatRupiah(item.akmPenyusutan), formatRupiah(item.nilaiBuku),
        item.cabangUnitKerja, item.alasanHapusBuku
      ];
    });

    autoTable(doc, {
      startY: 30,
      head: [["No", "No. Register", "Nama Aset", "Gol", "Jml", "Harga Perolehan", "Akm. Susut", "Nilai Buku", "Cabang/Unit", "Alasan"]],
      body: tableData,
      foot: [
        [{ content: "Total", colSpan: 5, styles: { halign: "center", fontStyle: "bold" } }, 
         { content: formatRupiah(tHarga), styles: { halign: "right", fontStyle: "bold" } }, 
         { content: formatRupiah(tSusut), styles: { halign: "right", fontStyle: "bold", textColor: [220, 38, 38] } }, 
         { content: formatRupiah(tBuku), styles: { halign: "right", fontStyle: "bold" } }, 
         "", ""]
      ],
      theme: "grid",
      headStyles: { fillColor: "#8EA9DB", textColor: "#000000", halign: 'center' }, 
      footStyles: { fillColor: "#8EA9DB", textColor: "#000000" }, 
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 0: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' }}
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20; 
    const tglCetak = new Date(tanggalTerpilih).toLocaleDateString("id-ID");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Supervisi", 100, finalY, { align: "center" });
    doc.text("Operator", 200, finalY, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text("Novianti Siswandi", 100, finalY + 20, { align: "center" });
    doc.text("Indra Dwi Ananda", 200, finalY + 20, { align: "center" });
    doc.text(`Tanggal : ${tglCetak}`, 100, finalY + 25, { align: "center" });
    doc.text(`Tanggal : ${tglCetak}`, 200, finalY + 25, { align: "center" });

    doc.save(`Hapus_Buku_Aset_${tanggalTerpilih}.pdf`);
  } catch (error) {
    console.error("Error PDF:", error);
    alert("Gagal mencetak PDF.");
  }
};

export default function HapusBukuAsetPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [groupedData, setGroupedData] = useState<Record<string, any[]>>({});
  const [selectedDate, setSelectedDate] = useState<string>("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const rawData = await getHapusBukuAset();
      const safeData = (rawData || []).map((item) => ({
        ...item,
        hargaPerolehan: Number(item.hargaPerolehan),
        akmPenyusutan: Number(item.akmPenyusutan),
        nilaiBuku: Number(item.nilaiBuku),
        tanggalInput: item.tanggalInput.toISOString(), 
        tanggalHapusBuku: item.tanggalHapusBuku.toISOString(),
        tanggalPerolehan: item.tanggalPerolehan.toISOString(),
      }));
      
      const grouped = safeData.reduce((acc: any, item: any) => {
        const dateKey = item.tanggalInput.split('T')[0];
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(item);
        return acc;
      }, {});

      setGroupedData(grouped);
      const availableDates = Object.keys(grouped).sort().reverse();
      if (availableDates.length > 0) setSelectedDate(availableDates[0]);
      else setSelectedDate("");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSuccess = () => { setShowForm(false); setEditingData(null); loadData(); };
  const handleEdit = (item: any) => { setEditingData(item); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const currentData = groupedData[selectedDate] || [];

  return (
    // UBAHAN DISINI: Container utama Premium White Card
    <div className="p-6 md:p-8 m-4 md:m-6 bg-white rounded-2xl shadow-sm border border-slate-200 space-y-8 min-h-[calc(100vh-3rem)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hapus Buku Aset</h1>
          <p className="text-sm text-slate-500 mt-1">Pencatatan aset yang dihapus dari pembukuan (Write-off).</p>
        </div>
        
        {!showForm && (
          <div className="flex flex-wrap items-center gap-3">
            {Object.keys(groupedData).length > 0 && (
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200 shadow-sm">
                <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent border-none text-sm font-medium py-1.5 pl-3 pr-8 outline-none cursor-pointer">
                  {Object.keys(groupedData).sort().reverse().map(date => (
                    <option key={date} value={date}>{new Date(date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</option>
                  ))}
                </select>
                <button onClick={() => handlePrintPDF(selectedDate, currentData)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-all">
                  <Printer className="w-4 h-4" /> Cetak PDF
                </button>
              </div>
            )}
            <button onClick={() => { setEditingData(null); setShowForm(true); }} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm">
              <FileMinus className="w-4 h-4" /> Tambah Hapus Buku
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="pt-2">
          <FormHapusBuku initialData={editingData} onCancel={() => { setShowForm(false); setEditingData(null); }} onSuccess={handleSuccess} />
        </div>
      )}

      <div className="pt-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Daftar Hapus Buku {selectedDate ? `- ${new Date(selectedDate).toLocaleDateString('id-ID', { dateStyle: 'long' })}` : ''}
          </h2>
        </div>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Memuat data...
          </div>
        ) : (
          <DataTableHapusBuku data={currentData} onEdit={handleEdit} onRefresh={loadData} />
        )}
      </div>
    </div>
  );
}