# Planejamento de Sprints

## Visão Geral

Desenvolvimento do client web para monitoramento de execuções de contratos da CPA, cruzando os dados de produção do DATASUS com o previsto nos Planos Operativos (SIGTAP).
**Stack Frontend:** Angular 22 (Zoneless/Standalone) e PrimeNG 22.1.

---

## Sprint 1: Fundação e Estrutura Base [x]

**Objetivo:** Levantar a base estrutural do client web, garantindo navegação, roteamento, temas e serviços de comunicação configurados de forma pragmática.

- **Setup do Angular 22:** Inicializar o projeto utilizando a arquitetura _Zoneless_ e exclusivamente _Standalone Components_.
- **Integração PrimeNG 22.1:** Configurar o tema base, tipografia e ícones.
- **Layout Base:** Criar a estrutura do `AppLayout` contendo:
  - Sidebar de navegação.
  - Topbar com seletor de competência global (mês/ano).
  - Área de renderização de conteúdo (`router-outlet`).
- **Core Services:** Desenvolver os serviços HTTP (utilizando a reatividade dos Signals do Angular) para o consumo futuro da API, já definindo as interfaces TypeScript com base no schema Prisma existente.

---

## Sprint 2: Gestão de Contratos e Instituições [x]

**Objetivo:** Disponibilizar a visualização das entidades prestadoras de serviço e seus respectivos vínculos jurídicos.

- **Módulo de Instituições:** Tela de listagem (`Instituicao`), exibindo em tabela o Nome, CNES e o Tipo (Filantrópico ou Empresa).
- **Módulo de Vínculos:** Tela de visualização dos contratos (`Vinculo`), destacando a vigência (Data de Início e Fim), Valor Total e relacionamento com aditivos.

---

## Sprint 3: Planos Operativos (O Coração do Pacto) [x]

**Objetivo:** Mapear e exibir o que foi efetivamente contratado e estabelecido para cada instituição de saúde.

- **Listagem de Planos:** Tela/Painel para visualizar o `PlanoOperativo` vigente atrelado a um vínculo.
- **Detalhe de Procedimentos:** Tabela PrimeNG listando os `PlanoOperativoProcedimento`, apresentando colunas claras para o Código SIGTAP, Nome do Procedimento e a Quantidade Pactuada Mensal.

---

## Sprint 4: Dashboard de Monitoramento (Executado vs Pactuado) [x]

**Objetivo:** Entrega de alto valor analítico. Cruzar os dados de produção reais com o planejamento contratual.

- **Visão Geral (Indicadores):** Cards métricos no topo da página apresentando Total Aprovado, Total Produzido e o % de Execução Geral da competência selecionada (consumindo a view consolidada `vw_producao_faturada_resumo_mensal`).
- **Painel Analítico Detalhado:** Tabela rica em dados baseada na view `vw_producao_faturada_por_procedimento`.
  - **Filtros Estratégicos:** Filtragem rápida por Competência, Instituição e Quadrimestre.
  - **Indicadores Visuais (Tags):** Utilização de componentes _Tag_ ou _Badge_ do PrimeNG para classificar visualmente o `status_execucao` (cores distintas para 'ACIMA', 'ABAIXO', 'DENTRO' e 'SEM_PACTO').
- **Análise Gráfica (Opcional):** Implementação de gráfico de barras com PrimeNG Charts comparando visualmente a "Quantidade Pactuada" e a "Quantidade Aprovada".

## Sprint 5: Módulo de Monitoramento e Refatoração de Layout [x]

**Objetivo:** Criar o módulo dedicado de "Monitoramento" para análise detalhada do cruzamento de dados (Pactuado vs. Executado) isolado por contrato/convênio. Além disso, refatorar o `AppLayout` para garantir uma experiência de navegação fluida com layout fixo e scroll restrito ao conteúdo da página.

---

### 1. Refatoração do Main Layout (Scroll Responsivo)

**Objetivo:** Melhorar a UX travando o layout principal (Sidebar e Topbar) e permitindo rolagem apenas na área de conteúdo.

- **Ajuste Global (CSS/SCSS):** Remover o scroll vertical e horizontal das tags `html` e `body` (`overflow: hidden; height: 100vh; width: 100vw;`).
- **Área de Conteúdo (Router Outlet):** Configurar o contêiner principal (que envolve o `<router-outlet>`) para ocupar a área restante da tela flexível (`flex-grow`, `height: 100%`) e aplicar `overflow-y: auto` e `overflow-x: hidden`.
- **Resultado Esperado:** Ao rolar uma tabela ou página longa, o menu lateral e o cabeçalho superior (Topbar com a competência) permanecem sempre visíveis e fixos na tela.

### 2. Criação do Módulo "Monitoramento"

**Objetivo:** Estruturar a nova rota e inseri-la na navegação principal.

- **Configuração de Rota:** Criar o componente _standalone_ `MonitoramentoComponent` e mapeá-lo no arquivo de rotas.
- **Navegação (Sidebar):** Adicionar o item "Monitoramento" no menu lateral da aplicação, com um ícone sugestivo (ex: `pi pi-chart-line` ou `pi pi-eye`).

### 3. Filtro e Seleção de Vínculo (Contrato/Convênio)

**Objetivo:** Permitir que o gestor escolha qual contrato ele deseja monitorar.

- **Seletor de Vínculo:** Implementar um componente de seleção (ex: `p-select` ou `p-dropdown` do PrimeNG) no topo da tela de Monitoramento.
- **Integração de Estado:** O seletor deve listar os contratos ativos e, ao selecionar um vínculo, disparar um _Signal_ no Angular que atualizará a grade de dados abaixo para buscar apenas os procedimentos daquele plano operativo específico.

### 4. Migração e Adaptação da Grade Analítica

**Objetivo:** Transferir a tabela de monitoramento detalhado do Dashboard (Sprint 4) para a nova tela.

- **Refatoração do Dashboard:** Remover a tabela detalhada do Dashboard principal, deixando-o apenas com os Cards de Indicadores (Visão Geral) e Gráficos macro.
- **Implementação na Tela de Monitoramento:**
  - Inserir a tabela rica de dados no novo módulo.
  - Garantir que a tabela cruze o **Plano Operativo Pactuado** com o **Executado (DATASUS)**, vinculada diretamente ao Contrato/Convênio selecionado.
  - Manter as tags/badges de status da execução ('ACIMA', 'ABAIXO', 'DENTRO', 'SEM_PACTO') e responsividade da tabela.

## Sprint 6: Aprofundamento Financeiro e Hierarquia SIGTAP [x]

**Objetivo:** Evoluir a grade analítica do módulo de monitoramento para exibir o impacto financeiro completo (Pactuado vs. Aprovado) e permitir a navegação estruturada pelos níveis hierárquicos do SIGTAP.

### 1. Inclusão do Financeiro Pactuado e Déficit

**Objetivo:** Cruzar o valor financeiro planejado com o executado diretamente na tabela.

- **Novas Colunas na Tabela:**
  - Adicionar a coluna **"Valor Pactuado"** (calculada pela _Meta Mensal Físico_ multiplicada pelo valor unitário do procedimento na tabela SIGTAP).
  - Adicionar a coluna **"Déficit/Saldo Financeiro"** (calculada pela diferença entre _Valor Aprovado_ e _Valor Pactuado_).
- **Indicadores Visuais:** Aplicar formatação condicional na coluna de Déficit (ex: vermelho para negativo/abaixo do pactuado, verde para positivo/acima).
- **Cards de Resumo:** Atualizar a área superior (onde hoje está "FÍSICO PACTUADO") para incluir também o "FINANCEIRO PACTUADO" total do mês.

### 2. Visualização Hierárquica (Grupo, Subgrupo e Procedimento)

**Objetivo:** Permitir que o gestor agrupe os dados de produção respeitando a estrutura do SIGTAP.

- **Refatoração da Tabela (UI):** Implementar controles de visualização para alternar entre "Lista Plana" (como é hoje) e "Visão Hierárquica".
- **Agrupamento de Dados (PrimeNG):** Utilizar o recurso de `RowGroup` (Subheader) do `p-table` ou migrar para o componente `p-treeTable` do PrimeNG.
  - **Nível 1:** Grupo SIGTAP (2 dígitos) com sumarização dos totais (físico e financeiro).
  - **Nível 2:** Subgrupo SIGTAP (4 dígitos) com sumarização.
  - **Nível 3:** Procedimento (10 dígitos) - nível folha com os detalhes atuais.
- **Ações:** Adicionar botões de "Expandir Todos" e "Recolher Todos" no cabeçalho da grade.

---

## Sprint 7: Análise Temporal Expandida (Recortes e Visão Global) [x]

**Objetivo:** Desacoplar a visualização de uma competência única (mês isolado), permitindo analisar a execução do plano operativo em períodos customizados ou em toda a vigência do contrato.

### 1. Refatoração do Seletor de Período (Topbar)

**Objetivo:** Substituir o seletor simples de mês/ano por um controle de escopo temporal mais robusto.

- **Novas Opções de Filtro:**
  - **Competência Específica:** (Comportamento atual, ex: 01/2024).
  - **Recorte de Tempo (Período):** Seleção de um intervalo (ex: Janeiro a Abril de 2024 - Quadrimestre).
  - **Globalmente:** Seleção de toda a vigência do contrato atual (Data de Início até Data de Fim).

### 2. Adaptação da Agregação Analítica (Frontend e Integração)

**Objetivo:** Garantir que os dados exibidos nos cards e na grade reflitam a soma do período selecionado.

- **Ajuste de Signals/Estado:** O Angular deve reagir à mudança do tipo de período e disparar a busca consolidada.
- **Comportamento da Grade:** Quando "Recorte" ou "Global" estiver selecionado:
  - A "Meta Mensal" deve se transformar em "Meta do Período" (Meta Mensal \* N meses selecionados).
  - As quantidades e valores aprovados (`Qtd Aprovada`, `Valor Aprovado`) devem ser o somatório de todas as competências contidas no escopo.
