"use client"

import { useState, useEffect, useRef } from "react";
import { getSemuaBarang } from "@/actions/barang";
import { createRequisition } from "@/actions/transaksi";
import { getSession } from "@/actions/auth";
import { ArrowRightLeft, Plus, Trash2, AlertTriangle, Search, PackageOpen } from "lucide-react";
import { toast } from "sonner";

export default function BarangKeluar() {
  const [barangList, setBarangList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [picNama, setPicNama] = useState("Loading...");
  
  // State List Barang yang udah di-add ke keranjang
  const [items, setItems] = useState<any[]>([]);
  
  // State Khusus Fitur Search Item
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedBarang, setSelectedBarang] = useState<any>(null);
  const [inputQty, setInputQty] = useState<number>(1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [formDataCache, setFormDataCache] = useState<any>(null);

  useEffect(() => {
    // Ambil list barang
    getSemuaBarang().then((res) => {
      if (res.success) setBarangList(res.data || []);
    });
    // Ambil data user yang login buat set PIC otomatis
    getSession().then((session) => {
      if (session && session.nama) setPicNama(session.nama);
      else setPicNama("User Tidak Dikenal");
    });

    // Handle klik di luar dropdown untuk nutup search list
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter barang berdasarkan ketikan user (Kode atau Nama)
  const filteredBarang = barangList.filter(b => 
    b.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.kode_barang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePilihBarang = (barang: any) => {
    setSelectedBarang(barang);
    setSearchQuery(`${barang.kode_barang} - ${barang.nama_barang}`);
    setShowDropdown(false);
  };

  const handleAddItem = () => {
    if (!selectedBarang) {
      toast.error("Pilih barang dari daftar rekomendasi dulu!");
      return;
    }
    if (inputQty <= 0) {
      toast.error("Jumlah (Qty) minimal 1!");
      return;
    }
    if (inputQty > selectedBarang.stok) {
      toast.error(`Stok tidak cukup! Sisa stok hanya ${selectedBarang.stok}`);
      return;
    }

    // Cek kalau barang udah ada di keranjang, jangan didobel
    const isExist = items.find(i => i.barangId === selectedBarang.id);
    if (isExist) {
      toast.error("Barang ini sudah ada di daftar! Hapus dulu jika ingin ubah jumlahnya.");
      return;
    }

    setItems([...items, { 
      barangId: selectedBarang.id, 
      kode_barang: selectedBarang.kode_barang,
      nama_barang: selectedBarang.nama_barang,
      satuan: selectedBarang.satuan,
      qty: inputQty 
    }]);

    // Reset input pencarian
    setSelectedBarang(null);
    setSearchQuery("");
    setInputQty(1);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.barangId !== id));
  };

  const handlePreSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast.error("Daftar pengambilan barang masih kosong!");
      return;
    }

    const formData = new FormData(e.currentTarget);
    setFormDataCache({
      media_request: formData.get("media_request") as string,
      no_dokumen: formData.get("no_dokumen") as string,
      tanggal_dokumen: formData.get("tanggal_dokumen") as string,
      cabang: formData.get("cabang") as string,
      tanggal_request: formData.get("tanggal_request") as string,
      jenis_permintaan: formData.get("jenis_permintaan") as string,
      pic_nama: picNama, // Ambil dari state yang di-freeze
      items: items
    });
    
    setShowConfirm(true);
  };

  const executeSubmit = async () => {
    setShowConfirm(false);
    setLoading(true);
    const loadingToastId = toast.loading("Sedang memproses pemotongan stok...");

    try {
      // PERHATIAN: Nanti API createRequisition harus diupdate biar nerima field baru
      const res = await createRequisition(formDataCache);
      if (res.success) {
        toast.success("Sukses! Stok berhasil dipotong.", { id: loadingToastId });
        setItems([]); 
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
    <div className="space-y-6 max-w-5xl mx-auto relative pb-10">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <ArrowRightLeft className="w-8 h-8 text-indigo-500" />
          Form Barang Keluar
        </h2>
        <p className="text-slate-500">Input Requisition Form untuk memotong stok gudang.</p>
      </div>

      <form id="form-req" onSubmit={handlePreSubmit} className="space-y-6">
        
        {/* SECTION 1: Informasi Header */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Informasi Request</h3>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Media Request</label>
            <input required name="media_request" placeholder="Contoh: Email / WhatsApp / Memo Internal" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">No Dokumen</label>
              <input required name="no_dokumen" placeholder="REQ/2026/..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Tanggal Dokumen</label>
              <input required type="date" name="tanggal_dokumen" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Cabang / Unit Kerja</label>
              <input required name="cabang" placeholder="Contoh: KCP Sudirman / Divisi IT" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Tanggal Request Masuk</label>
              <input required type="date" name="tanggal_request" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Jenis Permintaan</label>
              <select required name="jenis_permintaan" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors">
                <option value="" disabled selected>Pilih Jenis...</option>
                <option value="Existing">Existing</option>
                <option value="Repeat Order">Repeat Order</option>
                <option value="New Stock">New Stock</option>
                <option value="Non Stock">Non Stock</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                Nama PIC Pengambil
                <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-md font-normal">Auto</span>
              </label>
              {/* Field ini di-freeze (readOnly & disabled) */}
              <input readOnly disabled value={picNama} className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-500 font-medium cursor-not-allowed" />
            </div>
          </div>
        </div>

        {/* SECTION 2: Daftar Pengambilan Barang (UI Tabel & Search) */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6 space-y-5">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Daftar Pengambilan Barang</h3>
          
          {/* Fitur Search & Add Box */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
            <div className="flex-1 w-full space-y-1 relative" ref={dropdownRef}>
              <label className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Cari Item Gudang</label>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Ketik nama atau kode barang..." 
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                    setSelectedBarang(null); // Reset pilihan kalau user ngetik ulang
                  }}
                  onFocus={() => setShowDropdown(true)}
                />
                
                {/* Dropdown Rekomendasi */}
                {showDropdown && searchQuery && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {filteredBarang.length > 0 ? (
                      filteredBarang.map(b => (
                        <div 
                          key={b.id} 
                          onClick={() => handlePilihBarang(b)}
                          className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center justify-between transition-colors"
                        >
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{b.nama_barang}</p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{b.kode_barang}</p>
                          </div>
                          <div className={`text-xs font-bold px-2.5 py-1 rounded-md ${b.stok < 10 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'}`}>
                            Stok: {b.stok}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-slate-500">Barang tidak ditemukan.</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="w-full sm:w-28 space-y-1">
              <label className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Qty</label>
              <input 
                type="number" min="1" 
                value={inputQty}
                onChange={(e) => setInputQty(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none text-center font-bold" 
              />
            </div>

            <button 
              type="button" 
              onClick={handleAddItem} 
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors flex items-center justify-center gap-2 h-[46px]"
            >
              <Plus className="w-5 h-5" /> Add
            </button>
          </div>

          {/* Tabel Data Items */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Kode</th>
                  <th className="px-4 py-3 font-semibold">Nama Item</th>
                  <th className="px-4 py-3 font-semibold text-center">Qty</th>
                  <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length > 0 ? (
                  items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.kode_barang}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{item.nama_barang}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">{item.qty} {item.satuan}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button type="button" onClick={() => handleRemoveItem(item.barangId)} className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition-colors inline-flex">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <PackageOpen className="w-10 h-10 mb-2 opacity-50" />
                        <p>Belum ada barang yang ditambahkan.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Button */}
        <button disabled={loading} type="submit" className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg transition-colors disabled:opacity-50 shadow-lg shadow-slate-900/20">
          {loading ? "Menyiapkan Data..." : "Simpan Form & Potong Stok"}
        </button>
      </form>

      {/* Modal Konfirmasi */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-7 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <AlertTriangle className="w-7 h-7" />
              <h3 className="text-xl font-extrabold text-slate-900">Konfirmasi Pemotongan</h3>
            </div>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              Pastikan data <strong>Media Request</strong> dan <strong>Daftar Item</strong> sudah sesuai. Setelah disubmit, stok di sistem akan otomatis berkurang dan laporan akan tercatat.
            </p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowConfirm(false)} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-colors">
                Cek Lagi
              </button>
              <button type="button" onClick={executeSubmit} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors shadow-md shadow-indigo-600/20">
                Ya, Proses Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}