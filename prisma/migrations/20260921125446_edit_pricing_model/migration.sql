/*
  Warnings:

  - Added the required column `courierEarning` to the `pricings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pricings" ADD COLUMN     "courierEarning" DECIMAL(8,2) NOT NULL;
