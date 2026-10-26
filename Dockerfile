# Multi-stage Dockerfile for Railway (Project: 9821be45-444b-4d47-b79e-2b811be6851f / Domain: https://plauxie.life)
FROM node:22-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

# Build Vite + React + Tailwind frontend
FROM base AS build
ARG VITE_API_BASE_URL=https://plauxie.life
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production runtime stage
FROM base AS production
ENV NODE_ENV=production
ENV PUBLIC_DOMAIN=https://plauxie.life
ENV RAILWAY_PROJECT_ID=9821be45-444b-4d47-b79e-2b811be6851f

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/src/types ./src/types
COPY --from=build /app/db ./db
COPY --from=build /app/multi_barrier_navigator_master_spec.md ./multi_barrier_navigator_master_spec.md

EXPOSE 4180

CMD ["npm", "start"]
