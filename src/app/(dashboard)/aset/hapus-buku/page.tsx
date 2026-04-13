"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FormHapusBuku from "./form-hapus-buku";
import { FileMinus } from "lucide-react";

export default function HapusBukuAsetPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hapus Buku Aset</h1>
          <p className="text-sm text-slate-500">
            Pencatatan penghapusan buku aset dan barang non-inventaris.
          </p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm shadow-red-200"
          >
            <FileMinus className="w-4 h-4" />
            Catat Hapus Buku
          </button>
        )}
      </div>

      {/* Area Form Input */}
      {showForm && (
        <FormHapusBuku 
          onCancel={() => setShowForm(false)} 
          onSuccess={() => setShowForm(false)} 
        />
      )}

      {/* Area Tabel */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-base text-slate-800">Daftar Hapus Buku</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-64 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <p className="text-sm font-medium">Tabel Data Belum Tersedia</p>
            <p className="text-xs mt-1">Kita akan buat Data Table Tanstack di Tahap 4</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}