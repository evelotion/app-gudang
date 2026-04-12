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
    { name: "Master Barang", icon: Package, path: "/master-barang" },
    { name: "Barang Masuk", icon: PackagePlus, path: "/barang-masuk" },
    { name: "Barang Keluar", icon: ArrowRightLeft, path: "/barang-keluar" },
    { name: "Laporan", icon: FileText, path: "/laporan" },
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

      {/* 2. Navigation Section */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 no-scrollbar">
        <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-3 px-3">Main Navigation</p>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.path || (pathname !== "/" && item.path !== "/" && pathname.startsWith(item.path));
          
          return (
            <Link 
              key={item.path} 
              href={item.path} 
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 font-semibold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'}`} />
              <span className="text-xs">{item.name}</span>
              
              {isActive && (
                <div className="absolute right-2 w-1 h-1 rounded-full bg-white/40" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* 3. Footer Section (Profile) - Ukuran box, icon, dan font diperkecil */}
      <div className="p-4 mt-auto">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-indigo-600 font-bold text-xs border border-slate-100 shrink-0">
            {user.inisial}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xs text-slate-800 truncate" title={user.nama}>{user.nama}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
               <div className="w-1 h-1 rounded-full bg-emerald-500" />
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{user.role}</span>
            </div>
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