# ==============================================================================
# Multi-stage Dockerfile para API NestJS (Produção)
# ==============================================================================

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm ci

# Copia configurações e código-fonte
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
COPY generated ./generated

# Compila o NestJS e sincroniza artefatos gerados
RUN npm run build

# ── Stage 2: Runner de Produção ───────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Instala apenas dependências de produção
COPY package*.json ./
RUN npm ci --omit=dev

# Copia build compilado e esquemas do Prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated

EXPOSE 3000

USER node

CMD ["node", "dist/src/main.js"]
