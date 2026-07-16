-- Migration SQL for creating production billed views

-- 1. View de Detalhes
CREATE OR REPLACE VIEW vw_producao_faturada_detalhe AS
WITH ultimo_vinculo AS (
    SELECT DISTINCT ON (instituicao_id)
        instituicao_id,
        tipo_vinculo,
        data_inicio,
        data_fim
    FROM vinculo
    WHERE deletado_em IS NULL
    ORDER BY instituicao_id, data_inicio DESC
)
SELECT
  -- Contrato/Vínculo
  CASE uv.tipo_vinculo
    WHEN 'CONTRATO' THEN 'CONTRATADO'
    WHEN 'CONVÊNIO' THEN 'CONVENIADO'
    ELSE 'PRÓPRIO'
  END AS tipo_contrato,

  -- Instituição
  sia."PA_CODUNI"                   AS cnes,
  i.nome                            AS nome_instituicao,
  uv.tipo_vinculo,

  -- Financiamento
  sia."PA_TPFIN"                    AS co_financiamento,
  fin.no_financiamento,

  -- Procedimento
  sia."PA_NIVCPL"                   AS complexidade,
  sia."PA_PROC_ID"                  AS co_procedimento,
  proc.no_procedimento,

  -- Competência / Tempo
  sia."PA_CMP"                      AS competencia,
  SUBSTRING(sia."PA_CMP", 1, 4)     AS ano,
  CAST(SUBSTRING(sia."PA_CMP", 5, 2) AS INTEGER) AS mes,
  CASE CAST(SUBSTRING(sia."PA_CMP", 5, 2) AS INTEGER)
    WHEN 1 THEN 'janeiro'
    WHEN 2 THEN 'fevereiro'
    WHEN 3 THEN 'março'
    WHEN 4 THEN 'abril'
    WHEN 5 THEN 'maio'
    WHEN 6 THEN 'junho'
    WHEN 7 THEN 'julho'
    WHEN 8 THEN 'agosto'
    WHEN 9 THEN 'setembro'
    WHEN 10 THEN 'outubro'
    WHEN 11 THEN 'novembro'
    WHEN 12 THEN 'dezembro'
  END AS nome_mes,
  CASE
    WHEN CAST(SUBSTRING(sia."PA_CMP", 5, 2) AS INTEGER) BETWEEN 1 AND 4 THEN 'Q1'
    WHEN CAST(SUBSTRING(sia."PA_CMP", 5, 2) AS INTEGER) BETWEEN 5 AND 8 THEN 'Q2'
    ELSE 'Q3'
  END                               AS quadrimestre,

  -- Valores
  sia."PA_QTDAPR"                   AS qtd_aprovada,
  sia."PA_VALAPR"                   AS vlr_aprovado,
  sia."PA_QTDPRO"                   AS qtd_produzida,
  sia."PA_VALPRO"                   AS vlr_produzido

FROM datasus_sia_tb_pa sia
LEFT JOIN instituicao i
  ON i.cnes = sia."PA_CODUNI"
  AND i.deletado_em IS NULL
LEFT JOIN ultimo_vinculo uv
  ON uv.instituicao_id = i.id
LEFT JOIN sigtap_tb_financiamento fin
  ON fin.co_financiamento = sia."PA_TPFIN"
LEFT JOIN sigtap_tb_procedimento proc
  ON proc.co_procedimento = sia."PA_PROC_ID";

-- 2. View de Resumo Mensal
CREATE OR REPLACE VIEW vw_producao_faturada_resumo_mensal AS
SELECT
  competencia,
  ano,
  mes,
  nome_mes,
  quadrimestre,
  tipo_contrato,
  cnes,
  nome_instituicao,
  co_financiamento,
  no_financiamento,
  complexidade,
  SUM(qtd_aprovada) AS total_freq,
  SUM(vlr_aprovado) AS total_vlr_aprovado,
  SUM(vlr_produzido) AS total_vlr_produzido
FROM vw_producao_faturada_detalhe
GROUP BY
  competencia,
  ano,
  mes,
  nome_mes,
  quadrimestre,
  tipo_contrato,
  cnes,
  nome_instituicao,
  co_financiamento,
  no_financiamento,
  complexidade;

-- 3. View por Procedimento (Pactuado vs Realizado)
CREATE OR REPLACE VIEW vw_producao_faturada_por_procedimento AS
WITH ultimo_plano_vigente AS (
    SELECT DISTINCT ON (v.instituicao_id)
        v.instituicao_id,
        po.id as plano_operativo_id
    FROM vinculo v
    INNER JOIN plano_operativo po ON po.vinculo_id = v.id
    WHERE v.deletado_em IS NULL
      AND po.deletado_em IS NULL
      AND po.vigente = true
    ORDER BY v.instituicao_id, po.criado_em DESC
),
pactuado AS (
    SELECT
        upv.instituicao_id,
        pop.co_procedimento,
        SUM(pop.quantidade_pactuada_mensal) as qtd_pactuada_mensal
    FROM ultimo_plano_vigente upv
    INNER JOIN plano_operativo_procedimento pop ON pop.plano_operativo_id = upv.plano_operativo_id
    WHERE pop.deletado_em IS NULL
    GROUP BY upv.instituicao_id, pop.co_procedimento
)
SELECT
  d.competencia,
  d.ano,
  d.mes,
  d.nome_mes,
  d.quadrimestre,
  d.tipo_contrato,
  d.cnes,
  d.nome_instituicao,
  d.tipo_vinculo,
  d.co_financiamento,
  d.no_financiamento,
  d.complexidade,
  d.co_procedimento,
  d.no_procedimento,
  
  -- Valores do resumo
  SUM(d.qtd_aprovada) AS qtd_aprovada,
  SUM(d.vlr_aprovado) AS vlr_aprovado,
  SUM(d.qtd_produzida) AS qtd_produzida,
  SUM(d.vlr_produzido) AS vlr_produzido,
  
  -- Pactuado
  MAX(p.qtd_pactuada_mensal) AS qtd_pactuada_mensal,
  
  -- Cálculos
  CASE 
    WHEN MAX(p.qtd_pactuada_mensal) IS NULL OR MAX(p.qtd_pactuada_mensal) = 0 THEN NULL
    ELSE ROUND((SUM(d.qtd_aprovada) / MAX(p.qtd_pactuada_mensal) * 100), 2)
  END AS perc_execucao,
  
  CASE
    WHEN MAX(p.qtd_pactuada_mensal) IS NULL THEN 'SEM_PACTO'
    WHEN SUM(d.qtd_aprovada) < MAX(p.qtd_pactuada_mensal) THEN 'ABAIXO'
    WHEN SUM(d.qtd_aprovada) > MAX(p.qtd_pactuada_mensal) THEN 'ACIMA'
    ELSE 'DENTRO'
  END AS status_execucao

FROM vw_producao_faturada_detalhe d
LEFT JOIN instituicao i ON i.cnes = d.cnes AND i.deletado_em IS NULL
LEFT JOIN pactuado p ON p.instituicao_id = i.id AND p.co_procedimento = d.co_procedimento
GROUP BY
  d.competencia, d.ano, d.mes, d.nome_mes, d.quadrimestre,
  d.tipo_contrato, d.cnes, d.nome_instituicao, d.tipo_vinculo,
  d.co_financiamento, d.no_financiamento, d.complexidade,
  d.co_procedimento, d.no_procedimento;