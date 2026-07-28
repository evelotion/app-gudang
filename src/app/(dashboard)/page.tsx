"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FilePlus, FileMinus, ArrowRightLeft, Loader2, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { getDashboardStats } from "@/actions/dashboard";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTanggalDisplay } from "@/lib/date";

interface RecentActivityItem {
  id: string;
  namaAset: string;
  nomorRegisterAset: string;
  status: string;
  createdAt: Date | string;
  jenis: "Registrasi Baru" | "Hapus Buku" | "Mutasi Aset";
  path: string;
}

interface DashboardStats {
  totalRegistrasi: number;
  totalHapusBuku: number;
  totalMutasi: number;
  totalPending: number;
  recentActivity: RecentActivityItem[];
}

const statusStyle: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

const jenisIcon: Record<RecentActivityItem["jenis"], typeof FilePlus> = {
  "Registrasi Baru": FilePlus,
  "Hapus Buku": FileMinus,
  "Mutasi Aset": ArrowRightLeft,
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRegistrasi: 0, totalHapusBuku: 0, totalMutasi: 0, totalPending: 0, recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then((res) => {
      if (res.success && res.data) setStats(res.data as DashboardStats);
      setLoading(false);
    });
  }, []);

  const cards = [
    { title: "Registrasi Aset", value: stats.totalRegistrasi, icon: FilePlus, color: "text-indigo-600", bg: "bg-indigo-100/60" },
    { title: "Hapus Buku", value: stats.totalHapusBuku, icon: FileMinus, color: "text-rose-600", bg: "bg-rose-100/60" },
    { title: "Mutasi Aset", value: stats.totalMutasi, icon: ArrowRightLeft, color: "text-emerald-600", bg: "bg-emerald-100/60" },
    { title: "Menunggu Approval", value: stats.totalPending, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-100/60" },
  ];

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

  return (
    <main className="flex-1 p-6 lg:p-10 w-full max-w-[1600px] mx-auto space-y-8 pb-10">

      {/* 1. HEADER KONSISTEN */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <PageHeader
          title="Selamat Datang 👋"
          description="Berikut ringkasan cepat data manajemen aset hari ini."
        />
      </motion.div>

      {/* 2. STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1, duration: 0.5 }}>
            <Card className="flex flex-row items-center gap-6 p-7 py-7">
              <div className={`p-4 rounded-2xl ${card.bg}`}><card.icon className={`w-9 h-9 ${card.color}`} /></div>
              <div className="space-y-1">
                <p className="text-sm text-slate-500 font-bold tracking-wide uppercase">{card.title}</p>
                <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{card.value}</h3>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 3. AKTIVITAS TERBARU */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {stats.recentActivity.map((item) => {
                  const Icon = jenisIcon[item.jenis];
                  return (
                    <Link
                      key={`${item.jenis}-${item.id}`}
                      href={item.path}
                      className="flex items-center gap-4 py-3.5 hover:bg-slate-50 -mx-2 px-2 rounded-xl transition-colors"
                    >
                      <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{item.namaAset}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.jenis} &middot; {item.nomorRegisterAset} &middot; {formatTanggalDisplay(item.createdAt)}
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${statusStyle[item.status] || "bg-slate-100 text-slate-600"}`}>
                        {item.status}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-400 opacity-50" />
                <p className="font-medium text-sm text-center">Belum ada aktivitas aset.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

    </main>
  );
}
