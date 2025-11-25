/*
  Warnings:

  - The primary key for the `User_device` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `internal_id` on the `User_device` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Otp_Tokens" DROP CONSTRAINT "Otp_Tokens_devicefingerprint_fkey";

-- DropForeignKey
ALTER TABLE "User_Device_UserId" DROP CONSTRAINT "User_Device_UserId_deviceid_fk_fkey";

-- DropForeignKey
ALTER TABLE "users_audit" DROP CONSTRAINT "users_audit_device_fingerprint_fkey";

-- DropForeignKey
ALTER TABLE "RefreshTokens" DROP CONSTRAINT "RefreshTokens_device_fingerprint_fkey";

-- DropIndex
DROP INDEX "User_device_fingerprint_idx";

-- DropIndex
DROP INDEX "User_device_fingerprint_key";

-- AlterTable
ALTER TABLE "Otp_Tokens" ALTER COLUMN "devicefingerprint" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User_Device_UserId" ALTER COLUMN "deviceid_fk" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User_device" DROP CONSTRAINT "User_device_pkey",
DROP COLUMN "internal_id",
ADD CONSTRAINT "User_device_pkey" PRIMARY KEY ("fingerprint");

-- AddForeignKey
ALTER TABLE "Otp_Tokens" ADD CONSTRAINT "Otp_Tokens_devicefingerprint_fkey" FOREIGN KEY ("devicefingerprint") REFERENCES "User_device"("fingerprint") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Device_UserId" ADD CONSTRAINT "User_Device_UserId_deviceid_fk_fkey" FOREIGN KEY ("deviceid_fk") REFERENCES "User_device"("fingerprint") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_audit" ADD CONSTRAINT "users_audit_device_fingerprint_fkey" FOREIGN KEY ("device_fingerprint") REFERENCES "User_device"("fingerprint") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshTokens" ADD CONSTRAINT "RefreshTokens_device_fingerprint_fkey" FOREIGN KEY ("device_fingerprint") REFERENCES "User_device"("fingerprint") ON DELETE RESTRICT ON UPDATE CASCADE;
