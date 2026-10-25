import { SLL_TASKS } from '../data/sllTasks';
import {
  getNextUncompletedStepNumber,
  isStepSatisfied,
  executeSingleTeacherStep,
  getTaskStep,
  getAllTaskSteps,
  getTaskTotalSteps,
  getInsertionNewNodeSpec,
} from '../utils/sllStepAssistant';
import { validateTaskAnswer } from '../utils/sllValidator';
import type { SLLNode, SLLPointerState } from '../types/sllGame';

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
console.log('🧪 RUNNING COMPREHENSIVE SLL INSERT POSITION TEST SUITE');
console.log('=====================================================\n');

const taskL4T1 = SLL_TASKS.L4_T1;
assert(!!taskL4T1, 'L4_T1 task definition found in SLL_TASKS');
assert(taskL4T1.targetCondition?.customValidator === 'L4_T1_INSERT_ANY', 'L4_T1 has L4_T1_INSERT_ANY custom validator');

// ---------------------------------------------------------------------------
// SUITE 1: SPEC GENERATION FOR ALL POSITIONS (POS 1 TO 6)
// ---------------------------------------------------------------------------
console.log('\n--- TEST SUITE 1: SPEC GENERATION (POS 1 TO 6) ---');

const expectedSpecs = [
  { pos: 1, data: 5, address: 1006 },
  { pos: 2, data: 15, address: 1006 },
  { pos: 3, data: 25, address: 1006 },
  { pos: 4, data: 35, address: 1006 },
  { pos: 5, data: 45, address: 1006 },
  { pos: 6, data: 60, address: 1006 },
];

for (const exp of expectedSpecs) {
  const spec = getInsertionNewNodeSpec([], undefined, exp.pos);
  assert(spec.data === exp.data, `Pos ${exp.pos} has expected data ${exp.data} (got ${spec.data})`);
  assert(spec.address === exp.address, `Pos ${exp.pos} has expected address ${exp.address} (got ${spec.address})`);
}

// ---------------------------------------------------------------------------
// SUITE 2: GUIDED SOLVE 5-STEP EXECUTION FOR EACH POSITION (1 to 6)
// ---------------------------------------------------------------------------
console.log('\n--- TEST SUITE 2: GUIDED SOLVE STEP-BY-STEP (POS 1 to 6) ---');

for (let pos = 1; pos <= 6; pos++) {
  console.log(`\nTesting Guided Solve execution for Position ${pos}...`);
  const initialNodes: SLLNode[] = JSON.parse(JSON.stringify(taskL4T1.initialNodes));
  const initialPointers: SLLPointerState = JSON.parse(JSON.stringify(taskL4T1.initialPointers));
  
  const totalSteps = getTaskTotalSteps(taskL4T1, initialNodes, initialPointers, pos);
  assert(totalSteps === 5, `Pos ${pos} has exactly 5 steps`);

  const steps = getAllTaskSteps(taskL4T1, initialNodes, initialPointers, pos);
  assert(steps.length === 5, `getAllTaskSteps returns 5 steps for Pos ${pos}`);

  // Test state detection at the very beginning
  const initialStepToRun = getNextUncompletedStepNumber(taskL4T1, initialNodes, initialPointers, [], false, pos);
  assert(initialStepToRun === 1, `Pos ${pos} at start detects step 1 (got ${initialStepToRun})`);

  let currentNodes: SLLNode[] = JSON.parse(JSON.stringify(initialNodes));
  let currentPointers: SLLPointerState = JSON.parse(JSON.stringify(initialPointers));
  let traversalOutput: number[] = [];

  for (let s = 1; s <= 5; s++) {
    const stepDef = getTaskStep(taskL4T1, s, currentNodes, currentPointers, pos);
    assert(!!stepDef, `Pos ${pos} Step ${s} definition exists`);
    assert(!!stepDef?.what && !!stepDef?.why, `Pos ${pos} Step ${s} has WHAT and WHY explanations`);

    const result = executeSingleTeacherStep(stepDef!, {
      nodes: currentNodes,
      pointers: currentPointers,
      traversalOutput,
    });
    assert(!!result.feedbackMessage, `Pos ${pos} Step ${s} produced feedback: "${result.feedbackMessage}"`);

    currentNodes = result.nodes;
    currentPointers = result.pointers;
    traversalOutput = result.traversalOutput;

    if (stepDef!.actionType !== 'select_node' && stepDef!.actionType !== 'highlight_target') {
      const satisfiedAfter = isStepSatisfied(stepDef!, currentNodes, currentPointers, traversalOutput, false);
      assert(satisfiedAfter, `Pos ${pos} Step ${s} satisfied after execution`);
    }
  }

  // After 5 steps, all steps should be complete
  const nextStepAfterAll = getNextUncompletedStepNumber(taskL4T1, currentNodes, currentPointers, traversalOutput, false, pos);
  assert(nextStepAfterAll > 5, `Pos ${pos} finished all 5 steps (got ${nextStepAfterAll} > 5)`);

  // Validate workspace with customPosition
  const validationWithPos = validateTaskAnswer(taskL4T1, currentNodes, currentPointers, traversalOutput, true, pos);
  assert(validationWithPos.isValid, `Pos ${pos} validation with explicit position passed: ${validationWithPos.feedback?.message}`);

  // Validate workspace with auto-detection (no customPosition passed)
  const validationAuto = validateTaskAnswer(taskL4T1, currentNodes, currentPointers, traversalOutput, true);
  assert(validationAuto.isValid, `Pos ${pos} validation with auto-detection passed: ${validationAuto.feedback?.message}`);
}

// ---------------------------------------------------------------------------
// SUITE 3: POINTER INTEGRITY VERIFICATION FOR KEY POSITIONS
// ---------------------------------------------------------------------------
console.log('\n--- TEST SUITE 3: POINTER INTEGRITY ---');

// Pos 1: Beginning
{
  let nodes: SLLNode[] = JSON.parse(JSON.stringify(taskL4T1.initialNodes));
  let pointers: SLLPointerState = JSON.parse(JSON.stringify(taskL4T1.initialPointers));
  for (let s = 1; s <= 5; s++) {
    const step = getTaskStep(taskL4T1, s, nodes, pointers, 1)!;
    const res = executeSingleTeacherStep(step, { nodes, pointers, traversalOutput: [] });
    nodes = res.nodes;
    pointers = res.pointers;
  }
  assert(pointers.headAddress === 1006, 'Pos 1: HEAD points to newNode (1006)');
  assert(pointers.tailAddress === 1005, 'Pos 1: TAIL points to original last node (1005)');
  const newNode = nodes.find((n) => n.address === 1006)!;
  assert(newNode.data === 5, 'Pos 1: newNode data is 5');
  assert(newNode.nextAddress === 1001, 'Pos 1: newNode->next points to previous head 1001');
}

// Pos 3: Middle
{
  let nodes: SLLNode[] = JSON.parse(JSON.stringify(taskL4T1.initialNodes));
  let pointers: SLLPointerState = JSON.parse(JSON.stringify(taskL4T1.initialPointers));
  for (let s = 1; s <= 5; s++) {
    const step = getTaskStep(taskL4T1, s, nodes, pointers, 3)!;
    const res = executeSingleTeacherStep(step, { nodes, pointers, traversalOutput: [] });
    nodes = res.nodes;
    pointers = res.pointers;
  }
  assert(pointers.headAddress === 1001, 'Pos 3: HEAD remains 1001');
  assert(pointers.tailAddress === 1005, 'Pos 3: TAIL remains 1005');
  const node20 = nodes.find((n) => n.address === 1002)!;
  const node25 = nodes.find((n) => n.address === 1006)!;
  assert(node20.nextAddress === 1006, 'Pos 3: node20 points to node25');
  assert(node25.nextAddress === 1003, 'Pos 3: node25 points to node30');
}

// Pos 6: End
{
  let nodes: SLLNode[] = JSON.parse(JSON.stringify(taskL4T1.initialNodes));
  let pointers: SLLPointerState = JSON.parse(JSON.stringify(taskL4T1.initialPointers));
  for (let s = 1; s <= 5; s++) {
    const step = getTaskStep(taskL4T1, s, nodes, pointers, 6)!;
    const res = executeSingleTeacherStep(step, { nodes, pointers, traversalOutput: [] });
    nodes = res.nodes;
    pointers = res.pointers;
  }
  assert(pointers.headAddress === 1001, 'Pos 6: HEAD remains 1001');
  assert(pointers.tailAddress === 1006, 'Pos 6: TAIL points to newNode (1006)');
  const node50 = nodes.find((n) => n.address === 1005)!;
  const node60 = nodes.find((n) => n.address === 1006)!;
  assert(node50.nextAddress === 1006, 'Pos 6: node50 points to node60');
  assert(node60.nextAddress === null, 'Pos 6: node60 points to NULL');
}

// ---------------------------------------------------------------------------
// SUITE 4: VALIDATION EDGE CASES AND FAILURE MODES
// ---------------------------------------------------------------------------
console.log('\n--- TEST SUITE 4: VALIDATION EDGE CASES & INTEGRITY ---');

// 1. Initial workspace should NOT pass (needs 6 nodes, has 5)
const initialCheck = validateTaskAnswer(taskL4T1, taskL4T1.initialNodes, taskL4T1.initialPointers, [], true, 3);
assert(!initialCheck.isValid, 'Initial workspace fails validation (not inserted yet)');

// 2. Orphaned node in workspace (node created but not linked)
{
  const wsWithOrphan: SLLNode[] = JSON.parse(JSON.stringify(taskL4T1.initialNodes));
  wsWithOrphan.push({
    id: 'node-orphan',
    data: 25,
    address: 1006,
    nextAddress: null,
  });
  const orphanCheck = validateTaskAnswer(taskL4T1, wsWithOrphan, taskL4T1.initialPointers, [], true, 3);
  assert(!orphanCheck.isValid, 'Orphaned/unreachable node fails validation');
}

// 3. Cycle created
{
  let nodes: SLLNode[] = JSON.parse(JSON.stringify(taskL4T1.initialNodes));
  let pointers: SLLPointerState = JSON.parse(JSON.stringify(taskL4T1.initialPointers));
  for (let s = 1; s <= 5; s++) {
    const step = getTaskStep(taskL4T1, s, nodes, pointers, 3)!;
    const res = executeSingleTeacherStep(step, { nodes, pointers, traversalOutput: [] });
    nodes = res.nodes;
    pointers = res.pointers;
  }
  // Make node 50 point back to node 20
  const n50 = nodes.find((n) => n.address === 1005)!;
  n50.nextAddress = 1002;
  const cycleCheck = validateTaskAnswer(taskL4T1, nodes, pointers, [], true, 3);
  assert(!cycleCheck.isValid, 'Cycle in linked list fails validation');
}

// 4. Incorrect HEAD pointer
{
  let nodes: SLLNode[] = JSON.parse(JSON.stringify(taskL4T1.initialNodes));
  let pointers: SLLPointerState = JSON.parse(JSON.stringify(taskL4T1.initialPointers));
  for (let s = 1; s <= 5; s++) {
    const step = getTaskStep(taskL4T1, s, nodes, pointers, 1)!;
    const res = executeSingleTeacherStep(step, { nodes, pointers, traversalOutput: [] });
    nodes = res.nodes;
    pointers = res.pointers;
  }
  // In pos 1, HEAD should be 1006. If left at 1001, it fails:
  pointers.headAddress = 1001;
  const headCheck = validateTaskAnswer(taskL4T1, nodes, pointers, [], true, 1);
  assert(!headCheck.isValid, 'Pos 1: HEAD not pointing to new node fails validation');
}

// 5. Incorrect TAIL pointer
{
  let nodes: SLLNode[] = JSON.parse(JSON.stringify(taskL4T1.initialNodes));
  let pointers: SLLPointerState = JSON.parse(JSON.stringify(taskL4T1.initialPointers));
  for (let s = 1; s <= 5; s++) {
    const step = getTaskStep(taskL4T1, s, nodes, pointers, 6)!;
    const res = executeSingleTeacherStep(step, { nodes, pointers, traversalOutput: [] });
    nodes = res.nodes;
    pointers = res.pointers;
  }
  // In pos 6, TAIL should be 1006. If left at 1005, it fails:
  pointers.tailAddress = 1005;
  const tailCheck = validateTaskAnswer(taskL4T1, nodes, pointers, [], true, 6);
  assert(!tailCheck.isValid, 'Pos 6: TAIL not pointing to new node fails validation');
}

// 6. Node inserted at wrong position (e.g. inserted at Pos 2 instead of Pos 3)
{
  let nodes: SLLNode[] = JSON.parse(JSON.stringify(taskL4T1.initialNodes));
  let pointers: SLLPointerState = JSON.parse(JSON.stringify(taskL4T1.initialPointers));
  for (let s = 1; s <= 5; s++) {
    // Generate insertion at Pos 2
    const step = getTaskStep(taskL4T1, s, nodes, pointers, 2)!;
    const res = executeSingleTeacherStep(step, { nodes, pointers, traversalOutput: [] });
    nodes = res.nodes;
    pointers = res.pointers;
  }
  // Validate against Pos 3 - should fail because node is at pos 2, not pos 3
  const wrongPosCheck = validateTaskAnswer(taskL4T1, nodes, pointers, [], true, 3);
  assert(!wrongPosCheck.isValid, 'Node inserted at wrong position fails validation');
}

console.log('\n=====================================================');
console.log(`🎉 ALL ${passedTests}/${totalTests} INSERTION AT ANY POSITION TESTS PASSED!`);
console.log('=====================================================\n');
