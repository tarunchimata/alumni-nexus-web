#!/usr/bin/env node

// Test Registration Flow (ESM)
import axios from 'axios';

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
    
    // Test 4: School Selection
    console.log('\n4. Testing school selection...');
    const schoolData = {
      institutionId: 1,
      institutionName: 'Test University'
    };
    
    const schoolResponse = await axios.post(`${API_BASE_URL}/registration/school`, schoolData, {
      withCredentials: true,
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      }
    });
    
    console.log('✅ School selection submitted:', schoolResponse.data);
    
    // Test 5: Account Creation
    console.log('\n5. Testing account creation...');
    const accountData = {
      username: 'johndoe_test',
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!'
    };
    
    const accountResponse = await axios.post(`${API_BASE_URL}/registration/account`, accountData, {
      withCredentials: true,
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      }
    });
    
    console.log('✅ Account creation submitted:', accountResponse.data);
    
    // Test 6: Complete Registration
    console.log('\n6. Testing registration completion...');
    const completeData = {
      role: 'student',
      termsAccepted: true
    };
    
    const completeResponse = await axios.post(`${API_BASE_URL}/registration/complete`, completeData, {
      withCredentials: true,
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      }
    });
    
    console.log('✅ Registration completed:', completeResponse.data);
    
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