import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner"; // Tambahan import Sonner

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Update metadata biar sesuai sama aplikasi Gudang lo
export const metadata: Metadata = {
  title: "GudangSync | Manajemen Gudang",
  description: "Aplikasi manajemen stok dan inventaris gudang internal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id" // Ganti dari "en" ke "id"
      className={cn(
        "h-full", 
        "antialiased", 
        geistSans.variable, 
        geistMono.variable, 
        "font-sans", 
        inter.variable
      )}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* Pasang Toaster di sini biar bisa diakses global */}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}