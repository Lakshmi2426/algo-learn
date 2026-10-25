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
    this.deductedLevels = new Set();
  }

  toggle(enable) {
    if (enable === false || (enable === undefined && this.isActive)) {
      this.isActive = false;
      if (this.isAutoPlaying) {
        this.pauseAutoPlay();
      }
      return false;
    }

    // Activating Guided Solve triggers penalty deduction exactly once per level session if incomplete
    this.isActive = true;
    const lvlNum = this.game ? (this.game.currentLevelIndex !== undefined ? this.game.currentLevelIndex + 1 : 1) : 1;
    const isCompleted = this.game && (this.game.isLevelCompleted || (this.game.completedLevels && this.game.completedLevels.has(this.game.currentLevelData ? this.game.currentLevelData.id : lvlNum)));
    if (!isCompleted && !this.deductedLevels.has(lvlNum)) {
      this.deductedLevels.add(lvlNum);
      if (typeof window.app !== "undefined" && typeof window.app.recordGuidedPenalty === "function") {
        window.app.recordGuidedPenalty(lvlNum);
      }
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
      const allNeighbors = this.game.graphEngine.getNeighbors(current);
      const eligibleUnvisited = (typeof this.game.getEligibleUnvisitedNeighbors === 'function')
        ? this.game.getEligibleUnvisitedNeighbors(current)
        : allNeighbors.filter(n => !visited.has(n) && !this.game.discovered.has(n) && !queue.includes(n));

      if (eligibleUnvisited.length > 0) {
        const nextNeighbor = eligibleUnvisited[0];
        const updatedQueue = [...queue, nextNeighbor];
        const alreadyQueued = allNeighbors.filter(n => queue.includes(n) && this.game.parent && this.game.parent[n] === current);

        let detailedText = `'${current}' has ${allNeighbors.length === 1 ? 'one' : allNeighbors.length} eligible neighbour${allNeighbors.length > 1 ? 's' : ''}: ${allNeighbors.join(', ')}. `;
        if (alreadyQueued.length > 0) {
          detailedText += `${alreadyQueued.join(', ')} is already in the queue, so enqueue '${nextNeighbor}' next. `;
        } else {
          detailedText += `'${nextNeighbor}' is unvisited, so add it to the queue. `;
        }
        if (queue.length > 0) {
          detailedText += `Once all neighbours have been enqueued, you can dequeue '${queue[0]}'.`;
        } else {
          detailedText += `Enqueue all eligible neighbours before dequeuing the next node.`;
        }

        return {
          actionType: "enqueue_neighbor",
          targetNode: nextNeighbor,
          buttonText: `Step: Enqueue Neighbour '${nextNeighbor}'`,
          headline: `Discover neighbour '${nextNeighbor}' from '${current}'`,
          explanation: detailedText,
          queuePreview: `[${updatedQueue.join(", ")}]`
        };
      } else {
        // All neighbors of current are enqueued! Now allow dequeue
        if (queue.length > 0) {
          const nextNode = queue[0];
          return {
            actionType: "dequeue",
            targetNode: nextNode,
            buttonText: `Step: Finish '${current}' ➔ Dequeue '${nextNode}'`,
            headline: `All neighbours of '${current}' are enqueued!`,
            explanation: `Neighbour-enqueueing stage for '${current}' is complete. Now follow FIFO queue order and DEQUEUE '${nextNode}' from the front of the queue.`,
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GuidedSolveEngine };
}
