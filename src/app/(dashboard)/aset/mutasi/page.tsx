"use client";

import { useState, useEffect } from "react";
// Lo perlu bikin form-mutasi.tsx dan data-table.tsx yang isinya mirip kayak di hapus-buku
import FormMutasi from "./form-mutasi";
import DataTableMutasi from "./data-table";
import { ArrowRightLeft, Printer } from "lucide-react"; 
import { getMutasiAset } from "@/actions/aset"; // Jangan lupa bikin fungsi ini di actions/aset.ts
import { PageHeader } from "@/components/PageHeader"; 
import { Card, CardContent } from "@/components/ui/card"; 

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);

const handlePrintPDF = (tanggalTerpilih: string, dataHarian: any[]) => {
  if (!dataHarian || dataHarian.length === 0) return alert("Tidak ada data mutasi untuk tanggal ini.");

  try {
    const doc = new jsPDF("l", "mm", "a4"); 
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("MUTASI ASET DAN BARANG NON INVENTARIS BARU", 148, 15, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("PT BANK BCA SYARIAH TAHUN 2026", 148, 22, { align: "center" });

    let tHarga = 0, tSusut = 0;
    const tableData = dataHarian.map((item, index) => {
      tHarga += Number(item.hargaPerolehan);
      tSusut += Number(item.akmPenyusutan);
      return [
        index + 1, 
        new Date(item.tanggalMutasi).toLocaleDateString("id-ID"),
        item.nomorRegisterAset, 
        item.namaAset, 
        item.golonganAset, 
        item.jumlah,
        formatRupiah(item.hargaPerolehan), 
        formatRupiah(item.akmPenyusutan), 
        item.lokasiAwal,
        item.lokasiTujuan, 
        item.alasanMutasi
      ];
    });

    autoTable(doc, {
      startY: 30,
      head: [["No", "Tgl Mutasi", "No. Register", "Nama Aset", "Gol", "Jml", "Harga Perolehan", "Akm. Susut", "Lokasi Awal", "Lokasi Tujuan", "Alasan"]],
      body: tableData,
      foot: [
        [{ content: "Total", colSpan: 6, styles: { halign: "center", fontStyle: "bold" } }, 
         { content: formatRupiah(tHarga), styles: { halign: "right", fontStyle: "bold" } }, 
         { content: formatRupiah(tSusut), styles: { halign: "right", fontStyle: "bold", textColor: [220, 38, 38] } }, 
         "", "", ""]
      ],
      theme: "grid",
      headStyles: { fillColor: "#8EA9DB", textColor: "#000000", halign: 'center' }, 
      footStyles: { fillColor: "#8EA9DB", textColor: "#000000" }, 
      styles: { fontSize: 7, cellPadding: 2 }, // Font dikecilin sikit karena kolom banyak
      columnStyles: { 0: { halign: 'center' }, 5: { halign: 'center' }, 6: { halign: 'right' }, 7: { halign: 'right' }}
    });

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

    doc.save(`Mutasi_Aset_${tanggalTerpilih}.pdf`);
  } catch (error) {
    console.error("Error PDF:", error);
    alert("Gagal mencetak PDF.");
  }
};

export default function MutasiAsetPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [groupedData, setGroupedData] = useState<Record<string, any[]>>({});
  const [selectedDate, setSelectedDate] = useState<string>("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const rawData = await getMutasiAset();
      const safeData = (rawData || []).map((item) => ({
        ...item,
        hargaPerolehan: Number(item.hargaPerolehan),
        akmPenyusutan: Number(item.akmPenyusutan),
        tanggalInput: item.tanggalInput.toISOString(), 
        tanggalMutasi: item.tanggalMutasi.toISOString(),
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
    <main className="flex-1 p-6 lg:p-10 w-full max-w-[1600px] mx-auto space-y-8 pb-12">
      
      <PageHeader 
        title="Mutasi Aset" 
        description="Pencatatan pemindahan lokasi aset dan barang non-inventaris."
        actions={
          !showForm && (
            <div className="flex flex-wrap items-center gap-3">
              {Object.keys(groupedData).length > 0 && (
                <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200/80 shadow-sm">
                  <select 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                    className="bg-transparent border-none text-sm font-semibold text-slate-700 py-1.5 pl-3 pr-8 outline-none cursor-pointer"
                  >
                    {Object.keys(groupedData).sort().reverse().map(date => (
                      <option key={date} value={date}>
                        {new Date(date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                      </option>
                    ))}
                  </select>
                  
                  <button 
                    onClick={() => handlePrintPDF(selectedDate, currentData)} 
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
                  >
                    <Printer className="w-4 h-4" /> Cetak PDF
                  </button>
                </div>
              )}
              
              <button 
                onClick={() => { setEditingData(null); setShowForm(true); }} 
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20"
              >
                <ArrowRightLeft className="w-4 h-4" /> Tambah Mutasi
              </button>
            </div>
          )
        }
      />

      {showForm && (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <FormMutasi 
            initialData={editingData} 
            onCancel={() => { setShowForm(false); setEditingData(null); }} 
            onSuccess={handleSuccess} 
          />
        </div>
      )}

      <Card className="overflow-hidden border-slate-200/60 animate-in fade-in duration-300">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">
            Daftar Mutasi {selectedDate ? `- ${new Date(selectedDate).toLocaleDateString('id-ID', { dateStyle: 'long' })}` : ''}
          </h2>
        </div>
        <CardContent className="p-6 md:p-8">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <span className="font-medium animate-pulse">Memuat data mutasi...</span>
            </div>
          ) : (
            <DataTableMutasi data={currentData} onEdit={handleEdit} onRefresh={loadData} />
          )}
        </CardContent>
      </Card>

    </main>
  );
}