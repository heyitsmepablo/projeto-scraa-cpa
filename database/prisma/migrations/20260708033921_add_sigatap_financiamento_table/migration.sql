-- AlterTable
ALTER TABLE "sigtap_procedimento" ALTER COLUMN "co_rubrica" DROP NOT NULL;

-- CreateTable
CREATE TABLE "sigtap_financiamento" (
    "id" SERIAL NOT NULL,
    "co_financiamento" VARCHAR(2) NOT NULL,
    "no_financiamento" VARCHAR(50) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_financiamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sigtap_rubrica" (
    "id" SERIAL NOT NULL,
    "co_rubrica" VARCHAR(6) NOT NULL,
    "no_rubrica" VARCHAR(50) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_rubrica_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sigtap_financiamento_co_financiamento_key" ON "sigtap_financiamento"("co_financiamento");

-- CreateIndex
CREATE UNIQUE INDEX "sigtap_rubrica_co_rubrica_key" ON "sigtap_rubrica"("co_rubrica");
