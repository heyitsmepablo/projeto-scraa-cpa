# Projeto SCRAA-CPA

Sistema de Controle e Registro de Acompanhamento Administrativo - Controle de Planos Operativos e Auditoria (SCRAA-CPA).

Este repositório contém a infraestrutura e serviços backend para gestão de convênios, contratos, aditivos e planos operativos entre instituições de saúde e o governo, com foco no faturamento e na integração constante com a base de dados do SIGTAP (Sistema de Gerenciamento da Tabela de Procedimentos, Medicamentos e OPM do SUS).

## Estrutura do Projeto

O projeto é monorepo e atualmente é composto pelas seguintes pastas e serviços:

- **[`/database`](./database/)**: Contém o schema, as configurações e migrações do banco de dados (Prisma + PostgreSQL). Define toda a modelagem de domínio, as entidades de faturamento (Planos Operativos) e o ecossistema de tabelas replicadas do SIGTAP.
- **[`/scripts/sync_sigtap`](./scripts/sync_sigtap/)**: Serviço em Python (ETL) responsável por sincronizar de forma autônoma e programada (ou manual) todos os dados do FTP do DATASUS referentes à Tabela Unificada do SIGTAP para o banco de dados do projeto. Mantém o histórico completo de alterações (Changelog) para fins de auditoria e compliance.
- **[`/scripts/sync_cpa_data`](./scripts/sync_cpa_data/)**: Pipeline ETL responsável por extrair dados referentes às Instituições, Vínculos e Planos Operativos a partir de uma planilha Excel (CPA) local e sincronizá-los com o banco de dados PostgreSQL.
- **[`/scripts/sync_datasus`](./scripts/sync_datasus/)**: Módulo responsável por automatizar o download e o processamento de bases de produção do DATASUS (SIA/SIH), parseando os arquivos originados do FTP governamental e populando os dados de produção faturada no banco de dados.
- **[`/scripts/utils/format_and_validate_cpa_data`](./scripts/utils/format_and_validate_cpa_data/)**: Ferramentas auxiliares para a higienização, formatação e validação prévia dos dados da planilha do CPA.

## Tecnologias Principais

- **Banco de Dados:** PostgreSQL 
- **ORM:** Prisma
- **ETL / Scripts:** Python 3.13+, Poetry, Pandas, PySUS
- **CI/CD:** GitHub Actions

## Começando

### 1. Variáveis de Ambiente (Global)
O projeto agora utiliza um **arquivo `.env` centralizado na raiz** para evitar redundâncias de credenciais (como a `DATABASE_URL`) entre os diferentes serviços e scripts.

```bash
# Na raiz do repositório
cp .env.example .env
# Preencha a DATABASE_URL e demais variáveis de configuração
```

### 2. Banco de Dados
Para subir a infraestrutura de banco de dados e aplicar as migrações:
```bash
cd database
npx prisma migrate dev
```
*(Nota: O Prisma no diretório `database` pode exigir um `.env` local próprio caso não configurado para ler da raiz. Se ocorrer erro, faça um link simbólico ou crie o `.env` ali também).*

### 3. Sincronização SIGTAP
Para rodar a rotina de ETL que popula as tabelas de referência do SIGTAP:
```bash
cd scripts/sync_sigtap
poetry install
poetry run python -m sync_sigtap run
```

### 4. Carga de Dados da CPA
Para carregar instituições, vínculos e planos operativos a partir da planilha:
```bash
cd scripts/sync_cpa_data
poetry install
poetry run python -m sync_cpa_data
```

### 5. Sincronização DATASUS (SIA/SIH)
Para baixar e sincronizar a produção faturada do DATASUS (SIA/SIH):
```bash
cd scripts/sync_datasus
poetry install
# Exemplo puxando a partir da competência de Janeiro/2026:
poetry run python -m sync_datasus --competencia-inicial 202601
```

## Arquitetura de Dados

O banco está dividido logicamente em:
1. **Entidades Administrativas**: `Instituicao`, `Vinculo`, `Aditivo`. (Gestão contratual)
2. **Operação e Faturamento**: `PlanoOperativo`, `PlanoOperativoProcedimento`. (Pactuações de metas, quantidades e valores)
3. **Tabelas de Referência Governamentais (SIGTAP)**: `sigtap_importacao`, `sigtap_changelog`, e as 23+ tabelas contendo as regras, procedimentos, CIDs, CBOs e complexidades oficias (ex: `sigtap_tb_procedimento`, `sigtap_tb_rubrica`, etc).

## Histórico e Changelog

Qualquer atualização nos dados do SUS (SIGTAP) é registrada individualmente. Se um procedimento muda de preço ou muda a complexidade, a rotina ETL gera entradas na tabela de **Changelog**, permitindo que o faturamento de meses retroativos respeite as regras vigentes na data de competência da prestação de serviço.
