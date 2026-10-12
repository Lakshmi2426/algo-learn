const assert = require('assert');

const BASE_URL = 'http://127.0.0.1:5000';
const ORIGIN = 'https://algo-learn-tau.vercel.app';
const connectDB = require('./config/db');
require('dotenv').config();

async function runTests() {
  console.log('🧪 Starting AlgoLearn Production Bug & Regression Test Suite...\n');
  await connectDB();

  // Test 1: Health & DB connection
  console.log('Test 1: Health Check and Database Connection');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  assert.strictEqual(healthRes.status, 200);
  const healthData = await healthRes.json();
  assert.strictEqual(healthData.status, 'ok');
  assert.strictEqual(healthData.database, 'MongoDB Connected');
  console.log('  ✅ /api/health passed, MongoDB Atlas connected.\n');

  // Test 2: CORS Preflight OPTIONS check
  console.log('Test 2: CORS Preflight OPTIONS for Production Vercel Origin');
  const preflightRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'OPTIONS',
    headers: {
      Origin: ORIGIN,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization',
    },
  });
  const allowOrigin = preflightRes.headers.get('access-control-allow-origin');
  assert.strictEqual(allowOrigin, ORIGIN, `Expected ${ORIGIN}, got ${allowOrigin}`);
  console.log(`  ✅ Preflight passed with Access-Control-Allow-Origin: ${allowOrigin}\n`);

  // Test 3: Teachers API (/api/teachers)
  console.log('Test 3: Missing Endpoints — GET /api/teachers');
  const teachersRes = await fetch(`${BASE_URL}/api/teachers`);
  assert.strictEqual(teachersRes.status, 200);
  const teachersData = await teachersRes.json();
  assert(Array.isArray(teachersData.teachers));
  console.log('  ✅ GET /api/teachers returned 200 with teachers array.\n');

  // Test 4: Questions API unauthenticated
  console.log('Test 4: Missing Endpoints — GET /api/questions (Unauthenticated)');
  const qUnauthRes = await fetch(`${BASE_URL}/api/questions`);
  assert.strictEqual(qUnauthRes.status, 200);
  const qUnauthData = await qUnauthRes.json();
  assert.deepStrictEqual(qUnauthData.questions, []);
  console.log('  ✅ GET /api/questions returned 200 with empty array for unauthenticated visitor.\n');

  // Test 5: Authentication, Single Session, Logout, Immediate Re-login
  console.log('Test 5: Authentication, Single Active Session & Immediate Re-Login');
  const testRegdNo1 = 'TESTSTUD01';
  const testPassword1 = 'TESTSTUD01';

  // Cleanup test user 1 if exists from earlier run
  const Student = require('./models/Student');
  const Question = require('./models/Question');
  await Student.deleteMany({ regdNo: { $in: ['TESTSTUD01', 'TESTSTUD02'] } });
  await Question.deleteMany({ studentId: { $in: ['TESTSTUD01', 'TESTSTUD02'] } });

  // 5a. Signup
  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({
      name: 'Test Student Alpha',
      branch: 'CSE',
      regdNo: testRegdNo1,
      password: testPassword1,
    }),
  });
  assert.strictEqual(signupRes.status, 201, 'Signup should succeed with 201');
  const signupData = await signupRes.json();
  const token1 = signupData.token;
  const student1Id = signupData.student.id;
  assert(token1 && student1Id);
  console.log('  ✅ Student 1 signed up successfully.');

  // 5b. Verify Session with /api/auth/me
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token1}`, Origin: ORIGIN },
  });
  assert.strictEqual(meRes.status, 200);
  const meData = await meRes.json();
  assert.strictEqual(meData.student.regdNo, testRegdNo1);
  console.log('  ✅ Student 1 verified via /api/auth/me.');

  // 5c. Second concurrent login attempt while session 1 is active (Device B block)
  const dupLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({
      regdNo: testRegdNo1,
      password: testPassword1,
    }),
  });
  assert.strictEqual(dupLoginRes.status, 409, 'Second concurrent login must be blocked with 409 Conflict');
  const dupLoginData = await dupLoginRes.json();
  assert.strictEqual(dupLoginData.alreadyLoggedIn, true);
  console.log('  ✅ Second simultaneous login on Device B blocked with 409 Conflict.');

  // 5d. Student 1 Logs Out
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`,
      Origin: ORIGIN,
    },
    body: JSON.stringify({ regdNo: testRegdNo1 }),
  });
  assert.strictEqual(logoutRes.status, 200);
  console.log('  ✅ Student 1 logged out successfully, activeSession released.');

  // 5e. Student 1 Immediately Logs In Again
  const reLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({
      regdNo: testRegdNo1,
      password: testPassword1,
    }),
  });
  assert.strictEqual(reLoginRes.status, 200, 'Immediate login after logout must succeed with 200');
  const reLoginData = await reLoginRes.json();
  const token1New = reLoginData.token;
  assert(token1New);
  console.log('  ✅ Student 1 immediately logged back in successfully!\n');

  // Test 6: Ask a Teacher — Strict Student Privacy & Ownership
  console.log('Test 6: Ask a Teacher — Student Privacy and Cross-Account Isolation');

  // 6a. Student 1 posts a private question
  const postQRes = await fetch(`${BASE_URL}/api/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1New}`,
      Origin: ORIGIN,
    },
    body: JSON.stringify({
      teacherId: 'teacher-priya',
      teacherName: 'Dr. Priya Sharma',
      teacherSubject: 'Data Structures',
      topicTitle: 'Binary Search',
      message: 'Hello, this is my private question about Binary Search.',
    }),
  });
  assert.strictEqual(postQRes.status, 201);
  const qData = await postQRes.json();
  const questionId1 = qData.question.id;
  assert(questionId1);
  console.log('  ✅ Student 1 posted private question to Dr. Priya Sharma.');

  // 6b. Student 2 signs up
  const testRegdNo2 = 'TESTSTUD02';
  const testPassword2 = 'TESTSTUD02';
  const signup2Res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({
      name: 'Test Student Beta',
      branch: 'IT',
      regdNo: testRegdNo2,
      password: testPassword2,
    }),
  });
  assert.strictEqual(signup2Res.status, 201);
  const token2 = (await signup2Res.json()).token;
  console.log('  ✅ Student 2 signed up.');

  // 6c. Student 2 calls GET /api/questions -> MUST NOT see Student 1's question!
  const qStudent2Res = await fetch(`${BASE_URL}/api/questions`, {
    headers: { Authorization: `Bearer ${token2}`, Origin: ORIGIN },
  });
  assert.strictEqual(qStudent2Res.status, 200);
  const student2Questions = (await qStudent2Res.json()).questions;
  assert.strictEqual(
    student2Questions.length,
    0,
    `Student 2 must see 0 questions, but saw ${student2Questions.length}`
  );
  console.log('  ✅ PRIVACY CONFIRMED: Student 2 sees 0 questions (Student 1 question is strictly hidden).');

  // 6d. Student 2 attempts to delete Student 1's question -> MUST return 403 Forbidden!
  const unauthorizedDeleteRes = await fetch(`${BASE_URL}/api/questions/${questionId1}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token2}`, Origin: ORIGIN },
  });
  assert.strictEqual(
    unauthorizedDeleteRes.status,
    403,
    'Student 2 must NOT be allowed to delete Student 1 question'
  );
  console.log('  ✅ PRIVACY CONFIRMED: Student 2 denied (403 Forbidden) from deleting Student 1 conversation.');

  // 6e. Student 1 calls GET /api/questions -> MUST see their 1 question!
  const qStudent1Res = await fetch(`${BASE_URL}/api/questions`, {
    headers: { Authorization: `Bearer ${token1New}`, Origin: ORIGIN },
  });
  assert.strictEqual(qStudent1Res.status, 200);
  const student1Questions = (await qStudent1Res.json()).questions;
  assert.strictEqual(student1Questions.length, 1);
  assert.strictEqual(student1Questions[0].id, questionId1);
  console.log('  ✅ Student 1 sees their own conversation.');

  // 6f. Student 1 deletes their own question -> MUST succeed
  const authorizedDeleteRes = await fetch(`${BASE_URL}/api/questions/${questionId1}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token1New}`, Origin: ORIGIN },
  });
  assert.strictEqual(authorizedDeleteRes.status, 200);
  console.log('  ✅ Student 1 cleared their own conversation successfully.\n');

  // Cleanup test students from DB
  await Student.deleteMany({ regdNo: { $in: ['TESTSTUD01', 'TESTSTUD02'] } });
  await Question.deleteMany({ studentId: { $in: [student1Id, 'TESTSTUD01', 'TESTSTUD02'] } });
  console.log('🧹 Cleaned up test records from database.');

  console.log('\n🎉 ALL PRODUCTION BUG & REGRESSION TESTS PASSED (100%)!');
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ TEST FAILED:', err);
    process.exit(1);
  });
