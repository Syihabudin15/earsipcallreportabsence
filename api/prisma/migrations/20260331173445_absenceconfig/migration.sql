/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `absenceconfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `absenceconfig` DROP COLUMN `updatedAt`,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
