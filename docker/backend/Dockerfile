
# Multi-stage build for Node.js backend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm install --no-audit --no-fund && npm cache clean --force

# Copy source code
COPY src ./src
COPY prisma ./prisma
COPY db ./db

# Generate Prisma client with correct binary target
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init and OpenSSL for Prisma
RUN apk add --no-cache dumb-init openssl && \
    ln -s /usr/lib/libssl.so.3 /usr/lib/libssl.so.1.1

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Copy built application
COPY --from=builder --chown=backend:nodejs /app/dist ./dist
COPY --from=builder --chown=backend:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=backend:nodejs /app/package.json ./package.json
COPY --from=builder --chown=backend:nodejs /app/prisma ./prisma
COPY --from=builder --chown=backend:nodejs /app/db ./db

# Copy environment and configuration files
COPY .env.production ./.env

# Create logs and uploads directories
RUN mkdir -p logs uploads && chown -R backend:nodejs logs uploads

USER backend

EXPOSE 3033

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3033/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["dumb-init", "node", "dist/index.js"]
