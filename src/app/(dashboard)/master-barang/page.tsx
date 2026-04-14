import { getSemuaBarang } from "@/actions/barang";
import { DataTable } from "./data-table";
import { PageHeader } from "@/components/PageHeader"; // Import PageHeader
import { Card, CardContent } from "@/components/ui/card"; // Import Card premium
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";

export default async function MasterBarang() {
  const { data: barang, success } = await getSemuaBarang();

  return (
    <main className="flex-1 p-6 lg:p-10 w-full max-w-[1600px] mx-auto space-y-8 pb-12">
      
      {/* 1. HEADER KONSISTEN */}
      <PageHeader 
        title="Master Barang" 
        description="Kelola daftar buku tabungan dan item inventaris lainnya."
        actions={
          <>
            <Button variant="outline" className="rounded-xl border-slate-200/80 hover:bg-slate-50 text-slate-600 font-semibold shadow-sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/20">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Barang
            </Button>
          </>
        }
      />

      {/* 2. VALIDASI & TABEL DALAM CARD PREMIUM */}
      {!success ? (
        <div className="p-6 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 font-semibold">
          Gagal memuat data barang dari server. Silakan muat ulang halaman.
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 md:p-8">
            <DataTable data={barang || []} />
          </CardContent>
        </Card>
      )}
      
    </main>
  );
}