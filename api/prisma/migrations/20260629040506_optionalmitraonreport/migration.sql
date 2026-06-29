-- DropForeignKey
ALTER TABLE `visit` DROP FOREIGN KEY `Visit_mitraId_fkey`;

-- DropIndex
DROP INDEX `Visit_mitraId_fkey` ON `visit`;

-- AlterTable
ALTER TABLE `visit` MODIFY `mitraId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Visit` ADD CONSTRAINT `Visit_mitraId_fkey` FOREIGN KEY (`mitraId`) REFERENCES `Mitra`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
