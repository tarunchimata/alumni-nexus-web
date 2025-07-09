
// Comprehensive backend test script
async function testBackendComprehensive() {
  console.log('🧪 Starting comprehensive backend tests...\n');
  
  const baseUrl = 'http://localhost:3001';
  
  // Test 1: Basic connectivity
  console.log('1️⃣ Testing basic connectivity...');
  try {
    const response = await fetch(`${baseUrl}/api/test`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Backend is running and returning JSON');
      console.log(`   📊 OAuth2 enabled: ${data.oauth2Config?.enabled}`);
      console.log(`   🔗 Keycloak URL: ${data.oauth2Config?.keycloakUrl}`);
      console.log(`   🏢 Realm: ${data.oauth2Config?.realm}`);
    } else {
      console.log('   ❌ Backend returned error status');
    }
  } catch (error) {
    console.log('   ❌ Backend connectivity failed:', error.message);
    console.log('   💡 Make sure to start backend: cd backend && npm run dev');
    return;
  }
  
  // Test 2: OAuth2 token endpoint (with fake data)
  console.log('\n2️⃣ Testing OAuth2 token endpoint...');
  try {
    const response = await fetch(`${baseUrl}/api/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'fake-code-for-testing',
        code_verifier: 'fake-verifier-for-testing',
        redirectUri: 'http://localhost:3000/oauth2/callback'
      })
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    
    const responseText = await response.text();
    console.log(`   Response length: ${responseText.length} characters`);
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      try {
        const data = JSON.parse(responseText);
        console.log('   ✅ Token endpoint returns valid JSON');
        console.log(`   📝 Error message: ${data.error || 'No error field'}`);
      } catch (parseError) {
        console.log('   ❌ Failed to parse JSON response');
        console.log('   📄 Raw response:', responseText.substring(0, 200));
      }
    } else {
      console.log('   ❌ Token endpoint not returning JSON');
      console.log('   📄 Raw response:', responseText.substring(0, 200));
    }
  } catch (error) {
    console.log('   ❌ Token endpoint test failed:', error.message);
  }
  
  // Test 3: Health check
  console.log('\n3️⃣ Testing health endpoint...');
  try {
    const response = await fetch(`${baseUrl}/health`);
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Health check passed');
      console.log(`   📊 OAuth2 configured: ${data.oauth2?.configured}`);
      console.log(`   🏥 Status: ${data.status}`);
    } else {
      console.log('   ❌ Health check failed');
    }
  } catch (error) {
    console.log('   ❌ Health check error:', error.message);
  }
  
  console.log('\n🎯 Test Summary:');
  console.log('   - If all tests pass, the backend is ready for OAuth2 flow');
  console.log('   - Any JSON parsing errors should now be resolved');
  console.log('   - Try the login flow in the frontend now');
}

testBackendComprehensive();
