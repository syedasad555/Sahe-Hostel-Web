# Multi-stage production image: React frontend + Express backend

# --- Stage 1: Build frontend ---
FROM node:22-bookworm-slim AS frontend-build

WORKDIR /build/frontend

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.js tailwind.config.js postcss.config.js eslint.config.js jsconfig.json ./
COPY src ./src
COPY public ./public

RUN npm run build

# --- Stage 2: Backend production dependencies ---
FROM node:22-bookworm-slim AS backend-dependencies

WORKDIR /build/server

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# --- Stage 3: Runtime ---
FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=5000 \
    UPLOAD_DIR=/app/uploads \
    PUBLIC_DIR=/app/public

WORKDIR /app/server

RUN mkdir -p /app/uploads /app/public \
  && chown -R node:node /app

COPY --chown=node:node --from=backend-dependencies /build/server/node_modules ./node_modules
COPY --chown=node:node server ./

COPY --chown=node:node --from=frontend-build /build/frontend/dist /app/public

USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:5000/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
