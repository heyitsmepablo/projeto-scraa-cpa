-- AlterTable
ALTER TABLE "datasus_sia_tb_pa" ADD COLUMN     "PA_CNPJCPF" VARCHAR(14),
ADD COLUMN     "PA_SUBFIN" VARCHAR(4);

-- AlterTable
ALTER TABLE "datasus_sih_tb_rd" ADD COLUMN     "DIAG_PRINC" VARCHAR(4),
ADD COLUMN     "PROC_SOLIC" CHAR(10),
ALTER COLUMN "DI_INTER" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "datasus_sia_tb_pa_PA_CODUNI_PA_CMP_idx" ON "datasus_sia_tb_pa"("PA_CODUNI", "PA_CMP");

-- CreateIndex
CREATE INDEX "datasus_sih_tb_rd_CNES_ANO_CMPT_MES_CMPT_idx" ON "datasus_sih_tb_rd"("CNES", "ANO_CMPT", "MES_CMPT");
