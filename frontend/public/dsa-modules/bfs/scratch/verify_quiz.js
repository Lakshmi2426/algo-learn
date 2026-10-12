// Automated Verification for QuizEngine & Scoring System
const fs = require('fs');
const path = require('path');

// Mock browser globals
global.window = global;
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};
global.document = {
  getElementById(id) {
    return {
      id,
      textContent: '',
      innerHTML: '',
      classList: {
        add() {},
        remove() {},
        toggle() {},
        contains() { return false; }
      },
      scrollIntoView() {}
    };
  }
};
global.soundManager = {
  playPop() {},
  playSuccess() {},
  playError() {}
};

// Load quiz data
require('c:/Users/LENOVO/Desktop/bfs/BFS-/js/quiz-data.js');
const { QuizEngine } = require('c:/Users/LENOVO/Desktop/bfs/BFS-/js/quiz-engine.js');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`FAIL [Test ${totalTests}]: ${message}`);
    process.exitCode = 1;
  } else {
    passedTests++;
    console.log(`PASS [Test ${totalTests}]: ${message}`);
  }
}

console.log("=== RUNNING QUIZ ENGINE ACCEPTANCE TESTS ===");

const engine = new QuizEngine();
const mockContainer = { innerHTML: '' };
engine.init(mockContainer);

// Acceptance Test 1: Questions loaded correctly & count is 10
assert(engine.questions.length === 10, `Quiz has exactly 10 questions (actual: ${engine.questions.length})`);
assert(engine.questionTimeLimit === 20, `Time limit per question is 20s (actual: ${engine.questionTimeLimit})`);

// Acceptance Test 2: calculateScore() math with example from Section 3
// Example: 6 correct (+12), 2 incorrect (-2), 2 timed-out (0) => Final score = 10 out of 20
engine.userAnswers = {
  1: { isCorrect: true, timedOut: false },
  2: { isCorrect: true, timedOut: false },
  3: { isCorrect: true, timedOut: false },
  4: { isCorrect: true, timedOut: false },
  5: { isCorrect: true, timedOut: false },
  6: { isCorrect: true, timedOut: false },
  7: { isCorrect: false, timedOut: false },
  8: { isCorrect: false, timedOut: false },
  9: { isCorrect: false, timedOut: true },
  10: { isCorrect: false, timedOut: true }
};
const stats1 = engine.calculateScore();
assert(stats1.correct === 6, `Correct count is 6 (actual: ${stats1.correct})`);
assert(stats1.incorrect === 2, `Incorrect count is 2 (actual: ${stats1.incorrect})`);
assert(stats1.timedOut === 2, `Timed-out count is 2 (actual: ${stats1.timedOut})`);
assert(stats1.rawScore === 10, `Raw score is exactly 10 (actual: ${stats1.rawScore})`);
assert(stats1.maxScore === 20, `Maximum possible score is 20 (actual: ${stats1.maxScore})`);

// Acceptance Test 3: Negative scoring support
// 0 correct, 3 incorrect => rawScore should be -3, NOT clamped to 0
engine.userAnswers = {
  1: { isCorrect: false, timedOut: false },
  2: { isCorrect: false, timedOut: false },
  3: { isCorrect: false, timedOut: false }
};
const statsNeg = engine.calculateScore();
assert(statsNeg.rawScore === -3, `Negative score is correctly calculated as -3 (actual: ${statsNeg.rawScore})`);

// Acceptance Test 4: Timeout awards 0 points without deduction
engine.reset();
engine.currentIndex = 0;
engine.handleTimeout();
assert(engine.userAnswers[1] !== undefined, "Question 1 recorded as answered after timeout");
assert(engine.userAnswers[1].timedOut === true, "Question 1 timedOut flag is true");
assert(engine.userAnswers[1].isCorrect === false, "Question 1 isCorrect is false");
const statsTimeout = engine.calculateScore();
assert(statsTimeout.rawScore === 0, `Timeout awards 0 points (actual rawScore: ${statsTimeout.rawScore})`);
assert(statsTimeout.timedOut === 1, `Timed out count is 1 (actual: ${statsTimeout.timedOut})`);

// Acceptance Test 5: Duplicate scoring prevention on Timeout & Confirm
const scoreBeforeDuplicate = engine.calculateScore().rawScore;
engine.handleTimeout(); // Try calling again on same question
assert(engine.calculateScore().rawScore === scoreBeforeDuplicate, "Calling timeout again does not change score");

engine.pendingSelections[1] = "A";
engine.confirmAnswer(); // Try submitting answer on already timed-out question
assert(engine.userAnswers[1].timedOut === true, "Already timed-out question answer cannot be overwritten");
assert(engine.calculateScore().rawScore === scoreBeforeDuplicate, "Score remains unchanged");

// Acceptance Test 6: Question answer selection and confirmation (+2 pts)
engine.reset();
engine.currentIndex = 0; // Question 1
const q1 = engine.questions[0];
const correctOpt = q1.options.find(o => o.correct);
engine.selectOption(q1.id, correctOpt.id);
assert(engine.pendingSelections[q1.id] === correctOpt.id, "Pending selection saved");
engine.confirmAnswer();
assert(engine.userAnswers[q1.id].isCorrect === true, "Question marked as correct");
assert(engine.score === 2, `Score is +2 after correct answer (actual: ${engine.score})`);

// Acceptance Test 7: Prevent duplicate scoring on double submit
engine.confirmAnswer();
assert(engine.score === 2, "Double submit does not award additional points");

// Acceptance Test 8: Navigating backward and forward preserves state and score
engine.nextQuestion();
assert(engine.currentIndex === 1, "Navigated to Question 2");
assert(engine.score === 2, "Score preserved after nextQuestion()");
engine.prevQuestion();
assert(engine.currentIndex === 0, "Navigated back to Question 1");
assert(engine.score === 2, "Score preserved after prevQuestion()");

// Acceptance Test 9: Incorrect answer deducts 1 point (+2 - 1 = +1)
engine.goToQuestion(1); // Question 2
const q2 = engine.questions[1];
const wrongOpt = q2.options.find(o => !o.correct);
engine.selectOption(q2.id, wrongOpt.id);
engine.confirmAnswer();
assert(engine.userAnswers[q2.id].isCorrect === false, "Question 2 marked as incorrect");
assert(engine.score === 1, `Score after incorrect answer is 1 (+2 - 1 = +1, actual: ${engine.score})`);

// Acceptance Test 10: Progress percentage matches completed questions (2 / 10 = 20%)
const currentStats = engine.calculateScore();
const progressPct = Math.round((currentStats.answeredTotal / currentStats.totalQ) * 100);
assert(progressPct === 20, `Progress percentage is 20% (actual: ${progressPct}%)`);

// Acceptance Test 11: UI rendering check for Reference Image 2 components
engine.render();
const html = mockContainer.innerHTML;
assert(html.includes("Quiz Assessment"), "Rendered UI contains 'Quiz Assessment' title");
assert(html.includes("Validate your algorithmic Queue reasoning and earn mastery points (Basic to Hard)."), "Rendered UI contains Reference Image 2 subtitle");
assert(html.includes(`Question ${engine.currentIndex + 1} of 10`), `Rendered UI contains dynamic question counter pill for current index (Question ${engine.currentIndex + 1} of 10)`);
engine.goToQuestion(0);
assert(mockContainer.innerHTML.includes("Question 1 of 10"), "Moving to index 0 dynamically updates pill to 'Question 1 of 10'");

assert(html.includes("quiz-scoring-info-bar"), "Rendered UI contains pale-yellow scoring info bar");
assert(html.includes("Correct answer:"), "Scoring info bar lists Correct answer (+2 points)");
assert(html.includes("Incorrect answer:"), "Scoring info bar lists Incorrect answer (-1 point)");
assert(!html.includes("Timeout:"), "Scoring info bar does NOT list Timeout (removed per Image 4)");
assert(!html.includes("Time limit:"), "Scoring info bar does NOT list Time limit (removed per Image 4)");
assert(html.includes("quiz-progress-track"), "Rendered UI contains horizontal progress track");
assert(html.includes("quiz-qnav-row"), "Rendered UI contains Q1..Q10 navigation row");
assert(html.includes("quiz-main-question-card"), "Rendered UI contains main question card matching Image 2");
assert(html.includes("quiz-badge-difficulty"), "Rendered UI contains difficulty badge");
assert(html.includes("MULTIPLE CHOICE"), "Rendered UI contains MULTIPLE CHOICE badge");
assert(html.includes("quiz-options-container"), "Rendered UI contains full-width option rows container");

// Acceptance Test 12: Final results summary screen rendering
engine.isCompleted = true;
engine.render();
const summaryHtml = mockContainer.innerHTML;
assert(summaryHtml.includes("Quiz Assessment Results"), "Results screen contains heading");
assert(summaryHtml.includes("quiz-results-hero-card"), "Results screen contains results hero card");
assert(summaryHtml.includes("FINAL SCORE:"), "Results screen displays FINAL SCORE");
assert(summaryHtml.includes("Retry Quiz"), "Results screen contains Retry Quiz button");
assert(summaryHtml.includes("Return to Dashboard"), "Results screen contains Return to Dashboard button");
assert(summaryHtml.includes("Question-by-Question Review"), "Results screen contains Question-by-Question Review");

console.log(`\n=== RESULTS: ${passedTests} / ${totalTests} TESTS PASSED ===`);
