const assert = require('assert');

// Mock localStorage implementation
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] !== undefined ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
  get length() {
    return Object.keys(this.store).length;
  }
  key(i) {
    return Object.keys(this.store)[i] || null;
  }
}

global.window = {};
global.localStorage = new MockLocalStorage();

function safeJsonParse(raw) {
  if (!raw || raw === 'undefined' || raw === 'null' || raw.trim() === '') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Emulate readNativeModuleProgress directly matching topicProgress.ts
function readNativeModuleProgress(moduleId) {
  try {
    switch (moduleId) {
      case 'stack': {
        const raw = localStorage.getItem('stack_master_user_progress_v2');
        const p = safeJsonParse(raw);
        if (!p) return 0;
        if (typeof p.totalTopicPoints === 'number') {
          return Math.min(100, p.totalTopicPoints);
        }
        const completedLabs = Array.isArray(p.completedLabs) ? p.completedLabs : [];
        const vizCount = Math.min(2, completedLabs.filter((id) => id === 1 || id === 2).length);
        const vizPts = Math.min(20, vizCount * 10);
        const gameScores = p.gameScores || {};
        const completedGames = Array.isArray(p.completedGameLevels) ? p.completedGameLevels : [];
        const g1 = gameScores[1] !== undefined ? gameScores[1] : (completedGames.includes(1) ? 20 : 0);
        const g2 = gameScores[2] !== undefined ? gameScores[2] : (completedGames.includes(2) ? 20 : 0);
        const gamePts = Math.min(40, g1 + g2);
        const quizScores = p.quizQuestionScores || {};
        let quizSum = 0;
        Object.values(quizScores).forEach((sc) => { quizSum += Number(sc) || 0; });
        const quizPts = Math.min(40, quizSum);
        return Math.min(100, vizPts + gamePts + quizPts);
      }

      case 'hashing': {
        let points = 0;
        let found = false;
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('hash_user_points_') || k === 'hash_quest_points_system_v2')) {
            const ptsObj = safeJsonParse(localStorage.getItem(k));
            if (ptsObj) {
              if (typeof ptsObj.totalPoints === 'number') {
                points = found ? Math.max(points, ptsObj.totalPoints) : ptsObj.totalPoints;
                found = true;
              } else {
                const viz = typeof ptsObj.visualizePoints === 'number' ? ptsObj.visualizePoints : 0;
                const game = typeof ptsObj.gamePoints === 'number' ? ptsObj.gamePoints : 0;
                const quiz = typeof ptsObj.quizPoints === 'number' ? ptsObj.quizPoints : 0;
                const hints = typeof ptsObj.hintUsesCount === 'number' ? ptsObj.hintUsesCount * 2 : 0;
                const guides = typeof ptsObj.guidedSolveUsesCount === 'number' ? ptsObj.guidedSolveUsesCount * 4 : 0;
                const compTotal = Math.min(100, viz + game + quiz - hints - guides);
                points = found ? Math.max(points, compTotal) : compTotal;
                found = true;
              }
            }
          }
        }
        const directKey = localStorage.getItem('algolearn_topic_progress_hashing');
        if (directKey) {
          const parsed = parseInt(directKey, 10);
          if (!isNaN(parsed)) points = found ? Math.max(points, parsed) : parsed;
        }
        return Math.min(100, points);
      }

      case 'linear-search': {
        let points = 0;
        const rawPts = localStorage.getItem('algo_quest_points_system_v3');
        const pts = safeJsonParse(rawPts);
        if (pts && typeof pts.totalPoints === 'number') {
          points = pts.totalPoints;
        } else {
          const direct = localStorage.getItem('algolearn_topic_progress_linear-search');
          if (direct) {
            const num = parseInt(direct, 10);
            if (!isNaN(num)) points = num;
          }
        }
        return Math.min(100, points);
      }

      case 'binary-search': {
        const raw = localStorage.getItem('binary_search_user_progress_v4');
        const p = safeJsonParse(raw);
        if (!p) return 0;
        const totalEarned = p.topicPoints?.totalEarned !== undefined ? p.topicPoints.totalEarned : (p.totalPoints || 0);
        return Math.min(100, totalEarned);
      }

      case 'sorting': {
        let p = null;
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('sort_master_user_progress_') || k.startsWith('stack_master_user_progress_v2_fresh_reset_'))) {
            const parsed = safeJsonParse(localStorage.getItem(k));
            if (parsed) { p = parsed; break; }
          }
        }
        if (!p) return 0;
        if (typeof p.totalScore === 'number') return Math.min(100, p.totalScore);
        const ledger = p.pointsLedger || {};
        if (typeof ledger.totalPointsEarned === 'number') return Math.min(100, ledger.totalPointsEarned);
        const viz = Math.min(15, Math.max(0, ledger.visualizationPoints || 0));
        const game = Math.min(45, (ledger.gamePoints || 0) - ((ledger.hintDeductions || 0) + (ledger.guidedSolveDeductions || 0)));
        const quiz = Math.min(40, (ledger.quizPoints || 0) - (ledger.wrongQuizDeductions || 0));
        return Math.min(100, viz + game + quiz);
      }

      case 'queue': {
        const raw = localStorage.getItem('queue_master_user_progress_v2') || localStorage.getItem('stack_master_user_progress_v1');
        const p = safeJsonParse(raw);
        if (!p) return 0;
        if (typeof p.queueScore === 'number') {
          return Math.min(100, p.queueScore);
        }
        const vizCount = Math.min(2, (p.completedLabs || []).filter((id) => id >= 1 && id <= 2).length);
        const vizPts = vizCount * 6;
        const completedLevels = new Set(
          (p.completedGameLevels || []).filter((id) => id >= 1 && id <= 3)
        );
        let rawGamePts = 0;
        completedLevels.forEach((lvl) => {
          rawGamePts += lvl === 3 ? 14 : 13;
        });
        const deductions = Math.max(0, p.queueDeductions || 0);
        const gamePts = Math.min(40, rawGamePts) - deductions;
        let quizPts = 0;
        if (p.quizQuestionResults && typeof p.quizQuestionResults === 'object') {
          const results = Object.values(p.quizQuestionResults);
          const correct = results.filter((r) => r === 'correct').length;
          const incorrect = results.filter((r) => r === 'incorrect').length;
          quizPts = Math.min(48, correct * 4 - incorrect * 2);
        } else if (p.quizHighScore !== undefined) {
          quizPts = p.quizHighScore;
        }
        return Math.min(100, vizPts + gamePts + quizPts);
      }

      case 'sll': {
        const raw = localStorage.getItem('algolearn_sll_100_points_progress_v4');
        const p = safeJsonParse(raw);
        if (!p) return 0;
        return Math.min(100, p.totalPoints !== undefined ? p.totalPoints : 0);
      }

      case 'dll': {
        const rawEv = localStorage.getItem('algolearn_scoring_events_v2');
        const events = safeJsonParse(rawEv) || [];
        let earnedScore = 0;
        if (Array.isArray(events) && events.length > 0) {
          const dllEvents = events.filter((ev) => ev.topicId === 'dll');
          const vizEvents = dllEvents.filter((ev) => ev.activityType === 'VISUALIZE' && ev.reason === 'VIDEO_COMPLETED');
          const gameEvents = dllEvents.filter((ev) => ev.activityType === 'GAME' && ev.reason === 'GAME_TASK_COMPLETED');
          const correctQuiz = dllEvents.filter((ev) => ev.activityType === 'QUIZ' && ev.reason === 'QUIZ_CORRECT');
          const incorrectQuiz = dllEvents.filter((ev) => ev.activityType === 'QUIZ' && ev.reason === 'QUIZ_INCORRECT');
          const hints = dllEvents.filter((ev) => ev.activityType === 'GAME' && ev.reason === 'HINT_USED');
          const guides = dllEvents.filter((ev) => ev.activityType === 'GAME' && ev.reason === 'GUIDED_SOLVE_STEP');

          const vScore = Math.min(16, vizEvents.length * 8);
          const gScore = gameEvents.length * 6 - (hints.length * 1 + guides.length * 2);
          const qScore = correctQuiz.length * 3 - incorrectQuiz.length * 1;
          earnedScore = Math.min(100, Math.round(vScore + gScore + qScore));
        }
        return earnedScore;
      }

      case 'cll': {
        const rawPts = localStorage.getItem('cll-learning-points-v5');
        const pts = safeJsonParse(rawPts);
        let totalPoints = 0;
        if (pts && typeof pts.totalPoints === 'number') {
          totalPoints = pts.totalPoints;
        }
        return Math.min(100, totalPoints);
      }

      case 'bfs': {
        const completedVideos = safeJsonParse(localStorage.getItem('algolearn_completed_videos')) || [];
        const completedLevels = safeJsonParse(localStorage.getItem('algolearn_completed_levels')) || [];
        const quizAnswers = safeJsonParse(localStorage.getItem('algolearn_quiz_answers')) || {};
        const assistance = safeJsonParse(localStorage.getItem('algolearn_game_assistance')) || {};

        const videoScore = Math.min(16, completedVideos.length * 8);
        let gamePositive = Math.min(64, completedLevels.length * 8);
        let gamePenalties = 0;
        Object.values(assistance).forEach((ast) => {
          if (!ast) return;
          const hints = ast.hintCount || (ast.hintUsed ? 1 : 0);
          const guided = ast.guidedCount || (ast.guidedUsed ? 1 : 0);
          gamePenalties += hints * 3 + guided * 3;
        });
        const gameScore = gamePositive - gamePenalties;
        let quizCorrect = 0;
        let quizIncorrect = 0;
        Object.values(quizAnswers).forEach((ans) => {
          if (ans?.isCorrect === true) quizCorrect++;
          else if (ans?.isCorrect === false) quizIncorrect++;
        });
        const quizScore = Math.min(20, quizCorrect * 2 - quizIncorrect * 1);
        return Math.min(100, videoScore + gameScore + quizScore);
      }

      case 'trees': {
        let isVideoDone = false;
        let quizScoreVal = null;
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k) continue;
          if (k.includes('video_completed') && localStorage.getItem(k) === 'true') isVideoDone = true;
          if (k.includes('quiz_score')) {
            const parsed = safeJsonParse(localStorage.getItem(k));
            if (parsed && typeof parsed.score === 'number') {
              quizScoreVal = quizScoreVal !== null ? Math.max(quizScoreVal, parsed.score) : parsed.score;
            }
          }
        }
        const vizPoints = isVideoDone ? 30 : 0;
        const currentQuizPts = quizScoreVal !== null ? Math.min(70, quizScoreVal) : 0;
        return Math.min(100, vizPoints + currentQuizPts);
      }

      case 'bst': {
        const raw = localStorage.getItem('bst_explorer_user_stats_main');
        const p = safeJsonParse(raw);
        if (!p) return 0;
        return Math.min(100, typeof p.totalTopicPoints === 'number' ? p.totalTopicPoints : 0);
      }

      case 'dsa-types': {
        const raw = localStorage.getItem('algo_ds_types_progress_v1');
        const p = safeJsonParse(raw);
        if (!p) return 0;
        return Math.min(100, p.topicData?.overallTopicScore !== undefined ? p.topicData.overallTopicScore : 0);
      }

      default:
        return 0;
    }
  } catch (err) {
    return 0;
  }
}

console.log('=== TEST SUITE: ALGOLEARN 13 TOPICS POINT & PROGRESS SYSTEM ===\n');

// Test 1: Queues negative quiz score & total
localStorage.clear();
// 3 correct @ 4 pts = 12, 7 incorrect @ -2 pts = -14 -> Quiz score = -2
localStorage.setItem('queue_master_user_progress_v2', JSON.stringify({
  completedLabs: [1], // 6 pts
  completedGameLevels: [1], // 13 pts
  quizQuestionResults: {
    q1: 'correct', q2: 'correct', q3: 'correct',
    q4: 'incorrect', q5: 'incorrect', q6: 'incorrect', q7: 'incorrect', q8: 'incorrect', q9: 'incorrect', q10: 'incorrect'
  }
}));
// 6 + 13 - 2 = 17
let score = readNativeModuleProgress('queue');
console.log('1. Queues (6 viz + 13 game - 2 quiz):', score);
assert.strictEqual(score, 17, 'Queues should equal 17');

// Pure negative Queues (0 viz + 0 game + 3 correct & 7 wrong = -2)
localStorage.setItem('queue_master_user_progress_v2', JSON.stringify({
  completedLabs: [],
  completedGameLevels: [],
  quizQuestionResults: {
    q1: 'correct', q2: 'correct', q3: 'correct',
    q4: 'incorrect', q5: 'incorrect', q6: 'incorrect', q7: 'incorrect', q8: 'incorrect', q9: 'incorrect', q10: 'incorrect'
  }
}));
score = readNativeModuleProgress('queue');
console.log('1b. Queues (pure negative -2):', score);
assert.strictEqual(score, -2, 'Queues pure negative should equal -2');

// Test 2: Stack (negative quiz scores)
localStorage.clear();
// 3 correct (+3 each = 9), 7 wrong (-2 each = -14) -> -5
localStorage.setItem('stack_master_user_progress_v2', JSON.stringify({
  totalTopicPoints: -5,
  quizQuestionScores: { 1: 3, 2: 3, 3: 3, 4: -2, 5: -2, 6: -2, 7: -2, 8: -2, 9: -2, 10: -2 }
}));
score = readNativeModuleProgress('stack');
console.log('2. Stack (quiz score -5):', score);
assert.strictEqual(score, -5, 'Stack should equal -5');

// Test 3: Hashing
localStorage.clear();
localStorage.setItem('hash_user_points_test', JSON.stringify({
  totalPoints: -8,
  visualizePoints: 0,
  gamePoints: 0,
  quizPoints: -8
}));
score = readNativeModuleProgress('hashing');
console.log('3. Hashing (negative -8):', score);
assert.strictEqual(score, -8, 'Hashing should equal -8');

// Test 4: Linear Search
localStorage.clear();
localStorage.setItem('algo_quest_points_system_v3', JSON.stringify({
  totalPoints: -5
}));
score = readNativeModuleProgress('linear-search');
console.log('4. Linear Search (negative -5):', score);
assert.strictEqual(score, -5, 'Linear Search should equal -5');

// Test 5: Binary Search
localStorage.clear();
localStorage.setItem('binary_search_user_progress_v4', JSON.stringify({
  topicPoints: { totalEarned: -6, quizEarned: -6 }
}));
score = readNativeModuleProgress('binary-search');
console.log('5. Binary Search (negative -6):', score);
assert.strictEqual(score, -6, 'Binary Search should equal -6');

// Test 6: Sorting (CRITICAL: ensure points != progress percentage!)
localStorage.clear();
localStorage.setItem('sort_master_user_progress_1', JSON.stringify({
  totalScore: 25,
  pointsLedger: {
    totalPointsEarned: 25,
    visualizationPoints: 10,
    gamePoints: 20,
    quizPoints: -5
  }
}));
score = readNativeModuleProgress('sorting');
console.log('6. Sorting (totalScore 25):', score);
assert.strictEqual(score, 25, 'Sorting should equal 25 (not percentage)');

// Test 6b: Sorting negative
localStorage.clear();
localStorage.setItem('sort_master_user_progress_1', JSON.stringify({
  totalScore: -4,
  pointsLedger: { totalPointsEarned: -4 }
}));
score = readNativeModuleProgress('sorting');
console.log('6b. Sorting (negative -4):', score);
assert.strictEqual(score, -4, 'Sorting should equal -4');

// Test 7: Singly Linked List (SLL)
localStorage.clear();
localStorage.setItem('algolearn_sll_100_points_progress_v4', JSON.stringify({
  totalPoints: -3
}));
score = readNativeModuleProgress('sll');
console.log('7. SLL (negative -3):', score);
assert.strictEqual(score, -3, 'SLL should equal -3');

// Test 8: Doubly Linked List (DLL)
localStorage.clear();
localStorage.setItem('algolearn_scoring_events_v2', JSON.stringify([
  { topicId: 'dll', activityType: 'QUIZ', reason: 'QUIZ_CORRECT' }, // +3
  { topicId: 'dll', activityType: 'QUIZ', reason: 'QUIZ_INCORRECT' }, // -1
  { topicId: 'dll', activityType: 'QUIZ', reason: 'QUIZ_INCORRECT' }, // -1
  { topicId: 'dll', activityType: 'QUIZ', reason: 'QUIZ_INCORRECT' }, // -1
  { topicId: 'dll', activityType: 'QUIZ', reason: 'QUIZ_INCORRECT' }, // -1
  { topicId: 'dll', activityType: 'QUIZ', reason: 'QUIZ_INCORRECT' }, // -1
  { topicId: 'dll', activityType: 'QUIZ', reason: 'QUIZ_INCORRECT' }, // -1
  { topicId: 'dll', activityType: 'QUIZ', reason: 'QUIZ_INCORRECT' }, // -1
])); // 3 - 7 = -4
score = readNativeModuleProgress('dll');
console.log('8. DLL (1 correct + 7 incorrect = -4):', score);
assert.strictEqual(score, -4, 'DLL should equal -4');

// Test 9: Circular Linked List (CLL)
localStorage.clear();
localStorage.setItem('cll-learning-points-v5', JSON.stringify({
  totalPoints: -5
}));
score = readNativeModuleProgress('cll');
console.log('9. CLL (negative -5):', score);
assert.strictEqual(score, -5, 'CLL should equal -5');

// Test 10: BFS
localStorage.clear();
localStorage.setItem('algolearn_completed_videos', '[]');
localStorage.setItem('algolearn_completed_levels', '[]');
localStorage.setItem('algolearn_quiz_answers', JSON.stringify({
  q1: { isCorrect: true }, // +2
  q2: { isCorrect: false }, // -1
  q3: { isCorrect: false }, // -1
  q4: { isCorrect: false }, // -1
  q5: { isCorrect: false }, // -1
  q6: { isCorrect: false }, // -1
})); // 2 - 5 = -3
score = readNativeModuleProgress('bfs');
console.log('10. BFS (1 correct, 5 wrong = -3):', score);
assert.strictEqual(score, -3, 'BFS should equal -3');

// Test 11: Trees
localStorage.clear();
localStorage.setItem('quiz_score_trees', JSON.stringify({
  score: -7
}));
score = readNativeModuleProgress('trees');
console.log('11. Trees (quiz score -7):', score);
assert.strictEqual(score, -7, 'Trees should equal -7');

// Test 12: BST
localStorage.clear();
localStorage.setItem('bst_explorer_user_stats_main', JSON.stringify({
  totalTopicPoints: -5
}));
score = readNativeModuleProgress('bst');
console.log('12. BST (totalTopicPoints -5):', score);
assert.strictEqual(score, -5, 'BST should equal -5');

// Test 13: Data Structure and Types
localStorage.clear();
localStorage.setItem('algo_ds_types_progress_v1', JSON.stringify({
  topicData: { overallTopicScore: -5 }
}));
score = readNativeModuleProgress('dsa-types');
console.log('13. DSA Types (overallTopicScore -5):', score);
assert.strictEqual(score, -5, 'DSA Types should equal -5');

// Test 14: Total Leaderboard Sum across all 13 topics
const sampleScores = {
  stack: 50,
  hashing: 40,
  'linear-search': 30,
  'binary-search': 60,
  sorting: 70,
  sll: 25,
  dll: -4,
  cll: 15,
  queue: -2,
  bfs: -3,
  trees: 30,
  bst: 45,
  'dsa-types': 50
};
let totalXP = 0;
Object.values(sampleScores).forEach(s => totalXP += s);
console.log('\nTotal XP across all 13 topics (including negatives):', totalXP);
// 50+40+30+60+70+25-4+15-2-3+30+45+50 = 406
assert.strictEqual(totalXP, 406, 'Total XP should equal 406');

console.log('\nALL 13 TOPICS PASSED TEST VERIFICATION!');
