"use client"

import { useState, useEffect, useRef } from "react";
import { getSemuaBarang } from "@/actions/barang";
import { createInbound } from "@/actions/transaksi";
import { getSession } from "@/actions/auth";
import { PackagePlus, Plus, Trash2, AlertTriangle, Search, PackageOpen } from "lucide-react";
import { toast } from "sonner";

// --- INTERFACES ---
interface BarangTipe {
  id: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  stok: number;
}

interface CartItem {
  barangId: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  qty: number;
}

interface FormDataInbound {
  no_dokumen: string;
  tanggal_masuk: string;
  supplier: string;
  penerima: string;
  items: CartItem[];
}

export default function BarangMasuk() {
  const [barangList, setBarangList] = useState<BarangTipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [penerima, setPenerima] = useState("Loading...");
  
  const [items, setItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedBarang, setSelectedBarang] = useState<BarangTipe | null>(null);
  const [inputQty, setInputQty] = useState<number>(1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [formDataCache, setFormDataCache] = useState<FormDataInbound | null>(null);

  useEffect(() => {
    getSemuaBarang().then((res) => { if (res.success && res.data) setBarangList(res.data as BarangTipe[]) });
    getSession().then((session) => { if (session && session.nama) setPenerima(session.nama) });

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredBarang = barangList.filter(b => 
    b.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.kode_barang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePilihBarang = (barang: BarangTipe) => {
    setSelectedBarang(barang);
    setSearchQuery(`${barang.kode_barang} - ${barang.nama_barang}`);
    setShowDropdown(false);
  };

  const handleAddItem = () => {
    if (!selectedBarang) return toast.error("Pilih barang dari rekomendasi dulu!");
    if (inputQty <= 0) return toast.error("Jumlah minimal 1!");
    if (items.find(i => i.barangId === selectedBarang.id)) return toast.error("Barang sudah ada di daftar!");

    setItems([...items, { 
      barangId: selectedBarang.id, 
      kode_barang: selectedBarang.kode_barang,
      nama_barang: selectedBarang.nama_barang,
      satuan: selectedBarang.satuan,
      qty: inputQty 
    }]);

    setSelectedBarang(null); setSearchQuery(""); setInputQty(1);
  };

  const handleRemoveItem = (id: string) => setItems(items.filter(i => i.barangId !== id));

  const handlePreSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (items.length === 0) return toast.error("Daftar barang masuk masih kosong!");

    const formData = new FormData(e.currentTarget);
    setFormDataCache({
      no_dokumen: formData.get("no_dokumen") as string,
      tanggal_masuk: formData.get("tanggal_masuk") as string,
      supplier: formData.get("supplier") as string,
      penerima: penerima,
      items: items
    });
    setShowConfirm(true);
  };

  const executeSubmit = async () => {
    if (!formDataCache) return;
    setShowConfirm(false); setLoading(true);
    const loadingToastId = toast.loading("Sedang memproses penambahan stok...");

    try {
      const res = await createInbound(formDataCache);
      if (res.success) {
        toast.success(res.message, { id: loadingToastId });
        setItems([]); (document.getElementById("form-inbound") as HTMLFormElement).reset();
      } else {
        toast.error("Gagal: " + res.error, { id: loadingToastId });
      }
    } catch (error) { toast.error("Kesalahan server.", { id: loadingToastId }) }
    finally { setLoading(false) }
  };

  // ... (Sisa return/UI sama persis)
  return (
    <div className="space-y-6 max-w-5xl mx-auto relative pb-10">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <PackagePlus className="w-8 h-8 text-emerald-500" />
          Form Barang Masuk
        </h2>
        <p className="text-slate-500">Input Purchase Order / Surat Jalan untuk restock gudang.</p>
      </div>

      <form id="form-inbound" onSubmit={handlePreSubmit} className="space-y-6">
        {/* HEADER FORM */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Informasi Pengiriman</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">No Dokumen / PO / Surat Jalan</label>
              <input required name="no_dokumen" placeholder="Contoh: PO-2026-001" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Tanggal Masuk</label>
              <input required type="date" name="tanggal_masuk" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Nama Supplier / Vendor</label>
              <input required name="supplier" placeholder="Contoh: PT. Sumber Makmur" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                Staf Penerima Gudang <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-md font-normal">Auto</span>
              </label>
              <input readOnly disabled value={penerima} className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-500 font-medium cursor-not-allowed" />
            </div>
          </div>
        </div>

        {/* ITEMS SELECTION */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6 space-y-5">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Daftar Barang Masuk</h3>
          
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
            <div className="flex-1 w-full space-y-1 relative" ref={dropdownRef}>
              <label className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Cari Item Gudang</label>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text" placeholder="Ketik nama atau kode barang..." 
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/50 outline-none"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); setSelectedBarang(null); }}
                  onFocus={() => setShowDropdown(true)}
                />
                {showDropdown && searchQuery && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {filteredBarang.length > 0 ? (
                      filteredBarang.map(b => (
                        <div key={b.id} onClick={() => handlePilihBarang(b)} className="px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-slate-50 flex items-center justify-between">
                          <div><p className="font-semibold text-slate-800 text-sm">{b.nama_barang}</p><p className="text-xs text-slate-500 font-mono mt-0.5">{b.kode_barang}</p></div>
                        </div>
                      ))
                    ) : ( <div className="p-4 text-center text-sm text-slate-500">Barang tidak ditemukan.</div> )}
                  </div>
                )}
              </div>
            </div>

            <div className="w-full sm:w-28 space-y-1">
              <label className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Qty</label>
              <input type="number" min="1" value={inputQty} onChange={(e) => setInputQty(parseInt(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/50 outline-none text-center font-bold" />
            </div>

            <button type="button" onClick={handleAddItem} className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors flex items-center justify-center gap-2 h-[46px]">
              <Plus className="w-5 h-5" /> Add
            </button>
          </div>

          {/* TABLE ITEMS */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr><th className="px-4 py-3 font-semibold">Kode</th><th className="px-4 py-3 font-semibold">Nama Item</th><th className="px-4 py-3 font-semibold text-center">Qty Masuk</th><th className="px-4 py-3 font-semibold text-center">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length > 0 ? (
                  items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.kode_barang}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{item.nama_barang}</td>
                      <td className="px-4 py-3 text-center"><span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">{item.qty} {item.satuan}</span></td>
                      <td className="px-4 py-3 text-center"><button type="button" onClick={() => handleRemoveItem(item.barangId)} className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition-colors inline-flex"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="px-4 py-12 text-center"><div className="flex flex-col items-center justify-center text-slate-400"><PackageOpen className="w-10 h-10 mb-2 opacity-50" /><p>Belum ada barang yang ditambahkan.</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <button disabled={loading} type="submit" className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg transition-colors disabled:opacity-50 shadow-lg shadow-slate-900/20">
          {loading ? "Memproses Data..." : "Simpan Dokumen & Tambah Stok"}
        </button>
      </form>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-7 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-emerald-500 mb-4"><AlertTriangle className="w-7 h-7" /><h3 className="text-xl font-extrabold text-slate-900">Konfirmasi Restock</h3></div>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">Apakah lo yakin data PO/Surat Jalan dan item yang diterima sudah sesuai? Stok gudang akan otomatis bertambah.</p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowConfirm(false)} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-colors">Batal</button>
              <button type="button" onClick={executeSubmit} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors shadow-md shadow-emerald-600/20">Ya, Tambah Stok</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}