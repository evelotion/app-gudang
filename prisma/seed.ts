import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 1. Buat User default (Admin & Staf)
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

  // 2. Import Data dari PRN BCA Syariah (Hanya yang punya persediaan/stok)
  const initialStock = [
    { 
      kode: "IDSS156", 
      nama: "BUKU TAHAPAN BCA SYARIAH", 
      sat: "BUKU", 
      num: "00615100 - 00621000", 
      min: 2500, 
      stok: 200, 
      harga: 2025.75, 
      sup: "PT. WAHANA AJITAMA" // [cite: 560, 561]
    },
    { 
      kode: "IDSS157", 
      nama: "TABUNGAN SIMPANAN PELAJAR", 
      sat: "BUKU", 
      num: "00499800 - 00495500", 
      min: 50, 
      stok: 200, 
      harga: 1809.30, 
      sup: "PT. PANTJA SIMPATI" // [cite: 565, 566]
    },
    { 
      kode: "IDSS158", 
      nama: "TABUNGAN UMROH", 
      sat: "BUKU", 
      num: "00 00410600 - 00 14500", 
      min: 500, 
      stok: 4400, 
      harga: 1887.00, 
      sup: "PT. MENARA DATA CENT" // [cite: 570, 571]
    },
    { 
      kode: "IDSS160", 
      nama: "BUKU TABUNGAN UMROH ANAK", 
      sat: "PAK", 
      num: "00 00416100 - 00 24600", 
      min: 100, 
      stok: 8890, 
      harga: 1887.00, 
      sup: "PT. MENARA DATA CENT" // [cite: 574, 575]
    },
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

  console.log("✅ Seeding data stok awal BCA Syariah selesai!");
}

main()
  .catch((e) => { 
    console.error(e); 
    process.exit(1); 
  })
  .finally(async () => { 
    await prisma.$disconnect(); 
  });