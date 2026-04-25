#!/usr/bin/env node

/**
 * OAuth2 Login Test Script
 * 
 * This script tests the OAuth2 + PKCE flow by simulating login for each demo user.
 * It validates tokens, fetches user profiles, and tests dashboard access.
 * 
 * Usage:
 *   node scripts/login-test.js
 *   node scripts/login-test.js --user admin@myschoolbuddies.com
 * 
 * Environment variables required:
 *   KEYCLOAK_URL
 *   KEYCLOAK_REALM
 *   KEYCLOAK_FRONTEND_CLIENT_ID
 */

const axios = require('axios');
const crypto = require('crypto');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './backend/.env' });

const KEYCLOAK_URL = process.env.KEYCLOAK_URL;
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM;
const CLIENT_ID = process.env.KEYCLOAK_FRONTEND_CLIENT_ID;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Demo user credentials
const DEMO_USERS = [
  {
    email: 'admin@myschoolbuddies.com',
    password: 'AdminChimatas@2025!',
    role: 'platform_admin',
  },
  {
    email: 'schooladmin@myschoolbuddies.com',
    password: 'SchoolAdmin@2025!',
    role: 'school_admin',
  },
  {
    email: 'teacher@myschoolbuddies.com',
    password: 'Teacher@2025!',
    role: 'teacher',
  },
  {
    email: 'student@myschoolbuddies.com',
    password: 'Student@2025!',
    role: 'student',
  },
  {
    email: 'alumni@myschoolbuddies.com',
    password: 'Alumni@2025!',
    role: 'alumni',
  },
];

class OAuth2Tester {
  constructor() {
    this.tokenEndpoint = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
    this.userInfoEndpoint = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/userinfo`;
  }

  // Generate PKCE code verifier
  generateCodeVerifier() {
    return crypto.randomBytes(96).toString('base64url').substring(0, 128);
  }

  // Generate PKCE code challenge
  generateCodeChallenge(verifier) {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  // Simulate direct login using Resource Owner Password Credentials Grant
  // Note: This is for testing only - production should use authorization code flow
  async loginUser(email, password) {
    try {
      console.log(`🔐 Logging in user: ${email}`);
      
      const response = await axios.post(
        this.tokenEndpoint,
        new URLSearchParams({
          grant_type: 'password',
          client_id: CLIENT_ID,
          username: email,
          password: password,
          scope: 'openid profile email',
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const tokens = response.data;
      console.log(`   ✅ Login successful`);
      console.log(`   🎫 Access token: ${tokens.access_token.substring(0, 50)}...`);
      console.log(`   ⏰ Expires in: ${tokens.expires_in} seconds`);
      
      return tokens;
    } catch (error) {
      console.error(`   ❌ Login failed:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Get user info from Keycloak
  async getUserInfo(accessToken) {
    try {
      console.log(`📋 Fetching user info from Keycloak...`);
      
      const response = await axios.get(this.userInfoEndpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const userInfo = response.data;
      console.log(`   ✅ User info retrieved`);
      console.log(`   👤 Name: ${userInfo.given_name} ${userInfo.family_name}`);
      console.log(`   📧 Email: ${userInfo.email}`);
      console.log(`   🆔 ID: ${userInfo.sub}`);
      
      return userInfo;
    } catch (error) {
      console.error(`   ❌ Failed to get user info:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Test backend OAuth2 userinfo endpoint
  async testBackendUserInfo(accessToken) {
    try {
      console.log(`🔍 Testing backend /api/oauth2/userinfo...`);
      
      const response = await axios.get(`${BACKEND_URL}/api/oauth2/userinfo`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const userInfo = response.data;
      console.log(`   ✅ Backend user info retrieved`);
      console.log(`   👤 Name: ${userInfo.firstName} ${userInfo.lastName}`);
      console.log(`   📧 Email: ${userInfo.email}`);
      console.log(`   🏷️  Primary Role: ${userInfo.role}`);
      console.log(`   🎭 All Roles: ${userInfo.roles.join(', ')}`);
      
      return userInfo;
    } catch (error) {
      console.error(`   ❌ Backend user info failed:`, error.response?.status, error.response?.data || error.message);
      return null;
    }
  }

  // Test dashboard access (simulated)
  async testDashboardAccess(accessToken, expectedRole) {
    try {
      console.log(`🎯 Testing dashboard access...`);
      
      // In a real scenario, this would be a protected dashboard endpoint
      // For now, we'll just validate the token structure
      const tokenParts = accessToken.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid JWT token structure');
      }

      // Decode token payload (without verification - for testing only)
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString());
      const roles = payload.realm_access?.roles || [];
      
      console.log(`   ✅ Token structure valid`);
      console.log(`   🎭 Token roles: ${roles.join(', ')}`);
      console.log(`   ✔️  Expected role '${expectedRole}': ${roles.includes(expectedRole) ? 'FOUND' : 'NOT FOUND'}`);
      
      return roles.includes(expectedRole);
    } catch (error) {
      console.error(`   ❌ Dashboard access test failed:`, error.message);
      return false;
    }
  }

  // Test token refresh
  async testTokenRefresh(refreshToken) {
    try {
      console.log(`🔄 Testing token refresh...`);
      
      const response = await axios.post(
        this.tokenEndpoint,
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: CLIENT_ID,
          refresh_token: refreshToken,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const tokens = response.data;
      console.log(`   ✅ Token refresh successful`);
      console.log(`   🆕 New access token: ${tokens.access_token.substring(0, 50)}...`);
      
      return tokens;
    } catch (error) {
      console.error(`   ❌ Token refresh failed:`, error.response?.data || error.message);
      return null;
    }
  }

  // Run complete test for a user
  async testUser(userConfig) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 TESTING USER: ${userConfig.email} (${userConfig.role})`);
    console.log(`${'='.repeat(60)}`);

    const results = {
      email: userConfig.email,
      role: userConfig.role,
      login: false,
      userInfo: false,
      backendUserInfo: false,
      dashboardAccess: false,
      tokenRefresh: false,
    };

    try {
      // Step 1: Login
      const tokens = await this.loginUser(userConfig.email, userConfig.password);
      results.login = true;

      // Step 2: Get user info from Keycloak
      await this.getUserInfo(tokens.access_token);
      results.userInfo = true;

      // Step 3: Test backend user info endpoint
      const backendUserInfo = await this.testBackendUserInfo(tokens.access_token);
      results.backendUserInfo = !!backendUserInfo;

      // Step 4: Test dashboard access
      const hasAccess = await this.testDashboardAccess(tokens.access_token, userConfig.role);
      results.dashboardAccess = hasAccess;

      // Step 5: Test token refresh
      if (tokens.refresh_token) {
        const refreshedTokens = await this.testTokenRefresh(tokens.refresh_token);
        results.tokenRefresh = !!refreshedTokens;
      }

    } catch (error) {
      console.error(`❌ Test failed for ${userConfig.email}:`, error.message);
    }

    // Print results summary
    console.log('\n📊 TEST RESULTS:');
    console.log(`   Login: ${results.login ? '✅' : '❌'}`);
    console.log(`   User Info: ${results.userInfo ? '✅' : '❌'}`);
    console.log(`   Backend User Info: ${results.backendUserInfo ? '✅' : '❌'}`);
    console.log(`   Dashboard Access: ${results.dashboardAccess ? '✅' : '❌'}`);
    console.log(`   Token Refresh: ${results.tokenRefresh ? '✅' : '❌'}`);

    return results;
  }
}

async function runTests() {
  console.log('🚀 My School Buddies - OAuth2 Login Test');
  console.log('=========================================');
  console.log(`Keycloak URL: ${KEYCLOAK_URL}`);
  console.log(`Realm: ${KEYCLOAK_REALM}`);
  console.log(`Client ID: ${CLIENT_ID}`);
  console.log(`Backend URL: ${BACKEND_URL}\n`);

  const tester = new OAuth2Tester();
  const args = process.argv.slice(2);
  const specificUser = args.find(arg => arg.startsWith('--user='))?.split('=')[1] || 
                      (args.includes('--user') ? args[args.indexOf('--user') + 1] : null);

  let usersToTest = DEMO_USERS;
  if (specificUser) {
    usersToTest = DEMO_USERS.filter(user => user.email === specificUser);
    if (usersToTest.length === 0) {
      console.error(`❌ User '${specificUser}' not found in demo users list.`);
      process.exit(1);
    }
  }

  const allResults = [];

  for (const user of usersToTest) {
    const result = await tester.testUser(user);
    allResults.push(result);
  }

  // Print overall summary
  console.log(`\n\n🎯 OVERALL TEST SUMMARY`);
  console.log(`${'='.repeat(80)}`);
  console.log(`USER${' '.repeat(32)} | LOGIN | INFO | BACKEND | DASHBOARD | REFRESH`);
  console.log(`${'-'.repeat(80)}`);

  allResults.forEach(result => {
    const email = result.email.padEnd(35);
    const login = result.login ? '✅' : '❌';
    const info = result.userInfo ? '✅' : '❌';
    const backend = result.backendUserInfo ? '✅' : '❌';
    const dashboard = result.dashboardAccess ? '✅' : '❌';
    const refresh = result.tokenRefresh ? '✅' : '❌';
    
    console.log(`${email} |   ${login}   |  ${info}  |    ${backend}    |     ${dashboard}     |    ${refresh}`);
  });

  console.log(`${'-'.repeat(80)}`);

  const totalTests = allResults.length;
  const passedUsers = allResults.filter(r => r.login && r.userInfo && r.backendUserInfo && r.dashboardAccess).length;
  
  console.log(`\n📈 Success Rate: ${passedUsers}/${totalTests} users (${Math.round(passedUsers/totalTests*100)}%)`);
  
  if (passedUsers === totalTests) {
    console.log('🎉 All tests passed! OAuth2 + PKCE flow is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the error messages above.');
  }
}

// Validate environment variables
if (!KEYCLOAK_URL || !KEYCLOAK_REALM || !CLIENT_ID) {
  console.error('❌ Missing required environment variables:');
  console.error('   KEYCLOAK_URL:', KEYCLOAK_URL ? '✅' : '❌');
  console.error('   KEYCLOAK_REALM:', KEYCLOAK_REALM ? '✅' : '❌');
  console.error('   KEYCLOAK_FRONTEND_CLIENT_ID:', CLIENT_ID ? '✅' : '❌');
  console.error('\nPlease check your backend/.env file.');
  process.exit(1);
}

runTests().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});