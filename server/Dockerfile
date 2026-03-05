FROM node:20-slim AS deps
WORKDIR /app

# Copy manifests only for layer caching
COPY package.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY server/package.json ./server/

RUN npm install

# ---- runtime ----
FROM node:20-slim AS runner
WORKDIR /app

# Copy installed modules and source
COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared-types/ ./packages/shared-types/
COPY server/ ./server/

WORKDIR /app/server

EXPOSE 3001

# tsx is hoisted to root node_modules by npm workspaces
CMD ["/app/node_modules/.bin/tsx", "src/index.ts"]
