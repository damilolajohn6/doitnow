FROM node:24.22.2-trixie-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:24.22.2-trixie-slim AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG GOOGLE_SITE_VERIFICATION=""
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    GOOGLE_SITE_VERIFICATION=${GOOGLE_SITE_VERIFICATION}
RUN npm run build

FROM node:24.22.2-trixie-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    DO_IT_NOW_ASSET_ROOT=/app/collateral \
    DO_IT_NOW_DATA_DIR=/app/data
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
RUN mkdir -p /app/data /app/collateral && chown -R node:node /app/data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
