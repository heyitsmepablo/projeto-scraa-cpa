-- CreateTable
CREATE TABLE "datasus_importacao" (
    "id" SERIAL NOT NULL,
    "competencia" CHAR(6) NOT NULL,
    "sistema_origem" VARCHAR(10) NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_fim" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL,
    "arquivos_afetados" TEXT,
    "registros_processados" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "datasus_importacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "datasus_sih_tb_rd" (
    "id" SERIAL NOT NULL,
    "ANO_CMPT" CHAR(4) NOT NULL,
    "MES_CMPT" CHAR(2) NOT NULL,
    "DI_INTER" CHAR(8) NOT NULL,
    "PROC_REA" CHAR(10) NOT NULL,
    "CNES" CHAR(7) NOT NULL,
    "VAL_TOT" DECIMAL(14,2) NOT NULL,
    "QT_DIARIAS" DECIMAL(3,0) NOT NULL,
    "UF_ZI" CHAR(6) NOT NULL,
    "FINANC" CHAR(2) NOT NULL,
    "COMPLEX" CHAR(2) NOT NULL,

    CONSTRAINT "datasus_sih_tb_rd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "datasus_sia_tb_pa" (
    "id" SERIAL NOT NULL,
    "PA_MVM" CHAR(6) NOT NULL,
    "PA_CMP" CHAR(6) NOT NULL,
    "PA_PROC_ID" CHAR(10) NOT NULL,
    "PA_CODUNI" CHAR(7) NOT NULL,
    "PA_VALPRO" DECIMAL(20,2) NOT NULL,
    "PA_VALAPR" DECIMAL(20,2) NOT NULL,
    "PA_QTDPRO" DECIMAL(11,0) NOT NULL,
    "PA_QTDAPR" DECIMAL(11,0) NOT NULL,
    "PA_GESTAO" CHAR(6) NOT NULL,
    "PA_TPFIN" CHAR(2) NOT NULL,
    "PA_NIVCPL" CHAR(1) NOT NULL,

    CONSTRAINT "datasus_sia_tb_pa_pkey" PRIMARY KEY ("id")
);
