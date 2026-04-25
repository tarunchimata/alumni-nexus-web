# Alumni Nexus Web - Docker Setup Guide

## Overview

This guide explains how to run the Alumni Nexus Web platform using Docker containers for easy deployment and scaling.

## Architecture

The Docker setup includes:

- **Backend**: Node.js/Express API server
- **Frontend**: React application with Nginx
- **Redis**: Caching and session storage
- **Monitoring**: Prometheus + Grafana (production only)
- **Nginx Proxy**: Reverse proxy (production only)

## Quick Start

### Prerequisites

- Docker 20.0+
- Docker Compose 2.0+
- Git

### Setup Commands

```bash
# Clone the repository
git clone https://github.com/tarunchimata/alumni-nexus-web.git
cd alumni-nexus-web

# Make setup script executable
chmod +x docker-setup.sh

# Start development environment
./docker-setup.sh dev

# OR start production environment
./docker-setup.sh prod
```

## Environment Configuration

### Backend Environment Variables

Edit `backend/.env` file:

```env
# External API Configuration
SCHOOLS_API_URL=https://api.hostingmanager.in/api/schools/all
USERS_API_URL=https://api.hostingmanager.in/api/users/all
API_TIMEOUT=30000
API_RETRY_ATTEMPTS=3

# Keycloak Configuration
KEYCLOAK_URL=https://login.hostingmanager.in
KEYCLOAK_REALM=myschoolbuddies-realm
KEYCLOAK_FRONTEND_CLIENT_ID=myschoolbuddies-client

# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database

# Docker Configuration
REDIS_PASSWORD=default123
GRAFANA_PASSWORD=admin123
```

## Development Environment

### Start Development

```bash
./docker-setup.sh dev
```

**Access Points:**
- Frontend: http://localhost:5173 (Vite dev server)
- Backend API: http://localhost:3033/api
- Redis: localhost:6379

**Features:**
- Hot reload for both frontend and backend
- Live code mounting
- Development tools enabled
- Debug logging

### Development Logs

```bash
# Show all logs
./docker-setup.sh logs dev

# Show specific service logs
./docker-setup.sh logs dev backend
./docker-setup.sh logs dev frontend
```

## Production Environment

### Start Production

```bash
./docker-setup.sh prod
```

**Access Points:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:3033/api
- Grafana: http://localhost:3000 (admin/admin123)
- Prometheus: http://localhost:9090
- Redis: localhost:6379

**Features:**
- Optimized builds
- Nginx reverse proxy
- SSL support
- Monitoring and metrics
- Health checks
- Automatic restarts

### Production Logs

```bash
# Show all logs
./docker-setup.sh logs prod

# Show specific service logs
./docker-setup.sh logs prod backend
./docker-setup.sh logs prod frontend
./docker-setup.sh logs prod nginx-proxy
```

## Management Commands

### Health Checks

```bash
# Development health check
./docker-setup.sh health dev

# Production health check
./docker-setup.sh health prod
```

### Service Status

```bash
# Development status
./docker-setup.sh status dev

# Production status
./docker-setup.sh status prod
```

### Stop Services

```bash
# Stop development
./docker-setup.sh stop dev

# Stop production
./docker-setup.sh stop prod
```

### Cleanup

```bash
# Clean development environment
./docker-setup.sh cleanup dev

# Clean production environment
./docker-setup.sh cleanup prod
```

## Docker Compose Files

### Development (`docker-compose.dev.yml`)

```yaml
services:
  backend:
    build: ./backend
    ports: ["3033:3033"]
    volumes:
      - ./backend/src:/app/src  # Live reload
    command: npm run dev

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend.dev
    ports: ["5173:5173"]
    volumes:
      - ./src:/app/src  # Live reload
    command: npm run dev

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

### Production (`docker-compose.production.yml`)

```yaml
services:
  backend:
    build: ./backend
    ports: ["3033:3033"]
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:3033/api/health"]

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports: ["8080:80"]
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost/health"]

  nginx-proxy:
    image: nginx:alpine
    ports: ["80:80", "443:443"]

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}

  monitoring:
    image: prom/prometheus
    ports: ["9090:9090"]

  grafana:
    image: grafana/grafana
    ports: ["3000:3000"]
```

## Dockerfiles

### Backend Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./prisma/ ./
RUN npm ci --only=production && npx prisma generate
COPY . .
RUN npm run build
EXPOSE 3033
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --spider http://localhost:3033/api/health || exit 1
CMD ["npm", "start"]
```

### Frontend Dockerfile

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --spider http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

## External API Integration

The application is configured to use external APIs through environment variables:

```env
# Schools API
SCHOOLS_API_URL=https://api.hostingmanager.in/api/schools/all

# Users API  
USERS_API_URL=https://api.hostingmanager.in/api/users/all

# API Configuration
API_TIMEOUT=30000
API_RETRY_ATTEMPTS=3
```

**Benefits:**
- No hardcoded URLs
- Easy to change API endpoints
- Environment-specific configurations
- Better maintainability

## Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using the port
   lsof -i :3033
   lsof -i :8080
   ```

2. **Docker not running**
   ```bash
   # Start Docker service
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

3. **Permission issues**
   ```bash
   # Add user to docker group
   sudo usermod -aG docker $USER
   # Logout and login again
   ```

4. **Build failures**
   ```bash
   # Clean up and rebuild
   docker system prune -f
   ./docker-setup.sh cleanup dev
   ./docker-setup.sh dev
   ```

### Logs and Debugging

```bash
# View real-time logs
./docker-setup.sh logs dev backend

# View container logs directly
docker logs alumni-nexus-web_backend_1

# Execute commands in container
docker exec -it alumni-nexus-web_backend_1 sh
```

### Performance Monitoring

Production environment includes:

- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Health checks**: Automated monitoring
- **Resource limits**: Container constraints

Access Grafana at http://localhost:3000 with credentials:
- Username: admin
- Password: admin123 (or set via GRAFANA_PASSWORD env var)

## Security Considerations

1. **Environment Variables**: Store sensitive data in `.env` files
2. **Network Isolation**: Services communicate within Docker network
3. **Non-root Users**: Containers run as non-root users
4. **Health Checks**: Automated monitoring of service health
5. **Resource Limits**: Prevent resource exhaustion

## Scaling and Deployment

### Production Scaling

```bash
# Scale backend services
docker-compose -f docker-compose.production.yml up --scale backend=3

# Load balancing with Nginx
# Already configured in nginx.conf
```

### Environment-Specific Configs

```bash
# Development
./docker-setup.sh dev

# Staging
docker-compose -f docker-compose.staging.yml up -d

# Production
./docker-setup.sh prod
```

## Backup and Recovery

### Data Backup

```bash
# Backup Redis data
docker exec alumni-nexus-web_redis_1 redis-cli BGSAVE

# Backup logs
docker cp alumni-nexus-web_backend_1:/app/logs ./backup/
```

### Service Recovery

```bash
# Restart specific service
docker-compose -f docker-compose.production.yml restart backend

# Full recovery
./docker-setup.sh cleanup prod
./docker-setup.sh prod
```

## Support

For issues and questions:

1. Check logs: `./docker-setup.sh logs [mode]`
2. Verify health: `./docker-setup.sh health [mode]`
3. Check status: `./docker-setup.sh status [mode]`
4. Review troubleshooting section above

## Next Steps

- Configure SSL certificates for production
- Set up external monitoring
- Configure backup strategies
- Implement CI/CD pipeline
- Scale for production workload
