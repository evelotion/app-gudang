"use client"

import { useState, useEffect } from "react";
import { getSemuaBarang } from "@/actions/barang";
import { createRequisition } from "@/actions/transaksi";
import { ArrowRightLeft, Plus, Trash2 } from "lucide-react";

export default function BarangKeluar() {
  const [barangList, setBarangList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([{ barangId: "", qty: 1 }]);

  useEffect(() => {
    getSemuaBarang().then((res) => {
      if (res.success) setBarangList(res.data || []);
    });
  }, []);

  const handleAddItem = () => setItems([...items, { barangId: "", qty: 1 }]);
  
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const payload = {
      no_form: formData.get("no_form") as string,
      pic_nama: formData.get("pic_nama") as string,
      departemen: formData.get("departemen") as string,
      items: items.filter(i => i.barangId !== "" && i.qty > 0)
    };

    const res = await createRequisition(payload);
    setLoading(false);

    if (res.success) {
      alert("Sukses! Stok berhasil dipotong.");
      window.location.reload(); // Refresh simpel untuk reset form
    } else {
      alert("Gagal: " + res.error);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <ArrowRightLeft className="w-8 h-8 text-emerald-400" />
          Form Barang Keluar
        </h2>
        <p className="text-slate-400">Input Requisition Form untuk memotong stok gudang.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-6">
        {/* Header Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Nomor Form Requisition</label>
            <input required name="no_form" placeholder="REQ/2026/..." className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Nama PIC Pengambil</label>
            <input required name="pic_nama" placeholder="Nama Pegawai" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Departemen</label>
            <input required name="departemen" placeholder="Contoh: Teller / CS" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>
        </div>

        {/* Dynamic Items Array */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <h3 className="text-lg font-semibold text-white">Daftar Barang Diambil</h3>
          
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-4">
              <select 
                required
                value={item.barangId}
                onChange={(e) => handleItemChange(index, "barangId", e.target.value)}
                className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 [&>option]:bg-slate-800"
              >
                <option value="" disabled>Pilih Barang...</option>
                {barangList.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.kode_barang} - {b.nama_barang} (Sisa: {b.stok})
                  </option>
                ))}
              </select>
              
              <input 
                type="number" required min="1"
                value={item.qty}
                onChange={(e) => handleItemChange(index, "qty", parseInt(e.target.value))}
                className="w-24 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" 
              />
              
              <button type="button" onClick={() => handleRemoveItem(index)} className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500/20 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          <button type="button" onClick={handleAddItem} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-white/20 text-indigo-400 hover:bg-white/5 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> Tambah Barang Lain
          </button>
        </div>

        {/* Submit Button */}
        <div className="pt-6">
          <button disabled={loading} type="submit" className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold transition-colors disabled:opacity-50">
            {loading ? "Memproses Data..." : "Simpan Form & Potong Stok"}
          </button>
        </div>
      </form>
    </div>
  );
}