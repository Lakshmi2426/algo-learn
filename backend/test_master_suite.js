const assert = require('assert');

const API_BASE = 'http://localhost:5000';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data, headers: res.headers };
}

async function runTests() {
  console.log('🚀 Running AlgoLearn Master Test Suite...\n');

  // Test 1: Empty leaderboard
  console.log('--- Test 1: Empty Leaderboard ---');
  const lbInitial = await request('/api/leaderboard');
  assert.strictEqual(lbInitial.status, 200);
  assert(Array.isArray(lbInitial.data.leaderboard));
  assert.strictEqual(lbInitial.data.leaderboard.length, 0);
  console.log('✅ Empty leaderboard verified (0 students).\n');

  // Test 2: Valid student signup
  console.log('--- Test 2: Student Sign-Up ---');
  const student1Data = {
    name: 'Alice Johnson',
    branch: '3/4-CSD-A',
    regdNo: '24B91A0501',
    password: '24B91A0501',
  };
  const signup1 = await request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(student1Data),
  });
  assert.strictEqual(signup1.status, 201);
  assert.strictEqual(signup1.data.success, true);
  assert(signup1.data.token, 'Token must be returned');
  const token1 = signup1.data.token;
  console.log('✅ Student Alice registered and token received.\n');

  // Test 3: Duplicate signup rejection
  console.log('--- Test 3: Duplicate Registration Rejection ---');
  const signupDup = await request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(student1Data),
  });
  assert.strictEqual(signupDup.status, 400);
  console.log('✅ Duplicate registration rejected with 400.\n');

  // Test 4: Leaderboard contains 0-XP student at rank 1
  console.log('--- Test 4: New Student on Leaderboard with 0 XP ---');
  const lb1 = await request('/api/leaderboard');
  assert.strictEqual(lb1.status, 200);
  assert.strictEqual(lb1.data.leaderboard.length, 1);
  assert.strictEqual(lb1.data.leaderboard[0].regdNo, '24B91A0501');
  assert.strictEqual(lb1.data.leaderboard[0].rank, 1);
  assert.strictEqual(lb1.data.leaderboard[0].xp, 0);
  console.log('✅ Single student with 0 XP appears at rank 1 on leaderboard.\n');

  // Test 5: Verify active session (/api/auth/me)
  console.log('--- Test 5: Active Session Verification (/api/auth/me) ---');
  const me1 = await request('/api/auth/me', {
    headers: { Authorization: `Bearer ${token1}` },
  });
  assert.strictEqual(me1.status, 200);
  assert.strictEqual(me1.data.authenticated, true);
  assert.strictEqual(me1.data.student.regdNo, '24B91A0501');
  console.log('✅ Session verified on /api/auth/me.\n');

  // Test 6: Second independent login attempt REJECTED while session is active
  console.log('--- Test 6: Second Concurrent Login Rejected ---');
  const login2 = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      regdNo: '24B91A0501',
      password: '24B91A0501',
    }),
  });
  assert.strictEqual(login2.status, 409, 'Must return 409 Conflict');
  assert(
    login2.data.error.includes('already logged in on another session'),
    'Must display already logged in error message'
  );
  console.log('✅ Second login rejected with 409 and clear message:', login2.data.error);

  // Test 7: Verify original session still works after second login attempt
  console.log('\n--- Test 7: First Session Preserved After Denied Login ---');
  const me1StillActive = await request('/api/auth/me', {
    headers: { Authorization: `Bearer ${token1}` },
  });
  assert.strictEqual(me1StillActive.status, 200);
  assert.strictEqual(me1StillActive.data.authenticated, true);
  console.log('✅ Original session remained active and was not invalidated.\n');

  // Test 8: Progress points saving and Leaderboard XP calculation
  console.log('--- Test 8: Topic Points Summing (Leaderboard XP = sum of all topic points) ---');
  // Student earns: Stack: 25 points, Queue: 18 points, Binary Search: 30 points, Trees: 12 points
  const topicPoints = {
    stack: 25,
    queue: 18,
    'binary-search': 30,
    trees: 12,
  };
  const expectedXP = 25 + 18 + 30 + 12; // 85 XP

  const progressRes = await request('/api/students/24B91A0501/progress', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      progress: topicPoints,
      topicsStarted: 4,
      topicsCompleted: 0,
      overallProgress: 7,
    }),
  });
  assert.strictEqual(progressRes.status, 200);
  assert.strictEqual(progressRes.data.student.xp, expectedXP);
  console.log(`✅ Progress saved. Expected XP = 85, Got XP = ${progressRes.data.student.xp}`);

  // Test 9: Leaderboard displays exact sum 85 XP
  console.log('\n--- Test 9: Leaderboard Displays Sum of Topic Points ---');
  const lbAfterScore = await request('/api/leaderboard');
  assert.strictEqual(lbAfterScore.data.leaderboard[0].xp, 85);
  console.log(`✅ Leaderboard displays exactly ${lbAfterScore.data.leaderboard[0].xp} XP.\n`);

  // Test 10: Sign out releases active session
  console.log('--- Test 10: Sign Out Releases Active Session ---');
  const logoutRes = await request('/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` },
  });
  assert.strictEqual(logoutRes.status, 200);
  assert.strictEqual(logoutRes.data.success, true);
  console.log('✅ Logout succeeded.\n');

  // Test 11: Signed-out token can no longer access protected endpoints
  console.log('--- Test 11: Signed-Out Session Cannot Access Protected API ---');
  const meRevoked = await request('/api/auth/me', {
    headers: { Authorization: `Bearer ${token1}` },
  });
  assert.strictEqual(meRevoked.status, 401);
  console.log('✅ Revoked token rejected with 401.\n');

  // Test 12: Student can log in again after sign out
  console.log('--- Test 12: Re-login After Sign-Out Allowed ---');
  const relogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      regdNo: '24B91A0501',
      password: '24B91A0501',
    }),
  });
  assert.strictEqual(relogin.status, 200);
  assert.strictEqual(relogin.data.success, true);
  const token2 = relogin.data.token;
  assert(token2 && token2 !== token1, 'New session must issue new token');
  console.log('✅ Re-login succeeded with new active session.\n');

  // Test 13: Add second student to verify ranking and tie breaking
  console.log('--- Test 13: Multiple Students, Rankings & Deterministic Sorting ---');
  const student2Data = {
    name: 'Bob Miller',
    branch: '3/4-CSD-B',
    regdNo: '24B91A0502',
    password: '24B91A0502',
  };
  const signup2 = await request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(student2Data),
  });
  assert.strictEqual(signup2.status, 201);
  const tokenBob = signup2.data.token;

  // Bob earns 120 XP (e.g. 50 + 70)
  await request('/api/students/24B91A0502/progress', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenBob}` },
    body: JSON.stringify({
      progress: { stack: 50, hashing: 70 },
      topicsStarted: 2,
      topicsCompleted: 1,
    }),
  });

  const lbMulti = await request('/api/leaderboard');
  assert.strictEqual(lbMulti.data.leaderboard.length, 2);
  // Rank 1: Bob (120 XP)
  assert.strictEqual(lbMulti.data.leaderboard[0].regdNo, '24B91A0502');
  assert.strictEqual(lbMulti.data.leaderboard[0].rank, 1);
  assert.strictEqual(lbMulti.data.leaderboard[0].xp, 120);
  // Rank 2: Alice (85 XP)
  assert.strictEqual(lbMulti.data.leaderboard[1].regdNo, '24B91A0501');
  assert.strictEqual(lbMulti.data.leaderboard[1].rank, 2);
  assert.strictEqual(lbMulti.data.leaderboard[1].xp, 85);
  console.log('✅ Multiple students ranked by descending XP: Rank 1 Bob (120 XP), Rank 2 Alice (85 XP).\n');

  // Test 14: Safe session recovery test
  console.log('--- Test 14: Stranded Session Recovery Path ---');
  // Attempt recovery with bad password -> rejected
  const badRecovery = await request('/api/auth/recover-session', {
    method: 'POST',
    body: JSON.stringify({ regdNo: '24B91A0501', password: 'WRONG' }),
  });
  assert.strictEqual(badRecovery.status, 401);

  // Recovery with correct credentials -> clears session
  const goodRecovery = await request('/api/auth/recover-session', {
    method: 'POST',
    body: JSON.stringify({ regdNo: '24B91A0501', password: '24B91A0501' }),
  });
  assert.strictEqual(goodRecovery.status, 200);
  assert.strictEqual(goodRecovery.data.success, true);
  console.log('✅ Stranded session released via safe recovery.\n');

  // Clean up test students so production Atlas starts clean as requested
  console.log('--- Cleaning Up Test Accounts ---');
  const StudentModel = require('./models/Student');
  const mongoose = require('mongoose');
  require('dotenv').config();
  await mongoose.connect(process.env.MONGO_URI);
  await StudentModel.deleteMany({ regdNo: { $in: ['24B91A0501', '24B91A0502'] } });
  const finalCount = await StudentModel.countDocuments();
  console.log(`✅ Production database restored to pristine clean state (count = ${finalCount}).\n`);

  console.log('🎉 ALL INTEGRATION TESTS PASSED PERFECTLY!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
