"use client"

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, ArrowRightLeft, AlertCircle, Loader2, Box, Truck, CheckCircle2 } from "lucide-react";
import { getDashboardStats } from "@/actions/dashboard";
import { updateStatusRequisition } from "@/actions/transaksi"; // Import fungsi baru
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalBarang: number;
  trxHariIni: number;
  stokMenipis: number;
  grafikStok: { nama_barang: string; stok: number }[];
  packingCount: number; // Tambahan
  packingList: any[];   // Tambahan
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBarang: 0, trxHariIni: 0, stokMenipis: 0, grafikStok: [], packingCount: 0, packingList: []
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    getDashboardStats().then((res) => {
      if (res.success && res.data) setStats(res.data as DashboardStats);
      setLoading(false);
    });
  };

  useEffect(() => { fetchStats(); }, []);

  // FUNGSI UNTUK MENGUBAH STATUS JADI "DIKIRIM"
  const handleMarkAsSent = async (id: string, noDokumen: string) => {
    const toastId = toast.loading(`Mengupdate status ${noDokumen}...`);
    const res = await updateStatusRequisition(id, "DIKIRIM");
    if (res.success) {
      toast.success(`${noDokumen} berhasil ditandai selesai!`, { id: toastId });
      fetchStats(); // Refresh data dashboard
    } else {
      toast.error(res.error || "Gagal update status", { id: toastId });
    }
  };

  const cards = [
    { title: "Total Jenis Barang", value: stats.totalBarang, icon: Package, color: "text-blue-600", bg: "bg-blue-100/60" },
    { title: "Proses Packing", value: stats.packingCount, icon: Box, color: "text-amber-600", bg: "bg-amber-100/60" }, // Menggantikan Transaksi Hari Ini
    { title: "Stok Menipis", value: stats.stokMenipis, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-100/60" },
  ];

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-8 pb-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-3">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Selamat Datang 👋</h1>
        <p className="text-lg text-slate-600 max-w-2xl">Berikut ringkasan cepat inventaris gudang Bank Syariah hari ini.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1, duration: 0.5 }} className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-6 hover:shadow-md transition-all">
            <div className={`p-4 rounded-2xl ${card.bg}`}><card.icon className={`w-9 h-9 ${card.color}`} /></div>
            <div className="space-y-1">
              <p className="text-sm text-slate-500 font-bold tracking-wide uppercase">{card.title}</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{card.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* BAGIAN KIRI: GRAFIK (Lebar 2 kolom) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 lg:col-span-2">
          <div className="mb-8"><h2 className="text-xl font-bold text-slate-800 tracking-tight">Top 5 Barang Stok Menipis</h2></div>
          {stats.grafikStok.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.grafikStok} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="nama_barang" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="stok" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (<div className="flex items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50"><p className="text-slate-500 font-medium">Data aman, tidak ada stok menipis.</p></div>)}
        </motion.div>

        {/* BAGIAN KANAN: DAFTAR TUGAS PACKING (Lebar 1 kolom) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Box className="w-5 h-5 text-amber-500" />
              Antrean Packing
            </h2>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">{stats.packingCount} Dokumen</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[350px] custom-scrollbar">
            {stats.packingList.length > 0 ? (
              stats.packingList.map((req) => (
                <div key={req.id} className="p-4 border border-slate-200 bg-slate-50/50 rounded-2xl hover:border-indigo-200 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-extrabold text-slate-800 text-sm">{req.no_dokumen}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Cabang: {req.cabang}</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 font-medium mb-1">Item yang disiapkan:</p>
                    <ul className="text-xs text-slate-700 font-semibold list-disc pl-4 space-y-0.5">
                      {req.items.slice(0, 2).map((item: any, i: number) => (
                        <li key={i}>{item.qty_diambil}x {item.barang.nama_barang}</li>
                      ))}
                      {req.items.length > 2 && ( <li className="text-slate-400">...dan {req.items.length - 2} lainnya</li> )}
                    </ul>
                  </div>
                  <button 
                    onClick={() => handleMarkAsSent(req.id, req.no_dokumen)}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-100 hover:border-indigo-600 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                  >
                    <Truck className="w-4 h-4" /> Tandai Sudah Dikirim
                  </button>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-400 opacity-50" />
                <p className="font-medium text-sm text-center">Kerjaan beres!<br/>Tidak ada barang yang perlu di-packing.</p>
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}