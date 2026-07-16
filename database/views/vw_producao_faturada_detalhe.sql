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
  sia.pa_coduni                     AS cnes,
  i.nome                            AS nome_instituicao,
  uv.tipo_vinculo,

  -- Financiamento
  sia.pa_tpfin                      AS co_financiamento,
  fin.no_financiamento,

  -- Procedimento
  sia.pa_nivcpl                     AS complexidade,
  sia.pa_proc_id                    AS co_procedimento,
  proc.no_procedimento,

  -- Competência / Tempo
  sia.pa_cmp                        AS competencia,
  SUBSTRING(sia.pa_cmp, 1, 4)       AS ano,
  CAST(SUBSTRING(sia.pa_cmp, 5, 2) AS INTEGER) AS mes,
  CASE CAST(SUBSTRING(sia.pa_cmp, 5, 2) AS INTEGER)
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
    WHEN CAST(SUBSTRING(sia.pa_cmp, 5, 2) AS INTEGER) BETWEEN 1 AND 4 THEN 'Q1'
    WHEN CAST(SUBSTRING(sia.pa_cmp, 5, 2) AS INTEGER) BETWEEN 5 AND 8 THEN 'Q2'
    ELSE 'Q3'
  END                               AS quadrimestre,

  -- Valores
  sia.pa_qtdapr                     AS qtd_aprovada,
  sia.pa_valapr                     AS vlr_aprovado,
  sia.pa_qtdpro                     AS qtd_produzida,
  sia.pa_valpro                     AS vlr_produzido

FROM datasus_sia_tb_pa sia
LEFT JOIN instituicao i
  ON i.cnes = sia.pa_coduni
  AND i.deletado_em IS NULL
LEFT JOIN ultimo_vinculo uv
  ON uv.instituicao_id = i.id
LEFT JOIN sigtap_tb_financiamento fin
  ON fin.co_financiamento = sia.pa_tpfin
LEFT JOIN sigtap_tb_procedimento proc
  ON proc.co_procedimento = sia.pa_proc_id;
