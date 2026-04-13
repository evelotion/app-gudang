"use client";

import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";

export default function FilterBulan({ currentBulan }: { currentBulan: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-indigo-300">
      <div className="p-2 bg-indigo-50 rounded-lg">
        <CalendarDays className="w-5 h-5 text-indigo-600" />
      </div>
      <div className="flex flex-col">
        <label htmlFor="month-picker" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer">
          Periode Laporan
        </label>
        <input 
          id="month-picker"
          type="month" 
          value={currentBulan}
          onChange={(e) => {
            if (e.target.value) {
              // Otomatis ubah URL saat bulan diganti
              router.push(`?bulan=${e.target.value}`);
            }
          }}
          className="text-sm font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
        />
      </div>
    </div>
  );
}