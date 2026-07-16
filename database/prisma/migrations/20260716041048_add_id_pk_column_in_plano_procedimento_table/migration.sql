/*
  Warnings:

  - The primary key for the `plano_operativo_procedimento` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "plano_operativo_procedimento" DROP CONSTRAINT "plano_operativo_procedimento_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "plano_operativo_procedimento_pkey" PRIMARY KEY ("id");
