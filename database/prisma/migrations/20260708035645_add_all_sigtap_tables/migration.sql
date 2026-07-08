/*
  Warnings:

  - Added the required column `dt_competencia` to the `sigtap_rubrica` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sigtap_rubrica" ADD COLUMN     "dt_competencia" CHAR(6) NOT NULL,
ALTER COLUMN "no_rubrica" SET DATA TYPE VARCHAR(100);

-- CreateTable
CREATE TABLE "tb_detalhe" (
    "co_detalhe" VARCHAR(3) NOT NULL,
    "no_detalhe" VARCHAR(100) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tb_detalhe_pkey" PRIMARY KEY ("co_detalhe")
);

-- CreateTable
CREATE TABLE "tb_descricao_detalhe" (
    "co_detalhe" VARCHAR(3) NOT NULL,
    "ds_detalhe" VARCHAR(4000) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tb_descricao_detalhe_pkey" PRIMARY KEY ("co_detalhe")
);

-- CreateTable
CREATE TABLE "tb_registro" (
    "co_registro" VARCHAR(2) NOT NULL,
    "no_registro" VARCHAR(50) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tb_registro_pkey" PRIMARY KEY ("co_registro")
);

-- CreateTable
CREATE TABLE "tb_servico" (
    "co_servico" VARCHAR(3) NOT NULL,
    "no_servico" VARCHAR(120) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tb_servico_pkey" PRIMARY KEY ("co_servico")
);

-- CreateTable
CREATE TABLE "tb_servico_classificacao" (
    "co_servico" VARCHAR(3) NOT NULL,
    "co_classificacao" VARCHAR(3) NOT NULL,
    "no_classificacao" VARCHAR(150) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tb_servico_classificacao_pkey" PRIMARY KEY ("co_servico")
);

-- CreateTable
CREATE TABLE "tb_modalidade" (
    "co_modalidade" VARCHAR(2) NOT NULL,
    "no_modalidade" VARCHAR(100) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tb_modalidade_pkey" PRIMARY KEY ("co_modalidade")
);

-- CreateTable
CREATE TABLE "tb_tipo_leito" (
    "co_tipo_leito" VARCHAR(2) NOT NULL,
    "no_tipo_leito" VARCHAR(60) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tb_tipo_leito_pkey" PRIMARY KEY ("co_tipo_leito")
);

-- CreateTable
CREATE TABLE "tb_cid" (
    "co_cid" VARCHAR(4) NOT NULL,
    "no_cid" VARCHAR(100) NOT NULL,
    "tp_agravo" CHAR(1) NOT NULL,
    "tp_sexo" CHAR(1) NOT NULL,
    "tp_estadio" CHAR(1) NOT NULL,
    "vl_campos_irradiados" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tb_cid_pkey" PRIMARY KEY ("co_cid")
);

-- CreateTable
CREATE TABLE "tb_ocupacao" (
    "co_ocupacao" CHAR(6) NOT NULL,
    "no_ocupacao" VARCHAR(150) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tb_ocupacao_pkey" PRIMARY KEY ("co_ocupacao")
);

-- CreateTable
CREATE TABLE "tb_habilitacao" (
    "co_habilitacao" VARCHAR(4) NOT NULL,
    "no_habilitacao" VARCHAR(150) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tb_habilitacao_pkey" PRIMARY KEY ("co_habilitacao")
);

-- CreateTable
CREATE TABLE "tb_grupo" (
    "co_grupo" VARCHAR(2) NOT NULL,
    "no_grupo" VARCHAR(100) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tb_grupo_pkey" PRIMARY KEY ("co_grupo")
);

-- CreateTable
CREATE TABLE "tb_sub_grupo" (
    "co_grupo" VARCHAR(2) NOT NULL,
    "co_sub_grupo" VARCHAR(2) NOT NULL,
    "no_sub_grupo" VARCHAR(100) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tb_sub_grupo_pkey" PRIMARY KEY ("co_grupo")
);

-- CreateTable
CREATE TABLE "tb_forma_organizacao" (
    "co_grupo" VARCHAR(2) NOT NULL,
    "co_sub_grupo" VARCHAR(2) NOT NULL,
    "co_forma_organizacao" VARCHAR(2) NOT NULL,
    "no_forma_organizacao" VARCHAR(100) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tb_forma_organizacao_pkey" PRIMARY KEY ("co_grupo")
);

-- CreateTable
CREATE TABLE "tb_sia_sih" (
    "co_procedimento_sia_sih" VARCHAR(10) NOT NULL,
    "no_procedimento_sia_sih" VARCHAR(100) NOT NULL,
    "tp_procedimento" VARCHAR(1) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tb_sia_sih_pkey" PRIMARY KEY ("co_procedimento_sia_sih")
);

-- CreateTable
CREATE TABLE "tb_grupo_habilitacao" (
    "nu_grupo_habilitacao" VARCHAR(4) NOT NULL,
    "no_grupo_habilitacao" VARCHAR(20) NOT NULL,
    "ds_grupo_habilitacao" VARCHAR(250) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tb_grupo_habilitacao_pkey" PRIMARY KEY ("nu_grupo_habilitacao")
);

-- CreateTable
CREATE TABLE "tb_descricao" (
    "co_procedimento" VARCHAR(10) NOT NULL,
    "ds_procedimento" VARCHAR(4000) NOT NULL,
    "dt_competencia" CHAR(6) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tb_descricao_pkey" PRIMARY KEY ("co_procedimento")
);

-- CreateTable
CREATE TABLE "tb_regra_condicionada" (
    "co_regra_condicionada" VARCHAR(4) NOT NULL,
    "no_regra_condicionada" VARCHAR(150) NOT NULL,
    "ds_regra_condicionada" VARCHAR(4000) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tb_regra_condicionada_pkey" PRIMARY KEY ("co_regra_condicionada")
);

-- CreateTable
CREATE TABLE "tb_rede_atencao" (
    "co_rede_atencao" VARCHAR(3) NOT NULL,
    "no_rede_atencao" VARCHAR(50) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tb_rede_atencao_pkey" PRIMARY KEY ("co_rede_atencao")
);

-- CreateTable
CREATE TABLE "tb_componente_rede" (
    "co_componente_rede" VARCHAR(10) NOT NULL,
    "no_componente_rede" VARCHAR(150) NOT NULL,
    "co_rede_atencao" VARCHAR(3) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tb_componente_rede_pkey" PRIMARY KEY ("co_componente_rede")
);

-- CreateTable
CREATE TABLE "tb_tuss" (
    "co_tuss" VARCHAR(10) NOT NULL,
    "no_tuss" VARCHAR(450) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tb_tuss_pkey" PRIMARY KEY ("co_tuss")
);

-- CreateTable
CREATE TABLE "tb_renases" (
    "co_renases" VARCHAR(10) NOT NULL,
    "no_renases" VARCHAR(150) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tb_renases_pkey" PRIMARY KEY ("co_renases")
);
