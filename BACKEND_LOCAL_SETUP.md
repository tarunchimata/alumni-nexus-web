# Backend Local Setup & Testing Guide

This guide will help you run and test the My School Buddies backend outside of Docker to isolate and resolve any startup issues.

## 📋 Prerequisites Checklist

### Environment Variables
Copy `backend/.env.local` and update the following required variables:

- [ ] `PORT` - Server port (default: 3001)
- [ ] `DB_HOST` - Database host
- [ ] `DB_PORT` - Database port (default: 5432)
- [ ] `DB_NAME` - Database name
- [ ] `DB_USER` - Database username
- [ ] `DB_PASSWORD` - Database password
- [ ] `KEYCLOAK_URL` - Keycloak server URL
- [ ] `KEYCLOAK_REALM` - Keycloak realm name
- [ ] `KEYCLOAK_CLIENT_ID` - Backend client ID
- [ ] `KEYCLOAK_FRONTEND_CLIENT_ID` - Frontend client ID
- [ ] `JWT_SECRET` - JWT signing secret

### System Requirements
- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager
- [ ] PostgreSQL client (optional, for testing)
- [ ] Port 3001 available (or change PORT in .env.local)

## 🚀 Quick Start

### 1. Automated Setup
```bash
# From project root
chmod +x scripts/test-backend-local.sh
./scripts/test-backend-local.sh
```

### 2. Manual Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create required directories
mkdir -p logs uploads

# Generate Prisma client
npx prisma generate

# Copy and configure environment
cp .env.local.example .env.local
# Edit .env.local with your values

# Test compilation
npm run build
```

## 🧪 Starting the Backend

### Development Mode (Recommended)
```bash
# From backend directory
npm run dev

# Or with enhanced debugging
node ../scripts/start-backend-debug.js dev
```

### Production Mode
```bash
# From backend directory
npm run build
npm start

# Or with enhanced debugging
node ../scripts/start-backend-debug.js prod
```

### Debug Mode (Enhanced Logging)
```bash
# From project root
node scripts/start-backend-debug.js
```

## 🩺 Health Checks & Testing

### 1. Basic Health Check
```bash
curl http://localhost:3001/health
```
Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-XX...",
  "uptime": "XX seconds"
}
```

### 2. Database Connection Test
```bash
curl http://localhost:3001/api/health/database
```

### 3. OAuth2 Configuration Test
```bash
curl http://localhost:3001/api/oauth2/config
```

### 4. Keycloak Integration Test
```bash
curl http://localhost:3001/api/oauth2/authorize?client_id=test&redirect_uri=http://localhost:8080/callback
```

## 🐞 Debugging & Logs

### Log Locations
- Application logs: `backend/logs/app.log`
- Console output: Real-time in terminal
- Error logs: Captured in debug script

### Common Startup Issues

#### 1. Port Already in Use
```bash
# Find process using port 3001
lsof -Pi :3001 -sTCP:LISTEN

# Kill process if needed
kill -9 <PID>
```

#### 2. Database Connection Failed
```bash
# Test database connectivity
psql "postgresql://user:password@host:port/database" -c "SELECT 1;"

# Check environment variables
grep DB_ backend/.env.local
```

#### 3. Missing Dependencies
```bash
# Clean install
cd backend
rm -rf node_modules package-lock.json
npm install
```

#### 4. TypeScript Compilation Errors
```bash
# Check for type errors
cd backend
npx tsc --noEmit

# Install missing type packages
npm install --save-dev @types/missing-package
```

### Environment Variable Debugging
```bash
# Check all loaded environment variables
node -e "console.log(require('dotenv').config({ path: './backend/.env.local' }))"

# Verify specific variables
node -e "require('dotenv').config({ path: './backend/.env.local' }); console.log('PORT:', process.env.PORT)"
```

## ⚠️ Known Issues & Watchouts

### Development Environment
- **Node Version**: Ensure Node.js 18+ is installed
- **Memory**: Backend may use significant memory in development mode
- **File Watching**: ts-node-dev may consume CPU for file watching

### Database Issues
- **Connection Timeout**: Increase timeout if database is slow
- **SSL Issues**: Check SSL configuration for production databases
- **Prisma Client**: Regenerate after schema changes

### Keycloak Integration
- **CORS Errors**: Ensure frontend URL is in CORS_ORIGIN
- **Client Configuration**: Verify client settings in Keycloak admin
- **Certificate Issues**: Check SSL certificates for HTTPS Keycloak

### Port Conflicts
- **Docker Conflicts**: Stop Docker containers using port 3001
- **Other Services**: Check for other Node.js apps on same port
- **Permission Issues**: Use ports > 1024 for non-root users

## 📦 Transition Back to Docker

Once the backend is working locally, follow these steps to containerize:

### 1. Create Clean Dockerfile
```bash
# Test current Dockerfile locally
docker build -f docker/Dockerfile.backend -t backend-test .
docker run -p 3001:3001 --env-file backend/.env.local backend-test
```

### 2. Update Docker Compose
```bash
# Update environment variables in docker-compose.yml
# Test the full stack
docker-compose up --build
```

### 3. Validation Steps
- [ ] Backend starts without errors
- [ ] Health check responds correctly
- [ ] Database connection established
- [ ] API endpoints accessible
- [ ] Frontend can communicate with backend

## 📊 Success Indicators

### Expected Startup Logs
```
[timestamp] ✅ Environment variables loaded
[timestamp] ✅ Database connected successfully
[timestamp] ✅ Prisma client initialized
[timestamp] ✅ Server is running on port 3001
[timestamp] ✅ Server started successfully
[timestamp] 🎉 Backend startup complete!
```

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2024-01-XX...",
  "uptime": "XX seconds",
  "database": "connected",
  "environment": "development"
}
```

### Port Binding Confirmation
```bash
# Should show backend process
lsof -Pi :3001 -sTCP:LISTEN
```

## 🔄 Next Steps

1. **Local Success**: Backend starts and responds to health checks
2. **API Testing**: Test OAuth2 endpoints and database operations
3. **Frontend Integration**: Connect frontend to local backend
4. **Docker Rebuild**: Create optimized Dockerfile based on working local setup
5. **Production Deploy**: Deploy containerized version with confidence

---

For additional help, check the debug script output or examine logs in `backend/logs/app.log`.