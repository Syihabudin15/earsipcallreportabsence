/*
  Warnings:

  - The values [ALPHA] on the enum `PermitAbsence_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `createdAt` on the `files` table. All the data in the column will be lost.
  - The values [ALPHA] on the enum `PermitAbsence_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `absence` MODIFY `absence_status` ENUM('HADIR', 'TERLAMBAT', 'CUTI', 'PERDIN', 'SAKIT') NOT NULL DEFAULT 'HADIR';

-- AlterTable
ALTER TABLE `files` DROP COLUMN `createdAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `permitabsence` MODIFY `type` ENUM('HADIR', 'TERLAMBAT', 'CUTI', 'PERDIN', 'SAKIT') NOT NULL;
