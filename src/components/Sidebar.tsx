"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ArrowRightLeft, FileText, LogOut, X } from "lucide-react"; 
import { motion } from "framer-motion";
import { logoutApp } from "@/actions/auth";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "Master Barang", icon: Package, path: "/master-barang" },
  { name: "Barang Keluar", icon: ArrowRightLeft, path: "/barang-keluar" },
  { name: "Laporan", icon: FileText, path: "/laporan" },
];

export default function Sidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="w-64 min-h-screen bg-white/40 backdrop-blur-2xl border-r border-slate-200 p-6 flex flex-col shadow-[10px_0_40px_rgba(0,0,0,0.03)] z-50">
      <div className="mb-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_4px_12px_rgba(79,70,229,0.1)]">
            <Package className="w-6 h-6 text-indigo-600" />
          </div>
          <h1 className="font-extrabold text-2xl tracking-tighter text-slate-950">Gudang<span className="text-indigo-600">Sync</span></h1>
        </div>
        
        <button onClick={onCloseMobile} className="md:hidden p-2 text-slate-500 hover:text-slate-800 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex flex-col gap-2.5">
        {menuItems.map((item) => {
          const isActive = pathname === item.path || (pathname !== "/" && item.path !== "/" && pathname.startsWith(item.path));
          
          // Komentarnya gue pindahin ke sini biar aman (pakai // standar JS)
          // Tambahin onClick={onCloseMobile} biar sidebar nutup otomatis di HP
          return (
            <Link key={item.path} href={item.path} onClick={onCloseMobile} className="relative group">
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-white border border-slate-200 shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-xl z-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className={`relative flex items-center gap-3.5 px-4.5 py-3.5 rounded-xl transition-all duration-300 z-10 ${isActive ? 'text-indigo-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'}`}>
                <item.icon className={`w-5.5 h-5.5 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                <span className="font-medium tracking-tight">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto pt-6 border-t border-slate-100">
          <button onClick={() => logoutApp()} className="w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors text-sm font-medium">
              <LogOut className="w-5 h-5"/>
              Keluar Sistem
          </button>
      </div>
    </div>
  );
}