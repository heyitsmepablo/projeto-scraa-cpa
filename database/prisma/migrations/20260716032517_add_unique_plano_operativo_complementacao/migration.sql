/*
  Warnings:

  - A unique constraint covering the columns `[plano_operativo_id,complementacao_item_id]` on the table `plano_operativo_complementacao` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "plano_operativo_complementacao_plano_operativo_id_complemen_key" ON "plano_operativo_complementacao"("plano_operativo_id", "complementacao_item_id");
