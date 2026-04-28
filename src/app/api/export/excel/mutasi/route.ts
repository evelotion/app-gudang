import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
  try {
    const dataMutasi = await prisma.mutasiAset.findMany({
      orderBy: { tanggalInput: 'desc' },
    });

    if (!dataMutasi || dataMutasi.length === 0) {
      return NextResponse.json({ error: 'Data mutasi tidak ditemukan' }, { status: 404 });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'App Gudang';
    const worksheet = workbook.addWorksheet('Mutasi Aset');

    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Tanggal Input', key: 'tanggalInput', width: 15 },
      { header: 'Tgl Mutasi', key: 'tanggalMutasi', width: 15 },
      { header: 'No. Register', key: 'nomorRegisterAset', width: 22 },
      { header: 'Nama Aset', key: 'namaAset', width: 30 },
      { header: 'Golongan', key: 'golonganAset', width: 15 },
      { header: 'Jumlah', key: 'jumlah', width: 10 },
      { header: 'Tgl Perolehan', key: 'tanggalPerolehan', width: 15 },
      { header: 'Harga Perolehan', key: 'hargaPerolehan', width: 22 },
      { header: 'Akm. Penyusutan', key: 'akmPenyusutan', width: 22 },
      { header: 'Lokasi Awal', key: 'lokasiAwal', width: 25 },
      { header: 'Lokasi Tujuan', key: 'lokasiTujuan', width: 25 },
      { header: 'Alasan Mutasi', key: 'alasanMutasi', width: 35 },
      { header: 'Operator', key: 'operatorName', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    dataMutasi.forEach((aset, index) => {
      worksheet.addRow({
        no: index + 1,
        tanggalInput: aset.tanggalInput,
        tanggalMutasi: aset.tanggalMutasi,
        nomorRegisterAset: aset.nomorRegisterAset,
        namaAset: aset.namaAset,
        golonganAset: aset.golonganAset,
        jumlah: aset.jumlah,
        tanggalPerolehan: aset.tanggalPerolehan,
        hargaPerolehan: Number(aset.hargaPerolehan), // Convert Decimal ke Number
        akmPenyusutan: Number(aset.akmPenyusutan),   // Convert Decimal ke Number
        lokasiAwal: aset.lokasiAwal,
        lokasiTujuan: aset.lokasiTujuan,
        alasanMutasi: aset.alasanMutasi,
        operatorName: aset.operatorName,
        status: aset.status,
      });
    });

    // Format Currency & Date
    const currencyFormat = '"Rp"#,##0.00;[Red]\-"Rp"#,##0.00';
    worksheet.getColumn('hargaPerolehan').numFmt = currencyFormat;
    worksheet.getColumn('akmPenyusutan').numFmt = currencyFormat;
    
    worksheet.getColumn('tanggalInput').numFmt = 'dd/mm/yyyy';
    worksheet.getColumn('tanggalMutasi').numFmt = 'dd/mm/yyyy';
    worksheet.getColumn('tanggalPerolehan').numFmt = 'dd/mm/yyyy';

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="Data_Mutasi_Aset.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error) {
    console.error('Error generating Excel Mutasi:', error);
    return NextResponse.json({ error: 'Gagal memproses file Excel' }, { status: 500 });
  }
}