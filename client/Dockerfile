FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY client/package.json ./client/

RUN npm install

# ---- builder ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared-types/ ./packages/shared-types/
COPY client/ ./client/

WORKDIR /app/client
RUN npm run build

# ---- production image ----
FROM nginx:1.27-alpine
COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
