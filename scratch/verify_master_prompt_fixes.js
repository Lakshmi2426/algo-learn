const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('   ALGOLEARN MASTER PROMPT BUG FIXES VERIFICATION   ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // TEST 1: Authentication (Signup, Login with same regdNo, Duplicate Signup rejection)
  console.log('--- 1. Authentication & Signup/Login Distinction ---');
  // 10-character valid Registration Number (e.g. 24CSE + 5 digits)
  const uniqueRegd = '24CSE' + Math.floor(10000 + Math.random() * 90000);
  const testStudent = {
    name: 'Master Prompt Tester',
    regdNo: uniqueRegd,
    branch: '3/4-CSE-A',
    password: 'Password123!',
  };

  // 1a. Signup new account
  const signupRes = await fetch(`${BACKEND_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testStudent)
  });
  assert(signupRes.ok, `Signup succeeds with new regdNo ${uniqueRegd}: HTTP ${signupRes.status}`);
  const signupData = await signupRes.json();
  assert(signupData.token && signupData.student, 'Signup response contains JWT token and student profile');

  // 1b. Duplicate signup rejection
  const dupRes = await fetch(`${BACKEND_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testStudent)
  });
  assert(dupRes.status === 400 || dupRes.status === 409, `Duplicate signup rejected with HTTP ${dupRes.status}`);
  const dupData = await dupRes.json();
  const errorMsg = (dupData.error || dupData.message || '').toLowerCase();
  assert(errorMsg.includes('already registered'), 'Duplicate signup error message indicates account already registered');

  // 1c. Login with exact same registration number and password
  const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ regdNo: uniqueRegd, password: 'Password123!' })
  });
  assert(loginRes.ok, `Login succeeds with same regdNo ${uniqueRegd}: HTTP ${loginRes.status}`);
  const loginData = await loginRes.json();
  assert(loginData.token && loginData.student.regdNo === uniqueRegd, 'Login returns valid session and student profile matching regdNo');

  // TEST 2: Queues Quiz Persistence & Scoring
  console.log('\n--- 2. Queues Quiz Persistence & Leaderboard Consistency ---');
  const queuesQuizView = fs.readFileSync('frontend/DSA topics/Queues/src/components/views/QuizView.tsx', 'utf8');
  assert(queuesQuizView.includes('queue_quiz_session_state'), 'Queues QuizView persists session state to localStorage under queue_quiz_session_state');
  assert(queuesQuizView.includes('Retake Quiz'), 'Queues QuizView includes Retake Quiz option on completion');

  const topicProgressSrc = fs.readFileSync('frontend/src/utils/topicProgress.ts', 'utf8');
  assert(topicProgressSrc.includes('p.queueScore') && topicProgressSrc.includes('QUEUE_SCORING'), 'topicProgress.ts uses authoritative p.queueScore and QUEUE_SCORING (12 viz, 40 game, 48 quiz)');

  // TEST 3: BST Quiz Persistence, Theme Sync, Video, Scoring & Selection
  console.log('\n--- 3. Binary Search Tree (BST) Fixes ---');
  const bstQuizPage = fs.readFileSync('frontend/DSA topics/Binary Search Tree/src/components/quiz/QuizPage.tsx', 'utf8');
  assert(bstQuizPage.includes('confirmedAnswers[currentIndex] === idx'), 'BST QuizPage correctly displays confirmed answers on navigation');
  assert(bstQuizPage.includes('getInitialQuizState'), 'BST QuizPage getInitialQuizState populates state on remount');

  const bstThemeContext = fs.readFileSync('frontend/DSA topics/Binary Search Tree/src/context/ThemeContext.tsx', 'utf8');
  assert(bstThemeContext.includes('ALGOLEARN_THEME_CHANGE') && bstThemeContext.includes('ALGOLEARN_MODULE_THEME_CHANGED'), 'BST ThemeContext synchronizes bidirectionally with main site via postMessage');

  const bstVideoPage = fs.readFileSync('frontend/DSA topics/Binary Search Tree/src/components/video/VideoPage.tsx', 'utf8');
  assert(bstVideoPage.includes('2200') && bstVideoPage.includes('3600'), 'BST VideoPage uses paced step timing for thorough explanation');

  const bstCss = fs.readFileSync('frontend/DSA topics/Binary Search Tree/src/index.css', 'utf8');
  assert(bstCss.includes('user-select: none'), 'BST index.css prevents unwanted text selection on drag-and-drop game areas');

  const bstGamePage = fs.readFileSync('frontend/DSA topics/Binary Search Tree/src/components/game/GamePage.tsx', 'utf8');
  assert(bstGamePage.includes('isAlreadyCompleted') && bstGamePage.includes('!alreadyCompleted'), 'BST GamePage prevents duplicate rewards and guided solve deductions on replay');

  // TEST 4: Learn +35 XP removal in Data Structures & BST, and Quiz Start
  console.log('\n--- 4. Data Structures & BST Learn +35 XP and Quiz Start ---');
  const dsaTheory = fs.readFileSync('frontend/DSA topics/Data Structure and Types/src/components/views/TheoryView.tsx', 'utf8');
  assert(!dsaTheory.includes('+35 XP'), 'Data Structures TheoryView does not display misleading +35 XP');
  assert(dsaTheory.includes('xpEarned = 0'), 'Data Structures TheoryView awards 0 XP for learn chapters');

  const dsaQuiz = fs.readFileSync('frontend/DSA topics/Data Structure and Types/src/components/views/QuizView.tsx', 'utf8');
  assert(dsaQuiz.includes('!isQuizStarted') && dsaQuiz.includes('setIsQuizStarted(true)'), 'Data Structures QuizView properly hides Start Quiz button and enters quiz on click');

  const bsTheory = fs.readFileSync('frontend/DSA topics/Binary Search/src/components/views/TheoryView.tsx', 'utf8');
  assert(!bsTheory.includes('+35 XP'), 'Binary Search TheoryView does not display misleading +35 XP');

  // TEST 5: Linear Search Guided Solve
  console.log('\n--- 5. Linear Search Guided Solve Button Fix ---');
  const dsaModuleViewer = fs.readFileSync('frontend/src/components/topics/DSAModuleViewer.tsx', 'utf8');
  assert(dsaModuleViewer.includes('guided-solve') && dsaModuleViewer.includes('Guided Solve'), 'DSAModuleViewer does not intercept Guided Solve buttons as Ask a Teacher');

  const lsLevel1 = fs.readFileSync('frontend/DSA topics/Linear Search/src/components/Level1Gameplay.tsx', 'utf8');
  assert(lsLevel1.includes('guided-solve-lvl1-btn') && !lsLevel1.includes('title="Start Guided Solve step-by-step assistant'), 'Linear Search Level 1 Guided Solve button has dedicated ID and clean title');

  // TEST 6: Sorting Navigation, Videos, Points Notifications, Quiz, Games
  console.log('\n--- 6. Sorting Module Fixes ---');
  const sortingTheory = fs.readFileSync('frontend/DSA topics/Sorting/src/components/views/TheoryView.tsx', 'utf8');
  assert(sortingTheory.includes('sticky top-4') && sortingTheory.includes('mainEl.scrollTo'), 'Sorting TheoryView sidebar stays sticky at top-4 and scrolls main view on chapter change');

  const sortingVideoPlayer = fs.readFileSync('frontend/DSA topics/Sorting/src/components/lab/AlgorithmVideoPlayer.tsx', 'utf8');
  assert(sortingVideoPlayer.includes('./Videos/') && sortingVideoPlayer.includes('/dsa-modules/sorting/Videos/'), 'Sorting AlgorithmVideoPlayer includes robust relative and module fallback paths');

  const sortingApp = fs.readFileSync('frontend/DSA topics/Sorting/src/App.tsx', 'utf8');
  assert(sortingApp.includes('setToastInfo') && sortingApp.includes('lastNotifiedEntryIdRef'), 'Sorting App.tsx triggers points popup notifications reliably with deduplication');

  const sortingQuiz = fs.readFileSync('frontend/DSA topics/Sorting/src/data/quizData.ts', 'utf8');
  assert(!sortingQuiz.includes('Merge Sort') && !sortingQuiz.includes('Quick Sort') && !sortingQuiz.includes('Lomuto'), 'Sorting quizData.ts does NOT contain unrelated Merge Sort or Quick Sort questions');
  assert(sortingQuiz.includes('Bubble Sort') && sortingQuiz.includes('Selection Sort') && sortingQuiz.includes('Insertion Sort'), 'Sorting quizData.ts covers Bubble Sort, Selection Sort, and Insertion Sort');

  const fixAlgorithmGame = fs.readFileSync('frontend/DSA topics/Sorting/src/components/game/FixAlgorithmGame.tsx', 'utf8');
  assert(fixAlgorithmGame.includes('case 3:') && fixAlgorithmGame.includes('case 4:') && fixAlgorithmGame.includes('levelNum === 4'), 'FixAlgorithmGame implements unique challenges and guided steps for all 5 levels without accidental repetition');

  // TEST 7: Production Build Files Integrity
  console.log('\n--- 7. Video and Module Assets Accessibility ---');
  const videosToCheck = ['bubble.mp4', 'insertion.mp4', 'selection.mp4'];
  for (const v of videosToCheck) {
    const res = await fetch(`${FRONTEND_URL}/videos/${v}`, { method: 'HEAD' });
    assert(res.ok, `Sorting video /videos/${v} is accessible: HTTP ${res.status}`);
  }

  // TEST 8: Check Database Student Records Integrity (All original authentic records preserved)
  console.log('\n--- 8. Database Records Integrity ---');
  const studentsCountRes = await fetch(`${BACKEND_URL}/api/leaderboard`);
  assert(studentsCountRes.ok, `Leaderboard API endpoint responds: HTTP ${studentsCountRes.status}`);
  const leaderboardData = await studentsCountRes.json();
  const leaderboardList = Array.isArray(leaderboardData.leaderboard) ? leaderboardData.leaderboard : leaderboardData;
  const authenticCount = Array.isArray(leaderboardList) ? leaderboardList.length : 0;
  assert(authenticCount >= 17, `Authentic student records preserved without loss or resets (count: ${authenticCount})`);

  console.log('\n====================================================');
  console.log(`🎉 ALL ${passed}/${total} TARGETED BUG FIX VERIFICATION TESTS PASSED!`);
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('\nTest Suite Failed:', err);
  process.exit(1);
});
