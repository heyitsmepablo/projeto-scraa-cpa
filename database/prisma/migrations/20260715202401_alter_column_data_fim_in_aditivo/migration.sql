/*
  Warnings:

  - Made the column `data_fim` on table `aditivo` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "aditivo" ALTER COLUMN "data_fim" SET NOT NULL;
