"use server"

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";

// HAPUS fallback "rahasia_gudang_sync_12345" dan ganti dengan throw error
if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is missing in auth actions!");
}
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export async function loginApp(formData: FormData) {
  const inisial = formData.get("inisial") as string;
  const password = formData.get("password") as string;

  if (!inisial || !password) {
    return { success: false, error: "Inisial dan password wajib diisi!" };
  }

  try {
    const user = await prisma.user.findUnique({ 
      where: { inisial: inisial.toUpperCase().trim() } 
    });
    
    if (!user) return { success: false, error: "Inisial tidak ditemukan!" };

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return { success: false, error: "Password salah!" };

    // 1. Buat Token JWT yang aman
    const token = await new SignJWT({ 
      id: user.id, 
      inisial: user.inisial, 
      nama: user.nama,
      role: user.role 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // expired dalam 7 hari
      .sign(SECRET_KEY);

    const cookieStore = await cookies();
    
    // 2. Simpan token JWT ke cookie
    cookieStore.set("gudang_session", token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      path: "/", 
      maxAge: 60 * 60 * 24 * 7 
    });

    return { success: true, error: undefined };
  } catch (error) {
    return { success: false, error: "Terjadi kesalahan sistem" };
  }
}

export async function logoutApp() {
  const cookieStore = await cookies();
  cookieStore.delete("gudang_session");
  
  redirect("/login");
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("gudang_session")?.value;
  if (!token) return null;
  
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    // PERBAIKAN: Beritahu TypeScript bentuk asli dari payload-nya
    return payload as {
      id: string;
      inisial: string;
      nama: string;
      role: string;
    };
  } catch (error) {
    return null; 
  }
}