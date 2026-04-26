# My School Buddies - Deployment Guide

## Overview

This guide covers the deployment of My School Buddies application using Docker containers.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL database access
- Keycloak server access
- Environment variables configured

## Quick Start

### 1. Environment Setup

Copy and configure the environment file:

```bash
cp docker/.env.example docker/.env
# Edit docker/.env with your configuration
```

### 2. Deploy Application

Use the deployment script:

```bash
cd docker/scripts
./deploy.sh
```

Select option "6. Start Full Application" from the menu.

### 3. Verify Deployment

Access the application:
- Frontend: http://localhost:8080
- Backend API: http://localhost:3033
- Health Check: http://localhost:3033/health

## Deployment Options

### Development Environment

```bash
cd docker
docker compose up -d
```

### Production Environment

```bash
cd docker
docker compose -f docker-compose.prod.yml up -d
```

## Environment Variables

Key environment variables in `docker/.env`:

- **Database**: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD
- **Keycloak**: KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID
- **Application**: API_PORT, FRONTEND_URL, NODE_ENV

## Health Checks

The application includes health checks:
- Backend: `/health` endpoint
- Frontend: HTTP response check
- Docker: Built-in health monitoring

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3033 and 8080 are available
2. **Database connection**: Verify DATABASE_URL format
3. **Keycloak issues**: Check Keycloak server accessibility

### Logs

View application logs:
```bash
cd docker/scripts
./deploy.sh
# Select option "9. View Logs"
```

### Restart Services

```bash
cd docker/scripts
./deploy.sh
# Select option "7. Restart Services"
```

## Backup and Recovery

### Backup Before Deployment

```bash
cd docker/scripts
./deploy.sh
# Select option "10. Backup Before Deploy"
```

### Rollback

If deployment fails:
1. Stop services: Option "8. Stop Services"
2. Restore from backup
3. Restart services: Option "6. Start Full Application"

## Monitoring

### Health Monitoring

Use the test script for comprehensive health checks:

```bash
cd docker/scripts
./test.sh
# Select option "10. Full End-to-End Validation"
```

### Test Reports

Generate detailed test reports:
```bash
cd docker/scripts
./test.sh
# Select option "11. Generate Test Report"
```

## Support

For deployment issues:
1. Check logs in `docker/logs/`
2. Run health checks using test script
3. Review environment configuration
4. Verify database and Keycloak connectivity
