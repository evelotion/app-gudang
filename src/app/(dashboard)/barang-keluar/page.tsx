"use client"

import { useState, useEffect, useRef } from "react";
import { getSemuaBarang } from "@/actions/barang";
import { createRequisition, getRequisitions, updateStatusRequisition } from "@/actions/transaksi";
import { getSession } from "@/actions/auth";
import { ArrowRightLeft, Plus, Trash2, AlertTriangle, Search, PackageOpen, Truck, Box, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface BarangTipe {
  id: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  stok: number;
  stok_min: number;
  nomorator: string;
}

interface CartItem {
  barangId: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  qty: number;
  nomorator: string;
}

interface FormDataReq {
  media_request: string;
  no_dokumen: string;
  tanggal_dokumen: string;
  cabang: string;
  tanggal_request: string;
  jenis_permintaan: string;
  pic_nama: string;
  items: CartItem[];
}

export default function BarangKeluar() {
  // --- STATE TABS ---
  const [activeTab, setActiveTab] = useState<"form" | "monitoring">("form");

  // --- STATE FORM INPUT ---
  const [barangList, setBarangList] = useState<BarangTipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [picNama, setPicNama] = useState("Loading...");
  
  const [items, setItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedBarang, setSelectedBarang] = useState<BarangTipe | null>(null);
  
  const [inputQty, setInputQty] = useState<number>(1);
  const [inputNomorator, setInputNomorator] = useState<string>("");
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formDataCache, setFormDataCache] = useState<FormDataReq | null>(null);

  // --- STATE MONITORING ---
  const [reqData, setReqData] = useState<any[]>([]);
  const [loadingMon, setLoadingMon] = useState(false);

  useEffect(() => {
    getSemuaBarang().then((res) => {
      if (res.success && res.data) setBarangList(res.data as BarangTipe[]);
    });
    getSession().then((session) => {
      if (session && session.nama) setPicNama(session.nama);
      else setPicNama("User Tidak Dikenal");
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch data monitoring kalau tab aktif berubah ke monitoring
  useEffect(() => {
    if (activeTab === "monitoring") {
      fetchMonitoring();
    }
  }, [activeTab]);

  const fetchMonitoring = async () => {
    setLoadingMon(true);
    const res = await getRequisitions();
    if (res.success && res.data) setReqData(res.data);
    setLoadingMon(false);
  };

  const handleUpdateStatus = async (id: string, noDokumen: string) => {
    const toastId = toast.loading(`Mengupdate status ${noDokumen}...`);
    const res = await updateStatusRequisition(id, "DIKIRIM");
    if (res.success) {
      toast.success(`${noDokumen} berhasil dikirim!`, { id: toastId });
      fetchMonitoring(); // Refresh list
    } else {
      toast.error(res.error || "Gagal update status", { id: toastId });
    }
  };

  // --- HANDLER FORM ---
  const filteredBarang = barangList.filter(b => 
    b.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.kode_barang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePilihBarang = (barang: BarangTipe) => {
    setSelectedBarang(barang);
    setSearchQuery(`${barang.kode_barang} - ${barang.nama_barang}`);
    setInputNomorator(barang.nomorator || "");
    setShowDropdown(false);
  };

  const handleAddItem = () => {
    if (!selectedBarang) return toast.error("Pilih barang dari daftar rekomendasi dulu!");
    if (inputQty <= 0) return toast.error("Jumlah (Qty) minimal 1!");
    if (inputQty > selectedBarang.stok) return toast.error(`Stok tidak cukup! Sisa stok hanya ${selectedBarang.stok}`);

    const isExist = items.find(i => i.barangId === selectedBarang.id);
    if (isExist) return toast.error("Barang ini sudah ada di daftar! Hapus dulu jika ingin ubah jumlahnya.");

    const sisaStok = selectedBarang.stok - inputQty;
    if (sisaStok <= selectedBarang.stok_min) {
      toast.warning(`Perhatian: Sisa stok ${selectedBarang.nama_barang} akan menjadi ${sisaStok} (Batas minimal: ${selectedBarang.stok_min})`);
    }

    setItems([...items, { 
      barangId: selectedBarang.id, kode_barang: selectedBarang.kode_barang, nama_barang: selectedBarang.nama_barang,
      satuan: selectedBarang.satuan, qty: inputQty, nomorator: inputNomorator
    }]);

    setSelectedBarang(null); setSearchQuery(""); setInputQty(1); setInputNomorator("");
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.barangId !== id));
  };

  const handlePreSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (items.length === 0) return toast.error("Daftar pengambilan barang masih kosong!");

    const formData = new FormData(e.currentTarget);
    setFormDataCache({
      media_request: formData.get("media_request") as string,
      no_dokumen: formData.get("no_dokumen") as string,
      tanggal_dokumen: formData.get("tanggal_dokumen") as string,
      cabang: formData.get("cabang") as string,
      tanggal_request: formData.get("tanggal_request") as string,
      jenis_permintaan: formData.get("jenis_permintaan") as string,
      pic_nama: picNama, items: items
    });
    
    setShowConfirm(true);
  };

  const executeSubmit = async () => {
    if (!formDataCache) return;
    setShowConfirm(false); setLoading(true);
    const loadingToastId = toast.loading("Sedang memproses pemotongan stok...");

    try {
      const res = await createRequisition(formDataCache);
      if (res.success) {
        toast.success("Sukses! Stok berhasil dipotong.", { id: loadingToastId });
        setItems([]); (document.getElementById("form-req") as HTMLFormElement).reset();
        setActiveTab("monitoring"); // Pindah ke tab monitoring setelah sukses
      } else {
        toast.error("Gagal: " + res.error, { id: loadingToastId });
      }
    } catch (error) { toast.error("Terjadi kesalahan pada server.", { id: loadingToastId }) } 
    finally { setLoading(false) }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative pb-10">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <ArrowRightLeft className="w-8 h-8 text-indigo-500" />
          Barang Keluar
        </h2>
        <p className="text-slate-500">Kelola form pengeluaran barang dan pantau status fisik pengiriman logistik ke Cabang.</p>
      </div>

      {/* --- MENU TABS --- */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab("form")} 
          className={`flex items-center gap-2 px-6 py-3.5 font-bold transition-all border-b-2 ${activeTab === "form" ? "border-indigo-600 text-indigo-700 bg-indigo-50/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
        >
          <Plus className="w-4 h-4" /> Form Input Pengeluaran
        </button>
        <button 
          onClick={() => setActiveTab("monitoring")} 
          className={`flex items-center gap-2 px-6 py-3.5 font-bold transition-all border-b-2 ${activeTab === "monitoring" ? "border-indigo-600 text-indigo-700 bg-indigo-50/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
        >
          <Truck className="w-4 h-4" /> Monitoring Status
        </button>
      </div>

      {/* --- TAB CONTENT: FORM INPUT --- */}
      {activeTab === "form" && (
        <form id="form-req" onSubmit={handlePreSubmit} className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white/80 backdrop-blur-xl shadow-sm border border-slate-200/60 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Informasi Request</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Media Request</label>
              <input required name="media_request" placeholder="Contoh: Email / WhatsApp / Memo Internal" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors shadow-sm" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-semibold text-slate-700">No Dokumen</label><input required name="no_dokumen" placeholder="REQ/2026/..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors shadow-sm" /></div>
              <div className="space-y-2"><label className="text-sm font-semibold text-slate-700">Tanggal Dokumen</label><input required type="date" name="tanggal_dokumen" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors shadow-sm" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-semibold text-slate-700">Cabang / Unit Kerja</label><input required name="cabang" placeholder="Contoh: KCP Sudirman / Divisi IT" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors shadow-sm" /></div>
              <div className="space-y-2"><label className="text-sm font-semibold text-slate-700">Tanggal Request Masuk</label><input required type="date" name="tanggal_request" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors shadow-sm" /></div>
            </div>

            {/* STATUS DIHAPUS, KEMBALI KE 2 KOLOM */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Jenis Permintaan</label>
                <select required name="jenis_permintaan" defaultValue="" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors shadow-sm">
                  <option value="" disabled>Pilih Jenis...</option>
                  <option value="Existing">Existing</option>
                  <option value="Repeat Order">Repeat Order</option>
                  <option value="New Stock">New Stock</option>
                  <option value="Non Stock">Non Stock</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                  Nama PIC Pengambil <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-md font-normal">Auto</span>
                </label>
                <input readOnly disabled value={picNama} className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-500 font-medium cursor-not-allowed" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl shadow-sm border border-slate-200/60 rounded-2xl p-6 space-y-5">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Daftar Pengambilan Barang</h3>
            <div className="flex flex-wrap gap-3 items-end bg-indigo-50/40 p-5 rounded-xl border border-indigo-100/50">
              <div className="flex-1 min-w-[250px] space-y-1.5 relative" ref={dropdownRef}>
                <label className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Cari Item Gudang</label>
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                  <input type="text" placeholder="Ketik nama buku tabungan..." className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none shadow-sm" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); setSelectedBarang(null); }} onFocus={() => setShowDropdown(true)} />
                  {showDropdown && searchQuery && (
                    <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-h-60 overflow-y-auto">
                      {filteredBarang.length > 0 ? filteredBarang.map(b => (
                        <div key={b.id} onClick={() => handlePilihBarang(b)} className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 flex items-center justify-between">
                          <div><p className="font-semibold text-slate-800 text-sm">{b.nama_barang}</p><p className="text-xs text-slate-500 font-mono mt-0.5">{b.kode_barang}</p></div>
                          <div className={`text-xs font-bold px-2.5 py-1 rounded-md ${b.stok <= b.stok_min ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-700'}`}>Stok: {b.stok}</div>
                        </div>
                      )) : <div className="p-4 text-center text-sm text-slate-500">Barang tidak ditemukan.</div>}
                    </div>
                  )}
                </div>
              </div>
              <div className="w-[100px] space-y-1.5"><label className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Qty</label><input type="number" min="1" value={inputQty} onChange={(e) => setInputQty(parseInt(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none text-center font-bold shadow-sm" /></div>
              <div className="w-[200px] space-y-1.5"><label className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Sisa Nomorator</label><input type="text" placeholder="Update sisa seri..." value={inputNomorator} onChange={(e) => setInputNomorator(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm font-mono shadow-sm" /></div>
              <button type="button" onClick={handleAddItem} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold transition-all shadow-[0_4px_12px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2 h-[46px]"><Plus className="w-5 h-5" /> Add</button>
            </div>
            
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr><th className="px-4 py-3 font-semibold">Nama Item</th><th className="px-4 py-3 font-semibold text-center">Qty Diambil</th><th className="px-4 py-3 font-semibold">Sisa Nomorator di Master</th><th className="px-4 py-3 font-semibold text-center">Aksi</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length > 0 ? items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50"><td className="px-4 py-3"><p className="font-bold text-slate-800">{item.nama_barang}</p><p className="font-mono text-[10px] text-slate-500">{item.kode_barang}</p></td><td className="px-4 py-3 text-center"><span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">{item.qty} {item.satuan}</span></td><td className="px-4 py-3 font-mono text-xs text-slate-600">{item.nomorator || "-"}</td><td className="px-4 py-3 text-center"><button type="button" onClick={() => handleRemoveItem(item.barangId)} className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg inline-flex"><Trash2 className="w-4 h-4" /></button></td></tr>
                  )) : <tr><td colSpan={4} className="px-4 py-12 text-center"><PackageOpen className="w-10 h-10 mb-2 opacity-50 mx-auto text-slate-400" /><p className="text-slate-400">Belum ada barang yang ditambahkan.</p></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <button disabled={loading} type="submit" className="w-full py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-lg transition-all disabled:opacity-50 shadow-[0_8px_20px_rgba(15,23,42,0.3)]">{loading ? "Memproses Data..." : "Simpan Dokumen & Kurangi Stok"}</button>
        </form>
      )}

      {/* --- TAB CONTENT: MONITORING --- */}
      {activeTab === "monitoring" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
          <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Box className="w-5 h-5 text-indigo-500" /> Antrean & Riwayat Fisik Barang</h3>
              <p className="text-sm text-slate-500 mt-1">Pantau dokumen mana yang masih dalam proses packing dan yang sudah dipickup.</p>
            </div>
            <button onClick={fetchMonitoring} disabled={loadingMon} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-indigo-100 hover:border-indigo-300 transition-colors">
              <RefreshCw className={`w-4 h-4 ${loadingMon ? "animate-spin" : ""}`}/> Refresh Data
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold">No. Dokumen</th>
                  <th className="px-6 py-4 font-bold">Cabang / Unit</th>
                  <th className="px-6 py-4 font-bold">Tanggal Dibuat</th>
                  <th className="px-6 py-4 font-bold">Status Fisik</th>
                  <th className="px-6 py-4 font-bold text-center">Aksi (Ubah Status)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reqData.length > 0 ? reqData.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-extrabold text-slate-800">{req.no_dokumen}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{req.items.length} Macam Barang</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{req.cabang}</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(req.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</td>
                    <td className="px-6 py-4">
                      {req.status === "PACKING" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 font-extrabold text-xs tracking-wide">
                          <Box className="w-3.5 h-3.5" /> SEDANG PACKING
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 font-extrabold text-xs tracking-wide">
                          <CheckCircle2 className="w-3.5 h-3.5" /> SUDAH DIKIRIM
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {req.status === "PACKING" ? (
                        <button 
                          onClick={() => handleUpdateStatus(req.id, req.no_dokumen)}
                          className="px-4 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs transition-colors border border-indigo-100 inline-flex items-center gap-2"
                        >
                          <Truck className="w-3.5 h-3.5" /> Tandai Dikirim
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-slate-400 italic">Selesai</span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-500 font-medium">
                      Belum ada data barang keluar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- POPUP CONFIRMATION FORM --- */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-7 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-amber-500 mb-4"><AlertTriangle className="w-7 h-7" /><h3 className="text-xl font-extrabold text-slate-900">Konfirmasi Pengeluaran</h3></div>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">Pastikan data pengeluaran dan sisa nomorator sudah sesuai. Aksi ini akan <strong>memotong stok master</strong> secara permanen.</p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowConfirm(false)} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors">Cek Lagi</button>
              <button type="button" onClick={executeSubmit} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg shadow-indigo-600/30">Ya, Proses Sekarang</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}