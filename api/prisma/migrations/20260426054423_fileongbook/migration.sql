-- AlterTable
ALTER TABLE `absence` MODIFY `geo_in_lat` DECIMAL(65, 30) NULL,
    MODIFY `geo_in_long` DECIMAL(65, 30) NULL,
    MODIFY `geo_out_lat` DECIMAL(65, 30) NULL,
    MODIFY `geo_out_long` DECIMAL(65, 30) NULL;

-- AlterTable
ALTER TABLE `guestbook` ADD COLUMN `file` VARCHAR(191) NULL;
