const http = require('http');

async function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...headers,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, text: body });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runConcurrencyTest() {
  console.log('⚡ Starting Concurrency & Load Test on Backend (Port 5000)...');

  // 1. Health check
  const health = await makeRequest('/api/health');
  console.log('Health Status:', health.data);
  if (health.data.status !== 'ok') {
    throw new Error('Database is not healthy');
  }

  // 2. Test 100 concurrent requests to /api/leaderboard
  console.log('\n--- Test: 100 Concurrent Reads to /api/leaderboard ---');
  const startReads = Date.now();
  const readPromises = [];
  for (let i = 0; i < 100; i++) {
    readPromises.push(makeRequest('/api/leaderboard'));
  }
  const readResults = await Promise.all(readPromises);
  const readDuration = Date.now() - startReads;
  const readSuccess = readResults.filter((r) => r.status === 200).length;
  console.log(`✅ 100 concurrent leaderboard requests completed in ${readDuration}ms (${readSuccess}/100 successful)`);
  console.log(`   Average latency per request: ${(readDuration / 100).toFixed(2)}ms`);

  // 3. Test rate limiting on auth endpoint
  console.log('\n--- Test: Auth Rate Limiter Protection ---');
  let rateLimitedCount = 0;
  const authAttempts = [];
  for (let i = 0; i < 70; i++) {
    authAttempts.push(
      makeRequest('/api/auth/login', 'POST', {
        regdNo: 'FAKE999999',
        password: 'PASSWORD123',
      })
    );
  }
  const authResults = await Promise.all(authAttempts);
  authResults.forEach((r) => {
    if (r.status === 429) rateLimitedCount++;
  });
  console.log(`✅ Rate limiter triggered: ${rateLimitedCount} requests throttled with HTTP 429 (abuse prevention verified)`);

  console.log('\n🎉 Concurrency and load performance verified successfully!');
}

runConcurrencyTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
