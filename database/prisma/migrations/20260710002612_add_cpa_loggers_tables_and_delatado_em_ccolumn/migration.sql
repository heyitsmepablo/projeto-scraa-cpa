-- AlterTable
ALTER TABLE "aditivo" ADD COLUMN     "deletado_em" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "instituicao" ADD COLUMN     "deletado_em" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "plano_operativo" ADD COLUMN     "deletado_em" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "plano_operativo_procedimento" ADD COLUMN     "deletado_em" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "vinculo" ADD COLUMN     "deletado_em" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "cpa_importacao" (
    "id" SERIAL NOT NULL,
    "competencia" CHAR(6) NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_fim" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL,
    "tabelas_afetadas" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cpa_importacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cpa_importacao_changelog" (
    "id" SERIAL NOT NULL,
    "importacao_id" INTEGER NOT NULL,
    "tabela" VARCHAR(50) NOT NULL,
    "chave_registro" VARCHAR(50) NOT NULL,
    "descricao_registro" TEXT,
    "tipo_operacao" "TipoOperacao" NOT NULL,
    "dados_antigos" JSONB,
    "dados_novos" JSONB,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cpa_importacao_changelog_pkey" PRIMARY KEY ("id")
);
