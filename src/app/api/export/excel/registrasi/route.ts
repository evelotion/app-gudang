import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
  try {
    // 1. Ambil data dari database
    // Lo bisa modifikasi ini nanti untuk menerima parameter filter (misal: rentang tanggal)
    const dataAset = await prisma.registrasiAset.findMany({
      orderBy: { tanggalInput: 'desc' },
    });

    if (!dataAset || dataAset.length === 0) {
      return NextResponse.json({ error: 'Data aset tidak ditemukan' }, { status: 404 });
    }

    // 2. Inisialisasi Workbook Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'App Gudang';
    const worksheet = workbook.addWorksheet('Registrasi Aset');

    // 3. Definisikan Struktur Kolom
    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Tanggal Input', key: 'tanggalInput', width: 15 },
      { header: 'No. Register', key: 'nomorRegisterAset', width: 22 },
      { header: 'Nama Aset', key: 'namaAset', width: 30 },
      { header: 'Golongan', key: 'golonganAset', width: 15 },
      { header: 'Jumlah', key: 'jumlah', width: 10 },
      { header: 'Tgl Perolehan', key: 'tanggalPerolehan', width: 15 },
      { header: 'Harga Perolehan', key: 'hargaPerolehan', width: 22 },
      { header: 'Cabang/Unit', key: 'cabangUnitKerja', width: 20 },
      { header: 'Pengguna', key: 'userPengguna', width: 20 },
      { header: 'Lokasi', key: 'lokasiPosisiAset', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    // 4. Styling Baris Header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' }, // Warna Slate-900 
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Freeze header agar tetap terlihat saat di-scroll ke bawah
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // 5. Masukkan Data ke Baris (Rows)
    dataAset.forEach((aset, index) => {
      worksheet.addRow({
        no: index + 1,
        tanggalInput: aset.tanggalInput,
        nomorRegisterAset: aset.nomorRegisterAset,
        namaAset: aset.namaAset,
        golonganAset: aset.golonganAset,
        jumlah: aset.jumlah,
        tanggalPerolehan: aset.tanggalPerolehan,
        
        // WAJIB: Convert Prisma Decimal ke Number agar terbaca sebagai angka di Excel
        hargaPerolehan: Number(aset.hargaPerolehan),
        
        cabangUnitKerja: aset.cabangUnitKerja,
        userPengguna: aset.userPengguna,
        lokasiPosisiAset: aset.lokasiPosisiAset,
        status: aset.status,
      });
    });

    // 6. Format Tipe Data Kolom (Currency & Date)
    // Format Akuntansi/Rupiah standar
    worksheet.getColumn('hargaPerolehan').numFmt = '"Rp"#,##0.00;[Red]\-"Rp"#,##0.00';
    worksheet.getColumn('tanggalInput').numFmt = 'dd/mm/yyyy';
    worksheet.getColumn('tanggalPerolehan').numFmt = 'dd/mm/yyyy';

    // 7. Generate Buffer dan Kirim sebagai Response File
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="Data_Registrasi_Aset.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error) {
    console.error('Error generating Excel:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memproses file Excel' },
      { status: 500 }
    );
  }
}