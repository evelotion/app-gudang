// src/app/(dashboard)/master-barang/page.tsx
"use client"

import { useState, useEffect } from "react";
import { getSemuaBarang } from "@/actions/barang";
import { DataTable } from "./data-table";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import DialogTambahBarang from "./DialogTambahBarang";

export default function MasterBarang() {
  const [barang, setBarang] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const res = await getSemuaBarang();
    if (res.success) setBarang(res.data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  return (
    <main className="flex-1 p-6 lg:p-10 w-full max-w-[1600px] mx-auto space-y-8 pb-12">
      <PageHeader 
        title="Master Barang" 
        description="Kelola daftar buku tabungan dan item inventaris lainnya."
        actions={
          <>
            <Button variant="outline" className="rounded-xl border-slate-200/80 hover:bg-slate-50 text-slate-600 font-semibold shadow-sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            {/* INI TOMBOL YANG SUDAH BERFUNGSI */}
            <DialogTambahBarang onRefresh={loadData} />
          </>
        }
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      ) : (
        <Card>
          <CardContent className="p-6 md:p-8">
            <DataTable data={barang} />
          </CardContent>
        </Card>
      )}
    </main>
  );
}