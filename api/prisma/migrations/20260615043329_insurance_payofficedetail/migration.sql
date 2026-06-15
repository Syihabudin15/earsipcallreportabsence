/*
  Warnings:

  - You are about to drop the column `files` on the `insurance` table. All the data in the column will be lost.
  - You are about to drop the column `files` on the `payoffice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `insurance` DROP COLUMN `files`,
    ADD COLUMN `address` TEXT NULL,
    ADD COLUMN `code` VARCHAR(191) NULL,
    ADD COLUMN `drawer_code` VARCHAR(191) NULL,
    ADD COLUMN `email` TEXT NULL,
    ADD COLUMN `file` TEXT NULL,
    ADD COLUMN `no_contract` VARCHAR(191) NULL,
    ADD COLUMN `phone` TEXT NULL,
    ADD COLUMN `pic` TEXT NULL,
    MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `mitra` MODIFY `phone` TEXT NULL,
    MODIFY `email` TEXT NULL,
    MODIFY `address` TEXT NULL,
    MODIFY `pic` TEXT NULL,
    MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `payoffice` DROP COLUMN `files`,
    ADD COLUMN `address` TEXT NULL,
    ADD COLUMN `code` VARCHAR(191) NULL,
    ADD COLUMN `drawer_code` VARCHAR(191) NULL,
    ADD COLUMN `email` TEXT NULL,
    ADD COLUMN `file` TEXT NULL,
    ADD COLUMN `no_contract` VARCHAR(191) NULL,
    ADD COLUMN `phone` TEXT NULL,
    ADD COLUMN `pic` TEXT NULL,
    MODIFY `description` TEXT NULL;
