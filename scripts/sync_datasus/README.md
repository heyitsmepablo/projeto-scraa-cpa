# Sync DATASUS

Módulo (ETL) responsável por realizar o download e o processamento de bases do DATASUS.

## Configuração

O sistema utiliza o pacote `python-dotenv` para buscar as variáveis de ambiente. As configurações de banco de dados (`DATABASE_URL`) são carregadas **automaticamente** a partir do arquivo `.env` localizado na raiz do projeto.

```bash
# A partir da raiz do projeto:
cp .env.example .env
# Adicione suas credenciais
```

## Uso

```bash
poetry install
poetry run python -m sync_datasus
```
