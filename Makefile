# My School Buddies Makefile
# ===========================

.PHONY: help dev prod build start stop restart logs health db demo clean install

# Default target
help: ## Show this help message
	@echo "My School Buddies - Available Commands:"
	@echo "======================================"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Environment Commands
dev: ## Deploy development environment
	@chmod +x scripts/deploy.sh && scripts/deploy.sh dev

prod: ## Deploy production environment
	@chmod +x scripts/deploy.sh && scripts/deploy.sh prod

# Build Commands
install: ## Install dependencies for frontend and backend
	@echo "📦 Installing frontend dependencies..."
	@npm ci
	@echo "📦 Installing backend dependencies..."
	@cd backend && npm ci

build: ## Build frontend and backend
	@chmod +x scripts/deploy.sh && scripts/deploy.sh build

# Service Management
start: ## Start all services
	@chmod +x scripts/deploy.sh && scripts/deploy.sh start

stop: ## Stop all services
	@chmod +x scripts/deploy.sh && scripts/deploy.sh stop

restart: ## Restart all services
	@chmod +x scripts/deploy.sh && scripts/deploy.sh restart

# Monitoring
logs: ## Show application logs
	@chmod +x scripts/deploy.sh && scripts/deploy.sh logs

health: ## Check service health
	@chmod +x scripts/deploy.sh && scripts/deploy.sh health

# Database Operations
db: ## Set up database schema and seed data
	@chmod +x scripts/deploy.sh && scripts/deploy.sh db-setup

demo: ## Create demo users for testing
	@chmod +x scripts/deploy.sh && scripts/deploy.sh demo-users

# Maintenance
clean: ## Clean up Docker containers and volumes
	@chmod +x scripts/deploy.sh && scripts/deploy.sh clean

# Quick Development Commands
dev-quick: ## Quick start development (skip build and db)
	@chmod +x scripts/deploy.sh && scripts/deploy.sh dev --skip-build --skip-db

# Frontend specific commands
frontend-dev: ## Start frontend in development mode
	@npm run dev

frontend-build: ## Build frontend only
	@npm run build

frontend-preview: ## Preview built frontend
	@npm run preview

# Backend specific commands
backend-dev: ## Start backend in development mode
	@cd backend && npm run dev

backend-build: ## Build backend only
	@cd backend && npm run build

backend-start: ## Start built backend
	@cd backend && npm start

# Testing Commands
test-frontend: ## Run frontend tests
	@npm run test

test-backend: ## Run backend tests
	@cd backend && npm test

# Docker Commands
docker-build: ## Build Docker images
	@cd docker && docker-compose build

docker-up: ## Start Docker containers
	@cd docker && docker-compose up -d

docker-down: ## Stop Docker containers
	@cd docker && docker-compose down

docker-logs: ## Show Docker logs
	@cd docker && docker-compose logs -f

# Environment Setup
env-dev: ## Copy development environment files
	@cp .env.example .env 2>/dev/null || echo "Development .env already exists"
	@cp backend/.env.example backend/.env 2>/dev/null || echo "Backend development .env already exists"

env-prod: ## Copy production environment files
	@cp .env.production .env
	@cp backend/.env.production backend/.env

# Quick Reference
info: ## Show application information
	@echo "🏫 My School Buddies Platform"
	@echo "=========================="
	@echo "Frontend URL (Dev):  http://localhost:3000"
	@echo "Backend URL (Dev):   http://localhost:3001"
	@echo "Frontend URL (Prod): https://school.hostingmanager.in"
	@echo "Backend URL (Prod):  https://api.hostingmanager.in"
	@echo "Keycloak Admin:      https://login.hostingmanager.in/auth/admin/"
	@echo ""
	@echo "📚 Documentation:"
	@echo "  - README.md"
	@echo "  - KEYCLOAK_DEPLOYMENT_GUIDE.md"
	@echo "  - README-OAuth2.md"

# Development Workflow
setup: install env-dev db ## Complete development setup
	@echo "✅ Development environment is ready!"
	@echo "Run 'make dev' to start the application"

# Production Workflow
deploy: env-prod build prod ## Complete production deployment
	@echo "✅ Production deployment completed!"