/*
  Warnings:

  - You are about to drop the column `userid_fk` on the `Otp_Tokens` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Otp_Tokens" DROP CONSTRAINT "Otp_Tokens_userid_fk_fkey";

-- DropIndex
DROP INDEX "Otp_Tokens_userid_fk_idx";

-- AlterTable
ALTER TABLE "Otp_Tokens" DROP COLUMN "userid_fk";
