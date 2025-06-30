const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001/api';

async function debugAdminAccess() {
  console.log('🔍 Debugging Admin Access Control\n');

  try {
    // Create a regular user
    console.log('1. Creating regular user...');
    const signupResponse = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'debug@test.com', 
        password: 'test1234' 
      })
    });

    if (!signupResponse.ok) {
      const errorText = await signupResponse.text();
      console.log('Signup response:', signupResponse.status, errorText);
      return;
    }

    const signupData = await signupResponse.json();
    const regularToken = signupData.access_token;
    console.log('✅ Regular user created');

    // Try to access admin endpoint with regular user
    console.log('\n2. Testing regular user access to admin endpoint...');
    const adminResponse = await fetch(`${BASE_URL}/admin/users`, {
      headers: { 
        'Authorization': `Bearer ${regularToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Admin endpoint response status:', adminResponse.status);
    console.log('Admin endpoint response headers:', Object.fromEntries(adminResponse.headers.entries()));
    
    if (adminResponse.status !== 200) {
      const errorText = await adminResponse.text();
      console.log('Admin endpoint error response:', errorText);
    } else {
      const adminData = await adminResponse.json();
      console.log('Admin endpoint success response:', adminData);
    }

    // Now test with admin user
    console.log('\n3. Testing admin user access...');
    const adminLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@kowasp.com', password: 'admin1234' })
    });

    if (adminLoginResponse.ok) {
      const adminLoginData = await adminLoginResponse.json();
      const adminToken = adminLoginData.access_token;
      
      const adminUsersResponse = await fetch(`${BASE_URL}/admin/users`, {
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Admin user access status:', adminUsersResponse.status);
      if (adminUsersResponse.ok) {
        const adminUsersData = await adminUsersResponse.json();
        console.log('Admin user can access:', adminUsersData.length, 'users');
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugAdminAccess(); 