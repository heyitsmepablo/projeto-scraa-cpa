-- CreateEnum
CREATE TYPE "TipoVinculo" AS ENUM ('CONVENIO', 'CONTRATO');

-- CreateEnum
CREATE TYPE "TipoInstituicao" AS ENUM ('FEDERAL', 'ESTADUAL', 'MUNICIPAL', 'FILANTROPICO', 'EMPRESA');

-- CreateEnum
CREATE TYPE "TipoAditivo" AS ENUM ('PRAZO', 'SUPRESSAO', 'VALOR');

-- CreateEnum
CREATE TYPE "TipoOperacao" AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "sigtap_importacao" (
    "id" SERIAL NOT NULL,
    "competencia" CHAR(6) NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_fim" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL,
    "tabelas_afetadas" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sigtap_importacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sigtap_changelog" (
    "id" SERIAL NOT NULL,
    "importacao_id" INTEGER NOT NULL,
    "tabela" VARCHAR(50) NOT NULL,
    "chave_registro" VARCHAR(50) NOT NULL,
    "descricao_registro" VARCHAR(250),
    "tipo_operacao" "TipoOperacao" NOT NULL,
    "dados_antigos" JSONB,
    "dados_novos" JSONB,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sigtap_changelog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sigtap_procedimento" (
    "co_procedimento" VARCHAR(10) NOT NULL,
    "no_procedimento" VARCHAR(250) NOT NULL,
    "tp_complexidade" CHAR(1) NOT NULL,
    "tp_sexo" CHAR(1) NOT NULL,
    "qt_maxima_execucao" INTEGER NOT NULL,
    "qt_dias_permanencia" INTEGER NOT NULL,
    "qt_pontos" INTEGER NOT NULL,
    "vl_idade_minima" INTEGER NOT NULL,
    "vl_idade_maxima" INTEGER NOT NULL,
    "vl_sh" DECIMAL(12,2) NOT NULL,
    "vl_sa" DECIMAL(12,2) NOT NULL,
    "vl_sp" DECIMAL(12,2) NOT NULL,
    "co_financiamento" VARCHAR(2) NOT NULL,
    "co_rubrica" VARCHAR(6) NOT NULL,
    "qt_tempo_permanencia" INTEGER NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sigtap_procedimento_pkey" PRIMARY KEY ("co_procedimento")
);

-- CreateTable
CREATE TABLE "instituicao" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "cnes" VARCHAR(7) NOT NULL,
    "cnpj" VARCHAR(14) NOT NULL,
    "tipo_instituicao" "TipoInstituicao" NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instituicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vinculo" (
    "id" SERIAL NOT NULL,
    "instituicao_id" INTEGER NOT NULL,
    "numero" VARCHAR(50) NOT NULL,
    "tipo_vinculo" "TipoVinculo" NOT NULL,
    "data_inicio" DATE NOT NULL,
    "data_fim" DATE,
    "valor_total" DECIMAL(15,2) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vinculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aditivo" (
    "id" SERIAL NOT NULL,
    "vinculo_id" INTEGER NOT NULL,
    "numero" VARCHAR(50) NOT NULL,
    "tipo_aditivo_1" "TipoAditivo" NOT NULL,
    "tipo_aditivo_2" "TipoAditivo",
    "data_inicio" DATE NOT NULL,
    "data_fim" DATE,
    "valor_total" DECIMAL(15,2) NOT NULL,
    "data_da_assinatura" DATE NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aditivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plano_operativo" (
    "id" SERIAL NOT NULL,
    "vinculo_id" INTEGER NOT NULL,
    "aditivo_id" INTEGER,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expirado_em" TIMESTAMP(3),
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plano_operativo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plano_operativo_procedimento" (
    "plano_operativo_id" INTEGER NOT NULL,
    "co_procedimento" VARCHAR(10) NOT NULL,
    "quantidade_pactuada" INTEGER NOT NULL,
    "valor_pactuado" DECIMAL(12,2) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plano_operativo_procedimento_pkey" PRIMARY KEY ("plano_operativo_id","co_procedimento")
);

-- CreateIndex
CREATE INDEX "sigtap_changelog_importacao_id_idx" ON "sigtap_changelog"("importacao_id");

-- CreateIndex
CREATE INDEX "sigtap_changelog_chave_registro_idx" ON "sigtap_changelog"("chave_registro");

-- CreateIndex
CREATE INDEX "sigtap_changelog_tabela_tipo_operacao_idx" ON "sigtap_changelog"("tabela", "tipo_operacao");

-- AddForeignKey
ALTER TABLE "sigtap_changelog" ADD CONSTRAINT "sigtap_changelog_importacao_id_fkey" FOREIGN KEY ("importacao_id") REFERENCES "sigtap_importacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculo" ADD CONSTRAINT "vinculo_instituicao_id_fkey" FOREIGN KEY ("instituicao_id") REFERENCES "instituicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aditivo" ADD CONSTRAINT "aditivo_vinculo_id_fkey" FOREIGN KEY ("vinculo_id") REFERENCES "vinculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_operativo" ADD CONSTRAINT "plano_operativo_vinculo_id_fkey" FOREIGN KEY ("vinculo_id") REFERENCES "vinculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_operativo" ADD CONSTRAINT "plano_operativo_aditivo_id_fkey" FOREIGN KEY ("aditivo_id") REFERENCES "aditivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_operativo_procedimento" ADD CONSTRAINT "plano_operativo_procedimento_plano_operativo_id_fkey" FOREIGN KEY ("plano_operativo_id") REFERENCES "plano_operativo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_operativo_procedimento" ADD CONSTRAINT "plano_operativo_procedimento_co_procedimento_fkey" FOREIGN KEY ("co_procedimento") REFERENCES "sigtap_procedimento"("co_procedimento") ON DELETE RESTRICT ON UPDATE CASCADE;
