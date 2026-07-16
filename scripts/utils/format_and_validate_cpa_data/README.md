# Format and Validate CPA Data

Este módulo contém utilitários para formatar e validar os dados da planilha do CPA antes da sincronização com o banco de dados.

## Configuração

O sistema utiliza o pacote `python-dotenv` para buscar as variáveis de ambiente. As configurações de banco de dados (`DATABASE_URL`) são carregadas **automaticamente** a partir do arquivo `.env` localizado na raiz do projeto.

```bash
# A partir da raiz do repositório:
cp .env.example .env
# Adicione suas credenciais no arquivo gerado.
```

## Execução

```bash
poetry install
poetry run ...
```
