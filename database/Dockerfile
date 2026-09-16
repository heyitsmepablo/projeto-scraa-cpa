# ==============================================================================
# Dockerfile para Execução de Migrações Prisma (PostgreSQL)
# ==============================================================================

FROM node:22-alpine

WORKDIR /app

# Dependências nativas necessárias para o motor do Prisma no Alpine
RUN apk add --no-cache openssl libc6-compat

# Copia manifests e instala dependências de desenvolvimento e produção
COPY package*.json ./
RUN npm ci

# Copia configurações e esquemas de migração
COPY prisma.config.ts tsconfig.json ./
COPY prisma ./prisma
COPY views ./views

# Executa migrações pendentes no banco
CMD ["npx", "prisma", "migrate", "deploy"]
