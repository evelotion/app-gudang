"use client"

import { motion } from "framer-motion";
import { Package, ArrowRightLeft, AlertCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";

export default function Dashboard() {
  const cards = [
    { title: "Total Jenis Barang", value: "3", icon: Package, color: "text-blue-600", bg: "bg-blue-100/60" },
    { title: "Transaksi Hari Ini", value: "0", icon: ArrowRightLeft, color: "text-emerald-600", bg: "bg-emerald-100/60" },
    { title: "Stok Menipis", value: "0", icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-100/60" },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-10 h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-10">
          
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
                className="p-7 rounded-3xl bg-white/50 border border-white/70 shadow-[0_10px_40px_rgb(0,0,0,0.03)] backdrop-blur-xl flex items-center gap-6 hover:bg-white/80 hover:shadow-[0_15px_50px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 cursor-default"
              >
                <div className={`p-4.5 rounded-2xl border border-white shadow-inner ${card.bg}`}>
                  <card.icon className={`w-9 h-9 ${card.color}`} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500 font-bold tracking-wide uppercase">{card.title}</p>
                  <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{card.value}</h3>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Optional: Section Aktivitas Terbaru biar halaman ga kosong */}
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.5, duration: 0.5 }}
             className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-3xl p-8 mt-8"
          >
              <h3 className="text-xl font-bold text-slate-800 mb-5 tracking-tight">Aktivitas Terbaru</h3>
              <div className="flex items-center justify-center py-10 border-2 border-dashed border-slate-200/60 rounded-2xl bg-white/30">
                <p className="text-slate-500 font-medium">Belum ada aktivitas transaksi hari ini.</p>
              </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}