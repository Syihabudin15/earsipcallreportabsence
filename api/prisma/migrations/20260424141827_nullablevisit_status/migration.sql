-- DropForeignKey
ALTER TABLE `visit` DROP FOREIGN KEY `Visit_visitStatusId_fkey`;

-- DropIndex
DROP INDEX `Visit_visitStatusId_fkey` ON `visit`;

-- AlterTable
ALTER TABLE `visit` MODIFY `visitStatusId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Visit` ADD CONSTRAINT `Visit_visitStatusId_fkey` FOREIGN KEY (`visitStatusId`) REFERENCES `VisitStatus`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
