import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Mulai inject data awal ke Neon DB...')

  // 1. Inject Data Kategori & Barang (Seperti sebelumnya)
  const katAset = await prisma.kategori.upsert({
    where: { nama: 'Aset IT / Non-IT' }, update: {}, create: { nama: 'Aset IT / Non-IT', deskripsi: 'Aset fisik kantor' },
  })
  const katCetakan = await prisma.kategori.upsert({
    where: { nama: 'Cetakan' }, update: {}, create: { nama: 'Cetakan', deskripsi: 'Formulir, Buku, Slip' },
  })
  const katATK = await prisma.kategori.upsert({
    where: { nama: 'ATK' }, update: {}, create: { nama: 'ATK', deskripsi: 'Alat Tulis Kantor' },
  })

  await prisma.barang.upsert({
    where: { kode_barang: 'INV-IT-001' }, update: {}, create: { kode_barang: 'INV-IT-001', nama_barang: 'PC Desktop Teller', satuan: 'Unit', stok: 15, kategoriId: katAset.id },
  })
  await prisma.barang.upsert({
    where: { kode_barang: 'CTK-001' }, update: {}, create: { kode_barang: 'CTK-001', nama_barang: 'Buku Tabungan Wadiah', satuan: 'Buku', stok: 500, kategoriId: katCetakan.id },
  })
  await prisma.barang.upsert({
    where: { kode_barang: 'ATK-001' }, update: {}, create: { kode_barang: 'ATK-001', nama_barang: 'Kertas A4 80gr', satuan: 'Rim', stok: 50, kategoriId: katATK.id },
  })

  // 2. Inject Data User (Password default: password123)
  const defaultPassword = await bcrypt.hash('password123', 10);
  const users = [
    { inisial: 'IND', nama: 'Indra Dwi Ananda' },
    { inisial: 'NOV', nama: 'Novianti Siswandi' },
    { inisial: 'IBL', nama: 'Ikbal Kurnia' },
    { inisial: 'MLK', nama: 'Malik Alfazari' }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { inisial: u.inisial },
      update: {},
      create: { inisial: u.inisial, nama: u.nama, password: defaultPassword }
    });
  }

  console.log('✅ Seeding data Kategori, Barang, dan User sukses bro!')
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); })