// src/app/(dashboard)/laporan/FilterBulan.tsx
"use client";

import { useRouter } from "next/navigation";
import { CalendarDays, Layers } from "lucide-react";

export default function FilterBulan({ currentBulan }: { currentBulan: string }) {
  const router = useRouter();
  
  // Cek apakah mode "Semua Data" sedang aktif
  const isAll = currentBulan === "all";

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* 1. Picker Bulan */}
      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border shadow-sm transition-all ${isAll ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
        <div className={`p-2 rounded-lg ${isAll ? 'bg-slate-200' : 'bg-indigo-50'}`}>
          <CalendarDays className={`w-5 h-5 ${isAll ? 'text-slate-400' : 'text-indigo-600'}`} />
        </div>
        <div className="flex flex-col">
          <label htmlFor="month-picker" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer">
            Periode Bulan
          </label>
          <input 
            id="month-picker"
            type="month" 
            // Kosongkan picker jika mode "all" aktif
            value={isAll ? "" : currentBulan}
            onChange={(e) => {
              if (e.target.value) {
                router.push(`?bulan=${e.target.value}`);
              }
            }}
            className="text-sm font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* 2. Tombol Semua Data */}
      <button
        onClick={() => router.push('?bulan=all')}
        className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border shadow-sm h-[60px] ${
          isAll 
            ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/20" 
            : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
        }`}
      >
        <Layers className="w-4 h-4" />
        Semua Data
      </button>
    </div>
  );
}