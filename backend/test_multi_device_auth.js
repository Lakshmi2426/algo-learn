const http = require('http');
const assert = require('assert');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runMultiDeviceTests() {
  console.log('🚀 Running Multi-Device Sign-In Flow Verification...\n');

  const testRegdNo = `TEST${Date.now().toString().slice(-6)}`;
  const testPassword = 'Password123!';
  const testUser = {
    name: 'MultiDevice TestUser',
    branch: '3/4-CSD-A',
    regdNo: testRegdNo,
    password: testPassword,
  };

  // Step 1: User signs up / logs in on Device A
  console.log('--- Step 1: Device A Signs Up & Receives Active Session ---');
  const signupRes = await request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(testUser),
  });
  assert.strictEqual(signupRes.status, 201, 'Signup must return 201');
  const tokenA = signupRes.data.token;
  assert(tokenA, 'Device A must receive token');
  console.log(`✅ Device A signed in with token. RegdNo: ${testRegdNo}`);

  // Step 2: Device A verifies session
  console.log('\n--- Step 2: Device A Verifies Active Session ---');
  const meA1 = await request('/api/auth/me', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(meA1.status, 200, 'Device A session must be active');
  assert.strictEqual(meA1.data.authenticated, true);
  console.log('✅ Device A session is confirmed active on /api/auth/me');

  // Step 3: User signs in on Device B with the same account
  console.log('\n--- Step 3: User Signs In on Device B (Seamless Takeover) ---');
  const loginB = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      regdNo: testRegdNo,
      password: testPassword,
    }),
  });
  assert.strictEqual(loginB.status, 200, 'Device B login must succeed with 200 OK without blocking');
  assert.strictEqual(loginB.data.success, true);
  const tokenB = loginB.data.token;
  assert(tokenB && tokenB !== tokenA, 'Device B must receive a new distinct token');
  console.log('✅ Device B login succeeded seamlessly without conflict error');

  // Step 4: Device A session is automatically invalidated
  console.log('\n--- Step 4: Device A Session is Automatically Invalidated ---');
  const meA2 = await request('/api/auth/me', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(meA2.status, 401, 'Device A must receive 401 Unauthorized');
  assert.strictEqual(meA2.data.sessionRevoked, true, 'Device A response must indicate sessionRevoked: true');
  console.log('✅ Device A session is revoked on server:', meA2.data.error);

  // Step 5: Device B session remains active
  console.log('\n--- Step 5: Device B Session Remains Active ---');
  const meB1 = await request('/api/auth/me', {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert.strictEqual(meB1.status, 200, 'Device B session must be active');
  assert.strictEqual(meB1.data.authenticated, true);
  console.log('✅ Device B session is active');

  // Step 6: Device A logs out (e.g. automatic logout cleanup)
  console.log('\n--- Step 6: Device A Cleanup Logout Does NOT Invalidate Device B ---');
  const logoutA = await request('/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(logoutA.status, 200);

  // Step 7: Verify Device B is STILL active after Device A logged out
  const meB2 = await request('/api/auth/me', {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert.strictEqual(meB2.status, 200, 'Device B must STILL be active after Device A logout');
  assert.strictEqual(meB2.data.authenticated, true);
  console.log('✅ Device B session remains fully active after Device A logout cleanup');

  // Step 8: Device A cannot save progress with old token
  console.log('\n--- Step 8: Device A Cannot Overwrite Progress With Old Session ---');
  const progressA = await request(`/api/students/${testRegdNo}/progress`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ progress: { stack: 10 } }),
  });
  assert.strictEqual(progressA.status, 401, 'Device A progress update must be rejected with 401');
  console.log('✅ Device A rejected from saving progress');

  // Step 9: Device B can save progress
  console.log('\n--- Step 9: Device B Successfully Saves Progress ---');
  const progressB = await request(`/api/students/${testRegdNo}/progress`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenB}` },
    body: JSON.stringify({ progress: { stack: 45 } }),
  });
  assert.strictEqual(progressB.status, 200, 'Device B progress update must succeed');
  assert.strictEqual(progressB.data.student.progress.stack, 45);
  console.log('✅ Device B saved progress successfully: stack = 45 points');

  // Step 10: Device B logs out
  console.log('\n--- Step 10: Device B Normal Sign Out ---');
  const logoutB = await request('/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert.strictEqual(logoutB.status, 200);

  // Step 11: Device B is now signed out
  const meB3 = await request('/api/auth/me', {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert.strictEqual(meB3.status, 401);
  console.log('✅ Device B is signed out and revoked.\n');

  console.log('🎉 ALL 11 MULTI-DEVICE SESSION TESTS PASSED SUCCESSFULLY! 🎉');
}

runMultiDeviceTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
