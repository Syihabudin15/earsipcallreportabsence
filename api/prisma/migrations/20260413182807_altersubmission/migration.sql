/*
  Warnings:

  - You are about to drop the column `approverById` on the `submission` table. All the data in the column will be lost.
  - You are about to drop the column `approve_status` on the `visit` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `submission` DROP FOREIGN KEY `Submission_approverById_fkey`;

-- DropIndex
DROP INDEX `Submission_approverById_fkey` ON `submission`;

-- AlterTable
ALTER TABLE `submission` DROP COLUMN `approverById`;

-- AlterTable
ALTER TABLE `visit` DROP COLUMN `approve_status`;
