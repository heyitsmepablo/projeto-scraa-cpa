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

## Sprint 10: Implementação da API de Monitoramento (NestJS + Prisma + Swagger) [x]

**Objetivo Principal:** O frontend do módulo de Monitoramento já está construído no projeto. Sua tarefa como agente é analisar o frontend existente e o banco de dados, e então construir os endpoints do backend (NestJS) para fornecer os dados reais, substituindo os mocks.

---

### 1. Fase de Descoberta (Leitura Obrigatória)

- **Análise do Banco de Dados:** Leia o arquivo `schema.prisma` no diretório do backend. Identifique as relações entre Vínculo, Plano Operativo, Procedimentos (Pactuado) e a tabela de Produção do DATASUS (Executado).
- **Análise do Frontend:** Inspecione os componentes e serviços do Angular (módulo de Monitoramento). Entenda o formato exato da resposta JSON que a UI espera para renderizar os _Cards de Resumo_ e a _Árvore Hierárquica do SIGTAP_.

### 2. Implementação do Backend (NestJS)

- **Estrutura:** Crie o `MonitoramentoModule`, `MonitoramentoController` e `MonitoramentoService`.
- **Regras de Consulta (Prisma):** Utilize o `PrismaService` para realizar as buscas. Realize o cruzamento (Join/GroupBy) entre a meta pactuada vigente e a produção aprovada pelo DATASUS.
- **Endpoints Exigidos:**
  - `GET /api/monitoramento/:vinculoId/resumo`: Retorna os totais consolidados (Físico Pactuado, Físico Aprovado, Financeiro Pactuado, Financeiro Aprovado e Saldo/Déficit).
  - `GET /api/monitoramento/:vinculoId/analitico`: Retorna a grade estruturada em níveis hierárquicos (Grupo SIGTAP -> Subgrupo SIGTAP -> Procedimentos), incluindo a consolidação matemática (diferenças) em cada nível.
- **Inteligência de Filtros:** Os métodos devem aceitar _Query Parameters_ (`mesAno`, `dataInicio`, `dataFim`). Se um período for informado, multiplique a meta física/financeira mensal pelo número de meses do recorte para que a comparação seja justa.

### 3. Documentação e Tipagem (OpenAPI/Swagger)

- **DTOs de Entrada e Saída:** Crie DTOs para receber os filtros e formatar as respostas, utilizando `class-validator`.
- **Decorators do Swagger:** Documente exaustivamente todos os endpoints criados usando `@ApiTags`, `@ApiOperation`, `@ApiParam`, `@ApiQuery` e `@ApiResponse`. Cada propriedade dos DTOs de saída deve ter seu `@ApiProperty` com descrição clara.

### 4. Restrições e Padrões

- **Sem Mocks:** Não gere dados aleatórios. A lógica deve buscar os dados estritamente do Prisma.
- **Arquitetura:** Mantenha os controladores limpos; toda a regra de agrupamento e matemática financeira deve residir no `MonitoramentoService`.
- **Resiliência:** Implemente tratamento de erros padrão do NestJS (ex: disparar `NotFoundException` se o UUID do vínculo for inválido ou não possuir um Plano Operativo ativo).

## Sprint 11: Geração Dinâmica da API Core baseada no Frontend e Schema [x]

**Objetivo Principal:** A API de Monitoramento foi iniciada na Sprint anterior. Sua tarefa agora não é seguir uma lista predeterminada de rotas, mas sim agir autonomamente para **varrer o código do frontend existente**, cruzar as necessidades de dados com o **schema do Prisma**, e elaborar/implementar todas as rotas faltantes no backend (NestJS) para que a aplicação funcione de ponta a ponta sem dados _mockados_.

---

### 1. Fase de Mapeamento e Descoberta (Obrigatório)

Antes de escrever qualquer código no backend, você deve mapear as dependências do projeto:

- **Varredura do Frontend (Angular):** Inspecione a pasta do frontend. Busque por todos os arquivos `*.service.ts`, diretórios de `mocks`, chamadas ao `HttpClient` e definições de `Interfaces/Tipagens` (ex: telas de Instituições, Vínculos, Planos Operativos e Dashboard).
- **Identificação de Contratos:** Para cada tela ou componente principal, identifique qual estrutura de JSON o frontend espera receber e quais parâmetros ele envia (filtros, paginação, IDs).
- **Varredura do Banco de Dados:** Analise o arquivo `schema.prisma`. Entenda perfeitamente as tabelas, campos, relacionamentos e chaves estrangeiras disponíveis.

### 2. Elaboração Dinâmica das Rotas

A partir da descoberta da Etapa 1, deduza a arquitetura da API:

- Desenhe a estrutura RESTful necessária para satisfazer o frontend. Se o frontend possui uma tela que lista "Vínculos" cruzados com "Instituições", planeje uma rota que forneça esse payload consolidado.
- Crie os módulos faltantes no NestJS correspondentes aos domínios encontrados (ex: `InstituicaoModule`, `VinculoModule`, `PlanoOperativoModule`, `DashboardModule`, `SigtapModule`, `DataSUSModule`).

### 3. Implementação do Backend (NestJS + Prisma)

Codifique a infraestrutura da API deduzida na etapa anterior:

- **Controladores e Serviços:** Crie os Controllers para expor as rotas e os Services para concentrar a regra de negócio e consultas ao banco.
- **Consultas Reais:** Utilize injeção de dependência do `PrismaService` para buscar os dados. Remova qualquer dependência de mocks.
- **Otimização:** Aplique projeções (`select`) e carregamento de relações (`include`) no Prisma estritamente conforme a necessidade do frontend mapeada na Etapa 1, evitando _overfetching_ (trazer dados inúteis) ou _underfetching_ (causar _N+1 queries_).

### 4. Tipagem e Documentação Automática (Swagger)

- **DTOs de Validação:** Crie DTOs para todas as requisições (filtros, paginação, bodies de criação/edição se aplicável) utilizando `class-validator`.
- **OpenAPI:** Documente exaustivamente todas as rotas deduzidas e implementadas utilizando os decorators nativos do NestJS Swagger (`@ApiTags()`, `@ApiOperation()`, `@ApiResponse()`, `@ApiQuery()`).
- **Modelos de Resposta:** Garanta que as propriedades dos DTOs de saída possuam `@ApiProperty()` para que o Swagger reflita exatamente os contratos mapeados na Etapa 1.

## Sprint 12: Implementação da API de Domínio SIGTAP (Dropdowns e Filtros) [x]

**Objetivo Principal:** O frontend possui diversos filtros e formulários que utilizam componentes de seleção (dropdowns, selects, autocompletes) baseados na tabela SUS (SIGTAP). Sua tarefa é varrer o frontend para identificar esses pontos de seleção, cruzar com o banco de dados e construir as rotas otimizadas no backend (NestJS) para alimentar essas listas.

---

### 1. Fase de Descoberta (Selects e Schema)

- **Mapeamento de Componentes (Frontend):** Varra os arquivos HTML e TypeScript do frontend (Angular). Busque por componentes de seleção do PrimeNG (como `p-dropdown`, `p-select`, `p-autoComplete`, `p-multiSelect`) que façam referência a dados do SIGTAP (ex: Filtros de Grupo, Subgrupo, Forma de Organização, Procedimentos, Complexidade, etc.).
- **Mapeamento de Contratos:** Para cada select encontrado, identifique o formato exato que o frontend espera receber (ex: espera um array de objetos `{ id, nome }` ou `{ codigo, descricao }`?).
- **Mapeamento do Banco (Prisma):** Analise o arquivo `schema.prisma`. Identifique as tabelas de domínio que compõem o dicionário do SIGTAP e entenda seus relacionamentos (hierarquia: Grupo -> Subgrupo -> Forma de Organização -> Procedimento).

### 2. Elaboração e Estruturação das Rotas (SigtapModule)

A partir da descoberta, crie o `SigtapModule` no NestJS. Desenhe a estrutura de rotas suportando paginação, busca por texto e **seleção em cascata** (cascading dropdowns).

- _Exemplo de arquitetura esperada:_
  - `GET /api/sigtap/grupos`: Lista todos os grupos.
  - `GET /api/sigtap/subgrupos`: Lista subgrupos (deve aceitar `?grupoCodigo=` para filtrar em cascata).
  - `GET /api/sigtap/procedimentos`: Rota de busca (autocomplete) otimizada, aceitando `?busca=` (pesquisa por código ou nome) e `?complexidade=`.

### 3. Implementação Otimizada (PrismaService)

- **Payloads Leves:** Como essas rotas alimentam componentes de interface (UI), é estritamente proibido retornar a entidade inteira do banco de dados (que pode ser pesada). Utilize a cláusula `select` do Prisma para retornar apenas os campos estritamente necessários para os dropdowns (ex: apenas `codigo` e `descricao`).
- **Busca Textual (Filtros):** Para a rota de procedimentos, implemente a busca usando o operador `contains` (com `mode: 'insensitive'`) no Prisma para permitir que o usuário digite parte do nome ou do código do procedimento no frontend.
- **Cache (Opcional/Recomendado):** Como os dados do SIGTAP são estáticos (dicionário), avalie a inclusão de cache em memória básica no serviço para não sobrecarregar o banco de dados em requisições repetitivas dos dropdowns.

### 4. Documentação OpenAPI (Swagger)

- **DTOs e Query Params:** Crie DTOs (`@Query()`) usando `class-validator` para validar os parâmetros de busca em cascata (ex: garantir que `grupoCodigo` seja opcional, mas válido se enviado).
- **Especificação Swagger:** Decore todos os endpoints do `SigtapController` com `@ApiTags('SIGTAP (Dicionários)')`, `@ApiOperation` explicando qual dropdown a rota alimenta, `@ApiQuery` para os filtros opcionais e `@ApiResponse` contendo os schemas de retorno tipados.

## Task: Sprint 13 - Refatoração e Otimização de Scripts Python (ETL) [x]

**Objetivo Principal:** Analisar todos os scripts Python de extração de dados e reescrevê-los para garantir a arquitetura mais performática, concisa e organizada possível. O foco é otimizar o consumo de memória, tempo de execução e garantir a inserção cirúrgica de dados no banco.

### 1. Auditoria e Arquitetura Base (Utils)

- Analise todos os scripts Python existentes no diretório atual.
- Isole as funções transversais e repetitivas (gerenciamento de conexão com banco, formatação de strings, logs) em arquivos utilitários consolidados (`utils`).
- Estruture o código de forma modular e tipada, facilitando a execução limpa via linha de comando ou orquestradores (como CRON).

### 2. Otimização por Domínio de Extração

- **Módulo CPA (Planilhas):** Implemente a leitura em lote de planilhas utilizando bibliotecas de alta performance (como `pandas`), higienizando as colunas antes da persistência no banco de dados.
- **Módulo DATASUS (Pré-Filtro Inteligente):** Configure o script para, antes da extração, consultar o banco de dados atual e mapear todas as instituições e seus respectivos procedimentos ativos nos Planos Operativos.
- **Módulo DATASUS (Extração Cirúrgica):** Extraia e insira no banco de dados _estritamente_ a produção aprovada que corresponda aos procedimentos mapeados no passo anterior, descartando qualquer volume de dados não utilizado pelo sistema.
- **Módulo SIGTAP (Carga Mensal):** Desenvolva a rotina para atualizar a competência mensal da tabela SIGTAP, utilizando operações de "Upsert" para atualizar descrições e valores financeiros sem gerar duplicação de códigos existentes.

### 3. Engenharia de Performance e Confiabilidade

- Elimine laços de repetição que fazem inserções linha a linha; utilize estritamente operações de _Bulk Insert_ ou métodos otimizados em lote.
- Implemente um bloco de tratamento de exceções robusto (try/catch) para evitar que a falha em um arquivo corrompa toda a fila de processamento.
- Exiba logs sumarizados ao final da execução informando tempo total, registros inseridos e registros ignorados (especialmente no DATASUS).
