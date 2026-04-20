"use client";

import { useState, useEffect } from "react";
import FormMutasi from "./form-mutasi";
import DataTableMutasi from "./data-table";
import { ArrowRightLeft, Printer } from "lucide-react"; 
import { getMutasiAset } from "@/actions/aset"; 
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
    doc.text("LAPORAN MUTASI ASET", 148, 15, { align: "center" });
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
        item.jumlah,
        new Date(item.tanggalPerolehan).toLocaleDateString("id-ID"), // <-- DATA KOLOM BARU (Tgl Perolehan)
        formatRupiah(item.hargaPerolehan), 
        formatRupiah(item.akmPenyusutan), 
        item.lokasiAwal,
        item.lokasiTujuan, 
        item.alasanMutasi
      ];
    });

    autoTable(doc, {
      startY: 30,
      // HEADER DITAMBAHKAN "Tgl Perolehan"
      head: [["No", "Tgl Mutasi", "No. Register", "Nama Aset", "Jml", "Tgl Perolehan", "Harga Perolehan", "Akm. Susut", "Lokasi Awal", "Lokasi Tujuan", "Alasan"]],
      body: tableData,
      foot: [
        // colSpan DIGANTI DARI 5 MENJADI 6
        [{ content: "Total", colSpan: 6, styles: { halign: "center", fontStyle: "bold" } }, 
         { content: formatRupiah(tHarga), styles: { halign: "right", fontStyle: "bold" } }, 
         { content: formatRupiah(tSusut), styles: { halign: "right", fontStyle: "bold", textColor: [220, 38, 38] } }, 
         "", "", ""]
      ],
      theme: "grid",
      headStyles: { fillColor: "#4F46E5", textColor: "#FFFFFF", halign: 'center' }, // Tema Indigo untuk header PDF
      footStyles: { fillColor: "#E0E7FF", textColor: "#4F46E5" }, 
      styles: { fontSize: 8, cellPadding: 2 },
      // INDEX STYLES DISESUAIKAN (Geser 1 kolom ke kanan setelah jumlah)
      columnStyles: { 0: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' }, 6: { halign: 'right' }, 7: { halign: 'right' } }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20; 
    const tglCetak = new Date(tanggalTerpilih).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Supervisi", 100, finalY, { align: "center" });
    doc.text("Operator", 200, finalY, { align: "center" });
    doc.setFont("helvetica", "normal");
    
    // Ambil nama dari data pertama sebagai perwakilan
    const supervisi = dataHarian[0]?.supervisorName || "Novianti Siswandi";
    const operator = dataHarian[0]?.operatorName || "Indra Dwi Ananda";

    doc.text(supervisi, 100, finalY + 20, { align: "center" });
    doc.text(operator, 200, finalY + 20, { align: "center" });
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
      const grouped = (rawData || []).reduce((acc: any, item: any) => {
        const dateKey = item.tanggalInput.toISOString().split('T')[0];
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(item);
        return acc;
      }, {});
      setGroupedData(grouped);
      const dates = Object.keys(grouped).sort().reverse();
      setSelectedDate(dates.length > 0 ? dates[0] : "");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);
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
                  <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent border-none text-sm font-semibold text-slate-700 py-1.5 pl-3 pr-8 outline-none cursor-pointer">
                    {Object.keys(groupedData).sort().reverse().map(d => <option key={d} value={d}>{new Date(d).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</option>)}
                  </select>
                  <button onClick={() => handlePrintPDF(selectedDate, currentData)} className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg text-sm font-bold transition-all">
                    <Printer className="w-4 h-4" /> Cetak PDF
                  </button>
                </div>
              )}
              <button onClick={() => { setEditingData(null); setShowForm(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20">
                <ArrowRightLeft className="w-4 h-4" /> Tambah Mutasi
              </button>
            </div>
          )
        }
      />
      {showForm && <div className="animate-in fade-in zoom-in-95 duration-300"><FormMutasi initialData={editingData} onCancel={() => { setShowForm(false); setEditingData(null); }} onSuccess={() => { setShowForm(false); setEditingData(null); loadData(); }} /></div>}
      <Card className="overflow-hidden border-slate-200/60 animate-in fade-in duration-300">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50"><h2 className="text-lg font-bold text-slate-800">Daftar Mutasi {selectedDate && `- ${new Date(selectedDate).toLocaleDateString('id-ID', { dateStyle: 'long' })}`}</h2></div>
        <CardContent className="p-6 md:p-8">
          {isLoading ? <div className="h-64 flex items-center justify-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200"><span className="animate-pulse">Memuat data...</span></div> : <DataTableMutasi data={currentData} onEdit={(item) => { setEditingData(item); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} onRefresh={loadData} />}
        </CardContent>
      </Card>
    </main>
  );
}