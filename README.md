# Projeto SCRAA-CPA

**Sistema de Controle e Registro de Acompanhamento Administrativo - Controle de Planos Operativos e Auditoria (SCRAA-CPA)**

Plataforma integrada para gestão contratual, faturamento, auditoria e acompanhamento de planos operativos entre instituições de saúde e a administração pública, integrada de forma contínua às bases de dados oficiais do SUS (SIGTAP e DATASUS SIA/SIH).

---

## 🏛️ Estrutura do Monorepo

O repositório é organizado no formato monorepo com módulos desacoplados:

- **[`/client/web`](./client/web/)**: Interface de usuário web construída em **Angular 22** com arquitetura moderna baseada em Signals, PrimeNG 22, TailwindCSS 4 e testes automatizados com Vitest.
- **[`/database`](./database/)**: Modelagem relacional, schemas e migrações de banco de dados com **Prisma ORM** e **PostgreSQL 18**.
- **[`/scripts/sync_sigtap`](./scripts/sync_sigtap/)**: Pipeline ETL em Python para extração e sincronização contínua das tabelas oficiais do SIGTAP via FTP do DATASUS, com versionamento e histórico de alterações (changelog).
- **[`/scripts/sync_cpa_data`](./scripts/sync_cpa_data/)**: Pipeline ETL para importação e atualização de cadastros de instituições, vínculos e metas de planos operativos a partir de planilhas locais.
- **[`/scripts/sync_datasus`](./scripts/sync_datasus/)**: Módulo de automação para download, descompressão e ingestão de dados de produção ambulatorial e hospitalar (SIA/SIH) do DATASUS.
- **[`/scripts/utils/format_and_validate_cpa_data`](./scripts/utils/format_and_validate_cpa_data/)**: Scripts utilitários para higienização, formatação e validação prévia de planilhas de dados.
- **[`/.agents`](./.agents/)**: Definições de agentes autônomos, personas e regras de orquestração do projeto.

---

## 🛠️ Stack Tecnológica

### Frontend (Client Web)
- **Framework:** Angular 22 (Standalone Components, Zoneless / Signals, Inject API)
- **Componentes & UI:** PrimeNG 22, PrimeIcons, TailwindCSS 4
- **Gráficos & Dashboards:** Chart.js
- **Testes Unitários:** Vitest & JSDOM

### Backend & Banco de Dados
- **Banco de Dados:** PostgreSQL 18
- **ORM:** Prisma
- **Containers:** Docker & Docker Compose (PostgreSQL + PgAdmin)

### ETL & Processamento de Dados
- **Linguagem & Gestão:** Python 3.13+, Poetry
- **Processamento:** Pandas, PySUS, Requests, SQLAlchemy

### CI/CD & Versionamento
- **Versionamento Semântico:** Semantic Release
- **Integração Contínua:** GitHub Actions

---

## 🚀 Como Iniciar

### 1. Configuração de Variáveis de Ambiente
O projeto adota um arquivo `.env` centralizado na raiz:

```bash
# Copie o template de ambiente
cp .env.example .env

# Configure as credenciais de banco de dados e URLs necessárias
```

### 2. Infraestrutura Local (Docker)
Suba os containers do PostgreSQL e PgAdmin:

```bash
docker compose up -d
```
- **PostgreSQL:** `localhost:5432`
- **PgAdmin:** `http://localhost:8080`

### 3. Banco de Dados e Migrações
Aplique as migrações do Prisma para estruturar o schema:

```bash
cd database
npx prisma migrate dev
```

### 4. Executando o Frontend Web
Para instalar dependências e iniciar o servidor de desenvolvimento:

```bash
cd client/web
npm install
npm start
```
Acesse a aplicação em `http://localhost:4200`.

Para executar a suíte de testes unitários:
```bash
npm test
```

### 5. Pipelines ETL e Sincronização

#### A. Sincronização da Tabela Unificada do SIGTAP
```bash
cd scripts/sync_sigtap
poetry install
poetry run python -m sync_sigtap run
```

#### B. Carga de Dados da CPA (Instituições, Vínculos e Planos)
```bash
cd scripts/sync_cpa_data
poetry install
poetry run python -m sync_cpa_data
```

#### C. Sincronização de Produção do DATASUS (SIA/SIH)
```bash
cd scripts/sync_datasus
poetry install
# Exemplo importando a partir de uma competência inicial:
poetry run python -m sync_datasus --competencia-inicial 202601
```

---

## 📊 Arquitetura de Dados

O modelo de dados está estruturado em três camadas essenciais:

1. **Gestão Contratual e Administrativa:** `Instituicao`, `Vinculo`, `Aditivo`, controlando convênios, vigências e entidades hospitalares.
2. **Planejamento e Faturamento:** `PlanoOperativo`, `PlanoOperativoProcedimento`, definindo tetos, metas físicas/orçamentárias e regras de rateio.
3. **Catálogo Governamental e Auditoria (SIGTAP):** Mais de 20 tabelas espelhadas (`sigtap_tb_procedimento`, `sigtap_tb_rubrica`, CIDs, CBOs) associadas ao histórico de alterações (`sigtap_changelog`), garantindo conformidade retroativa e precisão histórica no faturamento.

---

## 🤝 Padrões de Contribuição

- Mensagens de commit seguem a convenção de **[Conventional Commits](https://www.conventionalcommits.org/)** (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).
- Mantenha a cobertura de testes automatizados ao implementar novas funcionalidades no frontend ou scripts de ingestão.
