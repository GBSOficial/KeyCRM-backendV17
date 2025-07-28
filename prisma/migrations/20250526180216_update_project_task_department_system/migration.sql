-- DropForeignKey
ALTER TABLE "ProjectTask" DROP CONSTRAINT "ProjectTask_assignedToId_fkey";

-- AlterTable
ALTER TABLE "ProjectTask" ADD COLUMN     "estimatedDays" INTEGER,
ADD COLUMN     "order" INTEGER,
ALTER COLUMN "assignedToId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
