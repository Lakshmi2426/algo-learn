import { progressManager, VISUALIZE_ACTIVITIES } from '../utils/progressManager';

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
console.log('🧪 RUNNING INTERACTIVE VISUALIZER POINTS REMOVAL & VIDEO REWARDS TEST');
console.log('=====================================================\n');

// Reset progress state for a clean test baseline
progressManager.resetProgress();

// ---------------------------------------------------------------------------
// SUITE 1: INTERACTIVE VISUALIZER ACTIVITIES AWARD STRICTLY ZERO (0) POINTS
// ---------------------------------------------------------------------------
console.log('--- TEST SUITE 1: VISUALIZER ACTIVITIES (ZERO POINTS) ---');

const visualizerActivityIds = [
  'visualize_node',
  'visualize_linking',
  'visualize_traversal',
  'visualize_insertion',
  'visualize_deletion',
];

const initialTotalPoints = progressManager.getTotalPoints();
const initialVisualizeScore = progressManager.getCategoryScore('visualize');
assert(initialTotalPoints === 0, 'Initial total points is 0');
assert(initialVisualizeScore === 0, 'Initial visualize category score is 0');

for (const actId of visualizerActivityIds) {
  assert(!progressManager.isCompleted(actId), `${actId} is initially not completed`);

  const result = progressManager.completeInteractiveVisualizerActivity(actId);
  assert(result.newlyCompleted === true, `${actId} was newly completed`);
  assert(result.pointsAwarded === 0, `${actId} awarded exactly 0 points`);

  assert(progressManager.isCompleted(actId), `${actId} is now marked as completed`);

  const currentTotal = progressManager.getTotalPoints();
  const currentVis = progressManager.getCategoryScore('visualize');
  assert(currentTotal === 0, `Total points remains 0 after completing ${actId} (got ${currentTotal})`);
  assert(currentVis === 0, `Visualize score remains 0 after completing ${actId} (got ${currentVis})`);

  // Duplicate completion protection check
  const duplicateResult = progressManager.completeInteractiveVisualizerActivity(actId);
  assert(duplicateResult.newlyCompleted === false, `Duplicate completion of ${actId} returns newlyCompleted: false`);
  assert(duplicateResult.pointsAwarded === 0, `Duplicate completion of ${actId} awards 0 points`);
  assert(progressManager.getTotalPoints() === 0, `Total points still 0 after duplicate attempt on ${actId}`);
}

// Confirm all 5 visualizer activities are completed and total score is still 0
for (const actId of visualizerActivityIds) {
  assert(progressManager.isCompleted(actId), `Verified ${actId} is saved as completed in progress state`);
}
assert(progressManager.getTotalPoints() === 0, 'All 5 visualizer activities completed with 0 total points');
assert(progressManager.getCategoryScore('visualize') === 0, 'All 5 visualizer activities completed with 0 visualize score');

console.log('✓ Suite 1 Passed!\n');

// ---------------------------------------------------------------------------
// SUITE 2: VIDEO REWARDS PRESERVED (5 PTS EACH, 10 PTS TOTAL, DUPLICATE PROTECTION)
// ---------------------------------------------------------------------------
console.log('--- TEST SUITE 2: VIDEO REWARDS SYSTEM (10 PTS MAX) ---');

assert(VISUALIZE_ACTIVITIES.length === 2, 'VISUALIZE_ACTIVITIES contains exactly 2 video lessons');
assert(VISUALIZE_ACTIVITIES[0].id === 'lesson-01', 'Video 1 is lesson-01');
assert(VISUALIZE_ACTIVITIES[0].points === 5, 'Video 1 awards 5 points');
assert(VISUALIZE_ACTIVITIES[1].id === 'lesson-02', 'Video 2 is lesson-02');
assert(VISUALIZE_ACTIVITIES[1].points === 5, 'Video 2 awards 5 points');

// Complete Video 1 (lesson-01)
assert(!progressManager.isVideoCompleted('lesson-01'), 'Video 1 is initially incomplete');
const v1Success = progressManager.completeVideo('lesson-01');
assert(v1Success === true, 'Video 1 completeVideo call succeeded');
assert(progressManager.isVideoCompleted('lesson-01'), 'Video 1 is now marked completed');
assert(progressManager.getCategoryScore('visualize') === 5, 'Visualize score increased to exactly 5 points for Video 1');
assert(progressManager.getTotalPoints() === 5, 'Total points increased to exactly 5 points for Video 1');

// Duplicate call on Video 1
const v1Dup = progressManager.completeVideo('lesson-01');
assert(v1Dup === false, 'Duplicate call on Video 1 returns false');
assert(progressManager.getCategoryScore('visualize') === 5, 'Visualize score remained 5 (duplicate prevented)');
assert(progressManager.getTotalPoints() === 5, 'Total points remained 5 (duplicate prevented)');

// Complete Video 2 (lesson-02)
assert(!progressManager.isVideoCompleted('lesson-02'), 'Video 2 is initially incomplete');
const v2Success = progressManager.completeVideo('lesson-02');
assert(v2Success === true, 'Video 2 completeVideo call succeeded');
assert(progressManager.isVideoCompleted('lesson-02'), 'Video 2 is now marked completed');
assert(progressManager.getCategoryScore('visualize') === 10, 'Visualize score increased to exactly 10 points for completing both videos');
assert(progressManager.getTotalPoints() === 10, 'Total points increased to exactly 10 points for completing both videos');

// Duplicate call on Video 2
const v2Dup = progressManager.completeVideo('lesson-02');
assert(v2Dup === false, 'Duplicate call on Video 2 returns false');
assert(progressManager.getCategoryScore('visualize') === 10, 'Visualize score capped and preserved at exactly 10');
assert(progressManager.getTotalPoints() === 10, 'Total points preserved at exactly 10');

// Confirm video completion does not affect visualizer activities
for (const actId of visualizerActivityIds) {
  assert(progressManager.isCompleted(actId), `Visualizer ${actId} remains completed alongside videos`);
}

console.log('✓ Suite 2 Passed!\n');

// ---------------------------------------------------------------------------
// SUITE 3: NON-INTERFERENCE & ISOLATION
// ---------------------------------------------------------------------------
console.log('--- TEST SUITE 3: NON-INTERFERENCE & ISOLATION ---');

// Re-invoking completeInteractiveVisualizerActivity does not disturb video scores
for (const actId of visualizerActivityIds) {
  progressManager.completeInteractiveVisualizerActivity(actId);
}
assert(progressManager.getCategoryScore('visualize') === 10, 'Visualize score remains strictly 10 from videos');
assert(progressManager.getTotalPoints() === 10, 'Total points remains strictly 10 from videos');

console.log('✓ Suite 3 Passed!\n');

console.log('=====================================================');
console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED PERFECTLY!`);
console.log('=====================================================\n');
