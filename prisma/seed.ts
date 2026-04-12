import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 1. Setup User Admin
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("admin123", salt);

  await prisma.user.upsert({
    where: { inisial: "ADM" },
    update: {},
    create: {
      inisial: "ADM",
      nama: "Administrator",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // 2. Data Stok Awal Gabungan (TAB & CTK yang Persediaannya > 0)
  const initialStock = [
    // --- KATEGORI TABUNGAN (TAB) ---
    { kode: "IDSS156", nama: "BUKU TAHAPAN BCA SYARIAH", sat: "BUKU", num: "00615100 - 00621000", min: 2500, stok: 200, harga: 2025.75, sup: "PT. WAHANA AJITAMA" },
    { kode: "IDSS157", nama: "TABUNGAN SIMPANAN PELAJAR", sat: "BUKU", num: "00499800 - 00495500", min: 50, stok: 200, harga: 1809.30, sup: "PT. PANTJA SIMPATI" },
    { kode: "IDSS158", nama: "TABUNGAN UMROH", sat: "BUKU", num: "00 00410600 - 00 14500", min: 500, stok: 4400, harga: 1887.00, sup: "PT. MENARA DATA CENT" },
    { kode: "IDSS160", nama: "BUKU TABUNGAN UMROH ANAK", sat: "PAK", num: "00 00416100 - 00 24600", min: 100, stok: 8890, harga: 1887.00, sup: "PT. MENARA DATA CENT" },
    
    // --- KATEGORI CETAKAN (CTK) ---
    { kode: "ATMS705", nama: "LAPORAN KEHILANGAN KARTU ATM", sat: "SET", num: "-", min: 500, stok: 4000, harga: 475.20, sup: "PT. WAHANA AJITAMA" },
    { kode: "IDSS002", nama: "SURAT KUASA", sat: "LEMBAR", num: "-", min: 500, stok: 3400, harga: 222.00, sup: "PT. WAHANA AJITAMA" },
    { kode: "IDSS103", nama: "PERUBAHAN DEPOSITO", sat: "LEMBAR", num: "-", min: 500, stok: 2400, harga: 222.00, sup: "PT. WAHANA AJITAMA" },
    { kode: "IDSS106", nama: "PERMOHONAN PENUTUPAN REKENING", sat: "LEMBAR", num: "-", min: 1000, stok: 5100, harga: 112.11, sup: "PT. WAHANA AJITAMA" },
    { kode: "IDSS113", nama: "SLIP PENARIKAN", sat: "LEMBAR", num: "-", min: 5000, stok: 36250, harga: 72.15, sup: "PT. CHANDRA PRINTING" },
    { kode: "IDSS119", nama: "BUKTI SETORAN SYARIAH", sat: "SET", num: "-", min: 15000, stok: 61750, harga: 177.60, sup: "PT PURA BARUTAMA" },
    { kode: "IDSS174", nama: "BAN UANG Rp. 1.000,-", sat: "LEMBAR", num: "-", min: 5000, stok: 61000, harga: 30.80, sup: "PT. WAHANA AJITAMA" },
    { kode: "IDSS175", nama: "BAN UANG Rp. 5.000,-", sat: "LEMBAR", num: "-", min: 5000, stok: 39000, harga: 30.80, sup: "PT. WAHANA AJITAMA" },
    { kode: "IDSS176", nama: "BAN UANG Rp. 10.000,-", sat: "LEMBAR", num: "-", min: 5000, stok: 29000, harga: 30.80, sup: "PT. WAHANA AJITAMA" },
    { kode: "IDSS177", nama: "BAN UANG Rp. 20.000,-", sat: "LEMBAR", num: "-", min: 5000, stok: 29000, harga: 30.80, sup: "PT. WAHANA AJITAMA" },
    { kode: "IDSS179", nama: "BAN UANG Rp. 100.000,-", sat: "LEMBAR", num: "-", min: 10000, stok: 204000, harga: 36.63, sup: "PT. WAHANA AJITAMA" },
    { kode: "IDSS180", nama: "BAN UANG Rp. 2.000,-", sat: "LEMBAR", num: "-", min: 5000, stok: 63000, harga: 30.80, sup: "PT. WAHANA AJITAMA" },
    { kode: "IDSS202", nama: "NOTA DEBET", sat: "SET", num: "-", min: 5000, stok: 59700, harga: 165.39, sup: "PT. CHANDRA PRINTING" },
    { kode: "IDSS209", nama: "FORMULIR FASILITAS", sat: "LEMBAR", num: "-", min: 1500, stok: 18200, harga: 160.95, sup: "PT. WAHANA AJITAMA" },
    { kode: "IDSS210", nama: "FORM.APLIKASI PEMBUKAAN TAHAPAN", sat: "LEMBAR", num: "-", min: 1000, stok: 18300, harga: 172.05, sup: "PT. WAHANA AJITAMA" },
    { kode: "IDSS211", nama: "KETENTUAN TAHAPAN RENCANA IB", sat: "LEMBAR", num: "-", min: 1000, stok: 20300, harga: 405.15, sup: "PT. WAHANA AJITAMA" },
    { kode: "IDSS928", nama: "BROSUR PEMBUKAAN REKENING ONLI", sat: "LEMBAR", num: "-", min: 100, stok: 58300, harga: 177.60, sup: "-" },
    { kode: "IDSS930", nama: "BROSUR CARDLESS", sat: "LEMBAR", num: "-", min: 300, stok: 16000, harga: 172.05, sup: "PT. SATRIA MEDIA" },
    { kode: "UMMS401", nama: "SLIP PEMBUKUAN DEBET", sat: "LEMBAR", num: "-", min: 10000, stok: 31750, harga: 72.15, sup: "PT. WAHANA AJITAMA" },
    { kode: "UMMS748", nama: "AMPLOP TANPA KACA", sat: "LEMBAR", num: "-", min: 1500, stok: 9500, harga: 555.00, sup: "CV ASTO GRAFIKA UTAM" },
  ];

  for (const item of initialStock) {
    await prisma.barang.upsert({
      where: { kode_barang: item.kode },
      update: { 
        stok: item.stok,
        nomorator: item.num,
        stok_min: item.min,
        harga_satuan: item.harga,
        supplier: item.sup
      },
      create: {
        kode_barang: item.kode,
        nama_barang: item.nama,
        satuan: item.sat,
        nomorator: item.num,
        stok_min: item.min,
        stok: item.stok,
        harga_satuan: item.harga,
        supplier: item.sup
      },
    });
  }

  console.log("✅ Seeding data stok awal (TAB & CTK) BCA Syariah selesai!");
}

main()
  .catch((e) => { 
    console.error(e); 
    process.exit(1); 
  })
  .finally(async () => { 
    await prisma.$disconnect(); 
  });