// src/lib/exportJournal.ts
import ExcelJS from 'exceljs';
import { COA_MAP, GOLONGAN_JURNAL_MAP, getCabangInfo } from './mappings';

/**
 * Fungsi untuk meng-export data mutasi aset ke format Jurnal Excel Massal.
 */
export const exportMutasiToJournal = async (dataMutasiAktif: any[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('data');

  // ==========================================
  // 1. MEMBUAT HEADER JURNAL MASSAL
  // ==========================================
  worksheet.addRow(['TRANSAKSI UMUM MASSAL']); 
  
  worksheet.addRow([
    'Keterangan Input Transaksi Massal:\n' +
    'A. No : Nomor urut\n' +
    'B. Tx Code : [000, 002, 110, 004] --> 000 = GL , 002 = Rekening liabilitas, 110 = Financing, 004 = Rekening transaksi (umum)\n' +
    'C. Nomor Rekening : Diinputkan dengan Nomor Rekening Tabungan/Giro atau Nomor GL(Dengan Format yang telah ditentukan)\n' +
    'D. Jenis Mutasi  :  D/C\n' +
    'E. Nilai Mutasi\n' +
    'F. Kode kurs --> [BOOKING, TT_BELI, TT_JUAL, BN_JUAL, BN_BELI] , untuk transaksi IDR menggunakan kode BOOKING saja\n' +
    'G. Nilai Kurs\n' +
    'H. Kode RC\n' +
    'I. Keterangan\n' +
    'J. Kode tx class (diisi dengan sub jenis mutasi, untuk tx code 110)\n' +
    'K. Override account (kode account override), berlaku untuk tx code 002, 110 dan 004\n' +
    'L. Override cabang (kode cabang override), berlaku  untuk tx code 002, 110 dan 004'
  ]);
  worksheet.getRow(2).height = 190;
  worksheet.getCell('A2').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };

  worksheet.addRow([
    'No', 'Tx Code', 'Nomor Rekening', 'Jenis Mutasi', 'Nilai Mutasi', 
    'Kode_Kurs', 'Nilai_Kurs', 'Kode_RC', 'Keterangan'
  ]);

  // ==========================================
  // 2. LOGIC GROUPING / REKAPITULASI DATA
  // ==========================================
  const groupedData: Record<string, {
    golonganJurnal: string;
    lokasiAwal: string;
    lokasiTujuan: string;
    totalHarga: number;
    totalAkm: number;
  }> = {};

  dataMutasiAktif.forEach((item) => {
    const golonganAset = (item.Golongan || item.golonganAset || item.golongan || "").trim();
    const lokasiAwal = item['Lokasi Awal'] || item.lokasiAwal;
    const lokasiTujuan = item['Lokasi Tujuan'] || item.lokasiTujuan;
    const hargaPerolehan = Number(item['Harga Perolehan'] || item.hargaPerolehan) || 0;
    const akmPenyusutan = Number(item['Akm. Penyusutan'] || item.akmPenyusutan) || 0;

    // RULE 1: Skip Aset Non-Inventaris (Tidak di Jurnal)
    if (!golonganAset || golonganAset.toLowerCase().includes('non-inventaris') || golonganAset.toLowerCase().includes('non inventaris')) return;

    // RULE 2: Konversi Golongan Aplikasi menjadi Golongan Jurnal
    const golonganJurnal = GOLONGAN_JURNAL_MAP[golonganAset] || golonganAset; 
    const groupKey = `${golonganJurnal}|${lokasiAwal}|${lokasiTujuan}`;

    if (!groupedData[groupKey]) {
      groupedData[groupKey] = {
        golonganJurnal,
        lokasiAwal,
        lokasiTujuan,
        totalHarga: 0,
        totalAkm: 0
      };
    }

    groupedData[groupKey].totalHarga += hargaPerolehan;
    groupedData[groupKey].totalAkm += akmPenyusutan;
  });

  // ==========================================
  // 3. GENERATE BARIS JURNAL (DEBET/KREDIT)
  // ==========================================
  let rowCounter = 1;

  Object.values(groupedData).forEach((group) => {
    const mapGL = COA_MAP[group.golonganJurnal];
    if (!mapGL) {
      console.warn(`[WARNING] Kode GL untuk golongan jurnal "${group.golonganJurnal}" belum terdaftar di mappings.ts`);
      return; 
    }

    const infoAsal = getCabangInfo(group.lokasiAwal);
    const infoTujuan = getCabangInfo(group.lokasiTujuan);

    const ketHarga = `Mutasi Aset ${group.golonganJurnal} dari KC ${infoAsal.abbr} ke ${infoTujuan.abbr} (LOG)`.replace('KC KP', 'KP');
    const ketAkm = `Mutasi Peny. Aset ${group.golonganJurnal} dari KC ${infoAsal.abbr} ke ${infoTujuan.abbr} (LOG)`.replace('KC KP', 'KP');

    // Baris 1: Debet Harga Perolehan (Tujuan)
    worksheet.addRow([rowCounter++, '000', `${mapGL.aset}-${infoTujuan.code}-IDR`, 'D', group.totalHarga, 'BOOKING', 1, '', ketHarga]);
    // Baris 2: Kredit Harga Perolehan (Asal)
    worksheet.addRow([rowCounter++, '000', `${mapGL.aset}-${infoAsal.code}-IDR`, 'C', group.totalHarga, 'BOOKING', 1, '', ketHarga]);
    // Baris 3: Debet Akumulasi Penyusutan (Asal)
    worksheet.addRow([rowCounter++, '000', `${mapGL.akm}-${infoAsal.code}-IDR`, 'D', group.totalAkm, 'BOOKING', 1, '', ketAkm]);
    // Baris 4: Kredit Akumulasi Penyusutan (Tujuan)
    worksheet.addRow([rowCounter++, '000', `${mapGL.akm}-${infoTujuan.code}-IDR`, 'C', group.totalAkm, 'BOOKING', 1, '', ketAkm]);
  });

  // ==========================================
  // 4. MEMBUAT TABEL TANDA TANGAN & KETERANGAN
  // ==========================================
  let totalAktiva = 0;
  let totalPenyusutan = 0;
  const usedCOAs: { gl: string, name: string }[] = [];
  
  // Hitung grand total dan kumpulkan COA yang terpakai
  Object.values(groupedData).forEach((group) => {
    totalAktiva += group.totalHarga;
    totalPenyusutan += group.totalAkm;
    
    const mapGL = COA_MAP[group.golonganJurnal];
    if (mapGL) {
      if (!usedCOAs.find(c => c.gl === mapGL.aset)) {
        usedCOAs.push({ gl: mapGL.aset, name: group.golonganJurnal });
        usedCOAs.push({ gl: mapGL.akm, name: `Akm Peny -  ${group.golonganJurnal}` });
      }
    }
  });

  // Cari baris terakhir, beri jarak 2 baris
  const startFooterRow = worksheet.lastRow ? worksheet.lastRow.number + 2 : rowCounter + 4;
  
  // Header Kolom TTD & Keterangan
  worksheet.getCell(`C${startFooterRow}`).value = 'Dibuat';
  worksheet.getCell(`D${startFooterRow}`).value = 'Mengetahui';
  worksheet.getCell(`E${startFooterRow}`).value = 'Menyetujui';
  worksheet.getCell(`H${startFooterRow}`).value = 'KETERANGAN';
  worksheet.getRow(startFooterRow).font = { bold: true };
  
  // Rekapitulasi Total (Sebelah Kanan)
  worksheet.getCell(`H${startFooterRow + 1}`).value = 'Total Aktiva';
  worksheet.getCell(`I${startFooterRow + 1}`).value = totalAktiva;
  
  worksheet.getCell(`H${startFooterRow + 2}`).value = 'Total Peny.';
  worksheet.getCell(`I${startFooterRow + 2}`).value = totalPenyusutan;
  
  worksheet.getCell(`H${startFooterRow + 3}`).value = 'Total';
  worksheet.getCell(`I${startFooterRow + 3}`).value = totalAktiva + totalPenyusutan;
  worksheet.getCell(`I${startFooterRow + 3}`).font = { bold: true };

  // Set Number Format pakai ribuan biasa
  worksheet.getCell(`I${startFooterRow + 1}`).numFmt = '#,##0';
  worksheet.getCell(`I${startFooterRow + 2}`).numFmt = '#,##0';
  worksheet.getCell(`I${startFooterRow + 3}`).numFmt = '#,##0';

  // Daftar Nama TTD (Sebelah Kiri)
  const operator = dataMutasiAktif[0]?.operatorName || "Indra Dwi Ananda";
  worksheet.getCell(`C${startFooterRow + 4}`).value = operator;
  worksheet.getCell(`D${startFooterRow + 4}`).value = 'Kamirina';
  worksheet.getCell(`E${startFooterRow + 4}`).value = 'Andreanne B Christie';

  // Cetak List COA di bawah Grand Total
  let coaRow = startFooterRow + 4;
  usedCOAs.forEach((coa) => {
    worksheet.getCell(`H${coaRow}`).value = coa.gl;
    worksheet.getCell(`I${coaRow}`).value = coa.name;
    coaRow++;
  });

  // ==========================================
  // 5. STYLING LEBAR KOLOM
  // ==========================================
  worksheet.columns = [
    { width: 5 },  // A: No
    { width: 10 }, // B: Tx Code
    { width: 22 }, // C: Nomor Rekening
    { width: 12 }, // D: Jenis Mutasi
    { width: 15 }, // E: Nilai Mutasi
    { width: 12 }, // F: Kode_Kurs
    { width: 10 }, // G: Nilai_Kurs
    { width: 10 }, // H: Kode_RC
    { width: 70 }  // I: Keterangan
  ];

  // ==========================================
  // 6. TRIGGER DOWNLOAD FILE EXCEL
  // ==========================================
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `Jurnal_Mutasi_Massal_${dateStr}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};