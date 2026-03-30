-- DropForeignKey
ALTER TABLE `files` DROP FOREIGN KEY `Files_submissionId_fkey`;

-- DropIndex
DROP INDEX `Files_submissionId_fkey` ON `files`;

-- AlterTable
ALTER TABLE `files` MODIFY `submissionId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Files` ADD CONSTRAINT `Files_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `Submission`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
