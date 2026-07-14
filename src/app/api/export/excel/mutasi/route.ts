import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupBy = searchParams.get('groupBy') || 'golonganAset';
    
    // Tangkap parameter tanggal dari URL
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    // Bikin filter query database berdasarkan rentang tanggal
    let whereClause = {};
    if (startDate && endDate) {
      whereClause = {
        tanggalMutasi: {
          gte: new Date(`${startDate}T00:00:00.000Z`), // Dari awal hari
          lte: new Date(`${endDate}T23:59:59.999Z`),   // Sampai akhir hari
        }
      };
    }

    // Ambil data dengan filter tanggal dan urutkan berdasarkan parameter grouping
    const dataMutasi = await prisma.mutasiAset.findMany({
      where: whereClause,
      orderBy: [
        { [groupBy]: 'asc' },
        { tanggalInput: 'desc' }
      ],
    });

    if (!dataMutasi || dataMutasi.length === 0) {
      return NextResponse.json({ error: 'Data mutasi tidak ditemukan pada rentang tanggal tersebut' }, { status: 404 });
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
      { header: 'Golongan', key: 'golonganAset', width: 20 },
      { header: 'Jumlah', key: 'jumlah', width: 10 },
      { header: 'Tgl Perolehan', key: 'tanggalPerolehan', width: 15 },
      { header: 'Harga Perolehan', key: 'hargaPerolehan', width: 22 },
      { header: 'Akm. Penyusutan', key: 'akmPenyusutan', width: 22 },
      { header: 'Lokasi Awal', key: 'lokasiAwal', width: 25 },
      { header: 'Lokasi Tujuan', key: 'lokasiTujuan', width: 25 },
      { header: 'Alasan Mutasi', key: 'alasanMutasi', width: 35 },
      { header: 'Operator', key: 'operatorName', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // DYNAMIC GROUPING
    const groupedData = dataMutasi.reduce((acc: any, curr: any) => {
      const groupValue = curr[groupBy] || 'Tidak Ada Data';
      if (!acc[groupValue]) acc[groupValue] = [];
      acc[groupValue].push(curr);
      return acc;
    }, {});

    let globalRowNumber = 1;

    Object.entries(groupedData).forEach(([groupName, items]: [string, any]) => {
      let subTotalJumlah = 0;
      let subTotalHarga = 0;
      let subTotalAkm = 0;

      items.forEach((aset: any) => {
        subTotalJumlah += Number(aset.jumlah);
        subTotalHarga += Number(aset.hargaPerolehan);
        subTotalAkm += Number(aset.akmPenyusutan);

        worksheet.addRow({
          no: globalRowNumber++,
          tanggalInput: aset.tanggalInput,
          tanggalMutasi: aset.tanggalMutasi,
          nomorRegisterAset: aset.nomorRegisterAset,
          namaAset: aset.namaAset,
          golonganAset: aset.golonganAset,
          jumlah: Number(aset.jumlah),
          tanggalPerolehan: aset.tanggalPerolehan,
          hargaPerolehan: Number(aset.hargaPerolehan),
          akmPenyusutan: Number(aset.akmPenyusutan),
          lokasiAwal: aset.lokasiAwal,
          lokasiTujuan: aset.lokasiTujuan,
          alasanMutasi: aset.alasanMutasi,
          operatorName: aset.operatorName,
        });
      });

      // ADD SUBTOTAL ROW
      const subTotalRow = worksheet.addRow({
        no: '',
        tanggalInput: '',
        tanggalMutasi: '',
        nomorRegisterAset: '',
        namaAset: `SUBTOTAL ${groupName.toUpperCase()}`,
        golonganAset: '',
        jumlah: subTotalJumlah,
        tanggalPerolehan: '',
        hargaPerolehan: subTotalHarga,
        akmPenyusutan: subTotalAkm,
        lokasiAwal: '',
        lokasiTujuan: '',
        alasanMutasi: '',
        operatorName: '',
      });

      subTotalRow.font = { bold: true, color: { argb: 'FF1E40AF' } }; 
      subTotalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } }; 
    });

    const currencyFormat = '"Rp"#,##0.00;[Red]\-"Rp"#,##0.00';
    worksheet.getColumn('hargaPerolehan').numFmt = currencyFormat;
    worksheet.getColumn('akmPenyusutan').numFmt = currencyFormat;
    
    worksheet.getColumn('tanggalInput').numFmt = 'dd/mm/yyyy';
    worksheet.getColumn('tanggalMutasi').numFmt = 'dd/mm/yyyy';
    worksheet.getColumn('tanggalPerolehan').numFmt = 'dd/mm/yyyy';

    const buffer = await workbook.xlsx.writeBuffer();
    
    // Nama file dinamis ngikutin filter tanggal kalau ada
    const fileName = startDate && endDate 
      ? `Data_Mutasi_Aset_${startDate}_sd_${endDate}.xlsx` 
      : `Data_Mutasi_Aset.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error) {
    console.error('Error generating Excel Mutasi:', error);
    return NextResponse.json({ error: 'Gagal memproses file Excel' }, { status: 500 });
  }
}