/*
  Warnings:

  - You are about to alter the column `value` on the `billing` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(15,2)`.
  - You are about to alter the column `realize_value` on the `billing` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(15,2)`.
  - You are about to alter the column `pkk` on the `billing` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(15,2)`.
  - You are about to alter the column `tung_bga` on the `billing` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(15,2)`.
  - You are about to alter the column `tung_pkk` on the `billing` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(15,2)`.

*/
-- AlterTable
ALTER TABLE `billing` MODIFY `value` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    MODIFY `realize_value` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    MODIFY `pkk` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    MODIFY `tung_bga` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    MODIFY `tung_pkk` DECIMAL(15, 2) NOT NULL DEFAULT 0;
