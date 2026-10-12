/**
 * BFS Adventure & Problem Solving — Drag & Drop Engine
 * Supports HTML5 Drag-and-Drop + Pointer Events fallback + Interactive Click support
 * Prevents accidental background text selection during node dragging
 */

class DragDropEngine {
  constructor(gameEngine) {
    this.game = gameEngine;
    this.draggedNodeId = null;
    this.dragType = null; // 'graph-node' | 'queue-front'
    this.ghostEl = null;
    this.initGlobalListeners();
  }

  initGlobalListeners() {
    // Prevent default drag over on body to allow drop events
    document.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    // Pointer move for custom smooth dragging
    document.addEventListener("pointermove", (e) => {
      if (this.ghostEl) {
        this.ghostEl.style.left = `${e.clientX - 26}px`;
        this.ghostEl.style.top = `${e.clientY - 26}px`;
      }
    });

    document.addEventListener("pointerup", (e) => {
      if (this.ghostEl) {
        this.handlePointerDrop(e);
        this.resetDrag();
      }
    });

    document.addEventListener("pointercancel", () => {
      this.resetDrag();
    });
  }

  startNodeDrag(nodeId, event) {
    if (this.game.isLevelCompleted) return;
    if (event) {
      if (event.preventDefault) event.preventDefault();
    }
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
    document.body.classList.add("dragging-in-progress");

    this.draggedNodeId = nodeId;
    this.dragType = 'graph-node';

    // Create visual ghost token
    if (this.ghostEl) this.ghostEl.remove();
    this.ghostEl = document.createElement("div");
    this.ghostEl.className = "drag-ghost-token";
    this.ghostEl.innerHTML = `<span>${nodeId}</span>`;
    document.body.appendChild(this.ghostEl);

    const clientX = event && event.touches ? event.touches[0].clientX : (event ? event.clientX : 0);
    const clientY = event && event.touches ? event.touches[0].clientY : (event ? event.clientY : 0);
    this.ghostEl.style.left = `${clientX - 26}px`;
    this.ghostEl.style.top = `${clientY - 26}px`;

    // Highlight valid dropzones (Queue Tray)
    const queueZone = document.getElementById("queue-dropzone");
    if (queueZone) queueZone.classList.add("drop-target-active");
  }

  startQueueFrontDrag(nodeId, event) {
    if (this.game.isLevelCompleted) return;
    if (event) {
      if (event.preventDefault) event.preventDefault();
    }
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
    document.body.classList.add("dragging-in-progress");

    this.draggedNodeId = nodeId;
    this.dragType = 'queue-front';

    if (this.ghostEl) this.ghostEl.remove();
    this.ghostEl = document.createElement("div");
    this.ghostEl.className = "drag-ghost-token explorer-ghost";
    this.ghostEl.innerHTML = `<span>🧭 ${nodeId}</span>`;
    document.body.appendChild(this.ghostEl);

    const clientX = event && event.touches ? event.touches[0].clientX : (event ? event.clientX : 0);
    const clientY = event && event.touches ? event.touches[0].clientY : (event ? event.clientY : 0);
    this.ghostEl.style.left = `${clientX - 26}px`;
    this.ghostEl.style.top = `${clientY - 26}px`;

    const explorerStation = document.getElementById("explorer-station-dropzone");
    if (explorerStation) explorerStation.classList.add("drop-target-active");
  }

  handlePointerDrop(e) {
    // Remove active highlight from dropzones
    document.querySelectorAll(".drop-target-active").forEach(el => {
      el.classList.remove("drop-target-active");
    });

    const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
    if (!dropTarget) return;

    // Check if dropped on Queue dropzone
    const queueZone = dropTarget.closest("#queue-dropzone") || dropTarget.closest(".queue-box-container");
    if (queueZone && this.dragType === 'graph-node') {
      this.game.handleNodeEnqueueAttempt(this.draggedNodeId);
      return;
    }

    // Check if dropped on Explorer Station dropzone (Dequeue Front)
    const explorerStation = dropTarget.closest("#explorer-station-dropzone") || dropTarget.closest(".explorer-station-box");
    if (explorerStation && (this.dragType === 'queue-front' || this.dragType === 'graph-node')) {
      if (this.dragType === 'queue-front' || (this.game.queue.length > 0 && this.game.queue[0] === this.draggedNodeId)) {
        this.game.handleDequeueExplore();
      } else {
        this.game.showMistakeGuidance({
          title: "⚠️ FIFO Queue Rule",
          explanation: "You can only dequeue from the FRONT of the queue.",
          fix: "First In → First Out: Dequeue the oldest node waiting at the front."
        });
      }
      return;
    }
  }

  resetDrag() {
    this.draggedNodeId = null;
    this.dragType = null;
    if (this.ghostEl) {
      this.ghostEl.remove();
      this.ghostEl = null;
    }
    document.body.classList.remove("dragging-in-progress");
    document.querySelectorAll(".drop-target-active").forEach(el => {
      el.classList.remove("drop-target-active");
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DragDropEngine };
}
