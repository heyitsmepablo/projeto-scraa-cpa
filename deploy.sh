#!/usr/bin/env bash
# ==============================================================================
# SCRAA-CPA - Script Unificado de Deploy e Gestão de Instâncias Docker Compose
# ==============================================================================
# Uso:
#   ./deploy.sh dev [comando]         -> Executa no docker-compose.dev.yml
#   ./deploy.sh alpha [comando]       -> Executa instância alpha no docker-compose.yml
#   ./deploy.sh beta [comando]        -> Executa instância beta no docker-compose.yml
#   ./deploy.sh production [comando]  -> Executa produção no docker-compose.yml
#   ./deploy.sh <ambiente> [comando]  -> Executa instância personalizada via .env.<ambiente>
#
# Exemplos:
#   ./deploy.sh dev up -d
#   ./deploy.sh alpha up -d --build
#   ./deploy.sh beta ps
#   ./deploy.sh production logs -f
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Exibe mensagem de ajuda
show_help() {
  echo "Uso: ./deploy.sh <ambiente> [comando_docker_compose... | sync | migrate]"
  echo ""
  echo "Ambientes suportados:"
  echo "  dev         - Desenvolvimento Local com hot-reload (docker-compose.dev.yml)"
  echo "  alpha       - Instância Staging Alpha (porta 8081, 3001, 5433)"
  echo "  beta        - Instância Staging Beta  (porta 8082, 3002, 5434)"
  echo "  production  - Produção Oficial        (porta 80, 3000, 5432)"
  echo "  <custom>    - Carrega .env.<custom> e executa docker-compose.yml"
  echo ""
  echo "Comandos especiais:"
  echo "  sync [comp] [-d] - Executa a pipeline ETL sequencial completa (Sigtap -> CPA -> DATASUS)"
  echo "                     Opcional: Informe a competência inicial [comp] (ex: 202401, 2024-01, 01/2024)."
  echo "                     Opcional: Informe -d (ou daemon) para rodar em segundo plano (modo daemon)."
  echo "  migrate          - Executa migrações pendentes no banco de dados (Prisma Migrate)"
  echo ""
  echo "Exemplos:"
  echo "  ./deploy.sh dev up -d"
  echo "  ./deploy.sh dev up -d --build"
  echo "  ./deploy.sh dev sync"
  echo "  ./deploy.sh dev sync -d"
  echo "  ./deploy.sh dev sync 202401 -d"
  echo "  ./deploy.sh prod sync 202401 -d"
  echo "  ./deploy.sh dev migrate"
  echo "  ./deploy.sh alpha up -d --build"
  echo "  ./deploy.sh beta ps"
  echo "  ./deploy.sh production logs -f"
  echo "  ./deploy.sh production migrate"
  echo "  ./deploy.sh alpha down -v"
  exit 1
}

# Valida argumento do ambiente
if [ $# -lt 1 ]; then
  show_help
fi

ENV_NAME="$1"
shift

# Define comando padrão se nenhum for passado
if [ $# -eq 0 ]; then
  COMMAND_ARGS=("up" "-d")
else
  COMMAND_ARGS=("$@")
fi

# Roteamento por ambiente
if [ "$ENV_NAME" = "dev" ]; then
  COMPOSE_FILE="docker-compose.dev.yml"
  ENV_FILE=".env.dev"
  ENV_EXAMPLE=".env.dev.example"
elif [ "$ENV_NAME" = "production" ] || [ "$ENV_NAME" = "prod" ]; then
  COMPOSE_FILE="docker-compose.yml"
  ENV_FILE=".env.production"
  ENV_EXAMPLE=".env.production.example"
else
  COMPOSE_FILE="docker-compose.yml"
  ENV_FILE=".env.${ENV_NAME}"
  ENV_EXAMPLE=".env.${ENV_NAME}.example"
fi

# Verifica se o arquivo .env existe ou se deve ser inicializado a partir do example
if [ ! -f "$ENV_FILE" ]; then
  if [ "$ENV_NAME" = "production" ] || [ "$ENV_NAME" = "prod" ]; then
    echo "❌ [SEGURANÇA] Bloqueio de Deploy: Arquivo '$ENV_FILE' não encontrado."
    echo "   Por motivos de segurança, o ambiente de PRODUÇÃO exige configuração manual dos segredos reais."
    echo "   Copie '$ENV_EXAMPLE' para '$ENV_FILE' e defina senhas fortes e credenciais de produção antes de continuar."
    exit 1
  elif [ -f "$ENV_EXAMPLE" ]; then
    echo "ℹ️  Arquivo '$ENV_FILE' não encontrado. Copiando de '$ENV_EXAMPLE'..."
    cp "$ENV_EXAMPLE" "$ENV_FILE"
  elif [ -f ".env" ]; then
    echo "ℹ️  Utilizando '.env' da raiz para o ambiente '$ENV_NAME'..."
    ENV_FILE=".env"
  else
    echo "❌ Erro: Nenhum arquivo de ambiente encontrado para '$ENV_NAME' ('$ENV_FILE' ou '$ENV_EXAMPLE')."
    exit 1
  fi
fi

# Tratamento de comandos especiais de automação
if [ "${COMMAND_ARGS[0]}" = "sync" ]; then
  EXTRA_ARGS=("${COMMAND_ARGS[@]:1}")
  COMPETENCIA_INICIAL=""
  AUTO_CONFIRM_SYNC="false"
  IS_DAEMON="false"

  FILTERED_ARGS=()
  SKIP_NEXT=false
  for i in "${!EXTRA_ARGS[@]}"; do
    if [ "$SKIP_NEXT" = true ]; then
      SKIP_NEXT=false
      continue
    fi
    arg="${EXTRA_ARGS[$i]}"
    if [ "$arg" = "-d" ] || [ "$arg" = "--detach" ] || [ "$arg" = "daemon" ] || [ "$arg" = "deamon" ] || [ "$arg" = "-daemon" ] || [ "$arg" = "--daemon" ]; then
      IS_DAEMON="true"
    elif [ "$arg" = "--competencia-inicial" ] && [ $((i + 1)) -lt ${#EXTRA_ARGS[@]} ]; then
      VAL="${EXTRA_ARGS[$((i + 1))]}"
      if [[ "$VAL" =~ ^([0-9]{4})([0-9]{2})$ ]] || [[ "$VAL" =~ ^([0-9]{4})-([0-9]{2})$ ]]; then
        COMPETENCIA_INICIAL="${BASH_REMATCH[1]}${BASH_REMATCH[2]}"
        AUTO_CONFIRM_SYNC="true"
        SKIP_NEXT=true
      elif [[ "$VAL" =~ ^([0-9]{2})/([0-9]{4})$ ]]; then
        COMPETENCIA_INICIAL="${BASH_REMATCH[2]}${BASH_REMATCH[1]}"
        AUTO_CONFIRM_SYNC="true"
        SKIP_NEXT=true
      else
        FILTERED_ARGS+=("$arg")
      fi
    elif [[ "$arg" =~ ^--competencia-inicial=(.*)$ ]]; then
      VAL="${BASH_REMATCH[1]}"
      if [[ "$VAL" =~ ^([0-9]{4})([0-9]{2})$ ]] || [[ "$VAL" =~ ^([0-9]{4})-([0-9]{2})$ ]]; then
        COMPETENCIA_INICIAL="${BASH_REMATCH[1]}${BASH_REMATCH[2]}"
        AUTO_CONFIRM_SYNC="true"
      elif [[ "$VAL" =~ ^([0-9]{2})/([0-9]{4})$ ]]; then
        COMPETENCIA_INICIAL="${BASH_REMATCH[2]}${BASH_REMATCH[1]}"
        AUTO_CONFIRM_SYNC="true"
      else
        FILTERED_ARGS+=("$arg")
      fi
    elif [ -z "$COMPETENCIA_INICIAL" ] && [[ "$arg" =~ ^([0-9]{4})([0-9]{2})$ ]]; then
      COMPETENCIA_INICIAL="${BASH_REMATCH[1]}${BASH_REMATCH[2]}"
      AUTO_CONFIRM_SYNC="true"
    elif [ -z "$COMPETENCIA_INICIAL" ] && [[ "$arg" =~ ^([0-9]{4})-([0-9]{2})$ ]]; then
      COMPETENCIA_INICIAL="${BASH_REMATCH[1]}${BASH_REMATCH[2]}"
      AUTO_CONFIRM_SYNC="true"
    elif [ -z "$COMPETENCIA_INICIAL" ] && [[ "$arg" =~ ^([0-9]{2})/([0-9]{4})$ ]]; then
      COMPETENCIA_INICIAL="${BASH_REMATCH[2]}${BASH_REMATCH[1]}"
      AUTO_CONFIRM_SYNC="true"
    else
      FILTERED_ARGS+=("$arg")
    fi
  done
  EXTRA_ARGS=("${FILTERED_ARGS[@]}")

  export COMPETENCIA_INICIAL
  export AUTO_CONFIRM_SYNC

  if [ "$IS_DAEMON" = "true" ]; then
    EXTRA_ARGS=("-d" "${EXTRA_ARGS[@]}")
  fi

  echo "=============================================================================="
  echo "🚀 SCRAA-CPA - Pipeline ETL (Sync Sequencial)"
  echo "Ambiente:    $ENV_NAME"
  echo "Compose:     $COMPOSE_FILE"
  echo "Env File:    $ENV_FILE"
  if [ -n "$COMPETENCIA_INICIAL" ]; then
    echo "Competência: $COMPETENCIA_INICIAL (Inicial)"
  fi
  if [ "$IS_DAEMON" = "true" ]; then
    echo "Modo:        Segundo plano (Daemon / Detached)"
  fi
  echo "Comando:     docker compose -f $COMPOSE_FILE --env-file $ENV_FILE --profile sync up ${EXTRA_ARGS[*]} sync-datasus"
  echo "=============================================================================="

  if [ "$IS_DAEMON" = "true" ]; then
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile sync up "${EXTRA_ARGS[@]}" sync-datasus
    echo ""
    echo "✅ Pipeline ETL iniciada em segundo plano (Modo Daemon)!"
    echo "   Para acompanhar os logs em tempo real, execute:"
    echo "     ./deploy.sh $ENV_NAME logs -f sync-sigtap"
    echo "     ./deploy.sh $ENV_NAME logs -f sync-sigtap sync-cpa-data sync-datasus"
    echo ""
  else
    exec docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile sync up "${EXTRA_ARGS[@]}" sync-datasus
  fi
elif [ "${COMMAND_ARGS[0]}" = "migrate" ]; then
  EXTRA_ARGS=("${COMMAND_ARGS[@]:1}")
  echo "=============================================================================="
  echo "🚀 SCRAA-CPA - Migração de Banco de Dados (Prisma Migrate)"
  echo "Ambiente:    $ENV_NAME"
  echo "Compose:     $COMPOSE_FILE"
  echo "Env File:    $ENV_FILE"
  echo "Comando:     docker compose -f $COMPOSE_FILE --env-file $ENV_FILE run --rm ${EXTRA_ARGS[*]} prisma-migrate"
  echo "=============================================================================="
  exec docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm "${EXTRA_ARGS[@]}" prisma-migrate
fi

echo "=============================================================================="
echo "🚀 SCRAA-CPA - Deploy & Gestão"
echo "Ambiente:    $ENV_NAME"
echo "Compose:     $COMPOSE_FILE"
echo "Env File:    $ENV_FILE"
echo "Comando:     docker compose -f $COMPOSE_FILE --env-file $ENV_FILE ${COMMAND_ARGS[*]}"
echo "=============================================================================="

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "${COMMAND_ARGS[@]}"
