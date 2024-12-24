-- AlterTable
ALTER TABLE "User" ADD COLUMN     "referrals" TEXT NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "MissingEmails" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "logged_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissingEmails_pkey" PRIMARY KEY ("id")
);
