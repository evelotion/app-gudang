"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FormHapusBuku from "./form-hapus-buku";
import DataTableHapusBuku from "./data-table";
import { FileMinus, Download } from "lucide-react"; // Import Download icon
import { getHapusBukuAset } from "@/actions/aset";

export default function HapusBukuAsetPage() {
  const [showForm, setShowForm] = useState(false);
  const [dataAset, setDataAset] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const rawData = await getHapusBukuAset();
    const safeData = (rawData || []).map((item) => ({
      ...item,
      hargaPerolehan: Number(item.hargaPerolehan),
      akmPenyusutan: Number(item.akmPenyusutan),
      nilaiBuku: Number(item.nilaiBuku),
      tanggalPerolehan: item.tanggalPerolehan.toISOString(),
      tanggalHapusBuku: item.tanggalHapusBuku.toISOString(),
    }));
    setDataAset(safeData);
    setIsLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hapus Buku Aset</h1>
          <p className="text-sm text-slate-500">Pencatatan penghapusan buku aset dan barang non-inventaris.</p>
        </div>
        {!showForm && (
          <div className="flex items-center gap-3">
            <a 
              href="/api/export/hapus-buku"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm shadow-emerald-200"
            >
              <Download className="w-4 h-4" /> Export Excel
            </a>
            <button 
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm shadow-red-200"
            >
              <FileMinus className="w-4 h-4" /> Catat Hapus Buku
            </button>
          </div>
        )}
      </div>

      {showForm && <FormHapusBuku onCancel={() => setShowForm(false)} onSuccess={() => { setShowForm(false); loadData(); }} />}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-base text-slate-800">Daftar Hapus Buku</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? <div className="h-64 flex items-center justify-center text-slate-500">Memuat data...</div> : <DataTableHapusBuku data={dataAset} />}
        </CardContent>
      </Card>
    </div>
  );
}