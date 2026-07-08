# Sync SIGTAP

Módulo responsável por automatizar a sincronização da **TabelaUnificada** do SIGTAP (DATASUS). 
O sistema conecta no servidor FTP do DATASUS, baixa o arquivo ZIP da competência mais recente, extrai as informações da `tb_procedimento`, calcula o diff (diferença) em relação aos dados já salvos no PostgreSQL e atualiza a base com inserções, atualizações e exclusões (soft deletes), criando changelogs para auditoria.

## Requisitos

- Python >= 3.14
- [Poetry](https://python-poetry.org/)
- PostgreSQL

## Instalação

1. Acesse o diretório do script:
   ```bash
   cd scripts/sync_sigtap
   ```

2. Instale as dependências utilizando o Poetry:
   ```bash
   poetry install
   ```

## Configuração

Copie o arquivo de variáveis de ambiente de exemplo e configure de acordo com seu ambiente:

```bash
cp .env.example .env
```

**Principais variáveis:**
- `DATABASE_URL`: A URL do PostgreSQL (mesmo padrão utilizado no diretório `database` do projeto).
- `FTP_HOST` e `FTP_DIR`: O host do FTP do DATASUS e o caminho dos arquivos (ex: `/pub/sistemas/tup/downloads/`).
- `SCHEDULE_HOUR` e `SCHEDULE_MINUTE`: Horário (hora/minuto) para execução diária automática quando em modo *daemon*.
- `LOG_LEVEL`: Nível de detalhamento dos logs (`INFO`, `DEBUG`, etc).

## Uso

O módulo possui uma interface de linha de comando. Você pode utilizá-lo de duas maneiras através do Poetry:

### Execução Única (Run)
Baixa, analisa, compara e aplica os dados no banco de forma manual e pontual.

```bash
poetry run python -m sync_sigtap run
```

### Agendador Contínuo (Schedule)
Fica rodando em background executando as tarefas todos os dias no horário determinado nas variáveis de ambiente.

```bash
poetry run python -m sync_sigtap schedule
```

## Desenvolvimento

Para garantir a qualidade, o projeto utiliza `pytest` para testes unitários e `mypy` para validação estática de tipos. 

**Rodar os testes:**
```bash
poetry run pytest tests/ -v
```

**Rodar o linter (mypy):**
```bash
poetry run mypy src/ --ignore-missing-imports
```
