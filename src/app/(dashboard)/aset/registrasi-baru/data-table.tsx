"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Helper untuk format Rupiah
const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

// Helper untuk format Tanggal
const formatTanggal = (tanggal: string) => {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(tanggal));
};

export default function DataTableRegistrasi({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-500 bg-slate-50/50">
        Belum ada data registrasi aset.
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table className="min-w-max">
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[50px] text-center">No</TableHead>
            <TableHead>Nomor Register</TableHead>
            <TableHead>Nama Aset</TableHead>
            <TableHead>Golongan</TableHead>
            <TableHead className="text-center">Jumlah</TableHead>
            <TableHead>Tgl Perolehan</TableHead>
            <TableHead className="text-right">Harga Perolehan</TableHead>
            <TableHead>Cabang / Unit</TableHead>
            <TableHead>User Pengguna</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={row.id}>
              <TableCell className="text-center font-medium">{index + 1}</TableCell>
              <TableCell>{row.nomorRegisterAset}</TableCell>
              <TableCell>{row.namaAset}</TableCell>
              <TableCell>{row.golonganAset}</TableCell>
              <TableCell className="text-center">{row.jumlah}</TableCell>
              <TableCell>{formatTanggal(row.tanggalPerolehan)}</TableCell>
              <TableCell className="text-right">{formatRupiah(row.hargaPerolehan)}</TableCell>
              <TableCell>{row.cabangUnitKerja}</TableCell>
              <TableCell>{row.userPengguna}</TableCell>
              <TableCell>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                  {row.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}