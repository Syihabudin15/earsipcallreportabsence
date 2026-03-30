/*
  Warnings:

  - You are about to drop the column `periode` on the `usercost` table. All the data in the column will be lost.
  - You are about to drop the column `last_action` on the `visit` table. All the data in the column will be lost.
  - You are about to drop the column `need` on the `visit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `usercost` DROP COLUMN `periode`,
    ADD COLUMN `end_at` DATETIME(3) NULL,
    ADD COLUMN `start_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `visit` DROP COLUMN `last_action`,
    DROP COLUMN `need`,
    ADD COLUMN `ai_next_action` VARCHAR(191) NULL,
    ADD COLUMN `ai_sentiment` VARCHAR(191) NULL,
    ADD COLUMN `ai_summary` VARCHAR(191) NULL,
    ADD COLUMN `next_action` TEXT NULL;
