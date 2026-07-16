/*
  Warnings:

  - You are about to drop the column `competencia` on the `cpa_importacao` table. All the data in the column will be lost.
  - Added the required column `versao` to the `cpa_importacao` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cpa_importacao" DROP COLUMN "competencia",
ADD COLUMN     "versao" CHAR(6) NOT NULL;
