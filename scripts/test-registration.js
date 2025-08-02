#!/usr/bin/env node

// Test Registration Flow
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testRegistrationFlow() {
  console.log('🧪 Testing Registration Flow...');
  
  try {
    // Test 1: Health Check
    console.log('\n1. Testing health check...');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Health check passed:', healthResponse.data.status);
    
    // Test 2: Initialize Registration Session
    console.log('\n2. Testing registration session initialization...');
    const initResponse = await axios.post(`${API_BASE_URL}/registration/init`, {}, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Registration session initialized:', initResponse.data);
    
    const cookies = initResponse.headers['set-cookie'];
    const cookieHeader = cookies ? cookies.join('; ') : '';
    
    // Test 3: Basic Info Submission
    console.log('\n3. Testing basic info submission...');
    const basicData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      dateOfBirth: '1995-01-15'
    };
    
    const basicResponse = await axios.post(`${API_BASE_URL}/registration/basic`, basicData, {
      withCredentials: true,
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      }
    });
    
    console.log('✅ Basic info submitted:', basicResponse.data);
    
    console.log('\n🎉 Registration flow test completed successfully!');
    console.log('✅ The registration system is working properly');
    
  } catch (error) {
    console.error('\n❌ Registration flow test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

testRegistrationFlow();