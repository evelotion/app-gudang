"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ArrowRightLeft, FileText, LogOut, X, PackagePlus } from "lucide-react"; 
import { motion } from "framer-motion";
import { logoutApp, getSession } from "@/actions/auth";

export default function Sidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();
  const [user, setUser] = useState({ role: "STAF", nama: "Memuat...", inisial: "..." });

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        setUser({
          role: session.role || "STAF",
          nama: session.nama || "User Gudang",
          inisial: session.inisial || "U"
        });
      }
    });
  }, []);

  // Menu Grup 1: Gudang
  const gudangMenu = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Master Barang", icon: Package, path: "/master-barang" },
    { name: "Barang Masuk", icon: PackagePlus, path: "/barang-masuk" },
    { name: "Barang Keluar", icon: ArrowRightLeft, path: "/barang-keluar" },
    { name: "Laporan", icon: FileText, path: "/laporan" },
  ];

  // Menu Grup 2: Aset
  const asetMenu = [
    { name: "Registrasi Baru", icon: FilePlus, path: "/aset/registrasi-baru" },
    { name: "Hapus Buku", icon: FileMinus, path: "/aset/hapus-buku" },
  ];

  return (
    <aside className="w-[270px] h-screen bg-white/70 backdrop-blur-3xl border-r border-slate-200/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col transition-all duration-300 z-50 shrink-0">
      
      {/* 1. Header Section - Diperkecil proporsinya */}
      <div className="px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Box className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-lg tracking-tight text-slate-800 leading-none">
              Gudang<span className="text-indigo-600">Sync</span>
            </h1>
            <p className="text-[8px] font-black tracking-[0.15em] text-slate-400 uppercase mt-1">Bank Syariah</p>
          </div>
        </div>
        {onCloseMobile && (
          <button onClick={onCloseMobile} className="md:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-2 mb-3">
          <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">Main Menu</p>
        </div>
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.path || (pathname !== "/" && item.path !== "/" && pathname.startsWith(item.path));
            
            return (
              <Link key={item.path} href={item.path} onClick={onCloseMobile} className="relative group outline-none">
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute inset-0 bg-indigo-50/80 border border-indigo-100/50 rounded-xl z-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <div className={`relative flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 z-10 ${
                  isActive 
                    ? 'text-indigo-700 font-semibold' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'
                }`}>
                  <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span className="tracking-tight text-sm">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* User Profile & Logout */}
      <div className="mt-auto pt-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-3 rounded-2xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all group">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 shadow-inner shrink-0">
            {user.inisial}
          </div>
          <div className="flex-1 min-w-0">
            {/* Yang ini tetep gue truncate karena nama orang panjang-panjang */}
            <p className="text-sm font-bold text-slate-900 truncate">{user.nama}</p>
            <p className="text-xs font-medium text-slate-500 truncate">{user.role}</p>
          </div>
          <button 
            onClick={() => logoutApp()}
            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors shrink-0"
            title="Keluar Aplikasi"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </aside>
  );
}