/*
  Warnings:

  - The values [VALOR] on the enum `TipoAditivo` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `valorUnitario` on the `complementacao_item` table. All the data in the column will be lost.
  - Added the required column `valor_unitario` to the `complementacao_item` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TipoAditivo_new" AS ENUM ('ACRÉSCIMO', 'SUPRESSÃO', 'PRAZO');
ALTER TABLE "aditivo" ALTER COLUMN "tipo_aditivo" TYPE "TipoAditivo_new"[] USING ("tipo_aditivo"::text::"TipoAditivo_new"[]);
ALTER TYPE "TipoAditivo" RENAME TO "TipoAditivo_old";
ALTER TYPE "TipoAditivo_new" RENAME TO "TipoAditivo";
DROP TYPE "public"."TipoAditivo_old";
COMMIT;

-- AlterTable
ALTER TABLE "complementacao_item" DROP COLUMN "valorUnitario",
ADD COLUMN     "valor_unitario" DECIMAL(15,2) NOT NULL;
