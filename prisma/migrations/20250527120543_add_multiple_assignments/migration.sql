-- CreateTable
CREATE TABLE "ProjectTaskAssignment" (
    "id" SERIAL NOT NULL,
    "projectTaskId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectTaskAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTaskAutoAssignment" (
    "id" SERIAL NOT NULL,
    "projectTaskId" INTEGER NOT NULL,
    "department" TEXT NOT NULL,
    "autoAssigned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectTaskAutoAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTaskAssignment_projectTaskId_userId_key" ON "ProjectTaskAssignment"("projectTaskId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTaskAutoAssignment_projectTaskId_department_key" ON "ProjectTaskAutoAssignment"("projectTaskId", "department");

-- AddForeignKey
ALTER TABLE "ProjectTaskAssignment" ADD CONSTRAINT "ProjectTaskAssignment_projectTaskId_fkey" FOREIGN KEY ("projectTaskId") REFERENCES "ProjectTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTaskAssignment" ADD CONSTRAINT "ProjectTaskAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTaskAssignment" ADD CONSTRAINT "ProjectTaskAssignment_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTaskAutoAssignment" ADD CONSTRAINT "ProjectTaskAutoAssignment_projectTaskId_fkey" FOREIGN KEY ("projectTaskId") REFERENCES "ProjectTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
