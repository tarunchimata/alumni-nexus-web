#!/usr/bin/env node

/**
 * Create Demo Users Script for Keycloak
 * 
 * This script creates 5 demo users with different roles for testing OAuth2 + PKCE flow.
 * 
 * Usage:
 *   node scripts/create-demo-users.js
 *   node scripts/create-demo-users.js --delete  (to remove users)
 * 
 * Environment variables required:
 *   KEYCLOAK_URL
 *   KEYCLOAK_REALM
 *   KEYCLOAK_ADMIN_USER
 *   KEYCLOAK_ADMIN_PASSWORD
 */

const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './backend/.env' });

const KEYCLOAK_URL = process.env.KEYCLOAK_URL;
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM;
const KEYCLOAK_ADMIN_USER = process.env.KEYCLOAK_ADMIN_USER;
const KEYCLOAK_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD;

// Demo users configuration
const DEMO_USERS = [
  {
    username: 'admin@myschoolbuddies.com',
    email: 'admin@myschoolbuddies.com',
    firstName: 'Admin',
    lastName: 'User',
    password: 'AdminChimatas@2025!',
    role: 'platform_admin',
    enabled: true,
    emailVerified: true,
  },
  {
    username: 'schooladmin@myschoolbuddies.com',
    email: 'schooladmin@myschoolbuddies.com',
    firstName: 'School',
    lastName: 'Admin',
    password: 'SchoolAdmin@2025!',
    role: 'school_admin',
    enabled: true,
    emailVerified: true,
  },
  {
    username: 'teacher@myschoolbuddies.com',
    email: 'teacher@myschoolbuddies.com',
    firstName: 'Teacher',
    lastName: 'User',
    password: 'Teacher@2025!',
    role: 'teacher',
    enabled: true,
    emailVerified: true,
  },
  {
    username: 'student@myschoolbuddies.com',
    email: 'student@myschoolbuddies.com',
    firstName: 'Student',
    lastName: 'User',
    password: 'Student@2025!',
    role: 'student',
    enabled: true,
    emailVerified: true,
  },
  {
    username: 'alumni@myschoolbuddies.com',
    email: 'alumni@myschoolbuddies.com',
    firstName: 'Alumni',
    lastName: 'User',
    password: 'Alumni@2025!',
    role: 'alumni',
    enabled: true,
    emailVerified: true,
  },
];

class KeycloakAdminClient {
  constructor() {
    this.baseUrl = `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}`;
    this.accessToken = null;
  }

  async authenticate() {
    try {
      console.log('🔐 Authenticating with Keycloak Admin API...');
      
      const response = await axios.post(
        `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'password',
          client_id: 'admin-cli',
          username: KEYCLOAK_ADMIN_USER,
          password: KEYCLOAK_ADMIN_PASSWORD,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      console.log('✅ Successfully authenticated with Keycloak');
    } catch (error) {
      console.error('❌ Failed to authenticate with Keycloak:', error.response?.data || error.message);
      throw error;
    }
  }

  async getUsers() {
    const response = await axios.get(`${this.baseUrl}/users`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });
    return response.data;
  }

  async getUserByEmail(email) {
    const response = await axios.get(`${this.baseUrl}/users?email=${email}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });
    return response.data.length > 0 ? response.data[0] : null;
  }

  async createUser(userConfig) {
    const userData = {
      username: userConfig.username,
      email: userConfig.email,
      firstName: userConfig.firstName,
      lastName: userConfig.lastName,
      enabled: userConfig.enabled,
      emailVerified: userConfig.emailVerified,
      credentials: [
        {
          type: 'password',
          value: userConfig.password,
          temporary: false,
        },
      ],
    };

    const response = await axios.post(`${this.baseUrl}/users`, userData, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Extract user ID from Location header
    const locationHeader = response.headers.location;
    const userId = locationHeader ? locationHeader.split('/').pop() : null;
    
    if (!userId) {
      throw new Error('Failed to extract user ID from response');
    }

    return userId;
  }

  async deleteUser(userId) {
    await axios.delete(`${this.baseUrl}/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });
  }

  async getRoles() {
    const response = await axios.get(`${this.baseUrl}/roles`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });
    return response.data;
  }

  async assignRoleToUser(userId, roleName) {
    // Get role details
    const roles = await this.getRoles();
    const role = roles.find(r => r.name === roleName);
    
    if (!role) {
      console.warn(`⚠️  Role '${roleName}' not found. Skipping role assignment.`);
      return;
    }

    await axios.post(
      `${this.baseUrl}/users/${userId}/role-mappings/realm`,
      [{ id: role.id, name: role.name }],
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

async function createDemoUsers() {
  const client = new KeycloakAdminClient();
  
  try {
    await client.authenticate();
    
    console.log('\n📝 Creating demo users...\n');
    
    for (const userConfig of DEMO_USERS) {
      try {
        console.log(`👤 Processing user: ${userConfig.email}`);
        
        // Check if user already exists
        const existingUser = await client.getUserByEmail(userConfig.email);
        
        if (existingUser) {
          console.log(`   ℹ️  User already exists, skipping creation`);
          continue;
        }
        
        // Create user
        const userId = await client.createUser(userConfig);
        console.log(`   ✅ User created with ID: ${userId}`);
        
        // Assign role
        await client.assignRoleToUser(userId, userConfig.role);
        console.log(`   🏷️  Role '${userConfig.role}' assigned`);
        
      } catch (error) {
        console.error(`   ❌ Failed to create user ${userConfig.email}:`, error.response?.data?.errorMessage || error.message);
      }
    }
    
    console.log('\n🎉 Demo user creation completed!\n');
    
    // Display login credentials
    console.log('📋 Login Credentials:');
    console.log('═'.repeat(50));
    DEMO_USERS.forEach(user => {
      console.log(`${user.role.toUpperCase().padEnd(15)} | ${user.email} | ${user.password}`);
    });
    console.log('═'.repeat(50));
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

async function deleteDemoUsers() {
  const client = new KeycloakAdminClient();
  
  try {
    await client.authenticate();
    
    console.log('\n🗑️  Deleting demo users...\n');
    
    for (const userConfig of DEMO_USERS) {
      try {
        console.log(`👤 Processing user: ${userConfig.email}`);
        
        const existingUser = await client.getUserByEmail(userConfig.email);
        
        if (!existingUser) {
          console.log(`   ℹ️  User not found, skipping deletion`);
          continue;
        }
        
        await client.deleteUser(existingUser.id);
        console.log(`   ✅ User deleted`);
        
      } catch (error) {
        console.error(`   ❌ Failed to delete user ${userConfig.email}:`, error.response?.data?.errorMessage || error.message);
      }
    }
    
    console.log('\n🎉 Demo user deletion completed!\n');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
const shouldDelete = args.includes('--delete');

// Validate environment variables
if (!KEYCLOAK_URL || !KEYCLOAK_REALM || !KEYCLOAK_ADMIN_USER || !KEYCLOAK_ADMIN_PASSWORD) {
  console.error('❌ Missing required environment variables:');
  console.error('   KEYCLOAK_URL:', KEYCLOAK_URL ? '✅' : '❌');
  console.error('   KEYCLOAK_REALM:', KEYCLOAK_REALM ? '✅' : '❌');
  console.error('   KEYCLOAK_ADMIN_USER:', KEYCLOAK_ADMIN_USER ? '✅' : '❌');
  console.error('   KEYCLOAK_ADMIN_PASSWORD:', KEYCLOAK_ADMIN_PASSWORD ? '✅' : '❌');
  console.error('\nPlease check your backend/.env file.');
  process.exit(1);
}

console.log('🚀 My School Buddies - Demo User Management');
console.log('==========================================');
console.log(`Keycloak URL: ${KEYCLOAK_URL}`);
console.log(`Realm: ${KEYCLOAK_REALM}`);
console.log(`Operation: ${shouldDelete ? 'DELETE' : 'CREATE'} demo users\n`);

if (shouldDelete) {
  deleteDemoUsers();
} else {
  createDemoUsers();
}