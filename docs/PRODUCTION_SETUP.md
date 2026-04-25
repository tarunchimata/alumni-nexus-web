# Production Setup Guide

## Quick Setup Commands

```bash
# 1. Fix phone validation and update environment
./scripts/make-executable.sh
./scripts/fix-backend-deps.sh

# 2. Start development
./scripts/start-dev.sh

# 3. Test registration
node scripts/test-registration.mjs

# 4. Production deployment
./scripts/deploy.sh
```

## Environment Configuration

### Frontend (.env.production)
```
VITE_OAUTH2_REDIRECT_URI=https://school.hostingmanager.in/oauth2/callback
VITE_API_URL=https://api.hostingmanager.in/api
VITE_KEYCLOAK_URL=https://login.hostingmanager.in
```

### Backend (backend/.env.production)
```
CORS_ORIGIN=https://school.hostingmanager.in,https://api.hostingmanager.in
COOKIE_DOMAIN=.hostingmanager.in
```

### Keycloak Client Configuration
- Import `keycloak/client-config-production.json` to Keycloak
- Ensure redirect URIs include production domains
- Enable PKCE for security

## Fixed Issues

✅ Phone number validation (now accepts standard formats)
✅ Frontend port changed from 8080 to 3000 
✅ OAuth2 callback styling uses design system tokens
✅ CORS includes both localhost and production domains
✅ Deployment script enhanced with full production support

## Test Registration Flow

The test script now uses a valid phone number format and should work:

```bash
node scripts/test-registration.mjs
```

## Production URLs

- Frontend: https://school.hostingmanager.in
- Backend API: https://api.hostingmanager.in
- Keycloak: https://login.hostingmanager.in