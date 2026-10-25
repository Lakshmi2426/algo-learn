// Comprehensive Acceptance Tests for BFS Game Logic, Complete-Neighbour Enqueue Rule,
// Mistake Detection, Error Recovery, and Guided Solve

const path = require('path');
const assert = require('assert');

// Mock browser environment
global.window = global;
global.document = {
  documentElement: {
    getAttribute() { return null; }
  },
  body: {
    classList: { add() {}, remove() {}, contains() { return false; } }
  },
  getElementById(id) {
    return {
      id,
      textContent: '',
      innerHTML: '',
      style: {},
      classList: {
        add() {},
        remove() {},
        contains() { return false; }
      },
      setAttribute() {},
      appendChild() {},
      querySelectorAll() { return []; },
      addEventListener() {}
    };
  },
  createElementNS(ns, tag) {
    return {
      tagName: tag,
      style: {},
      setAttribute() {},
      appendChild() {},
      addEventListener() {},
      classList: { add() {}, remove() {} }
    };
  },
  createElement(tag) {
    return {
      tagName: tag,
      style: {},
      innerHTML: '',
      textContent: '',
      setAttribute() {},
      appendChild() {},
      addEventListener() {},
      classList: { add() {}, remove() {} }
    };
  },
  querySelectorAll() { return []; },
  addEventListener() {}
};

global.soundManager = {
  playPop() {},
  playSuccess() {},
  playError() {},
  playEnqueue() {},
  playDequeue() {}
};

global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

// Mock BFS scoring & levels data
global.BFS_SCORING = {
  game: { penalties: { hint: 3, guidedSolve: 3 } }
};

const { LEVELS_DATA } = require(path.join(__dirname, '../js/levels-data.js'));
global.LEVELS_DATA = LEVELS_DATA;
const { GraphEngine } = require(path.join(__dirname, '../js/graph-engine.js'));
global.GraphEngine = GraphEngine;
const { DragDropEngine } = require(path.join(__dirname, '../js/drag-drop.js'));
global.DragDropEngine = DragDropEngine;
const { GuidedSolveEngine } = require(path.join(__dirname, '../js/guided-solve.js'));
global.GuidedSolveEngine = GuidedSolveEngine;
const { GameEngine } = require(path.join(__dirname, '../js/game-engine.js'));
global.GameEngine = GameEngine;

let testsPassed = 0;
let totalTests = 0;

function testAssert(condition, desc) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL [Test ${totalTests}]: ${desc}`);
    process.exitCode = 1;
  } else {
    testsPassed++;
    console.log(`✓ PASS [Test ${totalTests}]: ${desc}`);
  }
}

console.log("=== RUNNING BFS GAME ENGINE ACCEPTANCE TESTS ===\n");

// Initialize GameEngine
const game = new GameEngine();
const mockSvg = global.document.createElementNS("http://www.w3.org/2000/svg", "svg");
const mockContainer = global.document.createElement("div");
game.init(mockSvg, mockContainer);

// ---------------------------------------------------------------------------
// Scenario 1: Correct BFS Traversal on Level 1 (A -> B, C; B -> D; C -> E)
// ---------------------------------------------------------------------------
console.log("\n--- Scenario 1: Correct Full BFS Traversal (Level 1) ---");
game.loadLevel(0); // Level 1

testAssert(game.currentLevelData.title === "Simple Tree Traversal", "Level 1 loaded");
testAssert(game.queue.length === 0 && game.currentExplorerNode === null, "Initial state: empty queue, null explorer");

// Step 1: Enqueue A
game.handleNodeEnqueueAttempt("A");
testAssert(game.queue.length === 1 && game.queue[0] === "A", "Step 1: Enqueue A -> Queue: [A]");

// Step 2: Dequeue A
game.handleDequeueExplore();
testAssert(game.currentExplorerNode === "A" && game.queue.length === 0, "Step 2: Dequeue A -> Current: A, Queue: []");

// Step 3: Enqueue B
game.handleNodeEnqueueAttempt("B");
testAssert(game.queue.length === 1 && game.queue[0] === "B", "Step 3: Enqueue B -> Queue: [B]");

// Step 4: Enqueue C
game.handleNodeEnqueueAttempt("C");
testAssert(game.queue.length === 2 && game.queue[0] === "B" && game.queue[1] === "C", "Step 4: Enqueue C -> Queue: [B, C]");

// Step 5: Dequeue B
game.handleDequeueExplore();
testAssert(game.currentExplorerNode === "B" && game.queue.length === 1 && game.queue[0] === "C", "Step 5: Dequeue B -> Current: B, Queue: [C]");

// Step 6: Enqueue D
game.handleNodeEnqueueAttempt("D");
testAssert(game.queue.length === 2 && game.queue[0] === "C" && game.queue[1] === "D", "Step 6: Enqueue D -> Queue: [C, D]");

// Step 7: Dequeue C
game.handleDequeueExplore();
testAssert(game.currentExplorerNode === "C" && game.queue.length === 1 && game.queue[0] === "D", "Step 7: Dequeue C -> Current: C, Queue: [D]");

// Step 8: Enqueue E
game.handleNodeEnqueueAttempt("E");
testAssert(game.queue.length === 2 && game.queue[0] === "D" && game.queue[1] === "E", "Step 8: Enqueue E -> Queue: [D, E]");

// Step 9: Dequeue D
game.handleDequeueExplore();
testAssert(game.currentExplorerNode === "D" && game.queue.length === 1 && game.queue[0] === "E", "Step 9: Dequeue D -> Current: D, Queue: [E]");

// Step 10: Dequeue E
game.handleDequeueExplore();
testAssert(game.currentExplorerNode === "E" && game.queue.length === 0, "Step 10: Dequeue E -> Current: E, Queue: []");

testAssert(game.isLevelCompleted === true, "Level 1 is completed successfully after all nodes processed");
testAssert(game.bfsOrder.join(",") === "A,B,C,D,E", "BFS traversal sequence is exactly A,B,C,D,E");

// ---------------------------------------------------------------------------
// Scenario 2: Detect Missing Neighbour when user tries to dequeue prematurely (Case A & B)
// ---------------------------------------------------------------------------
console.log("\n--- Scenario 2: Missing Neighbour Dequeue Block (Case A & B) ---");
game.loadLevel(0); // Reload Level 1
game.handleNodeEnqueueAttempt("A");
game.handleDequeueExplore(); // A is current explorer, neighbors are B and C
game.handleNodeEnqueueAttempt("B"); // Enqueued B, but C is NOT enqueued yet!

testAssert(game.queue.length === 1 && game.queue[0] === "B", "Queue contains only [B]");
testAssert(game.currentExplorerNode === "A", "Current explorer is A");

// User tries to dequeue B before enqueuing C!
const mistakesBefore = game.mistakesCount;
game.handleDequeueExplore(); // ATTEMPT PREMATURE DEQUEUE

testAssert(game.mistakesCount === mistakesBefore + 1, "Mistake recorded for premature dequeue");
testAssert(game.queue.length === 1 && game.queue[0] === "B", "Queue state preserved: [B] was NOT dequeued");
testAssert(game.currentExplorerNode === "A", "Explorer state preserved: current is still A");
testAssert(game.lastMistake !== null, "Structured mistake diagnosis generated");
testAssert(game.lastMistake.missingNeighbour === "C", "Diagnosis identified missing neighbour 'C'");
testAssert(game.lastMistake.whatWentWrong.includes("You dequeued B before completing the neighbour-enqueueing stage for A"), "Diagnosis explains exact whatWentWrong");
testAssert(game.lastMistake.expectedAction.includes("Enqueue C before dequeuing B"), "Diagnosis specifies expectedAction");

// ---------------------------------------------------------------------------
// Scenario 3: Error Recovery without Restart
// ---------------------------------------------------------------------------
console.log("\n--- Scenario 3: Error Recovery without Restart ---");
// User now corrects mistake and enqueues C
game.handleNodeEnqueueAttempt("C");
testAssert(game.queue.length === 2 && game.queue[0] === "B" && game.queue[1] === "C", "C successfully enqueued after error! Queue: [B, C]");
testAssert(game.lastMistake === null, "Error banner cleared after valid correction");

// Now dequeue B is permitted!
game.handleDequeueExplore();
testAssert(game.currentExplorerNode === "B" && game.queue.length === 1 && game.queue[0] === "C", "Dequeue B succeeds now that all neighbours of A were enqueued!");

// Complete the rest of the level
game.handleNodeEnqueueAttempt("D");
game.handleDequeueExplore(); // Dequeue C
game.handleNodeEnqueueAttempt("E");
game.handleDequeueExplore(); // Dequeue D
game.handleDequeueExplore(); // Dequeue E
testAssert(game.isLevelCompleted === true, "User successfully completed level after error recovery without restarting!");

// ---------------------------------------------------------------------------
// Scenario 4: Incorrect FIFO Operation (Case F)
// ---------------------------------------------------------------------------
console.log("\n--- Scenario 4: Incorrect FIFO Dequeue Order (Case F) ---");
game.loadLevel(0);
game.handleNodeEnqueueAttempt("A");
game.handleDequeueExplore();
game.handleNodeEnqueueAttempt("B");
game.handleNodeEnqueueAttempt("C");
// Queue is [B, C]. Front is B.
testAssert(game.queue[0] === "B" && game.queue[1] === "C", "Queue is [B, C]");

// User attempts to dequeue C directly (violating FIFO)
const fifoMistakesBefore = game.mistakesCount;
game.handleInvalidDequeueAttempt("C");
testAssert(game.mistakesCount === fifoMistakesBefore + 1, "Mistake recorded for non-front dequeue attempt");
testAssert(game.lastMistake.errorType === "FIFO Rule Violation", "Error type is FIFO Rule Violation");
testAssert(game.lastMistake.whatWentWrong.includes("B' is waiting at the front"), "Explains B is at the front");
testAssert(game.queue[0] === "B" && game.queue[1] === "C", "Queue is unchanged: [B, C]");

// ---------------------------------------------------------------------------
// Scenario 5: Duplicate Enqueue (Case E)
// ---------------------------------------------------------------------------
console.log("\n--- Scenario 5: Duplicate Enqueue Guard (Case E) ---");
// Queue has B and C. Attempt to enqueue B again!
const dupMistakesBefore = game.mistakesCount;
game.handleNodeEnqueueAttempt("B");
testAssert(game.mistakesCount === dupMistakesBefore + 1, "Mistake recorded for duplicate enqueue of B");
testAssert(game.lastMistake.errorType === "Visited Set Guard Active", "Error type is Visited Set Guard Active");
testAssert(game.queue.length === 2, "Queue length not altered by duplicate enqueue");

// ---------------------------------------------------------------------------
// Scenario 6: Enqueue Non-Neighbour (Case D)
// ---------------------------------------------------------------------------
console.log("\n--- Scenario 6: Non-Neighbour Enqueue Guard (Case D) ---");
// Current explorer is A. D is not connected to A.
const nonNeighbourMistakesBefore = game.mistakesCount;
game.handleNodeEnqueueAttempt("D");
testAssert(game.mistakesCount === nonNeighbourMistakesBefore + 1, "Mistake recorded for enqueuing non-neighbour D");
testAssert(game.lastMistake.errorType === "Not an Eligible Neighbour", "Error type is Not an Eligible Neighbour");
testAssert(game.lastMistake.explanation.includes("D' is not an eligible neighbour of 'A"), "Identifies non-neighbour relationship");

// ---------------------------------------------------------------------------
// Scenario 7: Enqueue Neighbours in Wrong Order (Case C)
// ---------------------------------------------------------------------------
console.log("\n--- Scenario 7: Wrong Neighbour Order Guard (Case C) ---");
game.loadLevel(0);
game.handleNodeEnqueueAttempt("A");
game.handleDequeueExplore();
// A's neighbours in defined order are B then C. Attempt to enqueue C first!
const orderMistakesBefore = game.mistakesCount;
game.handleNodeEnqueueAttempt("C");
testAssert(game.mistakesCount === orderMistakesBefore + 1, "Mistake recorded for enqueuing C before B");
testAssert(game.lastMistake.errorType === "Incorrect Neighbour Order", "Error type is Incorrect Neighbour Order");
testAssert(game.lastMistake.whatWentWrong.includes("You enqueued 'C' before 'B'"), "Explains C was enqueued before B");

// ---------------------------------------------------------------------------
// Scenario 8: Guided Solve Recovery
// ---------------------------------------------------------------------------
console.log("\n--- Scenario 8: Guided Solve Dynamic Assistance ---");
game.loadLevel(0);
game.handleNodeEnqueueAttempt("A");
game.handleDequeueExplore(); // A exploring
game.handleNodeEnqueueAttempt("B"); // B in queue, C missing

// User asks Guided Solve for next action
const nextAction = game.guidedEngine.getNextActionDescription();
testAssert(nextAction.actionType === "enqueue_neighbor", "Guided Solve identifies enqueue_neighbor action");
testAssert(nextAction.targetNode === "C", "Guided Solve identifies target node C");
testAssert(nextAction.explanation.includes("B is already in the queue, so enqueue 'C' next"), "Guided Solve provides dynamic explanation with graph context");

// Perform step via guided solve
game.guidedEngine.performSingleStep();
testAssert(game.queue.includes("C"), "Guided Solve successfully enqueued C");

// Now Guided Solve next action is to dequeue B
const dequeueAction = game.guidedEngine.getNextActionDescription();
testAssert(dequeueAction.actionType === "dequeue", "Guided Solve now recommends dequeue");
testAssert(dequeueAction.targetNode === "B", "Guided Solve recommends dequeuing front node B");

// ---------------------------------------------------------------------------
// Scenario 9: Different Graph Topologies (Level 2: Binary Tree)
// ---------------------------------------------------------------------------
console.log("\n--- Scenario 9: Multi-Level Graph Topologies (Level 2) ---");
game.loadLevel(1); // Binary Tree (A -> B, C; B -> D, E; C -> F, G)
testAssert(game.currentLevelData.title === "Binary Tree Exploration", "Level 2 loaded");

game.handleNodeEnqueueAttempt("A");
game.handleDequeueExplore(); // A explorer
game.handleNodeEnqueueAttempt("B"); // B enqueued

// Try to dequeue B before enqueuing C:
game.handleDequeueExplore();
testAssert(game.lastMistake.missingNeighbour === "C", "Level 2: Successfully detected missing neighbour C of A");
testAssert(game.currentExplorerNode === "A", "Level 2: Preserved current explorer A");

// Enqueue C
game.handleNodeEnqueueAttempt("C");
game.handleDequeueExplore(); // Now B is explorer!
testAssert(game.currentExplorerNode === "B", "Level 2: Dequeued B to explorer");

// B's neighbours are D and E. Try to dequeue C before enqueuing D and E:
game.handleDequeueExplore();
testAssert(game.lastMistake.missingNeighbour.includes("D"), "Level 2: Blocked dequeue C before B's children D, E enqueued");
testAssert(game.currentExplorerNode === "B", "Level 2: Preserved explorer B");

// Enqueue D and E
game.handleNodeEnqueueAttempt("D");
game.handleNodeEnqueueAttempt("E");
testAssert(game.queue.join(",") === "C,D,E", "Level 2: Queue is now [C, D, E]");

// Dequeue C
game.handleDequeueExplore();
testAssert(game.currentExplorerNode === "C", "Level 2: Dequeued C to explorer");

// Enqueue F and G
game.handleNodeEnqueueAttempt("F");
game.handleNodeEnqueueAttempt("G");
testAssert(game.queue.join(",") === "D,E,F,G", "Level 2: Queue is now [D, E, F, G]");

// Dequeue remaining in FIFO order: D, E, F, G
game.handleDequeueExplore(); // D
game.handleDequeueExplore(); // E
game.handleDequeueExplore(); // F
game.handleDequeueExplore(); // G
testAssert(game.isLevelCompleted === true, "Level 2 Binary Tree completed successfully with strict BFS rules!");

// ---------------------------------------------------------------------------
// Scenario 10: Replay Completed Level Scoring
// ---------------------------------------------------------------------------
console.log("\n--- Scenario 10: Completed Level Replay Scoring ---");
const scoreBeforeReplay = game.score;
game.loadLevel(0); // Replay Level 1 (already completed earlier)
testAssert(game.completedLevels.has(1), "Level 1 is in completedLevels set");

game.handleNodeEnqueueAttempt("A");
game.handleDequeueExplore();
game.handleNodeEnqueueAttempt("B");
game.handleNodeEnqueueAttempt("C");
game.handleDequeueExplore();
game.handleNodeEnqueueAttempt("D");
game.handleDequeueExplore();
game.handleNodeEnqueueAttempt("E");
game.handleDequeueExplore();
game.handleDequeueExplore();
testAssert(game.isLevelCompleted === true, "Replayed level completes");

console.log(`\n========================================`);
console.log(`RESULTS: ${testsPassed} / ${totalTests} TESTS PASSED`);
console.log(`========================================\n`);

if (testsPassed === totalTests) {
  console.log("🎉 ALL BFS GAME ACCEPTANCE TESTS PASSED SUCCESSFULLY!");
} else {
  process.exitCode = 1;
}
