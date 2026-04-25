# OAuth2 Comprehensive Debugging Plan - Implementation Guide

## 🚀 Overview

This document outlines the comprehensive OAuth2 debugging tools and enhanced logging implemented to diagnose and resolve token exchange failures. The implementation follows a systematic approach to identify network, configuration, and environment issues.

## 🛠 Implemented Debugging Features

### 1. Enhanced Backend OAuth2 Health Endpoint

**Endpoint:** `GET /api/oauth2/health`

**Purpose:** Comprehensive health check for OAuth2 service and configuration

**Response includes:**
- Service status and version
- Environment configuration
- Keycloak endpoint URLs
- CORS and network settings
- Real-time Keycloak connectivity test
- Request headers and network information

**Example Usage:**
```bash
curl https://alumni.hostingmanager.in/api/oauth2/health
```

### 2. Enhanced Frontend OAuth2 Service Logging

**Features:**
- Comprehensive debug logging with timestamps
- Detailed request/response logging for token exchange
- Environment variable validation
- Network connectivity verification
- Error categorization (network vs application errors)

**Log Categories:**
- `[OAuth2Service]` - General service operations
- `[OAuth2Service ERROR]` - Error conditions
- `[OAuth2 DEBUG]` - Detailed debugging information

### 3. Enhanced OAuth2 Callback Page

**Improvements:**
- Detailed URL parameter logging
- Enhanced error handling and user feedback
- Debugging instructions in console
- Extended error display time for debugging
- Comprehensive error categorization

### 4. Browser Console Debugging Tools

**Files:**
- `public/debug-oauth2.js` - Browser console commands
- `scripts/debug-oauth2-flow.js` - Comprehensive debug script

**Available Commands:**
```javascript
// Test backend connectivity
testBackendHealth()

// Check current environment
checkEnvironment()

// Test OAuth2 service
testOAuth2Service()

// Manual token exchange test
testTokenExchange("your_auth_code")

// Run complete debug suite
runDebugSuite()
```

## 🔍 Debugging Workflow

### Step 1: Basic Connectivity Test

1. **Test Backend Health:**
   ```bash
   curl -X GET https://alumni.hostingmanager.in/api/oauth2/health
   ```

2. **Browser Console Test:**
   ```javascript
   fetch('/api/oauth2/health').then(r => r.json()).then(console.log)
   ```

3. **Expected Result:** HTTP 200 with detailed health information

### Step 2: Environment Variable Verification

1. **Frontend Environment Check:**
   ```javascript
   console.log('Environment Variables:', {
     VITE_BACKEND_API_URL: import.meta.env.VITE_BACKEND_API_URL,
     VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
     VITE_PUBLIC_URL: import.meta.env.VITE_PUBLIC_URL,
     VITE_OAUTH2_REDIRECT_URI: import.meta.env.VITE_OAUTH2_REDIRECT_URI
   });
   ```

2. **Backend Environment Check:**
   - Check `/api/oauth2/health` response for configuration section
   - Verify Keycloak URLs and client IDs match

### Step 3: Network Connectivity Analysis

1. **Test Different Backend URLs:**
   - `https://alumni.hostingmanager.in/api/oauth2/health`
   - `http://192.168.1.99:3033/api/oauth2/health`
   - Current domain `/api/oauth2/health`

2. **Check Browser Network Tab:**
   - Look for CORS preflight failures
   - Verify SSL certificate issues
   - Check for proxy/firewall blocking

### Step 4: Manual Token Exchange Test

1. **Generate Login URL:**
   ```javascript
   // Use debug script to generate test URL
   oauth2Debug.generateLoginUrl()
   ```

2. **Extract Authorization Code:**
   - Complete login flow
   - Copy `code` parameter from callback URL

3. **Test Token Exchange:**
   ```javascript
   testTokenExchange("your_authorization_code_here")
   ```

### Step 5: End-to-End Flow Testing

1. **Load Debug Tools:**
   ```html
   <script src="/debug-oauth2.js"></script>
   ```

2. **Run Complete Suite:**
   ```javascript
   runDebugSuite()
   ```

## 🎯 Common Issues and Solutions

### Issue 1: Backend Not Accessible via HTTPS Domain

**Symptoms:**
- Health endpoint returns 404 or connection refused
- Token exchange fails with network error

**Solution:**
- Verify reverse proxy configuration
- Check SSL certificate validity
- Ensure backend is running and accessible

**Debug Commands:**
```bash
# Test backend directly
curl -I https://alumni.hostingmanager.in/api/oauth2/health

# Test SSL certificate
openssl s_client -connect alumni.hostingmanager.in:443

# Test local backend
curl -I http://192.168.1.99:3033/api/oauth2/health
```

### Issue 2: Environment Variable Mismatch

**Symptoms:**
- Health endpoint shows wrong Keycloak URLs
- Client ID mismatch errors

**Solution:**
- Verify `.env` files match Keycloak configuration
- Check `KEYCLOAK_FRONTEND_CLIENT_ID` consistency
- Ensure redirect URIs are exactly configured

**Debug Commands:**
```javascript
// Check frontend environment
checkEnvironment()

// Check backend configuration
fetch('/api/oauth2/config').then(r => r.json()).then(console.log)
```

### Issue 3: CORS Configuration Issues

**Symptoms:**
- Preflight CORS errors in browser console
- Token exchange blocked by CORS policy

**Solution:**
- Verify `CORS_ORIGIN` includes frontend domain
- Check OPTIONS method handling
- Ensure credentials are allowed

**Debug Commands:**
```javascript
// Test CORS preflight
fetch('/api/oauth2/health', {
  method: 'OPTIONS',
  headers: { 'Origin': window.location.origin }
})
```

### Issue 4: Keycloak Client Configuration

**Symptoms:**
- `invalid_client` errors
- Authorization flow works but token exchange fails

**Solution:**
- Verify client is configured as "public" with PKCE
- Check redirect URIs match exactly
- Ensure Web Origins are configured

**Debug Steps:**
1. Check Keycloak admin console client settings
2. Verify redirect URIs: `https://alumni.hostingmanager.in/auth/callback`
3. Confirm Web Origins: `https://alumni.hostingmanager.in`
4. Ensure Access Type is "public"

## 📊 Expected Success Criteria

### Backend Health Check ✅
- HTTP 200 status
- `status: "healthy"`
- Valid Keycloak connectivity
- Correct environment configuration

### Frontend Environment ✅
- All `VITE_*` variables set correctly
- Current origin matches expected domain
- HTTPS protocol enabled

### Token Exchange ✅
- HTTP 200 status from `/api/oauth2/token`
- Valid access and refresh tokens returned
- No CORS or network errors

### End-to-End Flow ✅
- Login redirects to Keycloak correctly
- Callback receives authorization code
- Token exchange completes successfully
- Dashboard loads with user profile

## 🔧 Advanced Debugging

### Browser DevTools Network Analysis

1. **Open Network Tab before login**
2. **Filter by "oauth2" or "token"**
3. **Look for failed requests (red entries)**
4. **Check request/response headers**
5. **Verify request payload format**

### Backend Log Analysis

1. **Check backend logs for OAuth2 requests:**
   ```bash
   # If using PM2
   pm2 logs backend

   # If using direct Node.js
   tail -f logs/app.log
   ```

2. **Look for correlation with frontend timestamps**
3. **Check for Keycloak connectivity issues**
4. **Verify request parameter validation**

### Keycloak Server Logs

1. **Access Keycloak admin console**
2. **Check Events → Login Events**
3. **Look for failed token exchange attempts**
4. **Verify client authentication methods**

## 📞 Support Information

If issues persist after following this debugging guide:

1. **Capture Debug Output:**
   - Run `runDebugSuite()` in browser console
   - Copy all console output
   - Include network tab screenshots

2. **Provide Environment Details:**
   - Current domain and browser
   - Backend health check response
   - Keycloak client configuration

3. **Include Error Details:**
   - Exact error messages
   - Browser console errors
   - Network request failures

The comprehensive debugging tools should identify the exact cause of token exchange failures and provide clear resolution paths.