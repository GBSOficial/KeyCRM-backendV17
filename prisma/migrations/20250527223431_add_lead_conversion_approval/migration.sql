-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" INTEGER,
ADD COLUMN     "approvedForConversion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "convertedToClient" BOOLEAN NOT NULL DEFAULT false;
