# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM dependencies AS builder
ENV NEXT_TELEMETRY_DISABLED=1 \
    ECURE_STANDALONE_BUILD=true \
    CMS_MODE=disabled \
    ADMIN_AUTH_MODE=disabled \
    SUBMISSIONS_MODE=disabled
ARG NEXT_PUBLIC_SITE_PROFILE=default
ARG NEXT_PUBLIC_SITE_URL=
ENV NEXT_PUBLIC_SITE_PROFILE=${NEXT_PUBLIC_SITE_PROFILE} \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
COPY next.config.ts tsconfig.json next-env.d.ts postcss.config.mjs ./
COPY src ./src
COPY public ./public
RUN npm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --chown=node:node deploy/start.mjs ./start.mjs
USER node
EXPOSE 3000
CMD ["node", "start.mjs"]
