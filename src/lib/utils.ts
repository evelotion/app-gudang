import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Fungsi bawaan UI (jangan dihapus)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Fungsi untuk mengubah tanggal menjadi "01 Januari 2026"
export function formatTanggalIndo(dateInput: Date | string | null | undefined) {
  if (!dateInput) return "-";

  let dateObj: Date;

  // 1. Kalau bentuknya teks "DD/MM/YYYY" 
  if (typeof dateInput === "string" && dateInput.includes("/")) {
    const [day, month, year] = dateInput.split("/");
    dateObj = new Date(`${year}-${month}-${day}`);
  } 
  // 2. Kalau udah bentuk objek Date (dari Prisma)
  else {
    dateObj = new Date(dateInput);
  }

  // Cek apakah tanggalnya valid
  if (isNaN(dateObj.getTime())) return "Tanggal Invalid";

  // Format ke Bahasa Indonesia (pakai month: "long" biar jadi "Januari")
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(dateObj);
}