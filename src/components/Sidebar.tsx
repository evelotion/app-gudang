"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ArrowRightLeft, FileText, LogOut, X, PackagePlus } from "lucide-react"; 
import { motion } from "framer-motion";
import { logoutApp, getSession } from "@/actions/auth";

export default function Sidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();
  
  // State digabung biar gampang narik nama & inisial buat UI Profile
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
    <div className="w-[280px] h-screen bg-white border-r border-slate-200/80 p-5 flex flex-col z-50 fixed md:relative shrink-0">
      {/* Brand Header - FONT DIKECILIN & NO TRUNCATE */}
      <div className="mb-8 px-1 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Package className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="font-black text-base tracking-tight text-slate-900 leading-none">
              Gudang<span className="text-indigo-600">Sync</span>
            </h1>
            <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase mt-1">Bank Syariah</p>
          </div>
        </div>
        
        {/* Tombol close mobile */}
        <button onClick={onCloseMobile} className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors shrink-0 ml-2">
          <X className="w-5 h-5" />
        </button>
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
            title="Keluar Sistem"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shrink-0"
          >
            <LogOut className="w-4 h-4"/>
          </button>
        </div>
      </div>
    </div>
  );
}