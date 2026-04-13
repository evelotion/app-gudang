"use client"

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, ArrowRightLeft, AlertCircle, Loader2 } from "lucide-react";
import { getDashboardStats } from "@/actions/dashboard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Bikin interface eksplisit biar kode lebih rapi dan reusable
interface DashboardStats {
  totalBarang: number;
  trxHariIni: number;
  stokMenipis: number;
  grafikStok: { nama_barang: string; stok: number }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBarang: 0,
    trxHariIni: 0,
    stokMenipis: 0,
    grafikStok: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then((res) => {
      if (res.success && res.data) {
        // Tambahin casting biar TypeScript 100% yakin sama bentuk datanya
        setStats(res.data as DashboardStats);
      }
      setLoading(false);
    });
  }, []);

  const cards = [
    { title: "Total Jenis Barang", value: stats.totalBarang, icon: Package, color: "text-blue-600", bg: "bg-blue-100/60" },
    { title: "Transaksi Hari Ini", value: stats.trxHariIni, icon: ArrowRightLeft, color: "text-emerald-600", bg: "bg-emerald-100/60" },
    { title: "Stok Menipis", value: stats.stokMenipis, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-100/60" },
  ];

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="space-y-3"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Selamat Datang 👋</h1>
        <p className="text-lg text-slate-600 max-w-2xl">Berikut ringkasan cepat inventaris gudang Bank Syariah hari ini.</p>
      </motion.div>

      {/* Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {cards.map((card, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.12, duration: 0.5, ease: "easeOut" }}
            className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
          >
            <div className={`p-4 rounded-2xl ${card.bg}`}>
              <card.icon className={`w-9 h-9 ${card.color}`} />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-500 font-bold tracking-wide uppercase">{card.title}</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{card.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart Section */}
      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.5, duration: 0.5 }}
         className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8"
      >
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Top 5 Barang Stok Paling Menipis</h2>
            <p className="text-slate-500">Segera lakukan restock untuk barang-barang di bawah ini.</p>
          </div>
          
          {stats.grafikStok.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.grafikStok} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="nama_barang" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="stok" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={40} name="Sisa Stok" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
              <p className="text-slate-500 font-medium">Data barang belum tersedia.</p>
            </div>
          )}
      </motion.div>
    </div>
  );
}