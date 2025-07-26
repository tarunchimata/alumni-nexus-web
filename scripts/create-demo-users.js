#!/usr/bin/env node

/**
 * Demo Users Creation Script
 * Creates test users for all 5 roles in My School Buddies
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const KEYCLOAK_URL = process.env.KEYCLOAK_URL;
const REALM = process.env.KEYCLOAK_REALM;
const ADMIN_USERNAME = process.env.KEYCLOAK_ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD;

// Demo users configuration
const DEMO_USERS = [
    {
        username: 'platform.admin',
        email: 'platform.admin@myschoolbuddies.com',
        firstName: 'Platform',
        lastName: 'Administrator',
        password: 'PlatformAdmin@123',
        role: 'platform_admin',
        attributes: {
            role: ['platform_admin'],
            status: ['active']
        }
    },
    {
        username: 'school.admin',
        email: 'school.admin@myschoolbuddies.com',
        firstName: 'School',
        lastName: 'Administrator',
        password: 'SchoolAdmin@123',
        role: 'school_admin',
        attributes: {
            role: ['school_admin'],
            status: ['active'],
            schoolId: ['1']
        }
    },
    {
        username: 'teacher.demo',
        email: 'teacher.demo@myschoolbuddies.com',
        firstName: 'Demo',
        lastName: 'Teacher',
        password: 'Teacher@123',
        role: 'teacher',
        attributes: {
            role: ['teacher'],
            status: ['active'],
            schoolId: ['1']
        }
    },
    {
        username: 'student.demo',
        email: 'student.demo@myschoolbuddies.com',
        firstName: 'Demo',
        lastName: 'Student',
        password: 'Student@123',
        role: 'student',
        attributes: {
            role: ['student'],
            status: ['active'],
            schoolId: ['1']
        }
    },
    {
        username: 'alumni.demo',
        email: 'alumni.demo@myschoolbuddies.com',
        firstName: 'Demo',
        lastName: 'Alumni',
        password: 'Alumni@123',
        role: 'alumni',
        attributes: {
            role: ['alumni'],
            status: ['active'],
            schoolId: ['1']
        }
    }
];

let accessToken = null;

// Helper function to get admin access token
async function getAdminToken() {
    try {
        console.log('🔐 Getting admin access token...');
        
        const response = await axios.post(
            `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
            new URLSearchParams({
                grant_type: 'password',
                client_id: 'admin-cli',
                username: ADMIN_USERNAME,
                password: ADMIN_PASSWORD
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        accessToken = response.data.access_token;
        console.log('✅ Admin token obtained successfully');
        return accessToken;
    } catch (error) {
        console.error('❌ Failed to get admin token:', error.response?.data || error.message);
        throw error;
    }
}

// Helper function to check if user exists
async function userExists(username) {
    try {
        const response = await axios.get(
            `${KEYCLOAK_URL}/admin/realms/${REALM}/users?username=${username}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        return response.data.length > 0;
    } catch (error) {
        console.error(`❌ Error checking user ${username}:`, error.response?.data || error.message);
        return false;
    }
}

// Helper function to create a user
async function createUser(user) {
    try {
        console.log(`👤 Creating user: ${user.username}`);
        
        // Check if user already exists
        if (await userExists(user.username)) {
            console.log(`⚠️  User ${user.username} already exists, skipping...`);
            return;
        }
        
        // Create user
        const userData = {
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            enabled: true,
            emailVerified: true,
            attributes: user.attributes,
            credentials: [{
                type: 'password',
                value: user.password,
                temporary: false
            }]
        };
        
        const response = await axios.post(
            `${KEYCLOAK_URL}/admin/realms/${REALM}/users`,
            userData,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log(`✅ User ${user.username} created successfully`);
        
        // Log user credentials for reference
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔑 Password: ${user.password}`);
        console.log(`   👥 Role: ${user.role}`);
        
    } catch (error) {
        console.error(`❌ Failed to create user ${user.username}:`, error.response?.data || error.message);
    }
}

// Main function to create all demo users
async function createDemoUsers() {
    try {
        console.log('🚀 Starting demo users creation...\n');
        
        // Get admin token
        await getAdminToken();
        
        // Create each demo user
        for (const user of DEMO_USERS) {
            await createUser(user);
            console.log(''); // Empty line for readability
        }
        
        console.log('🎉 Demo users creation completed!\n');
        
        // Print summary
        console.log('📋 Demo Users Summary:');
        console.log('====================');
        DEMO_USERS.forEach(user => {
            console.log(`👤 ${user.role.toUpperCase().replace('_', ' ')}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Password: ${user.password}`);
            console.log('');
        });
        
        console.log('🔗 Login URL: https://school.hostingmanager.in');
        console.log('🔐 Keycloak Admin: https://login.hostingmanager.in/auth/admin/');
        
    } catch (error) {
        console.error('💥 Failed to create demo users:', error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    createDemoUsers();
}

module.exports = { createDemoUsers };