/**
 * BFS Adventure - Mastery Quiz Question Bank
 * Covers the complete spectrum of BFS concepts with instant explanations
 */

const QUIZ_QUESTIONS = [
  {
    id: 1,
    category: "Queue & Traversal",
    question: "Which data structure is fundamentally used by Breadth First Search (BFS) to maintain level-by-level order?",
    options: [
      { id: "A", text: "Queue (First-In, First-Out)", correct: true },
      { id: "B", text: "Stack (Last-In, First-Out)", correct: false },
      { id: "C", text: "Priority Queue without weights", correct: false },
      { id: "D", text: "Binary Search Tree", correct: false }
    ],
    explanation: "BFS relies on a standard FIFO Queue so that nodes discovered earlier (at lower levels) are explored before nodes discovered later."
  },
  {
    id: 2,
    category: "Shortest Path",
    question: "Why does BFS guarantee the shortest path in an unweighted graph?",
    options: [
      { id: "A", text: "Because it sorts the edge weights dynamically.", correct: false },
      { id: "B", text: "Because it explores all nodes at distance k before exploring distance k+1.", correct: true },
      { id: "C", text: "Because it backtracks when it encounters a dead end.", correct: false },
      { id: "D", text: "Because it visits leaf nodes first.", correct: false }
    ],
    explanation: "BFS expands in concentric rings: all distance 1 nodes are explored before distance 2 nodes, ensuring the first time the target is found is via the minimum number of hops."
  },
  {
    id: 3,
    category: "Visited Set & Cycles",
    question: "What happens if you run BFS on a graph with cycles without maintaining a 'visited' set?",
    options: [
      { id: "A", text: "The algorithm automatically skips the cycles.", correct: false },
      { id: "B", text: "The graph turns into a binary tree.", correct: false },
      { id: "C", text: "An infinite loop occurs because nodes are repeatedly added back to the queue.", correct: true },
      { id: "D", text: "The time complexity improves to O(V).", correct: false }
    ],
    explanation: "Without marking nodes as visited/discovered, adjacent nodes in a cycle will continuously re-enqueue each other forever."
  },
  {
    id: 4,
    category: "Complexity Analysis",
    question: "What is the time complexity of BFS on a graph with V vertices and E edges using an adjacency list?",
    options: [
      { id: "A", text: "O(V * E)", correct: false },
      { id: "B", text: "O(V + E)", correct: true },
      { id: "C", text: "O(V^2)", correct: false },
      { id: "D", text: "O(log V)", correct: false }
    ],
    explanation: "Each vertex is enqueued and dequeued at most once (O(V)), and every edge is traversed/checked once (O(E)), yielding O(V + E)."
  },
  {
    id: 5,
    category: "BFS vs DFS",
    question: "If we replace the Queue in BFS with a Stack (LIFO), what traversal algorithm do we get?",
    options: [
      { id: "A", text: "Depth First Search (DFS)", correct: true },
      { id: "B", text: "Dijkstra's Algorithm", correct: false },
      { id: "C", text: "A* Search", correct: false },
      { id: "D", text: "Kruskal's Algorithm", correct: false }
    ],
    explanation: "A Stack processes the most recently discovered node first (Last-In, First-Out), which drives the search deep along a branch before backtracking — exactly DFS."
  },
  {
    id: 6,
    category: "Queue Cycle",
    question: "In the 3-step BFS loop, what is the exact order of operations?",
    options: [
      { id: "A", text: "Enqueue neighbors ➔ Explore ➔ Dequeue front", correct: false },
      { id: "B", text: "Dequeue front ➔ Explore connected edges ➔ Enqueue unvisited neighbors", correct: true },
      { id: "C", text: "Explore all nodes ➔ Dequeue everything ➔ Mark root visited", correct: false },
      { id: "D", text: "Dequeue front ➔ Clear visited set ➔ Repeat", correct: false }
    ],
    explanation: "The standard BFS cycle: 1. Dequeue front node from queue, 2. Explore its neighbors, 3. Enqueue any neighbor that is not yet visited."
  },
  {
    id: 7,
    category: "Levels & Distance",
    question: "If Start Node A is at Level 0, and has neighbors B and C, and B connects to D, what is the BFS Level of D?",
    options: [
      { id: "A", text: "Level 1", correct: false },
      { id: "B", text: "Level 2", correct: true },
      { id: "C", text: "Level 3", correct: false },
      { id: "D", text: "Level 0", correct: false }
    ],
    explanation: "A is at Level 0. Neighbors B and C are at Level 1. D is a neighbor of B, so Level(D) = Level(B) + 1 = 1 + 1 = Level 2."
  },
  {
    id: 8,
    category: "Debugging BFS",
    question: "A student's BFS traversal order is [A, B, D, C, E] on a graph where A connects to (B, C), and B connects to D. What is the bug?",
    options: [
      { id: "A", text: "Node D (Level 2) was visited before finishing Level 1 (Node C) — this is DFS, not BFS.", correct: true },
      { id: "B", text: "Node A should have been visited last.", correct: false },
      { id: "C", text: "Node E cannot be reached in BFS.", correct: false },
      { id: "D", text: "There is no bug, BFS allows any random order.", correct: false }
    ],
    explanation: "BFS strictly explores horizontally layer-by-layer. All nodes at Level 1 (both B and C) MUST be dequeued and explored before any node at Level 2 (D) is explored."
  },
  {
    id: 9,
    category: "Space Complexity",
    question: "What is the worst-case auxiliary space complexity of BFS on an unweighted graph with V vertices and E edges?",
    options: [
      { id: "A", text: "O(1) auxiliary space", correct: false },
      { id: "B", text: "O(log V) auxiliary space", correct: false },
      { id: "C", text: "O(V) because in the worst case (e.g. star or complete bipartite graph), the queue can hold up to V vertices.", correct: true },
      { id: "D", text: "O(E^2) auxiliary space", correct: false }
    ],
    explanation: "In the worst case (such as a star graph where the root node connects to all remaining V-1 nodes), all child nodes are enqueued at once, requiring O(V) auxiliary queue memory."
  },
  {
    id: 10,
    category: "BFS Applications",
    question: "Which classical graph problem can be solved directly by coloring vertices during a BFS traversal?",
    options: [
      { id: "A", text: "Checking whether an undirected graph is bipartite (2-colorable)", correct: true },
      { id: "B", text: "Finding the minimum spanning tree of a weighted graph", correct: false },
      { id: "C", text: "Finding the longest simple path in a graph", correct: false },
      { id: "D", text: "Solving the Traveling Salesperson Problem in polynomial time", correct: false }
    ],
    explanation: "By assigning alternating colors (or parity of distances) to successive BFS levels, any edge connecting two vertices of the same color proves the graph has an odd cycle and is not bipartite."
  }
];

if (typeof window !== 'undefined') {
  window.QUIZ_QUESTIONS = QUIZ_QUESTIONS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QUIZ_QUESTIONS };
}

