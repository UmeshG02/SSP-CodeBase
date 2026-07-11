# Stage 1: Install dependencies and generate Prisma Client
FROM node:20-slim AS builder

# Install openssl and other build tools if needed
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Copy Prisma schema first so it can be generated
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code and build config
COPY tsconfig.json tsconfig.build.json eslint.config.mjs nest-cli.json ./
COPY src ./src/

# Limit memory usage during NestJS compilation to prevent OOM errors
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Build the NestJS application
RUN npm run build

# Prune devDependencies to keep the production image small
RUN npm prune --omit=dev

# Stage 2: Runtime image
FROM node:20-slim AS runner

# Install openssl (Prisma needs it to connect to PostgreSQL)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

# Copy built application and pruned node_modules from builder stage
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

ENV PORT=3001

# Command to run migrations on container startup and then start the backend
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
