/*
  Warnings:

  - You are about to drop the `sigtap_financiamento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sigtap_procedimento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sigtap_rubrica` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_cid` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_componente_rede` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_descricao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_descricao_detalhe` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_detalhe` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_forma_organizacao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_grupo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_grupo_habilitacao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_habilitacao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_modalidade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_ocupacao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_rede_atencao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_registro` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_regra_condicionada` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_renases` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_servico` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_servico_classificacao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_sia_sih` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_sub_grupo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_tipo_leito` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_tuss` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "plano_operativo_procedimento" DROP CONSTRAINT "plano_operativo_procedimento_co_procedimento_fkey";

-- DropTable
DROP TABLE "sigtap_financiamento";

-- DropTable
DROP TABLE "sigtap_procedimento";

-- DropTable
DROP TABLE "sigtap_rubrica";

-- DropTable
DROP TABLE "tb_cid";

-- DropTable
DROP TABLE "tb_componente_rede";

-- DropTable
DROP TABLE "tb_descricao";

-- DropTable
DROP TABLE "tb_descricao_detalhe";

-- DropTable
DROP TABLE "tb_detalhe";

-- DropTable
DROP TABLE "tb_forma_organizacao";

-- DropTable
DROP TABLE "tb_grupo";

-- DropTable
DROP TABLE "tb_grupo_habilitacao";

-- DropTable
DROP TABLE "tb_habilitacao";

-- DropTable
DROP TABLE "tb_modalidade";

-- DropTable
DROP TABLE "tb_ocupacao";

-- DropTable
DROP TABLE "tb_rede_atencao";

-- DropTable
DROP TABLE "tb_registro";

-- DropTable
DROP TABLE "tb_regra_condicionada";

-- DropTable
DROP TABLE "tb_renases";

-- DropTable
DROP TABLE "tb_servico";

-- DropTable
DROP TABLE "tb_servico_classificacao";

-- DropTable
DROP TABLE "tb_sia_sih";

-- DropTable
DROP TABLE "tb_sub_grupo";

-- DropTable
DROP TABLE "tb_tipo_leito";

-- DropTable
DROP TABLE "tb_tuss";

-- CreateTable
CREATE TABLE "sigtap_tb_financiamento" (
    "id" SERIAL NOT NULL,
    "co_financiamento" VARCHAR(2) NOT NULL,
    "no_financiamento" VARCHAR(50) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_financiamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sigtap_tb_rubrica" (
    "id" SERIAL NOT NULL,
    "co_rubrica" VARCHAR(6) NOT NULL,
    "no_rubrica" VARCHAR(100) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_rubrica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sigtap_tb_procedimento" (
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
    "co_rubrica" VARCHAR(6),
    "qt_tempo_permanencia" INTEGER NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_procedimento_pkey" PRIMARY KEY ("co_procedimento")
);

-- CreateTable
CREATE TABLE "sigtap_tb_detalhe" (
    "co_detalhe" VARCHAR(3) NOT NULL,
    "no_detalhe" VARCHAR(100) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_detalhe_pkey" PRIMARY KEY ("co_detalhe")
);

-- CreateTable
CREATE TABLE "sigtap_tb_descricao_detalhe" (
    "co_detalhe" VARCHAR(3) NOT NULL,
    "ds_detalhe" VARCHAR(4000) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_descricao_detalhe_pkey" PRIMARY KEY ("co_detalhe")
);

-- CreateTable
CREATE TABLE "sigtap_tb_registro" (
    "co_registro" VARCHAR(2) NOT NULL,
    "no_registro" VARCHAR(50) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_registro_pkey" PRIMARY KEY ("co_registro")
);

-- CreateTable
CREATE TABLE "sigtap_tb_servico" (
    "co_servico" VARCHAR(3) NOT NULL,
    "no_servico" VARCHAR(120) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_servico_pkey" PRIMARY KEY ("co_servico")
);

-- CreateTable
CREATE TABLE "sigtap_tb_servico_classificacao" (
    "co_servico" VARCHAR(3) NOT NULL,
    "co_classificacao" VARCHAR(3) NOT NULL,
    "no_classificacao" VARCHAR(150) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_servico_classificacao_pkey" PRIMARY KEY ("co_servico")
);

-- CreateTable
CREATE TABLE "sigtap_tb_modalidade" (
    "co_modalidade" VARCHAR(2) NOT NULL,
    "no_modalidade" VARCHAR(100) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_modalidade_pkey" PRIMARY KEY ("co_modalidade")
);

-- CreateTable
CREATE TABLE "sigtap_tb_tipo_leito" (
    "co_tipo_leito" VARCHAR(2) NOT NULL,
    "no_tipo_leito" VARCHAR(60) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_tipo_leito_pkey" PRIMARY KEY ("co_tipo_leito")
);

-- CreateTable
CREATE TABLE "sigtap_tb_cid" (
    "co_cid" VARCHAR(4) NOT NULL,
    "no_cid" VARCHAR(100) NOT NULL,
    "tp_agravo" CHAR(1) NOT NULL,
    "tp_sexo" CHAR(1) NOT NULL,
    "tp_estadio" CHAR(1) NOT NULL,
    "vl_campos_irradiados" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_cid_pkey" PRIMARY KEY ("co_cid")
);

-- CreateTable
CREATE TABLE "sigtap_tb_ocupacao" (
    "co_ocupacao" CHAR(6) NOT NULL,
    "no_ocupacao" VARCHAR(150) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_ocupacao_pkey" PRIMARY KEY ("co_ocupacao")
);

-- CreateTable
CREATE TABLE "sigtap_tb_habilitacao" (
    "co_habilitacao" VARCHAR(4) NOT NULL,
    "no_habilitacao" VARCHAR(150) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_habilitacao_pkey" PRIMARY KEY ("co_habilitacao")
);

-- CreateTable
CREATE TABLE "sigtap_tb_grupo" (
    "co_grupo" VARCHAR(2) NOT NULL,
    "no_grupo" VARCHAR(100) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_grupo_pkey" PRIMARY KEY ("co_grupo")
);

-- CreateTable
CREATE TABLE "sigtap_tb_sub_grupo" (
    "co_grupo" VARCHAR(2) NOT NULL,
    "co_sub_grupo" VARCHAR(2) NOT NULL,
    "no_sub_grupo" VARCHAR(100) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_sub_grupo_pkey" PRIMARY KEY ("co_grupo")
);

-- CreateTable
CREATE TABLE "sigtap_tb_forma_organizacao" (
    "co_grupo" VARCHAR(2) NOT NULL,
    "co_sub_grupo" VARCHAR(2) NOT NULL,
    "co_forma_organizacao" VARCHAR(2) NOT NULL,
    "no_forma_organizacao" VARCHAR(100) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_forma_organizacao_pkey" PRIMARY KEY ("co_grupo")
);

-- CreateTable
CREATE TABLE "sigtap_tb_sia_sih" (
    "co_procedimento_sia_sih" VARCHAR(10) NOT NULL,
    "no_procedimento_sia_sih" VARCHAR(100) NOT NULL,
    "tp_procedimento" VARCHAR(1) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_sia_sih_pkey" PRIMARY KEY ("co_procedimento_sia_sih")
);

-- CreateTable
CREATE TABLE "sigtap_tb_grupo_habilitacao" (
    "nu_grupo_habilitacao" VARCHAR(4) NOT NULL,
    "no_grupo_habilitacao" VARCHAR(20) NOT NULL,
    "ds_grupo_habilitacao" VARCHAR(250) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_grupo_habilitacao_pkey" PRIMARY KEY ("nu_grupo_habilitacao")
);

-- CreateTable
CREATE TABLE "sigtap_tb_descricao" (
    "co_procedimento" VARCHAR(10) NOT NULL,
    "ds_procedimento" VARCHAR(4000) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_descricao_pkey" PRIMARY KEY ("co_procedimento")
);

-- CreateTable
CREATE TABLE "sigtap_tb_regra_condicionada" (
    "co_regra_condicionada" VARCHAR(4) NOT NULL,
    "no_regra_condicionada" VARCHAR(150) NOT NULL,
    "ds_regra_condicionada" VARCHAR(4000) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_regra_condicionada_pkey" PRIMARY KEY ("co_regra_condicionada")
);

-- CreateTable
CREATE TABLE "sigtap_tb_rede_atencao" (
    "co_rede_atencao" VARCHAR(3) NOT NULL,
    "no_rede_atencao" VARCHAR(50) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_rede_atencao_pkey" PRIMARY KEY ("co_rede_atencao")
);

-- CreateTable
CREATE TABLE "sigtap_tb_componente_rede" (
    "co_componente_rede" VARCHAR(10) NOT NULL,
    "no_componente_rede" VARCHAR(150) NOT NULL,
    "co_rede_atencao" VARCHAR(3) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_componente_rede_pkey" PRIMARY KEY ("co_componente_rede")
);

-- CreateTable
CREATE TABLE "sigtap_tb_tuss" (
    "co_tuss" VARCHAR(10) NOT NULL,
    "no_tuss" VARCHAR(450) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_tuss_pkey" PRIMARY KEY ("co_tuss")
);

-- CreateTable
CREATE TABLE "sigtap_tb_renases" (
    "co_renases" VARCHAR(10) NOT NULL,
    "no_renases" VARCHAR(150) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "sigtap_tb_renases_pkey" PRIMARY KEY ("co_renases")
);

-- CreateIndex
CREATE UNIQUE INDEX "sigtap_tb_financiamento_co_financiamento_key" ON "sigtap_tb_financiamento"("co_financiamento");

-- CreateIndex
CREATE UNIQUE INDEX "sigtap_tb_rubrica_co_rubrica_key" ON "sigtap_tb_rubrica"("co_rubrica");

-- AddForeignKey
ALTER TABLE "plano_operativo_procedimento" ADD CONSTRAINT "plano_operativo_procedimento_co_procedimento_fkey" FOREIGN KEY ("co_procedimento") REFERENCES "sigtap_tb_procedimento"("co_procedimento") ON DELETE RESTRICT ON UPDATE CASCADE;
