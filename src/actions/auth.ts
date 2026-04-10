"use server"

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginApp(formData: FormData) {
  const inisial = formData.get("inisial") as string;
  const password = formData.get("password") as string;

  try {
    // Tambahan .trim() biar aman dari typo spasi
    const user = await prisma.user.findUnique({ 
      where: { inisial: inisial.toUpperCase().trim() } 
    });
    
    if (!user) return { success: false, error: "Inisial tidak ditemukan!" };

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return { success: false, error: "Password salah!" };

    const cookieStore = await cookies();
    
    cookieStore.set("gudang_session", JSON.stringify({ id: user.id, inisial: user.inisial, nama: user.nama }), { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      path: "/", 
      maxAge: 60 * 60 * 24 * 7 
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Terjadi kesalahan sistem" };
  }
}

export async function logoutApp() {
  const cookieStore = await cookies();
  cookieStore.delete("gudang_session");
  
  redirect("/login");
}