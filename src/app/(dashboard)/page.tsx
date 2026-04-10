"use client"

import { motion } from "framer-motion";
import { Package, ArrowRightLeft, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const cards = [
    { title: "Total Jenis Barang", value: "3", icon: Package, color: "text-blue-600", bg: "bg-blue-100/60" },
    { title: "Transaksi Hari Ini", value: "0", icon: ArrowRightLeft, color: "text-emerald-600", bg: "bg-emerald-100/60" },
    { title: "Stok Menipis", value: "0", icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-100/60" },
  ];

  return (
    <div className="space-y-10">
      {/* Header Section dengan animasi smooth */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="space-y-3"
      >
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Selamat Datang 👋</h2>
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
            <div className={`p-4.5 rounded-2xl ${card.bg}`}>
              <card.icon className={`w-9 h-9 ${card.color}`} />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-500 font-bold tracking-wide uppercase">{card.title}</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{card.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.5, duration: 0.5 }}
         className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 mt-8"
      >
          <h3 className="text-xl font-bold text-slate-800 mb-5 tracking-tight">Aktivitas Terbaru</h3>
          <div className="flex items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <p className="text-slate-500 font-medium">Belum ada aktivitas transaksi hari ini.</p>
          </div>
      </motion.div>
    </div>
  );
}