
FROM node:23-slim@sha256:dfb18d8011c0b3a112214a32e772d9c6752131ffee512e974e59367e46fcee52 AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm
WORKDIR /app

# --------------
FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @koelog/frontend build

# --------------
FROM base AS runner
COPY --from=builder /app/apps/frontend/.output/ /app/apps/frontend

WORKDIR /app/apps/frontend
EXPOSE 3000
CMD ["node", "./server/index.mjs"]
