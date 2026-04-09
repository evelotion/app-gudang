"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginApp } from "@/actions/auth";
import { Package, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const res = await loginApp(formData);

    if (res.success) {
      router.push("/");
    } else {
      setErrorMsg(res.error || "Gagal login");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-sm mb-4">
            <Package className="w-6 h-6 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Gudang<span className="text-indigo-600">Sync</span></h1>
          <p className="text-slate-500 text-sm mt-1">Silakan login untuk melanjutkan</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">Inisial Nama</label>
            <input 
              required 
              name="inisial" 
              placeholder="Contoh: IND" 
              className="w-full bg-white/60 border border-white/80 shadow-sm rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase transition-all" 
            />
          </div>

          <div className="space-y-2 relative">
            <label className="text-sm font-semibold text-slate-600">Password</label>
            <div className="relative">
              <input 
                required 
                name="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                className="w-full bg-white/60 border border-white/80 shadow-sm rounded-xl pl-4 pr-12 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 text-white font-bold transition-all disabled:opacity-50 mt-4"
          >
            {loading ? "Memverifikasi..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}