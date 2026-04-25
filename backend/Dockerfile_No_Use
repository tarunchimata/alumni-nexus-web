# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dumb-init and OpenSSL for Prisma
RUN apk add --no-cache dumb-init openssl && \
    ln -s /usr/lib/libssl.so.3 /usr/lib/libssl.so.1.1 && \
    npm ci --only=production && npm cache clean --force && \
    npm install -g ts-node typescript
RUN npx prisma generate

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3033

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3033/health || exit 1

# Use dumb-init and run the application with ts-node
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
