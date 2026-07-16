/*
  Warnings:

  - The values [SUPRESSAO] on the enum `TipoAditivo` will be removed. If these variants are still used in the database, this will fail.
  - The values [FEDERAL,ESTADUAL,MUNICIPAL,FILANTROPICO] on the enum `TipoInstituicao` will be removed. If these variants are still used in the database, this will fail.
  - The values [CONVENIO] on the enum `TipoVinculo` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `tipo_aditivo_1` on the `aditivo` table. All the data in the column will be lost.
  - You are about to drop the column `tipo_aditivo_2` on the `aditivo` table. All the data in the column will be lost.
  - You are about to drop the column `valor_total` on the `aditivo` table. All the data in the column will be lost.
  - You are about to drop the column `valor_total` on the `vinculo` table. All the data in the column will be lost.
  - Added the required column `valor_total_anual` to the `aditivo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `data_da_assinatura` to the `vinculo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valor_total_anual` to the `vinculo` table without a default value. This is not possible if the table is not empty.

*/

-- AlterTable
ALTER TABLE "aditivo" DROP COLUMN "tipo_aditivo_1",
DROP COLUMN "tipo_aditivo_2",
DROP COLUMN "valor_total",
ADD COLUMN     "tipo_aditivo" "TipoAditivo"[],
ADD COLUMN     "valor_total_anual" DECIMAL(15,2) NOT NULL;

-- AlterTable
ALTER TABLE "vinculo" DROP COLUMN "valor_total",
ADD COLUMN     "data_da_assinatura" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "valor_total_anual" DECIMAL(15,2) NOT NULL;

-- AlterEnum
BEGIN;
CREATE TYPE "TipoAditivo_new" AS ENUM ('PRAZO', 'SUPRESSÃO', 'VALOR');
ALTER TABLE "aditivo" ALTER COLUMN "tipo_aditivo" TYPE "TipoAditivo_new"[] USING ("tipo_aditivo"::text::"TipoAditivo_new"[]);
ALTER TYPE "TipoAditivo" RENAME TO "TipoAditivo_old";
ALTER TYPE "TipoAditivo_new" RENAME TO "TipoAditivo";
DROP TYPE "public"."TipoAditivo_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TipoInstituicao_new" AS ENUM ('FILANTRÓPICO', 'EMPRESA');
ALTER TABLE "instituicao" ALTER COLUMN "tipo_instituicao" TYPE "TipoInstituicao_new" USING ("tipo_instituicao"::text::"TipoInstituicao_new");
ALTER TYPE "TipoInstituicao" RENAME TO "TipoInstituicao_old";
ALTER TYPE "TipoInstituicao_new" RENAME TO "TipoInstituicao";
DROP TYPE "public"."TipoInstituicao_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TipoVinculo_new" AS ENUM ('CONVÊNIO', 'CONTRATO', 'PMAE');
ALTER TABLE "vinculo" ALTER COLUMN "tipo_vinculo" TYPE "TipoVinculo_new" USING ("tipo_vinculo"::text::"TipoVinculo_new");
ALTER TYPE "TipoVinculo" RENAME TO "TipoVinculo_old";
ALTER TYPE "TipoVinculo_new" RENAME TO "TipoVinculo";
DROP TYPE "public"."TipoVinculo_old";
COMMIT;
