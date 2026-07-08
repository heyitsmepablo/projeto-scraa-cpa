/*
  Warnings:

  - The primary key for the `sigtap_tb_forma_organizacao` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `sigtap_tb_servico_classificacao` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `sigtap_tb_sub_grupo` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "sigtap_tb_forma_organizacao" DROP CONSTRAINT "sigtap_tb_forma_organizacao_pkey",
ADD CONSTRAINT "sigtap_tb_forma_organizacao_pkey" PRIMARY KEY ("co_grupo", "co_sub_grupo", "co_forma_organizacao");

-- AlterTable
ALTER TABLE "sigtap_tb_servico_classificacao" DROP CONSTRAINT "sigtap_tb_servico_classificacao_pkey",
ADD CONSTRAINT "sigtap_tb_servico_classificacao_pkey" PRIMARY KEY ("co_servico", "co_classificacao");

-- AlterTable
ALTER TABLE "sigtap_tb_sub_grupo" DROP CONSTRAINT "sigtap_tb_sub_grupo_pkey",
ADD CONSTRAINT "sigtap_tb_sub_grupo_pkey" PRIMARY KEY ("co_grupo", "co_sub_grupo");
