/**
 * BFS Adventure - Guided Solve & Error Guidance Engine
 * Supports single-step execution, auto-play with pause/resume, and smart error diagnosis.
 */

class GuidedSolveEngine {
  constructor(gameEngine) {
    this.game = gameEngine;
    this.isActive = false;
    this.isAutoPlaying = false;
    this.autoPlayInterval = null;
    this.stepSpeedMs = 1800;
  }

  toggle(enable) {
    if (enable === false || (enable === undefined && this.isActive)) {
      this.isActive = false;
      if (this.isAutoPlaying) {
        this.pauseAutoPlay();
      }
      return false;
    }

    // Activating Guided Solve triggers penalty deduction (even if user has 0 points, allowing score to go negative)
    this.isActive = true;
    const lvlNum = this.game ? (this.game.currentLevelIndex !== undefined ? this.game.currentLevelIndex + 1 : 1) : 1;
    if (typeof window.app !== "undefined" && typeof window.app.recordGuidedPenalty === "function") {
      window.app.recordGuidedPenalty(lvlNum);
    }
    return this.isActive;
  }

  reset() {
    this.isActive = false;
    this.pauseAutoPlay();
    if (this.game && typeof this.game.updateGuidedSolveUI === "function") {
      this.game.updateGuidedSolveUI();
    }
  }

  getNextActionDescription() {
    const queue = [...this.game.queue];
    const current = this.game.currentExplorerNode;
    const visited = this.game.visited;
    const levelData = this.game.currentLevelData;

    // Case 1: Level not yet initialized with start node
    if (!current && queue.length === 0 && !visited.has(levelData.startNode)) {
      return {
        actionType: "enqueue_start",
        targetNode: levelData.startNode,
        buttonText: `Enqueue Start (${levelData.startNode})`,
        headline: `Initialize BFS: Enqueue Root Node '${levelData.startNode}'`,
        explanation: `BFS always starts by adding the origin node (${levelData.startNode}) into the FIFO Queue at Level 0.`,
        queuePreview: `[${levelData.startNode}]`
      };
    }

    // Case 2: No active node, dequeue front of queue
    if (!current && queue.length > 0) {
      const nextToExplore = queue[0];
      return {
        actionType: "dequeue",
        targetNode: nextToExplore,
        buttonText: `Step: Dequeue '${nextToExplore}'`,
        headline: `DEQUEUE '${nextToExplore}' from Front of Queue`,
        explanation: `FIFO Principle: '${nextToExplore}' has waited the longest, so it is removed first to become the active explorer room.`,
        queuePreview: `[${queue.slice(1).join(", ")}]`
      };
    }

    // Case 3: Currently exploring a node -> check for unvisited neighbors
    if (current) {
      const neighbors = this.game.graphEngine.getNeighbors(current);
      const unvisitedNeighbors = neighbors.filter(n => !visited.has(n) && !this.game.discovered.has(n) && !queue.includes(n));

      if (unvisitedNeighbors.length > 0) {
        const nextNeighbor = unvisitedNeighbors[0];
        const updatedQueue = [...queue, nextNeighbor];
        return {
          actionType: "enqueue_neighbor",
          targetNode: nextNeighbor,
          buttonText: `Step: Enqueue Neighbor '${nextNeighbor}'`,
          headline: `Discover neighbor '${nextNeighbor}' from '${current}'`,
          explanation: `Checking doors from '${current}'. Room '${nextNeighbor}' is unvisited, so we add it to the back of the Queue.`,
          queuePreview: `[${updatedQueue.join(", ")}]`
        };
      } else {
        // All neighbors of current are enqueued/visited -> Dequeue next or complete
        if (queue.length > 0) {
          const nextNode = queue[0];
          return {
            actionType: "dequeue",
            targetNode: nextNode,
            buttonText: `Step: Finish '${current}' ➔ Dequeue '${nextNode}'`,
            headline: `All neighbors of '${current}' are discovered.`,
            explanation: `We finish room '${current}' and DEQUEUE the next waiting node ('${nextNode}') from the front of the Queue.`,
            queuePreview: `[${queue.slice(1).join(", ")}]`
          };
        } else {
          return {
            actionType: "complete",
            targetNode: null,
            buttonText: `Level Complete!`,
            headline: `Queue is empty — Traversal Finished!`,
            explanation: `All reachable nodes at every level have been fully explored.`,
            queuePreview: `[]`
          };
        }
      }
    }

    return {
      actionType: "complete",
      targetNode: null,
      buttonText: `Completed`,
      headline: `All steps finished.`,
      explanation: `Traversal is complete.`,
      queuePreview: `[]`
    };
  }

  performSingleStep() {
    const nextAction = this.getNextActionDescription();
    if (!nextAction) return;

    if (nextAction.actionType === "enqueue_start" || nextAction.actionType === "enqueue_neighbor") {
      this.game.handleNodeEnqueueAttempt(nextAction.targetNode);
    } else if (nextAction.actionType === "dequeue") {
      this.game.handleDequeueExplore();
    } else if (nextAction.actionType === "complete") {
      if (this.isAutoPlaying) this.pauseAutoPlay();
      this.isActive = false;
      this.game.triggerVictory();
    }

    this.game.updateGuidedSolveUI();
    return nextAction;
  }

  startAutoPlay() {
    this.isAutoPlaying = true;
    this.updateAutoPlayButtonsUI();
    
    // Execute first step immediately
    this.performSingleStep();

    if (this.autoPlayInterval) clearInterval(this.autoPlayInterval);
    this.autoPlayInterval = setInterval(() => {
      if (!this.isAutoPlaying || this.game.isLevelCompleted) {
        this.pauseAutoPlay();
        return;
      }
      this.performSingleStep();
    }, this.stepSpeedMs);
  }

  pauseAutoPlay() {
    this.isAutoPlaying = false;
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
    this.updateAutoPlayButtonsUI();
  }

  toggleAutoPlay() {
    if (this.isAutoPlaying) {
      this.pauseAutoPlay();
    } else {
      this.startAutoPlay();
    }
  }

  updateAutoPlayButtonsUI() {
    const autoPlayBtn = document.getElementById("guided-autoplay-btn");
    if (autoPlayBtn) {
      autoPlayBtn.innerHTML = this.isAutoPlaying ? "⏸️ Pause Auto-Solve" : "▶️ Auto-Play Steps";
      autoPlayBtn.classList.toggle("btn-warning", this.isAutoPlaying);
      autoPlayBtn.classList.toggle("btn-outline", !this.isAutoPlaying);
    }
  }

  diagnoseMistake(actionType, attemptedNodeId) {
    const current = this.game.currentExplorerNode;
    const visited = this.game.visited;
    const queue = this.game.queue;

    if (actionType === "enqueue") {
      if (visited.has(attemptedNodeId)) {
        return {
          title: "⚠️ Cycle / Re-discovery Mistake",
          explanation: `You tried to add node '${attemptedNodeId}', but it has ALREADY been visited.`,
          fix: `In BFS, always check the visited set first. If a node is already visited, skip it!`
        };
      }
      if (queue.includes(attemptedNodeId)) {
        return {
          title: "⚠️ Duplicate Queue Mistake",
          explanation: `Node '${attemptedNodeId}' is already waiting inside the Queue.`,
          fix: `Do not add a node twice to the queue. Wait until it reaches the front.`
        };
      }
      if (current) {
        const neighbors = this.game.graphEngine.getNeighbors(current);
        if (!neighbors.includes(attemptedNodeId)) {
          return {
            title: "⚠️ Disconnected Node Mistake",
            explanation: `Node '${attemptedNodeId}' is not connected to active node '${current}'.`,
            fix: `BFS only adds direct immediate neighbors of the current active room. Choose one of: [${neighbors.join(", ")}].`
          };
        }
      }
    }

    if (actionType === "dequeue_empty") {
      return {
        title: "⚠️ Empty Queue Mistake",
        explanation: `Cannot dequeue because the Queue is currently empty.`,
        fix: `Drag an unvisited neighbor into the queue first before dequeuing.`
      };
    }

    return {
      title: "⚠️ Traversal Mistake",
      explanation: `That move violates the Breadth First Search order.`,
      fix: `Remember the 3-step rhythm: Dequeue front ➔ Explore connected doors ➔ Enqueue unvisited neighbors.`
    };
  }
}

window.GuidedSolveEngine = GuidedSolveEngine;
