import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { formatTanggalIndo } from "@/lib/utils"; // <-- IMPORT FUNGSI UTILS KITA

export async function GET() {
  try {
    // 1. Ambil data dari database
    const dataAset = await prisma.registrasiAset.findMany({
      orderBy: { createdAt: "asc" },
    });

    // 2. Inisialisasi Workbook Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Registrasi Aset");

    // 3. Bikin Header Perusahaan (Baris 1 & 2)
    worksheet.mergeCells('B2:J2');
    worksheet.getCell('B2').value = "REGISTRASI ASET DAN BARANG NON INVENTARIS BARU";
    worksheet.getCell('B2').font = { bold: true, size: 12 };
    
    worksheet.mergeCells('B3:J3');
    worksheet.getCell('B3').value = "PT BANK BCA SYARIAH TAHUN 2026";
    worksheet.getCell('B3').font = { bold: true, size: 12 };

    // 4. Bikin Header Tabel (Baris 5)
    worksheet.getRow(5).values = [
      "", // Kolom A kosongin aja buat margin
      "No", 
      "Nomor Register Aset", 
      "Nama Aset", 
      "Golongan Aset", 
      "Jumlah", 
      "Tanggal Perolehan", 
      "Harga Perolehan", 
      "Cabang/Unit Kerja", 
      "User Pengguna", 
      "Lokasi/Posisi Aset"
    ];
    worksheet.getRow(5).font = { bold: true };

    // 5. Looping Data
    let totalHarga = 0;
    dataAset.forEach((item, index) => {
      const rowIndex = 6 + index;
      totalHarga += Number(item.hargaPerolehan);
      
      worksheet.getRow(rowIndex).values = [
        "", // Margin
        index + 1,
        item.nomorRegisterAset,
        item.namaAset,
        item.golonganAset,
        item.jumlah,
        formatTanggalIndo(item.tanggalPerolehan), // <-- UBAHAN DI SINI (otomatis "01 Januari 2026")
        Number(item.hargaPerolehan), // Biar bisa diformat angka di Excel
        item.cabangUnitKerja,
        item.userPengguna,
        item.lokasiPosisiAset
      ];
    });

    // 6. Bikin Baris Total
    const totalRowIndex = 6 + dataAset.length;
    worksheet.getRow(totalRowIndex).getCell(2).value = "Total";
    worksheet.getRow(totalRowIndex).getCell(2).font = { bold: true };
    worksheet.getRow(totalRowIndex).getCell(8).value = totalHarga;
    worksheet.getRow(totalRowIndex).getCell(8).font = { bold: true };

    // 7. Bikin Area Tanda Tangan (Footer)
    const ttdRowIndex = totalRowIndex + 3;
    worksheet.getCell(`F${ttdRowIndex}`).value = "Supervisi";
    worksheet.getCell(`H${ttdRowIndex}`).value = "Inputer";
    
    worksheet.getCell(`F${ttdRowIndex + 4}`).value = "Novianti Siswandi"; // Contoh nama statis/bisa dinamis
    worksheet.getCell(`H${ttdRowIndex + 4}`).value = "Indra Dwi Ananda";
    
    // Tulis tanggal cetak
    const today = new Date().toLocaleDateString("id-ID");
    worksheet.getCell(`F${ttdRowIndex + 5}`).value = `Tanggal : ${today}`;
    worksheet.getCell(`H${ttdRowIndex + 5}`).value = `Tanggal : ${today}`;

    // 8. Lebarin kolom biar rapi
    worksheet.columns = [
      { width: 5 },  // A
      { width: 5 },  // B (No)
      { width: 25 }, // C (Register)
      { width: 30 }, // D (Nama)
      { width: 15 }, // E (Golongan)
      { width: 10 }, // F (Jumlah)
      { width: 20 }, // G (Tanggal)
      { width: 20 }, // H (Harga)
      { width: 25 }, // I (Cabang)
      { width: 20 }, // J (User)
      { width: 20 }, // K (Lokasi)
    ];

    // 9. Generate file dan kirim ke client
    const buffer = await workbook.xlsx.writeBuffer();
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="REGISTRASI_ASET_${today.replace(/\//g, "")}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });

  } catch (error) {
    console.error("Error generate Excel:", error);
    return NextResponse.json({ error: "Gagal generate Excel" }, { status: 500 });
  }
}