"use server"

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";

// Pindahkan pengecekan ke dalam fungsi biar nggak crash saat proses "next build"
function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("FATAL: JWT_SECRET environment variable is missing!");
  }
  return new TextEncoder().encode(secret);
}

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

    // Panggil getSecretKey() di sini
    const token = await new SignJWT({ 
      id: user.id, 
      inisial: user.inisial, 
      nama: user.nama,
      role: user.role 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') 
      .sign(getSecretKey());

    const cookieStore = await cookies();
    
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
    // Panggil getSecretKey() di sini
    const { payload } = await jwtVerify(token, getSecretKey());
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