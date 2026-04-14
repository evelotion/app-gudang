"use client"

import { useState } from "react"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { tambahBarang } from "@/actions/barang"
import { Button } from "@/components/ui/button"
// Jika belum install shadcn dialog, bisa pakai state manual dulu seperti ini:

export default function DialogTambahBarang({ onRefresh }: { onRefresh: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())
    
    const res = await tambahBarang(data)
    
    if (res.success) {
      toast.success("Barang baru berhasil ditambahkan!")
      setIsOpen(false)
      onRefresh() // Refresh tabel
    } else {
      toast.error(res.error)
    }
    setLoading(false)
  }

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/20"
      >
        <Plus className="w-4 h-4 mr-2" />
        Tambah Barang
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Tambah Barang Baru</h3>
              <p className="text-sm text-slate-500">Daftarkan item baru ke dalam sistem Master Barang.</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Nama Barang</label>
                <input required name="nama_barang" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Kode Barang (SKU)</label>
                <input required name="kode_barang" placeholder="BKT-..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Satuan</label>
                <input required name="satuan" placeholder="Pcs / Pack / Buku" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Stok Awal</label>
                <input required type="number" name="stok" defaultValue="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Min. Stok</label>
                <input required type="number" name="stok_min" defaultValue="10" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>

              <div className="col-span-2 flex gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Barang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}