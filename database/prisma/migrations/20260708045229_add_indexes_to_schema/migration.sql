-- CreateIndex
CREATE INDEX "aditivo_vinculo_id_idx" ON "aditivo"("vinculo_id");

-- CreateIndex
CREATE INDEX "aditivo_numero_idx" ON "aditivo"("numero");

-- CreateIndex
CREATE INDEX "instituicao_cnes_idx" ON "instituicao"("cnes");

-- CreateIndex
CREATE INDEX "instituicao_cnpj_idx" ON "instituicao"("cnpj");

-- CreateIndex
CREATE INDEX "plano_operativo_vinculo_id_idx" ON "plano_operativo"("vinculo_id");

-- CreateIndex
CREATE INDEX "plano_operativo_aditivo_id_idx" ON "plano_operativo"("aditivo_id");

-- CreateIndex
CREATE INDEX "plano_operativo_procedimento_co_procedimento_idx" ON "plano_operativo_procedimento"("co_procedimento");

-- CreateIndex
CREATE INDEX "sigtap_tb_componente_rede_co_rede_atencao_idx" ON "sigtap_tb_componente_rede"("co_rede_atencao");

-- CreateIndex
CREATE INDEX "sigtap_tb_procedimento_co_financiamento_idx" ON "sigtap_tb_procedimento"("co_financiamento");

-- CreateIndex
CREATE INDEX "sigtap_tb_procedimento_co_rubrica_idx" ON "sigtap_tb_procedimento"("co_rubrica");

-- CreateIndex
CREATE INDEX "sigtap_tb_procedimento_dt_competencia_idx" ON "sigtap_tb_procedimento"("dt_competencia");

-- CreateIndex
CREATE INDEX "vinculo_instituicao_id_idx" ON "vinculo"("instituicao_id");

-- CreateIndex
CREATE INDEX "vinculo_numero_idx" ON "vinculo"("numero");
