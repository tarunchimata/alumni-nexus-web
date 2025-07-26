# My School Buddies - Production Deployment Guide

## 🚀 Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd my-school-buddies

# 2. Run automated deployment
chmod +x scripts/deploy.sh
./scripts/deploy.sh prod

# 3. Access application
# Frontend: https://school.hostingmanager.in
# Backend API: https://api.hostingmanager.in/api
# Keycloak: https://login.hostingmanager.in
```

## 📋 Prerequisites

### Infrastructure Requirements
- **Docker & Docker Compose** (v20.10+)
- **PostgreSQL Database** (v13+)
- **Keycloak Server** (v20+)
- **SSL Certificates** for HTTPS
- **Domain Names** configured:
  - `school.hostingmanager.in` (Frontend)
  - `api.hostingmanager.in` (Backend API)
  - `login.hostingmanager.in` (Keycloak)

### Environment Setup
- Copy `.env.production` files are in place
- Database connection credentials configured
- SendGrid API key for email notifications
- Keycloak realm and clients configured

## 🔧 Step-by-Step Deployment

### 1. Environment Configuration

```bash
# Copy production environment files
cp .env.production .env
cp backend/.env.production backend/.env

# Verify environment variables
./scripts/validate-keycloak.sh
```

### 2. Database Setup

```bash
# Create database schema
./scripts/deploy.sh db-setup

# Create demo users (optional)
./scripts/deploy.sh demo-users
```

### 3. Keycloak Configuration

#### Create Realm: `myschoolbuddies-realm`

#### Configure Client: `myschoolbuddies-client`
- **Client Type**: OpenID Connect
- **Access Type**: public
- **Valid Redirect URIs**: `https://school.hostingmanager.in/oauth2/callback`
- **Web Origins**: `https://school.hostingmanager.in`
- **Standard Flow**: Enabled
- **Direct Access Grants**: Disabled

#### Configure Backend Client: `myschoolbuddies-backend-client`
- **Client Type**: OpenID Connect
- **Access Type**: confidential
- **Client Secret**: `backend-client-secret-2025`
- **Service Accounts**: Enabled

#### Create Roles
```
Realm Roles:
- platform_admin
- school_admin
- teacher
- student
- alumni
```

### 4. Build and Deploy

```bash
# Automated deployment
./scripts/deploy.sh prod

# Or manual steps
make install
make build
make docker-build
make docker-up
```

### 5. Health Verification

```bash
# Check service health
./scripts/deploy.sh health

# Individual health checks
curl https://api.hostingmanager.in/api/health
curl https://school.hostingmanager.in/health
```

## 🛠️ Management Commands

### Using Deploy Script
```bash
./scripts/deploy.sh menu     # Interactive menu
./scripts/deploy.sh prod     # Production deployment
./scripts/deploy.sh dev      # Development deployment
./scripts/deploy.sh start    # Start services
./scripts/deploy.sh stop     # Stop services
./scripts/deploy.sh restart  # Restart services
./scripts/deploy.sh logs     # View logs
./scripts/deploy.sh health   # Health check
./scripts/deploy.sh clean    # Cleanup resources
```

### Using Makefile
```bash
make help           # Show all commands
make setup          # Development setup
make deploy         # Production deployment
make start          # Start services
make stop           # Stop services
make logs           # View logs
make health         # Health check
make clean          # Cleanup
```

## 🔍 Troubleshooting

### Common Issues

#### 1. OAuth2 Login Fails
```bash
# Validate Keycloak configuration
./scripts/validate-keycloak.sh

# Check logs
docker-compose logs backend frontend
```

#### 2. Database Connection Error
```bash
# Test database connection
psql "postgresql://msbfinalroot:vA5ZXB2Nb6M3P22GWZRch999@pg.hostingmanager.in:5432/myschoolbuddies_budibase_db"

# Check backend logs
docker-compose logs backend
```

#### 3. CORS Errors
- Verify `CORS_ORIGIN` in backend environment
- Check Keycloak web origins configuration
- Ensure frontend domain matches redirect URI

#### 4. SSL Certificate Issues
- Verify certificates are properly installed
- Check nginx configuration
- Test HTTPS endpoints

### Log Locations
```bash
# Application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Nginx logs (if using proxy)
docker-compose logs -f nginx

# Health check logs
./scripts/deploy.sh health
```

## 📊 Production Monitoring

### Health Endpoints
- **Frontend**: `https://school.hostingmanager.in/health`
- **Backend**: `https://api.hostingmanager.in/api/health`

### Key Metrics
- Response time < 2s
- Database connection status
- Keycloak connectivity
- Memory and CPU usage
- Active user sessions

## 🔐 Security Checklist

- [ ] HTTPS enforced on all domains
- [ ] Secure cookies configured (`COOKIE_SECURE=true`)
- [ ] CORS properly configured
- [ ] JWT secrets are production-grade
- [ ] Database credentials secured
- [ ] Keycloak admin credentials secured
- [ ] SendGrid API key secured
- [ ] File upload restrictions in place

## 🔄 Backup and Recovery

### Database Backup
```bash
# Create backup
pg_dump "postgresql://msbfinalroot:vA5ZXB2Nb6M3P22GWZRch999@pg.hostingmanager.in:5432/myschoolbuddies_budibase_db" > backup.sql

# Restore from backup
psql "postgresql://msbfinalroot:vA5ZXB2Nb6M3P22GWZRch999@pg.hostingmanager.in:5432/myschoolbuddies_budibase_db" < backup.sql
```

### Version Rollback
```bash
# Create new version tag
./scripts/create-git-tag.sh

# Rollback to previous version
git checkout v1.0.0
./scripts/deploy.sh prod
```

## 📞 Support Contacts

- **Technical Lead**: [Your contact]
- **Database Admin**: [DBA contact]
- **Infrastructure**: [DevOps contact]
- **Keycloak Admin**: [Identity admin contact]

## 🎯 Production Readiness Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database schema loaded with seed data
- [ ] Keycloak realm and clients configured
- [ ] SSL certificates installed
- [ ] DNS records pointing to correct servers
- [ ] Backup strategy in place

### Post-Deployment
- [ ] All health endpoints responding
- [ ] OAuth2 login flow working
- [ ] All 5 dashboards accessible
- [ ] CSV import functionality tested
- [ ] Email notifications working
- [ ] Performance benchmarks met
- [ ] Security scan completed
- [ ] Monitoring alerts configured

### Go-Live
- [ ] User acceptance testing passed
- [ ] Load testing completed
- [ ] Disaster recovery plan documented
- [ ] Team trained on production procedures
- [ ] Support documentation updated