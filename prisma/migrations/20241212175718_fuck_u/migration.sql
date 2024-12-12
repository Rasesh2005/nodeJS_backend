/*
  Warnings:

  - A unique constraint covering the columns `[userEmail,taskId]` on the table `Submission` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Submission_userEmail_taskId_key" ON "Submission"("userEmail", "taskId");
