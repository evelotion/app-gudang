"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  ArrowRightLeft, 
  FileText, 
  LogOut, 
  X, 
  PackagePlus,
  Box
} from "lucide-react"; 
import { logoutApp, getSession } from "@/actions/auth";

export default function Sidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();
  
  // State untuk data user
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

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    ...(user.role === "ADMIN" ? [{ name: "Master Barang", icon: Package, path: "/master-barang" }] : []),
    { name: "Barang Masuk", icon: PackagePlus, path: "/barang-masuk" },
    { name: "Barang Keluar", icon: ArrowRightLeft, path: "/barang-keluar" },
    ...(user.role === "ADMIN" ? [{ name: "Laporan", icon: FileText, path: "/laporan" }] : []),
  ];

  return (
    <aside className="w-[280px] h-screen bg-white/60 backdrop-blur-2xl border-r border-white/80 shadow-[10px_0_30px_-15px_rgba(0,0,0,0.1)] flex flex-col transition-all duration-300 z-50 shrink-0">
      
      {/* 1. Brand Header */}
      <div className="p-6 flex items-center justify-between border-b border-white/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-700 flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.4)] border border-indigo-400/50">
            <Box className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-extrabold text-xl tracking-tight text-slate-800 leading-none">
              Gudang<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Sync</span>
            </h1>
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-1">Bank Syariah</p>
          </div>
        </div>
        
        {/* Tombol close mobile */}
        {onCloseMobile && (
          <button 
            onClick={onCloseMobile} 
            className="md:hidden p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2 no-scrollbar">
        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-2 px-2">Menu Utama</p>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.path || (pathname !== "/" && item.path !== "/" && pathname.startsWith(item.path));
          
          return (
            <Link 
              key={item.path} 
              href={item.path} 
              onClick={onCloseMobile}
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                isActive 
                  ? 'bg-white shadow-[0_4px_20px_-4px_rgba(99,102,241,0.15)] border border-white text-indigo-700 font-bold' 
                  : 'text-slate-500 hover:bg-white/50 hover:text-slate-800 font-medium'
              }`}
            >
              {/* Indikator aktif (Garis di sebelah kiri) */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 to-purple-600" />
              )}
              
              <item.icon className={`w-5 h-5 transition-colors z-10 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
              <span className="text-sm z-10">{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* 3. User Profile & Logout (Bottom) */}
      <div className="p-4 border-t border-white/50 bg-white/30">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 border border-white shadow-sm hover:shadow-md transition-all duration-300">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white font-bold shadow-[0_4px_10px_rgba(0,0,0,0.2)] shrink-0 border border-slate-700">
            {user.inisial}
          </div>
          <div className="flex-1 min-w-0">
            {/* Class truncate memastikan teks panjang terpotong pakai "..." */}
            <h3 className="font-bold text-sm text-slate-800 truncate" title={user.nama}>{user.nama}</h3>
            <span className="inline-block text-[10px] font-extrabold tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mt-0.5 border border-indigo-100">
              {user.role}
            </span>
          </div>
          
          <button 
            onClick={() => logoutApp()}
            title="Logout"
            className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white hover:shadow-[0_4px_12px_rgba(244,63,94,0.3)] transition-all duration-300 shrink-0 border border-rose-100 hover:border-transparent"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

    </aside>
  );
}