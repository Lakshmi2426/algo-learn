/**
 * BFS Adventure — Live BFS Spanning Tree Construction Studio
 * 
 * Core Features:
 * - Dual synchronized panels: Left = Original Graph, Right = BFS Spanning Tree
 * - Real algorithm maintenance: queue, discovered, visited, parent, bfsOrder, spanningTreeEdges
 * - Step-by-step inspection: Next Step, Prev Step, Play/Pause, Speed control
 * - Dynamic FIFO Queue bar: "FRONT → [B, C, D, E] ← REAR"
 * - Step-by-step learning feedback & explanation logs
 * - Preset graphs including the user's specific example graph:
 *   A -> B, C, D; B -> E, F; D -> G (Start = A)
 */

class SpanningTreeStudio {
  constructor() {
    this.currentPresetId = "example_tree";
    this.currentStepIdx = 0;
    this.isPlaying = false;
    this.timer = null;
    this.playbackSpeed = 1.0;
    this.baseDelay = 2200; // ms per step

    this.PRESETS = {
      example_tree: {
        id: "example_tree",
        name: "Standard Model (A → B,C,D | B → E,F | D → G)",
        startNode: "A",
        description: "Official user example: Root A branches to B, C, D; B branches to E, F; D branches to G.",
        nodes: [
          { id: "A", label: "A", x: 200, y: 50,  level: 0 },
          { id: "B", label: "B", x: 90,  y: 130, level: 1 },
          { id: "C", label: "C", x: 200, y: 130, level: 1 },
          { id: "D", label: "D", x: 310, y: 130, level: 1 },
          { id: "E", label: "E", x: 50,  y: 220, level: 2 },
          { id: "F", label: "F", x: 130, y: 220, level: 2 },
          { id: "G", label: "G", x: 310, y: 220, level: 2 }
        ],
        edges: [
          { from: "A", to: "B" },
          { from: "A", to: "C" },
          { from: "A", to: "D" },
          { from: "B", to: "E" },
          { from: "B", to: "F" },
          { from: "D", to: "G" }
        ]
      },

      cyclic_graph: {
        id: "cyclic_graph",
        name: "Cyclic Graph (With Cross-Edges Filtered Out)",
        startNode: "A",
        description: "Contains cycles and cross-links (B-C, E-F, D-G). Shows how BFS ignores already-discovered nodes so spanning tree has no cycles.",
        nodes: [
          { id: "A", label: "A", x: 200, y: 50,  level: 0 },
          { id: "B", label: "B", x: 100, y: 120, level: 1 },
          { id: "C", label: "C", x: 300, y: 120, level: 1 },
          { id: "D", label: "D", x: 60,  y: 210, level: 2 },
          { id: "E", label: "E", x: 180, y: 210, level: 2 },
          { id: "F", label: "F", x: 300, y: 210, level: 2 },
          { id: "G", label: "G", x: 180, y: 280, level: 3 }
        ],
        edges: [
          { from: "A", to: "B" },
          { from: "A", to: "C" },
          { from: "B", to: "C" }, // cross edge (discarded)
          { from: "B", to: "D" },
          { from: "B", to: "E" },
          { from: "C", to: "F" },
          { from: "D", to: "E" }, // cross edge (discarded)
          { from: "E", to: "G" },
          { from: "F", to: "G" }  // cross edge (discarded)
        ]
      },

      grid_mesh: {
        id: "grid_mesh",
        name: "Diamond Mesh Network",
        startNode: "S",
        description: "Multi-path network showing how BFS shortest-path tree selects earliest discovery edges.",
        nodes: [
          { id: "S", label: "S", x: 70,  y: 150, level: 0 },
          { id: "A", label: "A", x: 180, y: 70,  level: 1 },
          { id: "B", label: "B", x: 180, y: 230, level: 1 },
          { id: "C", label: "C", x: 290, y: 70,  level: 2 },
          { id: "D", label: "D", x: 290, y: 230, level: 2 },
          { id: "T", label: "T", x: 380, y: 150, level: 3 }
        ],
        edges: [
          { from: "S", to: "A" },
          { from: "S", to: "B" },
          { from: "A", to: "C" },
          { from: "A", to: "D" },
          { from: "B", to: "D" },
          { from: "C", to: "T" },
          { from: "D", to: "T" }
        ]
      }
    };

    this.steps = [];
  }

  init() {
    this.selectPreset(this.currentPresetId);
  }

  selectPreset(presetId) {
    if (!this.PRESETS[presetId]) return;
    this.pause();
    this.currentPresetId = presetId;
    this.currentStepIdx = 0;
    this._computeBfsSteps();
    this.render();
    if (window.soundManager) window.soundManager.playPop();
  }

  /* ─── Compute Exact Algorithmic BFS Steps ────────────────────── */

  _computeBfsSteps() {
    const preset = this.PRESETS[this.currentPresetId];
    const graph = {};
    preset.nodes.forEach(n => graph[n.id] = []);
    preset.edges.forEach(e => {
      if (!graph[e.from].includes(e.to)) graph[e.from].push(e.to);
      if (!graph[e.to].includes(e.from)) graph[e.to].push(e.from);
    });

    const startNode = preset.startNode;
    const steps = [];

    // Step 0: Initialization
    steps.push({
      stepNumber: 0,
      title: `Step 0: Initialize with Root Node '${startNode}'`,
      currentNode: null,
      activeEdge: null,
      queue: [startNode],
      discovered: [startNode],
      visited: [],
      bfsOrder: [],
      spanningTreeNodes: [{ id: startNode, level: 0, parent: null }],
      spanningTreeEdges: [],
      newlyAddedTreeEdge: null,
      explanation: {
        headline: `Start at root node '${startNode}' (Level 0).`,
        bullets: [
          `Mark '${startNode}' as Discovered immediately upon enqueueing.`,
          `Place '${startNode}' into the FIFO Queue waiting line: [${startNode}].`,
          `Spanning Tree initialized with root node '${startNode}'.`
        ]
      }
    });

    // Actual BFS Simulation
    const queue = [startNode];
    const discovered = new Set([startNode]);
    const visited = new Set();
    const bfsOrder = [];
    const spanningTreeNodes = [{ id: startNode, level: 0, parent: null }];
    const spanningTreeEdges = [];
    let stepCount = 0;

    while (queue.length > 0) {
      const u = queue.shift();
      visited.add(u);
      bfsOrder.push(u);
      const uObj = spanningTreeNodes.find(n => n.id === u);
      const uLevel = uObj ? uObj.level : 0;

      const neighbors = graph[u] || [];
      const neighborLogs = [];
      const newTreeEdgesThisStep = [];

      // Step for Dequeue & Active explorer
      stepCount++;
      steps.push({
        stepNumber: stepCount,
        title: `Step ${stepCount}: Dequeue & Process Node '${u}'`,
        currentNode: u,
        activeEdge: null,
        queue: [...queue],
        discovered: Array.from(discovered),
        visited: Array.from(visited),
        bfsOrder: [...bfsOrder],
        spanningTreeNodes: JSON.parse(JSON.stringify(spanningTreeNodes)),
        spanningTreeEdges: JSON.parse(JSON.stringify(spanningTreeEdges)),
        newlyAddedTreeEdge: null,
        explanation: {
          headline: `Dequeued '${u}' from front of FIFO Queue.`,
          bullets: [
            `'${u}' is now the Active Processing Node (Level ${uLevel}).`,
            `Inspecting all adjacent outgoing edges of '${u}': [${neighbors.join(', ')}].`
          ]
        }
      });

      // Process each neighbor
      for (const v of neighbors) {
        if (!discovered.has(v)) {
          // New discovery: Add to queue and add parent->child to Spanning Tree!
          discovered.add(v);
          queue.push(v);
          const newEdge = { from: u, to: v, level: uLevel + 1 };
          spanningTreeNodes.push({ id: v, level: uLevel + 1, parent: u });
          spanningTreeEdges.push(newEdge);
          newTreeEdgesThisStep.push(newEdge);

          stepCount++;
          steps.push({
            stepNumber: stepCount,
            title: `Step ${stepCount}: Discovered Neighbor '${v}' via '${u}' ➔ Add Tree Edge (${u} → ${v})`,
            currentNode: u,
            activeEdge: { from: u, to: v },
            queue: [...queue],
            discovered: Array.from(discovered),
            visited: Array.from(visited),
            bfsOrder: [...bfsOrder],
            spanningTreeNodes: JSON.parse(JSON.stringify(spanningTreeNodes)),
            spanningTreeEdges: JSON.parse(JSON.stringify(spanningTreeEdges)),
            newlyAddedTreeEdge: newEdge,
            explanation: {
              headline: `Node '${v}' discovered for the first time via edge (${u} ➔ ${v}).`,
              bullets: [
                `Mark '${v}' as Discovered immediately.`,
                `Enqueue '${v}' to the rear of FIFO Queue.`,
                `Spanning Tree: Added Discovery Edge (${u} ➔ ${v}) at Level ${uLevel + 1}.`
              ]
            }
          });
        } else {
          // Already discovered: Non-tree cross edge or back edge!
          stepCount++;
          steps.push({
            stepNumber: stepCount,
            title: `Step ${stepCount}: Inspect Neighbor '${v}' ➔ Already Discovered (Non-Tree Edge)`,
            currentNode: u,
            activeEdge: { from: u, to: v, isCrossEdge: true },
            queue: [...queue],
            discovered: Array.from(discovered),
            visited: Array.from(visited),
            bfsOrder: [...bfsOrder],
            spanningTreeNodes: JSON.parse(JSON.stringify(spanningTreeNodes)),
            spanningTreeEdges: JSON.parse(JSON.stringify(spanningTreeEdges)),
            newlyAddedTreeEdge: null,
            explanation: {
              headline: `Neighbor '${v}' was already discovered in an earlier BFS wave.`,
              bullets: [
                `Edge (${u} ➔ ${v}) is a Cross/Back edge.`,
                `Skipped: Do NOT add duplicate nodes to Queue.`,
                `Do NOT add to Spanning Tree (prevents loops & preserves tree property).`
              ]
            }
          });
        }
      }
    }

    // Final Complete Step
    stepCount++;
    steps.push({
      stepNumber: stepCount,
      title: `Traversal Complete: Final BFS Spanning Tree Formed!`,
      currentNode: null,
      activeEdge: null,
      queue: [],
      discovered: Array.from(discovered),
      visited: Array.from(visited),
      bfsOrder: [...bfsOrder],
      spanningTreeNodes: JSON.parse(JSON.stringify(spanningTreeNodes)),
      spanningTreeEdges: JSON.parse(JSON.stringify(spanningTreeEdges)),
      newlyAddedTreeEdge: null,
      isCompleted: true,
      explanation: {
        headline: `BFS Traversal Finished! Queue is now empty.`,
        bullets: [
          `Total Nodes Visited: ${visited.size}`,
          `Total Spanning Tree Edges: ${spanningTreeEdges.length} (Exactly |V| - 1)`,
          `Final BFS Traversal Order: ${bfsOrder.join(' ➔ ')}`,
          `Each edge in this tree represents the first BFS discovery relationship between a parent and child.`
        ]
      }
    });

    this.steps = steps;
  }

  /* ─── Playback Controls ──────────────────────────────────────── */

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this._updateControlsUI();

    if (this.currentStepIdx >= this.steps.length - 1) {
      this.currentStepIdx = 0;
      this.render();
    }

    this._scheduleNext();
    if (window.soundManager) window.soundManager.playPop();
  }

  pause() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this._updateControlsUI();
  }

  togglePlay() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  nextStep() {
    this.pause();
    if (this.currentStepIdx < this.steps.length - 1) {
      this.currentStepIdx++;
      this.render();
      if (window.soundManager) window.soundManager.playPop();
    }
  }

  prevStep() {
    this.pause();
    if (this.currentStepIdx > 0) {
      this.currentStepIdx--;
      this.render();
      if (window.soundManager) window.soundManager.playPop();
    }
  }

  restart() {
    this.pause();
    this.currentStepIdx = 0;
    this.render();
    if (window.soundManager) window.soundManager.playPop();
  }

  setSpeed(spd) {
    this.playbackSpeed = spd;
    if (this.isPlaying) {
      if (this.timer) clearTimeout(this.timer);
      this._scheduleNext();
    }
    this._updateSpeedUI();
  }

  _scheduleNext() {
    const delay = this.baseDelay / this.playbackSpeed;
    this.timer = setTimeout(() => {
      if (!this.isPlaying) return;
      if (this.currentStepIdx < this.steps.length - 1) {
        this.currentStepIdx++;
        this.render();
        this._scheduleNext();
      } else {
        this.pause();
      }
    }, delay);
  }

  _updateControlsUI() {
    const playBtn = document.getElementById("st-play-btn");
    if (!playBtn) return;
    if (this.isPlaying) {
      playBtn.innerHTML = `<span>⏸ Pause</span>`;
      playBtn.classList.remove("btn-primary");
      playBtn.classList.add("btn-warning");
    } else {
      playBtn.innerHTML = `<span>▶ Play</span>`;
      playBtn.classList.remove("btn-warning");
      playBtn.classList.add("btn-primary");
    }
  }

  _updateSpeedUI() {
    document.querySelectorAll(".st-speed-btn").forEach(btn => {
      const s = parseFloat(btn.dataset.speed);
      btn.classList.toggle("active", s === this.playbackSpeed);
    });
  }

  /* ─── Render Full Studio ─────────────────────────────────────── */

  render() {
    const mount = document.getElementById("spanning-tree-studio-mount");
    if (!mount) return;

    const preset = this.PRESETS[this.currentPresetId];
    const step = this.steps[this.currentStepIdx] || this.steps[0];

    mount.innerHTML = `
      <div class="st-studio-container">
        
        <!-- Top Preset Bar & Status -->
        <div class="st-studio-topbar">
          <div class="st-topbar-left">
            <div class="st-icon-pill">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <h3 class="st-studio-title">Live BFS Spanning Tree Construction Studio</h3>
              <p class="st-studio-subtitle">Observe how the BFS discovery tree forms branch-by-branch in parallel with the FIFO Queue.</p>
            </div>
          </div>

          <!-- Preset Switcher -->
          <div class="st-preset-switcher-group">
            <span class="st-preset-lbl">Graph Model:</span>
            <select class="st-preset-select" onchange="spanningTreeStudio.selectPreset(this.value)">
              <option value="example_tree" ${this.currentPresetId === 'example_tree' ? 'selected' : ''}>Standard Tree Model (A -> B,C,D)</option>
              <option value="cyclic_graph" ${this.currentPresetId === 'cyclic_graph' ? 'selected' : ''}>Cyclic Graph (Cross-Edges)</option>
              <option value="grid_mesh" ${this.currentPresetId === 'grid_mesh' ? 'selected' : ''}>Diamond Network</option>
            </select>
          </div>
        </div>

        <!-- Main Dual-Panel Arena -->
        <div class="st-dual-arena">
          
          <!-- LEFT PANEL: Original Graph -->
          <div class="st-panel-card st-left-panel">
            <div class="st-panel-header">
              <div class="st-panel-title-row">
                <span class="st-panel-tag">PANEL 1</span>
                <h4>Original Graph Topology</h4>
              </div>
              <div class="st-panel-legend">
                <span class="st-legend-item"><span class="st-dot unvisited"></span> Unvisited</span>
                <span class="st-legend-item"><span class="st-dot in-queue"></span> Discovered/Queue</span>
                <span class="st-legend-item"><span class="st-dot current"></span> Active (${step.currentNode || 'None'})</span>
                <span class="st-legend-item"><span class="st-dot visited"></span> Visited</span>
              </div>
            </div>

            <div class="st-canvas-wrap">
              <svg id="st-orig-graph-svg" class="st-svg-canvas" viewBox="0 0 400 270">
                ${this._renderOriginalGraphSVG(preset, step)}
              </svg>
            </div>
          </div>

          <!-- RIGHT PANEL: BFS Spanning Tree -->
          <div class="st-panel-card st-right-panel">
            <div class="st-panel-header">
              <div class="st-panel-title-row">
                <span class="st-panel-tag accent">PANEL 2</span>
                <h4>BFS Spanning Tree (Discovery Tree)</h4>
              </div>
              <span class="st-tree-stat-badge">
                ${step.spanningTreeNodes.length} Nodes • ${step.spanningTreeEdges.length} Tree Edges
              </span>
            </div>

            <div class="st-canvas-wrap st-tree-canvas-wrap">
              <svg id="st-tree-graph-svg" class="st-svg-canvas" viewBox="0 0 400 270">
                ${this._renderSpanningTreeSVG(preset, step)}
              </svg>
            </div>
          </div>

        </div>

        <!-- FIFO Queue Processing Deck Bar -->
        <div class="st-queue-deck-bar">
          <div class="st-q-label-group">
            <span class="st-q-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
            <span class="st-q-title">FIFO QUEUE WAITING LINE:</span>
          </div>

          <div class="st-queue-visual-track">
            <span class="st-q-flow-tag">FRONT (Next to Dequeue)</span>
            <span class="st-q-arrow">➔</span>
            
            <div class="st-queue-chips-container">
              ${step.queue && step.queue.length > 0 ? step.queue.map((item, idx) => `
                <div class="st-queue-chip ${idx === 0 ? 'is-front' : ''}">
                  <span class="chip-pos">#${idx + 1}</span>
                  <span class="chip-val">${item}</span>
                </div>
              `).join('') : '<span class="st-queue-empty-msg">[ Queue Empty — Traversal Complete ]</span>'}
            </div>

            <span class="st-q-arrow">➔</span>
            <span class="st-q-flow-tag">REAR (Enqueue New)</span>
          </div>

          <div class="st-order-pill">
            <span class="order-lbl">BFS Order:</span>
            <span class="order-seq">${step.bfsOrder.length > 0 ? step.bfsOrder.join(' ➔ ') : 'None yet'}</span>
          </div>
        </div>

        <!-- Step Explanation & Learning Feedback Banner -->
        <div class="st-explanation-card ${step.isCompleted ? 'is-complete-card' : ''}">
          <div class="st-expl-header">
            <span class="st-expl-step-num">${step.title}</span>
          </div>
          <div class="st-expl-body">
            <div class="st-expl-headline">${step.explanation.headline}</div>
            <ul class="st-expl-bullets">
              ${step.explanation.bullets.map(b => `<li>${b}</li>`).join('')}
            </ul>
          </div>
        </div>

        <!-- Controls & Scrubber Deck -->
        <div class="st-controls-bar">
          <div class="st-ctl-left">
            <button id="st-play-btn" class="btn btn-primary" onclick="spanningTreeStudio.togglePlay()">
              <span>Play</span>
            </button>
            <button class="btn btn-outline" onclick="spanningTreeStudio.nextStep()" title="Single Step Forward">
              Next Step &rarr;
            </button>
            <button class="btn btn-outline" onclick="spanningTreeStudio.prevStep()" title="Single Step Backward">
              &larr; Prev Step
            </button>
            <button class="btn btn-outline" onclick="spanningTreeStudio.restart()" title="Restart from Step 0">
              Reset
            </button>
          </div>

          <div class="st-ctl-step-counter">
            <span>Step <strong>${this.currentStepIdx + 1}</strong> of <strong>${this.steps.length}</strong></span>
          </div>

          <div class="st-ctl-right">
            <span class="st-speed-lbl">Speed:</span>
            <div class="st-speed-group">
              <button class="st-speed-btn ${this.playbackSpeed === 0.5 ? 'active' : ''}" data-speed="0.5" onclick="spanningTreeStudio.setSpeed(0.5)">0.5x</button>
              <button class="st-speed-btn ${this.playbackSpeed === 1.0 ? 'active' : ''}" data-speed="1.0" onclick="spanningTreeStudio.setSpeed(1.0)">1.0x</button>
              <button class="st-speed-btn ${this.playbackSpeed === 2.0 ? 'active' : ''}" data-speed="2.0" onclick="spanningTreeStudio.setSpeed(2.0)">2.0x</button>
            </div>
          </div>
        </div>

      </div>
    `;

    this._updateControlsUI();
    this._updateSpeedUI();
  }

  /* ─── Render Left Panel (Original Graph) ─────────────────────── */

  _renderOriginalGraphSVG(preset, step) {
    let svg = `
      <defs>
        <filter id="glowOrig" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#0284c7" flood-opacity="0.25"/>
        </filter>
      </defs>
    `;

    // Edges
    preset.edges.forEach(e => {
      const n1 = preset.nodes.find(n => n.id === e.from);
      const n2 = preset.nodes.find(n => n.id === e.to);
      if (!n1 || !n2) return;

      const isCurrentActiveEdge = step.activeEdge && 
        ((step.activeEdge.from === e.from && step.activeEdge.to === e.to) ||
         (step.activeEdge.from === e.to && step.activeEdge.to === e.from));

      const isTreeEdge = step.spanningTreeEdges.some(te => 
        (te.from === e.from && te.to === e.to) || (te.from === e.to && te.to === e.from)
      );

      let stroke = "#cbd5e1";
      let strokeWidth = 2;
      let strokeDash = "none";
      let opacity = 0.6;

      if (isCurrentActiveEdge) {
        if (step.activeEdge.isCrossEdge) {
          stroke = "#ef4444"; // Cross edge rejected (semantic feedback)
          strokeWidth = 3.5;
          strokeDash = "4";
          opacity = 1;
        } else {
          stroke = "#7c3aed"; // Active discovery (Brand Violet)
          strokeWidth = 4;
          opacity = 1;
        }
      } else if (isTreeEdge) {
        stroke = "#4f46e5"; // Tree edge in spanning tree (Brand Indigo)
        strokeWidth = 3;
        opacity = 0.95;
      }

      svg += `
        <line x1="${n1.x}" y1="${n1.y}" x2="${n2.x}" y2="${n2.y}"
              stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round"
              stroke-dasharray="${strokeDash}" opacity="${opacity}" />
      `;
    });

    // Nodes
    preset.nodes.forEach(node => {
      const isCurrent = step.currentNode === node.id;
      const isVisited = step.visited.includes(node.id);
      const isDiscovered = step.discovered.includes(node.id);

      let fill = "#ffffff";
      let stroke = "#94a3b8";
      let textFill = "#0f172a";

      if (isCurrent) {
        fill = "#7c3aed"; // Brand Violet processing
        stroke = "#6d28d9";
        textFill = "#ffffff";
      } else if (isVisited) {
        fill = "#2563eb"; // Brand Electric Blue visited
        stroke = "#1d4ed8";
        textFill = "#ffffff";
      } else if (isDiscovered) {
        fill = "#eef2ff"; // Brand Soft Indigo discovered
        stroke = "#4f46e5";
        textFill = "#4338ca";
      }

      svg += `
        <g class="st-orig-node-group" filter="url(#glowOrig)">
          ${isCurrent ? `<circle cx="${node.x}" cy="${node.y}" r="26" fill="none" stroke="#7c3aed" stroke-width="2" stroke-dasharray="4"><animateTransform attributeName="transform" type="rotate" from="0 ${node.x} ${node.y}" to="360 ${node.x} ${node.y}" dur="5s" repeatCount="indefinite"/></circle>` : ''}
          <circle cx="${node.x}" cy="${node.y}" r="18" fill="${fill}" stroke="${stroke}" stroke-width="2.5" />
          <text x="${node.x}" y="${node.y + 5}" text-anchor="middle" font-size="12" font-weight="900" fill="${textFill}">${node.label}</text>
        </g>
      `;
    });

    return svg;
  }

  /* ─── Render Right Panel (BFS Spanning Tree) ─────────────────── */

  _renderSpanningTreeSVG(preset, step) {
    let svg = `
      <defs>
        <linearGradient id="stTreeEdgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#2E55FA"/>
          <stop offset="100%" stop-color="#7A27FD"/>
        </linearGradient>
        <filter id="glowTree" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#7A27FD" flood-opacity="0.5"/>
        </filter>
      </defs>
    `;

    // Group Spanning Tree Nodes by Level
    const levelMap = {};
    step.spanningTreeNodes.forEach(n => {
      if (!levelMap[n.level]) levelMap[n.level] = [];
      levelMap[n.level].push(n);
    });

    const svgWidth = 400;
    const rowHeight = 70;
    const nodePositions = {};

    Object.keys(levelMap).forEach(lvlStr => {
      const lvl = Number(lvlStr);
      const nodesAtLvl = levelMap[lvl];
      const count = nodesAtLvl.length;
      const y = 45 + lvl * rowHeight;
      nodesAtLvl.forEach((n, idx) => {
        const x = (svgWidth / (count + 1)) * (idx + 1);
        nodePositions[n.id] = { x, y, level: lvl };
      });
    });

    // 1. Draw Spanning Tree Edges
    step.spanningTreeEdges.forEach(edge => {
      const p1 = nodePositions[edge.from];
      const p2 = nodePositions[edge.to];
      if (p1 && p2) {
        const isNewlyAdded = step.newlyAddedTreeEdge && 
          step.newlyAddedTreeEdge.from === edge.from && 
          step.newlyAddedTreeEdge.to === edge.to;

        const x2 = (p1.x === p2.x) ? p2.x + 0.1 : p2.x;
        svg += `
          <line x1="${p1.x}" y1="${p1.y}" x2="${x2}" y2="${p2.y}"
                stroke="${isNewlyAdded ? '#f59e0b' : 'url(#stTreeEdgeGrad)'}"
                stroke-width="${isNewlyAdded ? 4.5 : 3}"
                stroke-linecap="round" />
        `;
      }
    });

    // 2. Draw Spanning Tree Nodes
    step.spanningTreeNodes.forEach(n => {
      const pos = nodePositions[n.id];
      if (!pos) return;

      const isDark = document.body.classList.contains("dark-theme") || 
                     document.documentElement.getAttribute("data-theme") === "dark";
      const isCurrent = step.currentNode === n.id;
      let fill = isDark ? "#070d1c" : "#ffffff";
      let stroke = "url(#stTreeEdgeGrad)";
      let textFill = isDark ? "#ffffff" : "#0f172a";

      svg += `
        <g class="st-tree-node-group" filter="url(#glowTree)">
          ${isCurrent ? `<circle cx="${pos.x}" cy="${pos.y}" r="24" fill="none" stroke="url(#stTreeEdgeGrad)" stroke-width="2.5" stroke-dasharray="4"><animateTransform attributeName="transform" type="rotate" from="0 ${pos.x} ${pos.y}" to="360 ${pos.x} ${pos.y}" dur="5s" repeatCount="indefinite"/></circle>` : ''}
          <circle cx="${pos.x}" cy="${pos.y}" r="18" fill="${fill}" stroke="${stroke}" stroke-width="2.5" />
          <text x="${pos.x}" y="${pos.y + 5}" text-anchor="middle" font-size="12" font-weight="900" fill="${textFill}" class="st-tree-node-label">${n.id}</text>
          <text x="${pos.x + 20}" y="${pos.y - 8}" font-size="8.5" font-weight="800" fill="${isDark ? '#ffffff' : '#475569'}" class="st-tree-level-label">L${pos.level}</text>
        </g>
      `;
    });

    return svg;
  }
}

// Global instance
window.spanningTreeStudio = new SpanningTreeStudio();
