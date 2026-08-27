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

## Sprint 8: Refinamento do Controle Temporal, UX da Grade e Correções [x]

**Objetivo:** Consolidar o controle de tempo no cabeçalho principal (Topbar) utilizando seletores nativos de mês, aprimorar a usabilidade da árvore hierárquica do SIGTAP (retomando o padrão visual de badges) e corrigir os comportamentos de filtros e expansão da grade.

---

### 1. Novo Seletor de Tempo (Topbar e Main Layout)

**Objetivo:** Centralizar a seleção de período no header do layout principal e simplificar a navegação.

- **Substituição:** Remover o botão de competência atual e implementar o novo seletor de Análise Temporal diretamente no header do `AppLayout`.
- **Remoção de Redundâncias:** Remover os botões de seta lateral (`<` e `>`) de avançar/voltar meses.
- **Componente Base:** Implementar o `p-datepicker` do PrimeNG configurado estritamente como `monthpicker` (exibindo apenas os meses e anos disponíveis com dados).
- **Comportamento Padrão:** Ao carregar a aplicação (inclusive no Dashboard), o sistema deve identificar e selecionar automaticamente o mês/ano mais recente que possua dados disponíveis.

### 2. Ajustes no Popover de Análise Temporal

**Objetivo:** Enxugar o modal de seleção de período, focando em usabilidade direta.

- **Aba "Recorte Temporal":**
  - Remover totalmente a seção de "Atalhos Rápidos" (Quadrimestres, Semestres, etc.).
  - Manter apenas os campos de "De (Início)" e "Até (Fim)", ambos utilizando o `p-datepicker` (modo monthpicker).
- **Aba "Vigência Global":**
  - Ajustar a regra de negócio: a seleção global deve projetar automaticamente o período considerando a data de início do contrato (buscando o mês mais antigo com dados a partir dessa data) até a data fim do contrato (limitado ao mês mais recente com dados disponíveis).

### 3. UX e Reorganização da Grade Analítica (Árvore SIGTAP)

**Objetivo:** Melhorar a legibilidade da tabela hierárquica e agrupar os controles de visualização.

- **Refatoração das Badges SIGTAP:**
  - Reverter o estilo visual das badges de Grupo e Subgrupo para o padrão anterior.
  - A badge deve conter a nomenclatura completa em seu interior (ex: `[GRUPO 03]` com fundo escuro e `[SUBGRUPO 03.01]` com fundo claro).
  - Remover as palavras "Grupo" e "Subgrupo" da coluna de texto adjacente, deixando apenas o nome do descritivo.
  - Ajustar o tamanho das tags e o CSS para evitar as quebras de linha na tabela.
- **Reposicionamento do Toggle de Visualização:**
  - Remover o controle de alternância ("Lista Plana" / "Árvore SIGTAP") do cabeçalho superior.
  - Mover este toggle para ficar alinhado ao lado dos botões "Expandir Todos" e "Recolher Todos", centralizando os controles da grade em um único local da UI.

### 4. Correções de Bugs (Fixes)

**Objetivo:** Restaurar a funcionalidade completa da grade de dados.

- **Limpeza de UI nos Filtros:** Remover os botões de seta/ordenação de dentro dos filtros (status e complexidade), pois são redundantes com a ordenação nativa das colunas.
- **Fix nos Filtros:** Investigar e corrigir o bug que impede o funcionamento correto da filtragem de Status da Meta e Complexidade.
- **Fix na Expansão/Retração:** Corrigir a funcionalidade dos botões "Expandir Todos" e "Recolher Todos", garantindo que eles abram ou fechem todos os níveis (Grupo e Subgrupo) da árvore SIGTAP corretamente.

## Sprint 9: Contextualização do Controle Temporal e Refinamentos de UI [x]

**Objetivo:** Tornar o seletor de Análise Temporal (Topbar) inteligente e ciente do contexto da rota atual, corrigir o cálculo de vigência global dos contratos e otimizar a visualização padrão da árvore SIGTAP.

---

### 1. Seletor Temporal Contextual (Context-Aware Topbar)

**Objetivo:** Fazer com que o popover de Análise Temporal adapte suas opções e mensagens dependendo da página (rota) ativa.

- **Inteligência de Rota:** O componente do Topbar deve escutar as mudanças de rota da aplicação.
- **Comportamento no Dashboard:** Na aba "Vigência Global", a mensagem e o comportamento devem refletir a visão agregada de _todos os vínculos_ da base de dados.
- **Comportamento no Monitoramento:** Na aba "Vigência Global", o componente deve recuperar (via Signal ou serviço de estado) as informações do Vínculo atualmente selecionado na tela de Monitoramento.

### 2. Correção da Vigência Global no Monitoramento (Fix)

**Objetivo:** Garantir que o texto explicativo e a regra de consolidação reflitam exatamente o contrato selecionado.

- **Ajuste de Projeção:** Corrigir a mensagem estática atual (que exibe incorretamente um intervalo fixo, ex: "48 meses / 2023 a 2026").
- **Cálculo Dinâmico:** A mensagem deve calcular a diferença em meses dinamicamente com base na `Data de Início` e `Data Fim` do contrato selecionado no dropdown da página, limitando a busca ao período que efetivamente possui dados do DATASUS processados.

### 3. Limpeza de Redundâncias no Dashboard

**Objetivo:** Simplificar a interface do Dashboard agora que o controle de tempo está centralizado no Topbar.

- **Remoção de Filtro:** Remover o filtro de "QUADRIMESTRE" que fica ao lado do seletor de estabelecimentos na view principal do Dashboard Executivo.
- O filtro temporal (seja mês específico ou recorte) passa a ser ditado exclusivamente pelo controle no Topbar.

### 4. Estado Padrão da Árvore SIGTAP

**Objetivo:** Melhorar a legibilidade inicial da grade de monitoramento.

- **Recolhimento Padrão:** Configurar o componente da tabela hierárquica (PrimeNG) para carregar com todos os Grupos e Subgrupos _recolhidos_ (collapsed) por padrão.
- O usuário visualizará apenas os totais dos Grupos (Nível 1) ao abrir a tela, utilizando os botões de expansão ou clicando nas setas apenas quando quiser detalhar os procedimentos.
