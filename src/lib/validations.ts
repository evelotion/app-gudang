import { z } from "zod";

export const registrasiAsetSchema = z.object({
  tanggalInput: z.coerce.date(), // <--- TAMBAHAN UNTUK BATCH DATE
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
  tanggalInput: z.coerce.date(), // <--- TAMBAHAN UNTUK BATCH DATE
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