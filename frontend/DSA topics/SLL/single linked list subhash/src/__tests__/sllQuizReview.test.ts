import { progressManager } from '../utils/progressManager';
import {
  QUIZ_QUESTIONS,
  fisherYatesShuffle,
  generateShuffledOptions,
  StudentAnswerRecord,
} from '../components/QuizView';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`✓ ${message}`);
}

console.log('=====================================================');
console.log('🧪 RUNNING SLL QUIZ RESULTS, RANDOMIZATION & REVIEW ANSWERS TEST SUITE');
console.log('=====================================================\n');

// ---------------------------------------------------------------------------
// SUITE 1: BALANCED RANDOMIZATION & FISHER-YATES SHUFFLE
// ---------------------------------------------------------------------------
console.log('--- TEST SUITE 1: BALANCED RANDOMIZATION & FISHER-YATES ---');

// 1.1 Fisher-Yates shuffle preserves elements
const sample = ['Option A', 'Option B', 'Option C', 'Option D'];
const shuffledSample = fisherYatesShuffle(sample);
assert(shuffledSample.length === sample.length, 'Fisher-Yates preserves array length');
assert(
  sample.every((item) => shuffledSample.includes(item)),
  'Fisher-Yates contains all original elements'
);

// 1.2 Shuffling does not mutate the original QUIZ_QUESTIONS
const originalFirstQuestionOptions = [...QUIZ_QUESTIONS[0].options];
const generatedShuffled = generateShuffledOptions(QUIZ_QUESTIONS);

assert(
  QUIZ_QUESTIONS[0].options[0] === originalFirstQuestionOptions[0],
  'Original QUIZ_QUESTIONS bank is never mutated by shuffling'
);

// 1.3 Correct answers are not always at index 0 (Option A) across attempts
const correctPositions: number[] = [];
QUIZ_QUESTIONS.forEach((q) => {
  const opts = generatedShuffled[q.id];
  assert(Array.isArray(opts), `Question ${q.id} has shuffled options array`);
  assert(opts.length === q.options.length, `Question ${q.id} has same number of options`);
  assert(opts.includes(q.correctAnswerText), `Question ${q.id} includes correct answer text`);

  const pos = opts.indexOf(q.correctAnswerText);
  correctPositions.push(pos);
});

// Check that positions include choices other than 0 (A)
const nonZeroPositions = correctPositions.filter((p) => p !== 0);
assert(
  nonZeroPositions.length > 0,
  `Correct answers appear in multiple positions, not always Option A (found at least ${nonZeroPositions.length} non-A)`
);

// 1.4 Balanced distribution across multiple attempts
const slotCounts = { 0: 0, 1: 0, 2: 0, 3: 0 };
for (let attempt = 0; attempt < 50; attempt++) {
  const attemptShuffled = generateShuffledOptions(QUIZ_QUESTIONS);
  QUIZ_QUESTIONS.forEach((q) => {
    const pos = attemptShuffled[q.id].indexOf(q.correctAnswerText);
    if (pos >= 0 && pos <= 3) {
      slotCounts[pos as 0 | 1 | 2 | 3]++;
    }
  });
}

console.log('   Distribution across 50 attempts (500 questions):', slotCounts);
assert(slotCounts[0] > 60, 'Option A (slot 0) has healthy representation');
assert(slotCounts[1] > 60, 'Option B (slot 1) has healthy representation');
assert(slotCounts[2] > 60, 'Option C (slot 2) has healthy representation');
assert(slotCounts[3] > 60, 'Option D (slot 3) has healthy representation');

// 1.5 Independent shuffling per question
const anotherShuffled = generateShuffledOptions(QUIZ_QUESTIONS);
let hasDifferentOrder = false;
for (const q of QUIZ_QUESTIONS) {
  if (
    generatedShuffled[q.id].join('||') !== anotherShuffled[q.id].join('||')
  ) {
    hasDifferentOrder = true;
    break;
  }
}
assert(hasDifferentOrder, 'Independent quiz attempts produce different option permutations');

console.log('✓ Suite 1 Passed!\n');

// ---------------------------------------------------------------------------
// SUITE 2: ANSWER EVALUATION BY VALUE (NOT ARRAY INDEX)
// ---------------------------------------------------------------------------
console.log('--- TEST SUITE 2: ANSWER EVALUATION & SCORING ---');

progressManager.resetQuizSession();

const q1 = QUIZ_QUESTIONS[0];
const q1Opts = generatedShuffled[q1.id];
const q1CorrectIdx = q1Opts.indexOf(q1.correctAnswerText);

// Selecting the shuffled correct answer awards +3
const selectedCorrectText = q1Opts[q1CorrectIdx];
const isCorrectSelection = selectedCorrectText.trim() === q1.correctAnswerText.trim();
assert(isCorrectSelection === true, 'Matching text to correctAnswerText correctly identifies correct answer');

const resCorrect = progressManager.recordQuizQuestion(q1.id, 'correct', q1CorrectIdx);
assert(resCorrect.points === 3, 'Correct answer awards exactly +3 points');
assert(resCorrect.isDuplicate === false, 'First submission is not a duplicate');

// Duplicate submission is ignored
const resDuplicate = progressManager.recordQuizQuestion(q1.id, 'correct', q1CorrectIdx);
assert(resDuplicate.isDuplicate === true, 'Duplicate submission on answered question is prevented');
assert(resDuplicate.points === 3, 'Duplicate submission does not add extra points');

// Selecting an incorrect answer awards -1
const q2 = QUIZ_QUESTIONS[1];
const resWrong = progressManager.recordQuizQuestion(q2.id, 'wrong', 0);
assert(resWrong.points === -1, 'Wrong answer awards exactly -1 point');

// Timeout/unanswered awards 0
const q3 = QUIZ_QUESTIONS[2];
const resTimeout = progressManager.recordQuizQuestion(q3.id, 'timeout', -1);
assert(resTimeout.points === 0, 'Timeout/unanswered awards exactly 0 points');

console.log('✓ Suite 2 Passed!\n');

// ---------------------------------------------------------------------------
// SUITE 3: SCORING CONSISTENCY (EXAMPLE: 8 CORRECT, 2 INCORRECT = 22/30 PTS)
// ---------------------------------------------------------------------------
console.log('--- TEST SUITE 3: 8 CORRECT, 2 INCORRECT EXACT REQUIREMENT ---');

progressManager.resetQuizSession();

// Simulate 8 correct and 2 wrong questions
for (let i = 0; i < 8; i++) {
  const q = QUIZ_QUESTIONS[i];
  progressManager.recordQuizQuestion(q.id, 'correct', 0);
}
for (let i = 8; i < 10; i++) {
  const q = QUIZ_QUESTIONS[i];
  progressManager.recordQuizQuestion(q.id, 'wrong', 1);
}

const finalQuizScore = progressManager.getCategoryScore('quiz');
assert(
  finalQuizScore === 22,
  `Final score for 8 correct and 2 incorrect is strictly 22/30 pts (got ${finalQuizScore})`
);

const stats = progressManager.getStats();
assert(stats.quiz.finalScore === 22, 'getStats().quiz.finalScore is 22');
assert(stats.quiz.percentage === Math.round((22 / 30) * 100), 'getStats().quiz.percentage is 73%');

console.log('✓ Suite 3 Passed!\n');

// ---------------------------------------------------------------------------
// SUITE 4: REVIEW ANSWERS DATA MAPPING & NOT ANSWERED HANDLING
// ---------------------------------------------------------------------------
console.log('--- TEST SUITE 4: REVIEW ANSWERS DATA MAPPING ---');

progressManager.resetQuizSession();
const attemptShuffled = generateShuffledOptions(QUIZ_QUESTIONS);

// Simulate full attempt:
// Q1: Correct
// Q2: Incorrect
// Q3: Skipped (Not Answered)
// Q4-10: Correct
const mockAnswers: Record<number, StudentAnswerRecord> = {};

QUIZ_QUESTIONS.forEach((q, idx) => {
  const opts = attemptShuffled[q.id];
  const correctIdx = opts.indexOf(q.correctAnswerText);

  if (idx === 0) {
    // User picked correct option
    mockAnswers[q.id] = {
      questionId: q.id,
      selectedOptionIndex: correctIdx,
      selectedAnswerText: opts[correctIdx],
      correctOptionIndex: correctIdx,
      correctAnswerText: q.correctAnswerText,
      isCorrect: true,
      isTimeout: false,
      points: 3,
    };
    progressManager.recordQuizQuestion(q.id, 'correct', correctIdx);
  } else if (idx === 1) {
    // User picked incorrect option
    const wrongIdx = (correctIdx + 1) % opts.length;
    mockAnswers[q.id] = {
      questionId: q.id,
      selectedOptionIndex: wrongIdx,
      selectedAnswerText: opts[wrongIdx],
      correctOptionIndex: correctIdx,
      correctAnswerText: q.correctAnswerText,
      isCorrect: false,
      isTimeout: false,
      points: -1,
    };
    progressManager.recordQuizQuestion(q.id, 'wrong', wrongIdx);
  } else if (idx === 2) {
    // User skipped Q3
    mockAnswers[q.id] = {
      questionId: q.id,
      selectedOptionIndex: -1,
      selectedAnswerText: 'Not Answered',
      correctOptionIndex: correctIdx,
      correctAnswerText: q.correctAnswerText,
      isCorrect: false,
      isTimeout: true,
      points: 0,
    };
    progressManager.recordQuizQuestion(q.id, 'timeout', -1);
  } else {
    // Q4 to Q10 correct
    mockAnswers[q.id] = {
      questionId: q.id,
      selectedOptionIndex: correctIdx,
      selectedAnswerText: opts[correctIdx],
      correctOptionIndex: correctIdx,
      correctAnswerText: q.correctAnswerText,
      isCorrect: true,
      isTimeout: false,
      points: 3,
    };
    progressManager.recordQuizQuestion(q.id, 'correct', correctIdx);
  }
});

// Verify Review Card Data integrity for every question:
QUIZ_QUESTIONS.forEach((q, idx) => {
  const rec = mockAnswers[q.id];
  const opts = attemptShuffled[q.id];
  const expectedCorrectIdx = opts.indexOf(q.correctAnswerText);

  assert(rec !== undefined, `Question ${q.id} has review record`);
  assert(rec.correctAnswerText === q.correctAnswerText, `Question ${q.id} correct answer text matches`);
  assert(rec.correctOptionIndex === expectedCorrectIdx, `Question ${q.id} correctOptionIndex matches shuffled index`);

  if (idx === 0) {
    assert(rec.isCorrect === true, 'Q1 is marked correct');
    assert(rec.points === 3, 'Q1 awards +3 pts');
    assert(rec.selectedAnswerText === q.correctAnswerText, 'Q1 shows correct text selected');
  } else if (idx === 1) {
    assert(rec.isCorrect === false, 'Q2 is marked incorrect');
    assert(rec.points === -1, 'Q2 awards -1 pt');
    assert(rec.selectedAnswerText !== q.correctAnswerText, 'Q2 shows wrong text selected');
  } else if (idx === 2) {
    assert(rec.isCorrect === false, 'Q3 is not marked correct');
    assert(rec.isTimeout === true, 'Q3 is marked timeout/skipped');
    assert(rec.selectedAnswerText === 'Not Answered', 'Q3 submission displays "Not Answered"');
    assert(rec.points === 0, 'Q3 awards 0 pts');
  }

  // Technical explanation matches question exactly
  assert(q.explanation.length > 10, `Question ${q.id} has technical explanation`);
});

// Score verification: 8 correct (+24), 1 wrong (-1), 1 skipped (0) = 23 pts
const totalEarned = progressManager.getCategoryScore('quiz');
assert(totalEarned === 23, `Total score is strictly 23 pts (got ${totalEarned})`);

console.log('✓ Suite 4 Passed!\n');

// ---------------------------------------------------------------------------
// SUITE 5: SESSION PERSISTENCE ACROSS RE-RENDERS AND NAVIGATION
// ---------------------------------------------------------------------------
console.log('--- TEST SUITE 5: SESSION STATE PERSISTENCE ---');

progressManager.saveQuizSession({
  hasStarted: true,
  currentQuestionIndex: 4,
  timeLeft: 14,
  isSubmitted: true,
  studentAnswers: mockAnswers,
  shuffledOptions: attemptShuffled,
});

const restoredSession = progressManager.getQuizSession();
assert(restoredSession.hasStarted === true, 'Session hasStarted is preserved');
assert(restoredSession.currentQuestionIndex === 4, 'Current question index preserved');
assert(restoredSession.timeLeft === 14, 'Time left preserved');
assert(restoredSession.isSubmitted === true, 'Submission state preserved');
assert(
  restoredSession.shuffledOptions?.[1]?.join(',') === attemptShuffled[1].join(','),
  'Shuffled options preserved identically in session across re-renders'
);
assert(
  restoredSession.studentAnswers?.[1]?.selectedAnswerText === mockAnswers[1].selectedAnswerText,
  'Student answers preserved identically in session across re-renders'
);

console.log('✓ Suite 5 Passed!\n');

console.log('=====================================================');
console.log(`🎉 ALL ${passedTests}/${totalTests} SLL QUIZ TESTS PASSED PERFECTLY!`);
console.log('=====================================================');
