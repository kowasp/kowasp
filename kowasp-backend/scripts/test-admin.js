const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001/api';
const ADMIN_EMAIL = 'admin@kowasp.com';
const ADMIN_PASSWORD = 'admin1234';

async function testAdminFeatures() {
  console.log('🧪 Testing KOWASP Admin Features\n');

  try {
    // 1. Test admin login
    console.log('1. Testing admin login...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    console.log('✅ Admin login successful');

    // 2. Test admin/users endpoint
    console.log('\n2. Testing admin/users endpoint...');
    const usersResponse = await fetch(`${BASE_URL}/admin/users`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!usersResponse.ok) {
      throw new Error(`Users endpoint failed: ${usersResponse.status}`);
    }

    const users = await usersResponse.json();
    console.log(`✅ Admin users endpoint working - Found ${users.length} users`);
    console.log('   Users:', users.map(u => ({ email: u.email, role: u.role })));

    // 3. Test admin/projects endpoint
    console.log('\n3. Testing admin/projects endpoint...');
    const projectsResponse = await fetch(`${BASE_URL}/admin/projects`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!projectsResponse.ok) {
      throw new Error(`Projects endpoint failed: ${projectsResponse.status}`);
    }

    const projects = await projectsResponse.json();
    console.log(`✅ Admin projects endpoint working - Found ${projects.length} projects`);
    console.log('   Projects:', projects.map(p => ({ name: p.name, repo: p.repositoryUrl })));

    // 4. Test admin/scans endpoint
    console.log('\n4. Testing admin/scans endpoint...');
    const scansResponse = await fetch(`${BASE_URL}/admin/scans`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!scansResponse.ok) {
      throw new Error(`Scans endpoint failed: ${scansResponse.status}`);
    }

    const scans = await scansResponse.json();
    console.log(`✅ Admin scans endpoint working - Found ${scans.length} scans`);
    
    const completedScans = scans.filter(s => s.status === 'completed').length;
    console.log(`   Completed scans: ${completedScans}/${scans.length}`);

    // 5. Test unauthorized access (should fail)
    console.log('\n5. Testing unauthorized access...');
    const unauthorizedResponse = await fetch(`${BASE_URL}/admin/users`, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (unauthorizedResponse.status === 401) {
      console.log('✅ Unauthorized access properly blocked');
    } else {
      console.log('❌ Unauthorized access not properly blocked');
    }

    // 6. Test with regular user token (should fail)
    console.log('\n6. Testing regular user access to admin endpoints...');
    
    // First create a regular user
    const regularUserResponse = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'regular@test.com', 
        password: 'test1234' 
      })
    });

    if (regularUserResponse.ok) {
      const regularUserData = await regularUserResponse.json();
      const regularToken = regularUserData.access_token;

      const regularUserAdminResponse = await fetch(`${BASE_URL}/admin/users`, {
        headers: { 
          'Authorization': `Bearer ${regularToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (regularUserAdminResponse.status === 403) {
        console.log('✅ Regular user properly blocked from admin endpoints');
      } else {
        console.log('❌ Regular user should be blocked from admin endpoints');
      }
    }

    console.log('\n🎉 All admin feature tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Total users: ${users.length}`);
    console.log(`   - Total projects: ${projects.length}`);
    console.log(`   - Total scans: ${scans.length}`);
    console.log(`   - Completed scans: ${completedScans}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAdminFeatures(); 