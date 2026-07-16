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
