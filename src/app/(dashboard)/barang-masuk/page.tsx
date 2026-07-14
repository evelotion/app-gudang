"use client"

import { useState, useEffect, useRef } from "react";
import { getSemuaBarang } from "@/actions/barang";
import { createInbound } from "@/actions/transaksi";
import { getSession } from "@/actions/auth";
import { Plus, Trash2, AlertTriangle, Search, PackageOpen } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ... (Interface BarangTipe, CartItem, FormDataInbound TETAP SAMA) ...
interface BarangTipe {
  id: string; kode_barang: string; nama_barang: string; satuan: string; stok: number; harga_satuan: number;
}
interface CartItem {
  barangId: string; kode_barang: string; nama_barang: string; satuan: string; qty: number; nomorator: string; harga_satuan: number;
}
interface FormDataInbound {
  no_dokumen: string; tanggal_masuk: string; supplier: string; penerima: string; items: CartItem[];
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
  const [inputNomorator, setInputNomorator] = useState<string>("");
  const [inputHarga, setInputHarga] = useState<number>(0);
  
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

  const filteredBarang = barangList.filter(b => b.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) || b.kode_barang.toLowerCase().includes(searchQuery.toLowerCase()));

  const handlePilihBarang = (barang: BarangTipe) => {
    setSelectedBarang(barang); setSearchQuery(`${barang.kode_barang} - ${barang.nama_barang}`); setInputHarga(barang.harga_satuan || 0); setShowDropdown(false);
  };

  const handleAddItem = () => {
    if (!selectedBarang) return toast.error("Pilih barang dari rekomendasi dulu!");
    if (inputQty <= 0) return toast.error("Jumlah minimal 1!");
    if (items.find(i => i.barangId === selectedBarang.id)) return toast.error("Barang sudah ada di daftar!");

    setItems([...items, { barangId: selectedBarang.id, kode_barang: selectedBarang.kode_barang, nama_barang: selectedBarang.nama_barang, satuan: selectedBarang.satuan, qty: inputQty, nomorator: inputNomorator, harga_satuan: inputHarga }]);
    setSelectedBarang(null); setSearchQuery(""); setInputQty(1); setInputNomorator(""); setInputHarga(0);
  };

  const handleRemoveItem = (id: string) => setItems(items.filter(i => i.barangId !== id));

  const handlePreSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (items.length === 0) return toast.error("Daftar barang masuk masih kosong!");

    const formData = new FormData(e.currentTarget);
    setFormDataCache({ no_dokumen: formData.get("no_dokumen") as string, tanggal_masuk: formData.get("tanggal_masuk") as string, supplier: formData.get("supplier") as string, penerima: penerima, items: items });
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

  return (
    <main className="flex-1 p-6 lg:p-10 w-full max-w-[1600px] mx-auto space-y-8 pb-10">
      
      <PageHeader 
        title="Form Barang Masuk" 
        description="Input Surat Jalan dari Supplier untuk nambah stok & update Master Data."
      />

      <form id="form-inbound" onSubmit={handlePreSubmit} className="space-y-6">
        
        <Card>
          <CardHeader className="border-b border-slate-100/50 pb-4">
            <CardTitle>Informasi Dokumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">No Dokumen / Surat Jalan</label>
                <input required name="no_dokumen" placeholder="Contoh: SJ-2026-001" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Tanggal Masuk</label>
                <input required type="date" name="tanggal_masuk" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-colors" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Nama Supplier / Vendor</label>
                <input required name="supplier" placeholder="Contoh: PT. WAHANA AJITAMA" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                  Staf Penerima <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-md font-normal">Auto</span>
                </label>
                <input readOnly disabled value={penerima} className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-500 font-medium cursor-not-allowed" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-slate-100/50 pb-4">
            <CardTitle>Daftar Item & Update Master</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="flex flex-wrap gap-3 items-end bg-emerald-50/40 p-5 rounded-xl border border-emerald-100/50">
              <div className="flex-1 min-w-[250px] space-y-1.5 relative" ref={dropdownRef}>
                <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Cari Item Gudang</label>
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                  <input type="text" placeholder="Ketik nama buku tabungan..." className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/50 outline-none shadow-sm" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); setSelectedBarang(null); }} onFocus={() => setShowDropdown(true)} />
                  {showDropdown && searchQuery && (
                    <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-h-60 overflow-y-auto">
                      {filteredBarang.length > 0 ? (
                        filteredBarang.map(b => (
                          <div key={b.id} onClick={() => handlePilihBarang(b)} className="px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-slate-50 flex items-center justify-between">
                            <div><p className="font-semibold text-slate-800 text-sm">{b.nama_barang}</p><p className="text-xs text-slate-500 font-mono mt-0.5">{b.kode_barang}</p></div>
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded-md font-medium text-slate-600">Rp {b.harga_satuan}</span>
                          </div>
                        ))
                      ) : ( <div className="p-4 text-center text-sm text-slate-500">Barang tidak ditemukan.</div> )}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-[100px] space-y-1.5"><label className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Qty</label><input type="number" min="1" value={inputQty} onChange={(e) => setInputQty(parseInt(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/50 outline-none text-center font-bold shadow-sm" /></div>
              <div className="w-[200px] space-y-1.5"><label className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Nomorator Baru</label><input type="text" placeholder="000... - 000..." value={inputNomorator} onChange={(e) => setInputNomorator(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/50 outline-none text-sm font-mono shadow-sm" /></div>
              <div className="w-[150px] space-y-1.5"><label className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Harga @</label><input type="number" min="0" value={inputHarga} onChange={(e) => setInputHarga(parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/50 outline-none text-sm font-bold shadow-sm" /></div>

              <button type="button" onClick={handleAddItem} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_16px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 h-[46px]">
                <Plus className="w-5 h-5" /> Add
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr><th className="px-4 py-3 font-semibold">Nama Item</th><th className="px-4 py-3 font-semibold text-center">Qty Masuk</th><th className="px-4 py-3 font-semibold">Nomorator</th><th className="px-4 py-3 font-semibold">Harga Baru</th><th className="px-4 py-3 font-semibold text-center">Aksi</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length > 0 ? (
                    items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3"><p className="font-bold text-slate-800">{item.nama_barang}</p><p className="font-mono text-[10px] text-slate-500">{item.kode_barang}</p></td>
                        <td className="px-4 py-3 text-center"><span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">{item.qty} {item.satuan}</span></td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.nomorator || "-"}</td>
                        <td className="px-4 py-3 font-medium text-slate-700">Rp {item.harga_satuan.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3 text-center"><button type="button" onClick={() => handleRemoveItem(item.barangId)} className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors inline-flex"><Trash2 className="w-4 h-4" /></button></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="px-4 py-12 text-center"><div className="flex flex-col items-center justify-center text-slate-400"><PackageOpen className="w-10 h-10 mb-2 opacity-50" /><p>Belum ada barang yang ditambahkan.</p></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <button disabled={loading} type="submit" className="w-full py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-lg transition-all disabled:opacity-50 shadow-[0_8px_20px_rgba(15,23,42,0.3)] hover:shadow-[0_10px_25px_rgba(15,23,42,0.4)]">
          {loading ? "Memproses Data..." : "Simpan Dokumen & Update Master Stok"}
        </button>
      </form>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-7 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-emerald-500 mb-4"><AlertTriangle className="w-7 h-7" /><h3 className="text-xl font-extrabold text-slate-900">Konfirmasi Restock</h3></div>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">Apakah data Surat Jalan dan Nomorator sudah sesuai? Aksi ini akan <strong>menambah stok</strong> dan <strong>memperbarui harga master</strong>.</p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowConfirm(false)} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors">Batal</button>
              <button type="button" onClick={executeSubmit} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-lg shadow-emerald-600/30">Ya, Update Sekarang</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}