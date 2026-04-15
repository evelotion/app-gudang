import { z } from "zod";

// ==========================================
// REGEX UTILITY (Bisa di-import ke komponen form UI)
// ==========================================
export const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/\d{4}$/;

// ==========================================
// SERVER SCHEMAS (Untuk divalidasi di Server Action)
// ==========================================

export const registrasiAsetSchema = z.object({
  tanggalInput: z.coerce.date(), // Batch Date
  nomorRegisterAset: z.string().min(1, "Nomor Register wajib diisi"),
  namaAset: z.string().min(1, "Nama Aset wajib diisi"),
  golonganAset: z.string().min(1, "Golongan Aset wajib diisi"),
  jumlah: z.coerce.number().min(1, "Jumlah minimal 1"),
  tanggalPerolehan: z.coerce.date(),
  hargaPerolehan: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  cabangUnitKerja: z.string().min(1, "Cabang/Unit Kerja wajib diisi"),
  userPengguna: z.string().min(1, "User Pengguna wajib diisi"),
  lokasiPosisiAset: z.string().min(1, "Lokasi/Posisi Aset wajib diisi"),
  inputerName: z.string().min(1, "Nama Inputer wajib diisi"),
  supervisorName: z.string().optional(),
});

export const hapusBukuAsetSchema = z.object({
  tanggalInput: z.coerce.date(), // Batch Date
  tanggalHapusBuku: z.coerce.date(),
  nomorRegisterAset: z.string().min(1, "Nomor Register wajib diisi"),
  namaAset: z.string().min(1, "Nama Aset wajib diisi"),
  golonganAset: z.string().min(1, "Golongan Aset wajib diisi"),
  jumlah: z.coerce.number().min(1, "Jumlah minimal 1"),
  tanggalPerolehan: z.coerce.date(),
  hargaPerolehan: z.coerce.number().min(0, "Harga Perolehan tidak valid"),
  akmPenyusutan: z.coerce.number().min(0, "Akumulasi Penyusutan tidak valid"),
  nilaiBuku: z.coerce.number().min(0, "Nilai Buku tidak valid"),
  cabangUnitKerja: z.string().min(1, "Cabang/Unit Kerja wajib diisi"),
  alasanHapusBuku: z.string().min(1, "Alasan wajib diisi"),
  operatorName: z.string().min(1, "Nama Operator wajib diisi"),
  supervisorName: z.string().optional(),
});

export const mutasiAsetSchema = z.object({
  tanggalInput: z.coerce.date(), // Batch Date
  tanggalMutasi: z.coerce.date(),
  nomorRegisterAset: z.string().min(1, "Nomor Register wajib diisi"),
  namaAset: z.string().min(1, "Nama Aset wajib diisi"),
  golonganAset: z.string().min(1, "Golongan Aset wajib diisi"),
  jumlah: z.coerce.number().min(1, "Jumlah minimal 1"),
  tanggalPerolehan: z.coerce.date(),
  hargaPerolehan: z.coerce.number().min(0, "Harga Perolehan tidak valid"),
  akmPenyusutan: z.coerce.number().min(0, "Akumulasi Penyusutan tidak valid"),
  lokasiAwal: z.string().min(1, "Lokasi awal wajib diisi"),
  lokasiTujuan: z.string().min(1, "Lokasi tujuan wajib diisi"),
  alasanMutasi: z.string().min(1, "Alasan mutasi wajib diisi"),
  operatorName: z.string().min(1, "Nama Operator wajib diisi"),
  supervisorName: z.string().optional(),
});