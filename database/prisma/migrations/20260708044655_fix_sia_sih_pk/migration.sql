/*
  Warnings:

  - The primary key for the `sigtap_tb_sia_sih` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "sigtap_tb_sia_sih" DROP CONSTRAINT "sigtap_tb_sia_sih_pkey",
ADD CONSTRAINT "sigtap_tb_sia_sih_pkey" PRIMARY KEY ("co_procedimento_sia_sih", "tp_procedimento");
