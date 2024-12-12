/*
  Warnings:

  - You are about to drop the column `submission` on the `Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "submission";

-- CreateTable
CREATE TABLE "Submission" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "userEmail" TEXT NOT NULL,
    "submission" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Submission_userEmail_key" ON "Submission"("userEmail");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
