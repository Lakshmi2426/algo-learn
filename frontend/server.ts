import express from "express";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import http from "http";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

const getAppDir = (): string => {
  return process.cwd();
};

const appDir = getAppDir();

const getProjectRootDir = (): string => {
  const candidates = [
    appDir,
    path.resolve(appDir, ".."),
    process.cwd(),
    path.resolve(process.cwd(), "frontend"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "DSA topics"))) {
      return candidate;
    }
  }
  return appDir;
};

const projectRoot = getProjectRootDir();

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!aiClient && apiKey) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  app.use(express.json({ limit: "5mb" }));

  // DSA Topic Mini-Websites Mapping for 11 Integrated Modules
  const MODULE_FOLDER_MAP: Record<string, string> = {
    hashing: "Hashing-and-Collision-Resolution",
    "hashing-and-collision-resolution": "Hashing-and-Collision-Resolution",
    "linear-search": "Linear Search",
    "linear search": "Linear Search",
    cll: "Circular Linked List (CLL)",
    "circular-linked-list": "Circular Linked List (CLL)",
    dll: "Doubly Linked List (DLL)",
    "doubly-linked-list": "Doubly Linked List (DLL)",
    trees: "Trees",
    tree: "Trees",
    bst: "Binary Search Tree",
    "binary-search-tree": "Binary Search Tree",
    "binary search tree": "Binary Search Tree",
    "dsa-types": "Data Structure and Types",
    "data-structures-and-types": "Data Structure and Types",
    "data structure and types": "Data Structure and Types",
    sorting: "Sorting",
    bfs: "Breadth-First Search (BFS)",
    "breadth-first-search": "Breadth-First Search (BFS)",
    queue: "Queues",
    queues: "Queues",
    sll: "Singly Linked List (SLL)",
    "singly-linked-list": "Singly Linked List (SLL)",
    stack: "Stack",
    "binary-search": "Binary Search",
    "binary search": "Binary Search",
  };

  const resolveFolderName = (rawId: string): string => {
    let folderName = MODULE_FOLDER_MAP[rawId] || MODULE_FOLDER_MAP[rawId.replace(/_/g, "-")];
    if (!folderName) {
      try {
        const topicsDir = path.join(projectRoot, "DSA topics");
        if (fs.existsSync(topicsDir)) {
          const folders = fs.readdirSync(topicsDir);
          const cleanRaw = rawId.replace(/[^a-z0-9]/gi, "").toLowerCase();
          for (const folder of folders) {
            const cleanFolder = folder.replace(/[^a-z0-9]/gi, "").toLowerCase();
            if (cleanFolder === cleanRaw || (cleanRaw.length > 2 && cleanFolder.includes(cleanRaw))) {
              return folder;
            }
          }
        }
      } catch (e) { }
    }
    return folderName || "";
  };

  let viteInstance: any = null;

  const moduleHtmlCache = new Map<string, string>();

  const handleModuleRequest = async (req: express.Request, res: express.Response) => {
    const rawId = (req.params.moduleId || "").toLowerCase();
    console.log(`\n[MODULE ROUTE MATCHED] moduleId=${rawId}, originalUrl=${req.originalUrl}`);
    let folderName = resolveFolderName(rawId);

    if (!folderName) {
      return res.status(404).send("Module not found");
    }

    let htmlPath = path.join(projectRoot, "DSA topics", folderName, "index.html");

    if (!fs.existsSync(htmlPath)) {
      return res.status(404).send("Module index.html not found");
    }

    const reqTheme = (req.query.theme as string) || '';
    const reqThemeStr = reqTheme || 'dark';
    const cacheKey = `${rawId}_${reqThemeStr}`;
    const cached = moduleHtmlCache.get(cacheKey);
    if (cached) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      return res.send(cached);
    }

    let rawHtml = fs.readFileSync(htmlPath, "utf-8");
    const baseTag = `<base href="/dsa-modules/${rawId}/">`;
    const bridgeScript = `
      <script>
        (function() {
          var currentTheme = '${reqThemeStr}';

          function applyCurrentTheme(th) {
            try {
              var isDark = th === 'dark';
              var root = document.documentElement;
              if (isDark) {
                root.classList.add('dark');
                root.classList.add('dark-theme');
                root.setAttribute('data-theme', 'dark');
                root.style.colorScheme = 'dark';
                if (document.body) {
                  document.body.classList.add('dark');
                  document.body.classList.add('dark-theme');
                  document.body.setAttribute('data-theme', 'dark');
                }
              } else {
                root.classList.remove('dark');
                root.classList.remove('dark-theme');
                root.setAttribute('data-theme', 'light');
                root.style.colorScheme = 'light';
                if (document.body) {
                  document.body.classList.remove('dark');
                  document.body.classList.remove('dark-theme');
                  document.body.setAttribute('data-theme', 'light');
                }
              }
              try {
                localStorage.setItem('algolearn_theme', th);
                localStorage.setItem('hashquest_theme', th);
                localStorage.setItem('stackmaster_theme', th);
              } catch(e) {}
            } catch(e) {}
          }

          var initialTheme = '${reqThemeStr}';
          if (!initialTheme) {
            try {
              if (window.parent && window.parent !== window && window.parent.document) {
                initialTheme = window.parent.document.documentElement.classList.contains('dark') ? 'dark' : 'light';
              }
            } catch(e) {}
          }
          if (!initialTheme) {
            try {
              initialTheme = localStorage.getItem('algolearn_theme') || localStorage.getItem('stackmaster_theme') || localStorage.getItem('hashquest_theme');
            } catch(e) {}
          }
          if (!initialTheme) {
            try {
              initialTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            } catch(e) {}
          }
          if (!initialTheme) initialTheme = 'dark';

          applyCurrentTheme(initialTheme);
          currentTheme = initialTheme;

          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
              applyCurrentTheme(currentTheme);
            });
          }

          // Bidirectional Theme Observer inside Module Iframe
          try {
            var observer = new MutationObserver(function() {
              var isDarkNow = document.documentElement.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark';
              var newTheme = isDarkNow ? 'dark' : 'light';
              if (newTheme !== currentTheme) {
                currentTheme = newTheme;
                try {
                  if (window.parent && window.parent !== window) {
                    window.parent.postMessage({ type: 'ALGOLEARN_MODULE_THEME_CHANGED', theme: newTheme }, '*');
                  }
                } catch(e) {}
              }
            });
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
          } catch(e) {}

          // Listen for theme change from parent window
          window.addEventListener('message', function(e) {
            if (e.data && e.data.type === 'ALGOLEARN_THEME_CHANGE' && (e.data.theme === 'dark' || e.data.theme === 'light')) {
              currentTheme = e.data.theme;
              applyCurrentTheme(e.data.theme);
            }
          });

          // Listen for storage changes
          window.addEventListener('storage', function(e) {
            if (e.key === 'algolearn_theme' && (e.newValue === 'dark' || e.newValue === 'light')) {
              currentTheme = e.newValue;
              applyCurrentTheme(e.newValue);
            }
          });

          var CURRENT_MODULE_ID = '${rawId}';

          function detectCurrentModuleProgress() {
            var mid = CURRENT_MODULE_ID;
            var score = 0;
            try {
              if (mid === 'stack') {
                var raw = localStorage.getItem('stack_master_user_progress_v2');
                if (raw) {
                  var p = JSON.parse(raw);
                  var labs = p.completedLabs || [];
                  var vCount = labs.filter(function(id) { return id === 1 || id === 2; }).length;
                  var vPts = Math.min(20, vCount * 10);
                  var gScores = p.gameScores || {};
                  var cGames = p.completedGameLevels || [];
                  var g1 = gScores[1] !== undefined ? gScores[1] : (cGames.indexOf(1) !== -1 ? 20 : 0);
                  var g2 = gScores[2] !== undefined ? gScores[2] : (cGames.indexOf(2) !== -1 ? 20 : 0);
                  var gPts = Math.min(40, Math.max(0, g1 + g2));
                  var qScores = p.quizQuestionScores || {};
                  var qSum = 0;
                  Object.keys(qScores).forEach(function(k) { qSum += Number(qScores[k]) || 0; });
                  var qPts = Math.min(40, Math.max(0, qSum));
                  var totalPoints = Math.min(100, Math.max(0, vPts + gPts + qPts));
                  var thCount = Math.min(12, (p.completedTheoryChapters || []).length);
                  var gCount = Math.min(2, cGames.filter(function(id) { return id === 1 || id === 2; }).length);
                  var qCount = Math.min(10, Object.keys(qScores).length);
                  var qBonus = p.quizCompleted ? 1 : 0;
                  var compPct = Math.min(100, Math.round(((thCount + vCount + gCount + qCount + qBonus) / 27) * 100));
                  score = Math.max(totalPoints, compPct);
                }
              } else if (mid === 'hashing') {
                var p = null;
                for (var i = 0; i < localStorage.length; i++) {
                  var k = localStorage.key(i);
                  if (k && (k.indexOf('hash_user_progress_') === 0 || k === 'hash_quest_field_notes_progress_v2')) {
                    try { p = JSON.parse(localStorage.getItem(k)); if (p) break; } catch(e) {}
                  }
                }
                var pts = 0;
                for (var i = 0; i < localStorage.length; i++) {
                  var k = localStorage.key(i);
                  if (k && (k.indexOf('hash_user_points_') === 0 || k === 'hash_quest_points_system_v2')) {
                    try { var pObj = JSON.parse(localStorage.getItem(k)); if (pObj && pObj.totalPoints) pts = Math.max(pts, pObj.totalPoints); } catch(e) {}
                  }
                }
                var compPct = 0;
                if (p) {
                  var th = Math.min(12, (p.completedTheoryChapters || []).length);
                  var vi = Math.min(2, (p.completedVideos || []).length);
                  var ga = Math.min(5, (p.levelsCompleted || []).length);
                  var qu = p.quizSubmitted ? 1 : 0;
                  compPct = Math.min(100, Math.round(((th + vi + ga + qu) / 20) * 100));
                }
                score = Math.max(pts, compPct);
              } else if (mid === 'linear-search') {
                var p = null;
                try { p = JSON.parse(localStorage.getItem('linear_search_field_notes_progress_v2') || localStorage.getItem('hash_quest_field_notes_progress_v2')); } catch(e) {}
                var pts = 0;
                try { var ptsObj = JSON.parse(localStorage.getItem('algo_quest_points_system_v3')); if (ptsObj && ptsObj.totalPoints) pts = ptsObj.totalPoints; } catch(e) {}
                var compPct = 0;
                if (p) {
                  var th = Math.min(12, (p.completedTheoryChapters || []).length);
                  var vi = Math.min(2, (p.completedVideos || []).length);
                  var ga = Math.min(5, (p.levelsCompleted || []).length);
                  var qu = p.quizSubmitted ? 1 : 0;
                  compPct = Math.min(100, Math.round(((th + vi + ga + qu) / 20) * 100));
                }
                score = Math.max(pts, compPct);
              } else if (mid === 'binary-search') {
                try {
                  var p = JSON.parse(localStorage.getItem('binary_search_user_progress_v4'));
                  if (p) {
                    var tEarned = (p.topicPoints && p.topicPoints.totalEarned) || 0;
                    var th = Math.min(12, (p.completedTheoryChapters || []).length);
                    var lb = Math.min(2, (p.completedLabs || []).length);
                    var gm = Math.min(6, (p.completedGameLevels || []).length);
                    var qz = p.quizCompleted ? 1 : 0;
                    var compPct = Math.min(100, Math.round(((th + lb + gm + qz) / 21) * 100));
                    score = Math.max(tEarned, compPct);
                  }
                } catch(e) {}
              } else if (mid === 'sorting') {
                for (var i = 0; i < localStorage.length; i++) {
                  var k = localStorage.key(i);
                  if (k && (k.indexOf('sort_master_user_progress_') === 0 || k.indexOf('stack_master_user_progress_v2_fresh_reset_') === 0)) {
                    try {
                      var p = JSON.parse(localStorage.getItem(k));
                      if (p) {
                        var led = p.pointsLedger || {};
                        var vz = Math.min(15, Math.max(0, led.visualizationPoints || 0));
                        var gm = Math.min(45, Math.max(0, (led.gamePoints || 0) - ((led.hintDeductions || 0) + (led.guidedSolveDeductions || 0))));
                        var qz = Math.min(40, Math.max(0, (led.quizPoints || 0) - (led.wrongQuizDeductions || 0)));
                        var tPts = Math.min(100, vz + gm + qz);
                        var ln = Math.min(6, (p.completedTheoryChapters || []).length);
                        var lb = Math.min(3, (p.completedLabs || []).length);
                        var gCount = 0;
                        if (p.sortGameProgress && typeof p.sortGameProgress === 'object') {
                          var gKeys = Object.keys(p.sortGameProgress);
                          for (var gi = 0; gi < gKeys.length; gi++) {
                            var gArr = p.sortGameProgress[gKeys[gi]];
                            if (Array.isArray(gArr) && gArr.length > 0) gCount++;
                          }
                        }
                        if (Array.isArray(led.completedGameCardIds) && led.completedGameCardIds.length > 0) {
                          gCount = Math.max(gCount, led.completedGameCardIds.length);
                        }
                        gCount = Math.min(5, gCount);
                        var qCount = Math.min(10, (p.quizCompletedQuestions || []).length || (p.quizCompleted ? 10 : 0));
                        var compPct = Math.min(100, Math.round(((ln + lb + gCount + qCount) / 24) * 100));
                        if (tPts === 0 && ln === 0 && lb === 0 && gCount === 0 && qCount === 0) {
                          score = 0;
                        } else {
                          score = Math.max(tPts, compPct);
                        }
                        break;
                      }
                    } catch(e) {}
                  }
                }
              } else if (mid === 'queue') {
                try {
                  var p = JSON.parse(localStorage.getItem('queue_master_user_progress_v2') || localStorage.getItem('stack_master_user_progress_v1'));
                  if (p) {
                    var vz = Math.min(2, (p.completedLabs || []).length);
                    var gm = Math.min(4, (p.completedGameLevels || []).length);
                    var th = Math.min(12, (p.completedTheoryChapters || []).length);
                    var qz = p.quizCompleted ? 1 : 0;
                    var compPct = Math.min(100, Math.round(((vz + gm + th + qz) / 19) * 100));
                    var qPts = p.quizHighScore ? Math.round((p.quizHighScore / 100) * 40) : 0;
                    var tPts = Math.min(100, vz * 10 + gm * 10 + qPts);
                    score = Math.max(tPts, compPct);
                  }
                } catch(e) {}
              } else if (mid === 'sll') {
                try {
                  var p = JSON.parse(localStorage.getItem('algolearn_sll_100_points_progress_v4'));
                  if (p) {
                    var tPts = Math.min(100, Math.max(0, p.totalPoints || 0));
                    var compPct = Math.min(100, Math.round((Object.keys(p.completedActivities || {}).length / 27) * 100));
                    score = Math.max(tPts, compPct);
                  }
                } catch(e) {}
              } else if (mid === 'dll') {
                try {
                  var ev = JSON.parse(localStorage.getItem('algolearn_scoring_events_v2') || '[]');
                  var dllEv = ev.filter(function(e) { return e && e.topicId === 'dll'; });
                  var vCount = dllEv.filter(function(e) { return e.activityType === 'VISUALIZE' && e.reason === 'VIDEO_COMPLETED'; }).length;
                  var gTasks = {};
                  var hints = 0; var guides = 0;
                  dllEv.forEach(function(e) {
                    if (e.activityType === 'GAME' && e.reason === 'GAME_TASK_COMPLETED') gTasks[e.activityId] = true;
                    if (e.reason === 'HINT_USED') hints++;
                    if (e.reason === 'GUIDED_SOLVE_STEP') guides++;
                  });
                  var qCorrect = dllEv.filter(function(e) { return e.activityType === 'QUIZ' && e.reason === 'QUIZ_CORRECT'; }).length;
                  var qWrong = dllEv.filter(function(e) { return e.activityType === 'QUIZ' && e.reason === 'QUIZ_INCORRECT'; }).length;
                  var vScore = Math.min(16, vCount * 8);
                  var gScore = Math.max(0, Object.keys(gTasks).length * 6 - (hints * 1 + guides * 2));
                  var qScore = Math.max(0, qCorrect * 3 - qWrong * 1);
                  var earned = Math.min(100, Math.round(vScore + gScore + qScore));
                  var p = JSON.parse(localStorage.getItem('dll_field_notes_progress_v2') || localStorage.getItem('hash_quest_field_notes_progress_v2') || '{}');
                  var pct = p.totalScore ? Math.min(100, p.totalScore) : 0;
                  score = Math.max(earned, pct);
                } catch(e) {}
              } else if (mid === 'cll') {
                try {
                  var pts = JSON.parse(localStorage.getItem('cll-learning-points-v5') || '{}');
                  var tPts = pts.totalPoints || 0;
                  var p = JSON.parse(localStorage.getItem('cll_field_notes_progress_v2') || localStorage.getItem('hash_quest_field_notes_progress_v2') || '{}');
                  var th = Math.min(12, (p.completedTheoryChapters || []).length);
                  var vi = Math.min(2, (p.completedVideos || []).length);
                  var gm = Math.min(5, (p.levelsCompleted || []).length);
                  var qz = p.quizSubmitted ? 1 : 0;
                  var pct = Math.min(100, Math.round(((th + vi + gm + qz) / 20) * 100));
                  score = Math.max(tPts, pct);
                } catch(e) {}
              } else if (mid === 'bfs') {
                try {
                  var lvls = JSON.parse(localStorage.getItem('algolearn_completed_levels') || '[]');
                  var vids = JSON.parse(localStorage.getItem('algolearn_completed_videos') || '[]');
                  var chaps = JSON.parse(localStorage.getItem('algolearn_completed_chapters') || '[]');
                  var qAns = JSON.parse(localStorage.getItem('algolearn_quiz_answers') || '{}');
                  var ast = JSON.parse(localStorage.getItem('algolearn_game_assistance') || '{}');
                  var vScore = Math.min(16, vids.length * 8);
                  var gPos = Math.min(64, lvls.length * 8);
                  var gPen = 0;
                  Object.keys(ast).forEach(function(k) {
                    var a = ast[k];
                    if (a) gPen += (a.hintCount || (a.hintUsed ? 1 : 0)) * 3 + (a.guidedCount || (a.guidedUsed ? 1 : 0)) * 3;
                  });
                  var gScore = Math.max(0, gPos - gPen);
                  var qCorr = 0; var qWr = 0;
                  Object.keys(qAns).forEach(function(k) {
                    if (qAns[k] && qAns[k].isCorrect === true) qCorr++;
                    else if (qAns[k] && qAns[k].isCorrect === false) qWr++;
                  });
                  var qScore = Math.max(0, Math.min(20, qCorr * 2 - qWr * 1));
                  var finalS = Math.min(100, vScore + gScore + qScore);
                  var pct = Math.min(100, Math.round(((chaps.length + vids.length + lvls.length + (qCorr > 0 ? 1 : 0)) / 23) * 100));
                  score = Math.max(finalS, pct);
                } catch(e) {}
              } else if (mid === 'trees') {
                try {
                  var isVid = false;
                  var qVal = 0;
                  for (var i = 0; i < localStorage.length; i++) {
                    var k = localStorage.key(i);
                    if (k && k.indexOf('video_completed') !== -1 && localStorage.getItem(k) === 'true') isVid = true;
                    if (k && k.indexOf('quiz_score') !== -1) {
                      var q = JSON.parse(localStorage.getItem(k));
                      if (q && q.score) qVal = Math.max(qVal, q.score);
                    }
                  }
                  score = Math.min(100, (isVid ? 30 : 0) + Math.min(70, qVal));
                } catch(e) {}
              } else if (mid === 'bst') {
                try {
                  var p = JSON.parse(localStorage.getItem('bst_explorer_user_stats_main'));
                  if (p) {
                    var tPts = p.totalTopicPoints || 0;
                    var pct = p.overallCompletionPercentage || 0;
                    var xpS = p.xp ? Math.min(100, Math.round(p.xp / 10)) : 0;
                    score = Math.max(tPts, pct, xpS);
                  }
                } catch(e) {}
              } else if (mid === 'dsa-types') {
                try {
                  var p = JSON.parse(localStorage.getItem('algo_ds_types_progress_v1'));
                  if (p && p.topicData) {
                    score = Math.max(p.topicData.overallTopicScore || 0, p.topicData.completionPercentage || 0);
                  }
                } catch(e) {}
              }
            } catch(err) {}

            return Math.min(100, Math.max(0, Math.round(score)));
          }

          var lastBroadcastScore = -1;
          var origSetItem = localStorage.setItem;

          function broadcastModuleProgress() {
            try {
              var score = detectCurrentModuleProgress();
              if (score === lastBroadcastScore) return;
              lastBroadcastScore = score;

              origSetItem.call(localStorage, 'algolearn_topic_progress_' + CURRENT_MODULE_ID, String(score));
              try {
                var map = JSON.parse(localStorage.getItem('algolearn_topics_progress') || '{}');
                map[CURRENT_MODULE_ID] = score;
                origSetItem.call(localStorage, 'algolearn_topics_progress', JSON.stringify(map));
              } catch(e) {}

              if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                  type: 'ALGOLEARN_TOPIC_PROGRESS_UPDATE',
                  moduleId: CURRENT_MODULE_ID,
                  score: score,
                  progress: score
                }, '*');
              }
            } catch(e) {}
          }

          // Intercept localStorage writes inside iframe to detect changes in real-time
          try {
            localStorage.setItem = function(k, v) {
              origSetItem.apply(this, arguments);
              if (k && !k.startsWith('algolearn_') && !k.startsWith('theme')) {
                setTimeout(broadcastModuleProgress, 100);
              }
            };
          } catch(e) {}

          // Immediate detection on load
          if (document.readyState === 'complete') {
            broadcastModuleProgress();
          } else {
            window.addEventListener('load', broadcastModuleProgress);
          }

          function navigateParent(tab) {
            broadcastModuleProgress();
            try {
              if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'ALGOLEARN_NAVIGATE', tab: tab }, '*');
                return;
              }
            } catch(e) {}
            if (tab === 'home') window.location.href = '/';
            else if (tab === 'ask-teacher') window.location.href = '/#ask-teacher';
          }

          function isLogoElement(el) {
            if (!el) return false;
            if (el.closest('button[id*="theme"], button[id*="sound"], button[id*="toggle"], button[id*="menu"], #header-hamburger-btn, #topbar-menu-toggle')) return false;

            var sel = el.closest('#header-algolearn-logo, #btn-logo-home, .brand-title-wrap, #topbar-brand-logo-img, .sidebar-brand-left, .algolearn-logo, .topbar-brand-logo-left, [aria-label*="AlgoLearn" i], [aria-label*="Logo" i], [title*="AlgoLearn" i], [title*="Overview" i], a[href="/"]');
            if (sel) return true;

            var txt = (el.textContent || '').trim();
            var parentTxt = (el.parentElement ? el.parentElement.textContent || '' : '').trim();
            if (txt.includes('Algo') && txt.includes('earn')) return true;
            if (txt.includes('YOUR DSA JOURNEY') || parentTxt.includes('YOUR DSA JOURNEY')) return true;
            if (txt === 'AlgoLearn' || parentTxt === 'AlgoLearn') return true;

            return false;
          }

          function isChatElement(el) {
            if (!el) return false;
            var sel = el.closest('#ai-bot-floating-button, #floating-chat-bubble-container, #floating-chat-bubble-icon, #floating-chat-badge, #ai-assistant-fab, .ai-fab-btn, #unified-floating-ask-teacher-btn, [aria-label*="Ask a Teacher" i], [aria-label*="Teacher" i], [aria-label*="Assistant" i], [aria-label*="Chatbot" i], [title*="Ask a Teacher" i], [title*="Teacher" i], [title*="Assistant" i], [title*="Chatbot" i]');
            return !!sel;
          }

          document.addEventListener('click', function(e) {
            var target = e.target;
            if (!target) return;

            if (isLogoElement(target)) {
              e.preventDefault();
              e.stopPropagation();
              navigateParent('home');
              return;
            }

            if (isChatElement(target)) {
              e.preventDefault();
              e.stopPropagation();
              navigateParent('ask-teacher');
              return;
            }
          }, true);
        })();
      </script>
    `;

    const themeBgStyle = `<style>html, body { margin: 0 !important; padding: 0 !important; border: 0 !important; width: 100% !important; height: 100% !important; background-color: ${reqThemeStr === 'light' ? '#f6f9fe' : '#070b14'} !important; color-scheme: ${reqThemeStr === 'light' ? 'light' : 'dark'}; }</style>`;
    const themeClasses = reqThemeStr === 'dark' ? 'dark dark-theme' : 'light';

    if (rawHtml.includes('<html')) {
      rawHtml = rawHtml.replace(/<html([^>]*)>/i, `<html$1 data-theme="${reqThemeStr}" class="${themeClasses}">`);
    }
    if (rawHtml.includes('<body')) {
      if (/(<body[^>]*class=["'])([^"']*)["']/i.test(rawHtml)) {
        rawHtml = rawHtml.replace(/(<body[^>]*class=["'])([^"']*)["']/i, `$1$2 ${themeClasses}" data-theme="${reqThemeStr}"`);
      } else {
        rawHtml = rawHtml.replace(/<body/i, `<body class="${themeClasses}" data-theme="${reqThemeStr}"`);
      }
    }

    rawHtml = rawHtml.replace("<head>", `<head>\n  ${themeBgStyle}\n  ${baseTag}`);
    rawHtml = rawHtml.replace("</head>", `${bridgeScript}</head>`);

    const hasViteMain = fs.existsSync(path.join(projectRoot, "DSA topics", folderName, "src", "main.tsx"));
    if (hasViteMain) {
      const moduleSrcPath = `/DSA topics/${folderName}/src/main.tsx`;
      rawHtml = rawHtml.replace(
        /src=["'][^"']*src\/main\.tsx["']/gi,
        `src="${moduleSrcPath}"`
      );
    }

    if (viteInstance) {
      try {
        const vitePath = `/DSA topics/${folderName}/index.html`;
        rawHtml = await viteInstance.transformIndexHtml(
          vitePath,
          rawHtml
        );
      } catch (e) {
        console.error("Vite index.html transform error for " + folderName + ":", e);
      }
    }

    moduleHtmlCache.set(cacheKey, rawHtml);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.send(rawHtml);
  };

  app.get(["/dsa-modules/:moduleId", "/dsa-modules/:moduleId/"], handleModuleRequest);
  app.get("/dsa-modules/:moduleId/*", (req, res, next) => {
    const rawId = (req.params.moduleId || "").toLowerCase();
    const folderName = resolveFolderName(rawId);

    if (!folderName) {
      return res.status(404).send("Module not found");
    }

    const rawSubpath = req.params[0] || "";
    const subpath = decodeURIComponent(rawSubpath);

    // If requesting subpath that isn't a static file, serve index.html for SPA subrouting
    if (subpath.endsWith(".html") || !path.extname(subpath)) {
      return handleModuleRequest(req, res);
    }

    // Check primary folder public/
    let p = path.join(projectRoot, "DSA topics", folderName, "public", subpath);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return res.sendFile(p);
    }

    // Check primary folder directly
    p = path.join(projectRoot, "DSA topics", folderName, subpath);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return res.sendFile(p);
    }

    // Fallback for BFS if folder is "Breadth  first search" or "BFS"
    if (rawId === "bfs" || rawId.includes("breadth")) {
      const altFolder = folderName === "BFS" ? "Breadth  first search" : "BFS";
      p = path.join(projectRoot, "DSA topics", altFolder, "public", subpath);
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return res.sendFile(p);
      }
      p = path.join(projectRoot, "DSA topics", altFolder, subpath);
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return res.sendFile(p);
      }
    }

    res.status(404).send("Module asset not found");
  });

  // Global fallback route for video files requested at /videos/*
  app.get("/videos/*", (req, res, next) => {
    const rawSubpath = req.params[0] || "";
    const subpath = decodeURIComponent(rawSubpath);

    // 1. Check root public/videos/
    let p = path.join(projectRoot, "public", "videos", subpath);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return res.sendFile(p);
    }

    // 2. Check across all DSA topic folders (public/videos and videos)
    for (const folder of Object.values(MODULE_FOLDER_MAP)) {
      p = path.join(projectRoot, "DSA topics", folder, "public", "videos", subpath);
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return res.sendFile(p);
      }

      p = path.join(projectRoot, "DSA topics", folder, "videos", subpath);
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return res.sendFile(p);
      }
    }

    next();
  });

  // ============================================================
  // HEALTH CHECK
  // ============================================================

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      app: "AlgoLearn API",
      timestamp: new Date().toISOString(),
    });
  });

  // ============================================================
  // BACKEND API PROXY (Port 5000: Express + MongoDB Auth & Students)
  // ============================================================
  const DEFAULT_REMOTE_BACKEND = "https://algolearn-backend-t9c6.onrender.com";
  const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true";
  const configuredBackend = process.env.BACKEND_URL?.trim();

  const BACKEND_URL = (
    configuredBackend ||
    (isProduction ? DEFAULT_REMOTE_BACKEND : "http://127.0.0.1:5000")
  ).replace(/\/+$/, "");

  const isLocalBackend = BACKEND_URL.includes("127.0.0.1") || BACKEND_URL.includes("localhost");

  const ensureBackend = () => {
    if (isProduction || !isLocalBackend) {
      return;
    }
    try {
      const testReq = http.get(`${BACKEND_URL}/api/health`, (_res) => { });
      testReq.on("error", () => {
        try {
          const backendDir = path.resolve(projectRoot, "..", "backend");
          if (fs.existsSync(backendDir)) {
            console.log("⚡ Auto-starting AlgoLearn Backend service on port 5000...");
            const proc = spawn("node", ["server.js"], {
              cwd: backendDir,
              stdio: "inherit",
            });
            proc.on("error", (e) => console.error("Backend process error:", e.message));
          }
        } catch (err: any) {
          console.error("Failed to auto-start backend process:", err.message);
        }
      });
    } catch (e) { }
  };

  if (!isProduction && isLocalBackend) {
    ensureBackend();
  }

  const proxyToBackend = async (req: express.Request, res: express.Response) => {
    try {
      const targetUrl = `${BACKEND_URL}${req.originalUrl}`;

      // Prevent infinite loops if BACKEND_URL accidentally targets this server
      if (
        (BACKEND_URL.includes(`:${PORT}`) && (BACKEND_URL.includes("localhost") || BACKEND_URL.includes("127.0.0.1"))) ||
        (process.env.RENDER_EXTERNAL_URL && BACKEND_URL === process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, ""))
      ) {
        return res.status(508).json({
          error: "Infinite proxy loop detected. BACKEND_URL matches frontend URL.",
        });
      }

      const headers: Record<string, string> = {
        "Content-Type": (req.headers["content-type"] as string) || "application/json",
        Accept: (req.headers["accept"] as string) || "application/json",
      };
      if (req.headers.authorization) {
        headers["Authorization"] = req.headers.authorization as string;
      }
      const options: RequestInit = {
        method: req.method,
        headers,
      };
      if (
        req.method !== "GET" &&
        req.method !== "HEAD" &&
        req.body &&
        Object.keys(req.body).length > 0
      ) {
        options.body = JSON.stringify(req.body);
      }
      const backendRes = await fetch(targetUrl, options);
      const contentType = backendRes.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const data = await backendRes.json().catch(() => ({}));
        return res.status(backendRes.status).json(data);
      } else {
        const text = await backendRes.text().catch(() => "");
        return res.status(backendRes.status).send(text);
      }
    } catch (err: any) {
      console.error("[Backend Proxy Error]", err.message);
      return res.status(503).json({
        error: "Backend service is temporarily unavailable. Please verify backend server.",
        details: err.message,
      });
    }
  };

  app.use("/api/auth", proxyToBackend);
  app.use("/api/students", proxyToBackend);
  app.use("/api/leaderboard", proxyToBackend);

  // ============================================================
  // USER PROGRESS & POINTS API ENDPOINTS
  // ============================================================

  app.get("/api/users", (_req, res) => {
    res.json([]);
  });

  app.get("/api/users/:userId", (req, res) => {
    res.json({ id: req.params.userId, progress: {} });
  });

  app.post("/api/users", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.put("/api/users/:userId/progress", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/users/:userId/reset", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/points/breakdown", (_req, res) => {
    res.json({ points: 0, breakdown: [] });
  });

  app.get("/api/points/*", (_req, res) => {
    res.json({ points: 0 });
  });

  // ============================================================
  // STUDENT QUESTIONS & TEACHER REPLIES STORE
  // ============================================================

  let serverQuestions: any[] = [];

  let serverTeachers: any[] = [];

  // TEACHERS API
  app.get("/api/teachers", (_req, res) => {
    res.json({ teachers: serverTeachers });
  });

  app.post("/api/teachers", (req, res) => {
    const { name, email, subject, description, avatarUrl, avatarInitials, avatarGradient } = req.body;
    if (!name || !subject) {
      return res.status(400).json({ error: "Teacher name and subject are required." });
    }

    const initials =
      avatarInitials ||
      name
        .split(" ")
        .filter(Boolean)
        .map((n: string) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

    const newTeacher = {
      id: req.body.id || "teacher-" + Date.now(),
      name: name.trim(),
      email: email?.trim() || `${name.toLowerCase().replace(/\s+/g, ".")}@algolearn.edu`,
      subject: subject.trim(),
      description: description?.trim() || "",
      avatarInitials: initials,
      avatarGradient: avatarGradient || "from-blue-600 via-indigo-600 to-violet-600",
      avatarUrl: avatarUrl?.trim() || "",
      createdAt: "Just now",
    };

    serverTeachers.unshift(newTeacher);
    res.status(201).json({ teacher: newTeacher });
  });

  app.put("/api/teachers/:id", (req, res) => {
    const { id } = req.params;
    const index = serverTeachers.findIndex((t) => t.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Teacher not found." });
    }

    serverTeachers[index] = {
      ...serverTeachers[index],
      ...req.body,
    };
    res.json({ teacher: serverTeachers[index] });
  });

  app.delete("/api/teachers/:id", (req, res) => {
    const { id } = req.params;
    serverTeachers = serverTeachers.filter((t) => t.id !== id);
    res.json({ success: true, message: "Teacher removed successfully." });
  });

  // QUESTIONS API
  app.get("/api/questions", (_req, res) => {
    res.json({ questions: serverQuestions });
  });

  app.post("/api/questions", (req, res) => {
    const { questionId, id, studentId, studentName, studentAvatar, teacherId, teacherName, teacherSubject, topicTitle, message } = req.body;
    if (!message || !teacherId) {
      return res.status(400).json({ error: "Missing required question parameters." });
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const targetQId = questionId || id;

    // If an existing conversation ID is provided, append student message to the existing thread
    if (targetQId) {
      const existing = serverQuestions.find((q) => q.id === targetQId);
      if (existing) {
        const studentMsg = {
          messageId: "msg-" + Date.now(),
          conversationId: existing.id,
          senderId: studentId || "std-current",
          senderRole: "student",
          senderName: studentName || "Student",
          message,
          createdAt: timeStr,
        };
        existing.messages.push(studentMsg);
        existing.status = "Pending";
        existing.updatedAt = "Today, " + timeStr;
        return res.status(200).json({ question: existing });
      }
    }

    const newQuestion = {
      id: "q-" + Date.now(),
      studentId: studentId || "std-current",
      studentName: studentName || "Student",
      studentAvatar: studentAvatar || "",
      teacherId,
      teacherName: teacherName || "Teacher",
      teacherSubject: teacherSubject || "DSA Expert",
      topicTitle: topicTitle || "Data Structures",
      status: "Pending",
      createdAt: "Today, " + timeStr,
      updatedAt: "Today, " + timeStr,
      messages: [
        {
          messageId: "msg-" + Date.now(),
          conversationId: "q-" + Date.now(),
          senderId: studentId || "std-current",
          senderRole: "student",
          senderName: studentName || "Student",
          message,
          createdAt: timeStr,
        },
      ],
    };

    serverQuestions.unshift(newQuestion);
    res.status(201).json({ question: newQuestion });
  });

  app.post("/api/questions/:id/reply", (req, res) => {
    const { id } = req.params;
    const { answer, teacherName, teacherId } = req.body;
    if (!answer) {
      return res.status(400).json({ error: "Reply message cannot be empty." });
    }

    const question = serverQuestions.find((q) => q.id === id);
    if (!question) {
      return res.status(404).json({ error: "Question not found." });
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const replyMessage = {
      messageId: "msg-reply-" + Date.now(),
      conversationId: id,
      senderId: teacherId || question.teacherId,
      senderRole: "teacher",
      senderName: teacherName || question.teacherName,
      message: answer,
      createdAt: timeStr,
    };

    question.messages.push(replyMessage);
    question.status = "Answered";
    question.updatedAt = "Today, " + timeStr;

    res.json({ question });
  });

  app.delete("/api/questions/:id", (req, res) => {
    const { id } = req.params;
    const { studentId, studentName } = req.query;
    const index = serverQuestions.findIndex((q) => q.id === id);
    if (index !== -1) {
      const q = serverQuestions[index];
      if (
        !studentId ||
        q.studentId === studentId ||
        (studentName && q.studentName === studentName) ||
        q.studentId === "std-current"
      ) {
        serverQuestions.splice(index, 1);
        return res.json({ success: true, message: "Conversation cleared successfully." });
      }
    }
    res.json({ success: true });
  });

  // ============================================================
  // STUDENTS & LEADERBOARD STORE
  // ============================================================

  interface ServerStudent {
    id: string;
    name: string;
    email: string;
    avatar: string;
    regdNo?: string;
    password?: string;
    createdAt: string;
  }

  let serverStudents: ServerStudent[] = [];
  let serverLeaderboard: any[] = [];

  // STUDENTS API
  app.get("/api/students", (_req, res) => {
    res.json({ students: serverStudents });
  });

  app.post("/api/students", (req, res) => {
    const { name, email, regdNo, password } = req.body;

    if (!regdNo || typeof regdNo !== "string") {
      return res.status(400).json({ error: "Regd No. is required." });
    }

    const trimmedRegd = regdNo.trim();
    const regdRegex = /^[A-Za-z0-9]{10}$/;

    if (!regdRegex.test(trimmedRegd)) {
      return res.status(400).json({
        error: "Regd No. must be exactly 10 characters and contain only letters and numbers.",
      });
    }

    // Uniqueness check: No two student accounts can share the same Regd No. (case-insensitive)
    const duplicate = serverStudents.find(
      (s) => s.regdNo && s.regdNo.toUpperCase() === trimmedRegd.toUpperCase()
    );
    if (duplicate) {
      return res.status(400).json({
        error: "Registration Number is already registered to another student account.",
      });
    }

    const studentName = name?.trim() || "Algo Learner";
    const studentEmail = email?.trim().toLowerCase() || `${trimmedRegd.toLowerCase()}@algolearn.edu`;

    const newStudent: ServerStudent = {
      id: "std-" + Date.now(),
      name: studentName,
      email: studentEmail,
      avatar: "",
      regdNo: trimmedRegd,
      password: password || "",
      createdAt: "Just now",
    };

    serverStudents.unshift(newStudent);

    // Add student to serverLeaderboard if not present
    let entry = serverLeaderboard.find((u) => u.id === newStudent.id || u.regdNo === trimmedRegd);
    if (!entry) {
      entry = {
        rank: serverLeaderboard.length + 1,
        id: newStudent.id,
        name: studentName,
        username: studentEmail.split("@")[0] || trimmedRegd.toLowerCase(),
        regdNo: trimmedRegd,
        avatar: "",
        xp: 0,
        streak: 1,
        level: 1,
        tier: "Gold",
        countryCode: "🌐",
        solvedCount: 0,
        badgeTitle: "Algo Scholar",
      };
      serverLeaderboard.push(entry);
    } else {
      entry.name = studentName;
      entry.username = studentEmail.split("@")[0] || trimmedRegd.toLowerCase();
      entry.regdNo = trimmedRegd;
    }

    res.status(201).json({ student: newStudent });
  });



  // ============================================================
  // AI CHAT
  // ============================================================

  const handleAiChat = async (
    req: express.Request,
    res: express.Response
  ) => {
    const startTime = Date.now();

    try {
      const { message, mode, history, code, topic } = req.body;

      // --------------------------------------------------------
      // VALIDATE REQUEST
      // --------------------------------------------------------

      if (!message && !code) {
        return res.status(400).json({
          error: "Please enter a question or provide code.",
        });
      }

      // --------------------------------------------------------
      // CHECK API KEY
      // --------------------------------------------------------

      const apiKey = process.env.GEMINI_API_KEY?.trim();

      if (!apiKey) {
        console.error("GEMINI_API_KEY is missing or empty.");

        return res.status(500).json({
          error: "Gemini API configuration is missing.",
        });
      }

      const client = getGeminiClient();

      if (!client) {
        return res.status(500).json({
          error: "Gemini API configuration is missing.",
        });
      }

      // ========================================================
      // OPTIMIZED ALGOLEARN AI SYSTEM INSTRUCTION
      // ========================================================

      let systemInstruction = `
You are AlgoLearn AI, the AI assistant for the AlgoLearn learning platform.

Your job is to help users with:
1. AlgoLearn website questions.
2. DSA questions.
3. Programming and software-development questions.

ALGOLEARN:
AlgoLearn is an interactive platform for learning Data Structures and Algorithms through explanations, topics, visualizations, animations, quizzes, practice, and AI assistance.

You can answer questions about:
- AlgoLearn
- Home
- Topics
- Visualize
- Quiz
- AI Assistant
- Learning features
- DSA topics
- How to use AlgoLearn
- How to learn topics using AlgoLearn

DSA:
- Arrays
- Strings
- Linked Lists
- Stacks
- Queues
- Trees
- Graphs
- Heaps
- Hash Tables
- Searching
- Sorting
- Recursion
- Dynamic Programming
- Greedy Algorithms
- Backtracking
- Big-O
- Time Complexity
- Space Complexity
- Coding problems

PROGRAMMING:
- JavaScript
- TypeScript
- ReactJS
- React Hooks
- useState
- useEffect
- useContext
- useRef
- Node.js
- Express.js
- MongoDB
- MERN Stack
- HTML
- CSS
- APIs
- Git
- GitHub
- Debugging
- Web development

IMPORTANT:
You are NOT a DSA-only assistant.

Do NOT say:
"I can only answer DSA questions."

If the user asks about AlgoLearn, answer in the context of AlgoLearn.

If the user asks a DSA question, answer the DSA question.

If the user asks a programming question, answer the programming question.

If the user asks about both AlgoLearn and DSA/programming, answer both.

Be clear, accurate, friendly, and beginner-friendly.

For technical questions:
- Explain the concept first.
- Use examples when useful.
- Give code when requested.
- Explain important code.
- Give time and space complexity for algorithm questions when relevant.

For AlgoLearn questions:
- Give practical guidance.
- Do not invent pages, buttons, features, or UI details.
- If you do not know a specific website detail, say so honestly.

For completely unrelated questions, politely explain that AlgoLearn AI is primarily designed for AlgoLearn, DSA, programming, and technical learning.
`;

      // ========================================================
      // SPECIAL MODES
      // ========================================================

      if (mode === "debug") {
        systemInstruction += `
        
DEBUG MODE:
Analyze the provided code.

Identify:
- Syntax errors
- Logic errors
- Runtime errors
- Edge cases
- Performance problems

Then provide:
1. Problem
2. Why it happens
3. Corrected code
4. Explanation
5. Time complexity
6. Space complexity when relevant
`;
      } else if (mode === "explain") {
        systemInstruction += `
        
EXPLAIN MODE:
Explain the concept step-by-step.

Use:
- Simple definition
- Example
- Real-world analogy when useful
- Code when useful
- Big-O when relevant

Assume the user may be a beginner.
`;
      } else if (mode === "practice") {
        systemInstruction += `
        
PRACTICE MODE:
Create a practice problem containing:
- Problem statement
- Input
- Output
- Example
- Constraints
- Hints
- Expected approach
- Time complexity
- Space complexity

Do not immediately give the complete solution unless the user asks.
`;
      }

      // ========================================================
      // CURRENT TOPIC
      // ========================================================

      if (topic) {
        systemInstruction += `

Current topic:
${String(topic).slice(0, 500)}
`;
      }

      // ========================================================
      // LIMIT CONVERSATION HISTORY
      // ========================================================
      //
      // Only the most recent 6 messages are sent.
      // This keeps requests smaller and faster.

      const recentHistory =
        Array.isArray(history) ? history.slice(-6) : [];

      const formattedContents: any[] = [];

      for (const item of recentHistory) {
        if (item.role && item.parts) {
          formattedContents.push({
            role: item.role === "user" ? "user" : "model",
            parts: Array.isArray(item.parts)
              ? item.parts
              : [{ text: String(item.parts) }],
          });
        } else if (item.sender && item.content) {
          formattedContents.push({
            role: item.sender === "user" ? "user" : "model",
            parts: [
              {
                text: String(item.content),
              },
            ],
          });
        }
      }

      // ========================================================
      // CURRENT USER MESSAGE
      // ========================================================

      let promptText = "";

      if (code) {
        promptText += `Code provided by the user:

\`\`\`
${String(code)}
\`\`\`

`;
      }

      promptText +=
        message ||
        "Please analyze and explain the provided code.";

      formattedContents.push({
        role: "user",
        parts: [
          {
            text: promptText,
          },
        ],
      });

      // ========================================================
      // GEMINI MODELS
      // ========================================================
      //
      // Use a fast primary model.
      // If it fails, use the second model as fallback.

      const candidateModels = [
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite",
      ];

      let generatedReply: string | null = null;
      let usedModel = "";
      let lastError: any = null;

      // ========================================================
      // CALL GEMINI
      // ========================================================

      for (const candidate of candidateModels) {
        try {
          console.log(`Trying Gemini model: ${candidate}`);

          const response = await client.models.generateContent({
            model: candidate,
            contents: formattedContents,
            config: {
              systemInstruction,
              temperature: 0.5,

              // Prevent unnecessarily long responses.
              maxOutputTokens: 1200,
            },
          });

          if (response?.text) {
            generatedReply = response.text;
            usedModel = candidate;

            console.log(
              `Gemini response successful using ${candidate}`
            );

            break;
          }
        } catch (modelError: any) {
          lastError = modelError;

          console.error(`Gemini model ${candidate} failed:`, {
            message: modelError?.message || String(modelError),
            status: modelError?.status,
            code: modelError?.code,
            name: modelError?.name,
          });
        }
      }

      // ========================================================
      // SUCCESS
      // ========================================================

      if (generatedReply) {
        const responseTime = Date.now() - startTime;

        console.log(
          `AI response generated in ${responseTime}ms using ${usedModel}`
        );

        return res.json({
          reply: generatedReply,
          model: usedModel,
          responseTime,
        });
      }

      // ========================================================
      // ALL MODELS FAILED
      // ========================================================

      console.error("All Gemini models failed:", {
        message: lastError?.message || String(lastError),
        status: lastError?.status,
        code: lastError?.code,
        name: lastError?.name,
      });

      return res.status(500).json({
        error: "AI Assistant is temporarily unavailable.",
        details:
          process.env.NODE_ENV !== "production"
            ? lastError?.message || String(lastError)
            : undefined,
      });
    } catch (err: any) {
      console.error(
        "API /api/ai handler error:",
        err?.message || err
      );

      return res.status(500).json({
        error:
          "AI Assistant is temporarily unavailable. Please try again.",
      });
    }
  };

  // ============================================================
  // AI ROUTES
  // ============================================================

  app.post("/api/ai", handleAiChat);
  app.post("/api/ai/chat", handleAiChat);

  // ============================================================
  // STATIC ASSETS & VITE DEVELOPMENT SERVER
  // ============================================================

  // Initialize Vite server middleware (transforms module .tsx & styles on the fly)
  const vite = await createViteServer({
    root: projectRoot,
    plugins: [
      {
        name: 'decode-ampersand-paths',
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            if (req.url && req.url.includes('%26')) {
              req.url = req.url.replace(/%26/g, '&');
            }
            next();
          });
        },
      },
    ],
    server: {
      middlewareMode: true,
    },
    appType: "custom",
  });

  viteInstance = vite;

  // Normalize percent-encoded ampersands (%26) in module paths so Vite resolves folder names on disk
  app.use((req, _res, next) => {
    if (req.url && req.url.includes('%26')) {
      req.url = req.url.replace(/%26/g, '&');
    }
    if (req.originalUrl && req.originalUrl.includes('%26')) {
      req.originalUrl = req.originalUrl.replace(/%26/g, '&');
    }
    next();
  });

  app.use(vite.middlewares);

  // Serve public static assets (videos, icons, images)
  app.use(express.static(path.join(projectRoot, "public")));
  app.use("/DSA topics", express.static(path.join(projectRoot, "DSA topics")));

  const distPath = path.join(projectRoot, "dist");
  const hasDist = fs.existsSync(distPath) && fs.existsSync(path.join(distPath, "index.html"));

  if (isProduction && hasDist) {
    // Serve production pre-compiled bundle assets for root application
    app.use(express.static(distPath));
  }

  const indexHtmlCache = new Map<string, string>();

  // SPA Fallback: handle client-side routing while never intercepting API or module routes
  app.get("*", async (req, res, next) => {
    const url = req.originalUrl;
    if (
      url.startsWith("/api/") ||
      url.startsWith("/dsa-modules/") ||
      url.startsWith("/DSA topics/") ||
      url.startsWith("/DSA%20topics/") ||
      url.startsWith("/@") ||
      url.startsWith("/node_modules/")
    ) {
      return next();
    }

    if (isProduction && hasDist) {
      return res.sendFile(path.join(distPath, "index.html"));
    }

    try {
      let template = indexHtmlCache.get(url);
      if (!template) {
        const raw = fs.readFileSync(path.join(projectRoot, "index.html"), "utf-8");
        template = await viteInstance.transformIndexHtml(url, raw);
        indexHtmlCache.set(url, template);
      }
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(template);
    } catch (e) {
      if (viteInstance) viteInstance.ssrFixStacktrace(e as Error);
      next(e);
    }
  });

  // ============================================================
  // START SERVER
  // ============================================================

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n  🚀 AlgoLearn server is running!`);
    console.log(`  ➜ Local:   http://localhost:${PORT}/`);
    console.log(`  ➜ Network: http://0.0.0.0:${PORT}/\n`);

    // Warm-up cache for instant <50ms first module loads
    setTimeout(async () => {
      const ids = ['stack', 'sorting', 'binary-search', 'linear-search', 'hashing', 'queue', 'bfs', 'trees', 'bst', 'sll', 'dll', 'cll', 'dsa-types'];
      for (const id of ids) {
        try {
          await fetch(`http://127.0.0.1:${PORT}/dsa-modules/${id}`);
        } catch { }
      }
      try {
        await fetch(`http://127.0.0.1:${PORT}/`);
      } catch { }
    }, 500);
  });

  server.on("error", (err: any) => {
    console.error("  [Server Error]", err);
  });
}

startServer();