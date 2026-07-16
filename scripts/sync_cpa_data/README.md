# Sync CPA Data (ETL)

Este diretório contém o pipeline ETL responsável por extrair dados referentes às **Instituições** e **Vínculos** a partir de uma planilha Excel (CPA) local e sincronizá-los (upsert) com o banco de dados PostgreSQL.

## 📌 Arquitetura e Estratégia

*   **Idempotência:** O script utiliza uma estratégia de "select-then-branch" para garantir que possa ser rodado múltiplas vezes sem duplicar os dados. Ele busca as chaves de negócio (`cnes` para instituições e `numero` para vínculos), insere em lote os registros novos e atualiza os registros existentes um a um.
*   **Performance:** A inserção no banco é feita utilizando SQLAlchemy Core (`Table`, `insert`, `update`), que proporciona alta performance para inserções em lote (batch inserts).
*   **Integração Relacional:** Ao processar a aba de Instituições, o script gera um mapeamento `CNES -> ID`, que é então repassado para a rotina de Vínculos, garantindo que as chaves estrangeiras (`instituicao_id`) sejam resolvidas e inseridas corretamente, sem a necessidade de múltiplas queries secundárias.
*   **Transacional:** Todo o processo E-T-L roda dentro de um único context manager de sessão de banco de dados (`engine.begin()`). Se ocorrer qualquer falha durante a extração ou o carregamento, a transação realiza *rollback* e o banco de dados não sofre alterações parciais.

## 📋 Pré-requisitos

*   **Python 3.10+** (Recomendado o uso da versão especificada no `pyproject.toml`)
*   **Poetry** (Gerenciador de pacotes)
*   **PostgreSQL** (Banco de dados de destino)
*   **Planilha base:** O arquivo Excel com as abas `INSTITUICOES` e `VINCULOS`.

## ⚙️ Configuração (Variáveis de Ambiente)

Crie um arquivo `.env` na raiz do projeto (pasta pai de `/scripts`) baseando-se no arquivo de template `.env.example` da raiz.

```bash
# A partir da raiz do projeto:
cp .env.example .env
```

Abra o arquivo `.env` e configure as seguintes variáveis:

*   `DATABASE_URL`: **(Obrigatório)** String de conexão direta do SQLAlchemy para o PostgreSQL.
    *   *Nota importante:* Use a formatação nativa do postgresql (`postgresql://user:pass@host:5432/db`). **Não utilize** o prefixo `prisma+postgres://`.
*   `CPA_SPREADSHEET_PATH`: *(Opcional)* Caminho absoluto ou relativo para a planilha fonte. Caso não seja informado, o script assume o padrão: `scripts/arquivos/cpa-data/Dados CPA.xlsx`.
*   `LOG_LEVEL`: *(Opcional)* Nível de logging. Padrão: `INFO`.

## 🚀 Como Executar

1. **Instale as dependências** via Poetry:
   ```bash
   poetry install
   ```

2. **Execute o módulo principal** para rodar o pipeline:
   ```bash
   poetry run python -m sync_cpa_data
   ```

Você verá no terminal os logs informando quantas linhas foram extraídas de cada aba, quantas possuíam formatação incorreta (que foram puladas) e quantas inserções/atualizações ocorreram no banco de dados.

## 🧪 Como Rodar os Testes

O projeto contém uma suíte de testes unitários abrangentes cobrindo os módulos de extração e inserção no banco, incluindo o parsing robusto do pandas e tratamento de colunas não obrigatórias.

Para rodar os testes e verificar o funcionamento da lógica base:

```bash
poetry run pytest tests/ -v
```

Para rodar o linter (Ruff) garantindo as regras de formatação:

```bash
poetry run ruff check src/ tests/
```

## 🗂️ Comportamento das Colunas

### Aba: INSTITUICOES
*   **ESTABELECIMENTO:** Obrigatório. Mapeado para `nome`.
*   **CNES:** Obrigatório. Será feito preenchimento com zeros à esquerda (zero-padded) para sempre ter 7 dígitos.
*   **CNPJ:** Opcional. Se existir, formatações (pontos, traços) são removidas e é garantido ter 14 dígitos. Caso não exista na planilha antiga, insere como `""`.
*   **TIPO DE INSTITUIÇÃO:** Obrigatório. Convertido e padronizado via remoção de acentos para referenciar os enums do banco (ex: `FILANTROPICO` → `FILANTRÓPICO`).

### Aba: VINCULOS
*   **CNES:** Usado para buscar o ID da instituição relacional na qual esse vínculo será inserido.
*   **NUMERO DO VINCULO:** Obrigatório. Chave de negócio na tabela `vinculo`.
*   **TIPO DO VINCULO:** Obrigatório. Padronizado para casar com o enum no banco (`CONVÊNIO`, `CONTRATO`, etc.).
*   **OBJETO:** Opcional. String simples de descrição. Fallback para `""`.
*   **COMPLEXIDADE:** Opcional. Pode vir como uma string separada por vírgulas (Ex: `"AC, MC"`). Será percorrida e convertida em um Array de Enums do PostgreSQL (`TipoComplexidade[]`). Valores desconhecidos na string emitem um warning e são ignorados, enquanto campos completamente vazios viram `[]`.
*   **VALOR DO DOCUMENTO ORIGINAL (ANUAL):** Formatado do padrão contábil brasileiro (`R$ 1.200,00`) para ponto flutuante, salvando como `Numeric(15, 2)`.
*   **DATA DA ASSINATURA / DATA DE INÍCIO:** Obrigatórios. Passam pelo parse de `pd.to_datetime(dayfirst=True)`.
*   **DATA DE FINALIZAÇÃO:** Opcional. Pode ser nula no caso de contratos por tempo indeterminado.
