"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formatRupiah = (angka: number) => 
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);

const formatTanggal = (tanggal: string) => 
  new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(tanggal));

export default function DataTableHapusBuku({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-500 bg-slate-50/50">
        Belum ada data hapus buku aset.
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table className="min-w-max">
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[50px] text-center">No</TableHead>
            <TableHead>Tgl Hapus</TableHead>
            <TableHead>Nomor Register</TableHead>
            <TableHead>Nama Aset</TableHead>
            <TableHead className="text-center">Jml</TableHead>
            <TableHead className="text-right">Harga Perolehan</TableHead>
            <TableHead className="text-right">Akm Penyusutan</TableHead>
            <TableHead className="text-right">Nilai Buku</TableHead>
            <TableHead>Alasan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={row.id}>
              <TableCell className="text-center font-medium">{index + 1}</TableCell>
              <TableCell>{formatTanggal(row.tanggalHapusBuku)}</TableCell>
              <TableCell>{row.nomorRegisterAset}</TableCell>
              <TableCell>{row.namaAset}</TableCell>
              <TableCell className="text-center">{row.jumlah}</TableCell>
              <TableCell className="text-right">{formatRupiah(row.hargaPerolehan)}</TableCell>
              <TableCell className="text-right text-red-600">{formatRupiah(row.akmPenyusutan)}</TableCell>
              <TableCell className="text-right font-medium">{formatRupiah(row.nilaiBuku)}</TableCell>
              <TableCell>{row.alasanHapusBuku}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}