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
