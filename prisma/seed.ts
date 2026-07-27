import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ==========================================
  // INJECT DATA USER (Password: password123)
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

  console.log('✅ SEEDING KOMPLIT: User siap digunakan!')
}

main()
  .catch((e) => { 
    console.error(e); 
    process.exit(1); 
  })
  .finally(async () => { 
    await prisma.$disconnect(); 
  });