# OAuth2 + PKCE Testing Guide for My School Buddies

## 🎯 Overview

This guide covers testing the complete OAuth2 Authorization Code + PKCE flow with Keycloak integration.

## 📋 Prerequisites

### Environment Setup

**Frontend `.env`:**
```bash
VITE_USE_OAUTH2=true
VITE_KEYCLOAK_URL=https://login.hostingmanager.in
VITE_KEYCLOAK_REALM=myschoolbuddies-realm
VITE_KEYCLOAK_CLIENT_ID=myschoolbuddies-client
# VITE_OAUTH2_REDIRECT_URI=http://localhost:3000/oauth2/callback (optional - defaults to current origin)
VITE_API_URL=http://localhost:3001
```

**Backend `.env`:**
```bash
USE_OAUTH2=true
KEYCLOAK_URL=https://login.hostingmanager.in
KEYCLOAK_REALM=myschoolbuddies-realm
KEYCLOAK_CLIENT_ID=myschoolbuddies-backend-client
KEYCLOAK_CLIENT_SECRET=backend-client-secret-2025
KEYCLOAK_ADMIN_USERNAME=admin@myschoolbuddies.com
KEYCLOAK_ADMIN_PASSWORD=S@feAdminKeycloak!2025
```

### Services Running

1. **Frontend**: `npm run dev` (port 3000)
2. **Backend**: `npm run dev` (port 3001)
3. **Keycloak**: https://login.hostingmanager.in

## 🧪 Automated Testing

### Local Development
Run the OAuth2 flow test script:

```bash
node scripts/test-oauth2-flow.js
```

This script tests:
- ✅ Backend health check
- ✅ Authorization URL generation
- ✅ OAuth2 endpoint responses
- ✅ Frontend accessibility
- ✅ Parameter validation

### Lovable Preview Testing
1. **Deploy to Preview**: Click "Publish" in Lovable to get your preview URL
2. **Update Keycloak**: Add your preview domain to Keycloak client settings:
   - Valid Redirect URIs: `https://your-preview-domain.lovable.app/oauth2/callback`
   - Web Origins: `https://your-preview-domain.lovable.app`
3. **Test Flow**: 
   - Open your preview URL
   - Click "Login with Keycloak"
   - Should redirect to Keycloak, then back to your preview domain

## 🔍 Manual Testing

### Step 1: Access Login Page
1. Navigate to: http://localhost:3000 (local) or your Lovable preview URL
2. Click "Login with Keycloak" button
3. **Expected**: Redirect to Keycloak login page at:
   ```
   https://login.hostingmanager.in/realms/myschoolbuddies-realm/protocol/openid-connect/auth?...
   ```

### Step 2: Test Authentication
Use these demo credentials:

| Role | Email | Password |
|------|-------|----------|
| Platform Admin | admin@myschoolbuddies.com | AdminChimatas@2025! |
| School Admin | schooladmin@myschoolbuddies.com | SchoolAdmin@2025! |
| Teacher | teacher@myschoolbuddies.com | Teacher@2025! |
| Student | student@myschoolbuddies.com | Student@2025! |
| Alumni | alumni@myschoolbuddies.com | Alumni@2025! |

### Step 3: Verify Callback
After successful login:
1. **Expected**: Redirect to callback URL (dynamically determined):
   ```
   http://localhost:3000/oauth2/callback?code=...&state=... (local)
   https://your-preview-domain.lovable.app/oauth2/callback?code=...&state=... (preview)
   ```
2. **Expected**: OAuth2Callback component processes the code
3. **Expected**: User info is fetched and stored
4. **Expected**: Redirect to dashboard with correct role

### Step 4: Verify Dashboard Access
1. **Expected**: Dashboard loads without errors
2. **Expected**: User role displayed correctly
3. **Expected**: Navigation menu shows role-appropriate options

## 🐛 Debugging

### Common Issues

**1. Login Button Does Nothing**
- Check browser console for errors
- Verify VITE_* environment variables are set
- Check that OAuth2 service is reading environment correctly

**2. Redirect URI Mismatch**
- Verify Keycloak client configuration includes your current domain:
  - Valid Redirect URIs: 
    - `http://localhost:3000/oauth2/callback` (local)
    - `https://your-preview-domain.lovable.app/oauth2/callback` (preview)
    - `https://yourdomain.com/oauth2/callback` (production)
  - Web Origins: Include all your domains

**3. Token Exchange Fails**
- Check backend logs for parameter errors
- Verify `code_verifier` parameter naming consistency
- Check Keycloak client secret configuration

**4. User Info Fails**
- Check backend OAuth2 routes return valid JSON
- Verify access token is valid
- Check user roles are properly assigned in Keycloak

### Browser Console Commands

Test OAuth2 service manually:
```javascript
// Check environment variables
console.log('OAuth2 Config:', {
  keycloakUrl: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
  redirectUri: import.meta.env.VITE_OAUTH2_REDIRECT_URI
});

// Test authorization URL generation
oauth2Service.buildAuthUrl().then(url => console.log('Auth URL:', url));

// Check stored tokens
console.log('Stored tokens:', {
  accessToken: localStorage.getItem('oauth2_access_token'),
  refreshToken: localStorage.getItem('oauth2_refresh_token'),
  expiresAt: localStorage.getItem('oauth2_expires_at')
});
```

### Network Tab Debugging

Monitor these requests:
1. **Authorization redirect**: Should redirect to Keycloak
2. **POST /api/oauth2/token**: Should exchange code for tokens
3. **GET /api/oauth2/userinfo**: Should return user profile
4. **POST /api/oauth2/refresh**: Should refresh expired tokens

## ✅ Success Criteria

The OAuth2 flow is working correctly when:

- ✅ Login button redirects to Keycloak
- ✅ Demo users can authenticate successfully
- ✅ Callback processing completes without errors
- ✅ Tokens are stored and accessible
- ✅ User info is retrieved and displayed
- ✅ Dashboard loads with correct role-based content
- ✅ No console errors or network failures
- ✅ Token refresh works automatically

## 🚀 Production Deployment

### Environment Configuration
The OAuth2 redirect URI is now **dynamic** and works across environments:

- **Local**: `http://localhost:3000/oauth2/callback`
- **Lovable Preview**: `https://your-app.lovable.app/oauth2/callback`
- **Production**: `https://yourdomain.com/oauth2/callback`

### Keycloak Client Setup
Add all your domains to Keycloak client configuration:

**Valid Redirect URIs:**
```
http://localhost:3000/oauth2/callback
https://*.lovable.app/oauth2/callback
https://yourdomain.com/oauth2/callback
```

**Web Origins:**
```
http://localhost:3000
https://*.lovable.app
https://yourdomain.com
```

### Testing Checklist
- ✅ Local development works
- ✅ Lovable preview works  
- ✅ Production deployment works
- ✅ All demo users can log in
- ✅ No console errors

## 📞 Support

If you encounter issues:

1. Check the automated test script output
2. Review browser console and network tab
3. Check backend logs for OAuth2 route errors
4. Verify Keycloak client configuration
5. Test with multiple demo users to isolate role-specific issues