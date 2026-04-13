"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FormRegistrasi from "./form-registrasi";
import DataTableRegistrasi from "./data-table";
import { FilePlus } from "lucide-react";
import { getRegistrasiAset } from "@/actions/aset";

export default function RegistrasiAsetPage() {
  const [showForm, setShowForm] = useState(false);
  const [dataAset, setDataAset] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const rawData = await getRegistrasiAset();
    
    // Parsing Decimal & Date agar aman dibaca oleh Client Component
    const safeData = rawData.map((item) => ({
      ...item,
      hargaPerolehan: Number(item.hargaPerolehan),
      tanggalPerolehan: item.tanggalPerolehan.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
    
    setDataAset(safeData);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSuccess = () => {
    setShowForm(false);
    loadData(); // Refresh tabel setelah submit sukses
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Registrasi Aset Baru</h1>
          <p className="text-sm text-slate-500">Pencatatan aset dan barang non-inventaris baru.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm shadow-indigo-200"
          >
            <FilePlus className="w-4 h-4" /> Tambah Registrasi
          </button>
        )}
      </div>

      {/* Form Input */}
      {showForm && (
        <FormRegistrasi onCancel={() => setShowForm(false)} onSuccess={handleSuccess} />
      )}

      {/* Area Tabel */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-base text-slate-800">Daftar Registrasi</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-500">Memuat data...</div>
          ) : (
            <DataTableRegistrasi data={dataAset} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}