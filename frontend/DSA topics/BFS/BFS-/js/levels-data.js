/**
 * BFS Problem Solving & Challenge Mode — Levels Configuration
 * Includes the 8 foundational graph topologies + Random Sandbox with rich icons and metadata
 */

const LEVELS_DATA = [
  {
    id: 1,
    title: "Simple Tree Traversal",
    subtitle: "Hierarchical tree structure with clean level-by-level branch expansion.",
    concept: "Simple Tree & FIFO Basics",
    type: "simple_tree",
    conceptsCount: 5,
    masteredPercent: 100,
    masteredCount: 5,
    svgIcon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    keyOperations: [
      { name: "Root Enqueue", complexity: "O(1)", icon: ">_" },
      { name: "Direct Child Discovery", complexity: "O(V+E)", icon: "wave" }
    ],
    theory: {
      summary: "In a tree, there are no cycles. Every reachable child node has exactly one parent.",
      keyRule: "Explore all Level 1 child nodes before advancing to Level 2 grandchildren.",
      tip: "Drag node A to the Queue, dequeue it, then add B and C to the REAR."
    },
    startNode: "A",
    targetNode: null,
    graph: {
      nodes: [
        { id: "A", label: "A (Root)", x: 280, y: 65, level: 0 },
        { id: "B", label: "B", x: 160, y: 180, level: 1 },
        { id: "C", label: "C", x: 400, y: 180, level: 1 },
        { id: "D", label: "D", x: 160, y: 295, level: 2 },
        { id: "E", label: "E", x: 400, y: 295, level: 2 }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "E" }
      ]
    },
    goalText: "Drag source node A into the Queue, dequeue it to the Explorer Station, and discover its children B and C.",
    mode: "standard"
  },
  {
    id: 2,
    title: "Binary Tree Exploration",
    subtitle: "Complete binary branching structure testing strict FIFO queue order.",
    concept: "Binary Tree Traversal",
    type: "binary_tree",
    conceptsCount: 7,
    masteredPercent: 95,
    masteredCount: 6,
    svgIcon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="3"/><circle cx="6" cy="19" r="3"/><circle cx="18" cy="19" r="3"/><path d="M12 8v4m0 0l-6 4m6-4l6 4"/></svg>`,
    keyOperations: [
      { name: "FIFO Child Queuing", complexity: "O(1)", icon: "search" },
      { name: "Level-Ordered Processing", complexity: "O(V)", icon: "wave" }
    ],
    theory: {
      summary: "Each parent has up to two children (left and right). BFS visits left and right before any grandchildren.",
      keyRule: "Enqueued items wait in line at the REAR and are dequeued from the FRONT in exact arrival order.",
      tip: "After dequeuing A and enqueuing B and C, B must be dequeued next before C."
    },
    startNode: "A",
    targetNode: null,
    graph: {
      nodes: [
        { id: "A", label: "A (Root)", x: 280, y: 55, level: 0 },
        { id: "B", label: "B", x: 150, y: 165, level: 1 },
        { id: "C", label: "C", x: 410, y: 165, level: 1 },
        { id: "D", label: "D", x: 90,  y: 285, level: 2 },
        { id: "E", label: "E", x: 210, y: 285, level: 2 },
        { id: "F", label: "F", x: 350, y: 285, level: 2 },
        { id: "G", label: "G", x: 470, y: 285, level: 2 }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "B", to: "E" },
        { from: "C", to: "F" },
        { from: "C", to: "G" }
      ]
    },
    goalText: "Traverse the binary tree level-by-level: Level 0 (A) → Level 1 (B, C) → Level 2 (D, E, F, G).",
    mode: "standard"
  },
  {
    id: 3,
    title: "Undirected Graph",
    subtitle: "Multiple interconnected pathways requiring systematic exploration.",
    concept: "Undirected Graph Discovery",
    type: "undirected_graph",
    conceptsCount: 6,
    masteredPercent: 90,
    masteredCount: 5,
    svgIcon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/><line x1="18" y1="8" x2="18" y2="16"/></svg>`,
    keyOperations: [
      { name: "Bidirectional Neighbor Probe", complexity: "O(1)", icon: ">_" },
      { name: "Multi-branch Enqueue", complexity: "O(E)", icon: "search" }
    ],
    theory: {
      summary: "Edges are bidirectional. When at node B, edge (B, A) exists, but since A is already discovered, do not re-add A.",
      keyRule: "Only discover UNVISITED neighbors. Skip neighbors already in the Visited Set or Queue.",
      tip: "Watch how BFS effortlessly discovers the shortest hop distance to all nodes."
    },
    startNode: "A",
    targetNode: null,
    graph: {
      nodes: [
        { id: "A", label: "A (Start)", x: 110, y: 180, level: 0 },
        { id: "B", label: "B", x: 250, y: 80, level: 1 },
        { id: "C", label: "C", x: 250, y: 280, level: 1 },
        { id: "D", label: "D", x: 400, y: 80, level: 2 },
        { id: "E", label: "E", x: 400, y: 280, level: 2 },
        { id: "F", label: "F", x: 500, y: 180, level: 2 }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "B", to: "E" },
        { from: "C", to: "E" },
        { from: "D", to: "F" },
        { from: "E", to: "F" }
      ]
    },
    goalText: "Explore the interconnected graph. Notice how multiple paths lead to E and F, but BFS picks the earliest discovery parent.",
    mode: "standard"
  },
  {
    id: 4,
    title: "Cyclic Graph & Visited Set",
    subtitle: "Contains circular loops (cycles) demonstrating the vital role of the Visited Set.",
    concept: "Cycles & Visited Set Guard",
    type: "cyclic_graph",
    conceptsCount: 8,
    masteredPercent: 85,
    masteredCount: 7,
    svgIcon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><polyline points="12 3 16 7 12 11"/><path d="M16 7A9 9 0 0 0 5 16"/></svg>`,
    keyOperations: [
      { name: "Visited Set Lookup Check", complexity: "O(1)", icon: "search" },
      { name: "Cycle Edge Discard", complexity: "O(1)", icon: ">_" }
    ],
    theory: {
      summary: "Graphs with cycles create infinite loop traps if visited states are not recorded. Mark nodes when first discovered!",
      keyRule: "If a node is already in the Queue or Visited Set, do NOT add it to the Spanning Tree or Queue again.",
      tip: "Try dragging an already discovered neighbor to see the educational cycle warning."
    },
    startNode: "A",
    targetNode: null,
    graph: {
      nodes: [
        { id: "A", label: "A (Start)", x: 280, y: 55, level: 0 },
        { id: "B", label: "B", x: 150, y: 160, level: 1 },
        { id: "C", label: "C", x: 410, y: 160, level: 1 },
        { id: "D", label: "D", x: 200, y: 275, level: 2 },
        { id: "E", label: "E", x: 360, y: 275, level: 2 },
        { id: "F", label: "F", x: 280, y: 350, level: 3 }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "C" }, // Cross edge (Cycle!)
        { from: "B", to: "D" },
        { from: "C", to: "E" },
        { from: "D", to: "E" }, // Cross edge (Cycle!)
        { from: "D", to: "F" },
        { from: "E", to: "F" }  // Cross edge (Cycle!)
      ]
    },
    goalText: "Traverse the cyclic network. Verify that exactly V - 1 = 5 tree edges are created while cycle edges are omitted.",
    mode: "standard"
  },
  {
    id: 5,
    title: "Dense Interconnected Graph",
    subtitle: "High edge-to-vertex ratio with numerous intersecting connections.",
    concept: "Dense Graph Frontier Exploration",
    type: "dense_graph",
    conceptsCount: 9,
    masteredPercent: 80,
    masteredCount: 7,
    svgIcon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>`,
    keyOperations: [
      { name: "Adjacency List Sweep", complexity: "O(deg(v))", icon: "search" },
      { name: "Frontier Queue Batching", complexity: "O(1)", icon: "wave" }
    ],
    theory: {
      summary: "In dense graphs, each node has many neighbors. Process all unvisited neighbors of the current node before dequeuing the next.",
      keyRule: "All unvisited neighbors are queued at the REAR, expanding the BFS frontier cleanly.",
      tip: "Check the Active Explorer Station to see all unvisited neighbors highlighted on the canvas."
    },
    startNode: "S",
    targetNode: null,
    graph: {
      nodes: [
        { id: "S", label: "S (Start)", x: 80, y: 190, level: 0 },
        { id: "A", label: "A", x: 210, y: 70, level: 1 },
        { id: "B", label: "B", x: 210, y: 190, level: 1 },
        { id: "C", label: "C", x: 210, y: 310, level: 1 },
        { id: "D", label: "D", x: 380, y: 90, level: 2 },
        { id: "E", label: "E", x: 380, y: 230, level: 2 },
        { id: "T", label: "T", x: 500, y: 190, level: 3 }
      ],
      edges: [
        { from: "S", to: "A" },
        { from: "S", to: "B" },
        { from: "S", to: "C" },
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "A", to: "D" },
        { from: "A", to: "E" },
        { from: "B", to: "D" },
        { from: "B", to: "E" },
        { from: "C", to: "E" },
        { from: "D", to: "E" },
        { from: "D", to: "T" },
        { from: "E", to: "T" }
      ]
    },
    goalText: "Manage the dense frontier! Add all unvisited neighbors of S (A, B, C), then explore level 1 nodes systematically.",
    mode: "standard"
  },
  {
    id: 6,
    title: "Disconnected Graph Components",
    subtitle: "Isolated island components teaching reachable vs unreachable vertices.",
    concept: "Reachable vs Unreachable Components",
    type: "disconnected_graph",
    conceptsCount: 7,
    masteredPercent: 75,
    masteredCount: 5,
    svgIcon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="6" y1="9" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><line x1="18" y1="9" x2="18" y2="15"/><line x1="10" y1="12" x2="14" y2="12" stroke-dasharray="2 2"/></svg>`,
    keyOperations: [
      { name: "Component Frontier Exhaustion", complexity: "O(V_c + E_c)", icon: "search" },
      { name: "Unreachable Isolation Check", complexity: "O(1)", icon: ">_" }
    ],
    theory: {
      summary: "BFS starting from source S will ONLY visit vertices in the connected component of S. Unreachable islands remain unvisited.",
      keyRule: "When the queue becomes empty, the BFS traversal of the current connected component is complete.",
      tip: "Nodes X and Y belong to a separate island and cannot be reached from source node A!"
    },
    startNode: "A",
    targetNode: null,
    graph: {
      nodes: [
        { id: "A", label: "A (Start)", x: 130, y: 110, level: 0 },
        { id: "B", label: "B", x: 80,  y: 250, level: 1 },
        { id: "C", label: "C", x: 210, y: 250, level: 1 },
        { id: "D", label: "D", x: 140, y: 340, level: 2 },
        { id: "X", label: "X (Isolated)", x: 420, y: 140, level: -1, isUnreachable: true },
        { id: "Y", label: "Y (Isolated)", x: 420, y: 290, level: -1, isUnreachable: true }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" },
        { from: "X", to: "Y" } // Disconnected island!
      ]
    },
    goalText: "Traverse the connected component starting from A. The traversal completes when all reachable nodes (A, B, C, D) are processed.",
    mode: "standard"
  },
  {
    id: 7,
    title: "Misleading Paths (BFS vs DFS)",
    subtitle: "Trap route challenges requiring horizontal level discipline rather than premature depth drilling.",
    concept: "Breadth-First vs Depth-First",
    type: "bfs_vs_dfs",
    conceptsCount: 8,
    masteredPercent: 70,
    masteredCount: 6,
    svgIcon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
    keyOperations: [
      { name: "Horizontal Level Invariant", complexity: "O(1)", icon: "wave" },
      { name: "Anti-DFS Queue Discipline", complexity: "O(1)", icon: "search" }
    ],
    theory: {
      summary: "DFS jumps deeply along a single path. BFS explores horizontally layer-by-layer across ALL siblings before going deeper.",
      keyRule: "Do not drill down to Level 2 until all Level 1 nodes in the queue have been dequeued and explored.",
      tip: "Even if B has a tempting long chain, you MUST finish visiting C's level 1 siblings first!"
    },
    startNode: "A",
    targetNode: null,
    graph: {
      nodes: [
        { id: "A", label: "A (Start)", x: 280, y: 55, level: 0 },
        { id: "B", label: "B", x: 150, y: 155, level: 1 },
        { id: "C", label: "C", x: 410, y: 155, level: 1 },
        { id: "D", label: "D", x: 90,  y: 255, level: 2 },
        { id: "E", label: "E", x: 210, y: 255, level: 2 },
        { id: "F", label: "F", x: 410, y: 255, level: 2 },
        { id: "G", label: "G", x: 150, y: 345, level: 3 }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "B", to: "E" },
        { from: "C", to: "F" },
        { from: "D", to: "G" },
        { from: "E", to: "G" }
      ]
    },
    goalText: "Enforce strict BFS order: Dequeue A → Enqueue B, C → Dequeue B → Enqueue D, E → Dequeue C → Enqueue F → Dequeue D...",
    mode: "standard"
  },
  {
    id: 8,
    title: "Large Network & Queue Management",
    subtitle: "Complex 9-node graph requiring meticulous FIFO queue manipulation.",
    concept: "Large Graph Queue Management",
    type: "large_graph",
    conceptsCount: 12,
    masteredPercent: 65,
    masteredCount: 7,
    svgIcon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
    keyOperations: [
      { name: "Peak Queue Load Handling", complexity: "O(W)", icon: ">_" },
      { name: "Multi-Tier Spanning Tree", complexity: "O(V+E)", icon: "search" }
    ],
    theory: {
      summary: "As graphs grow in size, the queue maintains the exact discovery wave frontier. Peak queue size equals graph width.",
      keyRule: "Always dequeue the oldest item from the FRONT and add new discoveries to the REAR.",
      tip: "Keep an eye on the Spanning Tree panel as it builds the complete shortest-path discovery tree."
    },
    startNode: "A",
    targetNode: null,
    graph: {
      nodes: [
        { id: "A", label: "A (Start)", x: 70,  y: 180, level: 0 },
        { id: "B", label: "B", x: 180, y: 80,  level: 1 },
        { id: "C", label: "C", x: 180, y: 280, level: 1 },
        { id: "D", label: "D", x: 290, y: 40,  level: 2 },
        { id: "E", label: "E", x: 290, y: 180, level: 2 },
        { id: "F", label: "F", x: 290, y: 320, level: 2 },
        { id: "G", label: "G", x: 400, y: 90,  level: 3 },
        { id: "H", label: "H", x: 400, y: 270, level: 3 },
        { id: "I", label: "I", x: 500, y: 180, level: 4 }
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "B", to: "E" },
        { from: "C", to: "E" },
        { from: "C", to: "F" },
        { from: "D", to: "G" },
        { from: "E", to: "G" },
        { from: "E", to: "H" },
        { from: "F", to: "H" },
        { from: "G", to: "I" },
        { from: "H", to: "I" }
      ]
    },
    goalText: "Conquer the 9-node network! Verify all 8 discovery tree edges and calculate the shortest hops to node I.",
    mode: "standard"
  },
  {
    id: 9,
    title: "Master Challenge & Labyrinth",
    subtitle: "Full-scale maze with speed challenge timer and shortest-path reconstruction.",
    concept: "Comprehensive BFS Mastery",
    type: "master_sandbox",
    conceptsCount: 15,
    masteredPercent: 95,
    masteredCount: 14,
    svgIcon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    keyOperations: [
      { name: "Full Graph Traversal", complexity: "O(V+E)", icon: "search" },
      { name: "Shortest Path Reconstruct", complexity: "O(V)", icon: ">_" }
    ],
    theory: {
      summary: "You are now a BFS Master! Explore any graph structure, avoid dead-ends, and reconstruct shortest paths.",
      keyRule: "FIFO queue + Visited Set = Guaranteed unweighted shortest path in O(V + E) time.",
      tip: "Navigate level by level to reach EXIT in minimum hops."
    },
    startNode: "START",
    targetNode: "EXIT",
    timeLimitSeconds: 60,
    graph: {
      nodes: [
        { id: "START", label: "START", x: 60,  y: 180, level: 0 },
        { id: "R1",    label: "R1",    x: 165, y: 80,  level: 1 },
        { id: "R2",    label: "R2",    x: 165, y: 280, level: 1 },
        { id: "R3",    label: "R3",    x: 275, y: 40,  level: 2 },
        { id: "R4",    label: "R4",    x: 275, y: 180, level: 2 },
        { id: "R5",    label: "R5",    x: 275, y: 320, level: 2 },
        { id: "R6",    label: "R6",    x: 385, y: 100, level: 3 },
        { id: "R7",    label: "R7",    x: 385, y: 260, level: 3 },
        { id: "EXIT",  label: "EXIT",  x: 495, y: 180, level: 4 }
      ],
      edges: [
        { from: "START", to: "R1" },
        { from: "START", to: "R2" },
        { from: "R1", to: "R3" },
        { from: "R1", to: "R4" },
        { from: "R2", to: "R4" },
        { from: "R2", to: "R5" },
        { from: "R4", to: "R6" },
        { from: "R4", to: "R7" },
        { from: "R5", to: "R7" },
        { from: "R6", to: "EXIT" },
        { from: "R7", to: "EXIT" }
      ]
    },
    goalText: "Master the labyrinth! Discover the EXIT in minimum hops, generate the spanning tree, and watch shortest path reconstruction.",
    mode: "challenge"
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LEVELS_DATA };
}
