/**
 * BFS Problem Solving & Game Engine
 * Coordinates state machine, levels, scoring, FIFO queue, visited set,
 * real-time BFS Spanning Tree, hint system, diagnostics, and level validation.
 */

class GameEngine {
  constructor() {
    this.currentLevelIndex = 0;
    this.currentLevelData = null;
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.mistakesCount = 0;
    this.correctActionsCount = 0;
    try {
      this.completedLevels = new Set(JSON.parse(localStorage.getItem("algolearn_completed_levels") || "[]"));
    } catch (e) {
      this.completedLevels = new Set();
    }

    // Runtime BFS state & Real-Time BFS Spanning Tree
    this.queue = [];
    this.visited = new Set();
    this.discovered = new Set();
    this.parent = {}; // { [childNodeId]: parentNodeId }
    this.distances = {}; // { [nodeId]: number }
    this.spanningTreeEdges = []; // [ { parent: 'A', child: 'B', level: 1 } ]
    this.bfsOrder = [];
    this.currentExplorerNode = null;
    this.nodeStates = {}; // 'unvisited' | 'discovered' | 'in_queue' | 'current' | 'visited'
    this.stepHistory = [];
    this.isLevelCompleted = false;
    this.lastDiscoveredEdge = null; // for animation pulse

    // Multi-stage hint system
    this.currentHintStage = 0;

    // Backward compatibility alias
    this.spanningTree = { nodes: [], edges: [] };

    // Timer for challenge mode
    this.timerInterval = null;
    this.timeLeft = 60;
    this.timerActive = false;

    // Sub-engines
    this.graphEngine = null;
    this.guidedEngine = null;
    this.dragDropEngine = null;
  }

  init(svgEl, containerEl) {
    this.graphEngine = new GraphEngine(containerEl, svgEl);
    this.guidedEngine = new GuidedSolveEngine(this);
    this.dragDropEngine = new DragDropEngine(this);
    this.loadLevel(0);
  }

  loadLevel(index) {
    if (index < 0 || index >= LEVELS_DATA.length) return;
    this.currentLevelIndex = index;
    this.currentLevelData = JSON.parse(JSON.stringify(LEVELS_DATA[index]));
    this.isLevelCompleted = false;
    this.currentHintStage = 0;

    const victoryModal = document.getElementById("victory-modal");
    if (victoryModal) {
      victoryModal.classList.add("hidden");
      victoryModal.classList.remove("flex");
      victoryModal.style.display = "none";
    }

    // Guided Solve must ALWAYS be reset to inactive when entering/loading any level
    if (this.guidedEngine) {
      this.guidedEngine.isActive = false;
      if (this.guidedEngine.isAutoPlaying) {
        this.guidedEngine.pauseAutoPlay();
      }
    }
    this.updateGuidedSolveUI();

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Reset BFS & Live Spanning Tree runtime states
    this.queue = [];
    this.visited = new Set();
    this.discovered = new Set();
    this.parent = {};
    this.distances = {};
    this.spanningTreeEdges = [];
    this.bfsOrder = [];
    this.currentExplorerNode = null;
    this.nodeStates = {};
    this.stepHistory = [];
    this.lastDiscoveredEdge = null;

    // Initialize all node states
    this.currentLevelData.graph.nodes.forEach(node => {
      this.nodeStates[node.id] = "unvisited";
    });

    const startNode = this.currentLevelData.startNode;
    this.parent[startNode] = null;
    this.distances[startNode] = 0;

    // Sync legacy object
    this.spanningTree = {
      nodes: [{ id: startNode, level: 0, parent: null }],
      edges: []
    };

    this.graphEngine.loadGraph(this.currentLevelData.graph);

    // Setup challenge timer if mode is challenge
    if (this.currentLevelData.mode === "challenge" || this.currentLevelData.timeLimitSeconds) {
      this.startChallengeTimer();
    } else {
      const timerEl = document.getElementById("level-timer-display");
      if (timerEl) timerEl.classList.add("hidden");
    }

    this.updateUI();
    this.render();
    this.updateStatsUI();
    if (typeof window.app !== "undefined" && typeof window.app.updateGameScoreboard === "function") {
      window.app.updateGameScoreboard();
    }

    if (window.soundManager) soundManager.playPop();
    const curSubLevel = this._getSubLevelNumber ? this._getSubLevelNumber(this.currentLevelIndex) : this.currentLevelData.id;
    this.showToast(`Level ${curSubLevel}: ${this.currentLevelData.title}`, "info");
  }

  _getSubLevelNumber(idx) {
    if (idx <= 1) return idx + 1;
    if (idx <= 4) return idx - 2 + 1;
    return idx - 5 + 1;
  }

  startChallengeTimer() {
    this.timeLeft = this.currentLevelData.timeLimitSeconds || 60;
    this.timerActive = true;
    const timerEl = document.getElementById("level-timer-display");
    const timerValueEl = document.getElementById("timer-value");
    if (timerEl) timerEl.classList.remove("hidden");
    if (timerValueEl) timerValueEl.textContent = `${this.timeLeft}s`;

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (timerValueEl) timerValueEl.textContent = `${this.timeLeft}s`;
      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.timerActive = false;
        this.showToast("⏳ Time's up! Reset or continue exploring.", "warning");
        if (window.soundManager) soundManager.playError();
      }
    }, 1000);
  }

  _getNodeLevel(nodeId) {
    if (!nodeId || nodeId === this.currentLevelData.startNode) return 0;
    if (this.distances[nodeId] !== undefined) return this.distances[nodeId];
    let level = 0;
    let curr = nodeId;
    const seen = new Set();
    while (this.parent[curr] && !seen.has(curr)) {
      seen.add(curr);
      level++;
      curr = this.parent[curr];
    }
    return level;
  }

  /**
   * Main Enqueue Interaction (Drag to Queue REAR or Click unvisited node)
   */
  handleNodeEnqueueAttempt(nodeId) {
    if (this.isLevelCompleted) return;

    // Check if graph node is marked unreachable (disconnected graph)
    const targetNodeObj = this.currentLevelData.graph.nodes.find(n => n.id === nodeId);
    if (targetNodeObj && targetNodeObj.isUnreachable) {
      this.mistakesCount++;
      this.streak = 0;
      this.updateStatsUI();
      if (window.soundManager) soundManager.playError();
      this.showMistakeGuidance({
        title: "⚠️ Unreachable Component Node",
        explanation: `Node '${nodeId}' is in a disconnected island component and cannot be reached from source '${this.currentLevelData.startNode}'.`,
        fix: "BFS only visits vertices in the connected component containing the source node."
      });
      return;
    }

    // Check mistake cases: already discovered, in queue, or visited
    if (this.visited.has(nodeId) || this.discovered.has(nodeId) || this.queue.includes(nodeId)) {
      this.mistakesCount++;
      this.streak = 0;
      this.updateStatsUI();
      if (window.soundManager) soundManager.playError();
      this.showMistakeGuidance({
        title: "⚠️ Visited Set Guard Active",
        explanation: `Node '${nodeId}' is already discovered/visited. It cannot be added again.`,
        fix: "This Visited Set rule prevents cycles from causing infinite loops in BFS!"
      });
      return;
    }

    // If queue is empty and we haven't enqueued start node yet
    if (!this.currentExplorerNode && this.queue.length === 0 && !this.discovered.has(this.currentLevelData.startNode)) {
      if (nodeId === this.currentLevelData.startNode) {
        this.queue.push(nodeId);
        this.discovered.add(nodeId);
        this.distances[nodeId] = 0;
        this.parent[nodeId] = null;
        this.nodeStates[nodeId] = "in_queue";
        this.correctActionsCount++;
        this.addScore(10);
        if (window.soundManager) soundManager.playEnqueue();

        this.stepHistory.push({ type: "init", text: `Source root node '${nodeId}' enqueued at REAR.` });
        this.showToast(`Source node '${nodeId}' added to Queue (REAR). Now click or drag to Dequeue it!`, "success");
        this.updateUI();
        this.render();
        this.renderSpanningTree();
        return;
      } else {
        this.mistakesCount++;
        this.streak = 0;
        this.updateStatsUI();
        if (window.soundManager) soundManager.playError();
        this.showMistakeGuidance({
          title: "⚠️ Start at the Source Node",
          explanation: `BFS must start by enqueuing the source/root node '${this.currentLevelData.startNode}'.`,
          fix: `Drag source node '${this.currentLevelData.startNode}' into the Queue first.`
        });
        return;
      }
    }

    // If no active explorer node (need to dequeue first)
    if (!this.currentExplorerNode) {
      this.showToast("⚡ Dequeue the front node first before adding new neighbors!", "info");
      return;
    }

    // Check if node is an adjacent neighbor of currentExplorerNode
    const neighbors = this.graphEngine.getNeighbors(this.currentExplorerNode);
    if (!neighbors.includes(nodeId)) {
      this.mistakesCount++;
      this.streak = 0;
      this.updateStatsUI();
      if (window.soundManager) soundManager.playError();
      this.showMistakeGuidance({
        title: "⚠️ Not an Adjacent Neighbor",
        explanation: `Node '${nodeId}' is not an immediate neighbor of active room '${this.currentExplorerNode}'.`,
        fix: `Only unvisited neighbors connected to '${this.currentExplorerNode}' can be discovered at this step.`
      });
      return;
    }

    // Valid discovery!
    const parentNode = this.currentExplorerNode;
    this.discovered.add(nodeId);
    this.queue.push(nodeId); // Added to REAR of queue
    this.nodeStates[nodeId] = "in_queue";

    // Set Parent and Distance
    this.parent[nodeId] = parentNode;
    const parentDist = this.distances[parentNode] !== undefined ? this.distances[parentNode] : this._getNodeLevel(parentNode);
    const childDist = parentDist + 1;
    this.distances[nodeId] = childDist;

    // Add ONLY the parent -> child discovery edge to Spanning Tree
    const newEdge = {
      parent: parentNode,
      child: nodeId,
      from: parentNode,
      to: nodeId,
      level: childDist
    };
    this.spanningTreeEdges.push(newEdge);
    this.lastDiscoveredEdge = newEdge;

    // Sync legacy object
    if (!this.spanningTree.nodes.some(n => n.id === nodeId)) {
      this.spanningTree.nodes.push({ id: nodeId, level: childDist, parent: parentNode });
    }
    this.spanningTree.edges.push({ from: parentNode, to: nodeId });

    this.correctActionsCount++;
    this.addScore(15);
    if (window.soundManager) soundManager.playEnqueue();

    this.stepHistory.push({
      type: "enqueue",
      text: `Discovered '${nodeId}' via '${parentNode}' ➔ Added Tree Edge (${parentNode} → ${nodeId}) at Level ${childDist}`
    });

    this.showToast(`Correct! '${nodeId}' discovered from '${parentNode}'. Added to Queue REAR (Tree Edge: ${parentNode} → ${nodeId})`, "success");

    this.checkTargetFound(nodeId);
    this.updateUI();
    this.render();
    this.renderSpanningTree();
    this.updateStatsUI();
  }

  /**
   * Main Dequeue Interaction (Drag FRONT node to Explorer Station or Click "Dequeue Front")
   */
  handleDequeueExplore() {
    if (this.isLevelCompleted) return;

    if (this.queue.length === 0) {
      if (window.soundManager) soundManager.playError();
      this.showToast("Queue is currently empty! All reachable nodes may be visited.", "info");
      this.checkLevelCompletion();
      return;
    }

    // Mark previous current node as processed/visited
    if (this.currentExplorerNode) {
      this.visited.add(this.currentExplorerNode);
      this.nodeStates[this.currentExplorerNode] = "visited";
    }

    // Remove from FRONT (FIFO)
    const nextNode = this.queue.shift();
    this.currentExplorerNode = nextNode;
    this.nodeStates[nextNode] = "current";
    this.visited.add(nextNode);

    if (!this.bfsOrder.includes(nextNode)) {
      this.bfsOrder.push(nextNode);
    }

    this.correctActionsCount++;
    this.addScore(10);
    if (window.soundManager) soundManager.playDequeue();

    this.stepHistory.push({
      type: "dequeue",
      text: `Dequeued '${nextNode}' from FRONT ➔ Current Explorer Node (Level ${this._getNodeLevel(nextNode)})`
    });

    this.showToast(`Exploring Room '${nextNode}' (Dequeued from FRONT). Look for its unvisited neighbors!`, "success");

    this.checkTargetFound(nextNode);
    this.updateUI();
    this.render();
    this.renderSpanningTree();
    this.updateStatsUI();

    setTimeout(() => {
      this.checkLevelCompletion();
    }, 350);
  }

  checkTargetFound(nodeId) {
    if (this.currentLevelData.targetNode && nodeId === this.currentLevelData.targetNode) {
      if (window.soundManager) soundManager.playSuccess();
      this.showToast(`🎯 Goal reached at '${nodeId}'! Shortest path discovered.`, "success");
      
      const path = this.graphEngine.calculateShortestPath(
        this.currentLevelData.startNode,
        this.currentLevelData.targetNode
      );
      if (path.length > 0) {
        this.graphEngine.highlightShortestPath(path);
      }
      setTimeout(() => this.triggerVictory(path), 600);
    }
  }

  checkLevelCompletion() {
    if (this.isLevelCompleted) return;

    if (this.currentLevelData.targetNode) {
      if (this.visited.has(this.currentLevelData.targetNode) || this.discovered.has(this.currentLevelData.targetNode)) {
        const path = this.graphEngine.calculateShortestPath(
          this.currentLevelData.startNode,
          this.currentLevelData.targetNode
        );
        this.triggerVictory(path);
      }
      return;
    }

    // For general graphs: check if all reachable nodes are visited and queue is empty
    const reachableNodes = this.currentLevelData.graph.nodes.filter(n => !n.isUnreachable);
    const allReachableVisited = reachableNodes.every(n => this.visited.has(n.id) || n.id === this.currentExplorerNode);

    let hasUnvisitedNeighbors = false;
    if (this.currentExplorerNode) {
      const neighbors = this.graphEngine.getNeighbors(this.currentExplorerNode);
      hasUnvisitedNeighbors = neighbors.some(n => !this.discovered.has(n) && !this.visited.has(n));
    }

    if (allReachableVisited && this.queue.length === 0 && !hasUnvisitedNeighbors) {
      this.triggerVictory();
    }
  }

  showMistakeGuidance(diagnosis) {
    const modal = document.getElementById("guidance-modal");
    const titleEl = document.getElementById("guidance-title");
    const expEl = document.getElementById("guidance-explanation");
    const fixEl = document.getElementById("guidance-fix");

    if (modal && titleEl && expEl && fixEl) {
      titleEl.textContent = diagnosis.title;
      expEl.textContent = diagnosis.explanation;
      fixEl.textContent = diagnosis.fix;
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    } else {
      this.showToast(`${diagnosis.title}: ${diagnosis.explanation}`, "warning");
    }
  }

  addScore(points) {
    this.streak++;
    if (this.streak > this.maxStreak) this.maxStreak = this.streak;
    const multiplier = Math.min(Math.floor(this.streak / 3) + 1, 4);
    this.score += points * multiplier;
    this.updateStatsUI();
  }

  updateStatsUI() {
    const scoreEl = document.getElementById("score-value");
    const streakEl = document.getElementById("streak-value");
    const mistakesEl = document.getElementById("mistakes-value");
    const accuracyEl = document.getElementById("accuracy-value");
    const liveScoreVal = document.getElementById("game-live-score-val");

    const totalActions = this.correctActionsCount + this.mistakesCount;
    const accuracy = totalActions > 0 ? Math.round((this.correctActionsCount / totalActions) * 100) : 100;

    const currentScore = (typeof window.app !== "undefined" && typeof window.app.getPointsSummary === "function")
      ? window.app.getPointsSummary().finalScore
      : this.score;

    this.score = currentScore;
    if (scoreEl) scoreEl.textContent = currentScore;
    if (liveScoreVal) liveScoreVal.textContent = currentScore;
    if (streakEl) streakEl.textContent = `${this.streak}x`;
    if (mistakesEl) mistakesEl.textContent = this.mistakesCount;
    if (accuracyEl) accuracyEl.textContent = `${accuracy}%`;
  }

  showToast(message, type = "info") {
    // Suppress screen-intrusive bottom-right floating popups as requested
    console.log(`[Game]: ${message}`);
  }

  provideNextHint() {
    this.currentHintStage++;
    const lvlNum = (this.currentLevelIndex !== undefined && this.currentLevelIndex !== null)
      ? (this.currentLevelIndex + 1)
      : (this.currentLevelData ? this.currentLevelData.id : 1);
    if (typeof window.app !== "undefined" && typeof window.app.recordHintPenalty === "function") {
      window.app.recordHintPenalty(lvlNum);
    }
    const startNode = this.currentLevelData.startNode;

    let hintTitle = `Hint ${this.currentHintStage}`;
    let hintText = "";

    if (!this.discovered.has(startNode)) {
      hintText = `Start by dragging the source node '${startNode}' into the Queue.`;
    } else if (this.queue.length > 0 && !this.currentExplorerNode) {
      hintText = `Remove the front node '${this.queue[0]}' from the FRONT of the queue to explore it.`;
    } else if (this.currentExplorerNode) {
      const neighbors = this.graphEngine.getNeighbors(this.currentExplorerNode);
      const unvisited = neighbors.filter(n => !this.discovered.has(n) && !this.visited.has(n));
      if (unvisited.length > 0) {
        hintText = `Look at unvisited neighbor(s) of '${this.currentExplorerNode}': [${unvisited.join(', ')}]. Drag them to the Queue REAR!`;
      } else if (this.queue.length > 0) {
        hintText = `All neighbors of '${this.currentExplorerNode}' are explored. Dequeue the next node '${this.queue[0]}' from the FRONT!`;
      } else {
        hintText = `Queue is empty and all reachable nodes are traversed. BFS Complete!`;
      }
    } else {
      hintText = "Remember: BFS explores level-by-level using a FIFO Queue.";
    }

    this.showMistakeGuidance({
      title: `BFS Step Guide (${hintTitle})`,
      explanation: hintText,
      fix: "Follow the 3-step loop: Dequeue from FRONT ➔ Discover unvisited neighbors ➔ Enqueue at REAR."
    });
  }

  triggerVictory(shortestPath = []) {
    if (this.isLevelCompleted) return;
    this.isLevelCompleted = true;
    this.completedLevels.add(this.currentLevelData.id);
    this.addScore(100); // Level completion bonus

    // Persist completed levels to localStorage
    try {
      localStorage.setItem("algolearn_completed_levels", JSON.stringify([...this.completedLevels]));
    } catch (e) {
      console.warn("Could not persist completed levels", e);
    }

    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.guidedEngine) {
      this.guidedEngine.isActive = false;
      if (this.guidedEngine.isAutoPlaying) {
        this.guidedEngine.pauseAutoPlay();
      }
    }
    this.updateGuidedSolveUI();

    if (window.soundManager) soundManager.playSuccess();

    // Record game level victory points
    if (typeof window.app !== "undefined" && typeof window.app.recordGameLevelVictory === "function") {
      window.app.recordGameLevelVictory(this.currentLevelData.id);
    }

    // Notify main app to update progress, badges, and dashboard
    if (typeof app !== "undefined") {
      const lvlId = this.currentLevelData.id;
      app.completedActivities.add(`level-${lvlId}`);

      // Map level completions to curriculum modules
      if (lvlId === 1) app.completedActivities.add("FN-03");
      if (lvlId === 2 || lvlId === 3) app.completedActivities.add("FN-04");
      if (lvlId === 4) app.completedActivities.add("FN-05");
      if (lvlId === 5) app.completedActivities.add("FN-06");
      if (lvlId === 6) app.completedActivities.add("FN-08");
      if (lvlId === 8 || lvlId === 9) app.completedActivities.add("FN-09");

      try {
        localStorage.setItem("algolearn_completed_activities", JSON.stringify([...app.completedActivities]));
      } catch (e) {}

      if (typeof app.updateProgressStats === "function") {
        app.updateProgressStats();
      }
      if (typeof app.renderProgressModules === "function") {
        app.renderProgressModules();
      }
      if (typeof app.renderLevelsGrid === "function") {
        app.renderLevelsGrid();
      }
    }

    this.render();
    this.renderSpanningTree();

    const modal = document.getElementById("victory-modal");
    const title = document.getElementById("victory-title");
    const desc = document.getElementById("victory-desc");
    const pathBox = document.getElementById("victory-path-box");

    if (modal && title && desc) {
      const nextLevelData = (typeof LEVELS_DATA !== "undefined" && this.currentLevelIndex + 1 < LEVELS_DATA.length)
        ? LEVELS_DATA[this.currentLevelIndex + 1]
        : null;

      title.textContent = `Level ${this.currentLevelData.id} Complete!`;
      
      const totalReachable = this.currentLevelData.graph.nodes.filter(n => !n.isUnreachable).length;
      const orderList = this.bfsOrder.length > 0 ? this.bfsOrder : [this.currentLevelData.startNode];

      desc.innerHTML = `
        <div class="victory-summary-flow">
          <!-- Level Name Pill -->
          <div class="victory-level-subtitle">${this.currentLevelData.title}</div>

          <!-- Traversal Order Card -->
          <div class="victory-card-section">
            <div class="vic-sec-label">BFS TRAVERSAL SEQUENCE</div>
            <div class="vic-sequence-row">
              ${orderList.map((id, idx) => `
                <span class="vic-node-chip">${id}</span>
                ${idx < orderList.length - 1 ? '<span class="vic-seq-arrow">➔</span>' : ''}
              `).join('')}
            </div>
          </div>

          <!-- Metrics Grid (2 Columns) -->
          <div class="vic-metrics-grid">
            <div class="vic-metric-box">
              <div class="vic-metric-title">Tree Discovery Edges</div>
              <div class="vic-metric-val">${this.spanningTreeEdges.length} / ${Math.max(0, totalReachable - 1)} Edges</div>
            </div>
            <div class="vic-metric-box">
              <div class="vic-metric-title">Theoretical Complexity</div>
              <div class="vic-metric-val">Time: <code>O(V+E)</code> &bull; Space: <code>O(V)</code></div>
            </div>
          </div>

          <!-- Next Level Card -->
          ${nextLevelData ? `
            <div class="vic-next-level-card">
              <div class="vic-next-tag">NEXT CHALLENGE UNLOCKED</div>
              <div class="vic-next-name">Level ${this._getSubLevelNumber(this.currentLevelIndex + 1)}: ${nextLevelData.title}</div>
              <div class="vic-next-desc">${nextLevelData.subtitle}</div>
            </div>
          ` : `
            <div class="vic-all-cleared-card">
              <div class="vic-next-name" style="color: #10b981;">Mastered All Challenges!</div>
              <div class="vic-next-desc">You are ready for the final BFS Mastery Examination!</div>
            </div>
          `}
        </div>
      `;

      if (shortestPath && shortestPath.length > 0) {
        pathBox.classList.remove("hidden");
        pathBox.innerHTML = `<strong>Shortest Path:</strong> ${shortestPath.join(" ➔ ")} (${shortestPath.length - 1} hops)`;
      } else {
        pathBox.classList.add("hidden");
      }

      const nextBtn = document.getElementById("victory-next-btn");
      if (nextBtn) {
        if (nextLevelData) {
          const nextSub = this._getSubLevelNumber(this.currentLevelIndex + 1);
          nextBtn.innerHTML = `Continue to Level ${nextSub} &rarr;`;
        } else {
          nextBtn.innerHTML = `Mastery Examination &rarr;`;
        }
      }

      modal.classList.remove("hidden");
      modal.classList.add("flex");
      modal.style.display = "flex";
    }
  }

  nextLevel() {
    const victoryModal = document.getElementById("victory-modal");
    if (victoryModal) {
      victoryModal.classList.add("hidden");
      victoryModal.classList.remove("flex");
      victoryModal.style.display = "none";
    }

    const nextIdx = this.currentLevelIndex + 1;
    if (typeof LEVELS_DATA !== "undefined" && nextIdx < LEVELS_DATA.length) {
      if (typeof app !== 'undefined' && app.openLevelProblem) {
        app.openLevelProblem(nextIdx);
      } else {
        this.loadLevel(nextIdx);
      }
    } else {
      if (typeof app !== 'undefined' && app.switchTab) {
        app.switchTab("quiz");
      }
    }
  }

  restartLevel() {
    const victoryModal = document.getElementById("victory-modal");
    if (victoryModal) {
      victoryModal.classList.add("hidden");
      victoryModal.classList.remove("flex");
      victoryModal.style.display = "none";
    }
    this.loadLevel(this.currentLevelIndex);
  }

  /**
   * Real-Time BFS Spanning Tree Renderer
   * Strictly renders discovery relationships (parent -> child)
   */
  renderSpanningTree() {
    const svg = document.getElementById("spanning-tree-svg");
    const badge = document.getElementById("spanning-tree-badge");
    const orderText = document.getElementById("spanning-tree-order-text");
    if (!svg || !this.currentLevelData) return;

    const startNode = this.currentLevelData.startNode;
    const edgeCount = this.spanningTreeEdges.length;

    // 1. Update Discovery Edges badge
    if (badge) {
      const reachableNodes = this.currentLevelData.graph.nodes.filter(n => !n.isUnreachable);
      badge.textContent = `${edgeCount} / ${Math.max(0, reachableNodes.length - 1)} Tree Edges`;
    }

    // 2. Update BFS Traversal order text
    if (orderText) {
      orderText.textContent = this.bfsOrder.join(" ➔ ") || startNode;
    }

    // 3. Build list of all discovered nodes in Spanning Tree
    const treeNodes = [{ id: startNode, level: 0, parent: null }];
    this.spanningTreeEdges.forEach(edge => {
      if (!treeNodes.some(n => n.id === edge.child)) {
        treeNodes.push({ id: edge.child, level: edge.level || this._getNodeLevel(edge.child), parent: edge.parent });
      }
    });

    // 4. Group tree nodes by level
    const levelMap = {};
    treeNodes.forEach(n => {
      const lvl = n.level || 0;
      if (!levelMap[lvl]) levelMap[lvl] = [];
      levelMap[lvl].push(n);
    });

    const maxLevel = Math.max(...Object.keys(levelMap).map(Number), 0);
    const svgWidth = 300;
    const rowHeight = 52;
    const svgHeight = Math.max(140, (maxLevel + 1) * rowHeight + 25);

    svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
    svg.style.height = `${svgHeight}px`;

    // 5. Compute coordinates (x, y) for each node in level hierarchy
    const nodePos = {};
    Object.keys(levelMap).forEach(lvlStr => {
      const lvl = Number(lvlStr);
      const nodesAtLvl = levelMap[lvl];
      const count = nodesAtLvl.length;
      const y = 26 + lvl * rowHeight;
      nodesAtLvl.forEach((n, idx) => {
        const x = (svgWidth / (count + 1)) * (idx + 1);
        nodePos[n.id] = { x, y, level: lvl };
      });
    });

    const isDark = document.body.classList.contains("dark-theme") || 
                   document.documentElement.getAttribute("data-theme") === "dark";

    let svgHTML = `
      <defs>
        <linearGradient id="primary-gradient-st" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#2E55FA"/>
          <stop offset="100%" stop-color="#7A27FD"/>
        </linearGradient>
        <filter id="stGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#7A27FD" flood-opacity="0.6"/>
        </filter>
        <filter id="stEdgePulse" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#7A27FD" flood-opacity="0.8"/>
        </filter>
      </defs>
    `;

    // 6. Draw tree discovery edges (ONLY parent -> child!)
    this.spanningTreeEdges.forEach(edge => {
      const p1 = nodePos[edge.parent];
      const p2 = nodePos[edge.child];
      if (p1 && p2) {
        const isNewlyAdded = this.lastDiscoveredEdge && 
          this.lastDiscoveredEdge.parent === edge.parent && 
          this.lastDiscoveredEdge.child === edge.child;

        const x2 = (p1.x === p2.x) ? p2.x + 0.1 : p2.x;
        svgHTML += `
          <line x1="${p1.x}" y1="${p1.y}" x2="${x2}" y2="${p2.y}" 
                stroke="url(#primary-gradient-st)" 
                stroke-width="${isNewlyAdded ? 4 : 3}" 
                stroke-opacity="1" 
                stroke-linecap="round" 
                class="st-tree-edge ${isNewlyAdded ? 'edge-pulse-active' : ''}" />
        `;
      }
    });

    // 7. Draw tree nodes with level tags
    treeNodes.forEach(n => {
      const pos = nodePos[n.id];
      if (!pos) return;

      const isCurrent = this.currentExplorerNode === n.id;
      let fill = isDark ? "#070d1c" : "#ffffff";
      let stroke = "url(#primary-gradient-st)";
      let textFill = isDark ? "#ffffff" : "#0f172a";

      svgHTML += `
        <g class="st-tree-node-group" filter="url(#stGlow)">
          ${isCurrent ? `<circle cx="${pos.x}" cy="${pos.y}" r="20" fill="none" stroke="url(#primary-gradient-st)" stroke-width="2" stroke-dasharray="3 3"><animateTransform attributeName="transform" type="rotate" from="0 ${pos.x} ${pos.y}" to="360 ${pos.x} ${pos.y}" dur="4s" repeatCount="indefinite"/></circle>` : ''}
          <circle cx="${pos.x}" cy="${pos.y}" r="15" fill="${fill}" stroke="${stroke}" stroke-width="2.5" class="st-node-circle" />
          <text x="${pos.x}" y="${pos.y + 4.5}" text-anchor="middle" font-size="11.5" font-weight="900" fill="${textFill}" class="st-tree-node-label">${n.id}</text>
          <text x="${pos.x + 18}" y="${pos.y - 4}" font-size="8.5" font-weight="800" fill="${isDark ? '#ffffff' : '#475569'}" class="st-tree-level-label">L${pos.level}</text>
        </g>
      `;
    });

    svg.innerHTML = svgHTML;
  }

  _getNodeLevel(nodeId) {
    if (this.distances[nodeId] !== undefined) return this.distances[nodeId];
    if (this.currentLevelData && this.currentLevelData.graph && this.currentLevelData.graph.nodes) {
      const n = this.currentLevelData.graph.nodes.find(node => node.id === nodeId);
      if (n && n.level !== undefined) return n.level;
    }
    return 0;
  }

  updateUI() {
    const lvlTitle = document.getElementById("level-title") || document.getElementById("active-problem-name");
    const lvlSubtitle = document.getElementById("level-subtitle");
    const lvlGoal = document.getElementById("level-goal-text");
    const theorySummary = document.getElementById("theory-summary");
    const theoryKeyRule = document.getElementById("theory-key-rule");

    if (lvlTitle) lvlTitle.textContent = this.currentLevelData.title;
    if (lvlSubtitle) lvlSubtitle.textContent = this.currentLevelData.subtitle;
    if (lvlGoal) lvlGoal.textContent = this.currentLevelData.goalText;

    if (theorySummary && this.currentLevelData.theory) {
      theorySummary.textContent = this.currentLevelData.theory.summary;
      theoryKeyRule.textContent = this.currentLevelData.theory.keyRule;
    }

    // Render FIFO Queue Tray
    const queueSlotsContainer = document.getElementById("queue-items-container");
    if (queueSlotsContainer) {
      queueSlotsContainer.innerHTML = '';
      if (this.queue.length === 0) {
        queueSlotsContainer.innerHTML = `<div class="queue-empty-msg">Queue is empty (FIFO waiting line)</div>`;
      } else {
        this.queue.forEach((nodeId, idx) => {
          const item = document.createElement("div");
          item.className = `queue-chip ${idx === 0 ? 'queue-front-chip' : ''}`;
          item.innerHTML = `
            ${idx === 0 ? '<span class="chip-tag">FRONT (Next)</span>' : '<span class="chip-tag">WAITING</span>'}
            <span class="chip-id">${nodeId}</span>
          `;
          if (idx === 0) {
            item.setAttribute("title", "Drag me to Active Explorer Station to Dequeue (or click Dequeue Front)!");
            item.setAttribute("draggable", "true");
            item.addEventListener("mousedown", (e) => this.dragDropEngine.startQueueFrontDrag(nodeId, e));
            item.addEventListener("touchstart", (e) => this.dragDropEngine.startQueueFrontDrag(nodeId, e), { passive: true });
          }
          queueSlotsContainer.appendChild(item);
        });
      }
    }

    // Render Active Explorer Node Station
    const explorerNodeBox = document.getElementById("active-explorer-node");
    if (explorerNodeBox) {
      if (this.currentExplorerNode) {
        const neighbors = this.graphEngine.getNeighbors(this.currentExplorerNode);
        const unvisitedNeighbors = neighbors.filter(n => !this.discovered.has(n) && !this.visited.has(n));

        explorerNodeBox.innerHTML = `
          <div class="active-explorer-badge">
            <span class="exp-icon" style="display:flex; align-items:center;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            </span>
            <span class="exp-id">${this.currentExplorerNode}</span>
            <div class="exp-details">
              <span class="exp-status">Active Node (Level ${this._getNodeLevel(this.currentExplorerNode)})</span>
              <span class="exp-unvisited-tag">Unvisited Neighbors: ${unvisitedNeighbors.length > 0 ? unvisitedNeighbors.join(', ') : 'None left'}</span>
            </div>
          </div>
        `;
      } else {
        explorerNodeBox.innerHTML = `
          <div class="explorer-placeholder">
            <span>Drop Front Node Here or Click "Dequeue Front"</span>
          </div>
        `;
      }
    }

    // Render Visited Tracker Chips
    const visitedContainer = document.getElementById("visited-chips-container");
    if (visitedContainer) {
      visitedContainer.innerHTML = '';
      if (this.visited.size === 0) {
        visitedContainer.innerHTML = `<span class="empty-hint">No nodes processed yet</span>`;
      } else {
        Array.from(this.visited).forEach(nodeId => {
          const chip = document.createElement("span");
          chip.className = "visited-chip";
          chip.innerHTML = `<strong>${nodeId}</strong> <small>(d=${this._getNodeLevel(nodeId)})</small>`;
          visitedContainer.appendChild(chip);
        });
      }
    }

    // Render BFS Distances / Levels Bar
    const levelsBar = document.getElementById("bfs-levels-distance-bar");
    if (levelsBar) {
      const allDiscovered = Array.from(this.discovered);
      if (allDiscovered.length === 0) {
        levelsBar.innerHTML = `<span class="empty-hint">Distances will calculate automatically as nodes are discovered.</span>`;
      } else {
        levelsBar.innerHTML = allDiscovered.map(id => {
          const d = this.distances[id] !== undefined ? this.distances[id] : 0;
          return `<span class="distance-badge"><strong>${id}</strong>: dist = ${d}</span>`;
        }).join(" ");
      }
    }

    this.updateGuidedSolveUI();
  }

  updateGuidedSolveUI() {
    const guidedContainer = document.getElementById("guided-solve-container");
    const nextMoveBtn = document.getElementById("guided-next-btn");
    const guidedExplain = document.getElementById("guided-explanation-text");
    const toggleBtn = document.getElementById("guided-mode-toggle-btn");

    if (guidedContainer) {
      if (this.guidedEngine && this.guidedEngine.isActive) {
        guidedContainer.classList.remove("hidden");
        guidedContainer.style.display = "block";
        const nextAction = this.guidedEngine.getNextActionDescription();
        if (nextMoveBtn) nextMoveBtn.textContent = "Next Step";
        if (guidedExplain && nextAction) {
          guidedExplain.innerHTML = `
            <strong>${nextAction.headline}</strong><br/>
            <span>${nextAction.explanation}</span><br/>
            <span class="q-state">Queue State: ${nextAction.queuePreview}</span>
          `;
        }
        if (toggleBtn) {
          toggleBtn.classList.add("active");
          toggleBtn.setAttribute("aria-pressed", "true");
        }
      } else {
        guidedContainer.classList.add("hidden");
        guidedContainer.style.display = "none";
        if (toggleBtn) {
          toggleBtn.classList.remove("active");
          toggleBtn.setAttribute("aria-pressed", "false");
        }
      }
    }
  }

  render() {
    if (!this.graphEngine || !this.currentLevelData) return;

    this.graphEngine.render(
      this.nodeStates,
      this.currentExplorerNode,
      this.currentLevelData.targetNode,
      (nodeId, e) => this.dragDropEngine.startNodeDrag(nodeId, e),
      (nodeId) => this.handleNodeEnqueueAttempt(nodeId) // Click-to-enqueue fallback
    );
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GameEngine };
}
