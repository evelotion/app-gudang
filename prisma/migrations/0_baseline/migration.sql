-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "inisial" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kategori" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,

    CONSTRAINT "Kategori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Barang" (
    "id" TEXT NOT NULL,
    "kode_barang" TEXT NOT NULL,
    "nama_barang" TEXT NOT NULL,
    "satuan" TEXT NOT NULL,
    "stok" INTEGER NOT NULL DEFAULT 0,
    "nomorator" TEXT,
    "stok_min" INTEGER NOT NULL DEFAULT 0,
    "harga_satuan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "supplier" TEXT,
    "kategoriId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Barang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequisitionHeader" (
    "id" TEXT NOT NULL,
    "media_request" TEXT NOT NULL,
    "no_dokumen" TEXT NOT NULL,
    "tanggal_dokumen" TIMESTAMP(3) NOT NULL,
    "cabang" TEXT NOT NULL,
    "tanggal_request" TIMESTAMP(3) NOT NULL,
    "jenis_permintaan" TEXT NOT NULL,
    "pic_nama" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PACKING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequisitionHeader_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequisitionDetail" (
    "id" TEXT NOT NULL,
    "requisitionHeaderId" TEXT NOT NULL,
    "barangId" TEXT NOT NULL,
    "qty_diambil" INTEGER NOT NULL,

    CONSTRAINT "RequisitionDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboundHeader" (
    "id" TEXT NOT NULL,
    "no_dokumen" TEXT NOT NULL,
    "tanggal_masuk" TIMESTAMP(3) NOT NULL,
    "supplier" TEXT NOT NULL,
    "penerima" TEXT NOT NULL,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboundHeader_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboundDetail" (
    "id" TEXT NOT NULL,
    "inboundHeaderId" TEXT NOT NULL,
    "barangId" TEXT NOT NULL,
    "qty_masuk" INTEGER NOT NULL,

    CONSTRAINT "InboundDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrasiAset" (
    "id" TEXT NOT NULL,
    "tanggalInput" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nomorRegisterAset" TEXT NOT NULL,
    "namaAset" TEXT NOT NULL,
    "golonganAset" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "tanggalPerolehan" TIMESTAMP(3) NOT NULL,
    "hargaPerolehan" DECIMAL(15,2) NOT NULL,
    "cabangUnitKerja" TEXT NOT NULL,
    "userPengguna" TEXT NOT NULL,
    "lokasiPosisiAset" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "inputerName" TEXT NOT NULL,
    "supervisorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrasiAset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HapusBukuAset" (
    "id" TEXT NOT NULL,
    "tanggalInput" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggalHapusBuku" TIMESTAMP(3) NOT NULL,
    "nomorRegisterAset" TEXT NOT NULL,
    "namaAset" TEXT NOT NULL,
    "golonganAset" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "tanggalPerolehan" TIMESTAMP(3) NOT NULL,
    "hargaPerolehan" DECIMAL(15,2) NOT NULL,
    "akmPenyusutan" DECIMAL(15,2) NOT NULL,
    "nilaiBuku" DECIMAL(15,2) NOT NULL,
    "cabangUnitKerja" TEXT NOT NULL,
    "alasanHapusBuku" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "operatorName" TEXT NOT NULL,
    "supervisorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HapusBukuAset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MutasiAset" (
    "id" TEXT NOT NULL,
    "tanggalInput" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggalMutasi" TIMESTAMP(3) NOT NULL,
    "nomorRegisterAset" TEXT NOT NULL,
    "namaAset" TEXT NOT NULL,
    "golonganAset" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "tanggalPerolehan" TIMESTAMP(3) NOT NULL,
    "hargaPerolehan" DECIMAL(15,2) NOT NULL,
    "akmPenyusutan" DECIMAL(15,2) NOT NULL,
    "lokasiAwal" TEXT NOT NULL,
    "lokasiTujuan" TEXT NOT NULL,
    "alasanMutasi" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "operatorName" TEXT NOT NULL,
    "supervisorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MutasiAset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_inisial_key" ON "User"("inisial");

-- CreateIndex
CREATE UNIQUE INDEX "Kategori_nama_key" ON "Kategori"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "Barang_kode_barang_key" ON "Barang"("kode_barang");

-- CreateIndex
CREATE UNIQUE INDEX "RequisitionHeader_no_dokumen_key" ON "RequisitionHeader"("no_dokumen");

-- CreateIndex
CREATE UNIQUE INDEX "InboundHeader_no_dokumen_key" ON "InboundHeader"("no_dokumen");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrasiAset_nomorRegisterAset_key" ON "RegistrasiAset"("nomorRegisterAset");

-- AddForeignKey
ALTER TABLE "Barang" ADD CONSTRAINT "Barang_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "Kategori"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisitionDetail" ADD CONSTRAINT "RequisitionDetail_requisitionHeaderId_fkey" FOREIGN KEY ("requisitionHeaderId") REFERENCES "RequisitionHeader"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisitionDetail" ADD CONSTRAINT "RequisitionDetail_barangId_fkey" FOREIGN KEY ("barangId") REFERENCES "Barang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundDetail" ADD CONSTRAINT "InboundDetail_inboundHeaderId_fkey" FOREIGN KEY ("inboundHeaderId") REFERENCES "InboundHeader"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundDetail" ADD CONSTRAINT "InboundDetail_barangId_fkey" FOREIGN KEY ("barangId") REFERENCES "Barang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

