import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Mulai inject data awal ke Neon DB...')

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
    { inisial: 'MLK', nama: 'Malik Alfazari', role: 'STAF' }
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
  // 3. INJECT DATA BARANG (Ditambahin kategoriId)
  // ==========================================
  const initialStock = [
    // --- Data Bank BCA Syariah (Masuk kategori Cetakan) ---
    { kode: "IDSS156", nama: "BUKU TAHAPAN BCA SYARIAH", sat: "BUKU", num: "00615100 - 00621000", min: 2500, stok: 200, harga: 2025.75, sup: "PT. WAHANA AJITAMA", katId: katCetakan.id },
    { kode: "IDSS157", nama: "TABUNGAN SIMPANAN PELAJAR", sat: "BUKU", num: "00499800 - 00495500", min: 50, stok: 200, harga: 1809.30, sup: "PT. PANTJA SIMPATI", katId: katCetakan.id },
    { kode: "IDSS158", nama: "TABUNGAN UMROH", sat: "BUKU", num: "00 00410600 - 00 14500", min: 500, stok: 4400, harga: 1887.00, sup: "PT. MENARA DATA CENT", katId: katCetakan.id },
    { kode: "IDSS160", nama: "BUKU TABUNGAN UMROH ANAK", sat: "PAK", num: "00 00416100 - 00 24600", min: 100, stok: 8890, harga: 1887.00, sup: "PT. MENARA DATA CENT", katId: katCetakan.id },
    
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
        kategoriId: item.katId // <--- Update Kategori
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
        kategoriId: item.katId // <--- Wajib Kategori
      },
    });
  }
  console.log('⏳ Data Barang berhasil di-inject...')

  console.log('✅ SEEDING KOMPLIT: User, Kategori, & Barang siap digunakan bro!')
}

main()
  .catch((e) => { 
    console.error(e); 
    process.exit(1); 
  })
  .finally(async () => { 
    await prisma.$disconnect(); 
  })