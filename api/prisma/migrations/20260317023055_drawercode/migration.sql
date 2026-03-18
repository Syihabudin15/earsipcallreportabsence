/*
  Warnings:

  - Added the required column `drawer_code` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `submission` ADD COLUMN `drawer_code` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `usercost` ADD COLUMN `periode` DATETIME(3) NULL;
