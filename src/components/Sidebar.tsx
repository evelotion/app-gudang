"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutApp } from "@/actions/auth";

// Bikin interface biar TypeScript nggak teriak "any"
interface UserProps {
  id: string;
  inisial: string;
  nama: string;
  role: string;
}

export default function Sidebar({ user }: { user: UserProps }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 backdrop-blur-xl bg-white/70 border-r border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] h-full flex flex-col transition-all duration-300">
      
      {/* Profile Section - Langsung render nama, TANPA loading! */}
      <div className="p-6 border-b border-gray-200/50">
         <div className="flex items-center gap-4">
            {/* Avatar dengan sedikit sentuhan 3D shadow */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-[0_4px_10px_rgba(79,70,229,0.4)] transform transition hover:scale-105">
               {user.inisial}
            </div>
            <div className="flex flex-col">
               <h3 className="font-semibold text-slate-800 leading-tight">{user.nama}</h3>
               <span className="text-xs text-slate-500 font-medium tracking-wide mt-1 bg-slate-100/80 px-2 py-0.5 rounded-md w-fit">
                 {user.role}
               </span>
            </div>
         </div>
      </div>
      
      {/* Area Menu Navigasi */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {/* TODO: Paste Link / menu navigasi lo yang lama di sini ya bro */}
        
        {/* Contoh bentuknya: */}
        <Link href="/" className={`p-3 rounded-lg transition-all ${pathname === '/' ? 'bg-blue-50/80 text-blue-600 font-medium shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
          Dashboard
        </Link>
        <Link href="/barang-masuk" className={`p-3 rounded-lg transition-all ${pathname === '/barang-masuk' ? 'bg-blue-50/80 text-blue-600 font-medium shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
          Barang Masuk
        </Link>
        <Link href="/barang-keluar" className={`p-3 rounded-lg transition-all ${pathname === '/barang-keluar' ? 'bg-blue-50/80 text-blue-600 font-medium shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
          Barang Keluar
        </Link>
        
        {/* Render menu ini cuma buat ADMIN */}
        {user.role === 'ADMIN' && (
          <>
            <div className="my-2 border-t border-gray-200/50" /> {/* Divider */}
            <Link href="/master-barang" className={`p-3 rounded-lg transition-all ${pathname === '/master-barang' ? 'bg-blue-50/80 text-blue-600 font-medium shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
              Master Barang
            </Link>
            <Link href="/laporan" className={`p-3 rounded-lg transition-all ${pathname === '/laporan' ? 'bg-blue-50/80 text-blue-600 font-medium shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
              Laporan
            </Link>
          </>
        )}
      </div>

      {/* Tombol Logout */}
      <div className="p-4 border-t border-gray-200/50">
        <button 
          onClick={() => logoutApp()}
          className="w-full py-2.5 px-4 bg-red-50/50 hover:bg-red-100/80 text-red-600 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}