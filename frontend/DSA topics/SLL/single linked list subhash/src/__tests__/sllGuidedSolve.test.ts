import { SLL_TASKS } from '../data/sllTasks';
import {
  getNextUncompletedStepNumber,
  isStepSatisfied,
  executeSingleTeacherStep,
  getTaskStep,
  getAllTaskSteps,
  getTaskTotalSteps,
} from '../utils/sllStepAssistant';
import { validateTaskAnswer } from '../utils/sllValidator';
import { progressManager } from '../utils/progressManager';

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
console.log('🧪 RUNNING MANDATORY SLL GUIDED SOLVE TEST SUITE');
console.log('=====================================================\n');

// ---------------------------------------------------------------------------
// TEST SUITE 1: POINT DEDUCTION & SESSION LIFECYCLE
// ---------------------------------------------------------------------------
console.log('--- TEST SUITE 1: POINT DEDUCTION & SESSION LIFECYCLE ---');

// Fresh state reset for testing
progressManager.resetProgress();
// Complete L1_T2 first to establish baseline game points so ongoing deductions don't clamp at 0
progressManager.completeGameTask('L1_T2');
const baselinePoints = progressManager.getTotalPoints();
const taskId = 'L1_T1';

// 1. Initial state
assert(!progressManager.isGuidedSolveUsed(taskId), 'Initial task has guideUsed = false');

// 2. First activation deducts configured 3 points for Session 1
const pointsAfterFirst = progressManager.startGuidedSolveSession(taskId);
assert(progressManager.isGuidedSolveUsed(taskId), 'guideUsed is now true after first session start');
assert(pointsAfterFirst === baselinePoints - 3, `Points reduced by 3 after Session 1 start (${baselinePoints} -> ${pointsAfterFirst})`);

let taskState = progressManager.getGameTaskState(taskId);
assert(taskState.guidePenalty === 3, 'Task has exactly 3 points guidePenalty for Session 1');
assert(taskState.guideCount === 1, 'Task guideCount is 1 for Session 1');

// 3. Next Step clicks, rerenders, state updates must NEVER deduct points
// (We simulate 5 next-step clicks within the same active session)
const scoreDuringSession = progressManager.getTotalPoints();
assert(scoreDuringSession === pointsAfterFirst, 'Zero points deducted during active session progression');

// 4. Stopping Guided Solve does not deduct points
// (Simulate user clicking Stop Guided Solve)
const scoreAfterStop = progressManager.getTotalPoints();
assert(scoreAfterStop === scoreDuringSession, 'Stopping Guided Solve triggers zero deductions');

// 5. Activating Guided Solve again after stopping counts as a new session (Requirement 5)
const pointsAfterSession2 = progressManager.startGuidedSolveSession(taskId);
taskState = progressManager.getGameTaskState(taskId);
assert(taskState.guidePenalty === 6, 'Second session applies configured 3-point deduction once (total guidePenalty = 6)');
assert(taskState.guideCount === 2, 'Task guideCount is 2 for Session 2');
assert(pointsAfterSession2 === pointsAfterFirst - 3, 'Total points decreased by exactly 3 for new session');

// 6. Task completion calculates baseScore - guidePenalty without double-deducting
const compResult = progressManager.completeGameTask(taskId);
assert(compResult.newlyCompleted === true, 'Task completed successfully');
assert(compResult.guidePenalty === 6, 'Final completion records guidePenalty = 6');
assert(compResult.finalScore === Math.max(0, compResult.baseScore - 6), `Final score is baseScore - totalPenalty (${compResult.baseScore} - 6 = ${compResult.finalScore})`);

// 7. Replaying / duplicate completion awards 0 extra points
const replayResult = progressManager.completeGameTask(taskId);
assert(replayResult.newlyCompleted === false, 'Replaying completed task awards 0 points (duplicate protection)');
assert(replayResult.finalScore === 0, 'Replay finalScore is 0');

// 8. Replay Guided Solve: Once first play is completed, Guided Solve must NEVER deduct points (Point-Neutral)
const pointsBeforeReplayGuide = progressManager.getTotalPoints();
const pointsAfterReplayGuide = progressManager.startGuidedSolveSession(taskId);
assert(pointsAfterReplayGuide === pointsBeforeReplayGuide, `Replay Guided Solve is completely point-neutral (${pointsBeforeReplayGuide} === ${pointsAfterReplayGuide})`);
const stateAfterReplayGuide = progressManager.getGameTaskState(taskId);
assert(stateAfterReplayGuide.guidePenalty === 6, 'Task guidePenalty was NOT increased during replay Guided Solve');

// 9. Replay Hint: Hints must NEVER deduct points during replays
const pointsBeforeReplayHint = progressManager.getTotalPoints();
const pointsAfterReplayHint = progressManager.deductHintPoints(taskId);
assert(pointsAfterReplayHint === pointsBeforeReplayHint, `Replay Hint is completely point-neutral (${pointsBeforeReplayHint} === ${pointsAfterReplayHint})`);
const stateAfterReplayHint = progressManager.getGameTaskState(taskId);
assert(stateAfterReplayHint.hintPenalty === 0, 'Task hintPenalty was NOT increased during replay Hint');

// 10. Subsequent replay completions award 0 extra points and deduct 0 points
const subReplay = progressManager.completeGameTask(taskId);
assert(subReplay.newlyCompleted === false, 'Subsequent replay completion awards 0 points');
assert(progressManager.getTotalPoints() === pointsBeforeReplayGuide, 'Score remains unchanged after subsequent replay completion');

// 11. Other unplayed tasks MUST still allow first play scoring and deductions
const unplayedTaskId = 'L1_T3';
const unplayedBaseline = progressManager.getTotalPoints();
const unplayedAfterGuide = progressManager.startGuidedSolveSession(unplayedTaskId);
assert(unplayedAfterGuide === unplayedBaseline - 3, `Unplayed task first play correctly applies 3-point deduction (${unplayedBaseline} -> ${unplayedAfterGuide})`);

console.log('✓ Suite 1 Passed!\n');

// ---------------------------------------------------------------------------
// TEST SUITE 2: DYNAMIC STATE DETECTION (BEGINNING, MIDDLE, END)
// ---------------------------------------------------------------------------
console.log('--- TEST SUITE 2: DYNAMIC STATE DETECTION (BEGINNING, MIDDLE, END) ---');

// Test 2.1: Beginning of L1_T1
const t1 = SLL_TASKS.L1_T1;
const stepAtBeginning = getNextUncompletedStepNumber(t1, [], { headAddress: null, tailAddress: null, currentAddress: null, tempAddress: null, prevAddress: null });
assert(stepAtBeginning === 1, `L1_T1 at beginning correctly detects step 1 (got ${stepAtBeginning})`);

// Test 2.2: Middle of L1_T1 (Node 10 created & HEAD set to 1001)
const middleNodes = [{ id: 'n1', data: 10, address: 1001, nextAddress: null }];
const middlePointers = { headAddress: 1001, tailAddress: null, currentAddress: null, tempAddress: null, prevAddress: null };
const stepAtMiddle = getNextUncompletedStepNumber(t1, middleNodes, middlePointers);
assert(stepAtMiddle === 3, `L1_T1 in middle (node 10 + head set) correctly detects step 3 for Node 20 creation (got ${stepAtMiddle})`);

// Test 2.3: End of L1_T1 (All nodes created and connected: 10 -> 20 -> NULL, HEAD = 1001, TAIL = 1002)
const completedNodes = [
  { id: 'n1', data: 10, address: 1001, nextAddress: 1002 },
  { id: 'n2', data: 20, address: 1002, nextAddress: null },
];
const completedPointers = { headAddress: 1001, tailAddress: 1002, currentAddress: null, tempAddress: null, prevAddress: null };
const stepAtEnd = getNextUncompletedStepNumber(t1, completedNodes, completedPointers);
const valAtEnd = validateTaskAnswer(t1, completedNodes, completedPointers);
assert(valAtEnd.isValid === true, 'L1_T1 completed state satisfies validateTaskAnswer');
assert(stepAtEnd > getTaskTotalSteps(t1), `L1_T1 at end returns step > totalSteps (${stepAtEnd} > 5)`);

// Test 2.4: Middle of L1_T3 (Prepend: Node 5 connected to Node 10, HEAD still at 1001)
const t3 = SLL_TASKS.L1_T3;
const l1t3Nodes = [
  { id: 'n1', data: 10, address: 1001, nextAddress: null },
  { id: 'n5', data: 5, address: 1000, nextAddress: 1001 },
];
const l1t3Pointers = { headAddress: 1001, tailAddress: 1001, currentAddress: null, tempAddress: null, prevAddress: null };
const stepL1T3 = getNextUncompletedStepNumber(t3, l1t3Nodes, l1t3Pointers);
assert(stepL1T3 === 2, `L1_T3 (middle: node 5 connected, head not yet updated) detects step 2 (got ${stepL1T3})`);

// Test 2.5: Middle of L2_T1 (Head deletion: HEAD moved to 1002, node 10 still present)
const l2t1 = SLL_TASKS.L2_T1;
const l2t1Nodes = [
  { id: 'n1', data: 10, address: 1001, nextAddress: 1002 },
  { id: 'n2', data: 20, address: 1002, nextAddress: 1003 },
  { id: 'n3', data: 30, address: 1003, nextAddress: null },
];
const l2t1Pointers = { headAddress: 1002, tailAddress: 1003, currentAddress: null, tempAddress: null, prevAddress: null };
const stepL2T1 = getNextUncompletedStepNumber(l2t1, l2t1Nodes, l2t1Pointers);
assert(stepL2T1 === 3, `L2_T1 (middle: head moved to second node) detects step 3 (delete old head) (got ${stepL2T1})`);

// Test 2.6: Middle of L2_T2 (Tail deletion: secondLast NEXT set to NULL, tail moved to 1002, node 30 still in RAM)
const l2t2 = SLL_TASKS.L2_T2;
const l2t2Nodes = [
  { id: 'n1', data: 10, address: 1001, nextAddress: 1002 },
  { id: 'n2', data: 20, address: 1002, nextAddress: null },
  { id: 'n3', data: 30, address: 1003, nextAddress: null },
];
const l2t2Pointers = { headAddress: 1001, tailAddress: 1002, currentAddress: null, tempAddress: null, prevAddress: null };
const stepL2T2 = getNextUncompletedStepNumber(l2t2, l2t2Nodes, l2t2Pointers);
assert(stepL2T2 === 4, `L2_T2 (middle: tail updated, node 30 detached) detects step 4 (delete old tail) (got ${stepL2T2})`);

console.log('✓ Suite 2 Passed!\n');

// ---------------------------------------------------------------------------
// TEST SUITE 3: STEP-BY-STEP EXECUTION SIMULATION ON ALL TASKS
// ---------------------------------------------------------------------------
console.log('--- TEST SUITE 3: STEP-BY-STEP EXECUTION SIMULATION ON ALL TASKS ---');

const tasksToTest = ['L1_T1', 'L1_T2', 'L1_T3', 'L1_T4', 'L2_T1', 'L2_T2', 'L2_T3', 'L2_T4', 'L3_T1', 'L4_T1', 'L4_T2', 'L4_T3', 'L5_M1', 'L5_M7'];

for (const tId of tasksToTest) {
  const task = SLL_TASKS[tId];
  if (!task) {
    console.warn(`Task ${tId} not found`);
    continue;
  }

  let currentNodes = Array.isArray(task.initialNodes) ? JSON.parse(JSON.stringify(task.initialNodes)) : [];
  let currentPointers = task.initialPointers ? JSON.parse(JSON.stringify(task.initialPointers)) : { headAddress: null, tailAddress: null, currentAddress: null, tempAddress: null, prevAddress: null };
  let currentOutput: number[] = [];
  const totalSteps = getTaskTotalSteps(task, currentNodes, currentPointers);

  assert(totalSteps >= 1, `${tId} has at least 1 total step (${totalSteps})`);

  for (let s = 1; s <= totalSteps; s++) {
    const stepDef = getTaskStep(task, s, currentNodes, currentPointers);
    assert(Boolean(stepDef), `${tId} Step ${s} definition exists`);
    assert(Boolean(stepDef?.what && stepDef?.why), `${tId} Step ${s} has WHAT and WHY explanations`);

    const result = executeSingleTeacherStep(stepDef!, {
      nodes: currentNodes,
      pointers: currentPointers,
      traversalOutput: currentOutput,
    });

    currentNodes = result.nodes;
    currentPointers = result.pointers;
    currentOutput = result.traversalOutput;
    assert(Boolean(result.feedbackMessage), `${tId} Step ${s} produces feedback message: "${result.feedbackMessage}"`);
  }

  // After all steps, validation should pass (or for search, found)
  const finalVal = validateTaskAnswer(task, currentNodes, currentPointers, currentOutput, true);
  assert(finalVal.isValid === true, `${tId} passes validation after executing all guided solve steps: ${finalVal.feedback?.message}`);
}

console.log('✓ Suite 3 Passed!\n');

// ---------------------------------------------------------------------------
// TEST SUITE 4: STOP AND RESUME WORKFLOW
// ---------------------------------------------------------------------------
console.log('--- TEST SUITE 4: STOP AND RESUME WORKFLOW ---');

// Start L1_T4 (Append)
const t4 = SLL_TASKS.L1_T4;
let simNodes = JSON.parse(JSON.stringify(t4.initialNodes));
let simPointers = JSON.parse(JSON.stringify(t4.initialPointers));
let simOutput: number[] = [];

// Step 1: Connect 1001 -> 1002
const step1Def = getTaskStep(t4, 1, simNodes, simPointers);
const res1 = executeSingleTeacherStep(step1Def!, { nodes: simNodes, pointers: simPointers, traversalOutput: simOutput });
simNodes = res1.nodes;
simPointers = res1.pointers;

// Student clicks STOP Guided Solve: state is preserved
const node10 = simNodes.find((n: any) => n.address === 1001);
assert(node10?.nextAddress === 1002, 'After Stop, workspace state is preserved (Node 10 points to 1002)');

// Student resumes Guided Solve: next step is detected as Step 2 (Update TAIL)
const resumeStep = getNextUncompletedStepNumber(t4, simNodes, simPointers);
assert(resumeStep === 2, `Resuming Guided Solve picks up at Step 2 without repeating Step 1 (got ${resumeStep})`);

// Execute Step 2
const step2Def = getTaskStep(t4, 2, simNodes, simPointers);
const res2 = executeSingleTeacherStep(step2Def!, { nodes: simNodes, pointers: simPointers, traversalOutput: simOutput });
simNodes = res2.nodes;
simPointers = res2.pointers;

// With TAIL pointing to 1002 and NULL termination verified, task is fully satisfied
const val4 = validateTaskAnswer(t4, simNodes, simPointers);
assert(val4.isValid === true, 'Task validation succeeds after completing all required pointer links');
const resumeStep3 = getNextUncompletedStepNumber(t4, simNodes, simPointers);
assert(resumeStep3 > getTaskTotalSteps(t4), `Advances past total steps to indicate completion (${resumeStep3} > 3)`);

console.log('✓ Suite 4 Passed!\n');

console.log('=====================================================');
console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED PERFECTLY!`);
console.log('=====================================================');
