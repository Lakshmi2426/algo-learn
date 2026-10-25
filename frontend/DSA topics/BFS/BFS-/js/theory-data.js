/**
 * AlgoLearn - Breadth First Search (BFS) Theory Curriculum Data
 * 12 Comprehensive Chapters covering Graph Traversal, FIFO Queue Dynamics, and Shortest Paths
 * With Topic-Specific Code Implementations in C, C++, Java, and Python
 */

const THEORY_MODULES = [
  /* ─────────────────────────────────────────────────────────────
     CHAPTER 01 — GRAPH REPRESENTATION & FOUNDATIONS
  ───────────────────────────────────────────────────────────── */
  {
    id: "graph-foundations",
    chapterNum: "01",
    category: "FUNDAMENTALS",
    readTime: "2 MIN",
    title: "1. GRAPH REPRESENTATION & FOUNDATIONS",
    tocTitle: "01 Graph Foundations",
    execDefinition: "A graph G = (V, E) is a non-linear data structure consisting of a set of vertices (nodes) V and a collection of edges (connections) E that link pairs of vertices.",
    analogy: "Think of a graph like an airline flight network: cities are vertices, and direct non-stop flight paths between cities are edges.",
    specs: [
      "Graphs can be directed (one-way streets) or undirected (bidirectional roadways).",
      "Graphs can be unweighted (all edges have unit cost = 1) or weighted (edges have distances/costs).",
      "Adjacency List: Space-efficient O(V + E) representation storing adjacent neighbors per node.",
      "Adjacency Matrix: O(V²) 2D lookup table providing O(1) edge existence queries."
    ],
    formula: "Graph G = (V, E) | Density = |E| / (|V| · (|V| - 1))",
    diagram: {
      step1Title: "1. GRAPH VERTICES",
      step1Val: "V = {A, B, C, D}",
      step2Title: "2. EDGE RELATIONS",
      step2Val: "E = {(A,B), (A,C), (B,D)}",
      step3Title: "3. ADJACENCY LIST",
      step3Val: "A: [B, C], B: [D]",
      step4Title: "4. GRAPH TYPE",
      step4Val: "Unweighted Graph",
      trayLabel: "GRAPH NODE ADJACENCY STRUCTURE:",
      items: [
        { label: "Node A", val: "➔ [B, C]", active: true },
        { label: "Node B", val: "➔ [D]", active: false },
        { label: "Node C", val: "➔ []", active: false },
        { label: "Node D", val: "➔ []", active: false }
      ]
    },
    codeImplementations: {
      c: `#include <stdio.h>
#include <stdlib.h>

#define MAX_VERTICES 5

// Node structure for Adjacency List
struct AdjListNode {
    int dest;
    struct AdjListNode* next;
};

// Graph structure containing adjacency list array and matrix
struct Graph {
    int numVertices;
    struct AdjListNode* adjLists[MAX_VERTICES];
    int adjMatrix[MAX_VERTICES][MAX_VERTICES];
};

// Create a new adjacency list node
struct AdjListNode* createNode(int dest) {
    struct AdjListNode* newNode = (struct AdjListNode*)malloc(sizeof(struct AdjListNode));
    newNode->dest = dest;
    newNode->next = NULL;
    return newNode;
}

// Initialize Graph structure
struct Graph* createGraph(int vertices) {
    struct Graph* graph = (struct Graph*)malloc(sizeof(struct Graph));
    graph->numVertices = vertices;
    for (int i = 0; i < vertices; i++) {
        graph->adjLists[i] = NULL;
        for (int j = 0; j < vertices; j++) {
            graph->adjMatrix[i][j] = 0;
        }
    }
    return graph;
}

// Add an undirected edge (u, v)
void addEdge(struct Graph* graph, int src, int dest) {
    // 1. Update Adjacency Matrix O(1)
    graph->adjMatrix[src][dest] = 1;
    graph->adjMatrix[dest][src] = 1;

    // 2. Update Adjacency List (add dest to src list)
    struct AdjListNode* newNode = createNode(dest);
    newNode->next = graph->adjLists[src];
    graph->adjLists[src] = newNode;

    // Add src to dest list (since graph is undirected)
    newNode = createNode(src);
    newNode->next = graph->adjLists[dest];
    graph->adjLists[dest] = newNode;
}

void printGraph(struct Graph* graph) {
    printf("--- ADJACENCY MATRIX (O(V^2)) ---\\n");
    for (int i = 0; i < graph->numVertices; i++) {
        for (int j = 0; j < graph->numVertices; j++) {
            printf("%d ", graph->adjMatrix[i][j]);
        }
        printf("\\n");
    }

    printf("\\n--- ADJACENCY LIST (O(V + E)) ---\\n");
    for (int v = 0; v < graph->numVertices; v++) {
        struct AdjListNode* curr = graph->adjLists[v];
        printf("Vertex %d: ", v);
        while (curr) {
            printf("-> %d ", curr->dest);
            curr = curr->next;
        }
        printf("\\n");
    }
}

int main() {
    struct Graph* graph = createGraph(5);
    addEdge(graph, 0, 1);
    addEdge(graph, 0, 4);
    addEdge(graph, 1, 2);
    addEdge(graph, 1, 3);
    addEdge(graph, 1, 4);
    addEdge(graph, 2, 3);
    addEdge(graph, 3, 4);

    printGraph(graph);
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>

class Graph {
private:
    int numVertices;
    std::vector<std::vector<int>> adjList;
    std::vector<std::vector<int>> adjMatrix;

public:
    Graph(int vertices) : numVertices(vertices) {
        adjList.resize(vertices);
        adjMatrix.assign(vertices, std::vector<int>(vertices, 0));
    }

    // Add an undirected edge (u, v)
    void addEdge(int src, int dest) {
        // Adjacency Matrix O(1) assignment
        adjMatrix[src][dest] = 1;
        adjMatrix[dest][src] = 1;

        // Adjacency List O(1) push_back
        adjList[src].push_back(dest);
        adjList[dest].push_back(src);
    }

    void printGraph() const {
        std::cout << "--- ADJACENCY MATRIX (O(V^2)) ---\\n";
        for (int i = 0; i < numVertices; ++i) {
            for (int j = 0; j < numVertices; ++j) {
                std::cout << adjMatrix[i][j] << " ";
            }
            std::cout << "\\n";
        }

        std::cout << "\\n--- ADJACENCY LIST (O(V + E)) ---\\n";
        for (int i = 0; i < numVertices; ++i) {
            std::cout << "Vertex " << i << ": ";
            for (int neighbor : adjList[i]) {
                std::cout << "-> " << neighbor << " ";
            }
            std::cout << "\\n";
        }
    }
};

int main() {
    Graph g(5);
    g.addEdge(0, 1);
    g.addEdge(0, 4);
    g.addEdge(1, 2);
    g.addEdge(1, 3);
    g.addEdge(1, 4);
    g.addEdge(2, 3);
    g.addEdge(3, 4);

    g.printGraph();
    return 0;
}`,
      java: `import java.util.ArrayList;
import java.util.List;

public class GraphFoundations {
    private int numVertices;
    private List<List<Integer>> adjList;
    private int[][] adjMatrix;

    public GraphFoundations(int vertices) {
        this.numVertices = vertices;
        this.adjMatrix = new int[vertices][vertices];
        this.adjList = new ArrayList<>();
        for (int i = 0; i < vertices; i++) {
            adjList.add(new ArrayList<>());
        }
    }

    // Add an undirected edge between src and dest
    public void addEdge(int src, int dest) {
        // 1. Adjacency Matrix update
        adjMatrix[src][dest] = 1;
        adjMatrix[dest][src] = 1;

        // 2. Adjacency List update
        adjList.get(src).add(dest);
        adjList.get(dest).add(src);
    }

    public void printGraph() {
        System.out.println("--- ADJACENCY MATRIX (O(V^2)) ---");
        for (int i = 0; i < numVertices; i++) {
            for (int j = 0; j < numVertices; j++) {
                System.out.print(adjMatrix[i][j] + " ");
            }
            System.out.println();
        }

        System.out.println("\\n--- ADJACENCY LIST (O(V + E)) ---");
        for (int i = 0; i < numVertices; i++) {
            System.out.print("Vertex " + i + ": ");
            for (int neighbor : adjList.get(i)) {
                System.out.print("-> " + neighbor + " ");
            }
            System.out.println();
        }
    }

    public static void main(String[] args) {
        GraphFoundations g = new GraphFoundations(5);
        g.addEdge(0, 1);
        g.addEdge(0, 4);
        g.addEdge(1, 2);
        g.addEdge(1, 3);
        g.addEdge(1, 4);
        g.addEdge(2, 3);
        g.addEdge(3, 4);

        g.printGraph();
    }
}`,
      python: `class Graph:
    def __init__(self, vertices: int):
        self.num_vertices = vertices
        # Adjacency List (Dictionary of lists)
        self.adj_list = {i: [] for i in range(vertices)}
        # Adjacency Matrix (2D List)
        self.adj_matrix = [[0] * vertices for _ in range(vertices)]

    def add_edge(self, src: int, dest: int):
        """Add an undirected edge (src, dest) to the graph."""
        # 1. Update Adjacency Matrix
        self.adj_matrix[src][dest] = 1
        self.adj_matrix[dest][src] = 1

        # 2. Update Adjacency List
        self.adj_list[src].append(dest)
        self.adj_list[dest].append(src)

    def print_graph(self):
        print("--- ADJACENCY MATRIX (O(V^2)) ---")
        for row in self.adj_matrix:
            print(" ".join(map(str, row)))

        print("\\n--- ADJACENCY LIST (O(V + E)) ---")
        for vertex, neighbors in self.adj_list.items():
            neighbors_str = " -> ".join(map(str, neighbors))
            print(f"Vertex {vertex}: -> {neighbors_str}")

if __name__ == "__main__":
    g = Graph(5)
    g.add_edge(0, 1)
    g.add_edge(0, 4)
    g.add_edge(1, 2)
    g.add_edge(1, 3)
    g.add_edge(1, 4)
    g.add_edge(2, 3)
    g.add_edge(3, 4)

    g.print_graph()`
    }
  },

  /* ─────────────────────────────────────────────────────────────
     CHAPTER 02 — WHAT IS BREADTH FIRST SEARCH (BFS)?
  ───────────────────────────────────────────────────────────── */
  {
    id: "what-is-bfs",
    chapterNum: "02",
    category: "CORE ALGORITHM",
    readTime: "3 MIN",
    title: "2. WHAT IS BREADTH FIRST SEARCH (BFS)?",
    tocTitle: "02 What is BFS?",
    execDefinition: "An exhaustive level-order graph traversal algorithm that visits all neighbor vertices at the current depth distance before proceeding to vertices at the next depth level.",
    analogy: "Dropping a pebble into a calm pond: the ripples expand outward in perfect concentric rings. BFS explores node neighbors in exactly the same expanding concentric waves.",
    specs: [
      "Systematic level-by-level exploration starting from a designated source root vertex.",
      "Guarantees that vertices at distance k are completely processed before any vertex at distance k+1.",
      "Discovers the shortest path (minimum edge count) from the start vertex to all reachable vertices in unweighted graphs.",
      "Visits every reachable vertex and explores every reachable edge in deterministic order."
    ],
    formula: "Level(v) = Level(u) + 1 for each undiscovered neighbor v of u",
    diagram: {
      step1Title: "1. SOURCE ROOT",
      step1Val: "Node A (Level 0)",
      step2Title: "2. WAVE EXPANSION",
      step2Val: "Level 0 ➔ Level 1 ➔ Level 2",
      step3Title: "3. DISCOVERED",
      step3Val: "Level 1: [B, C]",
      step4Title: "4. TRAVERSAL ORDER",
      step4Val: "A ➔ B ➔ C ➔ D ➔ E",
      trayLabel: "BFS CONCENTRIC DISTANCE TIERS:",
      items: [
        { label: "L0", val: "Root A (dist: 0)", active: true },
        { label: "L1", val: "Node B (dist: 1)", active: false },
        { label: "L1", val: "Node C (dist: 1)", active: false },
        { label: "L2", val: "Node D (dist: 2)", active: false },
        { label: "L2", val: "Node E (dist: 2)", active: false }
      ]
    },
    codeImplementations: {
      c: `#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

#define MAX 100

// Simple Array-based FIFO Queue
struct Queue {
    int items[MAX];
    int front;
    int rear;
};

void initQueue(struct Queue* q) {
    q->front = 0;
    q->rear = -1;
}

bool isEmpty(struct Queue* q) {
    return q->front > q->rear;
}

void enqueue(struct Queue* q, int value) {
    if (q->rear < MAX - 1) {
        q->items[++(q->rear)] = value;
    }
}

int dequeue(struct Queue* q) {
    return q->items[(q->front)++];
}

// Graph Representation with Adjacency Matrix
struct Graph {
    int numVertices;
    int adjMatrix[MAX][MAX];
};

struct Graph* createGraph(int vertices) {
    struct Graph* g = (struct Graph*)malloc(sizeof(struct Graph));
    g->numVertices = vertices;
    for (int i = 0; i < vertices; i++) {
        for (int j = 0; j < vertices; j++) g->adjMatrix[i][j] = 0;
    }
    return g;
}

void addEdge(struct Graph* g, int u, int v) {
    g->adjMatrix[u][v] = 1;
    g->adjMatrix[v][u] = 1;
}

// Fundamental Breadth First Search (BFS) Traversal
void bfs(struct Graph* g, int startVertex) {
    bool visited[MAX] = {false};
    struct Queue q;
    initQueue(&q);

    // 1. Mark start vertex as visited and enqueue
    visited[startVertex] = true;
    enqueue(&q, startVertex);

    printf("BFS Traversal starting from vertex %d: ", startVertex);

    while (!isEmpty(&q)) {
        // 2. Dequeue front vertex
        int currVertex = dequeue(&q);
        printf("%d ", currVertex);

        // 3. Explore all adjacent neighbors
        for (int neighbor = 0; neighbor < g->numVertices; neighbor++) {
            if (g->adjMatrix[currVertex][neighbor] == 1 && !visited[neighbor]) {
                visited[neighbor] = true;
                enqueue(&q, neighbor);
            }
        }
    }
    printf("\\n");
}

int main() {
    struct Graph* g = createGraph(6);
    addEdge(g, 0, 1);
    addEdge(g, 0, 2);
    addEdge(g, 1, 3);
    addEdge(g, 1, 4);
    addEdge(g, 2, 4);
    addEdge(g, 3, 5);
    addEdge(g, 4, 5);

    bfs(g, 0); // Output: 0 1 2 3 4 5
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>
#include <queue>

class Graph {
private:
    int V;
    std::vector<std::vector<int>> adj;

public:
    Graph(int vertices) : V(vertices), adj(vertices) {}

    void addEdge(int u, int v) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    // Breadth First Search starting from startVertex
    void bfs(int startVertex) {
        std::vector<bool> visited(V, false);
        std::queue<int> q;

        // Step 1: Discover root, mark visited, push to FIFO queue
        visited[startVertex] = true;
        q.push(startVertex);

        std::cout << "BFS Traversal starting from vertex " << startVertex << ": ";

        while (!q.empty()) {
            // Step 2: Pop earliest discovered node from front
            int curr = q.front();
            q.pop();
            std::cout << curr << " ";

            // Step 3: Explore all unvisited neighbors
            for (int neighbor : adj[curr]) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true; // Mark visited upon enqueue
                    q.push(neighbor);
                }
            }
        }
        std::cout << "\\n";
    }
};

int main() {
    Graph g(6);
    g.addEdge(0, 1);
    g.addEdge(0, 2);
    g.addEdge(1, 3);
    g.addEdge(1, 4);
    g.addEdge(2, 4);
    g.addEdge(3, 5);
    g.addEdge(4, 5);

    g.bfs(0); // Expected: 0 1 2 3 4 5
    return 0;
}`,
      java: `import java.util.*;

public class BasicBFS {
    private int vertices;
    private List<List<Integer>> adj;

    public BasicBFS(int vertices) {
        this.vertices = vertices;
        adj = new ArrayList<>(vertices);
        for (int i = 0; i < vertices; i++) {
            adj.add(new ArrayList<>());
        }
    }

    public void addEdge(int u, int v) {
        adj.get(u).add(v);
        adj.get(v).add(u);
    }

    // Breadth First Search traversal
    public void bfs(int startVertex) {
        boolean[] visited = new boolean[vertices];
        Queue<Integer> queue = new LinkedList<>();

        // Enqueue root and mark as visited
        visited[startVertex] = true;
        queue.offer(startVertex);

        System.out.print("BFS Traversal starting from vertex " + startVertex + ": ");

        while (!queue.isEmpty()) {
            int curr = queue.poll();
            System.out.print(curr + " ");

            for (int neighbor : adj.get(curr)) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    queue.offer(neighbor);
                }
            }
        }
        System.out.println();
    }

    public static void main(String[] args) {
        BasicBFS g = new BasicBFS(6);
        g.addEdge(0, 1);
        g.addEdge(0, 2);
        g.addEdge(1, 3);
        g.addEdge(1, 4);
        g.addEdge(2, 4);
        g.addEdge(3, 5);
        g.addEdge(4, 5);

        g.bfs(0); // Output: 0 1 2 3 4 5
    }
}`,
      python: `from collections import deque
from typing import Dict, List

class Graph:
    def __init__(self, vertices: int):
        self.V = vertices
        self.adj: Dict[int, List[int]] = {i: [] for i in range(vertices)}

    def add_edge(self, u: int, v: int):
        self.adj[u].append(v)
        self.adj[v].append(u)

    def bfs(self, start_vertex: int):
        """Perform standard BFS traversal starting from start_vertex."""
        visited = set()
        queue = deque([start_vertex])
        visited.add(start_vertex)

        traversal_order = []

        while queue:
            # Pop the front element (FIFO)
            curr = queue.popleft()
            traversal_order.append(curr)

            # Enqueue all unvisited adjacent neighbors
            for neighbor in self.adj[curr]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)

        print(f"BFS Traversal starting from vertex {start_vertex}:", *traversal_order)
        return traversal_order

if __name__ == "__main__":
    g = Graph(6)
    g.add_edge(0, 1)
    g.add_edge(0, 2)
    g.add_edge(1, 3)
    g.add_edge(1, 4)
    g.add_edge(2, 4)
    g.add_edge(3, 5)
    g.add_edge(4, 5)

    g.bfs(0) # Output: 0 1 2 3 4 5`
    }
  },

  /* ─────────────────────────────────────────────────────────────
     CHAPTER 03 — THE FIFO QUEUE ENGINE
  ───────────────────────────────────────────────────────────── */
  {
    id: "fifo-queue-engine",
    chapterNum: "03",
    category: "ENGINE & MECHANICS",
    readTime: "3 MIN",
    title: "3. THE FIFO QUEUE ENGINE",
    tocTitle: "03 The FIFO Queue Engine",
    execDefinition: "A First-In, First-Out (FIFO) sequential buffer that enforces level-by-level traversal order by staging discovered frontier vertices at the back and serving exploration candidates from the front.",
    analogy: "A polite queue at a ticket counter: people who arrive earlier stand near the front and get served first. Newer arrivals join the back and wait their turn.",
    specs: [
      "Enqueue (Push Back): Appends newly discovered neighbor vertices into the rear of the queue in O(1) time.",
      "Dequeue (Pop Front): Removes the earliest discovered vertex from the front of the queue in O(1) time.",
      "Ensures strictly non-decreasing distance ordering: elements in the queue always have distances d or d+1.",
      "Maintains the BFS 3-step engine loop: Dequeue Front ➔ Explore Adjacent Neighbors ➔ Enqueue Unvisited."
    ],
    formula: "Queue Invariant: dist(head) ≤ dist(tail) ≤ dist(head) + 1",
    diagram: {
      step1Title: "1. ENQUEUE ROOT",
      step1Val: "Push A into Queue",
      step2Title: "2. DEQUEUE FRONT",
      step2Val: "Pop A ➔ Explore",
      step3Title: "3. ENQUEUE NEIGHBORS",
      step3Val: "Push B, C to Rear",
      step4Title: "4. CURRENT STATE",
      step4Val: "Front: B | Rear: C",
      trayLabel: "FIFO QUEUE WAITING LINE (FRONT ➔ REAR):",
      items: [
        { label: "[FRONT]", val: "Node B", active: true },
        { label: "[SLOT 1]", val: "Node C", active: true },
        { label: "[SLOT 2]", val: "Node D", active: false },
        { label: "[REAR]", val: "Node E", active: false }
      ]
    },
    codeImplementations: {
      c: `#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

#define CAPACITY 20

// Custom FIFO Circular Queue Structure
struct FIFOQueue {
    int data[CAPACITY];
    int front;
    int rear;
    int size;
};

void initQueue(struct FIFOQueue* q) {
    q->front = 0;
    q->rear = -1;
    q->size = 0;
}

bool isFull(struct FIFOQueue* q) {
    return q->size == CAPACITY;
}

bool isEmpty(struct FIFOQueue* q) {
    return q->size == 0;
}

// O(1) Enqueue (Push to Rear)
void enqueue(struct FIFOQueue* q, int val) {
    if (isFull(q)) {
        printf("Queue Overflow!\\n");
        return;
    }
    q->rear = (q->rear + 1) % CAPACITY;
    q->data[q->rear] = val;
    q->size++;
    printf("  [ENQUEUE] Pushed vertex %d to rear (Queue size: %d)\\n", val, q->size);
}

// O(1) Dequeue (Pop from Front)
int dequeue(struct FIFOQueue* q) {
    if (isEmpty(q)) {
        printf("Queue Underflow!\\n");
        return -1;
    }
    int val = q->data[q->front];
    q->front = (q->front + 1) % CAPACITY;
    q->size--;
    printf("  [DEQUEUE] Popped vertex %d from front (Queue size: %d)\\n", val, q->size);
    return val;
}

// Demonstrate Queue Engine driving BFS
void runQueueBFS(int adj[5][5], int V, int start) {
    bool visited[5] = {false};
    struct FIFOQueue q;
    initQueue(&q);

    printf("=== INITIALIZING BFS FIFO QUEUE ENGINE ===\\n");
    visited[start] = true;
    enqueue(&q, start);

    while (!isEmpty(&q)) {
        int u = dequeue(&q);
        printf("Exploring neighbors of vertex %d:\\n", u);

        for (int v = 0; v < V; v++) {
            if (adj[u][v] == 1 && !visited[v]) {
                visited[v] = true;
                enqueue(&q, v);
            }
        }
    }
    printf("=== QUEUE ENGINE COMPLETED ===\\n");
}

int main() {
    int adj[5][5] = {
        {0, 1, 1, 0, 0},
        {1, 0, 0, 1, 1},
        {1, 0, 0, 0, 1},
        {0, 1, 0, 0, 1},
        {0, 1, 1, 1, 0}
    };

    runQueueBFS(adj, 5, 0);
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>
#include <queue>

// BFS FIFO Queue Engine Demonstration
void runQueueEngineBFS(const std::vector<std::vector<int>>& adj, int start) {
    int V = adj.size();
    std::vector<bool> visited(V, false);
    std::queue<int> q;

    std::cout << "=== INITIALIZING BFS FIFO QUEUE ENGINE ===\\n";
    
    // 1. Enqueue root
    visited[start] = true;
    q.push(start);
    std::cout << "  [ENQUEUE] Pushed start node " << start << " (Queue size: " << q.size() << ")\\n";

    while (!q.empty()) {
        // 2. Dequeue front element
        int curr = q.front();
        q.pop();
        std::cout << "  [DEQUEUE] Popped node " << curr << " from front (Remaining in queue: " << q.size() << ")\\n";

        // 3. Enqueue all undiscovered neighbors to the rear
        for (int neighbor : adj[curr]) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                q.push(neighbor);
                std::cout << "    -> Enqueued neighbor " << neighbor << " to rear (Queue size: " << q.size() << ")\\n";
            }
        }
    }
    std::cout << "=== QUEUE ENGINE COMPLETED ===\\n";
}

int main() {
    int V = 5;
    std::vector<std::vector<int>> adj(V);
    auto addEdge = [&](int u, int v) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    };

    addEdge(0, 1);
    addEdge(0, 2);
    addEdge(1, 3);
    addEdge(1, 4);
    addEdge(2, 4);

    runQueueEngineBFS(adj, 0);
    return 0;
}`,
      java: `import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

public class FIFOQueueEngine {
    public static void runQueueBFS(List<List<Integer>> adj, int start) {
        int V = adj.size();
        boolean[] visited = new boolean[V];
        Queue<Integer> queue = new ArrayDeque<>();

        System.out.println("=== INITIALIZING BFS FIFO QUEUE ENGINE ===");
        
        // Enqueue root
        visited[start] = true;
        queue.offer(start);
        System.out.println("  [ENQUEUE] Pushed start vertex " + start + " (Queue size: " + queue.size() + ")");

        while (!queue.isEmpty()) {
            // Dequeue front element
            int curr = queue.poll();
            System.out.println("  [DEQUEUE] Popped vertex " + curr + " from front (Queue size: " + queue.size() + ")");

            for (int neighbor : adj.get(curr)) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    queue.offer(neighbor);
                    System.out.println("    -> Enqueued neighbor " + neighbor + " to rear (Queue size: " + queue.size() + ")");
                }
            }
        }
        System.out.println("=== QUEUE ENGINE COMPLETED ===");
    }

    public static void main(String[] args) {
        int V = 5;
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < V; i++) adj.add(new ArrayList<>());

        adj.get(0).add(1); adj.get(1).add(0);
        adj.get(0).add(2); adj.get(2).add(0);
        adj.get(1).add(3); adj.get(3).add(1);
        adj.get(1).add(4); adj.get(4).add(1);
        adj.get(2).add(4); adj.get(4).add(2);

        runQueueBFS(adj, 0);
    }
}`,
      python: `from collections import deque
from typing import Dict, List

def run_fifo_queue_bfs(adj: Dict[int, List[int]], start: int):
    """Demonstrate the FIFO Queue Engine dynamics inside BFS."""
    visited = set()
    queue = deque()

    print("=== INITIALIZING BFS FIFO QUEUE ENGINE ===")
    
    # 1. Enqueue start vertex (append to rear)
    visited.add(start)
    queue.append(start)
    print(f"  [ENQUEUE] Pushed vertex {start} (Queue size: {len(queue)}, State: {list(queue)})")

    while queue:
        # 2. Dequeue front vertex (popleft in O(1))
        curr = queue.popleft()
        print(f"  [DEQUEUE] Popped vertex {curr} (Remaining in queue: {len(queue)})")

        # 3. Enqueue unvisited neighbors
        for neighbor in adj[curr]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
                print(f"    -> Enqueued neighbor {neighbor} (Queue state: {list(queue)})")

    print("=== QUEUE ENGINE COMPLETED ===")

if __name__ == "__main__":
    adj = {
        0: [1, 2],
        1: [0, 3, 4],
        2: [0, 4],
        3: [1],
        4: [1, 2]
    }
    run_fifo_queue_bfs(adj, 0)`
    }
  },

  /* ─────────────────────────────────────────────────────────────
     CHAPTER 04 — LEVEL-BY-LEVEL CONCENTRIC EXPLORATION
  ───────────────────────────────────────────────────────────── */
  {
    id: "level-by-level",
    chapterNum: "04",
    category: "TRAVERSAL PATTERN",
    readTime: "3 MIN",
    title: "4. LEVEL-BY-LEVEL CONCENTRIC EXPLORATION",
    tocTitle: "04 Level-by-Level Waves",
    execDefinition: "The property where BFS organizes vertices into discrete distance layers $L_0, L_1, L_2, \\dots, L_k$, where each level $L_d$ contains all vertices whose shortest path from the source contains exactly $d$ edges.",
    analogy: "Radar sweeps radiating outward from a lighthouse beacon: the beam catches all objects 1 mile away, then 2 miles away, then 3 miles away in sequential pulses.",
    specs: [
      "Level 0 ($L_0$): Contains exclusively the starting source vertex $\{s\}$ with distance 0.",
      "Level 1 ($L_1$): Contains all immediate 1-hop neighbors of the source vertex.",
      "Level k ($L_k$): Contains all vertices reachable in exactly $k$ hops but not in any earlier level.",
      "A level delimiter or queue size tracking snapshot allows batch processing of entire levels."
    ],
    formula: "L_0 = {s}, \\quad L_{k+1} = \\{v \\notin \\bigcup_{i=0}^k L_i \\mid \\exists u \\in L_k, (u,v) \\in E\\}",
    diagram: {
      step1Title: "1. LEVEL 0",
      step1Val: "{ Start Node S }",
      step2Title: "2. LEVEL 1 (1 Hop)",
      step2Val: "{ Node A, Node B }",
      step3Title: "3. LEVEL 2 (2 Hops)",
      step3Val: "{ Node C, Node D }",
      step4Title: "4. LEVEL 3 (3 Hops)",
      step4Val: "{ Target Node T }",
      trayLabel: "DISCOVERY WAVE LAYERS (PROXIMITY TREE):",
      items: [
        { label: "Level 0", val: "Root [S]", active: true },
        { label: "Level 1", val: "Neighbors [A, B]", active: true },
        { label: "Level 2", val: "Sub-nodes [C, D]", active: false },
        { label: "Level 3", val: "Deep target [T]", active: false }
      ]
    },
    codeImplementations: {
      c: `#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

#define MAX 100

// BFS Level-by-Level Wave Traversal
void bfsLevelOrder(int adj[6][6], int V, int startVertex) {
    bool visited[MAX] = {false};
    int queue[MAX];
    int front = 0, rear = -1;

    // Enqueue start vertex
    visited[startVertex] = true;
    queue[++rear] = startVertex;

    int currentLevel = 0;
    printf("=== BFS LEVEL-BY-LEVEL CONCENTRIC EXPLORATION ===\\n");

    while (front <= rear) {
        // Number of nodes at the current distance level wave
        int levelSize = (rear - front + 1);
        printf("Wave Level %d (Distance: %d hops) -> [ ", currentLevel, currentLevel);

        for (int i = 0; i < levelSize; i++) {
            int curr = queue[front++];
            printf("%d ", curr);

            for (int neighbor = 0; neighbor < V; neighbor++) {
                if (adj[curr][neighbor] == 1 && !visited[neighbor]) {
                    visited[neighbor] = true;
                    queue[++rear] = neighbor;
                }
            }
        }
        printf("]\\n");
        currentLevel++;
    }
}

int main() {
    int V = 6;
    int adj[6][6] = {
        {0, 1, 1, 0, 0, 0}, // 0 connected to 1, 2
        {1, 0, 0, 1, 1, 0}, // 1 connected to 0, 3, 4
        {1, 0, 0, 0, 0, 1}, // 2 connected to 0, 5
        {0, 1, 0, 0, 0, 0}, // 3 connected to 1
        {0, 1, 0, 0, 0, 0}, // 4 connected to 1
        {0, 0, 1, 0, 0, 0}  // 5 connected to 2
    };

    bfsLevelOrder(adj, V, 0);
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>
#include <queue>

// BFS Level-Order Traversal with Level Separation
void bfsLevelWaves(const std::vector<std::vector<int>>& adj, int start) {
    int V = adj.size();
    std::vector<bool> visited(V, false);
    std::queue<int> q;

    visited[start] = true;
    q.push(start);

    int level = 0;
    std::cout << "=== BFS LEVEL-BY-LEVEL CONCENTRIC EXPLORATION ===\\n";

    while (!q.empty()) {
        int levelSize = q.size(); // Snapshot count of nodes at current level
        std::cout << "Wave Level " << level << " (Distance " << level << " hops) -> [ ";

        for (int i = 0; i < levelSize; ++i) {
            int curr = q.front();
            q.pop();
            std::cout << curr << " ";

            for (int neighbor : adj[curr]) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    q.push(neighbor);
                }
            }
        }
        std::cout << "]\\n";
        level++;
    }
}

int main() {
    int V = 6;
    std::vector<std::vector<int>> adj(V);
    auto addEdge = [&](int u, int v) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    };

    addEdge(0, 1);
    addEdge(0, 2);
    addEdge(1, 3);
    addEdge(1, 4);
    addEdge(2, 5);

    bfsLevelWaves(adj, 0);
    return 0;
}`,
      java: `import java.util.*;

public class BFSLevelWaves {
    public static void printLevelByLevel(List<List<Integer>> adj, int start) {
        int V = adj.size();
        boolean[] visited = new boolean[V];
        Queue<Integer> queue = new LinkedList<>();

        visited[start] = true;
        queue.offer(start);

        int level = 0;
        System.out.println("=== BFS LEVEL-BY-LEVEL CONCENTRIC EXPLORATION ===");

        while (!queue.isEmpty()) {
            int levelSize = queue.size(); // Batch size of current level
            System.out.print("Wave Level " + level + " (Distance " + level + " hops) -> [ ");

            for (int i = 0; i < levelSize; i++) {
                int curr = queue.poll();
                System.out.print(curr + " ");

                for (int neighbor : adj.get(curr)) {
                    if (!visited[neighbor]) {
                        visited[neighbor] = true;
                        queue.offer(neighbor);
                    }
                }
            }
            System.out.println("]");
            level++;
        }
    }

    public static void main(String[] args) {
        int V = 6;
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < V; i++) adj.add(new ArrayList<>());

        adj.get(0).add(1); adj.get(1).add(0);
        adj.get(0).add(2); adj.get(2).add(0);
        adj.get(1).add(3); adj.get(3).add(1);
        adj.get(1).add(4); adj.get(4).add(1);
        adj.get(2).add(5); adj.get(5).add(2);

        printLevelByLevel(adj, 0);
    }
}`,
      python: `from collections import deque
from typing import Dict, List

def bfs_level_order(adj: Dict[int, List[int]], start: int):
    """Process and print graph nodes organized into discrete level waves."""
    visited = {start}
    queue = deque([start])
    level = 0

    print("=== BFS LEVEL-BY-LEVEL CONCENTRIC EXPLORATION ===")

    while queue:
        level_size = len(queue) # Number of vertices in the current wave
        current_wave_nodes = []

        for _ in range(level_size):
            curr = queue.popleft()
            current_wave_nodes.append(curr)

            for neighbor in adj[curr]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)

        print(f"Wave Level {level} (Distance {level} hops) -> {current_wave_nodes}")
        level += 1

if __name__ == "__main__":
    adj = {
        0: [1, 2],
        1: [0, 3, 4],
        2: [0, 5],
        3: [1],
        4: [1],
        5: [2]
    }
    bfs_level_order(adj, 0)`
    }
  },

  /* ─────────────────────────────────────────────────────────────
     CHAPTER 05 — VISITED STATE TRACKING & CYCLE PREVENTION
  ───────────────────────────────────────────────────────────── */
  {
    id: "visited-tracking",
    chapterNum: "05",
    category: "SAFETY & INTEGRITY",
    readTime: "2 MIN",
    title: "5. VISITED STATE TRACKING & CYCLE PREVENTION",
    tocTitle: "05 Visited Set & Cycles",
    execDefinition: "A boolean state tracker (hash set or boolean array) that marks vertices the moment they are discovered/enqueued to prevent redundant processing, infinite loops, and cycle re-traversals.",
    analogy: "Breadcrumbs dropped at every intersection you visit: if you come across an intersection that already has breadcrumbs, you know you've already been there and turn back.",
    specs: [
      "Critical Rule: Mark a vertex as visited immediately upon ENQUEUE, NOT when dequeued.",
      "Marking upon enqueue guarantees each node is inserted into the queue at most once.",
      "Prevents infinite recursion/loops in cyclic graphs (e.g., triangles, loops, multi-graphs).",
      "Lookups and insertions into the visited boolean structure occur in constant O(1) time."
    ],
    formula: "if (visited[v] == false) { visited[v] = true; queue.push(v); }",
    diagram: {
      step1Title: "1. EDGE INSPECTION",
      step1Val: "Edge (B ➔ C)",
      step2Title: "2. VISITED LOOKUP",
      step2Val: "visited['C'] == false?",
      step3Title: "3. ENQUEUE & MARK",
      step3Val: "visited['C'] = true",
      step4Title: "4. DUPLICATE BLOCKED",
      step4Val: "Cycle edge skipped",
      trayLabel: "BOOLEAN VISITED LOOKUP ARRAY:",
      items: [
        { label: "visited[A]", val: "TRUE (explored)", active: true },
        { label: "visited[B]", val: "TRUE (explored)", active: true },
        { label: "visited[C]", val: "TRUE (in queue)", active: true },
        { label: "visited[D]", val: "FALSE (undiscovered)", active: false }
      ]
    },
    codeImplementations: {
      c: `#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

#define V 5

// BFS with Visited State Tracking and Cycle Detection
bool detectCycleBFS(int adj[V][V], int startVertex) {
    bool visited[V] = {false};
    int parent[V];
    for (int i = 0; i < V; i++) parent[i] = -1;

    int queue[V];
    int front = 0, rear = -1;

    // Enqueue start vertex and mark visited
    visited[startVertex] = true;
    queue[++rear] = startVertex;

    printf("Starting BFS cycle detection from vertex %d...\\n", startVertex);

    while (front <= rear) {
        int u = queue[front++];

        for (int v = 0; v < V; v++) {
            if (adj[u][v] == 1) {
                if (!visited[v]) {
                    // Mark as visited upon ENQUEUE
                    visited[v] = true;
                    parent[v] = u;
                    queue[++rear] = v;
                } else if (v != parent[u]) {
                    // Visited neighbor that is NOT parent indicates a cycle!
                    printf("  [CYCLE DETECTED] Cross-edge found between (%d, %d)!\\n", u, v);
                    return true;
                }
            }
        }
    }
    printf("  [NO CYCLE] Graph is acyclic.\\n");
    return false;
}

int main() {
    // Triangle graph: 0-1, 1-2, 2-0, 1-3, 3-4
    int adj[V][V] = {
        {0, 1, 1, 0, 0},
        {1, 0, 1, 1, 0},
        {1, 1, 0, 0, 0},
        {0, 1, 0, 0, 1},
        {0, 0, 0, 1, 0}
    };

    detectCycleBFS(adj, 0);
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>
#include <queue>

// Cycle Detection in Undirected Graph using BFS
bool hasCycleBFS(const std::vector<std::vector<int>>& adj, int start) {
    int V = adj.size();
    std::vector<bool> visited(V, false);
    std::vector<int> parent(V, -1);
    std::queue<int> q;

    visited[start] = true;
    q.push(start);

    std::cout << "Running BFS with Visited Tracker starting at node " << start << "...\\n";

    while (!q.empty()) {
        int u = q.front();
        q.pop();

        for (int v : adj[u]) {
            if (!visited[v]) {
                visited[v] = true; // Mark visited immediately on enqueue
                parent[v] = u;
                q.push(v);
            } else if (v != parent[u]) {
                std::cout << "  [CYCLE DETECTED] Found back-edge (" << u << " <-> " << v << ")\\n";
                return true;
            }
        }
    }
    std::cout << "  [NO CYCLE DETECTED]\\n";
    return false;
}

int main() {
    int V = 5;
    std::vector<std::vector<int>> adj(V);
    auto addEdge = [&](int u, int v) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    };

    addEdge(0, 1);
    addEdge(1, 2);
    addEdge(2, 0); // Creates cycle (0-1-2)
    addEdge(1, 3);
    addEdge(3, 4);

    hasCycleBFS(adj, 0);
    return 0;
}`,
      java: `import java.util.*;

public class BFSVisitedAndCycles {
    public static boolean detectCycle(List<List<Integer>> adj, int start) {
        int V = adj.size();
        boolean[] visited = new boolean[V];
        int[] parent = new int[V];
        Arrays.fill(parent, -1);

        Queue<Integer> queue = new LinkedList<>();

        // Enqueue root and mark visited
        visited[start] = true;
        queue.offer(start);

        System.out.println("Running BFS with Visited Set starting at vertex " + start + "...");

        while (!queue.isEmpty()) {
            int u = queue.poll();

            for (int v : adj.get(u)) {
                if (!visited[v]) {
                    visited[v] = true; // Crucial: Mark visited on enqueue
                    parent[v] = u;
                    queue.offer(v);
                } else if (v != parent[u]) {
                    System.out.println("  [CYCLE DETECTED] Visited node " + v + " is not parent of " + u);
                    return true;
                }
            }
        }
        System.out.println("  [NO CYCLE FOUND]");
        return false;
    }

    public static void main(String[] args) {
        int V = 5;
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < V; i++) adj.add(new ArrayList<>());

        adj.get(0).add(1); adj.get(1).add(0);
        adj.get(1).add(2); adj.get(2).add(1);
        adj.get(2).add(0); adj.get(0).add(2); // Cycle 0-1-2
        adj.get(1).add(3); adj.get(3).add(1);
        adj.get(3).add(4); adj.get(4).add(3);

        detectCycle(adj, 0);
    }
}`,
      python: `from collections import deque
from typing import Dict, List

def detect_cycle_bfs(adj: Dict[int, List[int]], start: int) -> bool:
    """Detect cycles and prevent infinite loops using visited set & parent map."""
    visited = {start}
    parent = {start: None}
    queue = deque([start])

    print(f"Running BFS with Visited Tracker starting at node {start}...")

    while queue:
        u = queue.popleft()

        for v in adj[u]:
            if v not in visited:
                visited.add(v) # Mark visited immediately upon discovery
                parent[v] = u
                queue.append(v)
            elif v != parent[u]:
                print(f"  [CYCLE DETECTED] Edge ({u}, {v}) connects to an already-visited non-parent node!")
                return True

    print("  [NO CYCLE] Graph is a tree/forest.")
    return False

if __name__ == "__main__":
    adj = {
        0: [1, 2],
        1: [0, 2, 3],
        2: [0, 1],
        3: [1, 4],
        4: [3]
    }
    detect_cycle_bfs(adj, 0)`
    }
  },

  /* ─────────────────────────────────────────────────────────────
     CHAPTER 06 — DISCOVERY EDGES VS CROSS EDGES
  ───────────────────────────────────────────────────────────── */
  {
    id: "edge-classification",
    chapterNum: "06",
    category: "GRAPH THEORY",
    readTime: "3 MIN",
    title: "6. DISCOVERY EDGES VS CROSS EDGES",
    tocTitle: "06 Edge Classification",
    execDefinition: "During BFS execution, traversed edges are partitioned into Discovery (Tree) Edges that lead to newly uncovered vertices, and Cross Edges that connect vertices in the same or adjacent levels without forming tree branches.",
    analogy: "Building a family genealogical tree: child-parent bonds are discovery tree branches, while marriages between cousins at the same generational tier are cross-links.",
    specs: [
      "Discovery (Tree) Edge: An edge $(u, v)$ where vertex $v$ was undiscovered prior to checking $u$.",
      "Cross Edge: An edge $(u, v)$ where vertex $v$ was already discovered before visiting edge $(u, v)$.",
      "In undirected graphs, BFS cross edges only connect vertices at the same level $\\Delta d = 0$ or adjacent levels $\\Delta d = \\pm 1$.",
      "BFS never produces back edges that span more than 1 level difference in undirected graphs."
    ],
    formula: "|Level(u) - Level(v)| \\le 1 \\quad \\text{for all undirected edges } (u,v) \\in E",
    diagram: {
      step1Title: "1. DISCOVERY EDGE",
      step1Val: "A ➔ B (New Branch)",
      step2Title: "2. DISCOVERY EDGE",
      step2Val: "A ➔ C (New Branch)",
      step3Title: "3. CROSS EDGE",
      step3Val: "B ➔ C (Same Level 1)",
      step4Title: "4. SPANNING TREE",
      step4Val: "Keeps Discovery only",
      trayLabel: "BFS TRAVERSED EDGE CLASSIFICATION:",
      items: [
        { label: "Edge (A,B)", val: "DISCOVERY (Tree Edge)", active: true },
        { label: "Edge (A,C)", val: "DISCOVERY (Tree Edge)", active: true },
        { label: "Edge (B,C)", val: "CROSS EDGE (Level 1-1)", active: false },
        { label: "Edge (B,D)", val: "DISCOVERY (Tree Edge)", active: true }
      ]
    },
    codeImplementations: {
      c: `#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

#define V 5

// BFS Edge Classifier (Tree / Discovery Edges vs Cross Edges)
void classifyEdgesBFS(int adj[V][V], int start) {
    bool visited[V] = {false};
    int level[V];
    int parent[V];
    for (int i = 0; i < V; i++) {
        level[i] = -1;
        parent[i] = -1;
    }

    int queue[V];
    int front = 0, rear = -1;

    visited[start] = true;
    level[start] = 0;
    queue[++rear] = start;

    printf("=== BFS EDGE CLASSIFICATION RESULTS ===\\n");

    while (front <= rear) {
        int u = queue[front++];

        for (int v = 0; v < V; v++) {
            if (adj[u][v] == 1) {
                if (!visited[v]) {
                    // Tree / Discovery Edge
                    visited[v] = true;
                    level[v] = level[u] + 1;
                    parent[v] = u;
                    queue[++rear] = v;
                    printf("  [TREE EDGE]  (%d -> %d) : Discovery edge (Level %d -> %d)\\n", u, v, level[u], level[v]);
                } else if (u < v && v != parent[u]) {
                    // Cross Edge (reported once for undirected edge u < v)
                    printf("  [CROSS EDGE] (%d <-> %d) : Non-tree edge (Level diff: %d)\\n", u, v, abs(level[u] - level[v]));
                }
            }
        }
    }
}

int main() {
    int adj[V][V] = {
        {0, 1, 1, 0, 0},
        {1, 0, 1, 1, 0},
        {1, 1, 0, 0, 1},
        {0, 1, 0, 0, 1},
        {0, 0, 1, 1, 0}
    };

    classifyEdgesBFS(adj, 0);
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>
#include <queue>
#include <cmath>

void classifyEdgesBFS(const std::vector<std::vector<int>>& adj, int start) {
    int V = adj.size();
    std::vector<bool> visited(V, false);
    std::vector<int> level(V, -1);
    std::vector<int> parent(V, -1);
    std::queue<int> q;

    visited[start] = true;
    level[start] = 0;
    q.push(start);

    std::cout << "=== BFS EDGE CLASSIFICATION RESULTS ===\\n";

    while (!q.empty()) {
        int u = q.front();
        q.pop();

        for (int v : adj[u]) {
            if (!visited[v]) {
                visited[v] = true;
                level[v] = level[u] + 1;
                parent[v] = u;
                q.push(v);
                std::cout << "  [TREE EDGE]  (" << u << " -> " << v << ") Level " << level[u] << " -> " << level[v] << "\\n";
            } else if (u < v && v != parent[u]) {
                int diff = std::abs(level[u] - level[v]);
                std::cout << "  [CROSS EDGE] (" << u << " <-> " << v << ") Cross link (|Delta L| = " << diff << ")\\n";
            }
        }
    }
}

int main() {
    int V = 5;
    std::vector<std::vector<int>> adj(V);
    auto addEdge = [&](int u, int v) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    };

    addEdge(0, 1);
    addEdge(0, 2);
    addEdge(1, 2); // Cross edge between Level 1 nodes
    addEdge(1, 3);
    addEdge(2, 4);
    addEdge(3, 4); // Cross edge between Level 2 nodes

    classifyEdgesBFS(adj, 0);
    return 0;
}`,
      java: `import java.util.*;

public class BFSEdgeClassification {
    public static void classifyEdges(List<List<Integer>> adj, int start) {
        int V = adj.size();
        boolean[] visited = new boolean[V];
        int[] level = new int[V];
        int[] parent = new int[V];
        Arrays.fill(level, -1);
        Arrays.fill(parent, -1);

        Queue<Integer> queue = new LinkedList<>();

        visited[start] = true;
        level[start] = 0;
        queue.offer(start);

        System.out.println("=== BFS EDGE CLASSIFICATION RESULTS ===");

        while (!queue.isEmpty()) {
            int u = queue.poll();

            for (int v : adj.get(u)) {
                if (!visited[v]) {
                    visited[v] = true;
                    level[v] = level[u] + 1;
                    parent[v] = u;
                    queue.offer(v);
                    System.out.println("  [TREE EDGE]  (" + u + " -> " + v + ") Discovery branch (L" + level[u] + " -> L" + level[v] + ")");
                } else if (u < v && v != parent[u]) {
                    int diff = Math.abs(level[u] - level[v]);
                    System.out.println("  [CROSS EDGE] (" + u + " <-> " + v + ") Cross link (Level difference: " + diff + ")");
                }
            }
        }
    }

    public static void main(String[] args) {
        int V = 5;
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < V; i++) adj.add(new ArrayList<>());

        adj.get(0).add(1); adj.get(1).add(0);
        adj.get(0).add(2); adj.get(2).add(0);
        adj.get(1).add(2); adj.get(2).add(1);
        adj.get(1).add(3); adj.get(3).add(1);
        adj.get(2).add(4); adj.get(4).add(2);
        adj.get(3).add(4); adj.get(4).add(3);

        classifyEdges(adj, 0);
    }
}`,
      python: `from collections import deque
from typing import Dict, List

def classify_bfs_edges(adj: Dict[int, List[int]], start: int):
    """Classify graph edges into Discovery (Tree) Edges and Cross Edges."""
    visited = {start}
    level = {start: 0}
    parent = {start: None}
    queue = deque([start])

    tree_edges = []
    cross_edges = []

    print("=== BFS EDGE CLASSIFICATION RESULTS ===")

    while queue:
        u = queue.popleft()

        for v in adj[u]:
            if v not in visited:
                visited.add(v)
                level[v] = level[u] + 1
                parent[v] = u
                queue.append(v)
                tree_edges.append((u, v))
                print(f"  [TREE EDGE]  ({u} -> {v}) : New vertex discovered at Level {level[v]}")
            elif u < v and v != parent[u]:
                diff = abs(level[u] - level[v])
                cross_edges.append((u, v))
                print(f"  [CROSS EDGE] ({u} <-> {v}) : Non-tree edge with Level diff = {diff}")

    return tree_edges, cross_edges

if __name__ == "__main__":
    adj = {
        0: [1, 2],
        1: [0, 2, 3],
        2: [0, 1, 4],
        3: [1, 4],
        4: [2, 3]
    }
    classify_bfs_edges(adj, 0)`
    }
  },

  /* ─────────────────────────────────────────────────────────────
     CHAPTER 07 — BFS SPANNING TREE GENERATION
  ───────────────────────────────────────────────────────────── */
  {
    id: "spanning-tree",
    chapterNum: "07",
    category: "STRUCTURES",
    readTime: "3 MIN",
    title: "7. BFS SPANNING TREE GENERATION",
    tocTitle: "07 BFS Spanning Tree",
    execDefinition: "A rooted acyclic subgraph $T = (V, E_T)$ comprising all reachable vertices and exactly $|V| - 1$ discovery edges, rooted at the BFS source vertex.",
    analogy: "A pruned bonsai tree: taking a tangled, web-like mesh and trimming away redundant cross-loops until only the clean skeleton of direct trunk and branch routes remains.",
    specs: [
      "Contains every reachable vertex with zero cycles (strictly acyclic tree structure).",
      "Tree height equals the maximum shortest distance from the source to any vertex in the component.",
      "The path in the spanning tree from the root to any vertex $v$ is the shortest path in the original graph.",
      "Maintained efficiently during traversal using parent pointer mapping: `parent[v] = u`."
    ],
    formula: "|E_{Tree}| = |V| - 1 \\quad \\text{(Acyclic connected subgraph)}",
    diagram: {
      step1Title: "1. ROOT OF TREE",
      step1Val: "Node A (Depth 0)",
      step2Title: "2. PRIMARY BRANCHES",
      step2Val: "Branches A-B, A-C",
      step3Title: "3. SUB-BRANCHES",
      step3Val: "Branches B-D, C-E",
      step4Title: "4. TOTAL TREE EDGES",
      step4Val: "|E_T| = 5 - 1 = 4 Edges",
      trayLabel: "PARENT POINTER RECONSTRUCTION TABLE:",
      items: [
        { label: "parent[A]", val: "NULL (Root)", active: true },
        { label: "parent[B]", val: "Node A", active: true },
        { label: "parent[C]", val: "Node A", active: true },
        { label: "parent[D]", val: "Node B", active: true }
      ]
    },
    codeImplementations: {
      c: `#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

#define V 6

// Build BFS Spanning Tree using parent pointers
void buildBFSSpanningTree(int adj[V][V], int root) {
    bool visited[V] = {false};
    int parent[V];
    for (int i = 0; i < V; i++) parent[i] = -1;

    int queue[V];
    int front = 0, rear = -1;

    visited[root] = true;
    queue[++rear] = root;

    int treeEdgeCount = 0;
    printf("=== CONSTRUCTING BFS SPANNING TREE (ROOT: %d) ===\\n", root);

    while (front <= rear) {
        int u = queue[front++];

        for (int v = 0; v < V; v++) {
            if (adj[u][v] == 1 && !visited[v]) {
                visited[v] = true;
                parent[v] = u; // Record discovery branch
                queue[++rear] = v;
                treeEdgeCount++;
            }
        }
    }

    printf("\\n--- SPANNING TREE EDGES (|E_T| = %d) ---\\n", treeEdgeCount);
    for (int v = 0; v < V; v++) {
        if (parent[v] != -1) {
            printf("Branch: (Node %d) -> (Node %d)\\n", parent[v], v);
        } else {
            printf("Root Node: %d (parent: NULL)\\n", v);
        }
    }
}

int main() {
    // 6-vertex graph with cycles
    int adj[V][V] = {
        {0, 1, 1, 0, 0, 0},
        {1, 0, 1, 1, 1, 0},
        {1, 1, 0, 0, 1, 0},
        {0, 1, 0, 0, 1, 1},
        {0, 1, 1, 1, 0, 1},
        {0, 0, 0, 1, 1, 0}
    };

    buildBFSSpanningTree(adj, 0);
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>
#include <queue>

struct Edge {
    int u, v;
};

// Construct BFS Spanning Tree
void constructBFSTree(const std::vector<std::vector<int>>& adj, int root) {
    int V = adj.size();
    std::vector<bool> visited(V, false);
    std::vector<int> parent(V, -1);
    std::vector<Edge> treeEdges;
    std::queue<int> q;

    visited[root] = true;
    q.push(root);

    while (!q.empty()) {
        int u = q.front();
        q.pop();

        for (int v : adj[u]) {
            if (!visited[v]) {
                visited[v] = true;
                parent[v] = u;
                treeEdges.push_back({u, v});
                q.push(v);
            }
        }
    }

    std::cout << "=== BFS SPANNING TREE (Root: " << root << ") ===\\n";
    std::cout << "Total Tree Edges: " << treeEdges.size() << " (|V| - 1 = " << V - 1 << ")\\n\\n";
    for (const auto& edge : treeEdges) {
        std::cout << "  Tree Edge: " << edge.u << " -> " << edge.v << "\\n";
    }
}

int main() {
    int V = 6;
    std::vector<std::vector<int>> adj(V);
    auto addEdge = [&](int u, int v) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    };

    addEdge(0, 1);
    addEdge(0, 2);
    addEdge(1, 2);
    addEdge(1, 3);
    addEdge(1, 4);
    addEdge(2, 4);
    addEdge(3, 5);
    addEdge(4, 5);

    constructBFSTree(adj, 0);
    return 0;
}`,
      java: `import java.util.*;

public class BFSSpanningTree {
    static class Edge {
        int u, v;
        Edge(int u, int v) { this.u = u; this.v = v; }
    }

    public static void buildSpanningTree(List<List<Integer>> adj, int root) {
        int V = adj.size();
        boolean[] visited = new boolean[V];
        int[] parent = new int[V];
        Arrays.fill(parent, -1);

        List<Edge> spanningTree = new ArrayList<>();
        Queue<Integer> queue = new LinkedList<>();

        visited[root] = true;
        queue.offer(root);

        while (!queue.isEmpty()) {
            int u = queue.poll();

            for (int v : adj.get(u)) {
                if (!visited[v]) {
                    visited[v] = true;
                    parent[v] = u;
                    spanningTree.add(new Edge(u, v));
                    queue.offer(v);
                }
            }
        }

        System.out.println("=== BFS SPANNING TREE (Root: " + root + ") ===");
        System.out.println("Total Discovery Edges: " + spanningTree.size());
        for (Edge e : spanningTree) {
            System.out.println("  Branch: " + e.u + " -> " + e.v);
        }
    }

    public static void main(String[] args) {
        int V = 6;
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < V; i++) adj.add(new ArrayList<>());

        adj.get(0).add(1); adj.get(1).add(0);
        adj.get(0).add(2); adj.get(2).add(0);
        adj.get(1).add(3); adj.get(3).add(1);
        adj.get(1).add(4); adj.get(4).add(1);
        adj.get(2).add(4); adj.get(4).add(2);
        adj.get(3).add(5); adj.get(5).add(3);
        adj.get(4).add(5); adj.get(5).add(4);

        buildSpanningTree(adj, 0);
    }
}`,
      python: `from collections import deque
from typing import Dict, List, Tuple

def build_bfs_spanning_tree(adj: Dict[int, List[int]], root: int) -> List[Tuple[int, int]]:
    """Generate the BFS Spanning Tree with |V| - 1 discovery edges."""
    visited = {root}
    parent = {root: None}
    queue = deque([root])
    tree_edges = []

    while queue:
        u = queue.popleft()

        for v in adj[u]:
            if v not in visited:
                visited.add(v)
                parent[v] = u
                tree_edges.append((u, v))
                queue.append(v)

    print(f"=== BFS SPANNING TREE (Root: {root}) ===")
    print(f"Total Edges: {len(tree_edges)} (Acyclic)")
    for u, v in tree_edges:
        print(f"  Branch: {u} -> {v}")

    return tree_edges

if __name__ == "__main__":
    adj = {
        0: [1, 2],
        1: [0, 2, 3, 4],
        2: [0, 1, 4],
        3: [1, 5],
        4: [1, 2, 5],
        5: [3, 4]
    }
    build_bfs_spanning_tree(adj, 0)`
    }
  },

  /* ─────────────────────────────────────────────────────────────
     CHAPTER 08 — SHORTEST PATH IN UNWEIGHTED GRAPHS
  ───────────────────────────────────────────────────────────── */
  {
    id: "shortest-path",
    chapterNum: "08",
    category: "OPTIMIZATION",
    readTime: "3 MIN",
    title: "8. SHORTEST PATH IN UNWEIGHTED GRAPHS",
    tocTitle: "08 Shortest Path Guarantee",
    execDefinition: "The mathematical guarantee that the first time BFS dequeues or discovers any target vertex $t$, the path traversed from source $s$ has the minimum possible number of edges.",
    analogy: "A rescue team searching rooms in a building: they search all rooms 1 hallway away first, then 2 hallways away. When they find the survivor, they are guaranteed to have taken the shortest possible route.",
    specs: [
      "Guaranteed minimum edge hops for any unweighted, positive unit-weight graph.",
      "More efficient than Dijkstra's Algorithm ($O(V+E)$ vs $O((V+E) \\log V)$) when edge weights are uniform.",
      "Path Reconstruction: Backtrack from target $t$ to source $s$ using `parent[v]` pointers in $O(\\text{path length})$ time.",
      "Provides both single-source shortest paths and distance array `dist[v]` for all reachable vertices."
    ],
    formula: "dist[v] = dist[u] + 1 \\quad \\text{where } u = \\text{parent}[v]",
    diagram: {
      step1Title: "1. START SOURCE",
      step1Val: "Start at Node S",
      step2Title: "2. TARGET LOCATED",
      step2Val: "Target T at Level 2",
      step3Title: "3. BACKTRACK POINTERS",
      step3Val: "T ➔ B ➔ S",
      step4Title: "4. OPTIMAL PATH",
      step4Val: "S ➔ B ➔ T (Cost: 2 hops)",
      trayLabel: "OPTIMAL HOP DISTANCE VECTOR:",
      items: [
        { label: "dist[S]", val: "0 hops (Source)", active: true },
        { label: "dist[B]", val: "1 hop (Shortest)", active: true },
        { label: "dist[T]", val: "2 hops (Optimal)", active: true },
        { label: "dist[Z]", val: "∞ (Unreachable)", active: false }
      ]
    },
    codeImplementations: {
      c: `#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

#define V 7

// Shortest Path in Unweighted Graph using BFS
void shortestPathBFS(int adj[V][V], int src, int dest) {
    bool visited[V] = {false};
    int dist[V];
    int parent[V];
    for (int i = 0; i < V; i++) {
        dist[i] = -1;
        parent[i] = -1;
    }

    int queue[V];
    int front = 0, rear = -1;

    // Initialize source
    visited[src] = true;
    dist[src] = 0;
    queue[++rear] = src;

    while (front <= rear) {
        int u = queue[front++];

        if (u == dest) break; // Reached destination

        for (int v = 0; v < V; v++) {
            if (adj[u][v] == 1 && !visited[v]) {
                visited[v] = true;
                dist[v] = dist[u] + 1; // Edge distance increment
                parent[v] = u;         // Record predecessor pointer
                queue[++rear] = v;
            }
        }
    }

    if (!visited[dest]) {
        printf("No path exists from %d to %d\\n", src, dest);
        return;
    }

    printf("Shortest Distance from %d to %d: %d hops\\n", src, dest, dist[dest]);

    // Backtrack path using parent pointers
    int path[V];
    int pathLen = 0;
    for (int curr = dest; curr != -1; curr = parent[curr]) {
        path[pathLen++] = curr;
    }

    printf("Optimal Shortest Path: ");
    for (int i = pathLen - 1; i >= 0; i--) {
        printf("%d%s", path[i], (i > 0) ? " -> " : "\\n");
    }
}

int main() {
    int adj[V][V] = {
        {0, 1, 1, 0, 0, 0, 0},
        {1, 0, 0, 1, 0, 0, 0},
        {1, 0, 0, 1, 1, 0, 0},
        {0, 1, 1, 0, 1, 1, 0},
        {0, 0, 1, 1, 0, 0, 1},
        {0, 0, 0, 1, 0, 0, 1},
        {0, 0, 0, 0, 1, 1, 0}
    };

    shortestPathBFS(adj, 0, 6);
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>
#include <queue>
#include <algorithm>

// Shortest Path BFS Algorithm for Unweighted Graphs
void findShortestPath(const std::vector<std::vector<int>>& adj, int src, int dest) {
    int V = adj.size();
    std::vector<int> dist(V, -1);
    std::vector<int> parent(V, -1);
    std::queue<int> q;

    dist[src] = 0;
    q.push(src);

    while (!q.empty()) {
        int u = q.front();
        q.pop();

        if (u == dest) break;

        for (int v : adj[u]) {
            if (dist[v] == -1) { // Unvisited
                dist[v] = dist[u] + 1;
                parent[v] = u;
                q.push(v);
            }
        }
    }

    if (dist[dest] == -1) {
        std::cout << "Destination " << dest << " is unreachable from " << src << "\\n";
        return;
    }

    std::cout << "Shortest Distance: " << dist[dest] << " hops\\n";

    // Reconstruct path by backtracking
    std::vector<int> path;
    for (int at = dest; at != -1; at = parent[at]) {
        path.push_back(at);
    }
    std::reverse(path.begin(), path.end());

    std::cout << "Shortest Path Sequence: ";
    for (size_t i = 0; i < path.size(); ++i) {
        std::cout << path[i] << (i + 1 < path.size() ? " -> " : "\\n");
    }
}

int main() {
    int V = 7;
    std::vector<std::vector<int>> adj(V);
    auto addEdge = [&](int u, int v) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    };

    addEdge(0, 1);
    addEdge(0, 2);
    addEdge(1, 3);
    addEdge(2, 3);
    addEdge(2, 4);
    addEdge(3, 5);
    addEdge(4, 6);
    addEdge(5, 6);

    findShortestPath(adj, 0, 6);
    return 0;
}`,
      java: `import java.util.*;

public class BFSShortestPath {
    public static void findShortestPath(List<List<Integer>> adj, int src, int dest) {
        int V = adj.size();
        int[] dist = new int[V];
        int[] parent = new int[V];
        Arrays.fill(dist, -1);
        Arrays.fill(parent, -1);

        Queue<Integer> queue = new LinkedList<>();

        dist[src] = 0;
        queue.offer(src);

        while (!queue.isEmpty()) {
            int u = queue.poll();

            if (u == dest) break;

            for (int v : adj.get(u)) {
                if (dist[v] == -1) {
                    dist[v] = dist[u] + 1;
                    parent[v] = u;
                    queue.offer(v);
                }
            }
        }

        if (dist[dest] == -1) {
            System.out.println("Destination unreachable!");
            return;
        }

        System.out.println("Shortest Distance: " + dist[dest] + " hops");

        // Backtrack path
        List<Integer> path = new ArrayList<>();
        for (int at = dest; at != -1; at = parent[at]) {
            path.add(at);
        }
        Collections.reverse(path);

        System.out.println("Optimal Shortest Path: " + path);
    }

    public static void main(String[] args) {
        int V = 7;
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < V; i++) adj.add(new ArrayList<>());

        adj.get(0).add(1); adj.get(1).add(0);
        adj.get(0).add(2); adj.get(2).add(0);
        adj.get(1).add(3); adj.get(3).add(1);
        adj.get(2).add(3); adj.get(3).add(2);
        adj.get(2).add(4); adj.get(4).add(2);
        adj.get(3).add(5); adj.get(5).add(3);
        adj.get(4).add(6); adj.get(6).add(4);
        adj.get(5).add(6); adj.get(6).add(5);

        findShortestPath(adj, 0, 6);
    }
}`,
      python: `from collections import deque
from typing import Dict, List, Optional

def shortest_path_bfs(adj: Dict[int, List[int]], src: int, dest: int):
    """Find the shortest path between src and dest in an unweighted graph."""
    dist = {src: 0}
    parent = {src: None}
    queue = deque([src])

    while queue:
        u = queue.popleft()

        if u == dest:
            break

        for v in adj[u]:
            if v not in dist:
                dist[v] = dist[u] + 1
                parent[v] = u
                queue.append(v)

    if dest not in dist:
        print(f"No path found from {src} to {dest}")
        return None, float('inf')

    # Reconstruct shortest path by backtracking
    path = []
    curr: Optional[int] = dest
    while curr is not None:
        path.append(curr)
        curr = parent[curr]
    path.reverse()

    print(f"Shortest Distance from {src} to {dest}: {dist[dest]} hops")
    print("Optimal Shortest Path:", " -> ".join(map(str, path)))
    return path, dist[dest]

if __name__ == "__main__":
    adj = {
        0: [1, 2],
        1: [0, 3],
        2: [0, 3, 4],
        3: [1, 2, 5],
        4: [2, 6],
        5: [3, 6],
        6: [4, 5]
    }
    shortest_path_bfs(adj, 0, 6)`
    }
  },

  /* ─────────────────────────────────────────────────────────────
     CHAPTER 09 — CONNECTED COMPONENTS & DISCONNECTED GRAPHS
  ───────────────────────────────────────────────────────────── */
  {
    id: "connected-components",
    chapterNum: "09",
    category: "GRAPH TOPOLOGY",
    readTime: "2 MIN",
    title: "9. CONNECTED COMPONENTS & DISCONNECTED GRAPHS",
    tocTitle: "09 Connected Components",
    execDefinition: "Running BFS iteratively across all unvisited vertices in a graph to identify and count isolated subgraphs (connected components) where no path exists between disjoint sets.",
    analogy: "An archipelago of islands: doing a land search on Island 1 finds all towns on Island 1. To explore Island 2, you must take a boat to Island 2 and start a new search.",
    specs: [
      "A single BFS run from node $s$ visits only the component containing $s$.",
      "Outer loop iterates $v \\in V$: if $v$ is unvisited, launch BFS from $v$ and increment component count.",
      "Identifies all connected clusters in $O(V + E)$ total aggregate runtime.",
      "Multi-Source BFS: Enqueue multiple source seed nodes initially to compute nearest-facility voronoi partitions."
    ],
    formula: "\\text{Component Count} = \\sum_{v \\in V} [\\text{visited}[v] == \\text{false} \\implies \\text{BFS}(v)]",
    diagram: {
      step1Title: "1. LAUNCH BFS 1",
      step1Val: "Source A ➔ {A, B, C}",
      step2Title: "2. CLUSTER 1 FOUND",
      step2Val: "Component #1 Marked",
      step3Title: "3. LAUNCH BFS 2",
      step3Val: "Source D ➔ {D, E}",
      step4Title: "4. TOTAL COMPONENTS",
      step4Val: "2 Isolated Clusters",
      trayLabel: "COMPONENT CLUSTER PARTITIONS:",
      items: [
        { label: "Cluster 1", val: "Nodes {A, B, C}", active: true },
        { label: "Cluster 2", val: "Nodes {D, E}", active: true },
        { label: "Cluster 3", val: "Nodes {F}", active: false },
        { label: "Total", val: "3 Disjoint Islands", active: false }
      ]
    },
    codeImplementations: {
      c: `#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

#define V 7

// BFS sub-routine to explore an individual component
void bfsComponent(int adj[V][V], int startVertex, bool visited[V], int componentId) {
    int queue[V];
    int front = 0, rear = -1;

    visited[startVertex] = true;
    queue[++rear] = startVertex;

    printf("  Component #%d: [ ", componentId);

    while (front <= rear) {
        int u = queue[front++];
        printf("%d ", u);

        for (int v = 0; v < V; v++) {
            if (adj[u][v] == 1 && !visited[v]) {
                visited[v] = true;
                queue[++rear] = v;
            }
        }
    }
    printf("]\\n");
}

// Find all connected components in a disconnected graph
int findConnectedComponents(int adj[V][V]) {
    bool visited[V] = {false};
    int count = 0;

    printf("=== FINDING CONNECTED COMPONENTS USING BFS ===\\n");

    for (int i = 0; i < V; i++) {
        if (!visited[i]) {
            count++;
            bfsComponent(adj, i, visited, count);
        }
    }

    printf("Total Connected Components: %d\\n", count);
    return count;
}

int main() {
    // 3 Disconnected islands: {0,1,2}, {3,4}, {5,6}
    int adj[V][V] = {
        {0, 1, 1, 0, 0, 0, 0},
        {1, 0, 1, 0, 0, 0, 0},
        {1, 1, 0, 0, 0, 0, 0},
        {0, 0, 0, 0, 1, 0, 0},
        {0, 0, 0, 1, 0, 0, 0},
        {0, 0, 0, 0, 0, 0, 1},
        {0, 0, 0, 0, 0, 1, 0}
    };

    findConnectedComponents(adj);
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>
#include <queue>

// Discover all connected components using BFS
void findConnectedComponents(const std::vector<std::vector<int>>& adj) {
    int V = adj.size();
    std::vector<bool> visited(V, false);
    std::vector<std::vector<int>> components;

    for (int i = 0; i < V; ++i) {
        if (!visited[i]) {
            std::vector<int> currentComp;
            std::queue<int> q;

            visited[i] = true;
            q.push(i);

            while (!q.empty()) {
                int u = q.front();
                q.pop();
                currentComp.push_back(u);

                for (int v : adj[u]) {
                    if (!visited[v]) {
                        visited[v] = true;
                        q.push(v);
                    }
                }
            }
            components.push_back(currentComp);
        }
    }

    std::cout << "=== CONNECTED COMPONENTS DISCOVERY ===\\n";
    std::cout << "Total Components: " << components.size() << "\\n\\n";
    for (size_t i = 0; i < components.size(); ++i) {
        std::cout << "  Cluster #" << i + 1 << ": [ ";
        for (int node : components[i]) std::cout << node << " ";
        std::cout << "]\\n";
    }
}

int main() {
    int V = 7;
    std::vector<std::vector<int>> adj(V);
    auto addEdge = [&](int u, int v) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    };

    // Component 1
    addEdge(0, 1); addEdge(1, 2); addEdge(2, 0);
    // Component 2
    addEdge(3, 4);
    // Component 3
    addEdge(5, 6);

    findConnectedComponents(adj);
    return 0;
}`,
      java: `import java.util.*;

public class BFSConnectedComponents {
    public static void findComponents(List<List<Integer>> adj) {
        int V = adj.size();
        boolean[] visited = new boolean[V];
        List<List<Integer>> components = new ArrayList<>();

        for (int i = 0; i < V; i++) {
            if (!visited[i]) {
                List<Integer> cluster = new ArrayList<>();
                Queue<Integer> queue = new LinkedList<>();

                visited[i] = true;
                queue.offer(i);

                while (!queue.isEmpty()) {
                    int u = queue.poll();
                    cluster.add(u);

                    for (int v : adj.get(u)) {
                        if (!visited[v]) {
                            visited[v] = true;
                            queue.offer(v);
                        }
                    }
                }
                components.add(cluster);
            }
        }

        System.out.println("=== CONNECTED COMPONENTS (TOTAL: " + components.size() + ") ===");
        for (int i = 0; i < components.size(); i++) {
            System.out.println("  Component #" + (i + 1) + ": " + components.get(i));
        }
    }

    public static void main(String[] args) {
        int V = 7;
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < V; i++) adj.add(new ArrayList<>());

        adj.get(0).add(1); adj.get(1).add(0);
        adj.get(1).add(2); adj.get(2).add(1);
        adj.get(3).add(4); adj.get(4).add(3);
        adj.get(5).add(6); adj.get(6).add(5);

        findComponents(adj);
    }
}`,
      python: `from collections import deque
from typing import Dict, List

def find_connected_components(adj: Dict[int, List[int]]) -> List[List[int]]:
    """Partition a disconnected graph into isolated connected components using BFS."""
    visited = set()
    components = []

    for vertex in adj:
        if vertex not in visited:
            component = []
            queue = deque([vertex])
            visited.add(vertex)

            while queue:
                u = queue.popleft()
                component.append(u)

                for v in adj[u]:
                    if v not in visited:
                        visited.add(v)
                        queue.append(v)

            components.append(component)

    print(f"=== CONNECTED COMPONENTS (TOTAL: {len(components)}) ===")
    for i, comp in enumerate(components, 1):
        print(f"  Component #{i}: {comp}")

    return components

if __name__ == "__main__":
    adj = {
        0: [1, 2], 1: [0, 2], 2: [0, 1], # Cluster 1
        3: [4],    4: [3],               # Cluster 2
        5: [6],    6: [5]                # Cluster 3
    }
    find_connected_components(adj)`
    }
  },

  /* ─────────────────────────────────────────────────────────────
     CHAPTER 10 — BFS VS DFS COMPARATIVE ANALYSIS
  ───────────────────────────────────────────────────────────── */
  {
    id: "bfs-vs-dfs",
    chapterNum: "10",
    category: "COMPARATIVE ANALYSIS",
    readTime: "3 MIN",
    title: "10. BFS VS DFS COMPARATIVE ANALYSIS",
    tocTitle: "10 BFS vs DFS Comparison",
    execDefinition: "A structural and behavioral comparison between Breadth First Search (level-order FIFO queue traversal) and Depth First Search (deep-branch LIFO stack/recursion traversal).",
    analogy: "BFS is like pouring water on a flat floor: it spreads evenly in all directions. DFS is like a mouse exploring a maze: it runs down one tunnel as far as it can before hitting a wall and backing up.",
    specs: [
      "Data Structure: BFS uses a Queue (FIFO); DFS uses a Stack / Call Stack (LIFO).",
      "Traversal Shape: BFS expands in wide concentric rings; DFS dives deeply down a single lineage branch.",
      "Shortest Path: BFS guarantees shortest path in unweighted graphs; DFS does not guarantee shortest path.",
      "Memory Footprint: BFS memory depends on graph width (branching factor); DFS memory depends on tree depth."
    ],
    formula: "\\text{BFS Space} = O(B^D) \\quad \\text{vs} \\quad \\text{DFS Space} = O(D) \\quad (B=\\text{Branching}, D=\\text{Depth})",
    diagram: {
      step1Title: "1. DATA STRUCTURE",
      step1Val: "BFS: Queue | DFS: Stack",
      step2Title: "2. EXPLORATION",
      step2Val: "BFS: Wide | DFS: Deep",
      step3Title: "3. SHORTEST PATH",
      step3Val: "BFS: Yes (Unweighted)",
      step4Title: "4. BEST USE CASE",
      step4Val: "BFS: Proximity / Routing",
      trayLabel: "CORE METRIC COMPARISON MATRIX:",
      items: [
        { label: "Queue vs Stack", val: "BFS: FIFO | DFS: LIFO", active: true },
        { label: "Shortest Path", val: "BFS: Guaranteed Optimal", active: true },
        { label: "Graph Traversal", val: "BFS: Concentric Levels", active: true },
        { label: "Cycle Detection", val: "Both supported O(V+E)", active: false }
      ]
    },
    codeImplementations: {
      c: `#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

#define V 6

// 1. Breadth First Search (Iterative with FIFO Queue)
void bfsTraversal(int adj[V][V], int start) {
    bool visited[V] = {false};
    int queue[V];
    int front = 0, rear = -1;

    visited[start] = true;
    queue[++rear] = start;

    printf("BFS Order (Queue / Level-by-Level) : ");
    while (front <= rear) {
        int u = queue[front++];
        printf("%d ", u);

        for (int v = 0; v < V; v++) {
            if (adj[u][v] == 1 && !visited[v]) {
                visited[v] = true;
                queue[++rear] = v;
            }
        }
    }
    printf("\\n");
}

// 2. Depth First Search Helper (Recursive with Call Stack)
void dfsRecursive(int adj[V][V], int u, bool visited[V]) {
    visited[u] = true;
    printf("%d ", u);

    for (int v = 0; v < V; v++) {
        if (adj[u][v] == 1 && !visited[v]) {
            dfsRecursive(adj, v, visited);
        }
    }
}

void dfsTraversal(int adj[V][V], int start) {
    bool visited[V] = {false};
    printf("DFS Order (Stack / Deep Branch)    : ");
    dfsRecursive(adj, start, visited);
    printf("\\n");
}

int main() {
    int adj[V][V] = {
        {0, 1, 1, 0, 0, 0},
        {1, 0, 0, 1, 1, 0},
        {1, 0, 0, 0, 0, 1},
        {0, 1, 0, 0, 0, 0},
        {0, 1, 0, 0, 0, 0},
        {0, 0, 1, 0, 0, 0}
    };

    printf("=== BFS VS DFS COMPARISON ON THE SAME GRAPH ===\\n");
    bfsTraversal(adj, 0); // Output: 0 1 2 3 4 5
    dfsTraversal(adj, 0); // Output: 0 1 3 4 2 5
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>
#include <queue>
#include <stack>

class Graph {
    int V;
    std::vector<std::vector<int>> adj;

public:
    Graph(int vertices) : V(vertices), adj(vertices) {}

    void addEdge(int u, int v) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    // BFS (FIFO Queue)
    void bfs(int start) const {
        std::vector<bool> visited(V, false);
        std::queue<int> q;

        visited[start] = true;
        q.push(start);

        std::cout << "BFS (FIFO Queue / Concentric Waves): ";
        while (!q.empty()) {
            int u = q.front();
            q.pop();
            std::cout << u << " ";

            for (int v : adj[u]) {
                if (!visited[v]) {
                    visited[v] = true;
                    q.push(v);
                }
            }
        }
        std::cout << "\\n";
    }

    // DFS (LIFO Stack / Recursion)
    void dfs(int start) const {
        std::vector<bool> visited(V, false);
        std::cout << "DFS (LIFO Stack / Deep Lineage)    : ";
        dfsUtil(start, visited);
        std::cout << "\\n";
    }

private:
    void dfsUtil(int u, std::vector<bool>& visited) const {
        visited[u] = true;
        std::cout << u << " ";
        for (int v : adj[u]) {
            if (!visited[v]) dfsUtil(v, visited);
        }
    }
};

int main() {
    Graph g(6);
    g.addEdge(0, 1);
    g.addEdge(0, 2);
    g.addEdge(1, 3);
    g.addEdge(1, 4);
    g.addEdge(2, 5);

    std::cout << "=== BFS VS DFS TRAVERSAL COMPARISON ===\\n";
    g.bfs(0);
    g.dfs(0);
    return 0;
}`,
      java: `import java.util.*;

public class BFSvsDFS {
    private int V;
    private List<List<Integer>> adj;

    public BFSvsDFS(int vertices) {
        this.V = vertices;
        adj = new ArrayList<>(vertices);
        for (int i = 0; i < vertices; i++) adj.add(new ArrayList<>());
    }

    public void addEdge(int u, int v) {
        adj.get(u).add(v);
        adj.get(v).add(u);
    }

    // BFS (Queue)
    public void bfs(int start) {
        boolean[] visited = new boolean[V];
        Queue<Integer> queue = new LinkedList<>();

        visited[start] = true;
        queue.offer(start);

        System.out.print("BFS (Queue / Level-by-Level): ");
        while (!queue.isEmpty()) {
            int u = queue.poll();
            System.out.print(u + " ");

            for (int v : adj.get(u)) {
                if (!visited[v]) {
                    visited[v] = true;
                    queue.offer(v);
                }
            }
        }
        System.out.println();
    }

    // DFS (Recursion / Stack)
    public void dfs(int start) {
        boolean[] visited = new boolean[V];
        System.out.print("DFS (Stack / Deep-Branch)   : ");
        dfsHelper(start, visited);
        System.out.println();
    }

    private void dfsHelper(int u, boolean[] visited) {
        visited[u] = true;
        System.out.print(u + " ");
        for (int v : adj.get(u)) {
            if (!visited[v]) dfsHelper(v, visited);
        }
    }

    public static void main(String[] args) {
        BFSvsDFS g = new BFSvsDFS(6);
        g.addEdge(0, 1);
        g.addEdge(0, 2);
        g.addEdge(1, 3);
        g.addEdge(1, 4);
        g.addEdge(2, 5);

        System.out.println("=== BFS VS DFS TRAVERSAL COMPARISON ===");
        g.bfs(0);
        g.dfs(0);
    }
}`,
      python: `from collections import deque
from typing import Dict, List

def bfs(adj: Dict[int, List[int]], start: int) -> List[int]:
    """BFS: Level-order traversal using a FIFO Queue."""
    visited = {start}
    queue = deque([start])
    order = []

    while queue:
        u = queue.popleft()
        order.append(u)
        for v in adj[u]:
            if v not in visited:
                visited.add(v)
                queue.append(v)

    return order

def dfs(adj: Dict[int, List[int]], start: int) -> List[int]:
    """DFS: Depth-first traversal using a LIFO Stack / Recursion."""
    visited = set()
    order = []

    def dfs_util(u: int):
        visited.add(u)
        order.append(u)
        for v in adj[u]:
            if v not in visited:
                dfs_util(v)

    dfs_util(start)
    return order

if __name__ == "__main__":
    graph = {
        0: [1, 2],
        1: [0, 3, 4],
        2: [0, 5],
        3: [1],
        4: [1],
        5: [2]
    }

    print("=== BFS VS DFS TRAVERSAL COMPARISON ===")
    print("BFS Order (Concentric Waves):", bfs(graph, 0))
    print("DFS Order (Deep Branching)  :", dfs(graph, 0))`
    }
  },

  /* ─────────────────────────────────────────────────────────────
     CHAPTER 11 — TIME & SPACE COMPLEXITY ANALYSIS
  ───────────────────────────────────────────────────────────── */
  {
    id: "complexity-analysis",
    chapterNum: "11",
    category: "COMPLEXITY BOUNDS",
    readTime: "3 MIN",
    title: "11. TIME & SPACE COMPLEXITY ANALYSIS",
    tocTitle: "11 Complexity Analysis",
    execDefinition: "Rigorous asymptotic analysis demonstrating that BFS runs in linear time $O(V + E)$ and requires linear auxiliary memory space $O(V)$ when implemented with an adjacency list.",
    analogy: "Inspecting an office complex: you swipe your badge at every door once (O(V)) and check every connecting hallway between doors once (O(E)).",
    specs: [
      "Vertex Processing: Every vertex is enqueued at most once and dequeued at most once: $O(V)$.",
      "Edge Processing: In an undirected graph, every edge $(u,v)$ is examined exactly twice (once from $u$, once from $v$): $O(E)$.",
      "Adjacency List Runtime: Total Time Complexity = $O(V + E)$.",
      "Adjacency Matrix Runtime: Checking row entries takes $O(V)$ per node, yielding $O(V^2)$ total time.",
      "Space Complexity: The queue and visited set store at most $O(V)$ vertices at peak load: $O(V)$."
    ],
    formula: "\\text{Time: } O(V + E) \\quad \\mid \\quad \\text{Space: } O(V) \\quad (\\text{with Adjacency List})",
    diagram: {
      step1Title: "1. VERTEX OPS",
      step1Val: "V Enqueue + V Dequeue = O(V)",
      step2Title: "2. EDGE SCANS",
      step2Val: "Sum of degrees = 2E = O(E)",
      step3Title: "3. TOTAL TIME",
      step3Val: "O(V + E) Linear Time",
      step4Title: "4. TOTAL SPACE",
      step4Val: "Queue + Visited = O(V)",
      trayLabel: "ASYMPTOTIC RESOURCE BOUNDS:",
      items: [
        { label: "Time (Adj List)", val: "O(V + E) [Optimal]", active: true },
        { label: "Time (Matrix)", val: "O(V²) [Lookup dense]", active: false },
        { label: "Queue Space", val: "O(V) [Max frontier width]", active: true },
        { label: "Visited Space", val: "O(V) [Boolean flags]", active: true }
      ]
    }
  },

  /* ─────────────────────────────────────────────────────────────
     CHAPTER 12 — REAL-WORLD APPLICATIONS
  ───────────────────────────────────────────────────────────── */
  {
    id: "real-world-apps",
    chapterNum: "12",
    category: "ENGINEERING SYSTEMS",
    readTime: "3 MIN",
    title: "12. REAL-WORLD SYSTEMS & APPLICATIONS",
    tocTitle: "12 Real-World Applications",
    execDefinition: "How industry software systems leverage BFS for packet broadcasting, social connection degrees, web crawler page scrapers, GPS routing, and game AI pathfinding.",
    analogy: "LinkedIn's '1st degree', '2nd degree', and '3rd degree' connections: Level 1 are your direct friends, Level 2 are friends-of-friends, and Level 3 are friends-of-friends-of-friends.",
    specs: [
      "Social Networks: Computing degrees of separation and mutual friend recommendations (e.g., LinkedIn, Facebook).",
      "Web Crawlers: Scraping the World Wide Web by visiting root URLs and enqueuing outbound hyperlinks level by level.",
      "Network Routing & P2P: Flooding and broadcasting discovery packets across subnet routers and mesh nodes.",
      "GPS & Game AI: Finding the shortest obstacle-free path across 2D grid maps and mazes."
    ],
    formula: "\\text{Degrees of Separation}(s, t) = \\text{BFS Distance}(s, t)",
    diagram: {
      step1Title: "1. 1ST DEGREE",
      step1Val: "Direct Friends (Level 1)",
      step2Title: "2. 2ND DEGREE",
      step2Val: "Friends of Friends (Level 2)",
      step3Title: "3. 3RD DEGREE",
      step3Val: "Extended Network (Level 3)",
      step4Title: "4. PACKET BROADCAST",
      step4Val: "Subnet flood level-by-level",
      trayLabel: "REAL-WORLD APPLICATION SECTORS:",
      items: [
        { label: "Social Graph", val: "Degrees of separation (Level 1,2,3)", active: true },
        { label: "Web Crawling", val: "Google crawler link frontier", active: true },
        { label: "Game Pathfinding", val: "Shortest maze navigation", active: true },
        { label: "Network Routers", val: "Subnet packet broadcast", active: true }
      ]
    },
    codeImplementations: {
      c: `#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

#define ROWS 5
#define COLS 5

struct Point {
    int r, c;
};

// 2D Grid / Maze Shortest Path using BFS
int shortestPathGridBFS(int grid[ROWS][COLS], struct Point start, struct Point end) {
    if (grid[start.r][start.c] == 1 || grid[end.r][end.c] == 1) return -1;

    bool visited[ROWS][COLS] = {false};
    int dist[ROWS][COLS] = {0};

    struct Point queue[ROWS * COLS];
    int front = 0, rear = -1;

    // 4 Directional Moves: Up, Down, Left, Right
    int dr[] = {-1, 1, 0, 0};
    int dc[] = {0, 0, -1, 1};

    visited[start.r][start.c] = true;
    queue[++rear] = start;

    while (front <= rear) {
        struct Point curr = queue[front++];

        if (curr.r == end.r && curr.c == end.c) {
            printf("Shortest Maze Path found in %d steps!\\n", dist[curr.r][curr.c]);
            return dist[curr.r][curr.c];
        }

        for (int i = 0; i < 4; i++) {
            int nr = curr.r + dr[i];
            int nc = curr.c + dc[i];

            // Check boundary conditions and obstacles (1 = Wall, 0 = Open)
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS &&
                grid[nr][nc] == 0 && !visited[nr][nc]) {
                visited[nr][nc] = true;
                dist[nr][nc] = dist[curr.r][curr.c] + 1;
                queue[++rear] = (struct Point){nr, nc};
            }
        }
    }
    printf("Target is unreachable!\\n");
    return -1;
}

int main() {
    // 0 = Open Path, 1 = Obstacle / Wall
    int maze[ROWS][COLS] = {
        {0, 0, 1, 0, 0},
        {0, 1, 1, 0, 0},
        {0, 0, 0, 0, 1},
        {1, 1, 0, 1, 0},
        {0, 0, 0, 0, 0}
    };

    struct Point start = {0, 0};
    struct Point end = {4, 4};

    shortestPathGridBFS(maze, start, end);
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>
#include <queue>

struct Point {
    int r, c;
};

// Practical BFS Application: Shortest Path in a 2D Grid / Maze
int shortestPath2DGrid(const std::vector<std::vector<int>>& grid, Point start, Point end) {
    int R = grid.size();
    int C = grid[0].size();

    if (grid[start.r][start.c] == 1 || grid[end.r][end.c] == 1) return -1;

    std::vector<std::vector<int>> dist(R, std::vector<int>(C, -1));
    std::queue<Point> q;

    // 4 Cardinal Direction vectors
    const int dr[] = {-1, 1, 0, 0};
    const int dc[] = {0, 0, -1, 1};

    dist[start.r][start.c] = 0;
    q.push(start);

    while (!q.empty()) {
        Point curr = q.front();
        q.pop();

        if (curr.r == end.r && curr.c == end.c) {
            std::cout << "Shortest Path found in " << dist[curr.r][curr.c] << " moves!\\n";
            return dist[curr.r][curr.c];
        }

        for (int i = 0; i < 4; ++i) {
            int nr = curr.r + dr[i];
            int nc = curr.c + dc[i];

            if (nr >= 0 && nr < R && nc >= 0 && nc < C &&
                grid[nr][nc] == 0 && dist[nr][nc] == -1) {
                dist[nr][nc] = dist[curr.r][curr.c] + 1;
                q.push({nr, nc});
            }
        }
    }

    std::cout << "Target is unreachable!\\n";
    return -1;
}

int main() {
    std::vector<std::vector<int>> maze = {
        {0, 0, 1, 0, 0},
        {0, 1, 1, 0, 0},
        {0, 0, 0, 0, 1},
        {1, 1, 0, 1, 0},
        {0, 0, 0, 0, 0}
    };

    shortestPath2DGrid(maze, {0, 0}, {4, 4});
    return 0;
}`,
      java: `import java.util.*;

public class BFSRealWorldMaze {
    static class Cell {
        int r, c;
        Cell(int r, int c) { this.r = r; this.c = c; }
    }

    public static int solveMaze(int[][] grid, Cell start, Cell end) {
        int R = grid.length;
        int C = grid[0].length;

        if (grid[start.r][start.c] == 1 || grid[end.r][end.c] == 1) return -1;

        int[][] dist = new int[R][C];
        for (int[] row : dist) Arrays.fill(row, -1);

        Queue<Cell> queue = new LinkedList<>();

        int[] dr = {-1, 1, 0, 0};
        int[] dc = {0, 0, -1, 1};

        dist[start.r][start.c] = 0;
        queue.offer(start);

        while (!queue.isEmpty()) {
            Cell curr = queue.poll();

            if (curr.r == end.r && curr.c == end.c) {
                System.out.println("Shortest Maze Steps: " + dist[curr.r][curr.c]);
                return dist[curr.r][curr.c];
            }

            for (int i = 0; i < 4; i++) {
                int nr = curr.r + dr[i];
                int nc = curr.c + dc[i];

                if (nr >= 0 && nr < R && nc >= 0 && nc < C &&
                    grid[nr][nc] == 0 && dist[nr][nc] == -1) {
                    dist[nr][nc] = dist[curr.r][curr.c] + 1;
                    queue.offer(new Cell(nr, nc));
                }
            }
        }

        System.out.println("No path exists!");
        return -1;
    }

    public static void main(String[] args) {
        int[][] maze = {
            {0, 0, 1, 0, 0},
            {0, 1, 1, 0, 0},
            {0, 0, 0, 0, 1},
            {1, 1, 0, 1, 0},
            {0, 0, 0, 0, 0}
        };

        solveMaze(maze, new Cell(0, 0), new Cell(4, 4));
    }
}`,
      python: `from collections import deque
from typing import List, Tuple

def shortest_path_maze_bfs(grid: List[List[int]], start: Tuple[int, int], end: Tuple[int, int]) -> int:
    """Find the shortest path in a 2D Grid / Maze avoiding obstacles."""
    R, C = len(grid), len(grid[0])
    sr, sc = start
    er, ec = end

    if grid[sr][sc] == 1 or grid[er][ec] == 1:
        return -1

    queue = deque([(sr, sc, 0)]) # (row, col, distance)
    visited = {(sr, sc)}

    # 4-Directional moves (Up, Down, Left, Right)
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]

    while queue:
        r, c, dist = queue.popleft()

        if (r, c) == (er, ec):
            print(f"Shortest path in maze: {dist} steps!")
            return dist

        for dr, dc in directions:
            nr, nc = r + dr, c + dc

            if 0 <= nr < R and 0 <= nc < C and grid[nr][nc] == 0 and (nr, nc) not in visited:
                visited.add((nr, nc))
                queue.append((nr, nc, dist + 1))

    print("Goal is unreachable!")
    return -1

if __name__ == "__main__":
    # 0 = Open, 1 = Wall
    maze = [
        [0, 0, 1, 0, 0],
        [0, 1, 1, 0, 0],
        [0, 0, 0, 0, 1],
        [1, 1, 0, 1, 0],
        [0, 0, 0, 0, 0]
    ]
    shortest_path_maze_bfs(maze, (0, 0), (4, 4))`
    }
  }
];
