import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
  try {
    const dataHapusBuku = await prisma.hapusBukuAset.findMany({
      orderBy: { tanggalInput: 'desc' },
    });

    if (!dataHapusBuku || dataHapusBuku.length === 0) {
      return NextResponse.json({ error: 'Data hapus buku tidak ditemukan' }, { status: 404 });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'App Gudang';
    const worksheet = workbook.addWorksheet('Hapus Buku Aset');

    // Kolom Status telah dihapus dari daftar ini
    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Tanggal Input', key: 'tanggalInput', width: 15 },
      { header: 'Tgl Hapus Buku', key: 'tanggalHapusBuku', width: 15 },
      { header: 'No. Register', key: 'nomorRegisterAset', width: 22 },
      { header: 'Nama Aset', key: 'namaAset', width: 30 },
      { header: 'Golongan', key: 'golonganAset', width: 15 },
      { header: 'Jumlah', key: 'jumlah', width: 10 },
      { header: 'Tgl Perolehan', key: 'tanggalPerolehan', width: 15 },
      { header: 'Harga Perolehan', key: 'hargaPerolehan', width: 22 },
      { header: 'Akm. Penyusutan', key: 'akmPenyusutan', width: 22 },
      { header: 'Nilai Buku', key: 'nilaiBuku', width: 22 },
      { header: 'Cabang / Unit', key: 'cabangUnitKerja', width: 20 },
      { header: 'Alasan', key: 'alasanHapusBuku', width: 35 },
      { header: 'Operator', key: 'operatorName', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    dataHapusBuku.forEach((aset, index) => {
      worksheet.addRow({
        no: index + 1,
        tanggalInput: aset.tanggalInput,
        tanggalHapusBuku: aset.tanggalHapusBuku,
        nomorRegisterAset: aset.nomorRegisterAset,
        namaAset: aset.namaAset,
        golonganAset: aset.golonganAset,
        jumlah: aset.jumlah,
        tanggalPerolehan: aset.tanggalPerolehan,
        hargaPerolehan: Number(aset.hargaPerolehan), // Convert Decimal
        akmPenyusutan: Number(aset.akmPenyusutan),   // Convert Decimal
        nilaiBuku: Number(aset.nilaiBuku),           // Convert Decimal
        cabangUnitKerja: aset.cabangUnitKerja,
        alasanHapusBuku: aset.alasanHapusBuku,
        operatorName: aset.operatorName,
      });
    });

    // Format Currency & Date
    const currencyFormat = '"Rp"#,##0.00;[Red]\-"Rp"#,##0.00';
    worksheet.getColumn('hargaPerolehan').numFmt = currencyFormat;
    worksheet.getColumn('akmPenyusutan').numFmt = currencyFormat;
    worksheet.getColumn('nilaiBuku').numFmt = currencyFormat;

    worksheet.getColumn('tanggalInput').numFmt = 'dd/mm/yyyy';
    worksheet.getColumn('tanggalHapusBuku').numFmt = 'dd/mm/yyyy';
    worksheet.getColumn('tanggalPerolehan').numFmt = 'dd/mm/yyyy';

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="Data_Hapus_Buku_Aset.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error) {
    console.error('Error generating Excel Hapus Buku:', error);
    return NextResponse.json({ error: 'Gagal memproses file Excel' }, { status: 500 });
  }
}