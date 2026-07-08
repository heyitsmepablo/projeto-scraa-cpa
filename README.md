# Projeto SCRAA-CPA

Sistema de Controle e Registro de Acompanhamento Administrativo - Controle de Planos Operativos e Auditoria (SCRAA-CPA).

Este repositório contém a infraestrutura e serviços backend para gestão de convênios, contratos, aditivos e planos operativos entre instituições de saúde e o governo, com foco no faturamento e na integração constante com a base de dados do SIGTAP (Sistema de Gerenciamento da Tabela de Procedimentos, Medicamentos e OPM do SUS).

## Estrutura do Projeto

O projeto é monorepo e atualmente é composto pelas seguintes pastas e serviços:

- **[`/database`](./database/)**: Contém o schema, as configurações e migrações do banco de dados (Prisma + PostgreSQL). Define toda a modelagem de domínio, as entidades de faturamento (Planos Operativos) e o ecossistema de tabelas replicadas do SIGTAP.
- **[`/scripts/sync_sigtap`](./scripts/sync_sigtap/)**: Serviço em Python (ETL) responsável por sincronizar de forma autônoma e programada (ou manual) todos os dados do FTP do DATASUS referentes à Tabela Unificada do SIGTAP para o banco de dados do projeto. Mantém o histórico completo de alterações (Changelog) para fins de auditoria e compliance.

## Tecnologias Principais

- **Banco de Dados:** PostgreSQL 
- **ORM:** Prisma
- **ETL / Scripts:** Python 3.14+, Poetry
- **CI/CD:** GitHub Actions

## Começando

### 1. Banco de Dados
Para subir a infraestrutura de banco de dados e aplicar as migrações:
```bash
cd database
# Configure o .env com a string de conexão (DATABASE_URL)
npx prisma migrate dev
```

### 2. Sincronização SIGTAP
Para configurar a rotina de ETL que popula as tabelas de referência do SIGTAP:
```bash
cd scripts/sync_sigtap
poetry install
cp .env.example .env
# Preencha a DATABASE_URL com as credenciais locais
poetry run python -m sync_sigtap run
```

## Arquitetura de Dados

O banco está dividido logicamente em:
1. **Entidades Administrativas**: `Instituicao`, `Vinculo`, `Aditivo`. (Gestão contratual)
2. **Operação e Faturamento**: `PlanoOperativo`, `PlanoOperativoProcedimento`. (Pactuações de metas, quantidades e valores)
3. **Tabelas de Referência Governamentais (SIGTAP)**: `sigtap_importacao`, `sigtap_changelog`, e as 23+ tabelas contendo as regras, procedimentos, CIDs, CBOs e complexidades oficias (ex: `sigtap_tb_procedimento`, `sigtap_tb_rubrica`, etc).

## Histórico e Changelog

Qualquer atualização nos dados do SUS (SIGTAP) é registrada individualmente. Se um procedimento muda de preço ou muda a complexidade, a rotina ETL gera entradas na tabela de **Changelog**, permitindo que o faturamento de meses retroativos respeite as regras vigentes na data de competência da prestação de serviço.
