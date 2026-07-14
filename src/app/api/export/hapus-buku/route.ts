import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET() {
  try {
    const dataHapus = await prisma.hapusBukuAset.findMany({
      orderBy: { tanggalHapusBuku: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Hapus Buku Aset");

    // Header Laporan
    worksheet.mergeCells('B2:L2');
    worksheet.getCell('B2').value = "HAPUS BUKU ASET DAN BARANG NON INVENTARIS BARU";
    worksheet.getCell('B2').font = { bold: true, size: 12 };
    
    worksheet.mergeCells('B3:L3');
    worksheet.getCell('B3').value = "PT BANK BCA SYARIAH TAHUN 2026";
    worksheet.getCell('B3').font = { bold: true, size: 12 };

    // Header Tabel (Baris 5)
    worksheet.getRow(5).values = [
      "", "No", "Tanggal Hapus", "Nomor Register", "Nama Aset", "Golongan", "Jumlah", 
      "Tanggal Perolehan", "Harga Perolehan", "Akm. Penyusutan", "Nilai Buku", "Cabang/Unit", "Alasan"
    ];
    worksheet.getRow(5).font = { bold: true };

    // Looping Data
    let totalHarga = 0;
    let totalAkm = 0;
    let totalNilaiBuku = 0;

    dataHapus.forEach((item, index) => {
      const rowIndex = 6 + index;
      totalHarga += Number(item.hargaPerolehan);
      totalAkm += Number(item.akmPenyusutan);
      totalNilaiBuku += Number(item.nilaiBuku);
      
      worksheet.getRow(rowIndex).values = [
        "",
        index + 1,
        item.tanggalHapusBuku.toLocaleDateString("id-ID"),
        item.nomorRegisterAset,
        item.namaAset,
        item.golonganAset,
        item.jumlah,
        item.tanggalPerolehan.toLocaleDateString("id-ID"),
        Number(item.hargaPerolehan),
        Number(item.akmPenyusutan),
        Number(item.nilaiBuku),
        item.cabangUnitKerja,
        item.alasanHapusBuku
      ];
    });

    // Baris Total
    const totalRowIndex = 6 + dataHapus.length;
    const totalRow = worksheet.getRow(totalRowIndex);
    totalRow.getCell(2).value = "TOTAL";
    totalRow.getCell(2).font = { bold: true };
    totalRow.getCell(9).value = totalHarga;
    totalRow.getCell(10).value = totalAkm;
    totalRow.getCell(11).value = totalNilaiBuku;
    totalRow.font = { bold: true };

    // Footer Tanda Tangan
    const ttdRowIndex = totalRowIndex + 3;
    worksheet.getCell(`H${ttdRowIndex}`).value = "SUPERVISOR";
    worksheet.getCell(`K${ttdRowIndex}`).value = "OPERATOR";
    
    worksheet.getCell(`H${ttdRowIndex + 4}`).value = "Novianti Siswandi";
    worksheet.getCell(`K${ttdRowIndex + 4}`).value = "Indra Dwi Ananda";
    
    const today = new Date().toLocaleDateString("id-ID");
    worksheet.getCell(`H${ttdRowIndex + 5}`).value = `Tanggal : ${today}`;
    worksheet.getCell(`K${ttdRowIndex + 5}`).value = `Tanggal : ${today}`;

    // Formatting Kolom
    worksheet.columns = [
      { width: 3 }, { width: 5 }, { width: 15 }, { width: 25 }, { width: 30 }, 
      { width: 15 }, { width: 8 }, { width: 15 }, { width: 18 }, { width: 18 }, 
      { width: 15 }, { width: 25 }, { width: 20 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="HAPUS_BUKU_ASET_${today.replace(/\//g, "")}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal export" }, { status: 500 });
  }
}