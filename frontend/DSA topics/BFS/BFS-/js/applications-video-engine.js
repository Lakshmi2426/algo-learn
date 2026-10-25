/**
 * BFS Adventure — Real-World Applications Video Animation Studio Engine
 * Interactive 16:9 educational cinema demonstrating Breadth-First Search (BFS) in:
 * 1. Network Broadcasting (Packet signals level by level)
 * 2. Game & Maze Navigation (Grid wave ripple & shortest route player movement)
 * 3. Shortest Path Finder (Minimum edge hops guarantee)
 * 4. Social Networks (1st, 2nd, and 3rd degree connections)
 */

class ApplicationsDemoEngine {
  constructor() {
    this.currentAppId = "network";
    this.currentStep = 0;
    this.isPlaying = false;
    this.animTimer = null;
    this.playbackSpeed = 1.0;
    this.baseInterval = 2400; // ms per step

    this.SCENARIOS = {
      network: {
        id: "network",
        title: "BFS in Network Broadcasting",
        subtitle: "Information spreads level by level using a queue.",
        icon: "📡",
        badge: "Computer Networks & IoT",
        aspectRatio: "16:9",
        nodes: [
          { id: "S0", label: "Source Server", ip: "192.168.1.1", level: 0, x: 80,  y: 135, icon: "🖥️" },
          { id: "R1", label: "Switch Alpha",  ip: "10.0.1.10",    level: 1, x: 220, y: 70,  icon: "🖧" },
          { id: "R2", label: "Switch Beta",   ip: "10.0.1.20",    level: 1, x: 220, y: 200, icon: "🖧" },
          { id: "W1", label: "Node Office A", ip: "10.0.2.11",    level: 2, x: 370, y: 40,  icon: "💻" },
          { id: "W2", label: "Node Office B", ip: "10.0.2.12",    level: 2, x: 370, y: 115, icon: "💻" },
          { id: "W3", label: "Node Datacenter",ip: "10.0.2.21",   level: 2, x: 370, y: 220, icon: "🖳" },
          { id: "T1", label: "Terminal X",    ip: "172.16.0.5",   level: 3, x: 500, y: 80,  icon: "📱" },
          { id: "T2", label: "Terminal Y",    ip: "172.16.0.6",   level: 3, x: 500, y: 160, icon: "📱" }
        ],
        edges: [
          { from: "S0", to: "R1" },
          { from: "S0", to: "R2" },
          { from: "R1", to: "W1" },
          { from: "R1", to: "W2" },
          { from: "R2", to: "W3" },
          { from: "W2", to: "T1" },
          { from: "W2", to: "T2" }
        ],
        steps: [
          {
            stepNum: 0,
            title: "1. Network Topology Initialized",
            desc: "All network hosts are connected via Ethernet/WiFi routing links. Broadcast not yet started.",
            activeNode: null,
            levelRings: [],
            queue: [],
            visited: [],
            activePackets: [],
            queueAction: "READY"
          },
          {
            stepNum: 1,
            title: "2. Source Receives Message (Level 0)",
            desc: "The Source Server receives the packet payload. Enqueue Source Server into FIFO Queue.",
            activeNode: "S0",
            levelRings: [0],
            queue: ["S0 (Source)"],
            visited: ["S0"],
            activePackets: [],
            queueAction: "ENQUEUE S0"
          },
          {
            stepNum: 2,
            title: "3. Broadcast to Level 1 Directly Connected Switches",
            desc: "Dequeue S0. Broadcast packets to Switch Alpha & Switch Beta. Enqueue Alpha & Beta into Queue.",
            activeNode: "S0",
            levelRings: [0, 1],
            queue: ["R1 (Alpha)", "R2 (Beta)"],
            visited: ["S0", "R1", "R2"],
            activePackets: [["S0", "R1"], ["S0", "R2"]],
            queueAction: "PROCESS S0 ➔ ENQUEUE R1, R2"
          },
          {
            stepNum: 3,
            title: "4. Dequeue Alpha ➔ Broadcast to Level 2 (Office A & B)",
            desc: "Process Switch Alpha. Broadcasts packet payload to Node Office A & Office B. Enqueue W1 & W2.",
            activeNode: "R1",
            levelRings: [0, 1, 2],
            queue: ["R2 (Beta)", "W1", "W2"],
            visited: ["S0", "R1", "R2", "W1", "W2"],
            activePackets: [["R1", "W1"], ["R1", "W2"]],
            queueAction: "PROCESS R1 ➔ ENQUEUE W1, W2"
          },
          {
            stepNum: 4,
            title: "5. Dequeue Beta ➔ Broadcast to Level 2 (Datacenter)",
            desc: "Process Switch Beta. Broadcasts packet payload to Node Datacenter (W3). Enqueue W3.",
            activeNode: "R2",
            levelRings: [0, 1, 2],
            queue: ["W1", "W2", "W3"],
            visited: ["S0", "R1", "R2", "W1", "W2", "W3"],
            activePackets: [["R2", "W3"]],
            queueAction: "PROCESS R2 ➔ ENQUEUE W3"
          },
          {
            stepNum: 5,
            title: "6. Dequeue Office B ➔ Broadcast to Level 3 (Terminals X & Y)",
            desc: "Process Node Office B. Broadcasts packet to edge mobile terminals X & Y. Enqueue T1 & T2.",
            activeNode: "W2",
            levelRings: [0, 1, 2, 3],
            queue: ["W3", "T1", "T2"],
            visited: ["S0", "R1", "R2", "W1", "W2", "W3", "T1", "T2"],
            activePackets: [["W2", "T1"], ["W2", "T2"]],
            queueAction: "PROCESS W2 ➔ ENQUEUE T1, T2"
          },
          {
            stepNum: 6,
            title: "7. Complete Network Broadcast Finished (O(V+E))",
            desc: "All reachable network nodes have received the broadcast message in minimum hop delay!",
            activeNode: null,
            levelRings: [0, 1, 2, 3],
            queue: ["Queue Empty"],
            visited: ["S0", "R1", "R2", "W1", "W2", "W3", "T1", "T2"],
            activePackets: [],
            queueAction: "BROADCAST COMPLETE"
          }
        ]
      },

      maze: {
        id: "maze",
        title: "BFS in Game & Maze Navigation",
        subtitle: "Find the shortest route with level-by-level exploration.",
        icon: "🎮",
        badge: "Game AI & Pathfinding",
        aspectRatio: "16:9",
        gridSize: { rows: 5, cols: 7 },
        walls: ["1,2", "2,2", "3,2", "2,4", "3,4"],
        start: { r: 1, c: 0, label: "START 🏃" },
        goal:  { r: 3, c: 6, label: "GOAL 💎" },
        steps: [
          {
            stepNum: 0,
            title: "1. Maze Grid & Obstacle Walls Setup",
            desc: "Grid maze loaded with solid wall obstacles. Player at Start (1,0), Goal at Destination (3,6).",
            queue: ["(1,0)"],
            visitedCells: ["1,0"],
            currentCell: "1,0",
            waveLevel: 0,
            shortestPath: [],
            playerPos: { r: 1, c: 0 },
            queueAction: "ENQUEUE START (1,0)"
          },
          {
            stepNum: 1,
            title: "2. Level 1 Ripple Wave Expansion",
            desc: "Explore 4-directional open neighbors of Start. Cell (0,0) and (2,0) enter the FIFO Queue.",
            queue: ["(0,0)", "(2,0)"],
            visitedCells: ["1,0", "0,0", "2,0"],
            currentCell: "1,0",
            waveLevel: 1,
            shortestPath: [],
            playerPos: { r: 1, c: 0 },
            queueAction: "ENQUEUE (0,0), (2,0)"
          },
          {
            stepNum: 2,
            title: "3. Level 2 & Level 3 Navigation Around Walls",
            desc: "BFS wave flows past wall obstacles: explores (0,1), (0,2), (0,3) along the top corridor.",
            queue: ["(0,2)", "(0,3)", "(3,0)"],
            visitedCells: ["1,0", "0,0", "2,0", "0,1", "0,2", "0,3", "3,0", "4,0"],
            currentCell: "0,2",
            waveLevel: 3,
            shortestPath: [],
            playerPos: { r: 1, c: 0 },
            queueAction: "EXPLORE CORRIDOR"
          },
          {
            stepNum: 3,
            title: "4. Level 4 & Level 5 Reaching Central Opening",
            desc: "Wave advances through column 3: explores (1,3), (2,3) opening between obstacles into column 5.",
            queue: ["(1,3)", "(2,3)", "(0,4)", "(0,5)"],
            visitedCells: ["1,0", "0,0", "2,0", "0,1", "0,2", "0,3", "3,0", "4,0", "1,3", "2,3", "0,4", "0,5", "1,5"],
            currentCell: "1,3",
            waveLevel: 5,
            shortestPath: [],
            playerPos: { r: 1, c: 0 },
            queueAction: "ENQUEUE (1,5), (2,5)"
          },
          {
            stepNum: 4,
            title: "5. Goal Reached & Shortest Path Reconstructed",
            desc: "Destination Goal (3,6) is discovered at Distance 9! Trace parent pointers back to Start.",
            queue: ["Goal Found!"],
            visitedCells: ["1,0", "0,0", "2,0", "0,1", "0,2", "0,3", "1,3", "2,3", "0,4", "0,5", "1,5", "2,5", "3,5", "3,6"],
            currentCell: "3,6",
            waveLevel: 9,
            shortestPath: ["1,0", "0,0", "0,1", "0,2", "0,3", "1,3", "2,3", "2,5", "3,5", "3,6"],
            playerPos: { r: 1, c: 0 },
            queueAction: "GOAL DISCOVERED"
          },
          {
            stepNum: 5,
            title: "6. Player Traverses the Shortest Route",
            desc: "Player navigates smoothly along the guaranteed shortest path directly into the Goal!",
            queue: ["Path Complete"],
            visitedCells: ["1,0", "0,0", "0,1", "0,2", "0,3", "1,3", "2,3", "2,5", "3,5", "3,6"],
            currentCell: "3,6",
            waveLevel: 9,
            shortestPath: ["1,0", "0,0", "0,1", "0,2", "0,3", "1,3", "2,3", "2,5", "3,5", "3,6"],
            playerPos: { r: 3, c: 6 },
            queueAction: "VICTORY AT GOAL 🏁"
          }
        ]
      },

      shortest_path: {
        id: "shortest_path",
        title: "BFS for Shortest Path in Unweighted Graph",
        subtitle: "Find the minimum number of steps in an unweighted graph.",
        icon: "🗺️",
        badge: "Shortest Path Guarantee",
        aspectRatio: "16:9",
        nodes: [
          { id: "SEA", label: "Seattle (START)",  level: 0, x: 70,  y: 135, icon: "📍" },
          { id: "DEN", label: "Denver",           level: 1, x: 200, y: 75,  icon: "🏔️" },
          { id: "SF",  label: "San Francisco",    level: 1, x: 200, y: 205, icon: "🌉" },
          { id: "CHI", label: "Chicago",          level: 2, x: 340, y: 75,  icon: "🏙️" },
          { id: "LA",  label: "Los Angeles",      level: 2, x: 340, y: 205, icon: "🌴" },
          { id: "DAL", label: "Dallas",           level: 3, x: 420, y: 205, icon: "🤠" },
          { id: "NYC", label: "New York (DEST)",  level: 3, x: 490, y: 75,  icon: "🎯" }
        ],
        edges: [
          { from: "SEA", to: "DEN" },
          { from: "SEA", to: "SF" },
          { from: "DEN", to: "CHI" },
          { from: "SF",  to: "LA" },
          { from: "CHI", to: "NYC" },
          { from: "LA",  to: "DAL" },
          { from: "DAL", to: "NYC" }
        ],
        steps: [
          {
            stepNum: 0,
            title: "1. Network of Unweighted City Hubs",
            desc: "Start at Seattle (SEA). Destination is New York (NYC). All edges have equal weight = 1 hop.",
            activeNode: "SEA",
            queue: ["Seattle (Dist 0)"],
            visited: ["SEA"],
            distMap: { SEA: 0 },
            shortestPath: []
          },
          {
            stepNum: 1,
            title: "2. Distance 1: Explore Neighbors of Seattle",
            desc: "Dequeue Seattle. Discovers Denver (DEN) and San Francisco (SF) at Distance 1. Enqueue both.",
            activeNode: "SEA",
            queue: ["Denver (1)", "San Francisco (1)"],
            visited: ["SEA", "DEN", "SF"],
            distMap: { SEA: 0, DEN: 1, SF: 1 },
            shortestPath: []
          },
          {
            stepNum: 2,
            title: "3. Distance 2: Explore Level 2 Cities",
            desc: "Dequeue Denver ➔ discovers Chicago (CHI, Dist 2). Dequeue SF ➔ discovers Los Angeles (LA, Dist 2).",
            activeNode: "DEN",
            queue: ["San Francisco (1)", "Chicago (2)", "Los Angeles (2)"],
            visited: ["SEA", "DEN", "SF", "CHI", "LA"],
            distMap: { SEA: 0, DEN: 1, SF: 1, CHI: 2, LA: 2 },
            shortestPath: []
          },
          {
            stepNum: 3,
            title: "4. Distance 3: Destination Discovered!",
            desc: "Dequeue Chicago ➔ discovers New York (NYC) at Distance 3! Since it's BFS, 3 hops is guaranteed minimal!",
            activeNode: "CHI",
            queue: ["Los Angeles (2)", "Dallas (3)", "New York (3)"],
            visited: ["SEA", "DEN", "SF", "CHI", "LA", "NYC", "DAL"],
            distMap: { SEA: 0, DEN: 1, SF: 1, CHI: 2, LA: 2, NYC: 3, DAL: 3 },
            shortestPath: ["SEA", "DEN", "CHI", "NYC"]
          },
          {
            stepNum: 4,
            title: "5. Shortest Route Verified (3 Hops vs 5 Hops)",
            desc: "Path: Seattle ➔ Denver ➔ Chicago ➔ New York (3 steps) vs Southern route (5 steps). BFS guarantees shortest path!",
            activeNode: "NYC",
            queue: ["Complete"],
            visited: ["SEA", "DEN", "SF", "CHI", "LA", "NYC", "DAL"],
            distMap: { SEA: 0, DEN: 1, SF: 1, CHI: 2, LA: 2, NYC: 3, DAL: 3 },
            shortestPath: ["SEA", "DEN", "CHI", "NYC"]
          }
        ]
      },

      social: {
        id: "social",
        title: "BFS in Social Networks",
        subtitle: "Explore connections level by level.",
        icon: "👥",
        badge: "Social Graphs & 6 Degrees",
        aspectRatio: "16:9",
        nodes: [
          { id: "YOU",   label: "You",       degree: 0, x: 80,  y: 135, icon: "👤", role: "Root User" },
          { id: "ALEX",  label: "Alex",      degree: 1, x: 210, y: 70,  icon: "👨‍💻", role: "Direct Friend" },
          { id: "MAYA",  label: "Maya",      degree: 1, x: 210, y: 200, icon: "👩‍🔬", role: "Direct Friend" },
          { id: "LIAM",  label: "Liam",      degree: 2, x: 350, y: 40,  icon: "🎨", role: "2nd-Degree (Alex)" },
          { id: "CHLOE", label: "Chloe",     degree: 2, x: 350, y: 110, icon: "📊", role: "2nd-Degree (Alex)" },
          { id: "NOAH",  label: "Noah",      degree: 2, x: 350, y: 210, icon: "🚀", role: "2nd-Degree (Maya)" },
          { id: "SOPH",  label: "Sophia",    degree: 3, x: 490, y: 75,  icon: "🌐", role: "3rd-Degree (People You May Know)" },
          { id: "ETHAN", label: "Ethan",     degree: 3, x: 490, y: 175, icon: "💼", role: "3rd-Degree (Extended)" }
        ],
        edges: [
          { from: "YOU", to: "ALEX" },
          { from: "YOU", to: "MAYA" },
          { from: "ALEX", to: "LIAM" },
          { from: "ALEX", to: "CHLOE" },
          { from: "MAYA", to: "NOAH" },
          { from: "CHLOE", to: "SOPH" },
          { from: "NOAH", to: "ETHAN" }
        ],
        steps: [
          {
            stepNum: 0,
            title: "1. Social Network Profile Graph",
            desc: "Starting node is 'You' (Level 0). Explore friendship connections level by level.",
            activeNode: "YOU",
            queue: ["You (Level 0)"],
            visited: ["YOU"],
            degreeRings: [0]
          },
          {
            stepNum: 1,
            title: "2. 1st-Degree: Direct Close Friends",
            desc: "Dequeue 'You'. Discovers Alex (Work) & Maya (College). Distance = 1st Degree connections.",
            activeNode: "YOU",
            queue: ["Alex (1st)", "Maya (1st)"],
            visited: ["YOU", "ALEX", "MAYA"],
            degreeRings: [0, 1]
          },
          {
            stepNum: 2,
            title: "3. 2nd-Degree: Mutual Friends (Friends of Friends)",
            desc: "Dequeue Alex & Maya ➔ discovers Liam, Chloe, and Noah (Distance = 2 hops). Perfect for 'Mutual Friends' features!",
            activeNode: "ALEX",
            queue: ["Liam (2nd)", "Chloe (2nd)", "Noah (2nd)"],
            visited: ["YOU", "ALEX", "MAYA", "LIAM", "CHLOE", "NOAH"],
            degreeRings: [0, 1, 2]
          },
          {
            stepNum: 3,
            title: "4. 3rd-Degree: 'People You May Know' Recommendations",
            desc: "Dequeue Chloe & Noah ➔ discovers Sophia and Ethan (Distance = 3 hops). Algorithms suggest them based on connection proximity!",
            activeNode: "CHLOE",
            queue: ["Sophia (3rd)", "Ethan (3rd)"],
            visited: ["YOU", "ALEX", "MAYA", "LIAM", "CHLOE", "NOAH", "SOPH", "ETHAN"],
            degreeRings: [0, 1, 2, 3]
          },
          {
            stepNum: 4,
            title: "5. Complete Degrees of Separation Explored",
            desc: "BFS maps out exact social distance circles: 1st Degree (Direct), 2nd Degree (Mutuals), 3rd Degree (Recommendations)!",
            activeNode: null,
            queue: ["All Explored"],
            visited: ["YOU", "ALEX", "MAYA", "LIAM", "CHLOE", "NOAH", "SOPH", "ETHAN"],
            degreeRings: [0, 1, 2, 3]
          }
        ]
      }
    };
  }

  init() {
    this.render();
  }

  selectApplication(appId) {
    if (!this.SCENARIOS[appId]) return;
    this.currentAppId = appId;
    this.currentStep = 0;
    this.pause(); // Do not autoplay immediately; user must click play!
    this.render();
    if (window.soundManager) window.soundManager.playPop();
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this._updatePlayPauseButton();

    const scenario = this.SCENARIOS[this.currentAppId];
    if (this.currentStep >= scenario.steps.length - 1) {
      this.currentStep = 0;
      this.renderScreen();
    }

    this._scheduleNextStep();
    if (window.soundManager) window.soundManager.playPop();
  }

  pause() {
    this.isPlaying = false;
    if (this.animTimer) {
      clearTimeout(this.animTimer);
      this.animTimer = null;
    }
    this._updatePlayPauseButton();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  restart() {
    this.pause();
    this.currentStep = 0;
    this.renderScreen();
    if (window.soundManager) window.soundManager.playPop();
  }

  stepForward() {
    this.pause();
    const scenario = this.SCENARIOS[this.currentAppId];
    if (this.currentStep < scenario.steps.length - 1) {
      this.currentStep++;
      this.renderScreen();
      if (window.soundManager) window.soundManager.playPop();
    }
  }

  stepBackward() {
    this.pause();
    if (this.currentStep > 0) {
      this.currentStep--;
      this.renderScreen();
      if (window.soundManager) window.soundManager.playPop();
    }
  }

  goToStep(stepIdx) {
    this.pause();
    const scenario = this.SCENARIOS[this.currentAppId];
    if (stepIdx >= 0 && stepIdx < scenario.steps.length) {
      this.currentStep = stepIdx;
      this.renderScreen();
      if (window.soundManager) window.soundManager.playPop();
    }
  }

  setPlaybackSpeed(speed) {
    this.playbackSpeed = speed;
    if (this.isPlaying) {
      if (this.animTimer) clearTimeout(this.animTimer);
      this._scheduleNextStep();
    }
    this._updateSpeedButtons();
  }

  _scheduleNextStep() {
    const scenario = this.SCENARIOS[this.currentAppId];
    const delay = this.baseInterval / this.playbackSpeed;

    this.animTimer = setTimeout(() => {
      if (!this.isPlaying) return;
      if (this.currentStep < scenario.steps.length - 1) {
        this.currentStep++;
        this.renderScreen();
        this._scheduleNextStep();
      } else {
        this.pause();
      }
    }, delay);
  }

  _updatePlayPauseButton() {
    const btn = document.getElementById("app-video-play-btn");
    if (!btn) return;
    if (this.isPlaying) {
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`;
    } else {
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play Live`;
    }
  }

  _updateSpeedButtons() {
    document.querySelectorAll(".bfs-video-speed-btn").forEach(btn => {
      const spd = parseFloat(btn.dataset.speed);
      btn.classList.toggle("active", spd === this.playbackSpeed);
    });
  }

  /* ─── Render Entire Studio Mount ─────────────────────────────── */

  render() {
    const mount = document.getElementById("applications-cinema-mount");
    if (!mount) return;

    // Update active tab button in selector bar
    document.querySelectorAll(".app-scenario-tab").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.app === this.currentAppId);
    });

    const scenario = this.SCENARIOS[this.currentAppId];

    mount.innerHTML = `
      <div class="app-cinema-player-card">
        
        <!-- Top Title Bar -->
        <div class="app-cinema-topbar">
          <div class="app-topbar-title-wrap">
            <div>
              <h3 class="app-cinema-title">${scenario.title}</h3>
              <p class="app-cinema-subtitle">${scenario.subtitle}</p>
            </div>
          </div>
          <span class="app-cinema-badge">${scenario.badge}</span>
        </div>

        <!-- 16:9 Cinema Canvas Screen -->
        <div class="app-cinema-screen-wrap">
          <div id="app-video-viewport" class="app-video-viewport">
            <!-- Rendered by renderScreen() -->
          </div>

          <!-- Bottom Live Status & Queue HUD Overlay -->
          <div class="app-cinema-hud-bar">
            <div class="app-hud-step-pill">
              <span id="app-hud-step-num">Step ${this.currentStep + 1}/${scenario.steps.length}</span>
            </div>
            <div class="app-hud-queue-deck">
              <span class="app-queue-label">FIFO QUEUE:</span>
              <div id="app-hud-queue-items" class="app-queue-chips-row">
                <!-- Dynamically populated -->
              </div>
            </div>
          </div>
        </div>

        <!-- Step Description & Narration Card -->
        <div class="app-narration-banner">
          <div class="app-narration-header">
            <span id="app-step-title" class="app-step-title">${scenario.steps[this.currentStep].title}</span>
          </div>
          <p id="app-step-desc" class="app-step-desc">${scenario.steps[this.currentStep].desc}</p>
        </div>

        <!-- Scrubber Timeline -->
        <div class="app-timeline-scrubber-wrap">
          <div class="app-timeline-track">
            ${scenario.steps.map((st, idx) => `
              <div class="app-timeline-step ${idx === this.currentStep ? 'active' : ''} ${idx < this.currentStep ? 'completed' : ''}" 
                   onclick="applicationsDemoEngine.goToStep(${idx})"
                   title="Jump to ${st.title}">
                <span class="st-dot"></span>
                <span class="st-num">${idx + 1}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Control Deck Bar -->
        <div class="app-cinema-controls-deck">
          <div class="app-ctl-left">
            <button id="app-video-play-btn" class="btn-video-ctl btn-video-play" onclick="applicationsDemoEngine.togglePlay()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play Live
            </button>
            <button class="btn-video-ctl" onclick="applicationsDemoEngine.restart()" title="Restart from Step 1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
            <button class="btn-video-ctl" onclick="applicationsDemoEngine.stepBackward()" title="Step Backward">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
            </button>
            <button class="btn-video-ctl" onclick="applicationsDemoEngine.stepForward()" title="Step Forward">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
            </button>
          </div>

          <div class="app-ctl-right">
            <div class="bfs-video-speed-group">
              <button class="bfs-video-speed-btn ${this.playbackSpeed === 0.5 ? 'active' : ''}" data-speed="0.5" onclick="applicationsDemoEngine.setPlaybackSpeed(0.5)">0.5x</button>
              <button class="bfs-video-speed-btn ${this.playbackSpeed === 1.0 ? 'active' : ''}" data-speed="1.0" onclick="applicationsDemoEngine.setPlaybackSpeed(1.0)">1x</button>
              <button class="bfs-video-speed-btn ${this.playbackSpeed === 2.0 ? 'active' : ''}" data-speed="2.0" onclick="applicationsDemoEngine.setPlaybackSpeed(2.0)">2x</button>
            </div>
          </div>
        </div>

      </div>
    `;

    this.renderScreen();
  }

  /* ─── Render Canvas Screen Graphics ──────────────────────────── */

  renderScreen() {
    const viewport = document.getElementById("app-video-viewport");
    const scenario = this.SCENARIOS[this.currentAppId];
    const step = scenario.steps[this.currentStep];
    if (!viewport || !scenario || !step) return;

    // Update Narration & HUD
    const stepTitleEl = document.getElementById("app-step-title");
    const stepDescEl = document.getElementById("app-step-desc");
    const stepNumEl = document.getElementById("app-hud-step-num");
    const queueItemsEl = document.getElementById("app-hud-queue-items");

    if (stepTitleEl) stepTitleEl.textContent = step.title;
    if (stepDescEl) stepDescEl.textContent = step.desc;
    if (stepNumEl) stepNumEl.textContent = `Step ${this.currentStep + 1}/${scenario.steps.length}`;

    if (queueItemsEl && step.queue) {
      queueItemsEl.innerHTML = step.queue.map(q => `
        <span class="app-q-chip">${q}</span>
      `).join('');
    }

    // Update Scrubber Active States
    document.querySelectorAll(".app-timeline-step").forEach((el, idx) => {
      el.classList.toggle("active", idx === this.currentStep);
      el.classList.toggle("completed", idx < this.currentStep);
    });

    // Render Scenario-Specific Visuals
    if (this.currentAppId === "network") {
      this._renderNetworkScreen(viewport, scenario, step);
    } else if (this.currentAppId === "maze") {
      this._renderMazeScreen(viewport, scenario, step);
    } else if (this.currentAppId === "shortest_path") {
      this._renderShortestPathScreen(viewport, scenario, step);
    } else if (this.currentAppId === "social") {
      this._renderSocialScreen(viewport, scenario, step);
    }
  }

  /* ─── Scenario 1: Network Broadcasting ───────────────────────── */

  _renderNetworkScreen(container, scenario, step) {
    const w = 580;
    const h = 270;

    let svg = `
      <svg viewBox="0 0 ${w} ${h}" class="app-svg-canvas">
        <defs>
          <linearGradient id="netEdgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="100%" stop-color="#0284c7"/>
          </linearGradient>
          <linearGradient id="activePacketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fbbf24"/>
            <stop offset="100%" stop-color="#f59e0b"/>
          </linearGradient>
          <filter id="glowNet" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0284c7" flood-opacity="0.3"/>
          </filter>
        </defs>

        <!-- Level Background Column Guides -->
        <rect x="30"  y="15" width="100" height="240" rx="10" fill="rgba(14,165,233,0.04)" stroke="rgba(14,165,233,0.12)" stroke-dasharray="4" />
        <text x="80"  y="28" text-anchor="middle" font-size="9" font-weight="800" fill="#0284c7">LEVEL 0 (Source)</text>

        <rect x="165" y="15" width="110" height="240" rx="10" fill="rgba(14,165,233,0.04)" stroke="rgba(14,165,233,0.12)" stroke-dasharray="4" />
        <text x="220" y="28" text-anchor="middle" font-size="9" font-weight="800" fill="#0284c7">LEVEL 1 (Switches)</text>

        <rect x="310" y="15" width="120" height="240" rx="10" fill="rgba(14,165,233,0.04)" stroke="rgba(14,165,233,0.12)" stroke-dasharray="4" />
        <text x="370" y="28" text-anchor="middle" font-size="9" font-weight="800" fill="#0284c7">LEVEL 2 (Offices)</text>

        <rect x="450" y="15" width="100" height="240" rx="10" fill="rgba(14,165,233,0.04)" stroke="rgba(14,165,233,0.12)" stroke-dasharray="4" />
        <text x="500" y="28" text-anchor="middle" font-size="9" font-weight="800" fill="#0284c7">LEVEL 3 (Terminals)</text>
    `;

    // Edges
    scenario.edges.forEach(edge => {
      const n1 = scenario.nodes.find(n => n.id === edge.from);
      const n2 = scenario.nodes.find(n => n.id === edge.to);
      const isActivePacket = step.activePackets && step.activePackets.some(p => p[0] === edge.from && p[1] === edge.to);
      const isDelivered = step.visited && step.visited.includes(edge.to);

      svg += `
        <line x1="${n1.x}" y1="${n1.y}" x2="${n2.x}" y2="${n2.y}"
              stroke="${isActivePacket ? 'url(#activePacketGrad)' : isDelivered ? '#0284c7' : '#94a3b8'}"
              stroke-width="${isActivePacket ? 4 : 2}"
              stroke-linecap="round"
              opacity="${isDelivered || isActivePacket ? 0.9 : 0.4}" />
      `;

      if (isActivePacket) {
        svg += `
          <circle cx="${(n1.x + n2.x) / 2}" cy="${(n1.y + n2.y) / 2}" r="5" fill="#f59e0b" filter="url(#glowNet)">
            <animate attributeName="r" values="4;7;4" dur="1s" repeatCount="indefinite"/>
          </circle>
        `;
      }
    });

    // Nodes
    scenario.nodes.forEach(node => {
      const isSource = node.level === 0;
      const isVisited = step.visited && step.visited.includes(node.id);
      const isActive = step.activeNode === node.id;

      let fill = isSource ? '#0284c7' : isVisited ? '#10b981' : '#f8fafc';
      let stroke = isSource ? '#0369a1' : isVisited ? '#059669' : '#cbd5e1';

      if (isActive) {
        fill = '#f59e0b';
        stroke = '#d97706';
      }

      svg += `
        <g class="net-node-group" filter="url(#glowNet)">
          ${isActive ? `<circle cx="${node.x}" cy="${node.y}" r="26" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4" opacity="0.8"><animateTransform attributeName="transform" type="rotate" from="0 ${node.x} ${node.y}" to="360 ${node.x} ${node.y}" dur="6s" repeatCount="indefinite"/></circle>` : ''}
          <rect x="${node.x - 20}" y="${node.y - 20}" width="40" height="40" rx="10" 
                fill="${fill}" stroke="${stroke}" stroke-width="2" />
          <text x="${node.x}" y="${node.y - 2}" text-anchor="middle" font-size="16">${node.icon}</text>
          <text x="${node.x}" y="${node.y + 12}" text-anchor="middle" font-size="8.5" font-weight="900" fill="${isVisited || isSource || isActive ? '#ffffff' : '#0f172a'}">${node.id}</text>
          <text x="${node.x}" y="${node.y + 30}" text-anchor="middle" font-size="8" font-weight="700" fill="#475569">${node.label}</text>
          <text x="${node.x}" y="${node.y + 40}" text-anchor="middle" font-size="7" font-weight="600" fill="#64748b">${node.ip}</text>
        </g>
      `;
    });

    svg += `</svg>`;
    container.innerHTML = svg;
  }

  /* ─── Scenario 2: Game & Maze Navigation ─────────────────────── */

  _renderMazeScreen(container, scenario, step) {
    const cols = scenario.gridSize.cols;
    const rows = scenario.gridSize.rows;
    const cellSize = 38;
    const offsetX = 50;
    const offsetY = 35;
    const w = 580;
    const h = 270;

    let svg = `
      <svg viewBox="0 0 ${w} ${h}" class="app-svg-canvas">
        <defs>
          <filter id="glowMaze" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0284c7" flood-opacity="0.35"/>
          </filter>
        </defs>
    `;

    // Draw Grid Cells
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `${r},${c}`;
        const isWall = scenario.walls.includes(key);
        const isStart = scenario.start.r === r && scenario.start.c === c;
        const isGoal  = scenario.goal.r === r && scenario.goal.c === c;
        const isVisited = step.visitedCells && step.visitedCells.includes(key);
        const isPath = step.shortestPath && step.shortestPath.includes(key);

        let x = offsetX + c * cellSize;
        let y = offsetY + r * cellSize;

        let fill = "#ffffff";
        let stroke = "#e2e8f0";

        if (isWall) {
          fill = "#334155";
          stroke = "#1e293b";
        } else if (isPath) {
          fill = "#fef08a"; // Shortest Path yellow highlight
          stroke = "#eab308";
        } else if (isVisited) {
          fill = "#e0f2fe"; // BFS explored wave
          stroke = "#7dd3fc";
        }

        svg += `
          <rect x="${x}" y="${y}" width="${cellSize - 3}" height="${cellSize - 3}" rx="6"
                fill="${fill}" stroke="${stroke}" stroke-width="1.5" />
        `;

        if (isWall) {
          svg += `<text x="${x + cellSize/2 - 1}" y="${y + cellSize/2 + 4}" text-anchor="middle" font-size="14">🧱</text>`;
        } else if (isStart) {
          svg += `<text x="${x + cellSize/2 - 1}" y="${y + cellSize/2 + 4}" text-anchor="middle" font-size="14">🏃</text>`;
        } else if (isGoal) {
          svg += `<text x="${x + cellSize/2 - 1}" y="${y + cellSize/2 + 4}" text-anchor="middle" font-size="14">💎</text>`;
        } else if (isPath) {
          svg += `<circle cx="${x + cellSize/2 - 1}" cy="${y + cellSize/2 - 1}" r="4" fill="#eab308" />`;
        }
      }
    }

    // Draw Shortest Path Line
    if (step.shortestPath && step.shortestPath.length > 1) {
      let pathD = "";
      step.shortestPath.forEach((ptStr, idx) => {
        const [r, c] = ptStr.split(',').map(Number);
        const x = offsetX + c * cellSize + (cellSize - 3) / 2;
        const y = offsetY + r * cellSize + (cellSize - 3) / 2;
        if (idx === 0) pathD += `M ${x} ${y}`;
        else pathD += ` L ${x} ${y}`;
      });

      svg += `
        <path d="${pathD}" fill="none" stroke="#eab308" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      `;
    }

    // Draw Moving Player Position
    if (step.playerPos) {
      const px = offsetX + step.playerPos.c * cellSize + (cellSize - 3) / 2;
      const py = offsetY + step.playerPos.r * cellSize + (cellSize - 3) / 2;
      svg += `
        <circle cx="${px}" cy="${py}" r="12" fill="#10b981" stroke="#059669" stroke-width="2" filter="url(#glowMaze)" />
        <text x="${px}" y="${py + 4}" text-anchor="middle" font-size="11">🏃</text>
      `;
    }

    // Legend on Right
    svg += `
      <g transform="translate(360, 45)">
        <rect x="0" y="0" width="180" height="175" rx="12" fill="rgba(240,249,255,0.85)" stroke="#bae6fd" stroke-width="1.5"/>
        <text x="14" y="24" font-size="11" font-weight="800" fill="#0369a1">MAZE BFS LEGEND</text>
        <circle cx="22" cy="48" r="7" fill="#e0f2fe" stroke="#7dd3fc"/>
        <text x="36" y="52" font-size="9" font-weight="700" fill="#475569">Explored Wave (Level)</text>

        <circle cx="22" cy="74" r="7" fill="#fef08a" stroke="#eab308"/>
        <text x="36" y="78" font-size="9" font-weight="700" fill="#475569">Shortest Path Found</text>

        <text x="16" y="104" font-size="12">🏃</text>
        <text x="36" y="104" font-size="9" font-weight="700" fill="#475569">Player Start: (1,0)</text>

        <text x="16" y="128" font-size="12">💎</text>
        <text x="36" y="128" font-size="9" font-weight="700" fill="#475569">Goal Target: (3,6)</text>

        <text x="16" y="152" font-size="12">🧱</text>
        <text x="36" y="152" font-size="9" font-weight="700" fill="#475569">Wall Obstacles</text>
      </g>
    `;

    svg += `</svg>`;
    container.innerHTML = svg;
  }

  /* ─── Scenario 3: Shortest Path Finder ───────────────────────── */

  _renderShortestPathScreen(container, scenario, step) {
    const w = 580;
    const h = 270;

    let svg = `
      <svg viewBox="0 0 ${w} ${h}" class="app-svg-canvas">
        <defs>
          <filter id="glowPath" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0284c7" flood-opacity="0.35"/>
          </filter>
        </defs>

        <!-- Distance Bands -->
        <line x1="140" y1="20" x2="140" y2="250" stroke="rgba(14,165,233,0.15)" stroke-dasharray="4" stroke-width="1.5"/>
        <text x="140" y="16" text-anchor="middle" font-size="8.5" font-weight="800" fill="#0284c7">DISTANCE 1</text>

        <line x1="270" y1="20" x2="270" y2="250" stroke="rgba(14,165,233,0.15)" stroke-dasharray="4" stroke-width="1.5"/>
        <text x="270" y="16" text-anchor="middle" font-size="8.5" font-weight="800" fill="#0284c7">DISTANCE 2</text>

        <line x1="420" y1="20" x2="420" y2="250" stroke="rgba(14,165,233,0.15)" stroke-dasharray="4" stroke-width="1.5"/>
        <text x="420" y="16" text-anchor="middle" font-size="8.5" font-weight="800" fill="#0284c7">DISTANCE 3 (Goal)</text>
    `;

    // Draw Edges
    scenario.edges.forEach(edge => {
      const n1 = scenario.nodes.find(n => n.id === edge.from);
      const n2 = scenario.nodes.find(n => n.id === edge.to);
      const isPathEdge = step.shortestPath && 
                         step.shortestPath.includes(edge.from) && 
                         step.shortestPath.includes(edge.to) &&
                         Math.abs(step.shortestPath.indexOf(edge.from) - step.shortestPath.indexOf(edge.to)) === 1;

      svg += `
        <line x1="${n1.x}" y1="${n1.y}" x2="${n2.x}" y2="${n2.y}"
              stroke="${isPathEdge ? '#eab308' : '#94a3b8'}"
              stroke-width="${isPathEdge ? 4 : 2}"
              stroke-linecap="round"
              opacity="${isPathEdge ? 1 : 0.4}" />
      `;
    });

    // Draw Nodes
    scenario.nodes.forEach(node => {
      const isVisited = step.visited && step.visited.includes(node.id);
      const isPathNode = step.shortestPath && step.shortestPath.includes(node.id);
      const dist = step.distMap && step.distMap[node.id] !== undefined ? step.distMap[node.id] : null;

      let fill = isPathNode ? '#fef08a' : isVisited ? '#e0f2fe' : '#f8fafc';
      let stroke = isPathNode ? '#eab308' : isVisited ? '#0284c7' : '#cbd5e1';

      svg += `
        <g class="sp-node-group" filter="url(#glowPath)">
          <circle cx="${node.x}" cy="${node.y}" r="22" fill="${fill}" stroke="${stroke}" stroke-width="2.5" />
          <text x="${node.x}" y="${node.y + 4}" text-anchor="middle" font-size="14">${node.icon}</text>
          <text x="${node.x}" y="${node.y + 34}" text-anchor="middle" font-size="9" font-weight="800" fill="#0f172a">${node.label}</text>
          ${dist !== null ? `<text x="${node.x + 22}" y="${node.y - 12}" font-size="8" font-weight="900" fill="#0284c7" background="#ffffff">D=${dist}</text>` : ''}
        </g>
      `;
    });

    svg += `</svg>`;
    container.innerHTML = svg;
  }

  /* ─── Scenario 4: Social Networks ────────────────────────────── */

  _renderSocialScreen(container, scenario, step) {
    const w = 580;
    const h = 270;

    let svg = `
      <svg viewBox="0 0 ${w} ${h}" class="app-svg-canvas">
        <defs>
          <filter id="glowSocial" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0284c7" flood-opacity="0.3"/>
          </filter>
        </defs>

        <!-- Degree Background Rings -->
        <rect x="30"  y="15" width="100" height="240" rx="10" fill="rgba(14,165,233,0.04)" stroke="rgba(14,165,233,0.12)" stroke-dasharray="4" />
        <text x="80"  y="28" text-anchor="middle" font-size="9" font-weight="800" fill="#0284c7">0° (You)</text>

        <rect x="155" y="15" width="110" height="240" rx="10" fill="rgba(14,165,233,0.04)" stroke="rgba(14,165,233,0.12)" stroke-dasharray="4" />
        <text x="210" y="28" text-anchor="middle" font-size="9" font-weight="800" fill="#0284c7">1° Direct Friends</text>

        <rect x="295" y="15" width="110" height="240" rx="10" fill="rgba(14,165,233,0.04)" stroke="rgba(14,165,233,0.12)" stroke-dasharray="4" />
        <text x="350" y="28" text-anchor="middle" font-size="9" font-weight="800" fill="#0284c7">2° Mutual Friends</text>

        <rect x="435" y="15" width="110" height="240" rx="10" fill="rgba(14,165,233,0.04)" stroke="rgba(14,165,233,0.12)" stroke-dasharray="4" />
        <text x="490" y="28" text-anchor="middle" font-size="9" font-weight="800" fill="#0284c7">3° Extended Circle</text>
    `;

    // Draw Friendship Edges
    scenario.edges.forEach(edge => {
      const n1 = scenario.nodes.find(n => n.id === edge.from);
      const n2 = scenario.nodes.find(n => n.id === edge.to);
      const isVisited = step.visited && step.visited.includes(edge.to);

      svg += `
        <line x1="${n1.x}" y1="${n1.y}" x2="${n2.x}" y2="${n2.y}"
              stroke="${isVisited ? '#0284c7' : '#94a3b8'}"
              stroke-width="2"
              stroke-linecap="round"
              opacity="${isVisited ? 0.9 : 0.35}" />
      `;
    });

    // Draw Profile Nodes
    scenario.nodes.forEach(node => {
      const isVisited = step.visited && step.visited.includes(node.id);
      const isActive = step.activeNode === node.id;

      let fill = node.degree === 0 ? '#0284c7' : isVisited ? '#10b981' : '#f8fafc';
      let stroke = node.degree === 0 ? '#0369a1' : isVisited ? '#059669' : '#cbd5e1';

      if (isActive) {
        fill = '#f59e0b';
        stroke = '#d97706';
      }

      svg += `
        <g class="social-node-group" filter="url(#glowSocial)">
          <circle cx="${node.x}" cy="${node.y}" r="22" fill="${fill}" stroke="${stroke}" stroke-width="2" />
          <text x="${node.x}" y="${node.y + 5}" text-anchor="middle" font-size="16">${node.icon}</text>
          <text x="${node.x}" y="${node.y + 34}" text-anchor="middle" font-size="9" font-weight="800" fill="#0f172a">${node.label}</text>
          <text x="${node.x}" y="${node.y + 44}" text-anchor="middle" font-size="7.5" font-weight="600" fill="#64748b">${node.role}</text>
        </g>
      `;
    });

    svg += `</svg>`;
    container.innerHTML = svg;
  }
}

// Global instance
window.applicationsDemoEngine = new ApplicationsDemoEngine();
