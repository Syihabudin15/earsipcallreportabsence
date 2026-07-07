/*
  Warnings:

  - Added the required column `libraryCategoryId` to the `Library` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `library` ADD COLUMN `libraryCategoryId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Library` ADD CONSTRAINT `Library_libraryCategoryId_fkey` FOREIGN KEY (`libraryCategoryId`) REFERENCES `LibraryCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
