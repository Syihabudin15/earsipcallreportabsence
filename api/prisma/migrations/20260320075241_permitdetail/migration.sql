/*
  Warnings:

  - Added the required column `permitFileId` to the `PermitFileDetail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `permitfiledetail` ADD COLUMN `permitFileId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `PermitFileDetail` ADD CONSTRAINT `PermitFileDetail_permitFileId_fkey` FOREIGN KEY (`permitFileId`) REFERENCES `PermitFile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
