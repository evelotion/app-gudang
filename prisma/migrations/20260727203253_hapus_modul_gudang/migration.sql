-- DropForeignKey
ALTER TABLE "Barang" DROP CONSTRAINT "Barang_kategoriId_fkey";

-- DropForeignKey
ALTER TABLE "InboundDetail" DROP CONSTRAINT "InboundDetail_barangId_fkey";

-- DropForeignKey
ALTER TABLE "InboundDetail" DROP CONSTRAINT "InboundDetail_inboundHeaderId_fkey";

-- DropForeignKey
ALTER TABLE "RequisitionDetail" DROP CONSTRAINT "RequisitionDetail_barangId_fkey";

-- DropForeignKey
ALTER TABLE "RequisitionDetail" DROP CONSTRAINT "RequisitionDetail_requisitionHeaderId_fkey";

-- DropTable
DROP TABLE "Barang";

-- DropTable
DROP TABLE "InboundDetail";

-- DropTable
DROP TABLE "InboundHeader";

-- DropTable
DROP TABLE "Kategori";

-- DropTable
DROP TABLE "RequisitionDetail";

-- DropTable
DROP TABLE "RequisitionHeader";

