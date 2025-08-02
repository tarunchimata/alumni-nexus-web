#!/bin/bash

# ================================================================
# 🚀 SINGLE COMPREHENSIVE FIX SCRIPT - My School Buddies
# ================================================================
# This script fixes ALL Docker and port issues in one execution
# No more multiple scripts or R&D - everything is handled here!

set -e

print_header() {
    echo ""
    echo "================================================================"
    echo "🚀 $1"
    echo "================================================================"
}

print_status() {
    echo "✅ $1"
}

print_warning() {
    echo "⚠️  $1"
}

print_error() {
    echo "❌ $1"
}

print_info() {
    echo "ℹ️  $1"
}

# ================================================================
# STEP 1: Kill ALL conflicting processes
# ================================================================
print_header "STEP 1: Killing All Conflicting Processes"

kill_port_processes() {
    local port=$1
    print_info "Killing processes on port $port..."
    
    # Multiple approaches to ensure port is freed
    lsof -ti:$port | xargs -r kill -9 2>/dev/null || true
    fuser -k ${port}/tcp 2>/dev/null || true
    pkill -f ":$port" 2>/dev/null || true
    
    sleep 2
}

# Kill processes on all relevant ports
for port in 3000 3001 8080 80 443; do
    kill_port_processes $port
done

print_status "All conflicting processes killed"

# ================================================================
# STEP 2: Complete Docker cleanup
# ================================================================
print_header "STEP 2: Complete Docker Cleanup"

print_info "Stopping all containers..."
docker stop $(docker ps -q) 2>/dev/null || true

print_info "Removing all project containers..."
docker ps -a --filter "name=docker_" --format "{{.ID}}" | xargs -r docker rm -f 2>/dev/null || true
docker ps -a --filter "name=myschoolbuddies" --format "{{.ID}}" | xargs -r docker rm -f 2>/dev/null || true

print_info "Removing networks..."
docker network rm myschoolbuddies-network 2>/dev/null || true

print_info "Removing project images..."
docker rmi docker_backend docker_frontend 2>/dev/null || true

print_info "Pruning Docker system..."
docker system prune -f 2>/dev/null || true

print_status "Docker cleanup completed"

# ================================================================
# STEP 3: Fix configuration files
# ================================================================
print_header "STEP 3: Fixing Configuration Files"

# Navigate to project root
cd "$(dirname "$0")/.."

print_info "Updating vite.config.ts to use port 8080..."
cat > vite.config.ts << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', 'lucide-react'],
          utils: ['axios', 'clsx', 'date-fns']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
}));
EOF

print_info "Updating docker-compose.yml with correct ports and API URL..."
cat > docker/docker-compose.yml << 'EOF'

version: '3.8'

services:
  # Backend (Node.js/Express API)
  backend:
    build:
      context: ../
      dockerfile: docker/Dockerfile.backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=postgresql://msbfinalroot:vA5ZXB2Nb6M3P22GWZRch999@pg.hostingmanager.in:5432/myschoolbuddies_budibase_db
      - KEYCLOAK_URL=https://login.hostingmanager.in
      - KEYCLOAK_REALM=myschoolbuddies-realm
      - KEYCLOAK_CLIENT_ID=backend-client
      - KEYCLOAK_CLIENT_SECRET=backend-client-secret-2025
      - SENDGRID_API_KEY=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
      - SENDGRID_FROM_EMAIL=noreply@myschoolbuddies.com
      - SENDGRID_FROM_NAME=My School Buddies
      - JWT_SECRET=production-jwt-secret-change-this
      - CORS_ORIGIN=https://school.hostingmanager.in,https://api.hostingmanager.in
      - LOG_LEVEL=info
    volumes:
      - backend_logs:/app/logs
      - backend_uploads:/app/uploads
    networks:
      - myschoolbuddies-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped

  # Frontend (React App with Nginx)
  frontend:
    build:
      context: ../
      dockerfile: docker/Dockerfile.frontend
    ports:
      - "8080:80"
    environment:
      - VITE_API_URL=http://localhost:3001/api
      - VITE_KEYCLOAK_URL=https://login.hostingmanager.in
      - VITE_KEYCLOAK_REALM=myschoolbuddies-realm
      - VITE_KEYCLOAK_CLIENT_ID=myschoolbuddies-client
      - VITE_OAUTH2_REDIRECT_URI=http://localhost:8080/oauth2/callback
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - myschoolbuddies-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    networks:
      - myschoolbuddies-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    restart: unless-stopped

volumes:
  backend_logs:
  backend_uploads:

networks:
  myschoolbuddies-network:
    driver: bridge
    name: myschoolbuddies-network

EOF

print_status "Configuration files updated"

# ================================================================
# STEP 4: Build and start services
# ================================================================
print_header "STEP 4: Building and Starting Services"

print_info "Building Docker images (this may take a few minutes)..."
docker-compose -f docker/docker-compose.yml build --no-cache

print_info "Starting services..."
docker-compose -f docker/docker-compose.yml up -d

print_status "Services started"

# ================================================================
# STEP 5: Wait and verify health
# ================================================================
print_header "STEP 5: Health Verification"

print_info "Waiting for services to initialize..."
sleep 45

print_info "Checking container status..."
docker ps --filter "name=docker_"

print_info "Testing backend health..."
for i in {1..10}; do
    if curl -f http://localhost:3001/health 2>/dev/null; then
        print_status "Backend is healthy at http://localhost:3001"
        backend_healthy=true
        break
    else
        print_warning "Backend not ready yet (attempt $i/10)..."
        sleep 10
    fi
done

print_info "Testing frontend access..."
for i in {1..5}; do
    if curl -f http://localhost:8080 2>/dev/null; then
        print_status "Frontend is accessible at http://localhost:8080"
        frontend_healthy=true
        break
    else
        print_warning "Frontend not ready yet (attempt $i/5)..."
        sleep 5
    fi
done

# ================================================================
# STEP 6: Final status report
# ================================================================
print_header "FINAL STATUS REPORT"

echo ""
echo "🎯 DEPLOYMENT COMPLETE!"
echo ""
echo "📊 Service Status:"
echo "  Backend API:  http://localhost:3001 $([ "$backend_healthy" = true ] && echo "✅ HEALTHY" || echo "❌ UNHEALTHY")"
echo "  Frontend:     http://localhost:8080 $([ "$frontend_healthy" = true ] && echo "✅ HEALTHY" || echo "❌ UNHEALTHY")"
echo "  API Endpoint: http://localhost:3001/api"
echo ""
echo "🔧 Port Configuration:"
echo "  Frontend: 8080 → 80 (container)"
echo "  Backend:  3001 → 3001 (container)"
echo "  Nginx:    80, 443"
echo ""

if [ "$backend_healthy" = true ] && [ "$frontend_healthy" = true ]; then
    echo "🎉 SUCCESS! Your My School Buddies application is running!"
    echo ""
    echo "🌐 Access your application:"
    echo "  Main App: http://localhost:8080"
    echo "  API Test: http://localhost:3001/health"
else
    echo "⚠️  Some services may need more time to start."
    echo ""
    echo "🔍 Troubleshooting commands:"
    echo "  docker logs docker_backend_1 --tail 50"
    echo "  docker logs docker_frontend_1 --tail 50"
    echo "  docker ps"
fi

echo ""
echo "================================================================"
echo "🚀 FIX SCRIPT COMPLETED"
echo "================================================================"