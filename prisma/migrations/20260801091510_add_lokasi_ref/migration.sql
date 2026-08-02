-- CreateEnum
CREATE TYPE "LokasiTipe" AS ENUM ('CABANG', 'KANTOR_PUSAT', 'WISMA');

-- CreateTable
CREATE TABLE "LokasiRef" (
    "id" TEXT NOT NULL,
    "raw" TEXT NOT NULL,
    "kodeCabang" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "initial" TEXT NOT NULL,
    "tipe" "LokasiTipe" NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LokasiRef_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LokasiRef_raw_key" ON "LokasiRef"("raw");
