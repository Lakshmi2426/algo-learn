/**
 * BFS Adventure - Interactive Animated Video Demo Player
 * Generates interactive animated video simulations for BFS concepts & drag-and-drop mechanics.
 */

class DemoPlayer {
  constructor() {
    this.currentAnimTimer = null;
    this.isPlaying = false;
    this.currentStep = 0;
    this.totalSteps = 4;
    this.currentDemoType = "drag_to_queue";
    this.currentLevelData = null;
  }

  getElements() {
    return {
      modalEl: document.getElementById("demo-modal"),
      videoScreenEl: document.getElementById("demo-video-screen"),
      demoTitleEl: document.getElementById("demo-modal-title"),
      demoDescEl: document.getElementById("demo-modal-desc")
    };
  }

  openDemo(demoType, levelData) {
    const els = this.getElements();
    if (!els.modalEl) return;

    this.currentDemoType = demoType || "drag_to_queue";
    this.currentLevelData = levelData;
    this.currentStep = 0;
    this.isPlaying = true;

    els.modalEl.classList.remove("hidden");
    els.modalEl.classList.add("flex");

    const title = levelData ? `${levelData.title} — Animated Concept Demo` : "Interactive Concept Demo";
    if (els.demoTitleEl) els.demoTitleEl.textContent = title;

    this.renderVideoInterface();
    this.startAnimationLoop();
  }

  closeDemo() {
    if (this.currentAnimTimer) {
      clearInterval(this.currentAnimTimer);
      this.currentAnimTimer = null;
    }
    const els = this.getElements();
    if (els.modalEl) {
      els.modalEl.classList.add("hidden");
      els.modalEl.classList.remove("flex");
    }
    this.isPlaying = false;
  }

  togglePlayPause() {
    this.isPlaying = !this.isPlaying;
    const playBtn = document.getElementById("demo-play-btn");
    if (playBtn) {
      playBtn.innerHTML = this.isPlaying
        ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`
        : `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play`;
    }
  }

  restartDemo() {
    this.currentStep = 0;
    this.isPlaying = true;
    const playBtn = document.getElementById("demo-play-btn");
    if (playBtn) {
      playBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`;
    }
    this.updateFrame();
  }

  renderVideoInterface() {
    const els = this.getElements();
    if (!els.videoScreenEl) return;

    let desc = "Watch how to explore level-by-level using the FIFO Queue.";
    if (this.currentDemoType === "drag_to_queue") {
      desc = "Drag unvisited neighbor rooms (Level 1) directly into the Queue waiting line.";
    } else if (this.currentDemoType === "fifo_queue") {
      desc = "The 3-Step BFS Heartbeat: Dequeue Front ➔ Explore Doors ➔ Enqueue New Neighbors.";
    } else if (this.currentDemoType === "visited_cycle") {
      desc = "Cycle Safety: If a room is already visited, BFS skips it to avoid infinite loops.";
    } else if (this.currentDemoType === "levels_distance") {
      desc = "Level distances: Each BFS level is exactly 1 hop further from the origin.";
    } else if (this.currentDemoType === "rescue_target") {
      desc = "Rescue Target: The moment target node is discovered, BFS guarantees the shortest path!";
    } else if (this.currentDemoType === "debug_mode") {
      desc = "Spotting Traversal Bugs: Never jump to Level 2 before all Level 1 nodes are visited!";
    }

    if (els.demoDescEl) els.demoDescEl.textContent = desc;

    els.videoScreenEl.innerHTML = `
      <div class="video-player-frame">
        
        <!-- Video Top Status Bar -->
        <div class="video-top-bar">
          <div id="demo-step-badge" class="video-step-badge">Step 1 of 4: Select Node</div>
          <div id="demo-status-text" class="video-status-text">Ready</div>
        </div>

        <!-- Video Simulation Canvas -->
        <div id="video-sim-canvas" class="video-sim-canvas">
          <!-- Animated elements rendered dynamically -->
        </div>

        <!-- Video Bottom Controls -->
        <div class="video-controls-bar">
          <button id="demo-play-btn" class="btn btn-sm btn-outline" onclick="demoPlayer.togglePlayPause()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause
          </button>
          <button class="btn btn-sm btn-outline" onclick="demoPlayer.restartDemo()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Replay
          </button>
          <div class="video-progress-bar-container">
            <div id="demo-progress-fill" class="video-progress-bar-fill" style="width: 25%;"></div>
          </div>
          <span id="demo-time-counter" class="video-time-tag">0:01 / 0:08</span>
        </div>

      </div>
    `;

    this.renderCanvasInitialState();
  }

  renderCanvasInitialState() {
    const canvas = document.getElementById("video-sim-canvas");
    if (!canvas) return;

    canvas.innerHTML = `
      <div class="demo-scene-grid">
        
        <!-- Left: Graph Preview -->
        <div class="scene-col graph-col">
          <div class="scene-col-title">Graph Network</div>
          <div class="demo-graph-mini">
            <div id="v-node-A" class="v-node active">A (Start)</div>
            <div class="v-edge-line"></div>
            <div class="v-children-row">
              <div id="v-node-B" class="v-node candidate">B</div>
              <div id="v-node-C" class="v-node candidate">C</div>
            </div>
            <div class="v-children-row mt-2" style="margin-top: 6px;">
              <div id="v-node-D" class="v-node locked">D (L2)</div>
              <div id="v-node-E" class="v-node locked">E (L2)</div>
            </div>
          </div>
        </div>

        <!-- Middle: Action Arrow -->
        <div class="scene-col action-col">
          <div id="v-action-tag" class="v-action-tag">DRAG TO QUEUE</div>
          <div class="v-arrow-pulse">➔</div>
        </div>

        <!-- Right: Queue & Explorer Station -->
        <div class="scene-col queue-col">
          <div class="scene-col-title">FIFO Queue & Station</div>
          
          <div class="v-station-box">
            <span class="v-sub-tag">Active Explorer:</span>
            <div id="v-explorer-slot" class="v-slot">[ Room A ]</div>
          </div>

          <div class="v-queue-box">
            <span class="v-sub-tag">Waiting Queue:</span>
            <div id="v-queue-tray" class="v-queue-tray">
              <span id="v-queue-empty-text" class="v-empty">Empty</span>
            </div>
          </div>

          <div class="v-visited-box">
            <span class="v-sub-tag">Visited Rooms:</span>
            <div id="v-visited-chips" class="v-visited-chips">
              <span class="v-chip">A</span>
            </div>
          </div>
        </div>

        <!-- Animated Virtual Hand Cursor (SVG cursor) -->
        <div id="v-hand-cursor" class="v-hand-cursor">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#38bdf8" stroke="#0f172a" stroke-width="1.5"><polygon points="3 3 10 21 13 13 21 10 3 3"/></svg>
        </div>

      </div>
    `;
  }

  startAnimationLoop() {
    if (this.currentAnimTimer) clearInterval(this.currentAnimTimer);

    this.totalSteps = 4;
    this.currentStep = 0;
    this.updateFrame();

    this.currentAnimTimer = setInterval(() => {
      if (!this.isPlaying) return;
      this.currentStep = (this.currentStep + 1) % this.totalSteps;
      this.updateFrame();
    }, 1800);
  }

  updateFrame() {
    const stepBadge = document.getElementById("demo-step-badge");
    const statusText = document.getElementById("demo-status-text");
    const progressFill = document.getElementById("demo-progress-fill");
    const timeCounter = document.getElementById("demo-time-counter");
    const hand = document.getElementById("v-hand-cursor");

    const nodeB = document.getElementById("v-node-B");
    const nodeC = document.getElementById("v-node-C");
    const queueTray = document.getElementById("v-queue-tray");
    const explorerSlot = document.getElementById("v-explorer-slot");
    const visitedChips = document.getElementById("v-visited-chips");
    const actionTag = document.getElementById("v-action-tag");

    if (!hand || !nodeB) return;

    const progress = Math.round(((this.currentStep + 1) / this.totalSteps) * 100);
    if (progressFill) progressFill.style.width = `${progress}%`;
    if (timeCounter) timeCounter.textContent = `0:0${(this.currentStep + 1) * 2} / 0:08`;

    if (this.currentStep === 0) {
      // Step 0: Pointer hovers over unvisited neighbor Node B
      if (stepBadge) stepBadge.textContent = "Step 1/4: Discover Neighbor B";
      if (statusText) statusText.textContent = "Checking Room A's connections...";
      if (actionTag) actionTag.textContent = "GRAB ROOM B";

      hand.style.opacity = "1";
      hand.style.transform = "translate(100px, 140px) scale(1)";
      nodeB.style.transform = "scale(1.15)";
      nodeB.className = "v-node candidate highlight-pulse";
      
      if (queueTray) queueTray.innerHTML = `<span class="v-empty">Empty</span>`;
      if (explorerSlot) explorerSlot.innerHTML = "[ Room A ]";
      if (visitedChips) visitedChips.innerHTML = `<span class="v-chip">A</span>`;
    } 
    else if (this.currentStep === 1) {
      // Step 1: Dragging Node B into the Queue
      if (stepBadge) stepBadge.textContent = "Step 2/4: Enqueue Node B";
      if (statusText) statusText.textContent = "Added B to FIFO Queue waiting line";
      if (actionTag) actionTag.textContent = "DROP IN QUEUE";

      hand.style.transform = "translate(340px, 160px) scale(0.9)";
      nodeB.style.transform = "translate(180px, 20px) scale(0.9)";

      setTimeout(() => {
        if (queueTray) {
          queueTray.innerHTML = `
            <div class="v-queue-chip front">
              <span class="v-tag">FRONT</span> B (L1)
            </div>
          `;
        }
        nodeB.style.transform = "translate(0, 0)";
        nodeB.className = "v-node in-q";
      }, 400);
    } 
    else if (this.currentStep === 2) {
      // Step 2: Enqueue Node C (Second neighbor at Level 1)
      if (stepBadge) stepBadge.textContent = "Step 3/4: Enqueue Neighbor C";
      if (statusText) statusText.textContent = "Enqueuing C behind B at Level 1";
      if (actionTag) actionTag.textContent = "ENQUEUE C";

      hand.style.transform = "translate(160px, 140px)";
      if (nodeC) nodeC.className = "v-node candidate highlight-pulse";

      setTimeout(() => {
        hand.style.transform = "translate(360px, 160px)";
        if (queueTray) {
          queueTray.innerHTML = `
            <div class="v-queue-chip front"><span class="v-tag">FRONT</span> B</div>
            <div class="v-queue-chip"><span class="v-tag">NEXT</span> C</div>
          `;
        }
        if (nodeC) nodeC.className = "v-node in-q";
      }, 500);
    } 
    else if (this.currentStep === 3) {
      // Step 3: Dequeue front node (B) to become new Active Explorer
      if (stepBadge) stepBadge.textContent = "Step 4/4: Dequeue Front Node B";
      if (statusText) statusText.textContent = "Room B is now the active explorer!";
      if (actionTag) actionTag.textContent = "DEQUEUE FRONT";

      hand.style.transform = "translate(350px, 120px) scale(0.9)";

      if (explorerSlot) explorerSlot.innerHTML = `<span style="color:#b45309; font-weight:bold;">🧭 Room B (Active)</span>`;
      if (queueTray) {
        queueTray.innerHTML = `<div class="v-queue-chip front"><span class="v-tag">FRONT</span> C</div>`;
      }
      if (visitedChips) {
        visitedChips.innerHTML = `<span class="v-chip">A</span> <span class="v-chip">B</span>`;
      }
      if (nodeB) nodeB.className = "v-node visited";
    }
  }
}

const demoPlayer = new DemoPlayer();
window.demoPlayer = demoPlayer;
