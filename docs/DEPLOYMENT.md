# Deployment Guide (PR1 - DevOps Hotfixes)

This guide explains how to deploy the app with a stable Docker/Nginx setup and centralized environment configuration.

## 1) Environment variables

Create a root .env file based on .env.example and fill in real values.

Important keys:
- Backend: PORT, DATABASE_URL, KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_ADMIN_USERNAME, KEYCLOAK_ADMIN_PASSWORD, CORS_ORIGIN, SENDGRID_API_KEY, SESSION_SECRET, JWT_SECRET, LOG_LEVEL, REGISTRATION_MODE, AUTO_APPROVE_PLATFORM_UPLOADS, IMPORT_STAGING_RETENTION_DAYS
- Frontend: VITE_API_URL, VITE_KEYCLOAK_URL, VITE_KEYCLOAK_REALM, VITE_KEYCLOAK_CLIENT_ID, VITE_OAUTH2_REDIRECT_URI

Notes:
- VITE_API_URL must be /api in production to use same-origin proxy via Nginx.
- Do not commit secrets.

## 2) Build and run with Docker Compose

From the repo root:

- Build: ./scripts/deploy.sh build
- Start: ./scripts/deploy.sh start

This uses docker/docker-compose.yml and the root .env via env_file.

## 3) Nginx Proxy

- /api is proxied to backend:3033
- client_max_body_size 50m
- proxy_read_timeout 300s, proxy_send_timeout 300s
- No SPA fallback for /api

## 4) Health and test endpoints

Backend provides:
- GET /api/health -> { "status": "ok" }
- GET /api/test -> { status, version, environment }

Through Nginx (default port 80):
- curl -sS http://localhost/api/health
- curl -sS http://localhost/api/test

Direct to backend (if exposed):
- curl -sS http://localhost:3033/health

## 5) Troubleshooting

- If frontend can’t reach the API, confirm VITE_API_URL=/api in .env and that Nginx is up.
- If CSV uploads fail with 413, verify Nginx client_max_body_size 50m.
- Check Docker logs: docker logs <container>.

## 6) Next steps (PR2+)

- Implement ImportJob/ImportRow migrations, staging, Keycloak-first provisioning, activation, rollback.
- Add UI for job list/detail and Socket.IO progress.
