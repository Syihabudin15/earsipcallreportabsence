/*
  Warnings:

  - You are about to drop the column `ai_next_action` on the `visit` table. All the data in the column will be lost.
  - You are about to drop the column `ai_sentiment` on the `visit` table. All the data in the column will be lost.
  - You are about to drop the column `ai_summary` on the `visit` table. All the data in the column will be lost.
  - You are about to drop the column `comment` on the `visit` table. All the data in the column will be lost.
  - You are about to drop the column `purpose` on the `visit` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `visit` table. All the data in the column will be lost.
  - You are about to drop the column `visit_status` on the `visit` table. All the data in the column will be lost.
  - Added the required column `visitCategoryId` to the `Visit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `visitStatusId` to the `Visit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `visit` DROP COLUMN `ai_next_action`,
    DROP COLUMN `ai_sentiment`,
    DROP COLUMN `ai_summary`,
    DROP COLUMN `comment`,
    DROP COLUMN `purpose`,
    DROP COLUMN `type`,
    DROP COLUMN `visit_status`,
    ADD COLUMN `approve_status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `coments` TEXT NULL,
    ADD COLUMN `visitCategoryId` VARCHAR(191) NOT NULL,
    ADD COLUMN `visitPurposeId` VARCHAR(191) NULL,
    ADD COLUMN `visitStatusId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `VisitCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisitStatus` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisitPurpose` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Visit` ADD CONSTRAINT `Visit_visitCategoryId_fkey` FOREIGN KEY (`visitCategoryId`) REFERENCES `VisitCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Visit` ADD CONSTRAINT `Visit_visitStatusId_fkey` FOREIGN KEY (`visitStatusId`) REFERENCES `VisitStatus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Visit` ADD CONSTRAINT `Visit_visitPurposeId_fkey` FOREIGN KEY (`visitPurposeId`) REFERENCES `VisitPurpose`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
