/*
  Warnings:

  - The values [PRAZO] on the enum `TipoAditivo` will be removed. If these variants are still used in the database, this will fail.
  - The values [PMAE] on the enum `TipoVinculo` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `valor_total_anual` on the `aditivo` table. All the data in the column will be lost.
  - You are about to drop the column `valor_total_anual` on the `vinculo` table. All the data in the column will be lost.
  - Added the required column `numero_processo_sei` to the `aditivo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numero_processo_sei` to the `vinculo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valor_total` to the `vinculo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TipoAditivo_new" AS ENUM ('ACRÉSCIMO', 'SUPRESSÃO', 'VALOR');
ALTER TABLE "aditivo" ALTER COLUMN "tipo_aditivo" TYPE "TipoAditivo_new"[] USING ("tipo_aditivo"::text::"TipoAditivo_new"[]);
ALTER TYPE "TipoAditivo" RENAME TO "TipoAditivo_old";
ALTER TYPE "TipoAditivo_new" RENAME TO "TipoAditivo";
DROP TYPE "public"."TipoAditivo_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TipoVinculo_new" AS ENUM ('CONVÊNIO', 'CONTRATO');
ALTER TABLE "vinculo" ALTER COLUMN "tipo_vinculo" TYPE "TipoVinculo_new" USING ("tipo_vinculo"::text::"TipoVinculo_new");
ALTER TYPE "TipoVinculo" RENAME TO "TipoVinculo_old";
ALTER TYPE "TipoVinculo_new" RENAME TO "TipoVinculo";
DROP TYPE "public"."TipoVinculo_old";
COMMIT;

-- AlterTable
ALTER TABLE "aditivo" DROP COLUMN "valor_total_anual",
ADD COLUMN     "numero_processo_sei" VARCHAR(50) NOT NULL,
ADD COLUMN     "valor_total" DECIMAL(15,2);

-- AlterTable
ALTER TABLE "vinculo" DROP COLUMN "valor_total_anual",
ADD COLUMN     "numero_processo_sei" VARCHAR(50) NOT NULL,
ADD COLUMN     "valor_total" DECIMAL(15,2) NOT NULL;

-- CreateTable
CREATE TABLE "complementacao_tipo" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "descricao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "complementacao_tipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complementacao_item" (
    "id" SERIAL NOT NULL,
    "complementacao_tipo_id" INTEGER NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "valorUnitario" DECIMAL(15,2) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "complementacao_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plano_operativo_complementacao" (
    "id" SERIAL NOT NULL,
    "plano_operativo_id" INTEGER NOT NULL,
    "complementacao_item_id" INTEGER NOT NULL,
    "quantidade_pactuada_mensal" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "plano_operativo_complementacao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "complementacao_item" ADD CONSTRAINT "complementacao_item_complementacao_tipo_id_fkey" FOREIGN KEY ("complementacao_tipo_id") REFERENCES "complementacao_tipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_operativo_complementacao" ADD CONSTRAINT "plano_operativo_complementacao_plano_operativo_id_fkey" FOREIGN KEY ("plano_operativo_id") REFERENCES "plano_operativo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_operativo_complementacao" ADD CONSTRAINT "plano_operativo_complementacao_complementacao_item_id_fkey" FOREIGN KEY ("complementacao_item_id") REFERENCES "complementacao_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
