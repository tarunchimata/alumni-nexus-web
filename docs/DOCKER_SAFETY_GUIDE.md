# Docker Safety Guide

## ⚠️ CRITICAL: Safe Docker Commands for MSB

### Safe Scripts (Use These)
- `./scripts/msb-docker-restart.sh` - Safe restart of MSB services only
- `./scripts/msb-docker-clean.sh` - Cleanup with confirmations
- `./scripts/deploy.sh` - Safe deployment with backups

### Dangerous Commands (NEVER USE)
- `docker stop $(docker ps -q)` - Stops ALL containers
- `docker rm $(docker ps -aq)` - Removes ALL containers
- `docker system prune -f` - Removes ALL unused Docker resources
- `docker network prune -f` - Removes ALL unused networks

## Project-Specific Commands

### MSB Container Management
```bash
# Stop only MSB containers
docker compose -f docker/docker-compose.yml down

# Remove only MSB containers
docker rm $(docker ps -aq -f name=msb)
docker rm $(docker ps -aq -f name=docker_)

# Remove only MSB networks
docker network rm myschoolbuddies-network

# Remove only MSB volumes
docker volume rm docker_backend_logs docker_backend_uploads
```

### Safe Restart Process
```bash
# 1. Use the safe restart script
./scripts/msb-docker-restart.sh

# 2. Or manual safe approach
cd docker
docker compose down --remove-orphans
export COMPOSE_PROJECT_NAME=msb
docker compose build --no-cache
docker compose up -d
```

## Recovery Steps

If you accidentally ran aggressive Docker commands:

1. **Check what's still running:**
   ```bash
   docker ps -a
   docker network ls
   docker volume ls
   ```

2. **Restart other projects individually:**
   - Navigate to each project's directory
   - Run their specific docker-compose commands

3. **Use MSB safe restart:**
   ```bash
   ./scripts/msb-docker-restart.sh
   ```

## Best Practices

1. **Always use project-specific scripts**
2. **Never use global Docker cleanup commands**
3. **Always backup before deployment**
4. **Test commands in development first**
5. **Use confirmations for destructive operations**

## Fixed Issues

✅ Replaced dangerous `fix-docker-compose.sh` with safe alternatives
✅ Added confirmation prompts to cleanup scripts
✅ Project-scoped container and network management
✅ Backup creation before deployments
✅ Health checks after deployment