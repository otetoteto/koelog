
FROM node:23-slim@sha256:dfb18d8011c0b3a112214a32e772d9c6752131ffee512e974e59367e46fcee52 AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm
WORKDIR /app

# --------------
FROM base AS dependencies
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter backend deploy --prod deploy/backend

# --------------
FROM base AS runner
COPY --from=dependencies /app/deploy/backend/node_modules/ /app/apps/backend/node_modules
COPY apps/backend/package.json /app/apps/backend/package.json
COPY apps/backend/src /app/apps/backend/src

WORKDIR /app/apps/backend
EXPOSE 3000
CMD ["node", "src/main.ts"]
