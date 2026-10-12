/**
 * AlgoLearn - Main Application Coordinator
 * Interactive Breadth First Search (BFS) Traversal & Graph Algorithms Suite
 * Presentation Reference Layouts: Sidebar Drawer, Overview, Learn (12 Chapters), Visualize (Cinema Studio), Progress (Modules FN-01 to FN-10)
 */

const BFS_SCORING = {
  learn: {
    total: 0,
    topicCount: 12
  },

  visualisation: {
    total: 16,
    marksPerVideo: 8,
    videoCount: 2
  },

  game: {
    total: 64,
    marksPerGame: 8,
    gameCount: 8,
    levels: {
      treeTraversal: [8, 8],
      graphTraversal: [8, 8, 8],
      advancedGraphChallenges: [8, 8, 8]
    },
    penalties: {
      hint: 3,
      guidedSolve: 3
    }
  },

  quiz: {
    totalPositiveMarks: 20,
    marksPerCorrectAnswer: 2,
    penaltyPerIncorrectAnswer: 1,
    questionCount: 10
  }
};
// Calculate total possible score dynamically from remaining modules (Visualize: 16 + Game: 64 + Quiz: 20 = 100)
BFS_SCORING.total = ((BFS_SCORING.visualisation && BFS_SCORING.visualisation.total) || 16)
  + ((BFS_SCORING.game && BFS_SCORING.game.total) || 64)
  + ((BFS_SCORING.quiz && BFS_SCORING.quiz.totalPositiveMarks) || 20);

window.BFS_SCORING = BFS_SCORING;

const LEVEL_MARKS = {
  1: 8, // Level 1 (8 pts)
  2: 8, // Level 2 (8 pts)
  3: 8, // Level 3 (8 pts)
  4: 8, // Level 4 (8 pts)
  5: 8, // Level 5 (8 pts)
  6: 8, // Level 6 (8 pts)
  7: 8, // Level 7 (8 pts)
  8: 8  // Level 8 (8 pts)
};
window.LEVEL_MARKS = LEVEL_MARKS;

function getCanonicalLevelSlot(lvl) {
  const n = parseInt(lvl, 10);
  if (n === 1) return 1;
  if (n === 2) return 2;
  if (n === 3) return 3;
  if (n === 4) return 4;
  if (n === 5) return 5;
  if (n === 6 || n === 7) return 6; // Disconnected (id 6) / Misleading (id 7) -> Advanced Level 1 (6 marks)
  if (n === 8) return 7;            // Large Network (id 8) -> Advanced Level 2 (7 marks)
  if (n === 9) return 8;            // Master Challenge (id 9) -> Advanced Level 3 (7 marks)
  return Math.min(8, Math.max(1, n || 1));
}
window.getCanonicalLevelSlot = getCanonicalLevelSlot;

const LEARN_CHECKPOINTS = {};
window.LEARN_CHECKPOINTS = LEARN_CHECKPOINTS;

class AppController {
  constructor() {
    this.activeTab = "overview";
    this.activeChapterId = "graph-foundations";
    this.activeLesson = "intro"; // 'intro' | 'shortest_path'
    this.activeFilter = "all";   // 'all' | 'foundation' | 'technique' | 'analysis' | 'examination'
    this.currentTheme = localStorage.getItem("algolearn_theme") || "light";
    this.soundEnabled = localStorage.getItem("algolearn_sound") !== "false";
    this.activeCodeLanguage = "c"; // Default active programming language tab

    // Video Player State & Dedicated Sources (Added Videos in videos/ directory)
    // Video Player State & Dedicated Sources (Added Videos in videos/ directory)
    this.video1File = "video final 1.mp4";
    this.video2File = "video final 2.mp4";

    this.video1Src = `videos/${encodeURIComponent(this.video1File)}`;
    this.video2Src = `videos/${encodeURIComponent(this.video2File)}`;

    this.videoLessons = {
      intro: {
        id: "video1",
        title: "Video 1: BFS Visualization & Traversal",
        fileTag: this.video1File,
        src: "videos/video final 1.mp4",
        fallbacks: [
          "videos/video final 1.mp4",
          "/videos/video final 1.mp4",
          "/videos/video%20final%201.mp4",
          "videos/video%20final%201.mp4"
        ]
      },
      shortest_path: {
        id: "video2",
        title: "Video 2: BFS Algorithm & Implementation",
        fileTag: this.video2File,
        src: "videos/video final 2.mp4",
        fallbacks: [
          "videos/video final 2.mp4",
          "/videos/video final 2.mp4",
          "/videos/video%20final%202.mp4",
          "videos/video%20final%202.mp4"
        ]
      }
    };

    this.isVideoPlaying = false;
    this.videoTime = 0;
    this.videoDuration = 0;
    this.videoSpeed = 1.0;
    this.videoVolume = 0.8;
    this.videoTimer = null;
    this.animFrameId = null;

    // Completed chapters / activities tracker
    this.completedChapters = new Set(JSON.parse(localStorage.getItem("algolearn_completed_chapters") || "[]"));
    this.completedActivities = new Set(JSON.parse(localStorage.getItem("algolearn_completed_activities") || "[]"));
    this.completedVideos = new Set(JSON.parse(localStorage.getItem("algolearn_completed_videos") || "[]"));
    this.expandedGameModules = new Set();
    this.currentModuleIndex = null;

    // Points System State & Game Assistance
    this.pointsHistory = [];
    this.penaltyHintsCount = 0;
    this.penaltyGuidedCount = 0;
    this.seedGameBonus = 0;
    this.gameAssistance = JSON.parse(localStorage.getItem("algolearn_game_assistance") || "{}");
    this.selectedCheckpointOptions = {};

    // 10 BFS Curriculum Modules Data (FN-01 to FN-10)
    this.modulesData = [
      {
        id: "FN-01",
        code: "FN-01",
        category: "foundation",
        categoryLabel: "FOUNDATION",
        title: "GRAPH FOUNDATIONS & ADJACENCY STRUCTURES",
        desc: "Master vertices, directed/undirected edges, adjacency lists, and O(V + E) vs O(V²) matrix representations.",
        criteria: "Criteria: Read Chapter 01 and understand node-edge mapping in graph traversal.",
        progress: 0,
        status: "Not Started",
        tabTarget: "theory",
        chapterTarget: "graph-foundations"
      },
      {
        id: "FN-02",
        code: "FN-02",
        category: "foundation",
        categoryLabel: "FOUNDATION",
        title: "BFS LEVEL-BY-LEVEL EXPLORATION",
        desc: "Explore graph nodes in expanding concentric wave rings starting from source root vertex.",
        criteria: "Criteria: Complete Chapter 02 and observe the distance-based discovery order.",
        progress: 0,
        status: "Not Started",
        tabTarget: "theory",
        chapterTarget: "what-is-bfs"
      },
      {
        id: "FN-03",
        code: "FN-03",
        category: "technique",
        categoryLabel: "TECHNIQUE",
        title: "THE FIFO QUEUE ENGINE (LEVEL 1)",
        desc: "First-In, First-Out waiting line mechanics maintaining strict proximity order (O(1) Enqueue & Dequeue).",
        criteria: "Criteria: Complete Level 1 in the game by enqueuing and dequeuing nodes in FIFO order.",
        progress: 0,
        status: "Not Started",
        tabTarget: "game",
        chapterTarget: "fifo-queue-engine"
      },
      {
        id: "FN-04",
        code: "FN-04",
        category: "technique",
        categoryLabel: "TECHNIQUE",
        title: "VISITED SET & CYCLE PREVENTION (LEVEL 2)",
        desc: "Maintain a boolean visited array to prevent duplicate queue insertions and infinite loop traps.",
        criteria: "Criteria: Complete Level 2/3 by correctly tracking visited status and skipping cycle edges.",
        progress: 0,
        status: "Not Started",
        tabTarget: "game",
        chapterTarget: "visited-tracking"
      },
      {
        id: "FN-05",
        code: "FN-05",
        category: "technique",
        categoryLabel: "TECHNIQUE",
        title: "DISCOVERY EDGES VS CROSS EDGES (LEVEL 4)",
        desc: "Classify graph edges during BFS traversal into tree branches (discovery) and lateral links (cross edges).",
        criteria: "Criteria: Read Chapter 06 and complete Level 4 edge classification challenge.",
        progress: 0,
        status: "Not Started",
        tabTarget: "theory",
        chapterTarget: "edge-classification"
      },
      {
        id: "FN-06",
        code: "FN-06",
        category: "technique",
        categoryLabel: "TECHNIQUE",
        title: "BFS SPANNING TREE STUDIO (LEVEL 5)",
        desc: "Construct the rooted acyclic BFS spanning tree containing exactly |V| - 1 discovery edges.",
        criteria: "Criteria: Form the complete BFS spanning tree in the interactive spanning tree workspace.",
        progress: 0,
        status: "Not Started",
        tabTarget: "game",
        chapterTarget: "spanning-tree"
      },
      {
        id: "FN-07",
        code: "FN-07",
        category: "analysis",
        categoryLabel: "ANALYSIS",
        title: "SHORTEST PATH IN UNWEIGHTED GRAPHS",
        desc: "Prove mathematical optimality of BFS shortest paths and backtrack using parent pointers.",
        criteria: "Criteria: Study Chapter 08 and watch the shortest path route playback video.",
        progress: 0,
        status: "Not Started",
        tabTarget: "theory",
        chapterTarget: "shortest-path"
      },
      {
        id: "FN-08",
        code: "FN-08",
        category: "analysis",
        categoryLabel: "ANALYSIS",
        title: "CONNECTED COMPONENTS & MULTI-SOURCE BFS",
        desc: "Traverse disconnected graph clusters and execute simultaneous multi-source frontier expansion.",
        criteria: "Criteria: Read Chapter 09 and identify all disconnected graph island partitions.",
        progress: 0,
        status: "Not Started",
        tabTarget: "theory",
        chapterTarget: "connected-components"
      },
      {
        id: "FN-09",
        code: "FN-09",
        category: "analysis",
        categoryLabel: "ANALYSIS",
        title: "TIME & SPACE COMPLEXITY ANALYSIS O(V+E)",
        desc: "Derive O(V + E) time bound using aggregate analysis and analyze peak queue auxiliary memory O(V).",
        criteria: "Criteria: Review Chapter 11 complexity bounds and comparative BFS vs DFS metrics.",
        progress: 0,
        status: "Not Started",
        tabTarget: "theory",
        chapterTarget: "complexity-analysis"
      },
      {
        id: "FN-10",
        code: "FN-10",
        category: "examination",
        categoryLabel: "EXAMINATION",
        title: "BFS GRAPH MASTERY EXAMINATION",
        desc: "Comprehensive examination covering queue mechanics, graph traversals, shortest path, and complexity.",
        criteria: "Criteria: Score at least 80% on the BFS mastery examination.",
        progress: 0,
        status: "Not Started",
        tabTarget: "quiz",
        chapterTarget: null
      }
    ];
  }

  init() {
    this.initTheme();
    this.initSound();
    this.bindEvents();

    // Initialize Game Engine if elements are present
    const svgEl = document.getElementById("graph-svg");
    const containerEl = document.getElementById("graph-canvas-container");
    if (typeof GameEngine !== "undefined" && svgEl && containerEl) {
      window.game = new GameEngine();
      window.game.init(svgEl, containerEl);
    }

    // Render Initial Views
    this.renderTOC();
    this.renderActiveChapter();
    this.renderProgressModules();
    this.updateProgressStats();
    this.initPointsSystem();
    this.updatePointsUI();
    this.initVideoPlayer();

    // Render Game Hub Grid
    this.renderLevelsGrid();

    // Start on Overview
    this.switchTab("overview");
  }

  /* ─── Event Binding ─────────────────────────────────────────── */

  bindEvents() {
    // Topbar Menu Toggle (Open/Close Sidebar Drawer)
    const toggleBtn = document.getElementById("topbar-menu-toggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => this.toggleSidebar());
    }

    const topbarBrand = document.querySelector(".topbar-brand-logo-left");
    if (topbarBrand) {
      topbarBrand.addEventListener("click", () => this.toggleSidebar());
    }

    const navTitleBtn = document.getElementById("topbar-nav-title-btn");
    if (navTitleBtn) {
      navTitleBtn.addEventListener("click", () => this.toggleSidebar());
    }

    // Sidebar Close Button
    const closeBtn = document.getElementById("sidebar-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeSidebar());
    }

    // Sidebar Backdrop Click
    const backdrop = document.getElementById("sidebar-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", () => this.closeSidebar());
    }

    // Nav Menu Buttons
    document.querySelectorAll(".sidebar-nav-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        if (tab) {
          this.switchTab(tab);
          if (window.innerWidth <= 768) {
            this.closeSidebar();
          }
        }
      });
    });

    // Theme Toggle
    const themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => this.toggleTheme());
    }

    // Sound Toggle
    const soundBtn = document.getElementById("sound-toggle-btn");
    if (soundBtn) {
      soundBtn.addEventListener("click", () => this.toggleSound());
    }

    // Interactive Game Mode Buttons
    const dequeueBtn = document.getElementById("action-dequeue-btn");
    if (dequeueBtn) {
      dequeueBtn.addEventListener("click", () => {
        if (window.game) window.game.handleDequeueExplore();
      });
    }

    const resetLevelBtn = document.getElementById("restart-level-btn");
    if (resetLevelBtn) {
      resetLevelBtn.addEventListener("click", () => {
        if (window.game) window.game.restartLevel();
      });
    }

    const autoPlayBtn = document.getElementById("guided-autoplay-btn");
    if (autoPlayBtn) {
      autoPlayBtn.addEventListener("click", () => {
        if (window.game && window.game.guidedEngine) window.game.guidedEngine.toggleAutoPlay();
      });
    }

    const nextStepBtn = document.getElementById("guided-next-btn");
    if (nextStepBtn) {
      nextStepBtn.addEventListener("click", () => {
        if (window.game && window.game.guidedEngine) window.game.guidedEngine.performSingleStep();
      });
    }

    const closeGuidanceBtn = document.getElementById("close-guidance-btn");
    const gotGuidanceBtn = document.getElementById("got-guidance-btn");
    const guidanceModal = document.getElementById("guidance-modal");
    const hideGuidance = () => {
      if (guidanceModal) {
        guidanceModal.classList.add("hidden");
        guidanceModal.classList.remove("flex");
      }
    };
    if (closeGuidanceBtn) closeGuidanceBtn.addEventListener("click", hideGuidance);
    if (gotGuidanceBtn) gotGuidanceBtn.addEventListener("click", hideGuidance);

    const openDemoBtn = document.getElementById("open-demo-btn");
    if (openDemoBtn) {
      openDemoBtn.addEventListener("click", () => {
        if (window.demoPlayer && window.game) {
          window.demoPlayer.openDemo(window.game.currentLevelIndex);
        }
      });
    }

    const closeDemoBtn = document.getElementById("close-demo-modal-btn");
    if (closeDemoBtn) {
      closeDemoBtn.addEventListener("click", () => {
        if (window.demoPlayer) window.demoPlayer.closeDemo();
      });
    }

    // Reset Progress Confirmation Modal backdrop and Escape listeners
    const resetModal = document.getElementById("reset-progress-modal");
    if (resetModal) {
      resetModal.addEventListener("click", (e) => {
        if (e.target === resetModal) {
          this.closeResetModal();
        }
      });
    }

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (resetModal && !resetModal.classList.contains("hidden")) {
          this.closeResetModal();
        }
      }
    });
  }

  /* ─── Sidebar Drawer ────────────────────────────────────────── */

  toggleSidebar() {
    if (document.body.classList.contains("sidebar-open")) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  openSidebar() {
    document.body.classList.add("sidebar-open");
    this.playSound("pop");
  }

  closeSidebar() {
    document.body.classList.remove("sidebar-open");
  }

  /* ─── Tab Switching ─────────────────────────────────────────── */

  switchTab(tabName) {
    const previousTab = this.activeTab;
    this.activeTab = tabName;

    // Immediately stop, pause, and rewind HTML5 videos to the beginning whenever leaving or entering visualize
    const v1 = document.getElementById("bfs-video-1");
    const v2 = document.getElementById("bfs-video-2");
    const video = document.getElementById("bfs-main-video");

    if (tabName !== "visualize" || previousTab !== "visualize") {
      if (v1) {
        v1.pause();
        v1.currentTime = 0;
      }
      if (v2) {
        v2.pause();
        v2.currentTime = 0;
      }
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    }
    this.isVideoPlaying = false;
    this.syncPlayButtonUI();

    // Also stop/pause background simulators if switching tabs
    if (window.applicationsDemoEngine && typeof window.applicationsDemoEngine.pause === "function") {
      window.applicationsDemoEngine.pause();
    }
    if (window.spanningTreeStudio && typeof window.spanningTreeStudio.pause === "function") {
      window.spanningTreeStudio.pause();
    }
    if (window.game && window.game.guidedEngine) {
      if (window.game.guidedEngine.isAutoPlaying) {
        window.game.guidedEngine.pauseAutoPlay();
      }
      window.game.guidedEngine.isActive = false;
      if (typeof window.game.updateGuidedSolveUI === "function") {
        window.game.updateGuidedSolveUI();
      }
    }

    // When navigating away from the game section, reset game sub-views to the cards hub
    if (tabName !== "game") {
      this.activeLevelIndex = null;
      this.currentModuleIndex = null;
      const hub = document.getElementById("game-levels-hub");
      const modView = document.getElementById("module-levels-view");
      const work = document.getElementById("active-problem-container");
      if (modView) { modView.classList.add("hidden"); modView.style.display = "none"; }
      if (work) { work.classList.add("hidden"); work.style.display = "none"; }
      if (hub) { hub.classList.remove("hidden"); hub.style.display = "block"; }
    }

    // Update Sidebar Navigation Buttons
    document.querySelectorAll(".sidebar-nav-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    // Update Topbar Subtitle
    const subviewEl = document.getElementById("topbar-subview-name");
    const labels = {
      overview: "Overview",
      theory: "Learn",
      visualize: "Visualize",
      game: "Game Challenges",
      quiz: "Mastery Quiz",
      progress: "Progress Tracker"
    };
    if (subviewEl && labels[tabName]) {
      subviewEl.textContent = labels[tabName];
    }

    // Switch View Containers
    const views = {
      overview: document.getElementById("view-overview"),
      theory: document.getElementById("view-theory"),
      visualize: document.getElementById("view-visualize"),
      game: document.getElementById("view-game"),
      quiz: document.getElementById("view-quiz"),
      progress: document.getElementById("view-progress")
    };

    Object.entries(views).forEach(([key, el]) => {
      if (!el) return;
      if (key === tabName) {
        el.classList.remove("hidden");
        el.style.display = "block";
      } else {
        el.classList.add("hidden");
        el.style.display = "none";
      }
    });

    // Sub-view updates
    if (tabName === "theory") {
      this.renderTOC();
      this.renderActiveChapter();
    } else if (tabName === "visualize") {
      this.startVideoPlayback();
    } else if (tabName === "game") {
      // Always reset to the modules hub so user sees module cards at first
      this.activeLevelIndex = null;
      this.currentModuleIndex = null;
      const hub = document.getElementById("game-levels-hub");
      const modView = document.getElementById("module-levels-view");
      const work = document.getElementById("active-problem-container");
      if (modView) { modView.classList.add("hidden"); modView.style.display = "none"; }
      if (work) { work.classList.add("hidden"); work.style.display = "none"; }
      if (hub) {
        hub.classList.remove("hidden");
        hub.style.display = "block";
      }
      this.renderLevelsGrid();
    } else if (tabName === "progress") {
      this.updateProgressStats();
      this.renderProgressModules();
    } else if (tabName === "quiz" && window.quizEngine) {
      const quizMount = document.getElementById("quiz-mount-point");
      if (quizMount) window.quizEngine.init(quizMount);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    this.playSound("pop");
  }

  /* ─── Theme Toggle (Icon Only ☀️ / 🌙) ───────────────────────── */

  initTheme() {
    document.documentElement.setAttribute("data-theme", this.currentTheme);
    document.body.classList.toggle("dark-theme", this.currentTheme === "dark");
    this._updateThemeIcon();
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("algolearn_theme", this.currentTheme);
    document.documentElement.setAttribute("data-theme", this.currentTheme);
    document.body.classList.toggle("dark-theme", this.currentTheme === "dark");
    this._updateThemeIcon();
    
    // Re-render Graph Canvas and Spanning Tree with theme-specific lighting & gradients
    if (window.game) {
      window.game.render();
      window.game.renderSpanningTree();
    }

    this.playSound("pop");
  }

  _updateThemeIcon() {
    const btn = document.getElementById("theme-toggle-btn");
    if (!btn) return;
    const isDark = this.currentTheme === "dark";
    const iconSpan = btn.querySelector(".theme-icon");
    if (iconSpan) {
      iconSpan.innerHTML = isDark
        ? `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
    }
  }

  /* ─── Sound Toggle (Icon Only 🔊 / 🔇) ───────────────────────── */

  initSound() {
    this._updateSoundIcon();
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem("algolearn_sound", this.soundEnabled);
    this._updateSoundIcon();
    this.showToast(this.soundEnabled ? "Audio Effects Enabled" : "Audio Muted");
  }

  _updateSoundIcon() {
    const box = document.getElementById("sound-icon-box");
    if (!box) return;
    box.innerHTML = this.soundEnabled
      ? `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`
      : `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
  }

  playSound(type) {
    if (!this.soundEnabled) return;
    if (window.soundManager && typeof window.soundManager.playPop === "function") {
      window.soundManager.playPop();
    }
  }

  /* ─── Learn Section: Table of Contents & Chapter Viewer ──────── */

  renderTOC() {
    const mount = document.getElementById("toc-chapters-list");
    if (!mount || typeof THEORY_MODULES === "undefined") return;

    mount.innerHTML = THEORY_MODULES.map((ch, index) => {
      const isActive = ch.id === this.activeChapterId;
      const isDone = this.completedChapters.has(ch.id);
      const numStr = String(ch.chapterNum || (index + 1)).padStart(2, "0");
      const cleanTitle = ch.tocTitle ? ch.tocTitle.replace(/^\d+\s*/, '') : ch.title;

      return `
        <div class="toc-chapter-item ${isActive ? "active" : ""}" onclick="app.selectChapter('${ch.id}')">
          <div class="toc-item-left">
            <span class="toc-item-num">${numStr}</span>
            <span class="toc-item-name">${cleanTitle}</span>
          </div>
          <span class="toc-item-status">${isActive ? '<span class="toc-dot active-dot"></span>' : (isDone ? '<span class="toc-check">✓</span>' : '<span class="toc-dot empty-dot"></span>')}</span>
        </div>
      `;
    }).join("");

    // Progress in Header and Footer
    const count = this.completedChapters.size;
    const pct = Math.round((count / THEORY_MODULES.length) * 100);
    const pill = document.getElementById("theory-progress-pill");
    const status = document.getElementById("toc-completed-status");
    if (pill) pill.textContent = `Progress: ${count} / ${THEORY_MODULES.length} Chapters (${pct}%)`;
    if (status) status.textContent = `${count} / ${THEORY_MODULES.length} Completed`;
  }

  selectChapter(chapterId) {
    this.activeChapterId = chapterId;
    this.renderTOC();
    this.renderActiveChapter();
    this.playSound("pop");
  }

  renderActiveChapter() {
    const mount = document.getElementById("chapter-detail-mount");
    if (!mount || typeof THEORY_MODULES === "undefined") return;

    const currentIndex = THEORY_MODULES.findIndex(m => m.id === this.activeChapterId);
    const chIndex = currentIndex >= 0 ? currentIndex : 0;
    const ch = THEORY_MODULES[chIndex] || THEORY_MODULES[0];
    if (!ch) return;

    const isCompleted = this.completedChapters.has(ch.id);
    const hasPrev = chIndex > 0;
    const hasNext = chIndex < THEORY_MODULES.length - 1;
    const prevId = hasPrev ? THEORY_MODULES[chIndex - 1].id : null;
    const nextId = hasNext ? THEORY_MODULES[chIndex + 1].id : null;

    // Determine target level number for "Try Level X" button
    const levelNum = Math.min(Math.max(1, parseInt(ch.chapterNum, 10) || 1), 6);

    mount.innerHTML = `
      <div class="ch-detail-card">
        
        <!-- Meta Badge Row -->
        <div class="ch-meta-badge-row">
          <span class="ch-cat-pill">CHAPTER ${ch.chapterNum} // ${ch.category}</span>
          <span class="ch-read-time"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:middle;margin-right:4px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Est. Read: ${ch.readTime}</span>
        </div>

        <!-- Chapter Title -->
        <h2 class="ch-main-title">${ch.title}</h2>

        <!-- Executive Definition -->
        <div>
          <div class="ch-section-tag">EXECUTIVE DEFINITION</div>
          <p class="ch-exec-def">${ch.execDefinition}</p>
        </div>

        <!-- Core Intuition / Analogy Box -->
        <div class="ch-analogy-box">
          <div class="ch-analogy-tag">CORE INTUITION // ANALOGY</div>
          <p class="ch-analogy-quote">"${ch.analogy}"</p>
        </div>

        <!-- Critical Specifications -->
        <div>
          <div class="ch-section-tag">CRITICAL SPECIFICATIONS</div>
          <div class="ch-specs-list">
            ${ch.specs.map(s => `
              <div class="ch-spec-item">
                <span class="ch-spec-bullet">&bull;</span>
                <span>${s}</span>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Topic Visual Illustration Card -->
        ${this.getTopicIllustrationCardHTML(ch.id)}

        <!-- Fundamental Formula -->
        ${ch.formula ? `
        <div>
          <div class="ch-section-tag">MATHEMATICAL INVARIANT &amp; FORMULA</div>
          <div class="ch-formula-box">${ch.formula}</div>
        </div>
        ` : ''}

        <!-- Topic Code Implementations (C / C++ / Java / Python) -->
        ${this.renderCodeImplementationBox(ch)}

        <!-- Architecture Diagram Step Flow -->
        ${ch.diagram ? `
        <div class="ch-arch-diagram-wrap">
          <div class="ch-section-tag">ALGORITHM DYNAMICS // BFS TRAVERSAL FLOW</div>
          
          <div class="ch-diagram-flow-row">
            <div class="ch-flow-box">
              <span class="ch-flow-step-lbl">${ch.diagram.step1Title || '1. ROOT SOURCE'}</span>
              <span class="ch-flow-step-val">${ch.diagram.step1Val || ''}</span>
            </div>
            
            <span class="ch-flow-arrow">&rarr;</span>

            <div class="ch-flow-box">
              <span class="ch-flow-step-lbl">${ch.diagram.step2Title || '2. FIFO QUEUE'}</span>
              <span class="ch-flow-step-val">${ch.diagram.step2Val || ''}</span>
            </div>

            <span class="ch-flow-arrow">&rarr;</span>

            <div class="ch-flow-box highlight">
              <span class="ch-flow-step-lbl">${ch.diagram.step3Title || '3. EXPANSION'}</span>
              <span class="ch-flow-step-val">${ch.diagram.step3Val || ''}</span>
            </div>

            <span class="ch-flow-arrow">&rarr;</span>

            <div class="ch-flow-box">
              <span class="ch-flow-step-lbl">${ch.diagram.step4Title || '4. LEVEL ORDER'}</span>
              <span class="ch-flow-step-val">${ch.diagram.step4Val || ''}</span>
            </div>
          </div>

          <!-- Real-World Application Badges & State Array -->
          <div class="ch-section-tag" style="margin-top: 18px;">${ch.diagram.trayLabel || 'TRAVERSAL STATE ARRAY:'}</div>
          <div class="ch-memory-slots-row">
            ${(ch.diagram.items || []).map(item => `
              <div class="ch-slot-card ${item.active ? "active-slot" : ""}">
                <div class="ch-slot-title">${item.label}</div>
                <div class="ch-slot-desc">${item.val}</div>
              </div>
            `).join("")}
          </div>
        </div>
        ` : ''}

        <!-- Bottom Chapter Navigation Action Bar (Exact UI Matching Reference Images 1 & 2) -->
        <div class="ch-bottom-nav-bar">
          <div class="ch-nav-left-group">
            <button id="ch-nav-prev-btn" class="ch-nav-btn ch-nav-btn-secondary ${!hasPrev ? 'disabled' : ''}" 
                    ${hasPrev ? `onclick="app.selectChapter('${prevId}')"` : 'disabled'}
                    title="Previous Chapter">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              <span>Prev</span>
            </button>

            <button id="ch-nav-mark-btn" class="ch-nav-btn ch-nav-btn-primary ${isCompleted ? 'completed' : ''}"
                    onclick="app.toggleChapterCompletion('${ch.id}')"
                    title="${isCompleted ? 'Mark as Incomplete' : 'Mark as Completed'}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span>${isCompleted ? 'Completed' : 'Mark Completed'}</span>
            </button>

            <button id="ch-nav-next-btn" class="ch-nav-btn ch-nav-btn-secondary ${!hasNext ? 'disabled' : ''}" 
                    ${hasNext ? `onclick="app.selectChapter('${nextId}')"` : 'disabled'}
                    title="Next Chapter">
              <span>Next</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>

          <div class="ch-nav-right-group">
            <button id="ch-nav-try-level-btn" class="ch-nav-btn ch-nav-btn-outline"
                    onclick="app.startPracticeLevel(${levelNum})"
                    title="Try Practice Level ${levelNum}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block;vertical-align:middle;margin-right:2px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span>Try Level ${levelNum}</span>
            </button>
          </div>
        </div>

      </div>
    `;
  }

  renderChapterCheckpointHTML(ch) {
    return "";
  }

  selectCheckpointOption(chapterId, optionId) {}

  submitChapterCheckpoint(chapterId) {}

  toggleChapterCompletion(chapterId) {
    if (this.completedChapters.has(chapterId)) {
      this.completedChapters.delete(chapterId);
    } else {
      this.completedChapters.add(chapterId);
    }
    localStorage.setItem("algolearn_completed_chapters", JSON.stringify([...this.completedChapters]));
    this.renderTOC();
    this.renderActiveChapter();
    this.updateProgressStats();
    this.playSound("pop");
  }

  startPracticeLevel(levelNum) {
    this.switchTab("game");
    const idx = Math.max(0, (parseInt(levelNum, 10) || 1) - 1);
    this.openLevelProblem(idx);
    this.playSound("pop");
  }

  /* ─── Topic-Specific Code Implementations Component (C / C++ / Java / Python) ─── */

  renderCodeImplementationBox(ch) {
    if (!ch || !ch.codeImplementations) return "";

    const lang = this.activeCodeLanguage || "c";
    const rawCode = ch.codeImplementations[lang] || ch.codeImplementations.c || "";
    const highlightedCode = this.highlightSyntax(rawCode, lang);

    const langs = [
      { id: "c", label: "C" },
      { id: "cpp", label: "C++" },
      { id: "java", label: "Java" },
      { id: "python", label: "Python" }
    ];

    return `
      <div class="ch-code-section-wrapper">
        <div class="ch-section-tag">CODE IMPLEMENTATIONS (C / C++ / JAVA / PYTHON)</div>
        <div class="ch-code-card">
          <div class="ch-code-topbar">
            <div class="ch-code-lang-tabs" role="tablist" aria-label="Programming Language Tabs">
              ${langs.map(l => `
                <button class="ch-code-tab-btn ${l.id === lang ? 'active' : ''}"
                        onclick="app.setCodeLanguage('${l.id}')"
                        role="tab"
                        aria-selected="${l.id === lang ? 'true' : 'false'}"
                        title="Switch to ${l.label} Implementation">
                  ${l.label}
                </button>
              `).join("")}
            </div>
            <button id="ch-code-copy-btn" class="ch-code-copy-btn" onclick="app.copyCurrentCode()" title="Copy Source Code">
              <svg class="copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span class="copy-text">Copy</span>
            </button>
          </div>
          <div class="ch-code-body">
            <pre class="ch-code-pre"><code id="ch-code-display" class="ch-code-content language-${lang}">${highlightedCode}</code></pre>
          </div>
        </div>
      </div>
    `;
  }

  setCodeLanguage(lang) {
    this.activeCodeLanguage = lang;
    this.playSound("click");

    const currentCh = (typeof THEORY_MODULES !== "undefined") ? 
      (THEORY_MODULES.find(m => m.id === this.activeChapterId) || THEORY_MODULES[0]) : null;

    if (!currentCh || !currentCh.codeImplementations) return;

    const codeDisplay = document.getElementById("ch-code-display");
    if (codeDisplay) {
      const rawCode = currentCh.codeImplementations[lang] || currentCh.codeImplementations.c || "";
      codeDisplay.className = `ch-code-content language-${lang}`;
      codeDisplay.innerHTML = this.highlightSyntax(rawCode, lang);
    }

    const tabs = document.querySelectorAll(".ch-code-tab-btn");
    tabs.forEach(tab => {
      const tabText = tab.textContent.trim().toLowerCase();
      const isMatch = (lang === "c" && tabText === "c") ||
                      (lang === "cpp" && tabText === "c++") ||
                      (lang === "java" && tabText === "java") ||
                      (lang === "python" && tabText === "python");
      tab.classList.toggle("active", isMatch);
      tab.setAttribute("aria-selected", isMatch ? "true" : "false");
    });
  }

  copyCurrentCode() {
    const currentCh = (typeof THEORY_MODULES !== "undefined") ? 
      (THEORY_MODULES.find(m => m.id === this.activeChapterId) || THEORY_MODULES[0]) : null;

    if (!currentCh || !currentCh.codeImplementations) return;

    const lang = this.activeCodeLanguage || "c";
    const rawCode = currentCh.codeImplementations[lang] || currentCh.codeImplementations.c || "";
    const copyBtn = document.getElementById("ch-code-copy-btn");

    const onCopied = () => {
      this.playSound("pop");
      if (copyBtn) {
        copyBtn.classList.add("copied");
        copyBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span class="copy-text">Copied!</span>
        `;
        setTimeout(() => {
          if (copyBtn) {
            copyBtn.classList.remove("copied");
            copyBtn.innerHTML = `
              <svg class="copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span class="copy-text">Copy</span>
            `;
          }
        }, 2000);
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(rawCode).then(onCopied).catch(() => {
        this.fallbackCopyText(rawCode, onCopied);
      });
    } else {
      this.fallbackCopyText(rawCode, onCopied);
    }
  }

  fallbackCopyText(text, callback) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      if (callback) callback();
    } catch (err) {
      console.error("Fallback copy failed", err);
    }
    document.body.removeChild(textArea);
  }

  highlightSyntax(rawCode, lang) {
    if (!rawCode) return "";

    // 1. Escape HTML special characters
    let text = rawCode
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Store placeholders for protected segments (strings, comments, preprocessor)
    const placeholders = [];
    const addPlaceholder = (match, className) => {
      const idx = placeholders.length;
      placeholders.push(`<span class="${className}">${match}</span>`);
      return `___TOKEN_PH_${idx}___`;
    };

    // 2. Multi-line comments /* ... */
    text = text.replace(/\/\*[\s\S]*?\*\//g, m => addPlaceholder(m, "syn-com"));

    // 3. Single-line comments
    if (lang === "python") {
      text = text.replace(/(#[^\n]*)/g, m => addPlaceholder(m, "syn-com"));
    } else {
      text = text.replace(/(\/\/[^\n]*)/g, m => addPlaceholder(m, "syn-com"));
    }

    // 4. Strings ("..." or '...')
    text = text.replace(/(&quot;[\s\S]*?&quot;|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')/g, m => addPlaceholder(m, "syn-str"));

    // 5. Preprocessor directives & imports
    if (lang === "c" || lang === "cpp") {
      text = text.replace(/(#(?:include|define|pragma|ifdef|ifndef|endif)[^\n]*)/g, m => addPlaceholder(m, "syn-prep"));
    }

    // 6. Keywords and types definition per language
    const cKeywords = ["auto","break","case","const","continue","default","do","else","enum","extern","for","goto","if","register","return","signed","sizeof","static","struct","switch","typedef","union","unsigned","volatile","while","NULL"];
    const cppKeywords = [...cKeywords, "class","public","private","protected","virtual","override","namespace","using","template","typename","new","delete","this","nullptr","true","false","inline","explicit","friend","operator","try","catch","throw","std"];
    const javaKeywords = ["abstract","assert","boolean","break","byte","case","catch","char","class","const","continue","default","do","double","else","enum","extends","final","finally","float","for","goto","if","implements","import","instanceof","int","interface","long","native","new","package","private","protected","public","return","short","static","strictfp","super","switch","synchronized","this","throw","throws","transient","try","void","volatile","while","true","false","null","System","out","println","print","Arrays","Collections","List","ArrayList","LinkedList","Queue","ArrayDeque","Map","HashMap","Set","HashSet"];
    const pythonKeywords = ["and","as","assert","async","await","break","class","continue","def","del","elif","else","except","finally","for","from","global","if","import","in","is","lambda","nonlocal","not","or","pass","raise","return","try","while","with","yield","True","False","None","self","range","len","print","enumerate","map","list","dict","set","tuple","int","str","float","bool","deque","Dict","List","Tuple","Optional"];

    const types = ["int","void","bool","boolean","char","float","double","long","short","unsigned","size_t","struct","class","vector","queue","deque","string","Point","Node","Graph","AdjListNode","FIFOQueue","BasicBFS","GraphFoundations","Cell","Edge"];

    let kwList = cKeywords;
    if (lang === "cpp") kwList = cppKeywords;
    else if (lang === "java") kwList = javaKeywords;
    else if (lang === "python") kwList = pythonKeywords;

    // Highlight Types
    const typeRegex = new RegExp(`\\b(${types.join("|")})\\b`, "g");
    text = text.replace(typeRegex, '<span class="syn-type">$1</span>');

    // Highlight Keywords
    const kwRegex = new RegExp(`\\b(${kwList.join("|")})\\b`, "g");
    text = text.replace(kwRegex, '<span class="syn-kw">$1</span>');

    // Highlight Numbers
    text = text.replace(/\b(\d+)\b/g, '<span class="syn-num">$1</span>');

    // 7. Restore placeholders
    placeholders.forEach((ph, i) => {
      text = text.replace(`___TOKEN_PH_${i}___`, ph);
    });

    return text;
  }

  /* ─── 12 Topic Visual Illustration Cards Generator (Attractive Diagrams) ──── */

  getTopicIllustrationCardHTML(chapterId) {
    // Shared SVG Filters and Gradients definitions (AlgoLearn Unified Brand System)
    const svgDefs = `
      <defs>
        <!-- Node Drop Shadow -->
        <filter id="nodeShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.25"/>
        </filter>
        
        <!-- Unified AlgoLearn Brand Node Gradients (Royal Blue 55% + Violet 35%) -->
        <linearGradient id="gBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4B73FF"/><stop offset="100%" stop-color="#315BEA"/>
        </linearGradient>
        <linearGradient id="gIndigo" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6947E8"/><stop offset="100%" stop-color="#4169E1"/>
        </linearGradient>
        <linearGradient id="gPurple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#A78BFA"/><stop offset="100%" stop-color="#6947E8"/>
        </linearGradient>
        <linearGradient id="gViolet" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#C4B5FD"/><stop offset="100%" stop-color="#6947E8"/>
        </linearGradient>
        <linearGradient id="gCyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#315BEA"/>
        </linearGradient>
        <linearGradient id="gGreen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#5366E8"/><stop offset="100%" stop-color="#4169E1"/>
        </linearGradient>
        <linearGradient id="gAmber" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#93C5FD"/><stop offset="100%" stop-color="#315BEA"/>
        </linearGradient>
        <linearGradient id="gRose" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#A78BFA"/><stop offset="100%" stop-color="#6947E8"/>
        </linearGradient>

        <!-- Arrow Markers -->
        <marker id="arrGreen" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 8 5 L 0 9 z" fill="#315BEA"/>
        </marker>
        <marker id="arrOrange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 8 5 L 0 9 z" fill="#4169E1"/>
        </marker>
        <marker id="arrRed" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 8 5 L 0 9 z" fill="#6947E8"/>
        </marker>
        <marker id="arrBlue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 8 5 L 0 9 z" fill="#4169E1"/>
        </marker>
      </defs>
    `;

    switch (chapterId) {
      case "graph-foundations":
        return `
          <div class="topic-visual-card-hero">
            <div class="tvc-header">
              <span class="tvc-badge blue">01 Graph Foundations</span>
              <span class="tvc-subtitle">Where connections come to life.</span>
            </div>
            <div class="tvc-canvas-wrap">
              <svg viewBox="0 0 340 180" class="tvc-svg">
                ${svgDefs}
                <!-- Edges -->
                <line x1="50" y1="90" x2="110" y2="105" stroke="#94a3b8" stroke-width="2.2" opacity="0.85" />
                <line x1="50" y1="90" x2="90" y2="150" stroke="#94a3b8" stroke-width="2.2" opacity="0.85" />
                <line x1="50" y1="90" x2="190" y2="45" stroke="#94a3b8" stroke-width="2.2" opacity="0.85" />
                <line x1="110" y1="105" x2="190" y2="45" stroke="#94a3b8" stroke-width="2.2" opacity="0.85" />
                <line x1="110" y1="105" x2="200" y2="125" stroke="#94a3b8" stroke-width="2.2" opacity="0.85" />
                <line x1="110" y1="105" x2="90" y2="150" stroke="#94a3b8" stroke-width="2.2" opacity="0.85" />
                <line x1="90" y1="150" x2="200" y2="125" stroke="#94a3b8" stroke-width="2.2" opacity="0.85" />
                <line x1="90" y1="150" x2="280" y2="150" stroke="#94a3b8" stroke-width="2.2" opacity="0.85" />
                <line x1="190" y1="45" x2="280" y2="85" stroke="#94a3b8" stroke-width="2.2" opacity="0.85" />
                <line x1="200" y1="125" x2="280" y2="85" stroke="#94a3b8" stroke-width="2.2" opacity="0.85" />
                <line x1="200" y1="125" x2="280" y2="150" stroke="#94a3b8" stroke-width="2.2" opacity="0.85" />
                
                <!-- Nodes with letters A-G -->
                <circle cx="50" cy="90" r="16" fill="url(#gBlue)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="50" y="95" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">A</text>

                <circle cx="110" cy="105" r="16" fill="url(#gIndigo)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="110" y="110" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">B</text>

                <circle cx="190" cy="45" r="16" fill="url(#gPurple)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="190" y="50" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">C</text>

                <circle cx="90" cy="150" r="16" fill="url(#gBlue)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="90" y="155" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">D</text>

                <circle cx="200" cy="125" r="16" fill="url(#gIndigo)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="200" y="130" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">E</text>

                <circle cx="280" cy="85" r="16" fill="url(#gPurple)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="280" y="90" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">F</text>

                <circle cx="280" cy="150" r="16" fill="url(#gBlue)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="280" y="155" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">G</text>
              </svg>
            </div>
            <div class="tvc-footer">Vertices, Edges, Directed &amp; Undirected Graphs</div>
          </div>
        `;

      case "what-is-bfs":
        return `
          <div class="topic-visual-card-hero">
            <div class="tvc-header">
              <span class="tvc-badge blue">02 What is BFS?</span>
              <span class="tvc-subtitle">Explore level by level.</span>
            </div>
            <div class="tvc-canvas-wrap">
              <svg viewBox="0 0 340 180" class="tvc-svg">
                ${svgDefs}
                <!-- Level Columns in AlgoLearn palette -->
                <rect x="105" y="15" width="40" height="140" rx="8" fill="rgba(37, 99, 235, 0.06)" stroke="rgba(37, 99, 235, 0.25)" stroke-dasharray="4,4" />
                <rect x="185" y="15" width="40" height="140" rx="8" fill="rgba(79, 70, 229, 0.06)" stroke="rgba(79, 70, 229, 0.25)" stroke-dasharray="4,4" />
                <rect x="265" y="15" width="40" height="140" rx="8" fill="rgba(124, 58, 237, 0.06)" stroke="rgba(124, 58, 237, 0.25)" stroke-dasharray="4,4" />

                <!-- Expansion Wave Arrows -->
                <line x1="45" y1="90" x2="112" y2="58" stroke="#2563eb" stroke-width="2.2" marker-end="url(#arrGreen)" />
                <line x1="45" y1="90" x2="112" y2="122" stroke="#2563eb" stroke-width="2.2" marker-end="url(#arrGreen)" />
                <line x1="125" y1="58" x2="192" y2="38" stroke="#4f46e5" stroke-width="2.2" marker-end="url(#arrOrange)" />
                <line x1="125" y1="58" x2="192" y2="78" stroke="#4f46e5" stroke-width="2.2" marker-end="url(#arrOrange)" />
                <line x1="125" y1="122" x2="192" y2="135" stroke="#4f46e5" stroke-width="2.2" marker-end="url(#arrOrange)" />
                <line x1="205" y1="38" x2="272" y2="28" stroke="#7c3aed" stroke-width="2.2" marker-end="url(#arrRed)" />
                <line x1="205" y1="78" x2="272" y2="65" stroke="#7c3aed" stroke-width="2.2" marker-end="url(#arrRed)" />
                <line x1="205" y1="135" x2="272" y2="110" stroke="#7c3aed" stroke-width="2.2" marker-end="url(#arrRed)" />
                <line x1="205" y1="135" x2="272" y2="148" stroke="#7c3aed" stroke-width="2.2" marker-end="url(#arrRed)" />
                
                <!-- Start Root Node (A) -->
                <circle cx="45" cy="90" r="18" fill="url(#gBlue)" stroke="#ffffff" stroke-width="2" filter="url(#nodeShadow)" />
                <text x="45" y="95" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">A</text>
                
                <!-- Level 1 Nodes (B, C) -->
                <circle cx="125" cy="58" r="14" fill="url(#gIndigo)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="125" y="63" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">B</text>

                <circle cx="125" cy="122" r="14" fill="url(#gIndigo)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="125" y="127" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">C</text>

                <!-- Level 2 Nodes (D, E, F) -->
                <circle cx="205" cy="38" r="13" fill="url(#gPurple)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="205" y="43" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">D</text>

                <circle cx="205" cy="78" r="13" fill="url(#gPurple)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="205" y="83" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">E</text>

                <circle cx="205" cy="135" r="13" fill="url(#gPurple)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="205" y="140" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">F</text>

                <!-- Level 3 Nodes (G, H, I, J) -->
                <circle cx="285" cy="28" r="12" fill="url(#gBlue)" stroke="#ffffff" stroke-width="1.6" filter="url(#nodeShadow)" />
                <text x="285" y="32" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">G</text>

                <circle cx="285" cy="65" r="12" fill="url(#gBlue)" stroke="#ffffff" stroke-width="1.6" filter="url(#nodeShadow)" />
                <text x="285" y="69" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">H</text>

                <circle cx="285" cy="110" r="12" fill="url(#gBlue)" stroke="#ffffff" stroke-width="1.6" filter="url(#nodeShadow)" />
                <text x="285" y="114" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">I</text>

                <circle cx="285" cy="148" r="12" fill="url(#gBlue)" stroke="#ffffff" stroke-width="1.6" filter="url(#nodeShadow)" />
                <text x="285" y="152" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">J</text>

                <text x="125" y="172" font-size="10" font-weight="800" fill="#2563eb" text-anchor="middle">Level 1</text>
                <text x="205" y="172" font-size="10" font-weight="800" fill="#4f46e5" text-anchor="middle">Level 2</text>
                <text x="285" y="172" font-size="10" font-weight="800" fill="#7c3aed" text-anchor="middle">Level 3</text>
              </svg>
            </div>
            <div class="tvc-footer">Breadth-First Search explained simply.</div>
          </div>
        `;

      case "fifo-queue-engine":
        return `
          <div class="topic-visual-card-hero">
            <div class="tvc-header">
              <span class="tvc-badge blue">03 The FIFO Queue Engine</span>
              <span class="tvc-subtitle">The secret behind BFS.</span>
            </div>
            <div class="tvc-canvas-wrap">
              <svg viewBox="0 0 340 180" class="tvc-svg">
                ${svgDefs}
                <text x="45" y="38" font-size="11" font-weight="800" fill="#2563eb" text-anchor="middle">Enqueue (Node A)</text>
                <path d="M 22 75 L 50 75 L 50 67 L 66 82 L 50 97 L 50 89 L 22 89 Z" fill="url(#gBlue)" />
                
                <text x="295" y="38" font-size="11" font-weight="800" fill="#7c3aed" text-anchor="middle">Dequeue (Node D)</text>
                <path d="M 274 75 L 294 75 L 294 67 L 310 82 L 294 97 L 294 89 L 274 89 Z" fill="url(#gPurple)" />
                
                <!-- Queue Base Slide Container -->
                <rect x="70" y="52" width="200" height="60" rx="8" fill="rgba(255,255,255,0.92)" stroke="rgba(203,213,225,0.8)" stroke-width="2" filter="url(#nodeShadow)" />
                
                <!-- Queue Items with Letters & Order Numbers -->
                <rect x="76" y="58" width="45" height="48" rx="6" fill="url(#gBlue)" stroke="#ffffff" stroke-width="1.5" />
                <text x="98" y="80" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">A</text>
                <text x="98" y="96" font-size="9" font-weight="700" fill="#dbeafe" text-anchor="middle">#5</text>
                
                <rect x="125" y="58" width="45" height="48" rx="6" fill="url(#gIndigo)" stroke="#ffffff" stroke-width="1.5" />
                <text x="147" y="80" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">B</text>
                <text x="147" y="96" font-size="9" font-weight="700" fill="#e0e7ff" text-anchor="middle">#3</text>
                
                <rect x="174" y="58" width="45" height="48" rx="6" fill="url(#gPurple)" stroke="#ffffff" stroke-width="1.5" />
                <text x="196" y="80" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">C</text>
                <text x="196" y="96" font-size="9" font-weight="700" fill="#f3e8ff" text-anchor="middle">#7</text>
                
                <rect x="223" y="58" width="42" height="48" rx="6" fill="url(#gViolet)" stroke="#ffffff" stroke-width="1.5" />
                <text x="244" y="80" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">D</text>
                <text x="244" y="96" font-size="9" font-weight="700" fill="#ede9fe" text-anchor="middle">#2</text>
                
                <text x="98" y="134" font-size="11" font-weight="800" fill="#2563eb" text-anchor="middle">&larr; Front</text>
                <text x="244" y="134" font-size="11" font-weight="800" fill="#7c3aed" text-anchor="middle">Rear &rarr;</text>
              </svg>
            </div>
            <div class="tvc-footer">First In, First Out – The Queue in Action.</div>
          </div>
        `;

      case "level-by-level":
        return `
          <div class="topic-visual-card-hero">
            <div class="tvc-header">
              <span class="tvc-badge blue">04 Level-by-Level Waves</span>
              <span class="tvc-subtitle">BFS spreads like waves.</span>
            </div>
            <div class="tvc-canvas-wrap">
              <svg viewBox="0 0 340 180" class="tvc-svg">
                ${svgDefs}
                <!-- Concentric Ripple Wave Circles in Brand Shades -->
                <circle cx="170" cy="95" r="32" fill="rgba(37, 99, 235, 0.08)" stroke="#3b82f6" stroke-width="1.8" />
                <circle cx="170" cy="95" r="58" fill="rgba(79, 70, 229, 0.06)" stroke="#818cf8" stroke-width="1.8" />
                <circle cx="170" cy="95" r="82" fill="rgba(124, 58, 237, 0.04)" stroke="#a78bfa" stroke-width="1.8" stroke-dasharray="4,4" />
                
                <!-- Center Root Node (A) -->
                <circle cx="170" cy="95" r="16" fill="url(#gBlue)" stroke="#ffffff" stroke-width="2" filter="url(#nodeShadow)" />
                <text x="170" y="100" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">A</text>

                <!-- Wave 1 Nodes (B, C) -->
                <circle cx="138" cy="50" r="14" fill="url(#gIndigo)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="138" y="55" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">B</text>

                <circle cx="106" cy="95" r="14" fill="url(#gIndigo)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="106" y="100" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">C</text>

                <!-- Wave 2 Nodes (D, E) -->
                <circle cx="215" cy="48" r="14" fill="url(#gPurple)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="215" y="53" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">D</text>

                <circle cx="228" cy="120" r="14" fill="url(#gPurple)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="228" y="125" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">E</text>

                <!-- Wave 3 Nodes (F, G, H) -->
                <circle cx="248" cy="30" r="13" fill="url(#gViolet)" stroke="#ffffff" stroke-width="1.6" filter="url(#nodeShadow)" />
                <text x="248" y="34" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">F</text>

                <circle cx="250" cy="85" r="13" fill="url(#gViolet)" stroke="#ffffff" stroke-width="1.6" filter="url(#nodeShadow)" />
                <text x="250" y="89" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">G</text>

                <path d="M 215 48 Q 235 34 248 30" fill="none" stroke="#7c3aed" stroke-dasharray="3,3" stroke-width="1.8" />
              </svg>
            </div>
            <div class="tvc-footer">Discover the beauty of level traversal.</div>
          </div>
        `;

      case "visited-tracking":
        return `
          <div class="topic-visual-card-hero">
            <div class="tvc-header">
              <span class="tvc-badge blue">05 Visited Set &amp; Cycles</span>
              <span class="tvc-subtitle">Avoid repeats. Stay smart.</span>
            </div>
            <div class="tvc-canvas-wrap">
              <svg viewBox="0 0 340 180" class="tvc-svg">
                ${svgDefs}
                <!-- Graph Cycle Edges -->
                <line x1="120" y1="40" x2="60" y2="90" stroke="#3b82f6" stroke-width="2.5" />
                <line x1="120" y1="40" x2="200" y2="90" stroke="#3b82f6" stroke-width="2.5" />
                <line x1="60" y1="90" x2="105" y2="145" stroke="#7c3aed" stroke-dasharray="4,4" stroke-width="2.5" />
                <line x1="200" y1="90" x2="200" y2="145" stroke="#3b82f6" stroke-width="2.5" />
                <line x1="105" y1="145" x2="200" y2="145" stroke="#7c3aed" stroke-dasharray="4,4" stroke-width="2.5" />
                
                <!-- Nodes with Letters A, B, C, D, and E (Repeated Node) -->
                <circle cx="120" cy="40" r="16" fill="url(#gBlue)" stroke="#ffffff" stroke-width="2" filter="url(#nodeShadow)" />
                <text x="120" y="45" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">A</text>

                <circle cx="60" cy="90" r="16" fill="url(#gIndigo)" stroke="#ffffff" stroke-width="2" filter="url(#nodeShadow)" />
                <text x="60" y="95" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">B</text>

                <circle cx="200" cy="90" r="16" fill="url(#gPurple)" stroke="#ffffff" stroke-width="2" filter="url(#nodeShadow)" />
                <text x="200" y="95" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">C</text>

                <circle cx="200" cy="145" r="16" fill="url(#gBlue)" stroke="#ffffff" stroke-width="2" filter="url(#nodeShadow)" />
                <text x="200" y="150" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">D</text>

                <!-- Repeat Node E with dashed cycle indicator -->
                <circle cx="105" cy="145" r="18" fill="none" stroke="#7c3aed" stroke-dasharray="4,4" stroke-width="2.5" />
                <circle cx="105" cy="145" r="15" fill="url(#gViolet)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="105" y="150" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">E (Repeat)</text>

                <!-- Shield Checkmark Icon on Right -->
                <g transform="translate(265, 90)">
                  <path d="M 0 -22 L 20 -15 L 20 5 Q 20 20 0 30 Q -20 20 -20 5 L -20 -15 Z" fill="url(#gBlue)" stroke="#ffffff" stroke-width="2" filter="url(#nodeShadow)" />
                  <polyline points="-8,3 -2,9 10,-5" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                </g>
              </svg>
            </div>
            <div class="tvc-footer">Visited set helps prevent infinite loops.</div>
          </div>
        `;

      case "edge-classification":
        return `
          <div class="topic-visual-card-hero">
            <div class="tvc-header">
              <span class="tvc-badge blue">06 Edge Classification</span>
              <span class="tvc-subtitle">Understand every edge.</span>
            </div>
            <div class="tvc-canvas-wrap">
              <svg viewBox="0 0 340 180" class="tvc-svg">
                ${svgDefs}
                <!-- Tree Edges (Indigo solid) -->
                <line x1="110" y1="35" x2="70" y2="90" stroke="#4f46e5" stroke-width="3" />
                <line x1="110" y1="35" x2="150" y2="90" stroke="#4f46e5" stroke-width="3" />
                <line x1="70" y1="90" x2="40" y2="145" stroke="#4f46e5" stroke-width="3" />
                <line x1="70" y1="90" x2="95" y2="145" stroke="#4f46e5" stroke-width="3" />
                <line x1="150" y1="90" x2="135" y2="145" stroke="#4f46e5" stroke-width="3" />
                <line x1="150" y1="90" x2="185" y2="145" stroke="#4f46e5" stroke-width="3" />
                
                <!-- Back Edge (Violet dashed) -->
                <path d="M 70 90 Q 110 65 110 45" fill="none" stroke="#7c3aed" stroke-dasharray="4,4" stroke-width="2.2" />
                
                <!-- Cross Edge (Blue dashed) -->
                <line x1="70" y1="90" x2="150" y2="90" stroke="#2563eb" stroke-dasharray="4,4" stroke-width="2.2" />
                
                <!-- Forward Edge (Sky Blue dashed) -->
                <path d="M 150 90 Q 175 115 185 145" fill="none" stroke="#3b82f6" stroke-dasharray="4,4" stroke-width="2.2" />
                
                <!-- Nodes with Letters A-G -->
                <circle cx="110" cy="35" r="15" fill="url(#gBlue)" stroke="#ffffff" stroke-width="2" filter="url(#nodeShadow)" />
                <text x="110" y="40" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">A</text>

                <circle cx="70" cy="90" r="14" fill="url(#gIndigo)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="70" y="95" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">B</text>

                <circle cx="150" cy="90" r="14" fill="url(#gIndigo)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="150" y="95" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">C</text>

                <circle cx="40" cy="145" r="13" fill="url(#gPurple)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="40" y="149" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">D</text>

                <circle cx="95" cy="145" r="13" fill="url(#gPurple)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="95" y="149" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">E</text>

                <circle cx="135" cy="145" r="13" fill="url(#gViolet)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="135" y="149" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">F</text>

                <circle cx="185" cy="145" r="13" fill="url(#gViolet)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="185" y="149" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">G</text>

                <!-- Legend Card on Right -->
                <g transform="translate(225, 38)">
                  <rect x="-8" y="-8" width="112" height="98" rx="8" fill="rgba(255,255,255,0.88)" stroke="rgba(203,213,225,0.7)" stroke-width="1.5" />
                  <line x1="4" y1="10" x2="24" y2="10" stroke="#4f46e5" stroke-width="2.5" />
                  <text x="32" y="14" font-size="9" font-weight="800" fill="#4f46e5">Tree Edge</text>
                  <line x1="4" y1="30" x2="24" y2="30" stroke="#7c3aed" stroke-dasharray="3,3" stroke-width="2.5" />
                  <text x="32" y="34" font-size="9" font-weight="800" fill="#7c3aed">Back Edge</text>
                  <line x1="4" y1="50" x2="24" y2="50" stroke="#2563eb" stroke-dasharray="3,3" stroke-width="2.5" />
                  <text x="32" y="54" font-size="9" font-weight="800" fill="#2563eb">Cross Edge</text>
                  <line x1="4" y1="70" x2="24" y2="70" stroke="#3b82f6" stroke-dasharray="3,3" stroke-width="2.5" />
                  <text x="32" y="74" font-size="9" font-weight="800" fill="#3b82f6">Forward Edge</text>
                </g>
              </svg>
            </div>
            <div class="tvc-footer">Tree, Back, Forward &amp; Cross edges.</div>
          </div>
        `;

      case "spanning-tree":
        return `
          <div class="topic-visual-card-hero">
            <div class="tvc-header">
              <span class="tvc-badge blue">07 BFS Spanning Tree</span>
              <span class="tvc-subtitle">Build a tree from BFS.</span>
            </div>
            <div class="tvc-canvas-wrap">
              <svg viewBox="0 0 340 180" class="tvc-svg">
                ${svgDefs}
                <!-- Spanning Tree Branches -->
                <line x1="120" y1="35" x2="70" y2="90" stroke="#4f46e5" stroke-width="3" />
                <line x1="120" y1="35" x2="170" y2="90" stroke="#4f46e5" stroke-width="3" />
                <line x1="70" y1="90" x2="40" y2="145" stroke="#3b82f6" stroke-width="3" />
                <line x1="70" y1="90" x2="100" y2="145" stroke="#3b82f6" stroke-width="3" />
                <line x1="170" y1="90" x2="140" y2="145" stroke="#7c3aed" stroke-width="3" />
                <line x1="170" y1="90" x2="200" y2="145" stroke="#7c3aed" stroke-width="3" />
                
                <!-- Tree Nodes with Letters A-G -->
                <circle cx="120" cy="35" r="16" fill="url(#gBlue)" stroke="#ffffff" stroke-width="2" filter="url(#nodeShadow)" />
                <text x="120" y="40" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">A</text>

                <circle cx="70" cy="90" r="14" fill="url(#gIndigo)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="70" y="95" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">B</text>

                <circle cx="170" cy="90" r="14" fill="url(#gIndigo)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="170" y="95" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">C</text>

                <circle cx="40" cy="145" r="13" fill="url(#gPurple)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="40" y="149" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">D</text>

                <circle cx="100" cy="145" r="13" fill="url(#gPurple)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="100" y="149" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">E</text>

                <circle cx="140" cy="145" r="13" fill="url(#gViolet)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="140" y="149" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">F</text>

                <circle cx="200" cy="145" r="13" fill="url(#gViolet)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="200" y="149" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">G</text>

                <!-- Spanning Tree Visual Graphic on Right in Brand Indigo -->
                <g transform="translate(250, 50)">
                  <polygon points="22,0 7,30 17,30 2,55 12,55 -3,80 47,80 32,55 42,55 27,30 37,30" fill="#4f46e5" opacity="0.85" />
                  <rect x="19" y="80" width="6" height="15" fill="#312e81" />
                  <polygon points="48,15 35,40 43,40 31,62 39,62 25,85 71,85 57,62 65,62 53,40 61,40" fill="#7c3aed" opacity="0.9" />
                  <rect x="45" y="85" width="6" height="12" fill="#312e81" />
                </g>
              </svg>
            </div>
            <div class="tvc-footer">A BFS tree connects all reachable nodes.</div>
          </div>
        `;

      case "shortest-path":
        return `
          <div class="topic-visual-card-hero">
            <div class="tvc-header">
              <span class="tvc-badge blue">08 Shortest Path Guarantee</span>
              <span class="tvc-subtitle">BFS finds the shortest path.</span>
            </div>
            <div class="tvc-canvas-wrap">
              <svg viewBox="0 0 340 180" class="tvc-svg">
                ${svgDefs}
                <!-- Background alternative path edges -->
                <line x1="45" y1="75" x2="85" y2="125" stroke="#cbd5e1" stroke-width="2" opacity="0.8" />
                <line x1="85" y1="125" x2="135" y2="85" stroke="#cbd5e1" stroke-width="2" opacity="0.8" />
                <line x1="135" y1="85" x2="195" y2="135" stroke="#cbd5e1" stroke-width="2" opacity="0.8" />
                
                <!-- Highlighted Optimal Shortest Path in Electric Blue & Indigo -->
                <line x1="45" y1="75" x2="120" y2="45" stroke="#2563eb" stroke-width="3.5" />
                <line x1="120" y1="45" x2="185" y2="85" stroke="#4f46e5" stroke-width="3.5" />
                
                <!-- Shortest Path Nodes: S -> A -> T -->
                <circle cx="45" cy="75" r="16" fill="url(#gBlue)" stroke="#ffffff" stroke-width="2" filter="url(#nodeShadow)" />
                <text x="45" y="80" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">S</text>

                <circle cx="120" cy="45" r="15" fill="url(#gIndigo)" stroke="#ffffff" stroke-width="2" filter="url(#nodeShadow)" />
                <text x="120" y="50" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">A</text>

                <circle cx="85" cy="125" r="13" fill="url(#gPurple)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="85" y="129" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">B</text>

                <circle cx="185" cy="85" r="16" fill="url(#gViolet)" stroke="#ffffff" stroke-width="2" filter="url(#nodeShadow)" />
                <text x="185" y="90" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">T</text>

                <circle cx="195" cy="135" r="13" fill="url(#gIndigo)" stroke="#ffffff" stroke-width="1.8" filter="url(#nodeShadow)" />
                <text x="195" y="139" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">C</text>

                <!-- Achievement Shield Icon on Right -->
                <g transform="translate(255, 38)">
                  <path d="M 8 10 Q -6 10 -6 24 Q -6 38 12 44" fill="none" stroke="#4f46e5" stroke-width="4" stroke-linecap="round" />
                  <path d="M 42 10 Q 56 10 56 24 Q 56 38 38 44" fill="none" stroke="#4f46e5" stroke-width="4" stroke-linecap="round" />
                  <path d="M 5 10 L 45 10 L 40 44 Q 25 54 10 44 Z" fill="url(#gIndigo)" stroke="#3730a3" stroke-width="2" filter="url(#nodeShadow)" />
                  <polygon points="25,18 28,26 36,26 30,31 32,39 25,34 18,39 20,31 14,26 22,26" fill="#ffffff" />
                  <rect x="21" y="52" width="8" height="16" fill="#3730a3" />
                  <rect x="10" y="68" width="30" height="12" rx="3" fill="#1e293b" />
                </g>
              </svg>
            </div>
            <div class="tvc-footer">Shortest path in unweighted graphs.</div>
          </div>
        `;

      case "connected-components":
        return `
          <div class="topic-visual-card-hero">
            <div class="tvc-header">
              <span class="tvc-badge blue">09 Connected Components</span>
              <span class="tvc-subtitle">Find groups in a graph.</span>
            </div>
            <div class="tvc-canvas-wrap">
              <svg viewBox="0 0 340 180" class="tvc-svg">
                ${svgDefs}
                <!-- Cluster 1 (Electric Blue) - Component 1: Nodes A, B, C, D -->
                <path d="M 30 50 Q 80 15 105 60 Q 115 120 70 148 Q 15 140 20 85 Z" fill="rgba(37, 99, 235, 0.08)" stroke="#2563eb" stroke-dasharray="4,4" stroke-width="2" />
                <line x1="42" y1="65" x2="82" y2="60" stroke="#93c5fd" stroke-width="2.2" />
                <line x1="82" y1="60" x2="65" y2="105" stroke="#93c5fd" stroke-width="2.2" />
                <line x1="65" y1="105" x2="42" y2="125" stroke="#93c5fd" stroke-width="2.2" />
                <circle cx="42" cy="65" r="12" fill="url(#gBlue)" stroke="#ffffff" stroke-width="1.8" />
                <text x="42" y="69" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">A</text>
                <circle cx="82" cy="60" r="12" fill="url(#gBlue)" stroke="#ffffff" stroke-width="1.8" />
                <text x="82" y="64" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">B</text>
                <circle cx="65" cy="105" r="12" fill="url(#gBlue)" stroke="#ffffff" stroke-width="1.8" />
                <text x="65" y="109" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">C</text>
                <circle cx="42" cy="125" r="12" fill="url(#gBlue)" stroke="#ffffff" stroke-width="1.8" />
                <text x="42" y="129" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">D</text>
                
                <!-- Cluster 2 (Indigo) - Component 2: Nodes E, F, G, H -->
                <path d="M 135 40 Q 185 15 205 60 Q 215 120 170 145 Q 125 130 130 75 Z" fill="rgba(79, 70, 229, 0.08)" stroke="#4f46e5" stroke-dasharray="4,4" stroke-width="2" />
                <line x1="148" y1="55" x2="188" y2="45" stroke="#c7d2fe" stroke-width="2.2" />
                <line x1="148" y1="55" x2="152" y2="95" stroke="#c7d2fe" stroke-width="2.2" />
                <line x1="188" y1="45" x2="182" y2="105" stroke="#c7d2fe" stroke-width="2.2" />
                <circle cx="148" cy="55" r="12" fill="url(#gIndigo)" stroke="#ffffff" stroke-width="1.8" />
                <text x="148" y="59" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">E</text>
                <circle cx="188" cy="45" r="12" fill="url(#gIndigo)" stroke="#ffffff" stroke-width="1.8" />
                <text x="188" y="49" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">F</text>
                <circle cx="152" cy="95" r="12" fill="url(#gIndigo)" stroke="#ffffff" stroke-width="1.8" />
                <text x="152" y="99" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">G</text>
                <circle cx="182" cy="105" r="12" fill="url(#gIndigo)" stroke="#ffffff" stroke-width="1.8" />
                <text x="182" y="109" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">H</text>

                <!-- Cluster 3 (Violet) - Component 3: Nodes I, J, K -->
                <path d="M 235 60 Q 285 30 310 75 Q 320 130 270 158 Q 220 140 230 90 Z" fill="rgba(124, 58, 237, 0.08)" stroke="#7c3aed" stroke-dasharray="4,4" stroke-width="2" />
                <line x1="248" y1="120" x2="280" y2="70" stroke="#ddd6fe" stroke-width="2.2" />
                <line x1="280" y1="70" x2="295" y2="125" stroke="#ddd6fe" stroke-width="2.2" />
                <circle cx="248" cy="120" r="12" fill="url(#gPurple)" stroke="#ffffff" stroke-width="1.8" />
                <text x="248" y="124" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">I</text>
                <circle cx="280" cy="70" r="12" fill="url(#gPurple)" stroke="#ffffff" stroke-width="1.8" />
                <text x="280" y="74" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">J</text>
                <circle cx="295" cy="125" r="12" fill="url(#gPurple)" stroke="#ffffff" stroke-width="1.8" />
                <text x="295" y="129" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">K</text>
              </svg>
            </div>
            <div class="tvc-footer">Identify all connected components.</div>
          </div>
        `;

      case "bfs-vs-dfs":
        return `
          <div class="topic-visual-card-hero">
            <div class="tvc-header">
              <span class="tvc-badge blue">10 BFS vs DFS Comparison</span>
              <span class="tvc-subtitle">Two strategies. Different journeys.</span>
            </div>
            <div class="tvc-canvas-wrap">
              <svg viewBox="0 0 340 180" class="tvc-svg">
                ${svgDefs}
                <line x1="170" y1="15" x2="170" y2="165" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4,4" />
                <circle cx="170" cy="90" r="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" filter="url(#nodeShadow)" />
                <text x="170" y="94" font-size="10" font-weight="900" fill="#475569" text-anchor="middle">VS</text>

                <!-- BFS Side (Left in Electric Blue & Indigo) -->
                <text x="85" y="28" font-size="14" font-weight="900" fill="#2563eb" text-anchor="middle">BFS (Wide Wave)</text>
                <line x1="85" y1="45" x2="45" y2="90" stroke="#93c5fd" stroke-width="2.5" />
                <line x1="85" y1="45" x2="125" y2="90" stroke="#93c5fd" stroke-width="2.5" />
                <line x1="45" y1="90" x2="25" y2="140" stroke="#93c5fd" stroke-width="2.5" />
                <line x1="45" y1="90" x2="65" y2="140" stroke="#93c5fd" stroke-width="2.5" />
                <line x1="125" y1="90" x2="105" y2="140" stroke="#93c5fd" stroke-width="2.5" />
                <line x1="125" y1="90" x2="145" y2="140" stroke="#93c5fd" stroke-width="2.5" />
                
                <circle cx="85" cy="45" r="13" fill="url(#gBlue)" stroke="#ffffff" stroke-width="1.8" />
                <text x="85" y="49" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">A</text>
                <circle cx="45" cy="90" r="12" fill="url(#gIndigo)" stroke="#ffffff" stroke-width="1.8" />
                <text x="45" y="94" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">B</text>
                <circle cx="125" cy="90" r="12" fill="url(#gIndigo)" stroke="#ffffff" stroke-width="1.8" />
                <text x="125" y="94" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">C</text>
                <circle cx="25" cy="140" r="11" fill="url(#gPurple)" stroke="#ffffff" stroke-width="1.5" />
                <text x="25" y="144" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">D</text>
                <circle cx="65" cy="140" r="11" fill="url(#gPurple)" stroke="#ffffff" stroke-width="1.5" />
                <text x="65" y="144" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">E</text>
                <circle cx="105" cy="140" r="11" fill="url(#gPurple)" stroke="#ffffff" stroke-width="1.5" />
                <text x="105" y="144" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">F</text>
                <circle cx="145" cy="140" r="11" fill="url(#gPurple)" stroke="#ffffff" stroke-width="1.5" />
                <text x="145" y="144" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">G</text>

                <!-- DFS Side (Right in Violet) -->
                <text x="255" y="28" font-size="14" font-weight="900" fill="#7c3aed" text-anchor="middle">DFS (Deep Branch)</text>
                <line x1="255" y1="45" x2="215" y2="90" stroke="#7c3aed" stroke-width="3.5" />
                <line x1="215" y1="90" x2="200" y2="140" stroke="#7c3aed" stroke-width="3.5" />
                <line x1="255" y1="45" x2="295" y2="90" stroke="#e2e8f0" stroke-width="2" />
                <line x1="295" y1="90" x2="280" y2="140" stroke="#e2e8f0" stroke-width="2" />
                <line x1="295" y1="90" x2="315" y2="140" stroke="#e2e8f0" stroke-width="2" />
                
                <circle cx="255" cy="45" r="13" fill="url(#gPurple)" stroke="#ffffff" stroke-width="1.8" />
                <text x="255" y="49" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">A</text>
                <circle cx="215" cy="90" r="12" fill="url(#gPurple)" stroke="#ffffff" stroke-width="1.8" />
                <text x="215" y="94" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">B</text>
                <circle cx="200" cy="140" r="12" fill="url(#gViolet)" stroke="#ffffff" stroke-width="1.8" />
                <text x="200" y="144" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">D</text>
                <circle cx="295" cy="90" r="10" fill="#94a3b8" stroke="#ffffff" stroke-width="1.5" />
                <text x="295" y="93" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">C</text>
                <circle cx="280" cy="140" r="10" fill="#94a3b8" stroke="#ffffff" stroke-width="1.5" />
                <text x="280" y="143" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">E</text>
                <circle cx="315" cy="140" r="10" fill="#94a3b8" stroke="#ffffff" stroke-width="1.5" />
                <text x="315" y="143" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">F</text>
              </svg>
            </div>
            <div class="tvc-footer">BFS: Wide &amp; level-wise | DFS: Deep &amp; focused</div>
          </div>
        `;

      case "complexity-analysis":
        return `
          <div class="topic-visual-card-hero">
            <div class="tvc-header">
              <span class="tvc-badge blue">11 Complexity Analysis</span>
              <span class="tvc-subtitle">Measure the efficiency.</span>
            </div>
            <div class="tvc-canvas-wrap">
              <svg viewBox="0 0 340 180" class="tvc-svg">
                ${svgDefs}
                <!-- Speedometer Arc Gauge in Brand Indigo & Blue -->
                <path d="M 60 120 A 75 75 0 0 1 210 120" fill="none" stroke="#e2e8f0" stroke-width="18" stroke-linecap="round" />
                <path d="M 60 120 A 75 75 0 0 1 105 52" fill="none" stroke="#2563eb" stroke-width="18" />
                <path d="M 105 52 A 75 75 0 0 1 165 45" fill="none" stroke="#4f46e5" stroke-width="18" />
                <path d="M 165 45 A 75 75 0 0 1 210 120" fill="none" stroke="#7c3aed" stroke-width="18" stroke-linecap="round" />
                
                <!-- Needle Dial -->
                <circle cx="135" cy="120" r="12" fill="#0f172a" stroke="#ffffff" stroke-width="2" />
                <line x1="135" y1="120" x2="135" y2="55" stroke="#0f172a" stroke-width="4.5" stroke-linecap="round" />
                <text x="135" y="152" font-size="16" font-weight="900" fill="#2563eb" text-anchor="middle">O(V + E)</text>
                
                <!-- White Legend Badge Box on Right -->
                <g transform="translate(225, 45)">
                  <rect x="0" y="0" width="105" height="85" rx="8" fill="rgba(255,255,255,0.9)" stroke="rgba(203,213,225,0.7)" stroke-width="1.5" filter="url(#nodeShadow)" />
                  <circle cx="18" cy="24" r="10" fill="url(#gBlue)" stroke="#ffffff" stroke-width="1.5" />
                  <text x="18" y="28" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">V</text>
                  <text x="36" y="28" font-size="10" font-weight="800" fill="#1e293b">V = Vertices</text>
                  
                  <circle cx="18" cy="58" r="10" fill="url(#gIndigo)" stroke="#ffffff" stroke-width="1.5" />
                  <text x="18" y="62" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">E</text>
                  <text x="36" y="62" font-size="10" font-weight="800" fill="#1e293b">E = Edges</text>
                </g>
              </svg>
            </div>
            <div class="tvc-footer">BFS runs in O(V + E) time.</div>
          </div>
        `;

      case "real-world-apps":
        return `
          <div class="topic-visual-card-hero">
            <div class="tvc-header">
              <span class="tvc-badge blue">12 Real-World Applications</span>
              <span class="tvc-subtitle">BFS powers real solutions.</span>
            </div>
            <div class="tvc-canvas-wrap">
              <svg viewBox="0 0 340 180" class="tvc-svg">
                ${svgDefs}
                <!-- 4 Frosted White Cards with Nodes and Badges -->
                <!-- 1. Social Networks -->
                <g transform="translate(26, 92)">
                  <rect x="0" y="0" width="68" height="46" rx="8" fill="rgba(255,255,255,0.92)" stroke="#93c5fd" stroke-width="1.8" filter="url(#nodeShadow)" />
                  <circle cx="20" cy="18" r="8" fill="url(#gBlue)" stroke="#ffffff" stroke-width="1" />
                  <text x="20" y="21" font-size="6" font-weight="900" fill="#ffffff" text-anchor="middle">A</text>
                  <line x1="28" y1="18" x2="40" y2="18" stroke="#93c5fd" stroke-width="1.5" />
                  <circle cx="48" cy="18" r="8" fill="url(#gGreen)" stroke="#ffffff" stroke-width="1" />
                  <text x="48" y="21" font-size="6" font-weight="900" fill="#ffffff" text-anchor="middle">B</text>
                  <text x="34" y="38" font-size="7" font-weight="800" fill="#1e40af" text-anchor="middle">Social Graph</text>
                </g>

                <!-- 2. Maps & GPS -->
                <g transform="translate(102, 92)">
                  <rect x="0" y="0" width="68" height="46" rx="8" fill="rgba(255,255,255,0.92)" stroke="#fca5a5" stroke-width="1.8" filter="url(#nodeShadow)" />
                  <circle cx="20" cy="18" r="8" fill="url(#gRose)" stroke="#ffffff" stroke-width="1" />
                  <text x="20" y="21" font-size="6" font-weight="900" fill="#ffffff" text-anchor="middle">S</text>
                  <line x1="28" y1="18" x2="40" y2="18" stroke="#f87171" stroke-width="1.5" stroke-dasharray="2,2" />
                  <circle cx="48" cy="18" r="8" fill="url(#gAmber)" stroke="#ffffff" stroke-width="1" />
                  <text x="48" y="21" font-size="6" font-weight="900" fill="#ffffff" text-anchor="middle">D</text>
                  <text x="34" y="38" font-size="7" font-weight="800" fill="#991b1b" text-anchor="middle">GPS Routes</text>
                </g>

                <!-- 3. Web Crawlers -->
                <g transform="translate(178, 92)">
                  <rect x="0" y="0" width="68" height="46" rx="8" fill="rgba(255,255,255,0.92)" stroke="#fed7aa" stroke-width="1.8" filter="url(#nodeShadow)" />
                  <circle cx="20" cy="18" r="8" fill="url(#gAmber)" stroke="#ffffff" stroke-width="1" />
                  <text x="20" y="21" font-size="6" font-weight="900" fill="#ffffff" text-anchor="middle">URL</text>
                  <line x1="28" y1="18" x2="40" y2="18" stroke="#fb923c" stroke-width="1.5" />
                  <circle cx="48" cy="18" r="8" fill="url(#gCyan)" stroke="#ffffff" stroke-width="1" />
                  <text x="48" y="21" font-size="6" font-weight="900" fill="#ffffff" text-anchor="middle">Link</text>
                  <text x="34" y="38" font-size="7" font-weight="800" fill="#92400e" text-anchor="middle">Web Crawler</text>
                </g>

                <!-- 4. AI & Games -->
                <g transform="translate(254, 92)">
                  <rect x="0" y="0" width="68" height="46" rx="8" fill="rgba(255,255,255,0.92)" stroke="#d8b4fe" stroke-width="1.8" filter="url(#nodeShadow)" />
                  <circle cx="20" cy="18" r="8" fill="url(#gPurple)" stroke="#ffffff" stroke-width="1" />
                  <text x="20" y="21" font-size="6" font-weight="900" fill="#ffffff" text-anchor="middle">AI</text>
                  <line x1="28" y1="18" x2="40" y2="18" stroke="#c084fc" stroke-width="1.5" />
                  <circle cx="48" cy="18" r="8" fill="url(#gGreen)" stroke="#ffffff" stroke-width="1" />
                  <text x="48" y="21" font-size="6" font-weight="900" fill="#ffffff" text-anchor="middle">NPC</text>
                  <text x="34" y="38" font-size="7" font-weight="800" fill="#4c1d95" text-anchor="middle">AI Pathfinding</text>
                </g>
              </svg>
            </div>
            <div class="tvc-footer">From tech to real life – BFS is everywhere!</div>
          </div>
        `;

      default:
        return "";
    }
  }

  /* ─── Visualize / HTML5 Video Player Engine ─────────────────── */

  initVideoPlayer() {
    const v1 = document.getElementById("bfs-video-1");
    const v2 = document.getElementById("bfs-video-2");

    if (!this.videoWatchStats) {
      this.videoWatchStats = {};
    }

    const setupPlayer = (player, key, otherPlayer) => {
      if (!player) return;

      if (!this.videoWatchStats[key]) {
        this.videoWatchStats[key] = {
          maxWatchedTime: 0,
          watchedSeconds: 0,
          lastTime: 0
        };
      }
      const tracker = this.videoWatchStats[key];

      // Disallow fast-forwarding / speeding up
      player.playbackRate = 1.0;
      player.addEventListener("ratechange", () => {
        if (player.playbackRate > 1.0) {
          player.playbackRate = 1.0;
        }
      });

      player.addEventListener("play", () => {
        // Pause other video to prevent audio overlapping
        if (otherPlayer && !otherPlayer.paused) {
          otherPlayer.pause();
        }
        tracker.lastTime = player.currentTime;
      });

      // Backward navigation allowed; forward seeking beyond watched frontier is blocked
      player.addEventListener("seeking", () => {
        if (player.currentTime > tracker.maxWatchedTime + 0.5) {
          player.currentTime = tracker.maxWatchedTime;
          if (typeof this.showToast === "function") {
            this.showToast("Forward seeking is disabled. Please watch until it finishes.");
          }
        }
      });

      player.addEventListener("timeupdate", () => {
        const cur = player.currentTime;
        if (cur > tracker.maxWatchedTime) {
          if (cur - tracker.maxWatchedTime > 1.2) {
            // Forward skip attempt detected
            player.currentTime = tracker.maxWatchedTime;
          } else {
            tracker.maxWatchedTime = cur;
            tracker.watchedSeconds += (cur - tracker.lastTime);
          }
        }
        tracker.lastTime = cur;
      });

      player.addEventListener("ended", () => {
        const duration = player.duration;
        // Verify full playback: video reached the end and watched frontier reached duration
        const isVerifiedFullPlayback = (duration > 0) &&
                                       (tracker.maxWatchedTime >= (duration - 1.5));

        if (isVerifiedFullPlayback) {
          if (!this.completedVideos.has(key)) {
            this.completedVideos.add(key);
            localStorage.setItem("algolearn_completed_videos", JSON.stringify([...this.completedVideos]));
            this.recordPointEvent({
              type: "visualize",
              amount: 8,
              title: `Completed Visualisation Video: ${key === 'intro' ? 'Video 1' : 'Video 2'}`,
              sub: "VIDEO COMPLETED (+8 PTS)"
            });
            this.showToast(`Video Verified & Completed! +8 Points Earned.`);
            if (window.soundManager && typeof window.soundManager.playSuccess === "function") {
              window.soundManager.playSuccess();
            }
            this.updateProgressStats();
            this.updatePointsUI();
          }
        } else {
          console.log(`[Video Watch Tracking] Video "${key}" ended without full continuous watch. Incomplete videos award 0 points.`);
        }
        player.currentTime = 0;
        tracker.lastTime = 0;
      });

      player.addEventListener("error", (e) => {
        console.warn(`[Video Player] Error loading ${key}:`, player.error);
      });
    };

    setupPlayer(v1, "intro", v2);
    setupPlayer(v2, "shortest_path", v1);

    // Pause video if user switches browser tab or window loses visibility
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (v1 && !v1.paused) v1.pause();
        if (v2 && !v2.paused) v2.pause();
      }
    });

    this.updateProgressStats();
  }

  startVideoPlayback() {
    const v1 = document.getElementById("bfs-video-1");
    const v2 = document.getElementById("bfs-video-2");
    if (v1) {
      v1.pause();
      v1.currentTime = 0;
    }
    if (v2) {
      v2.pause();
      v2.currentTime = 0;
    }
  }

  selectVideoLesson(lessonKey, autoPlay = false) {
    const canonicalKey = (lessonKey === "shortest_path" || lessonKey === "video2" || lessonKey === "algorithm")
      ? "shortest_path"
      : "intro";
    this.activeLesson = canonicalKey;
    const isVideo1 = (canonicalKey === "intro");

    const targetCardId = isVideo1 ? "lesson-card-01" : "lesson-card-02";
    const targetVideo = document.getElementById(isVideo1 ? "bfs-video-1" : "bfs-video-2");
    const otherVideo = document.getElementById(isVideo1 ? "bfs-video-2" : "bfs-video-1");

    const targetCard = document.getElementById(targetCardId);
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      targetCard.classList.add("active");
      setTimeout(() => targetCard.classList.remove("active"), 2000);
    }

    if (otherVideo) {
      otherVideo.pause();
      otherVideo.currentTime = 0;
    }

    if (targetVideo) {
      targetVideo.currentTime = 0;
      if (autoPlay) {
        targetVideo.play().catch(e => console.warn("Playback prevented by browser policy:", e));
      }
    }

    // Note: Opening or selecting a video lesson does NOT automatically award marks.
    // Video completion requires verified natural playback from start to end!
    this.updateProgressStats();
    this.playSound("pop");
  }

  playVideo() {
    const video = document.getElementById("bfs-main-video");
    if (!video) return;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        this.isVideoPlaying = true;
        this.syncPlayButtonUI();
      }).catch((err) => {
        console.warn("Video playback was interrupted or blocked:", err);
        this.isVideoPlaying = false;
        this.syncPlayButtonUI();
      });
    }
  }

  toggleVideoPlay() {
    const video = document.getElementById("bfs-main-video");
    if (!video) return;

    if (video.paused) {
      this.playVideo();
    } else {
      video.pause();
      this.isVideoPlaying = false;
      this.syncPlayButtonUI();
    }
    this.playSound("pop");
  }

  syncPlayButtonUI() {
    const icon = document.getElementById("v-play-icon");
    const text = document.getElementById("v-play-text");

    if (icon && text) {
      icon.innerHTML = this.isVideoPlaying
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
      text.textContent = this.isVideoPlaying ? "PAUSE" : "PLAY";
    }
  }

  skipVideo(delta) {
    const video = document.getElementById("bfs-main-video");
    if (!video) return;
    const duration = isFinite(video.duration) ? video.duration : 0;
    video.currentTime = Math.max(0, Math.min(duration, (video.currentTime || 0) + delta));
    this.playSound("pop");
  }

  seekVideo(event) {
    const video = document.getElementById("bfs-main-video");
    const track = document.getElementById("v-progress-track");
    if (!track || !video || !isFinite(video.duration) || video.duration <= 0) return;

    const rect = track.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    video.currentTime = pct * video.duration;
  }

  setVideoSpeed(speed) {
    this.videoSpeed = speed;
    const video = document.getElementById("bfs-main-video");
    if (video) {
      video.playbackRate = speed;
    }
    document.querySelectorAll(".v-speed-pill").forEach(btn => {
      btn.classList.toggle("active", parseFloat(btn.dataset.speed) === speed);
    });
  }

  setVideoVolume(val) {
    this.videoVolume = parseFloat(val);
    const video = document.getElementById("bfs-main-video");
    if (video) {
      video.volume = this.videoVolume;
      video.muted = (this.videoVolume === 0);
    }
  }

  toggleMuteVideo() {
    const video = document.getElementById("bfs-main-video");
    const slider = document.getElementById("v-volume-slider");
    if (!video) return;

    if (video.muted || video.volume === 0) {
      video.muted = false;
      video.volume = this.videoVolume > 0 ? this.videoVolume : 0.8;
      this.videoVolume = video.volume;
    } else {
      video.muted = true;
    }
    if (slider) slider.value = video.muted ? 0 : video.volume;
  }

  toggleVideoFullscreen() {
    const video = document.getElementById("bfs-main-video");
    // Use the card (contains video + controls) as fullscreen target
    const card = document.querySelector(".video-player-main-card");
    const screen = document.getElementById("video-screen-container");
    const target = card || screen || video;
    if (!target) return;

    const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);

    if (!isFull) {
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(() => {
          // Fallback to native video fullscreen on mobile
          if (video && video.webkitEnterFullscreen) video.webkitEnterFullscreen();
        });
      } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen();
      } else if (video && video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      }
    }
  }

  updateVideoDurationUI() {
    const video = document.getElementById("bfs-main-video");
    const timeTotal = document.getElementById("v-time-total");
    if (!video || !timeTotal) return;

    const duration = isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
    const mm = String(Math.floor(duration / 60)).padStart(2, "0");
    const ss = String(Math.floor(duration % 60)).padStart(2, "0");
    timeTotal.textContent = `${mm}:${ss}`;
  }

  updateVideoProgressUI() {
    const video = document.getElementById("bfs-main-video");
    const timeCurr = document.getElementById("v-time-current");
    const fill = document.getElementById("v-progress-fill");
    const thumb = document.getElementById("v-progress-thumb");

    if (!video) return;
    const current = video.currentTime || 0;
    const duration = (isFinite(video.duration) && video.duration > 0) ? video.duration : 1;

    const mm = String(Math.floor(current / 60)).padStart(2, "0");
    const ss = String(Math.floor(current % 60)).padStart(2, "0");
    if (timeCurr) timeCurr.textContent = `${mm}:${ss}`;

    const pct = Math.min(100, Math.max(0, (current / duration) * 100));
    if (fill) fill.style.width = `${pct}%`;
    if (thumb) thumb.style.left = `${pct}%`;
  }

  /* ─── Progress Section ──────────────────────────────────────── */

  updateProgressStats() {
    // 1. Get complete scoring and progress metrics
    const summary = typeof this.getPointsSummary === "function"
      ? this.getPointsSummary()
      : {
          visualScore: 0, videoCount: 0, visualMax: 16,
          gameScore: 0, gameLevelsCleared: 0, gameTotalPenalties: 0, gameMax: 64,
          quizRawScore: 0, quizCorrect: 0, quizIncorrect: 0, quizUnanswered: 10, quizAnsweredCount: 0, quizPenalties: 0, quizMax: 20,
          totalPositiveMarks: 0, totalPenalties: 0, finalScore: 0, maxAvailable: 100
        };

    const maxScore = summary.maxAvailable || 100;

    const completedLevels = (window.game && window.game.completedLevels)
      ? window.game.completedLevels
      : new Set(JSON.parse(localStorage.getItem("algolearn_completed_levels") || "[]"));

    // 2. Auto-sync curriculum modules (FN-01 to FN-10) based on accomplishments
    if (this.completedChapters.has("graph-foundations")) this.completedActivities.add("FN-01");
    if (this.completedChapters.has("what-is-bfs")) this.completedActivities.add("FN-02");
    if (completedLevels.has(1)) this.completedActivities.add("FN-03");
    if (completedLevels.has(2) || completedLevels.has(3)) this.completedActivities.add("FN-04");
    if (completedLevels.has(4) || this.completedChapters.has("edge-classification")) this.completedActivities.add("FN-05");
    if (completedLevels.has(5) || this.completedChapters.has("spanning-tree")) this.completedActivities.add("FN-06");
    if (this.completedChapters.has("shortest-path") || this.completedVideos.has("shortest_path") || this.completedVideos.has("collision")) this.completedActivities.add("FN-07");
    if (this.completedChapters.has("connected-components") || completedLevels.has(6)) this.completedActivities.add("FN-08");
    if (this.completedChapters.has("complexity-analysis") || completedLevels.has(8) || completedLevels.has(9)) this.completedActivities.add("FN-09");
    if (summary.quizAnsweredCount >= 10 || localStorage.getItem("algolearn_quiz_completed") === "true") this.completedActivities.add("FN-10");

    // 3. Calculate Activity Units for remaining dashboard modules: 2 Videos + 8 Game Levels + 10 Quiz Questions = 20 total
    const videoDone = this.completedVideos ? this.completedVideos.size : 0;
    const gameDone = summary.gameLevelsCleared;
    const quizDone = summary.quizAnsweredCount;
    const totalActivities = 20;
    const completedCount = Math.min(totalActivities, videoDone + gameDone + quizDone);
    const overallPct = Math.min(100, Math.round((completedCount / totalActivities) * 100));

    // 4. Update PANEL A: BFS Learning Progress
    const badgeCountEl = document.getElementById("prog-badge-count");
    const overallBarEl = document.getElementById("prog-overall-bar");
    const overallPctEl = document.getElementById("prog-overall-pct");

    if (badgeCountEl) badgeCountEl.textContent = `${completedCount} of ${totalActivities} Activities`;
    if (overallBarEl) overallBarEl.style.width = `${overallPct}%`;
    if (overallPctEl) overallPctEl.textContent = `${overallPct}%`;

    // Backward compatibility for legacy elements if present
    const legacyCountEl = document.getElementById("prog-overall-count");
    if (legacyCountEl) legacyCountEl.textContent = `(${completedCount} of ${totalActivities} Activities)`;

    // 5. Update PANEL B: BFS Topic Score
    const totalScoreEl = document.getElementById("prog-total-score-val");
    if (totalScoreEl) totalScoreEl.textContent = `${summary.finalScore} / ${maxScore}`;

    // Note: Learn card is completely removed from the BFS Topic Score Dashboard.

    // Card 1: Visualize (16 points total, 2 videos × 8 pts)
    const scoreVisualEl = document.getElementById("prog-score-visual");
    const fillVisualEl = document.getElementById("prog-fill-visual");
    const pctVisualEl = document.getElementById("prog-pct-visual");
    const subVisualEl = document.getElementById("prog-sub-visual");
    const visualMax = summary.visualMax || 16;
    const visualPct = Math.min(100, Math.round((summary.visualScore / visualMax) * 100));

    if (scoreVisualEl) scoreVisualEl.textContent = `${summary.visualScore} / ${visualMax}`;
    if (fillVisualEl) fillVisualEl.style.width = `${visualPct}%`;
    if (pctVisualEl) pctVisualEl.textContent = `${visualPct}%`;
    if (subVisualEl) subVisualEl.textContent = `${summary.videoCount} / 2 videos completed • 8 pts each`;

    // Card 2: Game (64 points total, 8 games × 8 pts)
    const scoreGameEl = document.getElementById("prog-score-game");
    const fillGameEl = document.getElementById("prog-fill-game");
    const pctGameEl = document.getElementById("prog-pct-game");
    const subGameEl = document.getElementById("prog-sub-game");
    const gameMax = summary.gameMax || 64;
    const gamePct = Math.min(100, Math.max(0, Math.round((summary.gameScore / gameMax) * 100)));

    if (scoreGameEl) scoreGameEl.textContent = `${summary.gameScore} / ${gameMax}`;
    if (fillGameEl) fillGameEl.style.width = `${gamePct}%`;
    if (pctGameEl) pctGameEl.textContent = `${gamePct}%`;
    if (subGameEl) {
      const penText = summary.gameTotalPenalties > 0 ? ` (-${summary.gameTotalPenalties} penalty)` : "";
      subGameEl.textContent = `${summary.gameLevelsCleared} / 8 levels cleared • 8 pts each${penText}`;
    }

    // Card 3: Quiz (20 points total, 10 questions × 2 pts, -1 wrong, 0 timeout)
    const scoreQuizEl = document.getElementById("prog-score-quiz");
    const fillQuizEl = document.getElementById("prog-fill-quiz");
    const pctQuizEl = document.getElementById("prog-pct-quiz");
    const subQuizEl = document.getElementById("prog-sub-quiz");
    const quizMax = summary.quizMax || 20;
    const quizPct = Math.min(100, Math.max(0, Math.round((summary.quizRawScore / quizMax) * 100)));

    if (scoreQuizEl) scoreQuizEl.textContent = `${summary.quizRawScore} / ${quizMax}`;
    if (fillQuizEl) fillQuizEl.style.width = `${quizPct}%`;
    if (pctQuizEl) pctQuizEl.textContent = `${quizPct}%`;
    if (subQuizEl) {
      subQuizEl.textContent = `${summary.quizCorrect} correct (+2), ${summary.quizIncorrect} wrong (-1), ${summary.quizUnanswered} unanswered`;
    }

    // Breakdown Bar
    const bbPosEl = document.getElementById("prog-bb-pos");
    const bbGamePenEl = document.getElementById("prog-bb-game-pen");
    const bbQuizPenEl = document.getElementById("prog-bb-quiz-pen");
    const bbFinalEl = document.getElementById("prog-bb-final");

    if (bbPosEl) bbPosEl.textContent = `+${summary.totalPositiveMarks} pts`;
    if (bbGamePenEl) bbGamePenEl.textContent = `-${summary.gameTotalPenalties} pts`;
    if (bbQuizPenEl) bbQuizPenEl.textContent = `-${summary.quizPenalties} pts`;
    if (bbFinalEl) bbFinalEl.textContent = `${summary.finalScore} / ${maxScore}`;

    // 6. Update Sidebar Navigation Badges ("Dash Bar")
    const badgeOverview = document.getElementById("nav-badge-overview");
    const badgeLearn = document.getElementById("nav-badge-learn");
    const badgeVisualize = document.getElementById("nav-badge-visualize");
    const badgeGame = document.getElementById("nav-badge-game");
    const badgeQuiz = document.getElementById("nav-badge-quiz");
    const badgeProgress = document.getElementById("nav-badge-progress");

    if (badgeOverview) badgeOverview.textContent = "Overview";
    if (badgeLearn) badgeLearn.textContent = `${this.completedChapters.size} / 12`;
    if (badgeVisualize) badgeVisualize.textContent = `${this.completedVideos.size} / 2`;
    if (badgeGame) badgeGame.textContent = `${summary.gameLevelsCleared} / 8`;
    if (badgeQuiz) badgeQuiz.textContent = `${summary.quizAnsweredCount} / 10`;
    if (badgeProgress) badgeProgress.textContent = `${overallPct}%`;

    const vPill = document.getElementById("v-completed-counter-pill");
    if (vPill) vPill.textContent = `${this.completedVideos.size} / 2 Completed`;

    // 7. Synchronize legacy points UI if present
    if (typeof this.updatePointsUI === "function") {
      this.updatePointsUI();
    }
  }

  filterProgressModules(category) {
    this.activeFilter = category;
    document.querySelectorAll(".prog-filter-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.filter === category);
    });
    this.renderProgressModules();
    this.playSound("pop");
  }

  renderProgressModules() {
    const mount = document.getElementById("prog-modules-list");
    const countEl = document.getElementById("prog-showing-count");
    if (!mount) return;

    const filtered = this.activeFilter === "all"
      ? this.modulesData
      : this.modulesData.filter(m => m.category === this.activeFilter);

    const completedModCount = this.modulesData.filter(m => this.completedActivities.has(m.id)).length;
    if (countEl) {
      countEl.textContent = `Showing ${filtered.length} of ${this.modulesData.length} modules (${completedModCount} / ${this.modulesData.length} Completed)`;
    }

    mount.innerHTML = filtered.map(m => {
      const isDone = this.completedActivities.has(m.id);
      const progressPct = isDone ? 100 : (this.completedChapters.has(m.chapterTarget) ? 60 : 0);
      const statusText = isDone ? "Completed" : (progressPct > 0 ? "In Progress" : "Not Started");

      return `
        <div class="prog-module-card" id="module-card-${m.id}">
          <div class="pm-header-row">
            <div class="pm-badges-left">
              <span class="pm-code-badge">${m.code}</span>
              <span class="pm-cat-badge ${m.category}">${m.categoryLabel}</span>
            </div>
            <span class="pm-status-pill ${isDone ? 'done' : ''}">
              ${isDone ? '✓ Completed' : '○ ' + statusText}
            </span>
          </div>

          <h3 class="pm-title">${m.title}</h3>
          <p class="pm-desc">${m.desc}</p>
          <div class="pm-criteria-box">${m.criteria}</div>

          <div class="pm-footer-row">
            <div class="pm-progress-wrap">
              <span>Progress</span>
              <div class="pm-mini-bar">
                <div class="pm-mini-bar-fill" style="width: ${progressPct}%;"></div>
              </div>
              <span style="font-weight:700">${progressPct}%</span>
            </div>

            <button class="pm-action-btn" onclick="app.startModule('${m.id}')">
              ${isDone ? 'Review Module &rarr;' : 'Start Module &rarr;'}
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  startModule(moduleId) {
    const mod = this.modulesData.find(m => m.id === moduleId);
    if (!mod) return;

    this.completedActivities.add(moduleId);
    localStorage.setItem("algolearn_completed_activities", JSON.stringify([...this.completedActivities]));
    this.updateProgressStats();

    if (mod.tabTarget === "theory" && mod.chapterTarget) {
      this.switchTab("theory");
      this.selectChapter(mod.chapterTarget);
    } else if (mod.tabTarget === "quiz") {
      this.switchTab("quiz");
    } else {
      this.switchTab("game");
    }
  }

  continueNextRecommended() {
    this.switchTab("theory");
    this.selectChapter("graph-foundations");
  }

  /* ─── Reset Progress Confirmation Alert (Image 2) ────────────── */

  openResetModal() {
    const modal = document.getElementById("reset-progress-modal");
    if (modal) {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      this.playSound("pop");
    }
  }

  closeResetModal() {
    const modal = document.getElementById("reset-progress-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  }

  confirmResetProgress() {
    this.closeResetModal();
    this.resetAllProgress();
  }

  /* ─── Central Scoring & Points System (100 Marks with Negative Marking) ─── */

  recordPointEvent(item) {
    if (!item) return;
    const eventObj = {
      id: item.id || (item.type + "-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4)),
      type: item.type || "points",
      level: item.level,
      amount: item.amount || 0,
      title: item.title || "Points Activity",
      sub: item.sub || "ACTIVITY",
      timeText: "Just now",
      timestamp: Date.now()
    };
    if (!this.pointsHistory) this.pointsHistory = [];
    this.pointsHistory.unshift(eventObj);
    this.savePointsData();
  }

  initPointsSystem() {
    this.gameAssistance = JSON.parse(localStorage.getItem("algolearn_game_assistance") || "{}");
    const stored = localStorage.getItem("algolearn_points_history");
    if (!stored) {
      this.penaltyHintsCount = 0;
      this.penaltyGuidedCount = 0;
      this.seedGameBonus = 0;
      this.pointsHistory = [];
      this.savePointsData();
    } else {
      try {
        const parsed = JSON.parse(stored);
        this.pointsHistory = Array.isArray(parsed.history) ? parsed.history : [];
        this.penaltyHintsCount = typeof parsed.penaltyHintsCount === "number" ? parsed.penaltyHintsCount : 0;
        this.penaltyGuidedCount = typeof parsed.penaltyGuidedCount === "number" ? parsed.penaltyGuidedCount : 0;
        this.seedGameBonus = typeof parsed.seedGameBonus === "number" ? parsed.seedGameBonus : 0;
      } catch (e) {
        this.pointsHistory = [];
        this.penaltyHintsCount = 0;
        this.penaltyGuidedCount = 0;
        this.seedGameBonus = 0;
      }
    }
  }

  savePointsData() {
    try {
      localStorage.setItem("algolearn_points_history", JSON.stringify({
        history: this.pointsHistory,
        penaltyHintsCount: this.penaltyHintsCount,
        penaltyGuidedCount: this.penaltyGuidedCount,
        seedGameBonus: typeof this.seedGameBonus === "number" ? this.seedGameBonus : 0
      }));
    } catch (e) {
      console.warn("Could not save points data", e);
    }
  }

  getPointsSummary() {
    // 1. VISUALISATION SECTION — 16 Points (2 videos × 8 pts)
    const videoCount = this.completedVideos ? this.completedVideos.size : 0;
    const visualMax = (BFS_SCORING.visualisation && BFS_SCORING.visualisation.total) || 16;
    const marksPerVideo = (BFS_SCORING.visualisation && BFS_SCORING.visualisation.marksPerVideo) || 8;
    const visualScore = Math.min(visualMax, videoCount * marksPerVideo);

    // 2. GAME SECTION — 64 Points Before Penalties (8 games × 8 pts)
    const completedLevels = (window.game && window.game.completedLevels)
      ? window.game.completedLevels
      : new Set(JSON.parse(localStorage.getItem("algolearn_completed_levels") || "[]"));

    let gamePositiveMarks = 0;
    let gameTotalPenalties = 0;
    let gameLevelsCleared = 0;
    let totalHintsUsed = 0;
    let totalGuidedUsed = 0;

    for (let slot = 1; slot <= 8; slot++) {
      const slotMarks = LEVEL_MARKS[slot] || 8;

      // Determine if completed
      let isDone = false;
      if (slot === 1 && completedLevels.has(1)) isDone = true;
      else if (slot === 2 && completedLevels.has(2)) isDone = true;
      else if (slot === 3 && completedLevels.has(3)) isDone = true;
      else if (slot === 4 && completedLevels.has(4)) isDone = true;
      else if (slot === 5 && completedLevels.has(5)) isDone = true;
      else if (slot === 6 && (completedLevels.has(6) || completedLevels.has(7))) isDone = true;
      else if (slot === 7 && completedLevels.has(8)) isDone = true;
      else if (slot === 8 && completedLevels.has(9)) isDone = true;
      if (completedLevels.has(slot)) isDone = true;

      if (isDone) gameLevelsCleared++;

      const positive = isDone ? slotMarks : 0;
      gamePositiveMarks += positive;

      // Assistance tracking per level
      const ast = (this.gameAssistance && this.gameAssistance[slot]) ? this.gameAssistance[slot] : {};
      const hintCount = typeof ast.hintCount === "number" ? ast.hintCount : (ast.hintUsed ? 1 : 0);
      const guidedCount = typeof ast.guidedCount === "number" ? ast.guidedCount : (ast.guidedUsed ? 1 : 0);

      totalHintsUsed += hintCount;
      totalGuidedUsed += guidedCount;

      const hintPenalty = hintCount * ((BFS_SCORING.game && BFS_SCORING.game.penalties && BFS_SCORING.game.penalties.hint) || 3);
      const guidedPenalty = guidedCount * ((BFS_SCORING.game && BFS_SCORING.game.penalties && BFS_SCORING.game.penalties.guidedSolve) || 3);
      const levelPenalties = hintPenalty + guidedPenalty;
      gameTotalPenalties += levelPenalties;
    }

    const gameMax = (BFS_SCORING.game && BFS_SCORING.game.total) || 64;
    const gameScore = gamePositiveMarks - gameTotalPenalties;

    this.penaltyHintsCount = totalHintsUsed;
    this.penaltyGuidedCount = totalGuidedUsed;

    // 3. QUIZ SECTION — 20 Points (10 questions × 2 pts, -1 wrong, 0 timeout)
    let quizCorrect = 0;
    let quizIncorrect = 0;
    let quizTimedOut = 0;
    const quizAnswers = (window.quizEngine && window.quizEngine.userAnswers)
      ? window.quizEngine.userAnswers
      : JSON.parse(localStorage.getItem("algolearn_quiz_answers") || "{}");

    Object.values(quizAnswers).forEach(ans => {
      if (!ans) return;
      if (ans.timedOut) {
        quizTimedOut++;
      } else if (ans.isCorrect === true) {
        quizCorrect++;
      } else if (ans.isCorrect === false) {
        quizIncorrect++;
      }
    });

    const quizAnsweredCount = quizCorrect + quizIncorrect + quizTimedOut;
    const quizUnanswered = Math.max(0, 10 - quizAnsweredCount);
    const quizMax = (BFS_SCORING.quiz && BFS_SCORING.quiz.totalPositiveMarks) || 20;
    const marksPerCorrect = (BFS_SCORING.quiz && BFS_SCORING.quiz.marksPerCorrectAnswer) || 2;
    const penaltyPerIncorrect = (BFS_SCORING.quiz && BFS_SCORING.quiz.penaltyPerIncorrectAnswer) || 1;
    const quizPositiveMarks = Math.min(quizMax, quizCorrect * marksPerCorrect);
    const quizPenalties = quizIncorrect * penaltyPerIncorrect;
    const quizRawScore = Math.max(0, Math.min(quizMax, quizPositiveMarks - quizPenalties));

    // 4. CENTRAL OVERALL CALCULATION: Total dynamically derived from remaining modules (16 + 64 + 20 = 100)
    const maxAvailable = visualMax + gameMax + quizMax;
    const baseScore = typeof this.seedGameBonus === "number" ? this.seedGameBonus : 0;
    const totalPositiveMarks = baseScore + visualScore + gamePositiveMarks + quizPositiveMarks;
    const totalPenalties = gameTotalPenalties + quizPenalties;
    const rawCalculatedScore = totalPositiveMarks - totalPenalties;
    const finalScore = Math.min(maxAvailable, rawCalculatedScore);

    const learnTopicsCompleted = this.completedChapters ? this.completedChapters.size : 0;

    return {
      learnScore: 0,
      learnTopicsCompleted,
      learnMax: 0,

      visualScore,
      videoCount,
      visualMax,

      gamePositiveMarks,
      gameTotalPenalties,
      gameScore,
      gameLevelsCleared,
      gameMax,
      penaltyHintsCount: totalHintsUsed,
      penaltyGuidedCount: totalGuidedUsed,

      quizCorrect,
      quizIncorrect,
      quizTimedOut,
      quizUnanswered,
      quizAnsweredCount,
      quizRawScore,
      quizPositiveMarks,
      quizPenalties,
      quizMax,

      totalPositiveMarks,
      totalPenalties,
      finalScore,
      maxAvailable
    };
  }

  updatePointsUI() {
    const summary = this.getPointsSummary();
    const maxScore = summary.maxAvailable || 100;

    // 1. Sidebar Nav Badge Pill ("Dash Bar")
    const badgePoints = document.getElementById("nav-badge-points");
    if (badgePoints) {
      badgePoints.textContent = `${summary.finalScore} / ${maxScore}`;
    }

    // 2. Hero Card Total Points
    const heroNum = document.getElementById("pts-hero-num");
    if (heroNum) {
      heroNum.textContent = String(summary.finalScore);
    }
    const heroSub = document.getElementById("pts-hero-sub");
    if (heroSub) {
      heroSub.textContent = `BFS Final Score: ${summary.finalScore} / ${maxScore} Points`;
    }

    // 3. Points Breakdown Card & Subtitles (if present)
    const valTheory = document.getElementById("pts-val-theory");
    if (valTheory) valTheory.textContent = `${summary.learnTopicsCompleted}`;
    const subTheory = document.getElementById("pts-sub-theory");
    if (subTheory) subTheory.textContent = `${summary.learnTopicsCompleted}/12 topics completed`;

    const valVisualize = document.getElementById("pts-val-visualize");
    if (valVisualize) valVisualize.textContent = `+${summary.visualScore}`;
    const subVisualize = document.getElementById("pts-sub-visualize");
    if (subVisualize) subVisualize.textContent = `${summary.visualScore}/${summary.visualMax} pts \u2022 ${summary.videoCount}/2 videos completed • 8 pts each`;

    const valGames = document.getElementById("pts-val-games");
    if (valGames) valGames.textContent = `${summary.gameScore >= 0 ? '+' : ''}${summary.gameScore}`;
    const subGames = document.getElementById("pts-sub-games");
    if (subGames) subGames.textContent = `${summary.gameScore}/${summary.gameMax} pts after penalties \u2022 ${summary.gameLevelsCleared}/8 levels cleared • 8 pts each`;

    const valQuiz = document.getElementById("pts-val-quiz");
    if (valQuiz) valQuiz.textContent = `${summary.quizRawScore >= 0 ? '+' : ''}${summary.quizRawScore}`;
    const subQuiz = document.getElementById("pts-sub-quiz");
    if (subQuiz) subQuiz.textContent = `${summary.quizRawScore}/${summary.quizMax} pts \u2022 ${summary.quizCorrect} correct (+2), ${summary.quizIncorrect} incorrect (-1)`;

    const valPenalties = document.getElementById("pts-val-penalties");
    if (valPenalties) valPenalties.textContent = `-${summary.totalPenalties}`;
    const subPenalties = document.getElementById("pts-sub-penalties");
    if (subPenalties) subPenalties.textContent = `Game penalties: -${summary.gameTotalPenalties} (Hints: -${summary.penaltyHintsCount * 3}, Guided: -${summary.penaltyGuidedCount * 3}) \u2022 Quiz penalties: -${summary.quizPenalties}`;

    const valPositive = document.getElementById("pts-val-positive");
    if (valPositive) valPositive.textContent = `+${summary.totalPositiveMarks} / ${maxScore}`;

    const valTotal = document.getElementById("pts-val-total");
    if (valTotal) valTotal.textContent = `${summary.finalScore} / ${maxScore}`;

    // 4. Live Game Scoreboard Sync
    this.updateGameScoreboard();

    // 5. Recent Activity
    this.renderPointsActivityList();
  }

  renderPointsActivityList() {
    const countEl = document.getElementById("pac-events-count");
    const listEl = document.getElementById("pac-activity-list");
    if (!listEl) return;

    const events = this.pointsHistory || [];
    if (countEl) {
      countEl.textContent = `${events.length} events`;
    }

    if (events.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding: 24px; color: var(--text-muted); font-size: 0.88rem;">
          No points activity recorded yet. Watch videos, solve game levels, or take quizzes to earn marks!
        </div>
      `;
      return;
    }

    listEl.innerHTML = events.map(item => {
      const isNeg = item.amount < 0;
      const badgeClass = isNeg ? "pac-badge-neg" : "pac-badge-pos";
      const displayAmount = isNeg ? String(item.amount) : `+${item.amount}`;
      const timeStr = this.formatRelativeTime(item.timestamp, item.timeText);

      return `
        <div class="pac-item">
          <div class="pac-item-left">
            <span class="pac-badge ${badgeClass}">${displayAmount}</span>
            <div class="pac-item-info">
              <span class="pac-item-title">${item.title}</span>
              <span class="pac-item-sub">${item.sub}</span>
            </div>
          </div>
          <span class="pac-item-time">${timeStr}</span>
        </div>
      `;
    }).join("");
  }

  formatRelativeTime(timestamp, fallback) {
    if (!timestamp) return fallback || "Just now";
    const diffMs = Date.now() - timestamp;
    if (diffMs < 0) return fallback || "Just now";
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}d ago`;
  }

  recordHintPenalty(levelNum = 1) {
    const slot = getCanonicalLevelSlot(levelNum);
    if (!this.gameAssistance) this.gameAssistance = {};
    if (!this.gameAssistance[slot]) {
      this.gameAssistance[slot] = { hintCount: 0, guidedCount: 0, hintUsed: false, guidedUsed: false };
    }

    const deductionAmount = (BFS_SCORING.game && BFS_SCORING.game.penalties && BFS_SCORING.game.penalties.hint) || 3;
    const currentScore = this.getPointsSummary().finalScore;

    this.gameAssistance[slot].hintCount = (this.gameAssistance[slot].hintCount || 0) + 1;
    this.gameAssistance[slot].hintUsed = true;
    localStorage.setItem("algolearn_game_assistance", JSON.stringify(this.gameAssistance));

    const newEvent = {
      id: "hint-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      type: "hint",
      level: slot,
      amount: -deductionAmount,
      title: `Used Hint: Level ${slot}`,
      sub: `HINT USED (-${deductionAmount} MARKS)`,
      timeText: "Just now",
      timestamp: Date.now()
    };
    if (!this.pointsHistory) this.pointsHistory = [];
    this.pointsHistory.unshift(newEvent);
    this.savePointsData();

    if (window.game) {
      window.game.score = currentScore - deductionAmount;
      if (typeof window.game.updateStatsUI === "function") {
        window.game.updateStatsUI();
      }
    }

    this.updatePointsUI();
    this.updateProgressStats();
    this.updateGameScoreboard();

    this.showDeductionNotification(-deductionAmount, "Hint Used");
    return true;
  }

  recordGuidedPenalty(levelNum = 1) {
    const slot = getCanonicalLevelSlot(levelNum);
    if (!this.gameAssistance) this.gameAssistance = {};
    if (!this.gameAssistance[slot]) {
      this.gameAssistance[slot] = { hintCount: 0, guidedCount: 0, hintUsed: false, guidedUsed: false };
    }

    const deductionAmount = (BFS_SCORING.game && BFS_SCORING.game.penalties && BFS_SCORING.game.penalties.guidedSolve) || 3;
    const currentScore = this.getPointsSummary().finalScore;

    this.gameAssistance[slot].guidedCount = (this.gameAssistance[slot].guidedCount || 0) + 1;
    this.gameAssistance[slot].guidedUsed = true;
    localStorage.setItem("algolearn_game_assistance", JSON.stringify(this.gameAssistance));

    const newEvent = {
      id: "guided-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      type: "guided",
      level: slot,
      amount: -deductionAmount,
      title: `Used Guided Solve: Level ${slot}`,
      sub: `GUIDED SOLVE (-${deductionAmount} MARKS)`,
      timeText: "Just now",
      timestamp: Date.now()
    };
    if (!this.pointsHistory) this.pointsHistory = [];
    this.pointsHistory.unshift(newEvent);
    this.savePointsData();

    if (window.game) {
      window.game.score = currentScore - deductionAmount;
      if (typeof window.game.updateStatsUI === "function") {
        window.game.updateStatsUI();
      }
    }

    this.updatePointsUI();
    this.updateProgressStats();
    this.updateGameScoreboard();

    this.showDeductionNotification(-deductionAmount, "Guided Solve Used");
    return true;
  }

  updateGameScoreboard() {
    const summary = this.getPointsSummary();

    const liveScoreVal = document.getElementById("game-live-score-val");
    if (liveScoreVal) {
      liveScoreVal.textContent = String(summary.finalScore);
    }

    const scoreValue = document.getElementById("score-value");
    if (scoreValue) {
      scoreValue.textContent = String(summary.finalScore);
    }

    if (window.game) {
      window.game.score = summary.finalScore;
    }

    const lvlSlot = (window.game && window.game.currentLevelIndex !== undefined)
      ? getCanonicalLevelSlot(window.game.currentLevelIndex + 1)
      : 1;
    const slotMarks = (typeof LEVEL_MARKS !== "undefined" && LEVEL_MARKS[lvlSlot]) || 8;
    const ast = (this.gameAssistance && this.gameAssistance[lvlSlot]) ? this.gameAssistance[lvlSlot] : {};
    const hCount = typeof ast.hintCount === "number" ? ast.hintCount : (ast.hintUsed ? 1 : 0);
    const gCount = typeof ast.guidedCount === "number" ? ast.guidedCount : (ast.guidedUsed ? 1 : 0);
    const hPen = (BFS_SCORING.game && BFS_SCORING.game.penalties && BFS_SCORING.game.penalties.hint) || 3;
    const gPen = (BFS_SCORING.game && BFS_SCORING.game.penalties && BFS_SCORING.game.penalties.guidedSolve) || 3;
    const lvlPenalties = (hCount * hPen) + (gCount * gPen);
    const netMarks = slotMarks - lvlPenalties;

    const activeProbPts = document.getElementById("active-problem-pts");
    if (activeProbPts) {
      activeProbPts.textContent = `${netMarks >= 0 ? '+' : ''}${netMarks} pts`;
      activeProbPts.title = `Level Base: +${slotMarks} pts | Deductions: -${lvlPenalties} pts`;
    }
  }

  showDeductionNotification(amount, reason, isInsufficient = false) {
    let container = document.getElementById("deduction-notification-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "deduction-notification-container";
      document.body.appendChild(container);
    }

    // Limit maximum stacked notification pills to 3 so screen is never overwhelmed
    while (container.children.length >= 3) {
      const oldest = container.children[0] || container.firstElementChild;
      if (oldest) {
        if (oldest._dismissTimer) clearTimeout(oldest._dismissTimer);
        if (oldest.parentNode) oldest.parentNode.removeChild(oldest);
        else container.removeChild(oldest);
      } else {
        break;
      }
    }

    const id = "dnotif-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);
    const pill = document.createElement("div");
    pill.id = id;
    pill.className = "deduction-notification-pill";
    pill.setAttribute("role", "alert");
    pill.setAttribute("aria-live", "assertive");

    const amountDisplay = isInsufficient
      ? "0 Points"
      : (amount < 0 ? `${amount} Points` : `-${amount} Points`);

    pill.innerHTML = `
      <div class="deduction-notif-icon-box" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#e11d48" stroke-width="2.5"></circle>
          <line x1="12" y1="8" x2="12" y2="12" stroke="#e11d48" stroke-width="2.5" stroke-linecap="round"></line>
          <circle cx="12" cy="16" r="1.25" fill="#e11d48"></circle>
        </svg>
      </div>
      <span class="deduction-notif-amount">${amountDisplay}</span>
      <span class="deduction-notif-sep" aria-hidden="true">—</span>
      <span class="deduction-notif-reason">${reason}</span>
      <button class="deduction-notif-close-btn" aria-label="Close notification" type="button">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    const closeBtn = pill.querySelector(".deduction-notif-close-btn");
    const dismiss = () => {
      if (pill._dismissTimer) clearTimeout(pill._dismissTimer);
      pill.classList.add("fade-out");
      setTimeout(() => {
        if (pill.parentNode) {
          pill.parentNode.removeChild(pill);
        }
      }, 250);
    };

    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dismiss();
      });
    }

    // Auto dismiss after 3.5 seconds
    pill._dismissTimer = setTimeout(dismiss, 3500);
    container.appendChild(pill);
  }

  setScore(targetScore) {
    const target = Math.max(0, parseInt(targetScore, 10) || 0);
    const summary = this.getPointsSummary();
    const currentBase = typeof this.seedGameBonus === "number" ? this.seedGameBonus : 0;
    const currentWithoutSeed = summary.finalScore - currentBase;
    this.seedGameBonus = Math.max(0, target - currentWithoutSeed);
    if (window.game) {
      window.game.score = target;
      if (typeof window.game.updateStatsUI === "function") {
        window.game.updateStatsUI();
      }
    }
    this.savePointsData();
    this.updatePointsUI();
    this.updateProgressStats();
    this.updateGameScoreboard();
    return target;
  }

  recordGameLevelVictory(levelNum = 1) {
    const slot = getCanonicalLevelSlot(levelNum);
    const marks = LEVEL_MARKS[slot] || 8;

    // Check if points history already recorded victory for this slot to avoid duplicate positive marks
    if (!this.pointsHistory) this.pointsHistory = [];
    const alreadyRecorded = this.pointsHistory.some(e => e.type === "game" && e.level === slot);
    if (!alreadyRecorded) {
      const newEvent = {
        id: "game-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
        type: "game",
        level: slot,
        amount: marks,
        title: `Completed Game Level: Level ${slot}`,
        sub: `LEVEL COMPLETED (+${marks} PTS)`,
        timeText: "Just now",
        timestamp: Date.now()
      };
      this.pointsHistory.unshift(newEvent);
      this.savePointsData();
      this.updatePointsUI();
      this.updateProgressStats();
      this.showToast(`Level ${slot} Complete! +${marks} Marks Earned.`);
    }
  }

  resetAllProgress() {
    // 1. Clear curriculum and video progress
    this.completedChapters.clear();
    this.completedActivities.clear();
    this.completedVideos.clear();
    localStorage.removeItem("algolearn_completed_chapters");
    localStorage.removeItem("algolearn_completed_activities");
    localStorage.removeItem("algolearn_completed_videos");
    localStorage.removeItem("algolearn_completed_levels");
    localStorage.removeItem("algolearn_game_assistance");
    localStorage.removeItem("algolearn_quiz_answers");
    localStorage.removeItem("algolearn_quiz_score");
    localStorage.removeItem("algolearn_quiz_completed");
    localStorage.removeItem("algolearn_score");
    localStorage.removeItem("algolearn_points_history");
    this.gameAssistance = {};
    if (this.videoWatchStats) this.videoWatchStats = {};

    // 2. Reset active chapter back to the first chapter
    if (typeof THEORY_MODULES !== "undefined" && THEORY_MODULES.length > 0) {
      this.activeChapterId = THEORY_MODULES[0].id;
    }

    // 3. Reset Game Engine (levels, score, streak, state)
    if (window.game) {
      if (window.game.completedLevels) window.game.completedLevels.clear();
      window.game.score = 0;
      window.game.streak = 0;
      window.game.maxStreak = 0;
      window.game.mistakesCount = 0;
      window.game.correctActionsCount = 0;
      window.game.isLevelCompleted = false;

      const scoreEl = document.getElementById("score-value");
      if (scoreEl) scoreEl.textContent = "0";
      const streakEl = document.getElementById("streak-value");
      if (streakEl) streakEl.textContent = "0";

      if (window.game.guidedEngine && window.game.guidedEngine.isActive) {
        window.game.guidedEngine.toggle();
      }
      if (typeof window.game.loadLevel === "function") {
        window.game.loadLevel(0);
      }
      if (typeof window.game.updateGuidedSolveUI === "function") {
        window.game.updateGuidedSolveUI();
      }

      // Close victory modal if open
      const victoryModal = document.getElementById("victory-modal");
      if (victoryModal) victoryModal.classList.add("hidden");
    }

    // 4. Reset Quiz Engine
    if (window.quizEngine && typeof window.quizEngine.reset === "function") {
      window.quizEngine.reset();
    }

    // 5. Reset Interactive Video Players
    const v1 = document.getElementById("bfs-video-1");
    const v2 = document.getElementById("bfs-video-2");
    if (v1) { v1.pause(); v1.currentTime = 0; }
    if (v2) { v2.pause(); v2.currentTime = 0; }
    const video = document.getElementById("bfs-main-video");
    if (video) { video.pause(); video.currentTime = 0; }
    this.isVideoPlaying = false;
    this.syncPlayButtonUI();

    // 6. Reset Visualizer Engines
    if (window.applicationsDemoEngine && typeof window.applicationsDemoEngine.restart === "function") {
      window.applicationsDemoEngine.restart();
    }
    if (window.spanningTreeStudio && typeof window.spanningTreeStudio.restart === "function") {
      window.spanningTreeStudio.restart();
    }

    // 7. Re-initialize Points System
    this.initPointsSystem();
    this.updatePointsUI();

    // 8. Re-render all views and statistics to 0%
    if (this.expandedGameModules) this.expandedGameModules.clear();
    this.updateProgressStats();
    this.renderTOC();
    this.renderActiveChapter();
    this.renderProgressModules();
    this.renderLevelsGrid();

    // 9. Visual button feedback & notification
    const btn = document.getElementById("reset-state-btn");
    if (btn) {
      btn.classList.add("btn-spinning");
      setTimeout(() => btn.classList.remove("btn-spinning"), 650);
    }
    this.playSound("pop");
    this.showToast("All website progress has been reset to zero.");
  }

  showToast(message) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  /* ─── Game Hub & Level Manager ──────────────────────────────── */

  renderProgressSection() {
    this.updateProgressStats();
    this.renderProgressModules();
  }

  openLevelProblem(idx) {
    this.activeLevelIndex = idx;
    if (idx <= 1) {
      this.currentModuleIndex = 0;
    } else if (idx <= 4) {
      this.currentModuleIndex = 1;
    } else {
      this.currentModuleIndex = 2;
    }

    const hub = document.getElementById("game-levels-hub");
    const modView = document.getElementById("module-levels-view");
    const work = document.getElementById("active-problem-container");

    if (hub) { hub.classList.add("hidden"); hub.style.display = "none"; }
    if (modView) { modView.classList.add("hidden"); modView.style.display = "none"; }
    if (work) { work.classList.remove("hidden"); work.style.display = "block"; }

    if (window.game) {
      window.game.loadLevel(idx);
    }

    const lvl = typeof LEVELS_DATA !== "undefined" ? LEVELS_DATA[idx] : null;
    if (lvl) {
      const badge = document.getElementById("active-problem-badge");
      const name = document.getElementById("active-problem-name");
      let subLevel = 1;
      if (idx <= 1) {
        subLevel = idx + 1;
      } else if (idx <= 4) {
        subLevel = idx - 2 + 1;
      } else {
        subLevel = idx - 6 + 1;
      }
      if (badge) badge.textContent = `LEVEL ${subLevel}`;
      if (name) name.textContent = lvl.title;
    }
    this.updateGameScoreboard();
    this.playSound("pop");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  showProblemWorkspace() {
    const hub = document.getElementById("game-levels-hub");
    const modView = document.getElementById("module-levels-view");
    const work = document.getElementById("active-problem-container");
    if (hub) { hub.classList.add("hidden"); hub.style.display = "none"; }
    if (modView) { modView.classList.add("hidden"); modView.style.display = "none"; }
    if (work) { work.classList.remove("hidden"); work.style.display = "block"; }
    this.updateGameScoreboard();
  }

  showLevelsHub() {
    this.activeLevelIndex = null;
    this.currentModuleIndex = null;
    const hub = document.getElementById("game-levels-hub");
    const modView = document.getElementById("module-levels-view");
    const work = document.getElementById("active-problem-container");
    if (modView) { modView.classList.add("hidden"); modView.style.display = "none"; }
    if (work) { work.classList.add("hidden"); work.style.display = "none"; }
    if (hub) {
      hub.classList.remove("hidden");
      hub.style.display = "block";
    }
    this.renderLevelsGrid();
  }

  closeActiveProblem() {
    if (window.game && window.game.guidedEngine) {
      window.game.guidedEngine.isActive = false;
      if (window.game.guidedEngine.isAutoPlaying) {
        window.game.guidedEngine.pauseAutoPlay();
      }
      if (typeof window.game.updateGuidedSolveUI === "function") {
        window.game.updateGuidedSolveUI();
      }
    }

    const work = document.getElementById("active-problem-container");
    if (work) { work.classList.add("hidden"); work.style.display = "none"; }

    if (this.currentModuleIndex !== null) {
      const modView = document.getElementById("module-levels-view");
      if (modView) {
        modView.classList.remove("hidden");
        modView.style.display = "block";
        this.renderModuleDetailView(this.currentModuleIndex);
      }
    } else {
      this.exitModuleToHub();
    }
  }

  replayLevelFromVictory() {
    const modal = document.getElementById("victory-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      modal.style.display = "none";
    }
    const currentIdx = (window.game && window.game.currentLevelIndex !== undefined)
      ? window.game.currentLevelIndex
      : (this.activeLevelIndex !== null ? this.activeLevelIndex : 0);
    if (window.game) {
      window.game.loadLevel(currentIdx);
    }
  }

  nextLevelFromVictory() {
    const modal = document.getElementById("victory-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      modal.style.display = "none";
    }
    const currentIdx = (window.game && window.game.currentLevelIndex !== undefined)
      ? window.game.currentLevelIndex
      : (this.activeLevelIndex !== null ? this.activeLevelIndex : 0);
    const nextIdx = currentIdx + 1;
    if (typeof LEVELS_DATA !== "undefined" && nextIdx < LEVELS_DATA.length) {
      this.openLevelProblem(nextIdx);
    } else {
      this.switchTab("quiz");
    }
  }

  getChallengeModules() {
    return [
      {
        id: "module-tree-traversal",
        numCode: "01",
        themeClass: "theme-tree",
        title: "Level 01: Core FIFO Operations & Boundary Guardrails",
        shortTitle: "Tree Traversal",
        subtitle: "REAR Enqueue, FRONT Dequeue, Capacity Limits & Underflow Defense",
        description: "Explore the operational foundation of queue data structures: append incoming items at the REAR pointer, dispatch departing elements from the FRONT pointer in strict FIFO order, identify capacity overflow, and prevent underflow exceptions.",
        difficulty: "BEGINNER",
        points: 16,
        pointsLabel: "+16 points",
        topics: ["Acyclic Trees", "FIFO Enqueue", "Level-by-Level"],
        iconGradient: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
        iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
        levelIndices: [0, 1] // Level 1 (Simple Tree Traversal), Level 2 (Binary Tree Exploration)
      },
      {
        id: "module-graph-traversal",
        numCode: "02",
        themeClass: "theme-graph",
        title: "Level 02: Visited Set & Cycle Prevention Guardrails",
        shortTitle: "Graph Traversal",
        subtitle: "Cycle Detection, Visited Set Tracking & Multi-Path Defense",
        description: "Master interconnected multi-path networks featuring cycles, back-edges, and visited set guards to prevent duplicate queue insertions and eliminate infinite loop traps.",
        difficulty: "INTERMEDIATE",
        points: 24,
        pointsLabel: "+24 points",
        topics: ["Cycle Detection", "Visited Sets", "Dense Adjacency"],
        iconGradient: "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)",
        iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
        levelIndices: [2, 3, 4] // Level 1 (Undirected Graph), Level 2 (Cyclic Graph), Level 3 (Dense Graph)
      },
      {
        id: "module-advanced-graph",
        numCode: "03",
        themeClass: "theme-advanced",
        title: "Level 03: Advanced Graph & Labyrinth Challenges",
        shortTitle: "Advanced Graph Challenges",
        subtitle: "Disconnected Islands, BFS Invariant Defense & Capstone Labyrinth",
        description: "Navigate complex frontiers including disconnected components, level-order parent backtracking for shortest paths, anti-DFS invariants, and peak queue scales.",
        difficulty: "ADVANCED",
        points: 24,
        pointsLabel: "+24 points",
        topics: ["Disconnected Islands", "BFS Invariant", "Final Labyrinth"],
        iconGradient: "linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)",
        iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
        levelIndices: [6, 7], // Level 1 (Misleading Paths), Level 2 (Large Network)
        finalChallengeIndex: 8 // Level 4 (Capstone Final Challenge)
      }
    ];
  }

  enterModule(modIdx) {
    this.currentModuleIndex = modIdx;
    this.activeLevelIndex = null;
    const hub = document.getElementById("game-levels-hub");
    const modView = document.getElementById("module-levels-view");
    const work = document.getElementById("active-problem-container");

    if (hub) { hub.classList.add("hidden"); hub.style.display = "none"; }
    if (work) { work.classList.add("hidden"); work.style.display = "none"; }
    if (modView) {
      modView.classList.remove("hidden");
      modView.style.display = "block";
      this.renderModuleDetailView(modIdx);
    }
    this.playSound("pop");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  exitModuleToHub() {
    this.currentModuleIndex = null;
    this.activeLevelIndex = null;
    const hub = document.getElementById("game-levels-hub");
    const modView = document.getElementById("module-levels-view");
    const work = document.getElementById("active-problem-container");

    if (modView) { modView.classList.add("hidden"); modView.style.display = "none"; }
    if (work) { work.classList.add("hidden"); work.style.display = "none"; }
    if (hub) {
      hub.classList.remove("hidden");
      hub.style.display = "block";
      this.renderLevelsGrid();
    }
    this.playSound("pop");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  startModule(modIdx) {
    this.enterModule(modIdx);
  }

  renderLevelsGrid() {
    const mount = document.getElementById("levels-grid-mount");
    if (!mount || typeof LEVELS_DATA === "undefined") return;

    const completed = (window.game && window.game.completedLevels) ? window.game.completedLevels : new Set();
    const modules = this.getChallengeModules();

    mount.innerHTML = modules.map((mod, modIdx) => {
      const allModIndices = mod.levelIndices.concat(mod.finalChallengeIndex !== undefined ? [mod.finalChallengeIndex] : []);
      const completedCount = allModIndices.filter(idx => {
        const lvl = LEVELS_DATA[idx];
        return lvl && (completed.has(lvl.id) || completed.has(idx));
      }).length;
      const isAllDone = completedCount === allModIndices.length;

      let statusText = "○ Not Started";
      let statusClass = "";
      if (isAllDone) {
        statusText = "✓ Completed";
        statusClass = "badge-done";
      } else if (completedCount > 0) {
        statusText = `○ In Progress (${completedCount}/${allModIndices.length})`;
        statusClass = "badge-progress";
      }

      return `
        <div class="module-master-card ${mod.themeClass} ${isAllDone ? 'is-all-done' : ''}" 
             id="${mod.id}" 
             onclick="app.enterModule(${modIdx})"
             title="Enter ${mod.title}">
          
          <div class="module-card-header">
            <div class="module-header-left">
              <span class="module-number-code">${mod.numCode}</span>
              <div class="module-icon-box" style="background: ${mod.iconGradient};">${mod.iconSvg}</div>
            </div>
            <span class="module-badge-pill ${statusClass}">
              ${statusText}
            </span>
          </div>

          <h3 class="module-card-title">${mod.title}</h3>
          <div class="module-card-subtitle">${mod.subtitle}</div>
          <p class="module-card-desc">${mod.description}</p>

          <div class="module-badge-row">
            <span class="module-diff-pill diff-${mod.difficulty.toLowerCase()}">${mod.difficulty}</span>
            <span class="module-points-pill-gold">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#d97706" stroke-width="1.5">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
              <span>+${mod.points} points</span>
            </span>
          </div>

          <button class="module-play-action-btn" onclick="event.stopPropagation(); app.enterModule(${modIdx})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            <span>PLAY GAME</span>
          </button>
        </div>
      `;
    }).join("");
  }

  renderModuleDetailView(modIdx) {
    const modView = document.getElementById("module-levels-view");
    if (!modView || typeof LEVELS_DATA === "undefined") return;

    const modules = this.getChallengeModules();
    const mod = modules[modIdx];
    if (!mod) return;

    const completed = (window.game && window.game.completedLevels) ? window.game.completedLevels : new Set();
    const allModIndices = mod.levelIndices.concat(mod.finalChallengeIndex !== undefined ? [mod.finalChallengeIndex] : []);
    const completedCount = allModIndices.filter(idx => {
      const lvl = LEVELS_DATA[idx];
      return lvl && (completed.has(lvl.id) || completed.has(idx));
    }).length;
    const isAllDone = completedCount === allModIndices.length;
    const percent = Math.round((completedCount / allModIndices.length) * 100);

    const nextIdx = allModIndices.find(idx => {
      const lvl = LEVELS_DATA[idx];
      return lvl && !completed.has(lvl.id) && !completed.has(idx);
    });
    const playableIdx = nextIdx !== undefined ? nextIdx : allModIndices[0];
    const playableSubNum = allModIndices.indexOf(playableIdx) + 1;

    // Sub-levels inside the module view, starting at Level 1 for each card
    const subLevelsHtml = mod.levelIndices.map((lvlIdx, subIdx) => {
      const lvl = LEVELS_DATA[lvlIdx];
      if (!lvl) return "";
      const isDone = completed.has(lvl.id) || completed.has(lvlIdx);
      const subLevelNum = subIdx + 1;
      const opsHtml = (lvl.keyOperations || []).map(op => `
        <div class="module-op-row">
          <span class="module-op-name">${op.name}</span>
          <span class="module-op-complexity">${op.complexity}</span>
        </div>
      `).join("");

      return `
        <div class="module-sublevel-section ${isDone ? 'is-done' : ''}" onclick="app.openLevelProblem(${lvlIdx})" title="Play Level ${subLevelNum}: ${lvl.title} (+8 pts)">
          <div class="module-sublevel-header">
            <div class="module-sublevel-meta">
              <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <span class="module-level-tag ${isDone ? 'tag-done' : ''}">${isDone ? '✓ ' : ''}LEVEL ${subLevelNum}</span>
                <span class="level-pts-badge">+8 pts</span>
              </div>
              <h4 class="module-sublevel-name">${lvl.title}</h4>
            </div>
            <div class="module-sublevel-play-icon">
              ${isDone 
                ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` 
                : `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`
              }
            </div>
          </div>
          <div class="module-ops-list">
            ${opsHtml}
          </div>
        </div>
      `;
    }).join("");

    let capstoneHtml = "";
    if (mod.finalChallengeIndex !== undefined) {
      const capstoneLvl = LEVELS_DATA[mod.finalChallengeIndex];
      if (capstoneLvl) {
        const isCapstoneDone = completed.has(capstoneLvl.id) || completed.has(mod.finalChallengeIndex);
        const capstoneSubNum = mod.levelIndices.length + 1;
        const capOpsHtml = (capstoneLvl.keyOperations || []).map(op => `
          <div class="module-op-row">
            <span class="module-op-name">${op.name}</span>
            <span class="module-op-complexity">${op.complexity}</span>
          </div>
        `).join("");

        capstoneHtml = `
          <div class="module-sublevel-section module-capstone-section ${isCapstoneDone ? 'is-done' : ''}" onclick="app.openLevelProblem(${mod.finalChallengeIndex})" title="Play Final Challenge: Level ${capstoneSubNum} - ${capstoneLvl.title} (+8 pts)">
            <div class="module-sublevel-header">
              <div class="module-sublevel-meta">
                <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                  <span class="module-level-tag tag-capstone ${isCapstoneDone ? 'tag-done' : ''}">${isCapstoneDone ? '✓ ' : '★ '}FINAL CHALLENGE &bull; LEVEL ${capstoneSubNum}</span>
                  <span class="level-pts-badge">+8 pts</span>
                </div>
                <h4 class="module-sublevel-name">${capstoneLvl.title}</h4>
              </div>
              <div class="module-sublevel-play-icon">
                ${isCapstoneDone 
                  ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` 
                  : `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`
                }
              </div>
            </div>
            <div class="module-ops-list">
              ${capOpsHtml}
            </div>
          </div>
        `;
      }
    }

    modView.innerHTML = `
      <div class="module-levels-view-container ${mod.themeClass}">
        <!-- Top Nav Bar -->
        <div class="module-view-nav-bar">
          <button class="module-view-back-btn" onclick="app.exitModuleToHub()" title="Back to All Modules">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            <span>All Modules</span>
          </button>
          <div class="module-view-breadcrumbs">
            <span class="module-view-crumb-muted">Modules</span>
            <span class="module-view-crumb-sep">/</span>
            <span class="module-view-crumb-active">${mod.title}</span>
          </div>
        </div>

        <!-- Module Hero Summary Card -->
        <div class="module-view-hero-card ${mod.themeClass}">
          <div class="module-view-hero-header">
            <div class="module-view-hero-title-group">
              <div class="module-icon-box" style="background: ${mod.iconGradient};">${mod.iconSvg}</div>
              <div>
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px; flex-wrap: wrap;">
                  <span class="module-diff-pill diff-${mod.difficulty.toLowerCase()}">${mod.difficulty}</span>
                  <span class="module-points-pill-gold">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#d97706" stroke-width="1.5">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                    </svg>
                    <span>+${mod.points} points</span>
                  </span>
                  <span class="module-badge-pill ${isAllDone ? 'badge-done' : ''}">
                    <span class="module-badge-dot"></span>
                    ${isAllDone ? '✓ ALL CLEARED' : `${completedCount}/${allModIndices.length} CLEARED`}
                  </span>
                </div>
                <h2 class="module-view-hero-title">${mod.title}</h2>
              </div>
            </div>
            <button class="btn btn-primary" onclick="app.openLevelProblem(${playableIdx})" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; font-weight: 750;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span>${isAllDone ? 'Replay Challenges' : completedCount > 0 ? `Resume Level ${playableSubNum}` : 'Start First Challenge'}</span>
            </button>
          </div>

          <p class="module-view-hero-desc">${mod.description}</p>

          <div class="module-progress-wrapper" style="max-width: 580px; margin-bottom: 14px;">
            <div class="module-progress-header">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>Module Progress</span>
                <span class="module-points-pill-gold" style="font-size: 0.72rem; padding: 2px 8px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#d97706" stroke-width="1.5">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                  </svg>
                  <span>+${mod.points} points</span>
                </span>
              </div>
              <span class="module-progress-val">${percent}% (${completedCount}/${allModIndices.length} Completed)</span>
            </div>
            <div class="module-progress-track">
              <div class="module-progress-fill" style="width: ${percent}%;"></div>
            </div>
          </div>

          <div class="module-topics-row">
            ${mod.topics.map(t => `<span class="module-topic-tag">${t}</span>`).join("")}
          </div>
        </div>

        <!-- Interactive Challenges List -->
        <div class="module-levels-section-container">
          <div class="module-levels-list-header">
            <div class="module-levels-list-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              <span>Interactive Challenges (${allModIndices.length} Levels)</span>
            </div>
            <span style="font-size: 0.8rem; color: var(--text-muted, #64748b);">Click any challenge to enter the workspace</span>
          </div>

          <div class="module-levels-grid">
            ${subLevelsHtml}
            ${capstoneHtml}
          </div>
        </div>
      </div>
    `;
  }

  setGameMode(mode) {
    this.gameMode = mode;
  }
}

Object.defineProperty(AppController.prototype, "score", {
  get: function() {
    return this.getPointsSummary().finalScore;
  },
  set: function(val) {
    this.setScore(val);
  },
  configurable: true
});

Object.defineProperty(AppController.prototype, "currentScore", {
  get: function() {
    return this.getPointsSummary().finalScore;
  },
  set: function(val) {
    this.setScore(val);
  },
  configurable: true
});

window.AppController = AppController;

// Global App Initialization
document.addEventListener("DOMContentLoaded", () => {
  window.app = new AppController();
  window.app.init();
});
