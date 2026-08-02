-- CreateTable
CREATE TABLE "Lokasi" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "kodeCabang" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "initial" TEXT NOT NULL,
    "tipe" "LokasiTipe" NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lokasi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lokasi_kode_key" ON "Lokasi"("kode");
