/*
  Warnings:

  - You are about to drop the column `quantidade_pactuada` on the `plano_operativo_procedimento` table. All the data in the column will be lost.
  - You are about to drop the column `valor_pactuado` on the `plano_operativo_procedimento` table. All the data in the column will be lost.
  - Added the required column `quantidade_pactuada_mensal` to the `plano_operativo_procedimento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `objeto` to the `vinculo` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoComplexidade" AS ENUM ('BC', 'MC', 'AC');

-- AlterTable
ALTER TABLE "plano_operativo_procedimento" DROP COLUMN "quantidade_pactuada",
DROP COLUMN "valor_pactuado",
ADD COLUMN     "quantidade_pactuada_mensal" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "vinculo" ADD COLUMN     "complexidade" "TipoComplexidade"[],
ADD COLUMN     "objeto" TEXT NOT NULL;
