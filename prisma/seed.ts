import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ==========================================
  // 1. INJECT DATA KATEGORI
  // ==========================================
  const katAset = await prisma.kategori.upsert({
    where: { nama: 'Aset IT / Non-IT' }, update: {}, create: { nama: 'Aset IT / Non-IT', deskripsi: 'Aset fisik kantor' },
  })
  const katCetakan = await prisma.kategori.upsert({
    where: { nama: 'Cetakan' }, update: {}, create: { nama: 'Cetakan', deskripsi: 'Formulir, Buku, Slip' },
  })
  const katATK = await prisma.kategori.upsert({
    where: { nama: 'ATK' }, update: {}, create: { nama: 'ATK', deskripsi: 'Alat Tulis Kantor' },
  })
  console.log('⏳ Data Kategori berhasil di-inject...')

  // ==========================================
  // 2. INJECT DATA USER (Password: password123)
  // ==========================================
  const defaultPassword = await bcrypt.hash('password123', 10);
  const users = [
    { inisial: 'IND', nama: 'Indra Dwi Ananda', role: 'ADMIN' }, // Lo jadi Admin
    { inisial: 'NOV', nama: 'Novianti Siswandi', role: 'STAF' },
    { inisial: 'IBL', nama: 'Ikbal Kurnia', role: 'STAF' },
    { inisial: 'MLK', nama: 'Malik Alfazari', role: 'STAF' },
    { inisial: 'ADM', nama: 'Administrator Default', role: 'ADMIN' }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { inisial: u.inisial },
      update: { role: u.role, password: defaultPassword }, 
      create: { inisial: u.inisial, nama: u.nama, password: defaultPassword, role: u.role }
    });
  }
  console.log('⏳ Data User berhasil di-inject...')

  // ==========================================
  // 3. INJECT DATA BARANG (Full BCA Syariah + Custom)
  // ==========================================
  const initialStock = [
    // --- KATEGORI TABUNGAN (TAB) & CETAKAN (Masuk ke ID Kategori Cetakan) ---
    { kode: "IDSS156", nama: "BUKU TAHAPAN BCA SYARIAH", sat: "BUKU", num: "00615100 - 00621000", min: 2500, stok: 200, harga: 2025.75, sup: "PT. WAHANA AJITAMA", katId: katCetakan.id },
    { kode: "IDSS157", nama: "TABUNGAN SIMPANAN PELAJAR", sat: "BUKU", num: "00499800 - 00495500", min: 50, stok: 200, harga: 1809.30, sup: "PT. PANTJA SIMPATI", katId: katCetakan.id },
    { kode: "IDSS158", nama: "TABUNGAN UMROH", sat: "BUKU", num: "00 00410600 - 00 14500", min: 500, stok: 4400, harga: 1887.00, sup: "PT. MENARA DATA CENT", katId: katCetakan.id },
    { kode: "IDSS160", nama: "BUKU TABUNGAN UMROH ANAK", sat: "PAK", num: "00 00416100 - 00 24600", min: 100, stok: 8890, harga: 1887.00, sup: "PT. MENARA DATA CENT", katId: katCetakan.id },
    { kode: "ATMS705", nama: "LAPORAN KEHILANGAN KARTU ATM", sat: "SET", num: "-", min: 500, stok: 4000, harga: 475.20, sup: "PT. WAHANA AJITAMA", katId: katCetakan.id },
    { kode: "IDSS002", nama: "SURAT KUASA", sat: "LEMBAR", num: "-", min: 500, stok: 3400, harga: 222.00, sup: "PT. WAHANA AJITAMA", katId: katCetakan.id },
    { kode: "IDSS103", nama: "PERUBAHAN DEPOSITO", sat: "LEMBAR", num: "-", min: 500, stok: 2400, harga: 222.00, sup: "PT. WAHANA AJITAMA", katId: katCetakan.id },
    { kode: "IDSS106", nama: "PERMOHONAN PENUTUPAN REKENING", sat: "LEMBAR", num: "-", min: 1000, stok: 5100, harga: 112.11, sup: "PT. WAHANA AJITAMA", katId: katCetakan.id },
    { kode: "IDSS113", nama: "SLIP PENARIKAN", sat: "LEMBAR", num: "-", min: 5000, stok: 36250, harga: 72.15, sup: "PT. CHANDRA PRINTING", katId: katCetakan.id },
    { kode: "IDSS119", nama: "BUKTI SETORAN SYARIAH", sat: "SET", num: "-", min: 15000, stok: 61750, harga: 177.60, sup: "PT PURA BARUTAMA", katId: katCetakan.id },
    { kode: "IDSS174", nama: "BAN UANG Rp. 1.000,-", sat: "LEMBAR", num: "-", min: 5000, stok: 61000, harga: 30.80, sup: "PT. WAHANA AJITAMA", katId: katCetakan.id },
    { kode: "IDSS175", nama: "BAN UANG Rp. 5.000,-", sat: "LEMBAR", num: "-", min: 5000, stok: 39000, harga: 30.80, sup: "PT. WAHANA AJITAMA", katId: katCetakan.id },
    { kode: "IDSS176", nama: "BAN UANG Rp. 10.000,-", sat: "LEMBAR", num: "-", min: 5000, stok: 29000, harga: 30.80, sup: "PT. WAHANA AJITAMA", katId: katCetakan.id },
    { kode: "IDSS177", nama: "BAN UANG Rp. 20.000,-", sat: "LEMBAR", num: "-", min: 5000, stok: 29000, harga: 30.80, sup: "PT. WAHANA AJITAMA", katId: katCetakan.id },
    { kode: "IDSS179", nama: "BAN UANG Rp. 100.000,-", sat: "LEMBAR", num: "-", min: 10000, stok: 204000, harga: 36.63, sup: "PT. WAHANA AJITAMA", katId: katCetakan.id },
    { kode: "IDSS180", nama: "BAN UANG Rp. 2.000,-", sat: "LEMBAR", num: "-", min: 5000, stok: 63000, harga: 30.80, sup: "PT. WAHANA AJITAMA", katId: katCetakan.id },
    { kode: "IDSS202", nama: "NOTA DEBET", sat: "SET", num: "-", min: 5000, stok: 59700, harga: 165.39, sup: "PT. CHANDRA PRINTING", katId: katCetakan.id },
    { kode: "IDSS209", nama: "FORMULIR FASILITAS", sat: "LEMBAR", num: "-", min: 1500, stok: 18200, harga: 160.95, sup: "PT. WAHANA AJITAMA", katId: katCetakan.id },
    { kode: "IDSS210", nama: "FORM.APLIKASI PEMBUKAAN TAHAPAN", sat: "LEMBAR", num: "-", min: 1000, stok: 18300, harga: 172.05, sup: "PT. WAHANA AJITAMA", katId: katCetakan.id },
    { kode: "IDSS211", nama: "KETENTUAN TAHAPAN RENCANA IB", sat: "LEMBAR", num: "-", min: 1000, stok: 20300, harga: 405.15, sup: "PT. WAHANA AJITAMA", katId: katCetakan.id },
    { kode: "IDSS928", nama: "BROSUR PEMBUKAAN REKENING ONLI", sat: "LEMBAR", num: "-", min: 100, stok: 58300, harga: 177.60, sup: "-", katId: katCetakan.id },
    { kode: "IDSS930", nama: "BROSUR CARDLESS", sat: "LEMBAR", num: "-", min: 300, stok: 16000, harga: 172.05, sup: "PT. SATRIA MEDIA", katId: katCetakan.id },
    { kode: "UMMS401", nama: "SLIP PEMBUKUAN DEBET", sat: "LEMBAR", num: "-", min: 10000, stok: 31750, harga: 72.15, sup: "PT. WAHANA AJITAMA", katId: katCetakan.id },
    { kode: "UMMS748", nama: "AMPLOP TANPA KACA", sat: "LEMBAR", num: "-", min: 1500, stok: 9500, harga: 555.00, sup: "CV ASTO GRAFIKA UTAM", katId: katCetakan.id },
    
    // --- Data Custom ---
    { kode: "INV-IT-001", nama: "PC Desktop Teller", sat: "Unit", num: "-", min: 5, stok: 15, harga: 8500000, sup: "PT. LINTAS DATA", katId: katAset.id },
    { kode: "CTK-001", nama: "Buku Tabungan Wadiah", sat: "Buku", num: "00001 - 00500", min: 100, stok: 500, harga: 1500, sup: "PT. WAHANA AJITAMA", katId: katCetakan.id },
    { kode: "ATK-001", nama: "Kertas A4 80gr", sat: "Rim", num: "-", min: 10, stok: 50, harga: 45000, sup: "PT. ATK JAYA", katId: katATK.id }
  ];

  for (const item of initialStock) {
    await prisma.barang.upsert({
      where: { kode_barang: item.kode },
      update: { 
        stok: item.stok,
        nomorator: item.num,
        stok_min: item.min,
        harga_satuan: item.harga,
        supplier: item.sup,
        kategoriId: item.katId
      },
      create: {
        kode_barang: item.kode,
        nama_barang: item.nama,
        satuan: item.sat,
        nomorator: item.num,
        stok_min: item.min,
        stok: item.stok,
        harga_satuan: item.harga,
        supplier: item.sup,
        kategoriId: item.katId
      },
    });
  }
  console.log('⏳ Data Barang (TAB & CTK + Custom) berhasil di-inject...')

  console.log('✅ SEEDING KOMPLIT: User, Kategori, & Barang siap digunakan bro!')
}

main()
  .catch((e) => { 
    console.error(e); 
    process.exit(1); 
  })
  .finally(async () => { 
    await prisma.$disconnect(); 
  });