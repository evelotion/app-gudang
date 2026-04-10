"use client"

import { useState, useEffect } from "react";
import { getSemuaBarang } from "@/actions/barang";
import { createRequisition } from "@/actions/transaksi";
import { ArrowRightLeft, Plus, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner"; // Import toast dari sonner

export default function BarangKeluar() {
  const [barangList, setBarangList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([{ barangId: "", qty: 1 }]);
  
  // State khusus untuk Modal Konfirmasi
  const [showConfirm, setShowConfirm] = useState(false);
  const [formDataCache, setFormDataCache] = useState<any>(null);

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

  // Fungsi ini dipanggil pas klik submit form (Buat nahan proses & munculin modal)
  const handlePreSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validasi: pastikan ada barang yang dipilih
    const validItems = items.filter(i => i.barangId !== "" && i.qty > 0);
    if (validItems.length === 0) {
      toast.error("Pilih minimal 1 barang untuk dikeluarkan!");
      return;
    }

    const formData = new FormData(e.currentTarget);
    setFormDataCache({
      no_form: formData.get("no_form") as string,
      pic_nama: formData.get("pic_nama") as string,
      departemen: formData.get("departemen") as string,
      items: validItems
    });
    
    // Tampilkan modal konfirmasi
    setShowConfirm(true);
  };

  // Fungsi ini dipanggil kalau user klik "Ya, Potong Stok" di dalam Modal
  const executeSubmit = async () => {
    setShowConfirm(false); // Tutup modal
    setLoading(true);
    
    // Munculin notifikasi loading
    const loadingToastId = toast.loading("Sedang memproses pemotongan stok...");

    try {
      const res = await createRequisition(formDataCache);
      if (res.success) {
        toast.success("Sukses! Stok berhasil dipotong.", { id: loadingToastId });
        // Reset form tanpa perlu reload browser
        setItems([{ barangId: "", qty: 1 }]); 
        (document.getElementById("form-req") as HTMLFormElement).reset();
      } else {
        toast.error("Gagal: " + res.error, { id: loadingToastId });
      }
    } catch (error) {
      toast.error("Terjadi kesalahan pada server.", { id: loadingToastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <ArrowRightLeft className="w-8 h-8 text-indigo-500" />
          Form Barang Keluar
        </h2>
        <p className="text-slate-500">Input Requisition Form untuk memotong stok gudang.</p>
      </div>

      <form id="form-req" onSubmit={handlePreSubmit} className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6 space-y-6">
        {/* Header Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nomor Form Requisition</label>
            <input required name="no_form" placeholder="REQ/2026/..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nama PIC Pengambil</label>
            <input required name="pic_nama" placeholder="Nama Pegawai" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Departemen</label>
            <input required name="departemen" placeholder="Contoh: Teller / CS" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors" />
          </div>
        </div>

        {/* Dynamic Items Array */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">Daftar Barang Diambil</h3>
          
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-4">
              <select 
                required
                value={item.barangId}
                onChange={(e) => handleItemChange(index, "barangId", e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
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
                className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
              />
              
              <button type="button" onClick={() => handleRemoveItem(index)} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          <button type="button" onClick={handleAddItem} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-slate-300 text-indigo-600 hover:bg-indigo-50 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> Tambah Barang Lain
          </button>
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-slate-100">
          <button disabled={loading} type="submit" className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors disabled:opacity-50">
            {loading ? "Menyiapkan Data..." : "Simpan Form & Potong Stok"}
          </button>
        </div>
      </form>

      {/* Komponen Modal Konfirmasi (Hanya muncul kalau showConfirm == true) */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900">Konfirmasi Potong Stok</h3>
            </div>
            <p className="text-slate-600 mb-6 text-sm">
              Apakah lo yakin data form <span className="font-semibold text-slate-900">{formDataCache?.no_form}</span> sudah benar? Stok barang di gudang akan langsung terpotong.
            </p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowConfirm(false)} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors">
                Batal
              </button>
              <button type="button" onClick={executeSubmit} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors">
                Ya, Potong Stok
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}