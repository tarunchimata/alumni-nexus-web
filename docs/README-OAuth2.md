# OAuth2 + PKCE Implementation Guide

This guide covers the complete OAuth2 Authorization Code + PKCE implementation for My School Buddies application.

## 🚀 Quick Start

### 1. Environment Setup

**Frontend (.env):**
```bash
VITE_USE_OAUTH2=true
VITE_KEYCLOAK_URL=https://login.hostingmanager.in
VITE_KEYCLOAK_REALM=myschoolbuddies-realm
VITE_KEYCLOAK_CLIENT_ID=myschoolbuddies-client
VITE_OAUTH2_REDIRECT_URI=http://localhost:3000/oauth2/callback
```

**Backend (.env):**
```bash
USE_OAUTH2=true
KEYCLOAK_FRONTEND_CLIENT_ID=myschoolbuddies-client
KEYCLOAK_ADMIN_USER=admin@myschoolbuddies.com
KEYCLOAK_ADMIN_PASSWORD=S@feAdminKeycloak!2025
OAUTH2_REDIRECT_URI=http://localhost:3000/oauth2/callback
```

### 2. Create Demo Users

```bash
# Install dependencies for scripts
npm install axios dotenv

# Create demo users in Keycloak
node scripts/create-demo-users.js

# To delete demo users
node scripts/create-demo-users.js --delete
```

### 3. Test OAuth2 Flow

```bash
# Test all demo users
node scripts/login-test.js

# Test specific user
node scripts/login-test.js --user admin@myschoolbuddies.com
```

### 4. Run Application

```bash
# Frontend
npm run dev

# Backend
cd backend && npm run dev
```

## 🔐 Demo User Credentials

| Role | Email | Password |
|------|-------|----------|
| Platform Admin | admin@myschoolbuddies.com | AdminChimatas@2025! |
| School Admin | schooladmin@myschoolbuddies.com | SchoolAdmin@2025! |
| Teacher | teacher@myschoolbuddies.com | Teacher@2025! |
| Student | student@myschoolbuddies.com | Student@2025! |
| Alumni | alumni@myschoolbuddies.com | Alumni@2025! |

## 🔄 Authentication Modes

### OAuth2 Mode (Default)
- Set `VITE_USE_OAUTH2=true` and `USE_OAUTH2=true`
- Uses PKCE for security
- Tokens stored in localStorage
- Bearer token authentication

### Cookie Mode (Fallback)
- Set `VITE_USE_OAUTH2=false` and `USE_OAUTH2=false`
- Uses existing cookie-based authentication
- Session-based authentication

## 🏗️ Architecture

### Frontend Flow
1. **Login Initiation** → `oauth2Service.login()`
2. **PKCE Generation** → Code verifier + SHA256 challenge
3. **Authorization** → Redirect to Keycloak
4. **Callback Handling** → `/oauth2/callback` page
5. **Token Exchange** → Exchange code for tokens
6. **User Profile** → Fetch user info and roles
7. **Dashboard Redirect** → Role-based routing

### Backend Endpoints
- `POST /api/oauth2/token` - Exchange authorization code
- `GET /api/oauth2/userinfo` - Get user profile
- `POST /api/oauth2/refresh` - Refresh access token
- `POST /api/oauth2/logout` - Logout user
- `GET /api/oauth2/authorize` - Authorization URL helper

## 🛡️ Security Features

### PKCE Implementation
- **Code Verifier**: 128-character base64url string
- **Code Challenge**: SHA256 hash of verifier
- **Challenge Method**: S256
- **State Parameter**: CSRF protection

### Token Security
- **Access Tokens**: Short-lived (configurable in Keycloak)
- **Refresh Tokens**: Long-lived for seamless renewal
- **Secure Storage**: localStorage with expiry validation
- **Bearer Authentication**: Authorization header

## 🧪 Testing

### Manual Testing
1. Visit `http://localhost:3000/login`
2. Click "Login with Keycloak"
3. Use demo credentials
4. Verify dashboard access by role

### Automated Testing
```bash
# Run OAuth2 test suite
node scripts/login-test.js

# Test specific functionality
node scripts/login-test.js --user teacher@myschoolbuddies.com
```

### API Testing (Postman Collection)
Import the included Postman collection to test:
- Token exchange endpoint
- User info endpoint
- Token refresh flow
- Protected resource access

## 🔧 Troubleshooting

### Common Issues

**1. "Invalid state parameter" error**
- Check redirect URI configuration
- Ensure HTTPS in production
- Verify state parameter generation

**2. "Token exchange failed"**
- Verify client ID configuration
- Check Keycloak realm settings
- Validate PKCE parameters

**3. "User info not found"**
- Ensure user exists in Keycloak
- Check role assignments
- Verify token permissions

**4. "Dashboard access denied"**
- Confirm role-based routing logic
- Check JWT token roles
- Verify authentication state

### Debug Mode
Set `VITE_LOG_LEVEL=debug` for detailed logging:
```bash
# Enable debug logging
VITE_LOG_LEVEL=debug npm run dev
```

### Keycloak Configuration
Ensure Keycloak client has:
- Valid redirect URIs
- PKCE enabled
- Appropriate scopes (openid, profile, email)
- Correct role mappings

## 📊 Monitoring

### Frontend Metrics
- Authentication success/failure rates
- Token refresh frequency
- User session duration
- Role distribution

### Backend Metrics
- OAuth2 endpoint performance
- Token validation latency
- Error rates by endpoint
- User authentication patterns

## 🚀 Production Deployment

### Environment Variables
Update for production environment:
```bash
# Frontend
VITE_KEYCLOAK_URL=https://your-keycloak-domain.com
VITE_OAUTH2_REDIRECT_URI=https://your-app-domain.com/oauth2/callback

# Backend
KEYCLOAK_URL=https://your-keycloak-domain.com
OAUTH2_REDIRECT_URI=https://your-app-domain.com/oauth2/callback
USE_OAUTH2=true
```

### Docker Deployment
```bash
# Build and deploy
docker-compose up --build

# Check health
curl http://localhost:3001/health
```

### SSL/TLS Configuration
- Enable HTTPS for production
- Update redirect URIs to use HTTPS
- Configure SSL certificates
- Update CORS settings

## 📚 API Reference

### OAuth2 Service Methods

```typescript
// Login user (redirect to Keycloak)
await oauth2Service.login();

// Check authentication status
const isAuth = await oauth2Service.isAuthenticated();

// Get access token (auto-refresh if needed)
const token = await oauth2Service.getAccessToken();

// Get user information
const user = await oauth2Service.getUserInfo();

// Logout user
await oauth2Service.logout();
```

### Backend API Endpoints

```bash
# Exchange authorization code for tokens
POST /api/oauth2/token
Content-Type: application/json
{
  "code": "authorization_code",
  "codeVerifier": "pkce_code_verifier",
  "redirectUri": "http://localhost:3000/oauth2/callback"
}

# Get user information
GET /api/oauth2/userinfo
Authorization: Bearer <access_token>

# Refresh access token
POST /api/oauth2/refresh
Content-Type: application/json
{
  "refreshToken": "refresh_token"
}

# Logout user
POST /api/oauth2/logout
Content-Type: application/json
{
  "refreshToken": "refresh_token"
}
```

## 🤝 Contributing

When adding new OAuth2 features:
1. Update both frontend and backend components
2. Add appropriate tests
3. Update documentation
4. Consider backward compatibility
5. Test with all user roles

## 📝 License

This OAuth2 implementation is part of the My School Buddies project.