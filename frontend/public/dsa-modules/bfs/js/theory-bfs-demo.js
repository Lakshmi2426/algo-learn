/**
 * BFS Adventure — Theory & Visualization Section BFS Animated Engine
 * "Watch BFS Think" Multi-Topology Interactive Traversal Engine
 * 
 * Topologies supported with animated BFS step-by-step simulations:
 * 1. Starter Tree (Binary Tree Model — 6 nodes, 7 steps)
 * 2. Island Network (Ternary Branching & Deep Chain — 9 nodes, 10 steps)
 * 3. Cyclic Network (Graph with Cycles & Spanning Tree — 10 nodes, 11 steps)
 * 4. Binary Search Tree (BST Level-Order — 7 nodes, 8 steps)
 * 5. Complete Binary Tree (Sequential Left-Filled — 7 nodes, 8 steps)
 * 6. Balanced AVL Tree (Height Balanced O(log N) — 7 nodes, 8 steps)
 * 7. Skewed (Linear) Tree (Degenerate Linked-List Tree — 5 nodes, 6 steps)
 * 8. N-ary (Wide) Tree (High Branching Factor — 8 nodes, 9 steps)
 */

class TheoryBFSDemo {
  constructor() {
    this.isPlaying = false;
    this.currentStep = 0;
    this.animTimer = null;
    this.playbackSpeed = 1.0; // multiplier: 0.5x, 1x, 1.5x, 2x
    this.baseInterval = 2200; // ms
    this.activeContainerId = "bfs-inline-video-container";
    this.activeTopologyKey = "starter_tree";

    // Multi-Topology Definitions
    this.TOPOLOGIES = {
      // 1. STARTER TREE (Reference 1)
      starter_tree: {
        id: "starter_tree",
        name: "Starter tree",
        rootNode: "A",
        description: "Classic binary tree model starting from root A with level-by-level queue traversal.",
        totalSteps: 7,
        nodes: {
          A: { x: 270, y: 45,  level: 0, label: "A" },
          B: { x: 160, y: 125, level: 1, label: "B" },
          C: { x: 380, y: 125, level: 1, label: "C" },
          D: { x: 100, y: 215, level: 2, label: "D" },
          E: { x: 220, y: 215, level: 2, label: "E" },
          F: { x: 380, y: 215, level: 2, label: "F" }
        },
        edges: [
          ["A", "B"], ["A", "C"],
          ["B", "D"], ["B", "E"],
          ["C", "F"]
        ],
        steps: [
          {
            stepNum: 1,
            title: "Step 1 of 7: Initialize & Enqueue Root Node A",
            subtitle: "starting from A • Level 0",
            narration: "Start at root node A. Put A into the FIFO Queue (front of line) and mark A as discovered.",
            activeNode: "A",
            queue: ["A"],
            visited: ["A"],
            treeEdges: [],
            actionTag: "ENQUEUE A"
          },
          {
            stepNum: 2,
            title: "Step 2 of 7: Dequeue A & Enqueue Neighbors B, C",
            subtitle: "Level 0 ➔ Level 1",
            narration: "Pop A from front of Queue. Discover Level 1 neighbors B and C. Add B and C to back of Queue.",
            activeNode: "A",
            queue: ["B", "C"],
            visited: ["A", "B", "C"],
            treeEdges: [["A", "B"], ["A", "C"]],
            activeEdges: [["A", "B"], ["A", "C"]],
            actionTag: "DEQUEUE A • ENQUEUE B, C"
          },
          {
            stepNum: 3,
            title: "Step 3 of 7: Dequeue B & Enqueue Neighbors D, E",
            subtitle: "Level 1 ➔ Level 2",
            narration: "Pop B from front of Queue. Discover Level 2 neighbors D and E. Add D and E to Queue.",
            activeNode: "B",
            queue: ["C", "D", "E"],
            visited: ["A", "B", "C", "D", "E"],
            treeEdges: [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"]],
            activeEdges: [["B", "D"], ["B", "E"]],
            actionTag: "DEQUEUE B • ENQUEUE D, E"
          },
          {
            stepNum: 4,
            title: "Step 4 of 7: Dequeue C & Enqueue Neighbor F",
            subtitle: "Level 1 ➔ Level 2",
            narration: "Pop C from front of Queue. Discover Level 2 neighbor F. Add F to Queue.",
            activeNode: "C",
            queue: ["D", "E", "F"],
            visited: ["A", "B", "C", "D", "E", "F"],
            treeEdges: [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"]],
            activeEdges: [["C", "F"]],
            actionTag: "DEQUEUE C • ENQUEUE F"
          },
          {
            stepNum: 5,
            title: "Step 5 of 7: Dequeue D (Leaf Node)",
            subtitle: "Level 2 • No unvisited neighbors",
            narration: "Pop D from front of Queue. D is a leaf with no unvisited neighbors. Mark D fully processed.",
            activeNode: "D",
            queue: ["E", "F"],
            visited: ["A", "B", "C", "D", "E", "F"],
            treeEdges: [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"]],
            activeEdges: [],
            actionTag: "DEQUEUE D"
          },
          {
            stepNum: 6,
            title: "Step 6 of 7: Dequeue E (Leaf Node)",
            subtitle: "Level 2 • No unvisited neighbors",
            narration: "Pop E from front of Queue. E is a leaf with no unvisited neighbors. Mark E fully processed.",
            activeNode: "E",
            queue: ["F"],
            visited: ["A", "B", "C", "D", "E", "F"],
            treeEdges: [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"]],
            activeEdges: [],
            actionTag: "DEQUEUE E"
          },
          {
            stepNum: 7,
            title: "Step 7 of 7: Dequeue F • Traversal Complete!",
            subtitle: "All nodes reached in shortest distance!",
            narration: "Pop F from front of Queue. Queue is empty! Traversal order: A ➔ B ➔ C ➔ D ➔ E ➔ F.",
            activeNode: "F",
            queue: [],
            visited: ["A", "B", "C", "D", "E", "F"],
            treeEdges: [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"]],
            activeEdges: [],
            actionTag: "COMPLETE ✓",
            done: true
          }
        ]
      },

      // 2. ISLAND NETWORK (Reference 2)
      island_network: {
        id: "island_network",
        name: "Island network",
        rootNode: "A",
        description: "Ternary branching tree with 3 children at root and a deep single-chain branch.",
        totalSteps: 10,
        nodes: {
          A: { x: 270, y: 40,  level: 0, label: "A" },
          B: { x: 150, y: 110, level: 1, label: "B" },
          C: { x: 270, y: 115, level: 1, label: "C" },
          D: { x: 390, y: 110, level: 1, label: "D" },
          E: { x: 95,  y: 185, level: 2, label: "E" },
          F: { x: 205, y: 185, level: 2, label: "F" },
          G: { x: 310, y: 185, level: 2, label: "G" },
          H: { x: 420, y: 185, level: 2, label: "H" },
          I: { x: 270, y: 250, level: 3, label: "I" }
        },
        edges: [
          ["A", "B"], ["A", "C"], ["A", "D"],
          ["B", "E"], ["B", "F"],
          ["C", "G"], ["G", "I"],
          ["D", "H"]
        ],
        steps: [
          {
            stepNum: 1,
            title: "Step 1 of 10: Enqueue Root Node A",
            subtitle: "starting from A • Level 0",
            narration: "Initialize Queue with root node A. Mark A as discovered.",
            activeNode: "A",
            queue: ["A"],
            visited: ["A"],
            treeEdges: [],
            actionTag: "ENQUEUE A"
          },
          {
            stepNum: 2,
            title: "Step 2 of 10: Dequeue A & Enqueue Neighbors B, C, D",
            subtitle: "Level 0 ➔ Level 1",
            narration: "Pop A from Queue. Discover Level 1 neighbors B, C, and D. Add them to Queue.",
            activeNode: "A",
            queue: ["B", "C", "D"],
            visited: ["A", "B", "C", "D"],
            treeEdges: [["A", "B"], ["A", "C"], ["A", "D"]],
            activeEdges: [["A", "B"], ["A", "C"], ["A", "D"]],
            actionTag: "DEQUEUE A • ENQUEUE B, C, D"
          },
          {
            stepNum: 3,
            title: "Step 3 of 10: Dequeue B & Enqueue Neighbors E, F",
            subtitle: "Level 1 ➔ Level 2",
            narration: "Pop B from Queue. Explore B's neighbors: E and F. Add E and F to Queue.",
            activeNode: "B",
            queue: ["C", "D", "E", "F"],
            visited: ["A", "B", "C", "D", "E", "F"],
            treeEdges: [["A", "B"], ["A", "C"], ["A", "D"], ["B", "E"], ["B", "F"]],
            activeEdges: [["B", "E"], ["B", "F"]],
            actionTag: "DEQUEUE B • ENQUEUE E, F"
          },
          {
            stepNum: 4,
            title: "Step 4 of 10: Dequeue C & Enqueue Neighbor G",
            subtitle: "Level 1 ➔ Level 2",
            narration: "Pop C from Queue. Explore C's neighbor G. Add G to Queue.",
            activeNode: "C",
            queue: ["D", "E", "F", "G"],
            visited: ["A", "B", "C", "D", "E", "F", "G"],
            treeEdges: [["A", "B"], ["A", "C"], ["A", "D"], ["B", "E"], ["B", "F"], ["C", "G"]],
            activeEdges: [["C", "G"]],
            actionTag: "DEQUEUE C • ENQUEUE G"
          },
          {
            stepNum: 5,
            title: "Step 5 of 10: Dequeue D & Enqueue Neighbor H",
            subtitle: "Level 1 ➔ Level 2",
            narration: "Pop D from Queue. Explore D's neighbor H. Add H to Queue.",
            activeNode: "D",
            queue: ["E", "F", "G", "H"],
            visited: ["A", "B", "C", "D", "E", "F", "G", "H"],
            treeEdges: [["A", "B"], ["A", "C"], ["A", "D"], ["B", "E"], ["B", "F"], ["C", "G"], ["D", "H"]],
            activeEdges: [["D", "H"]],
            actionTag: "DEQUEUE D • ENQUEUE H"
          },
          {
            stepNum: 6,
            title: "Step 6 of 10: Dequeue E (Leaf Node)",
            subtitle: "Level 2 • No unvisited neighbors",
            narration: "Pop E from Queue. E has no unvisited neighbors. Proceed to next node.",
            activeNode: "E",
            queue: ["F", "G", "H"],
            visited: ["A", "B", "C", "D", "E", "F", "G", "H"],
            treeEdges: [["A", "B"], ["A", "C"], ["A", "D"], ["B", "E"], ["B", "F"], ["C", "G"], ["D", "H"]],
            activeEdges: [],
            actionTag: "DEQUEUE E"
          },
          {
            stepNum: 7,
            title: "Step 7 of 10: Dequeue F (Leaf Node)",
            subtitle: "Level 2 • No unvisited neighbors",
            narration: "Pop F from Queue. F has no unvisited neighbors. Proceed to next node.",
            activeNode: "F",
            queue: ["G", "H"],
            visited: ["A", "B", "C", "D", "E", "F", "G", "H"],
            treeEdges: [["A", "B"], ["A", "C"], ["A", "D"], ["B", "E"], ["B", "F"], ["C", "G"], ["D", "H"]],
            activeEdges: [],
            actionTag: "DEQUEUE F"
          },
          {
            stepNum: 8,
            title: "Step 8 of 10: Dequeue G & Enqueue Neighbor I",
            subtitle: "Level 2 ➔ Level 3",
            narration: "Pop G from Queue. Explore G's neighbor I on Level 3. Add I to Queue.",
            activeNode: "G",
            queue: ["H", "I"],
            visited: ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
            treeEdges: [["A", "B"], ["A", "C"], ["A", "D"], ["B", "E"], ["B", "F"], ["C", "G"], ["D", "H"], ["G", "I"]],
            activeEdges: [["G", "I"]],
            actionTag: "DEQUEUE G • ENQUEUE I"
          },
          {
            stepNum: 9,
            title: "Step 9 of 10: Dequeue H (Leaf Node)",
            subtitle: "Level 2 • No unvisited neighbors",
            narration: "Pop H from Queue. H has no unvisited neighbors.",
            activeNode: "H",
            queue: ["I"],
            visited: ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
            treeEdges: [["A", "B"], ["A", "C"], ["A", "D"], ["B", "E"], ["B", "F"], ["C", "G"], ["D", "H"], ["G", "I"]],
            activeEdges: [],
            actionTag: "DEQUEUE H"
          },
          {
            stepNum: 10,
            title: "Step 10 of 10: Dequeue I • Island Traversal Complete!",
            subtitle: "All 9 nodes traversed in FIFO level-order!",
            narration: "Pop I from Queue. Queue is empty! Traversal: A ➔ B ➔ C ➔ D ➔ E ➔ F ➔ G ➔ H ➔ I.",
            activeNode: "I",
            queue: [],
            visited: ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
            treeEdges: [["A", "B"], ["A", "C"], ["A", "D"], ["B", "E"], ["B", "F"], ["C", "G"], ["D", "H"], ["G", "I"]],
            activeEdges: [],
            actionTag: "COMPLETE ✓",
            done: true
          }
        ]
      },

      // 3. CYCLIC NETWORK (Reference 3)
      cyclic_network: {
        id: "cyclic_network",
        name: "Cyclic network",
        rootNode: "A",
        description: "10-node complex network with cross-links, cycles, and spanning tree formation.",
        totalSteps: 11,
        nodes: {
          A: { x: 270, y: 35,  level: 0, label: "A" },
          B: { x: 160, y: 95,  level: 1, label: "B" },
          C: { x: 380, y: 95,  level: 1, label: "C" },
          D: { x: 100, y: 165, level: 2, label: "D" },
          E: { x: 220, y: 165, level: 2, label: "E" },
          F: { x: 320, y: 165, level: 2, label: "F" },
          G: { x: 440, y: 165, level: 2, label: "G" },
          H: { x: 165, y: 240, level: 3, label: "H" },
          I: { x: 270, y: 250, level: 3, label: "I" },
          J: { x: 375, y: 240, level: 3, label: "J" }
        },
        edges: [
          ["A", "B"], ["A", "C"],
          ["B", "D"], ["B", "E"],
          ["C", "F"], ["C", "G"],
          ["D", "E"], ["F", "G"],
          ["E", "H"], ["E", "I"], ["H", "I"],
          ["F", "I"], ["G", "J"], ["I", "J"]
        ],
        steps: [
          {
            stepNum: 1,
            title: "Step 1 of 11: Enqueue Root Node A",
            subtitle: "starting from A • Level 0",
            narration: "Start at node A. Add A to Queue and mark as visited.",
            activeNode: "A",
            queue: ["A"],
            visited: ["A"],
            treeEdges: [],
            actionTag: "ENQUEUE A"
          },
          {
            stepNum: 2,
            title: "Step 2 of 11: Dequeue A & Enqueue B, C",
            subtitle: "Level 0 ➔ Level 1",
            narration: "Pop A. Discover Level 1 neighbors B and C. Add B and C to Queue.",
            activeNode: "A",
            queue: ["B", "C"],
            visited: ["A", "B", "C"],
            treeEdges: [["A", "B"], ["A", "C"]],
            activeEdges: [["A", "B"], ["A", "C"]],
            actionTag: "DEQUEUE A • ENQUEUE B, C"
          },
          {
            stepNum: 3,
            title: "Step 3 of 11: Dequeue B & Enqueue D, E",
            subtitle: "Level 1 ➔ Level 2",
            narration: "Pop B. Explore neighbors D and E. Add D and E to Queue.",
            activeNode: "B",
            queue: ["C", "D", "E"],
            visited: ["A", "B", "C", "D", "E"],
            treeEdges: [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"]],
            activeEdges: [["B", "D"], ["B", "E"]],
            actionTag: "DEQUEUE B • ENQUEUE D, E"
          },
          {
            stepNum: 4,
            title: "Step 4 of 11: Dequeue C & Enqueue F, G",
            subtitle: "Level 1 ➔ Level 2",
            narration: "Pop C. Explore neighbors F and G. Add F and G to Queue.",
            activeNode: "C",
            queue: ["D", "E", "F", "G"],
            visited: ["A", "B", "C", "D", "E", "F", "G"],
            treeEdges: [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"], ["C", "G"]],
            activeEdges: [["C", "F"], ["C", "G"]],
            actionTag: "DEQUEUE C • ENQUEUE F, G"
          },
          {
            stepNum: 5,
            title: "Step 5 of 11: Dequeue D (Cycle Check: E Already Visited)",
            subtitle: "Level 2 • Cycle prevention",
            narration: "Pop D. Inspect edge D-E: E is already in visited set, cycle avoided without duplicate enqueue!",
            activeNode: "D",
            queue: ["E", "F", "G"],
            visited: ["A", "B", "C", "D", "E", "F", "G"],
            treeEdges: [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"], ["C", "G"]],
            activeEdges: [["D", "E"]],
            actionTag: "DEQUEUE D • SKIP CYCLE EDGE"
          },
          {
            stepNum: 6,
            title: "Step 6 of 11: Dequeue E & Enqueue Neighbors H, I",
            subtitle: "Level 2 ➔ Level 3",
            narration: "Pop E. Discover Level 3 neighbors H and I. Add H and I to Queue.",
            activeNode: "E",
            queue: ["F", "G", "H", "I"],
            visited: ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
            treeEdges: [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"], ["C", "G"], ["E", "H"], ["E", "I"]],
            activeEdges: [["E", "H"], ["E", "I"]],
            actionTag: "DEQUEUE E • ENQUEUE H, I"
          },
          {
            stepNum: 7,
            title: "Step 7 of 11: Dequeue F (Cycle Check: G & I Already Visited)",
            subtitle: "Level 2 • Cycle prevention",
            narration: "Pop F. Edges F-G and F-I lead to already visited nodes G and I. Safely skipped!",
            activeNode: "F",
            queue: ["G", "H", "I"],
            visited: ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
            treeEdges: [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"], ["C", "G"], ["E", "H"], ["E", "I"]],
            activeEdges: [["F", "G"], ["F", "I"]],
            actionTag: "DEQUEUE F • SKIP CYCLES"
          },
          {
            stepNum: 8,
            title: "Step 8 of 11: Dequeue G & Enqueue Neighbor J",
            subtitle: "Level 2 ➔ Level 3",
            narration: "Pop G. Discover Level 3 neighbor J. Add J to Queue.",
            activeNode: "G",
            queue: ["H", "I", "J"],
            visited: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
            treeEdges: [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"], ["C", "G"], ["E", "H"], ["E", "I"], ["G", "J"]],
            activeEdges: [["G", "J"]],
            actionTag: "DEQUEUE G • ENQUEUE J"
          },
          {
            stepNum: 9,
            title: "Step 9 of 11: Dequeue H (Cycle Check: I Visited)",
            subtitle: "Level 3 • Cycle prevention",
            narration: "Pop H. Edge H-I connects to already visited node I. Skipped!",
            activeNode: "H",
            queue: ["I", "J"],
            visited: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
            treeEdges: [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"], ["C", "G"], ["E", "H"], ["E", "I"], ["G", "J"]],
            activeEdges: [["H", "I"]],
            actionTag: "DEQUEUE H"
          },
          {
            stepNum: 10,
            title: "Step 10 of 11: Dequeue I (Cycle Check: J Visited)",
            subtitle: "Level 3 • Cycle prevention",
            narration: "Pop I. Edge I-J connects to already visited node J. Skipped!",
            activeNode: "I",
            queue: ["J"],
            visited: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
            treeEdges: [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"], ["C", "G"], ["E", "H"], ["E", "I"], ["G", "J"]],
            activeEdges: [["I", "J"]],
            actionTag: "DEQUEUE I"
          },
          {
            stepNum: 11,
            title: "Step 11 of 11: Dequeue J • Cyclic BFS Complete!",
            subtitle: "BFS Spanning Tree successfully formed without cycles!",
            narration: "Pop J. Queue is empty! BFS successfully explored all 10 nodes and generated a Spanning Tree without infinite loops.",
            activeNode: "J",
            queue: [],
            visited: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
            treeEdges: [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"], ["C", "G"], ["E", "H"], ["E", "I"], ["G", "J"]],
            activeEdges: [],
            actionTag: "COMPLETE ✓",
            done: true
          }
        ]
      },

      // 4. BINARY SEARCH TREE (BST)
      bst_tree: {
        id: "bst_tree",
        name: "Binary Search Tree (BST)",
        rootNode: "50",
        description: "Binary Search Tree where Left < Root < Right. BFS traverses the tree level-by-level (50 ➔ 30, 70 ➔ 20, 40, 60, 80).",
        totalSteps: 8,
        nodes: {
          "50": { x: 270, y: 40,  level: 0, label: "50" },
          "30": { x: 160, y: 115, level: 1, label: "30" },
          "70": { x: 380, y: 115, level: 1, label: "70" },
          "20": { x: 105, y: 200, level: 2, label: "20" },
          "40": { x: 215, y: 200, level: 2, label: "40" },
          "60": { x: 325, y: 200, level: 2, label: "60" },
          "80": { x: 435, y: 200, level: 2, label: "80" }
        },
        edges: [
          ["50", "30"], ["50", "70"],
          ["30", "20"], ["30", "40"],
          ["70", "60"], ["70", "80"]
        ],
        steps: [
          {
            stepNum: 1,
            title: "Step 1 of 8: Enqueue BST Root Node 50",
            subtitle: "starting from 50 • Level 0",
            narration: "Start at the BST root node 50. Add 50 to the FIFO Queue.",
            activeNode: "50",
            queue: ["50"],
            visited: ["50"],
            treeEdges: [],
            actionTag: "ENQUEUE 50"
          },
          {
            stepNum: 2,
            title: "Step 2 of 8: Dequeue 50 & Enqueue Children 30, 70",
            subtitle: "Level 0 ➔ Level 1 (BST Children)",
            narration: "Pop 50. Discover Left child 30 (< 50) and Right child 70 (> 50). Add 30 and 70 to Queue.",
            activeNode: "50",
            queue: ["30", "70"],
            visited: ["50", "30", "70"],
            treeEdges: [["50", "30"], ["50", "70"]],
            activeEdges: [["50", "30"], ["50", "70"]],
            actionTag: "DEQUEUE 50 • ENQUEUE 30, 70"
          },
          {
            stepNum: 3,
            title: "Step 3 of 8: Dequeue 30 & Enqueue Children 20, 40",
            subtitle: "Level 1 ➔ Level 2",
            narration: "Pop 30 from Queue. Discover its sub-children 20 and 40. Append them to Queue.",
            activeNode: "30",
            queue: ["70", "20", "40"],
            visited: ["50", "30", "70", "20", "40"],
            treeEdges: [["50", "30"], ["50", "70"], ["30", "20"], ["30", "40"]],
            activeEdges: [["30", "20"], ["30", "40"]],
            actionTag: "DEQUEUE 30 • ENQUEUE 20, 40"
          },
          {
            stepNum: 4,
            title: "Step 4 of 8: Dequeue 70 & Enqueue Children 60, 80",
            subtitle: "Level 1 ➔ Level 2",
            narration: "Pop 70 from Queue. Discover its sub-children 60 and 80. Append them to Queue.",
            activeNode: "70",
            queue: ["20", "40", "60", "80"],
            visited: ["50", "30", "70", "20", "40", "60", "80"],
            treeEdges: [["50", "30"], ["50", "70"], ["30", "20"], ["30", "40"], ["70", "60"], ["70", "80"]],
            activeEdges: [["70", "60"], ["70", "80"]],
            actionTag: "DEQUEUE 70 • ENQUEUE 60, 80"
          },
          {
            stepNum: 5,
            title: "Step 5 of 8: Dequeue 20 (Leaf Node)",
            subtitle: "Level 2 Leaf",
            narration: "Pop 20 from Queue. Node 20 is a leaf with no children.",
            activeNode: "20",
            queue: ["40", "60", "80"],
            visited: ["50", "30", "70", "20", "40", "60", "80"],
            treeEdges: [["50", "30"], ["50", "70"], ["30", "20"], ["30", "40"], ["70", "60"], ["70", "80"]],
            activeEdges: [],
            actionTag: "DEQUEUE 20"
          },
          {
            stepNum: 6,
            title: "Step 6 of 8: Dequeue 40 (Leaf Node)",
            subtitle: "Level 2 Leaf",
            narration: "Pop 40 from Queue. Node 40 is a leaf with no children.",
            activeNode: "40",
            queue: ["60", "80"],
            visited: ["50", "30", "70", "20", "40", "60", "80"],
            treeEdges: [["50", "30"], ["50", "70"], ["30", "20"], ["30", "40"], ["70", "60"], ["70", "80"]],
            activeEdges: [],
            actionTag: "DEQUEUE 40"
          },
          {
            stepNum: 7,
            title: "Step 7 of 8: Dequeue 60 (Leaf Node)",
            subtitle: "Level 2 Leaf",
            narration: "Pop 60 from Queue. Node 60 is a leaf with no children.",
            activeNode: "60",
            queue: ["80"],
            visited: ["50", "30", "70", "20", "40", "60", "80"],
            treeEdges: [["50", "30"], ["50", "70"], ["30", "20"], ["30", "40"], ["70", "60"], ["70", "80"]],
            activeEdges: [],
            actionTag: "DEQUEUE 60"
          },
          {
            stepNum: 8,
            title: "Step 8 of 8: Dequeue 80 • BST Level-Order Complete!",
            subtitle: "BST Traversal: 50 ➔ 30 ➔ 70 ➔ 20 ➔ 40 ➔ 60 ➔ 80",
            narration: "Pop 80 from Queue. Queue is empty! BFS visits BST in level-order: Root (50) ➔ Level 1 (30, 70) ➔ Level 2 (20, 40, 60, 80).",
            activeNode: "80",
            queue: [],
            visited: ["50", "30", "70", "20", "40", "60", "80"],
            treeEdges: [["50", "30"], ["50", "70"], ["30", "20"], ["30", "40"], ["70", "60"], ["70", "80"]],
            activeEdges: [],
            actionTag: "COMPLETE ✓",
            done: true
          }
        ]
      },

      // 5. COMPLETE BINARY TREE
      complete_tree: {
        id: "complete_tree",
        name: "Complete Binary Tree",
        rootNode: "A",
        description: "A binary tree where every level except possibly the last is fully populated, and all nodes are as far left as possible.",
        totalSteps: 8,
        nodes: {
          A: { x: 270, y: 40,  level: 0, label: "A" },
          B: { x: 160, y: 115, level: 1, label: "B" },
          C: { x: 380, y: 115, level: 1, label: "C" },
          D: { x: 105, y: 200, level: 2, label: "D" },
          E: { x: 215, y: 200, level: 2, label: "E" },
          F: { x: 325, y: 200, level: 2, label: "F" },
          G: { x: 435, y: 200, level: 2, label: "G" }
        },
        edges: [
          ["A", "B"], ["A", "C"],
          ["B", "D"], ["B", "E"],
          ["C", "F"], ["C", "G"]
        ],
        steps: [
          {
            stepNum: 1,
            title: "Step 1 of 8: Enqueue Root Node A",
            subtitle: "starting from A • Level 0",
            narration: "Start at root node A. Add A to the Queue.",
            activeNode: "A",
            queue: ["A"],
            visited: ["A"],
            treeEdges: [],
            actionTag: "ENQUEUE A"
          },
          {
            stepNum: 2,
            title: "Step 2 of 8: Dequeue A & Enqueue B, C",
            subtitle: "Level 0 ➔ Level 1 (Full Level)",
            narration: "Pop A. Complete binary tree fills Level 1 with B and C. Add B and C to Queue.",
            activeNode: "A",
            queue: ["B", "C"],
            visited: ["A", "B", "C"],
            treeEdges: [["A", "B"], ["A", "C"]],
            activeEdges: [["A", "B"], ["A", "C"]],
            actionTag: "DEQUEUE A • ENQUEUE B, C"
          },
          {
            stepNum: 3,
            title: "Step 3 of 8: Dequeue B & Enqueue D, E",
            subtitle: "Level 1 ➔ Level 2 (Left Children)",
            narration: "Pop B. B has left child D and right child E. Add D and E to Queue.",
            activeNode: "B",
            queue: ["C", "D", "E"],
            visited: ["A", "B", "C", "D", "E"],
            treeEdges: [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"]],
            activeEdges: [["B", "D"], ["B", "E"]],
            actionTag: "DEQUEUE B • ENQUEUE D, E"
          },
          {
            stepNum: 4,
            title: "Step 4 of 8: Dequeue C & Enqueue F, G",
            subtitle: "Level 1 ➔ Level 2 (Right Children)",
            narration: "Pop C. C has left child F and right child G. Complete tree Level 2 is fully filled.",
            activeNode: "C",
            queue: ["D", "E", "F", "G"],
            visited: ["A", "B", "C", "D", "E", "F", "G"],
            treeEdges: [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"], ["C", "G"]],
            activeEdges: [["C", "F"], ["C", "G"]],
            actionTag: "DEQUEUE C • ENQUEUE F, G"
          },
          {
            stepNum: 5,
            title: "Step 5 of 8: Dequeue D",
            subtitle: "Level 2 Leaf Node",
            narration: "Pop D. D has no children.",
            activeNode: "D",
            queue: ["E", "F", "G"],
            visited: ["A", "B", "C", "D", "E", "F", "G"],
            treeEdges: [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"], ["C", "G"]],
            activeEdges: [],
            actionTag: "DEQUEUE D"
          },
          {
            stepNum: 6,
            title: "Step 6 of 8: Dequeue E",
            subtitle: "Level 2 Leaf Node",
            narration: "Pop E. E has no children.",
            activeNode: "E",
            queue: ["F", "G"],
            visited: ["A", "B", "C", "D", "E", "F", "G"],
            treeEdges: [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"], ["C", "G"]],
            activeEdges: [],
            actionTag: "DEQUEUE E"
          },
          {
            stepNum: 7,
            title: "Step 7 of 8: Dequeue F",
            subtitle: "Level 2 Leaf Node",
            narration: "Pop F. F has no children.",
            activeNode: "F",
            queue: ["G"],
            visited: ["A", "B", "C", "D", "E", "F", "G"],
            treeEdges: [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"], ["C", "G"]],
            activeEdges: [],
            actionTag: "DEQUEUE F"
          },
          {
            stepNum: 8,
            title: "Step 8 of 8: Dequeue G • Complete Binary Traversal Done!",
            subtitle: "Sequential order: A ➔ B ➔ C ➔ D ➔ E ➔ F ➔ G",
            narration: "Pop G. In a complete binary tree, BFS corresponds directly to standard 1-D array heap indexing!",
            activeNode: "G",
            queue: [],
            visited: ["A", "B", "C", "D", "E", "F", "G"],
            treeEdges: [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"], ["C", "G"]],
            activeEdges: [],
            actionTag: "COMPLETE ✓",
            done: true
          }
        ]
      },

      // 6. BALANCED AVL TREE
      balanced_avl: {
        id: "balanced_avl",
        name: "Balanced AVL Tree",
        rootNode: "40",
        description: "Self-balancing binary tree where height difference |Height(L) - Height(R)| ≤ 1 at every node, maintaining O(log N) depth.",
        totalSteps: 8,
        nodes: {
          "40": { x: 270, y: 40,  level: 0, label: "40" },
          "20": { x: 160, y: 115, level: 1, label: "20" },
          "60": { x: 380, y: 115, level: 1, label: "60" },
          "10": { x: 105, y: 200, level: 2, label: "10" },
          "30": { x: 215, y: 200, level: 2, label: "30" },
          "50": { x: 325, y: 200, level: 2, label: "50" },
          "70": { x: 435, y: 200, level: 2, label: "70" }
        },
        edges: [
          ["40", "20"], ["40", "60"],
          ["20", "10"], ["20", "30"],
          ["60", "50"], ["60", "70"]
        ],
        steps: [
          {
            stepNum: 1,
            title: "Step 1 of 8: Enqueue AVL Root Node 40",
            subtitle: "starting from 40 • Balance Factor = 0",
            narration: "Start at AVL root 40 (Balance factor = 0). Add 40 to Queue.",
            activeNode: "40",
            queue: ["40"],
            visited: ["40"],
            treeEdges: [],
            actionTag: "ENQUEUE 40"
          },
          {
            stepNum: 2,
            title: "Step 2 of 8: Dequeue 40 & Enqueue Balanced Subtrees 20, 60",
            subtitle: "Level 0 ➔ Level 1 (BF = 0)",
            narration: "Pop 40. Explore Left subtree root 20 and Right subtree root 60. Enqueue both.",
            activeNode: "40",
            queue: ["20", "60"],
            visited: ["40", "20", "60"],
            treeEdges: [["40", "20"], ["40", "60"]],
            activeEdges: [["40", "20"], ["40", "60"]],
            actionTag: "DEQUEUE 40 • ENQUEUE 20, 60"
          },
          {
            stepNum: 3,
            title: "Step 3 of 8: Dequeue 20 & Enqueue 10, 30",
            subtitle: "Level 1 ➔ Level 2",
            narration: "Pop 20. Explore its balanced children 10 and 30. Add 10 and 30 to Queue.",
            activeNode: "20",
            queue: ["60", "10", "30"],
            visited: ["40", "20", "60", "10", "30"],
            treeEdges: [["40", "20"], ["40", "60"], ["20", "10"], ["20", "30"]],
            activeEdges: [["20", "10"], ["20", "30"]],
            actionTag: "DEQUEUE 20 • ENQUEUE 10, 30"
          },
          {
            stepNum: 4,
            title: "Step 4 of 8: Dequeue 60 & Enqueue 50, 70",
            subtitle: "Level 1 ➔ Level 2",
            narration: "Pop 60. Explore its balanced children 50 and 70. Add 50 and 70 to Queue.",
            activeNode: "60",
            queue: ["10", "30", "50", "70"],
            visited: ["40", "20", "60", "10", "30", "50", "70"],
            treeEdges: [["40", "20"], ["40", "60"], ["20", "10"], ["20", "30"], ["60", "50"], ["60", "70"]],
            activeEdges: [["60", "50"], ["60", "70"]],
            actionTag: "DEQUEUE 60 • ENQUEUE 50, 70"
          },
          {
            stepNum: 5,
            title: "Step 5 of 8: Dequeue 10",
            subtitle: "Level 2 Leaf",
            narration: "Pop 10 from Queue. Node 10 has no children.",
            activeNode: "10",
            queue: ["30", "50", "70"],
            visited: ["40", "20", "60", "10", "30", "50", "70"],
            treeEdges: [["40", "20"], ["40", "60"], ["20", "10"], ["20", "30"], ["60", "50"], ["60", "70"]],
            activeEdges: [],
            actionTag: "DEQUEUE 10"
          },
          {
            stepNum: 6,
            title: "Step 6 of 8: Dequeue 30",
            subtitle: "Level 2 Leaf",
            narration: "Pop 30 from Queue. Node 30 has no children.",
            activeNode: "30",
            queue: ["50", "70"],
            visited: ["40", "20", "60", "10", "30", "50", "70"],
            treeEdges: [["40", "20"], ["40", "60"], ["20", "10"], ["20", "30"], ["60", "50"], ["60", "70"]],
            activeEdges: [],
            actionTag: "DEQUEUE 30"
          },
          {
            stepNum: 7,
            title: "Step 7 of 8: Dequeue 50",
            subtitle: "Level 2 Leaf",
            narration: "Pop 50 from Queue. Node 50 has no children.",
            activeNode: "50",
            queue: ["70"],
            visited: ["40", "20", "60", "10", "30", "50", "70"],
            treeEdges: [["40", "20"], ["40", "60"], ["20", "10"], ["20", "30"], ["60", "50"], ["60", "70"]],
            activeEdges: [],
            actionTag: "DEQUEUE 50"
          },
          {
            stepNum: 8,
            title: "Step 8 of 8: Dequeue 70 • AVL BFS Traversal Complete!",
            subtitle: "Perfect O(log N) depth exploration",
            narration: "Pop 70 from Queue. Balanced height ensures BFS explores all nodes with minimum levels!",
            activeNode: "70",
            queue: [],
            visited: ["40", "20", "60", "10", "30", "50", "70"],
            treeEdges: [["40", "20"], ["40", "60"], ["20", "10"], ["20", "30"], ["60", "50"], ["60", "70"]],
            activeEdges: [],
            actionTag: "COMPLETE ✓",
            done: true
          }
        ]
      },

      // 7. SKEWED (LINEAR) TREE
      skewed_tree: {
        id: "skewed_tree",
        name: "Skewed (Linear) Tree",
        rootNode: "A",
        description: "Degenerate tree behaving as a linked list (every node has 1 child). BFS queue never exceeds size 1.",
        totalSteps: 6,
        nodes: {
          A: { x: 110, y: 40,  level: 0, label: "A" },
          B: { x: 190, y: 95,  level: 1, label: "B" },
          C: { x: 270, y: 150, level: 2, label: "C" },
          D: { x: 350, y: 205, level: 3, label: "D" },
          E: { x: 430, y: 260, level: 4, label: "E" }
        },
        edges: [
          ["A", "B"], ["B", "C"], ["C", "D"], ["D", "E"]
        ],
        steps: [
          {
            stepNum: 1,
            title: "Step 1 of 6: Enqueue Root Node A",
            subtitle: "starting from A • Level 0",
            narration: "Start at root node A. Enqueue A. In a skewed tree, queue space is O(1).",
            activeNode: "A",
            queue: ["A"],
            visited: ["A"],
            treeEdges: [],
            actionTag: "ENQUEUE A"
          },
          {
            stepNum: 2,
            title: "Step 2 of 6: Dequeue A & Enqueue Single Child B",
            subtitle: "Level 0 ➔ Level 1",
            narration: "Pop A. Node A has only one child B. Enqueue B.",
            activeNode: "A",
            queue: ["B"],
            visited: ["A", "B"],
            treeEdges: [["A", "B"]],
            activeEdges: [["A", "B"]],
            actionTag: "DEQUEUE A • ENQUEUE B"
          },
          {
            stepNum: 3,
            title: "Step 3 of 6: Dequeue B & Enqueue Single Child C",
            subtitle: "Level 1 ➔ Level 2",
            narration: "Pop B. Node B has only one child C. Enqueue C.",
            activeNode: "B",
            queue: ["C"],
            visited: ["A", "B", "C"],
            treeEdges: [["A", "B"], ["B", "C"]],
            activeEdges: [["B", "C"]],
            actionTag: "DEQUEUE B • ENQUEUE C"
          },
          {
            stepNum: 4,
            title: "Step 4 of 6: Dequeue C & Enqueue Single Child D",
            subtitle: "Level 2 ➔ Level 3",
            narration: "Pop C. Node C has only one child D. Enqueue D.",
            activeNode: "C",
            queue: ["D"],
            visited: ["A", "B", "C", "D"],
            treeEdges: [["A", "B"], ["B", "C"], ["C", "D"]],
            activeEdges: [["C", "D"]],
            actionTag: "DEQUEUE C • ENQUEUE D"
          },
          {
            stepNum: 5,
            title: "Step 5 of 6: Dequeue D & Enqueue Single Child E",
            subtitle: "Level 3 ➔ Level 4",
            narration: "Pop D. Node D has single child E. Enqueue E.",
            activeNode: "D",
            queue: ["E"],
            visited: ["A", "B", "C", "D", "E"],
            treeEdges: [["A", "B"], ["B", "C"], ["C", "D"], ["D", "E"]],
            activeEdges: [["D", "E"]],
            actionTag: "DEQUEUE D • ENQUEUE E"
          },
          {
            stepNum: 6,
            title: "Step 6 of 6: Dequeue E • Linear Chain Traversal Complete!",
            subtitle: "Traversal: A ➔ B ➔ C ➔ D ➔ E",
            narration: "Pop E. In a skewed tree, BFS and DFS visit nodes in the exact same sequence!",
            activeNode: "E",
            queue: [],
            visited: ["A", "B", "C", "D", "E"],
            treeEdges: [["A", "B"], ["B", "C"], ["C", "D"], ["D", "E"]],
            activeEdges: [],
            actionTag: "COMPLETE ✓",
            done: true
          }
        ]
      },

      // 8. N-ARY (WIDE) TREE
      n_ary_tree: {
        id: "n_ary_tree",
        name: "N-ary (Wide) Tree",
        rootNode: "A",
        description: "High-branching multi-way tree with 5 direct children at root A, demonstrating maximum BFS queue breadth.",
        totalSteps: 9,
        nodes: {
          A:  { x: 270, y: 40,  level: 0, label: "A" },
          B:  { x: 80,  y: 135, level: 1, label: "B" },
          C:  { x: 175, y: 135, level: 1, label: "C" },
          D:  { x: 270, y: 135, level: 1, label: "D" },
          E:  { x: 365, y: 135, level: 1, label: "E" },
          F:  { x: 460, y: 135, level: 1, label: "F" },
          G:  { x: 130, y: 225, level: 2, label: "G" },
          H:  { x: 220, y: 225, level: 2, label: "H" }
        },
        edges: [
          ["A", "B"], ["A", "C"], ["A", "D"], ["A", "E"], ["A", "F"],
          ["C", "G"], ["C", "H"]
        ],
        steps: [
          {
            stepNum: 1,
            title: "Step 1 of 9: Enqueue Root Node A",
            subtitle: "starting from A • Level 0",
            narration: "Start at root node A. Put A into Queue.",
            activeNode: "A",
            queue: ["A"],
            visited: ["A"],
            treeEdges: [],
            actionTag: "ENQUEUE A"
          },
          {
            stepNum: 2,
            title: "Step 2 of 9: Dequeue A & Enqueue All 5 Children (B, C, D, E, F)",
            subtitle: "Level 0 ➔ Level 1 (High Breadth)",
            narration: "Pop A. A has 5 children: B, C, D, E, F. Queue swells to hold all 5 siblings!",
            activeNode: "A",
            queue: ["B", "C", "D", "E", "F"],
            visited: ["A", "B", "C", "D", "E", "F"],
            treeEdges: [["A", "B"], ["A", "C"], ["A", "D"], ["A", "E"], ["A", "F"]],
            activeEdges: [["A", "B"], ["A", "C"], ["A", "D"], ["A", "E"], ["A", "F"]],
            actionTag: "DEQUEUE A • ENQUEUE B, C, D, E, F"
          },
          {
            stepNum: 3,
            title: "Step 3 of 9: Dequeue B",
            subtitle: "Level 1 Child (Leaf)",
            narration: "Pop B. B has no children. Move to next sibling C.",
            activeNode: "B",
            queue: ["C", "D", "E", "F"],
            visited: ["A", "B", "C", "D", "E", "F"],
            treeEdges: [["A", "B"], ["A", "C"], ["A", "D"], ["A", "E"], ["A", "F"]],
            activeEdges: [],
            actionTag: "DEQUEUE B"
          },
          {
            stepNum: 4,
            title: "Step 4 of 9: Dequeue C & Enqueue Children G, H",
            subtitle: "Level 1 ➔ Level 2",
            narration: "Pop C. C has 2 children G and H on Level 2. Add G and H to back of Queue.",
            activeNode: "C",
            queue: ["D", "E", "F", "G", "H"],
            visited: ["A", "B", "C", "D", "E", "F", "G", "H"],
            treeEdges: [["A", "B"], ["A", "C"], ["A", "D"], ["A", "E"], ["A", "F"], ["C", "G"], ["C", "H"]],
            activeEdges: [["C", "G"], ["C", "H"]],
            actionTag: "DEQUEUE C • ENQUEUE G, H"
          },
          {
            stepNum: 5,
            title: "Step 5 of 9: Dequeue D",
            subtitle: "Level 1 Child (Leaf)",
            narration: "Pop D. D has no children. Move to sibling E.",
            activeNode: "D",
            queue: ["E", "F", "G", "H"],
            visited: ["A", "B", "C", "D", "E", "F", "G", "H"],
            treeEdges: [["A", "B"], ["A", "C"], ["A", "D"], ["A", "E"], ["A", "F"], ["C", "G"], ["C", "H"]],
            activeEdges: [],
            actionTag: "DEQUEUE D"
          },
          {
            stepNum: 6,
            title: "Step 6 of 9: Dequeue E",
            subtitle: "Level 1 Child (Leaf)",
            narration: "Pop E. E has no children. Move to sibling F.",
            activeNode: "E",
            queue: ["F", "G", "H"],
            visited: ["A", "B", "C", "D", "E", "F", "G", "H"],
            treeEdges: [["A", "B"], ["A", "C"], ["A", "D"], ["A", "E"], ["A", "F"], ["C", "G"], ["C", "H"]],
            activeEdges: [],
            actionTag: "DEQUEUE E"
          },
          {
            stepNum: 7,
            title: "Step 7 of 9: Dequeue F",
            subtitle: "Level 1 Child (Leaf)",
            narration: "Pop F. F has no children. All Level 1 nodes are now completely processed!",
            activeNode: "F",
            queue: ["G", "H"],
            visited: ["A", "B", "C", "D", "E", "F", "G", "H"],
            treeEdges: [["A", "B"], ["A", "C"], ["A", "D"], ["A", "E"], ["A", "F"], ["C", "G"], ["C", "H"]],
            activeEdges: [],
            actionTag: "DEQUEUE F"
          },
          {
            stepNum: 8,
            title: "Step 8 of 9: Dequeue G",
            subtitle: "Level 2 Leaf",
            narration: "Pop G. G is a leaf with no children.",
            activeNode: "G",
            queue: ["H"],
            visited: ["A", "B", "C", "D", "E", "F", "G", "H"],
            treeEdges: [["A", "B"], ["A", "C"], ["A", "D"], ["A", "E"], ["A", "F"], ["C", "G"], ["C", "H"]],
            activeEdges: [],
            actionTag: "DEQUEUE G"
          },
          {
            stepNum: 9,
            title: "Step 9 of 9: Dequeue H • N-ary Tree Traversal Complete!",
            subtitle: "Level order: A ➔ B, C, D, E, F ➔ G, H",
            narration: "Pop H from Queue. Queue is empty! BFS explored all wide branches layer-by-layer.",
            activeNode: "H",
            queue: [],
            visited: ["A", "B", "C", "D", "E", "F", "G", "H"],
            treeEdges: [["A", "B"], ["A", "C"], ["A", "D"], ["A", "E"], ["A", "F"], ["C", "G"], ["C", "H"]],
            activeEdges: [],
            actionTag: "COMPLETE ✓",
            done: true
          }
        ]
      }
    };
  }

  /* ─────────────────────────────────────────────────────────────
     TOPOLOGY SWITCHER
  ───────────────────────────────────────────────────────────── */

  selectTopology(topologyKey) {
    if (!this.TOPOLOGIES[topologyKey]) return;
    this.activeTopologyKey = topologyKey;
    this.currentStep = 0;
    
    // Update tab button styles
    document.querySelectorAll(".bfs-think-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.topology === topologyKey);
    });

    const container = document.getElementById(this.activeContainerId);
    if (container) {
      const mode = this.activeContainerId.includes("modal") ? "modal" : "inline";
      this._renderPlayerHTML(container, mode);
      this._renderCurrentStep();
    }
    if (this.isPlaying) {
      this._stopLoop();
      this._startLoop();
    }
    if (window.soundManager) window.soundManager.playPop();
  }

  getCurrentTopology() {
    return this.TOPOLOGIES[this.activeTopologyKey] || this.TOPOLOGIES.starter_tree;
  }

  /* ─────────────────────────────────────────────────────────────
     INIT & MOUNT
  ───────────────────────────────────────────────────────────── */

  mountInlinePlayer() {
    const container = document.getElementById("bfs-inline-video-container");
    if (!container) return;
    this.activeContainerId = "bfs-inline-video-container";
    this._renderPlayerHTML(container, "inline");
    this.currentStep = 0;
    this.isPlaying = true;
    this._updatePlayButtonState();
    this._renderCurrentStep();
    this._startLoop();
  }

  openBFSIntroDemo() {
    const modal = document.getElementById("bfs-intro-demo-modal");
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    modal.style.display = "flex";

    const modalCanvas = document.getElementById("bfs-intro-demo-canvas");
    if (modalCanvas) {
      this.activeContainerId = "bfs-intro-demo-canvas";
      this._renderPlayerHTML(modalCanvas, "modal");
      this.currentStep = 0;
      this.isPlaying = true;
      this._updatePlayButtonState();
      this._renderCurrentStep();
      this._startLoop();
    }
  }

  closeDemo() {
    const modal = document.getElementById("bfs-intro-demo-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      modal.style.display = "none";
    }
    this._stopLoop();
    this.isPlaying = false;
    this.mountInlinePlayer();
  }

  /* ─────────────────────────────────────────────────────────────
     PLAYBACK CONTROLS
  ───────────────────────────────────────────────────────────── */

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    this._updatePlayButtonState();
    if (this.isPlaying) {
      const topo = this.getCurrentTopology();
      if (this.currentStep >= topo.steps.length - 1) {
        this.currentStep = 0;
      }
      this._renderCurrentStep();
      this._startLoop();
      if (window.soundManager) window.soundManager.playPop();
    } else {
      this._stopLoop();
    }
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this._updatePlayButtonState();
    const topo = this.getCurrentTopology();
    if (this.currentStep >= topo.steps.length - 1) {
      this.currentStep = 0;
    }
    this._renderCurrentStep();
    this._startLoop();
    if (window.soundManager) window.soundManager.playPop();
  }

  pause() {
    this.isPlaying = false;
    this._updatePlayButtonState();
    this._stopLoop();
  }

  restart() {
    this._stopLoop();
    this.currentStep = 0;
    this.isPlaying = true;
    this._updatePlayButtonState();
    this._renderCurrentStep();
    this._startLoop();
    if (window.soundManager) window.soundManager.playPop();
  }

  nextStep() {
    this.pause();
    const topo = this.getCurrentTopology();
    if (this.currentStep < topo.steps.length - 1) {
      this.currentStep++;
      this._renderCurrentStep();
      if (window.soundManager) window.soundManager.playStep();
    }
  }

  prevStep() {
    this.pause();
    if (this.currentStep > 0) {
      this.currentStep--;
      this._renderCurrentStep();
      if (window.soundManager) window.soundManager.playStep();
    }
  }

  seekToStep(stepIdx) {
    const topo = this.getCurrentTopology();
    if (stepIdx >= 0 && stepIdx < topo.steps.length) {
      this.currentStep = stepIdx;
      this._renderCurrentStep();
      if (window.soundManager) window.soundManager.playStep();
    }
  }

  setSpeed(speedVal) {
    this.playbackSpeed = parseFloat(speedVal) || 1.0;
    document.querySelectorAll(".bfs-video-speed-btn").forEach(btn => {
      btn.classList.toggle("active", parseFloat(btn.dataset.speed) === this.playbackSpeed);
    });
    if (this.isPlaying) {
      this._startLoop();
    }
  }

  _startLoop() {
    this._stopLoop();
    const interval = Math.round(this.baseInterval / this.playbackSpeed);
    this.animTimer = setInterval(() => {
      const topo = this.getCurrentTopology();
      if (this.currentStep < topo.steps.length - 1) {
        this.currentStep++;
        this._renderCurrentStep();
        if (window.soundManager) window.soundManager.playStep();
      } else {
        // Loop back to start after a pause
        setTimeout(() => {
          if (this.isPlaying) {
            this.currentStep = 0;
            this._renderCurrentStep();
          }
        }, 1200);
      }
    }, interval);
  }

  _stopLoop() {
    if (this.animTimer) {
      clearInterval(this.animTimer);
      this.animTimer = null;
    }
  }

  _updatePlayButtonState() {
    document.querySelectorAll(".bfs-video-play-btn").forEach(btn => {
      if (this.isPlaying) {
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`;
        btn.title = "Pause Traversal Video";
      } else {
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play Live`;
        btn.title = "Play Traversal Video";
      }
    });
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER HTML STRUCTURE (Matching Reference UI Design)
  ───────────────────────────────────────────────────────────── */

  _renderPlayerHTML(container, mode) {
    const isModal = mode === "modal";
    const topo = this.getCurrentTopology();
    const startNode = topo.rootNode || "A";
    
    container.innerHTML = `
      <div class="bfs-think-player-container ${isModal ? 'bfs-think-player--modal' : ''}">
        
        <!-- Header Banner Area -->
        <div class="bfs-think-header-block">
          <h2 class="bfs-think-main-title">Watch BFS Think</h2>
          <div class="bfs-think-subtitle" id="bfs-think-subtitle">
            Step ${this.currentStep + 1} of ${topo.totalSteps} • starting from ${startNode}
          </div>

          <!-- Tree Topology Selector Tabs (Dynamic Multi-Tree Types) -->
          <div class="bfs-think-tabs-bar">
            ${Object.values(this.TOPOLOGIES).map(t => `
              <button class="bfs-think-tab-btn ${this.activeTopologyKey === t.id ? 'active' : ''}" 
                      data-topology="${t.id}" 
                      onclick="theoryBFSDemo.selectTopology('${t.id}')">
                ${t.name}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Main Graph Display Card -->
        <div class="bfs-think-graph-card">
          
          <svg id="bfs-think-svg" class="bfs-think-svg-canvas" viewBox="0 0 540 290" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="glow-blue-ring" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#38bdf8" flood-opacity="0.8"/>
              </filter>
              <filter id="glow-gold-ring" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#f59e0b" flood-opacity="0.8"/>
              </filter>
            </defs>
            <g id="bfs-svg-edges"></g>
            <g id="bfs-svg-nodes"></g>
          </svg>

          <!-- Interactive Bottom Legend (Unvisited, In queue, Current, Visited, Spanning tree) -->
          <div class="bfs-think-legend-row">
            <div class="think-legend-item">
              <span class="legend-circle legend-unvisited"></span>
              <span>• Unvisited</span>
            </div>
            <div class="think-legend-item">
              <span class="legend-circle legend-queue">⏳</span>
              <span>In queue</span>
            </div>
            <div class="think-legend-item">
              <span class="legend-circle legend-current">★</span>
              <span>Current</span>
            </div>
            <div class="think-legend-item">
              <span class="legend-circle legend-visited">✓</span>
              <span>Visited</span>
            </div>
            <div class="think-legend-item">
              <span class="legend-circle legend-spanning">◆</span>
              <span>Spanning tree</span>
            </div>
          </div>

        </div>

        <!-- Bottom FIFO Queue Tray Card -->
        <div class="bfs-think-queue-card">
          <div class="think-queue-header">
            <span class="queue-title-label">QUEUE</span>
            <span class="queue-type-label">FIFO</span>
          </div>

          <div class="think-queue-conveyor" id="bfs-think-queue-conveyor">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- Live Step Narration Box -->
        <div class="bfs-think-narration-box">
          <div class="think-step-tag" id="bfs-video-step-tag">Step 1</div>
          <div class="think-step-title" id="bfs-video-step-title">Initializing BFS</div>
          <p class="think-narration-text" id="bfs-video-narration">
            Start at root node ${startNode}. Put ${startNode} into the FIFO Queue.
          </p>
        </div>

        <!-- Playback Scrubbing & Speed Control Deck -->
        <div class="bfs-video-controls-deck">
          
          <div class="bfs-video-timeline-wrap">
            <div class="bfs-video-timeline-track" id="bfs-video-timeline-track">
              <div class="bfs-video-timeline-fill" id="bfs-video-timeline-fill" style="width: 0%;"></div>
              <div class="bfs-video-timeline-markers">
                ${topo.steps.map((s, idx) => `
                  <button class="bfs-timeline-dot" 
                          data-step="${idx}" 
                          onclick="theoryBFSDemo.seekToStep(${idx})"
                          title="${s.title}">
                    <span>${idx + 1}</span>
                  </button>
                `).join('')}
              </div>
            </div>
            <div class="bfs-video-time-display">
              <span id="bfs-video-step-counter">Step 1 of ${topo.totalSteps}</span>
              <span id="bfs-video-time-pct">0%</span>
            </div>
          </div>

          <!-- Action Buttons Bar -->
          <div class="bfs-video-btns-row">
            
            <div class="bfs-video-btns-left">
              <!-- Skip to Start -->
              <button class="btn-video-ctl" onclick="theoryBFSDemo.restart()" title="Restart from Step 1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
              </button>
              <!-- Play/Pause - Purple Primary Button -->
              <button class="btn-video-ctl btn-video-play bfs-video-play-btn" onclick="theoryBFSDemo.togglePlay()" title="Play / Pause Video">
                ${this.isPlaying 
                  ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`
                  : `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play Live`
                }
              </button>
              <!-- Skip Forward -->
              <button class="btn-video-ctl" onclick="theoryBFSDemo.nextStep()" title="Next Step">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
              </button>
              <!-- Restart/Loop -->
              <button class="btn-video-ctl" onclick="theoryBFSDemo.restart()" title="Restart">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </button>
            </div>

            <!-- Speed Multipliers (pill style like pic 1) -->
            <div class="bfs-video-speed-group">
              <button class="bfs-video-speed-btn ${this.playbackSpeed === 0.5 ? 'active' : ''}" data-speed="0.5" onclick="theoryBFSDemo.setSpeed(0.5)">0.5x</button>
              <button class="bfs-video-speed-btn ${this.playbackSpeed === 1.0 ? 'active' : ''}" data-speed="1.0" onclick="theoryBFSDemo.setSpeed(1.0)">1x</button>
              <button class="bfs-video-speed-btn ${this.playbackSpeed === 2.0 ? 'active' : ''}" data-speed="2.0" onclick="theoryBFSDemo.setSpeed(2.0)">2x</button>
            </div>

          </div>

        </div>

      </div>
    `;

    this._drawEdges();
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER STEP STATE
  ───────────────────────────────────────────────────────────── */

  _renderCurrentStep() {
    const topo = this.getCurrentTopology();
    const step = topo.steps[this.currentStep] || topo.steps[0];
    if (!step) return;

    const startNode = topo.rootNode || "A";

    // 1. Update captions & subtitle
    const subTitleEl  = document.getElementById("bfs-think-subtitle");
    const stepTagEl   = document.getElementById("bfs-video-step-tag");
    const titleEl     = document.getElementById("bfs-video-step-title");
    const narrationEl = document.getElementById("bfs-video-narration");
    const stepCountEl = document.getElementById("bfs-video-step-counter");
    const timePctEl   = document.getElementById("bfs-video-time-pct");
    const fillEl      = document.getElementById("bfs-video-timeline-fill");

    if (subTitleEl)  subTitleEl.textContent = `Step ${this.currentStep + 1} of ${topo.totalSteps} • starting from ${startNode}`;
    if (stepTagEl)   stepTagEl.textContent = `STEP ${step.stepNum} • ${step.actionTag}`;
    if (titleEl)     titleEl.textContent   = step.title;
    if (narrationEl) narrationEl.innerHTML = step.narration;
    if (stepCountEl) stepCountEl.textContent = `Step ${this.currentStep + 1} of ${topo.totalSteps}`;

    const totalSteps = topo.steps.length;
    const pct = totalSteps > 1 ? Math.round(((this.currentStep) / (totalSteps - 1)) * 100) : 100;
    if (timePctEl) timePctEl.textContent = `${pct}%`;
    if (fillEl) fillEl.style.width = `${pct}%`;

    // Update timeline dots
    document.querySelectorAll(".bfs-timeline-dot").forEach((dot, idx) => {
      dot.classList.toggle("active", idx === this.currentStep);
      dot.classList.toggle("passed", idx < this.currentStep);
    });

    // 2. Draw SVG Nodes & Edges
    this._drawNodes(step, topo);
    this._highlightEdges(step, topo);

    // 3. Render Queue Conveyor Tray
    const conveyor = document.getElementById("bfs-think-queue-conveyor");
    if (conveyor) {
      if (!step.queue || step.queue.length === 0) {
        conveyor.innerHTML = `
          <div class="think-q-empty-state">
            ${step.done ? 'Queue empty • BFS Traversal successfully completed!' : 'Queue is currently empty'}
          </div>
        `;
      } else {
        conveyor.innerHTML = `
          <div class="think-q-direction-tag front-tag">
            <span class="dir-arrow">➔</span>
            <span>FRONT</span>
          </div>
          <div class="think-q-chips-row">
            ${step.queue.map((nodeId, idx) => {
              const isFront = idx === 0;
              return `
                <div class="think-q-chip ${isFront ? 'is-front-chip' : ''}">
                  <span class="qchip-char">${nodeId}</span>
                  <span class="qchip-sub">${isFront ? 'next' : ''}</span>
                </div>
              `;
            }).join('')}
          </div>
          <div class="think-q-direction-tag rear-tag">
            <span>REAR</span>
            <span class="dir-arrow">➔</span>
          </div>
        `;
      }
    }

    this._updatePlayButtonState();
  }

  /* ─────────────────────────────────────────────────────────────
     SVG GRAPH DRAWING
  ───────────────────────────────────────────────────────────── */

  _drawEdges() {
    const topo = this.getCurrentTopology();
    const edgesG = document.getElementById("bfs-svg-edges");
    if (!edgesG) return;
    edgesG.innerHTML = topo.edges.map(([a, b]) => {
      const pa = topo.nodes[a];
      const pb = topo.nodes[b];
      if (!pa || !pb) return '';
      return `
        <line id="bfs-edge-${a}-${b}" 
              x1="${pa.x}" y1="${pa.y}" 
              x2="${pb.x}" y2="${pb.y}" 
              class="bfs-think-edge" />
      `;
    }).join('');
  }

  _highlightEdges(step, topo) {
    const treeEdges = step.treeEdges || [];
    const activeEdges = step.activeEdges || [];

    topo.edges.forEach(([a, b]) => {
      const edgeEl = document.getElementById(`bfs-edge-${a}-${b}`);
      if (!edgeEl) return;
      const isTree = treeEdges.some(([ea, eb]) => (ea === a && eb === b) || (ea === b && eb === a));
      const isActive = activeEdges.some(([ea, eb]) => (ea === a && eb === b) || (ea === b && eb === a));

      edgeEl.classList.toggle("bfs-edge--tree", isTree);
      edgeEl.classList.toggle("bfs-edge--active", isActive);
    });
  }

  _drawNodes(step, topo) {
    const nodesG = document.getElementById("bfs-svg-nodes");
    if (!nodesG) return;

    const visited   = step.visited   || [];
    const active    = step.activeNode;
    const queue     = step.queue     || [];
    const done      = step.done;

    nodesG.innerHTML = Object.entries(topo.nodes).map(([id, pos]) => {
      let stateClass = "node-unvisited";
      let badgeIcon = "";

      if (done && visited.includes(id)) {
        stateClass = "node-done";
        badgeIcon = "✓";
      } else if (id === active) {
        stateClass = "node-active";
        badgeIcon = "★";
      } else if (queue.includes(id)) {
        stateClass = "node-in-queue";
        badgeIcon = "⏳";
      } else if (visited.includes(id)) {
        stateClass = "node-visited";
        badgeIcon = "✓";
      }

      const r = (id === active) ? 22 : 19;
      const displayText = pos.label || id;

      return `
        <g class="bfs-think-node-group ${stateClass}" transform="translate(${pos.x}, ${pos.y})">
          <!-- Active Pulse Ring -->
          ${id === active ? `<circle class="think-node-pulse-ring" r="32" />` : ''}

          <!-- Main Circle -->
          <circle class="think-node-circle" r="${r}" />

          <!-- Node Text / Number Label -->
          <text class="think-node-text" dy=".35em" text-anchor="middle">${displayText}</text>

          <!-- Status Indicator Icon Badge (Hourglass / Star / Check) -->
          ${badgeIcon ? `
            <g class="think-node-badge" transform="translate(14, -14)">
              <circle r="8" class="badge-bg-circle" />
              <text dy=".35em" text-anchor="middle" class="badge-icon-text">${badgeIcon}</text>
            </g>
          ` : ''}
        </g>
      `;
    }).join('');
  }
}

// Global instance initialization
if (typeof window !== 'undefined') {
  window.TheoryBFSDemo = TheoryBFSDemo;
  window.theoryBFSDemo = new TheoryBFSDemo();
}
