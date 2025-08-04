/**
 * OAuth2 Flow Debugging Script
 * 
 * This script helps debug OAuth2 token exchange issues by testing:
 * 1. Backend connectivity via HTTPS domain
 * 2. OAuth2 health endpoint
 * 3. Environment variable configuration
 * 4. Manual token exchange testing
 * 
 * Run this in browser console or Node.js
 */

// Environment configuration
const CONFIG = {
  // Backend URLs to test
  backendUrls: [
    'https://alumni.hostingmanager.in/api',
    'http://192.168.1.99:3033/api',
    'http://localhost:3033/api'
  ],
  
  // Keycloak configuration
  keycloak: {
    url: 'https://login.hostingmanager.in',
    realm: 'myschoolbuddies-realm',
    clientId: 'myschoolbuddies-client'
  },
  
  // Test redirect URI
  redirectUri: 'https://alumni.hostingmanager.in/auth/callback'
};

/**
 * Debug OAuth2 Backend Connectivity
 */
async function debugBackendConnectivity() {
  console.group('🔍 OAuth2 Backend Connectivity Test');
  
  for (const baseUrl of CONFIG.backendUrls) {
    console.group(`Testing: ${baseUrl}`);
    
    try {
      // Test basic connectivity
      console.log('1. Testing basic connectivity...');
      const healthResponse = await fetch(`${baseUrl}/oauth2/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      console.log(`Status: ${healthResponse.status} ${healthResponse.statusText}`);
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('✅ Backend accessible');
        console.log('Health data:', healthData);
        
        // Test OAuth2 config endpoint
        console.log('2. Testing OAuth2 config...');
        const configResponse = await fetch(`${baseUrl}/oauth2/config`);
        
        if (configResponse.ok) {
          const configData = await configResponse.json();
          console.log('✅ OAuth2 config accessible');
          console.log('Config data:', configData);
        } else {
          console.log('❌ OAuth2 config failed:', configResponse.status);
        }
        
      } else {
        console.log('❌ Backend not accessible');
        const errorText = await healthResponse.text();
        console.log('Error:', errorText);
      }
      
    } catch (error) {
      console.error('❌ Network error:', error.message);
    }
    
    console.groupEnd();
  }
  
  console.groupEnd();
}

/**
 * Debug Keycloak Connectivity
 */
async function debugKeycloakConnectivity() {
  console.group('🔍 Keycloak Connectivity Test');
  
  try {
    const discoveryUrl = `${CONFIG.keycloak.url}/realms/${CONFIG.keycloak.realm}/.well-known/openid-configuration`;
    console.log(`Testing: ${discoveryUrl}`);
    
    const response = await fetch(discoveryUrl);
    
    if (response.ok) {
      const discoveryData = await response.json();
      console.log('✅ Keycloak accessible');
      console.log('Discovery data:', {
        issuer: discoveryData.issuer,
        authorization_endpoint: discoveryData.authorization_endpoint,
        token_endpoint: discoveryData.token_endpoint,
        userinfo_endpoint: discoveryData.userinfo_endpoint
      });
    } else {
      console.log('❌ Keycloak not accessible:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Keycloak connectivity error:', error.message);
  }
  
  console.groupEnd();
}

/**
 * Debug Environment Variables (for browser)
 */
function debugEnvironmentVariables() {
  console.group('🔍 Environment Variables Check');
  
  if (typeof window !== 'undefined') {
    // Browser environment
    const envVars = {
      VITE_BACKEND_API_URL: import.meta?.env?.VITE_BACKEND_API_URL || 'NOT_SET',
      VITE_API_BASE_URL: import.meta?.env?.VITE_API_BASE_URL || 'NOT_SET',
      VITE_PUBLIC_URL: import.meta?.env?.VITE_PUBLIC_URL || 'NOT_SET',
      VITE_OAUTH2_REDIRECT_URI: import.meta?.env?.VITE_OAUTH2_REDIRECT_URI || 'NOT_SET',
      VITE_KEYCLOAK_URL: import.meta?.env?.VITE_KEYCLOAK_URL || 'NOT_SET',
      VITE_KEYCLOAK_REALM: import.meta?.env?.VITE_KEYCLOAK_REALM || 'NOT_SET',
      VITE_KEYCLOAK_CLIENT_ID: import.meta?.env?.VITE_KEYCLOAK_CLIENT_ID || 'NOT_SET'
    };
    
    console.log('Frontend Environment Variables:');
    console.table(envVars);
    
    console.log('Current Location:');
    console.table({
      origin: window.location.origin,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      port: window.location.port
    });
  } else {
    console.log('Backend environment (Node.js)');
    console.table({
      NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
      KEYCLOAK_URL: process.env.KEYCLOAK_URL || 'NOT_SET',
      KEYCLOAK_REALM: process.env.KEYCLOAK_REALM || 'NOT_SET',
      KEYCLOAK_FRONTEND_CLIENT_ID: process.env.KEYCLOAK_FRONTEND_CLIENT_ID || 'NOT_SET',
      CORS_ORIGIN: process.env.CORS_ORIGIN || 'NOT_SET',
      OAUTH2_REDIRECT_URI: process.env.OAUTH2_REDIRECT_URI || 'NOT_SET'
    });
  }
  
  console.groupEnd();
}

/**
 * Test Manual Token Exchange
 */
async function testManualTokenExchange(authCode, backendUrl = CONFIG.backendUrls[0]) {
  console.group('🔍 Manual Token Exchange Test');
  
  if (!authCode) {
    console.log('❌ No authorization code provided');
    console.log('To get an auth code:');
    console.log('1. Go to login page');
    console.log('2. After redirect, copy the "code" parameter from URL');
    console.log('3. Run: testManualTokenExchange("YOUR_CODE_HERE")');
    console.groupEnd();
    return;
  }
  
  try {
    const tokenUrl = `${backendUrl}/oauth2/token`;
    console.log(`Testing token exchange at: ${tokenUrl}`);
    
    // Generate dummy PKCE values for testing
    const dummyCodeVerifier = 'test-code-verifier-for-debugging-1234567890123456789012345678901234567890';
    
    const tokenData = {
      code: authCode,
      code_verifier: dummyCodeVerifier,
      redirectUri: CONFIG.redirectUri
    };
    
    console.log('Request data:', tokenData);
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(tokenData)
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Token exchange successful');
      try {
        const tokens = JSON.parse(responseText);
        console.log('Tokens received:', {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          tokenType: tokens.token_type,
          expiresIn: tokens.expires_in
        });
      } catch (parseError) {
        console.log('❌ Failed to parse token response');
      }
    } else {
      console.log('❌ Token exchange failed');
      try {
        const errorData = JSON.parse(responseText);
        console.log('Error details:', errorData);
      } catch (parseError) {
        console.log('Raw error response:', responseText);
      }
    }
    
  } catch (error) {
    console.error('❌ Token exchange request failed:', error);
  }
  
  console.groupEnd();
}

/**
 * Generate OAuth2 Login URL for Manual Testing
 */
function generateLoginUrl() {
  console.group('🔍 OAuth2 Login URL Generator');
  
  const state = 'debug-state-' + Math.random().toString(36).substr(2, 9);
  const codeChallenge = 'debug-challenge-1234567890123456789012345678901234567890123456789012345678';
  
  const params = new URLSearchParams({
    client_id: CONFIG.keycloak.clientId,
    redirect_uri: CONFIG.redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });
  
  const loginUrl = `${CONFIG.keycloak.url}/realms/${CONFIG.keycloak.realm}/protocol/openid-connect/auth?${params}`;
  
  console.log('Generated login URL:');
  console.log(loginUrl);
  console.log('\nFor manual testing:');
  console.log('1. Copy the URL above');
  console.log('2. Open in new tab');
  console.log('3. Login with demo credentials');
  console.log('4. Copy the "code" parameter from callback URL');
  console.log('5. Run: testManualTokenExchange("YOUR_CODE")');
  
  console.groupEnd();
  
  return loginUrl;
}

/**
 * Run Full Debug Suite
 */
async function runFullDebugSuite() {
  console.log('🚀 Starting OAuth2 Debug Suite...');
  console.log('Timestamp:', new Date().toISOString());
  
  // Run all tests
  debugEnvironmentVariables();
  await debugKeycloakConnectivity();
  await debugBackendConnectivity();
  
  console.log('\n📋 Manual Testing Instructions:');
  console.log('1. Run: generateLoginUrl() - to get a login URL');
  console.log('2. Login and get auth code from callback URL');
  console.log('3. Run: testManualTokenExchange("YOUR_CODE") - to test token exchange');
  
  console.log('\n✅ Debug suite complete!');
}

// Export functions for browser console use
if (typeof window !== 'undefined') {
  window.oauth2Debug = {
    runFullDebugSuite,
    debugBackendConnectivity,
    debugKeycloakConnectivity,
    debugEnvironmentVariables,
    testManualTokenExchange,
    generateLoginUrl
  };
  
  console.log('OAuth2 Debug tools loaded! Available commands:');
  console.log('- oauth2Debug.runFullDebugSuite()');
  console.log('- oauth2Debug.debugBackendConnectivity()');
  console.log('- oauth2Debug.debugKeycloakConnectivity()');
  console.log('- oauth2Debug.generateLoginUrl()');
  console.log('- oauth2Debug.testManualTokenExchange("code")');
}

// Auto-run if in Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runFullDebugSuite,
    debugBackendConnectivity,
    debugKeycloakConnectivity,
    debugEnvironmentVariables,
    testManualTokenExchange,
    generateLoginUrl
  };
  
  // Auto-run in Node.js
  if (require.main === module) {
    runFullDebugSuite();
  }
}