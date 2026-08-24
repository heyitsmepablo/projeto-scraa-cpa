# Planejamento de Sprints

## Visão Geral

Desenvolvimento do client web para monitoramento de execuções de contratos da CPA, cruzando os dados de produção do DATASUS com o previsto nos Planos Operativos (SIGTAP).
**Stack Frontend:** Angular 22 (Zoneless/Standalone) e PrimeNG 22.1.

---

## Sprint 1: Fundação e Estrutura Base

**Objetivo:** Levantar a base estrutural do client web, garantindo navegação, roteamento, temas e serviços de comunicação configurados de forma pragmática.

- **Setup do Angular 22:** Inicializar o projeto utilizando a arquitetura _Zoneless_ e exclusivamente _Standalone Components_.
- **Integração PrimeNG 22.1:** Configurar o tema base, tipografia e ícones.
- **Layout Base:** Criar a estrutura do `AppLayout` contendo:
  - Sidebar de navegação.
  - Topbar com seletor de competência global (mês/ano).
  - Área de renderização de conteúdo (`router-outlet`).
- **Core Services:** Desenvolver os serviços HTTP (utilizando a reatividade dos Signals do Angular) para o consumo futuro da API, já definindo as interfaces TypeScript com base no schema Prisma existente.

---

## Sprint 2: Gestão de Contratos e Instituições

**Objetivo:** Disponibilizar a visualização das entidades prestadoras de serviço e seus respectivos vínculos jurídicos.

- **Módulo de Instituições:** Tela de listagem (`Instituicao`), exibindo em tabela o Nome, CNES e o Tipo (Filantrópico ou Empresa).
- **Módulo de Vínculos:** Tela de visualização dos contratos (`Vinculo`), destacando a vigência (Data de Início e Fim), Valor Total e relacionamento com aditivos.

---

## Sprint 3: Planos Operativos (O Coração do Pacto)

**Objetivo:** Mapear e exibir o que foi efetivamente contratado e estabelecido para cada instituição de saúde.

- **Listagem de Planos:** Tela/Painel para visualizar o `PlanoOperativo` vigente atrelado a um vínculo.
- **Detalhe de Procedimentos:** Tabela PrimeNG listando os `PlanoOperativoProcedimento`, apresentando colunas claras para o Código SIGTAP, Nome do Procedimento e a Quantidade Pactuada Mensal.

---

## Sprint 4: Dashboard de Monitoramento (Executado vs Pactuado)

**Objetivo:** Entrega de alto valor analítico. Cruzar os dados de produção reais com o planejamento contratual.

- **Visão Geral (Indicadores):** Cards métricos no topo da página apresentando Total Aprovado, Total Produzido e o % de Execução Geral da competência selecionada (consumindo a view consolidada `vw_producao_faturada_resumo_mensal`).
- **Painel Analítico Detalhado:** Tabela rica em dados baseada na view `vw_producao_faturada_por_procedimento`.
  - **Filtros Estratégicos:** Filtragem rápida por Competência, Instituição e Quadrimestre.
  - **Indicadores Visuais (Tags):** Utilização de componentes _Tag_ ou _Badge_ do PrimeNG para classificar visualmente o `status_execucao` (cores distintas para 'ACIMA', 'ABAIXO', 'DENTRO' e 'SEM_PACTO').
- **Análise Gráfica (Opcional):** Implementação de gráfico de barras com PrimeNG Charts comparando visualmente a "Quantidade Pactuada" e a "Quantidade Aprovada".
