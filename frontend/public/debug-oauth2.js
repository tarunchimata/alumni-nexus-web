/**
 * OAuth2 Debugging Console Commands
 * 
 * Paste this entire script into your browser console to debug OAuth2 issues.
 */

console.log('🔧 Loading OAuth2 Debug Tools...');

// Test backend connectivity
async function testBackendHealth() {
  console.group('🔍 Testing Backend Health');
  
  const backendUrls = [
    'https://alumni.hostingmanager.in/api',
    'http://192.168.1.99:3033/api',
    window.location.origin + '/api'
  ];
  
  for (const url of backendUrls) {
    console.group(`Testing: ${url}`);
    
    try {
      const response = await fetch(`${url}/oauth2/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend accessible');
        console.log('Health data:', data);
      } else {
        console.log('❌ Backend not accessible');
        const errorText = await response.text();
        console.log('Error:', errorText.substring(0, 200));
      }
      
    } catch (error) {
      console.error('❌ Network error:', error.message);
    }
    
    console.groupEnd();
  }
  
  console.groupEnd();
}

// Test current environment
function checkEnvironment() {
  console.group('🔍 Environment Check');
  
  const env = {
    currentOrigin: window.location.origin,
    currentProtocol: window.location.protocol,
    isHTTPS: window.location.protocol === 'https:',
    hostname: window.location.hostname,
    userAgent: navigator.userAgent.substring(0, 100)
  };
  
  console.table(env);
  console.groupEnd();
}

// Test OAuth2 service if available
function testOAuth2Service() {
  console.group('🔍 OAuth2 Service Test');
  
  if (typeof oauth2Service !== 'undefined') {
    console.log('✅ oauth2Service found');
    
    // Test service initialization
    oauth2Service.initialize().then(isAuth => {
      console.log('Service initialized:', isAuth);
    }).catch(error => {
      console.error('Service initialization failed:', error);
    });
    
  } else {
    console.log('❌ oauth2Service not found in global scope');
    console.log('This is normal if the service is not loaded yet');
  }
  
  console.groupEnd();
}

// Manual token exchange test
async function testTokenExchange(authCode) {
  if (!authCode) {
    console.log('Usage: testTokenExchange("your_auth_code_here")');
    console.log('Get auth code by completing login flow and copying from callback URL');
    return;
  }
  
  console.group('🔍 Manual Token Exchange Test');
  
  const tokenData = {
    code: authCode,
    code_verifier: 'debug-verifier-12345678901234567890123456789012345678901234567890123456789012345678901234567890',
    redirectUri: 'https://alumni.hostingmanager.in/auth/callback'
  };
  
  try {
    const response = await fetch('/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(tokenData)
    });
    
    console.log(`Response: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('✅ Token exchange successful');
      const tokens = JSON.parse(responseText);
      console.log('Tokens:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expires_in
      });
    } else {
      console.log('❌ Token exchange failed');
      console.log('Error response:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
  
  console.groupEnd();
}

// Run full debug suite
async function runDebugSuite() {
  console.log('🚀 Running OAuth2 Debug Suite...');
  console.log('Timestamp:', new Date().toISOString());
  
  checkEnvironment();
  await testBackendHealth();
  testOAuth2Service();
  
  console.log('\n📋 Available Commands:');
  console.log('- testBackendHealth() - Test backend connectivity');
  console.log('- checkEnvironment() - Check current environment');
  console.log('- testOAuth2Service() - Test OAuth2 service');
  console.log('- testTokenExchange("code") - Test token exchange manually');
  console.log('- runDebugSuite() - Run all tests');
  
  console.log('\n✅ Debug suite complete!');
}

// Make functions available globally
window.testBackendHealth = testBackendHealth;
window.checkEnvironment = checkEnvironment;
window.testOAuth2Service = testOAuth2Service;
window.testTokenExchange = testTokenExchange;
window.runDebugSuite = runDebugSuite;

console.log('✅ OAuth2 Debug Tools Loaded!');
console.log('Run: runDebugSuite() to start debugging');