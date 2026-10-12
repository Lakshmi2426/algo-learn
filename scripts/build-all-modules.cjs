const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'frontend');
const TOPICS_DIR = path.join(FRONTEND_DIR, 'DSA topics');
const OUT_BASE_DIR = path.join(FRONTEND_DIR, 'public', 'dsa-modules');

const MODULES = [
  { id: 'stack', folder: 'Stack' },
  { id: 'queue', folder: 'Queues' },
  { id: 'sll', folder: 'Singly Linked List (SLL)' },
  { id: 'dll', folder: 'Doubly Linked List (DLL)' },
  { id: 'cll', folder: 'Circular Linked List (CLL)' },
  { id: 'binary-search', folder: 'Binary Search' },
  { id: 'linear-search', folder: 'Linear Search' },
  { id: 'trees', folder: 'Trees' },
  { id: 'bst', folder: 'Binary Search Tree' },
  { id: 'bfs', folder: 'Breadth-First Search (BFS)', isStatic: true },
  { id: 'sorting', folder: 'Sorting' },
  { id: 'hashing', folder: 'Hashing-and-Collision-Resolution' },
  { id: 'dsa-types', folder: 'Data Structure and Types' },
];

function getBridgeScript(moduleId) {
  return `
    <script>
      (function() {
        var currentTheme = 'dark';
        function applyCurrentTheme(th) {
          try {
            var isDark = th === 'dark';
            var root = document.documentElement;
            if (isDark) {
              root.classList.add('dark', 'dark-theme');
              root.setAttribute('data-theme', 'dark');
              root.style.colorScheme = 'dark';
              if (document.body) {
                document.body.classList.add('dark', 'dark-theme');
                document.body.setAttribute('data-theme', 'dark');
              }
            } else {
              root.classList.remove('dark', 'dark-theme');
              root.setAttribute('data-theme', 'light');
              root.style.colorScheme = 'light';
              if (document.body) {
                document.body.classList.remove('dark', 'dark-theme');
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

        var initialTheme = 'dark';
        try {
          if (window.parent && window.parent !== window && window.parent.document) {
            initialTheme = window.parent.document.documentElement.classList.contains('dark') ? 'dark' : 'light';
          }
        } catch(e) {}
        if (!initialTheme) {
          try {
            initialTheme = localStorage.getItem('algolearn_theme') || 'dark';
          } catch(e) {}
        }
        applyCurrentTheme(initialTheme);
        currentTheme = initialTheme;

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', function() {
            applyCurrentTheme(currentTheme);
          });
        }

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

        window.addEventListener('message', function(e) {
          if (e.data && e.data.type === 'ALGOLEARN_THEME_CHANGE' && (e.data.theme === 'dark' || e.data.theme === 'light')) {
            currentTheme = e.data.theme;
            applyCurrentTheme(e.data.theme);
          }
        });

        var CURRENT_MODULE_ID = '${moduleId}';

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
                score = Math.min(100, Math.max(0, vPts + gPts + qPts));
              }
            } else if (mid === 'hashing') {
              var pts = 0;
              for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (k && (k.indexOf('hash_user_points_') === 0 || k === 'hash_quest_points_system_v2')) {
                  try { var pObj = JSON.parse(localStorage.getItem(k)); if (pObj && pObj.totalPoints) pts = Math.max(pts, pObj.totalPoints); } catch(e) {}
                }
              }
              score = Math.min(100, Math.max(0, pts));
            } else if (mid === 'linear-search') {
              var pts = 0;
              try { var ptsObj = JSON.parse(localStorage.getItem('algo_quest_points_system_v3')); if (ptsObj && ptsObj.totalPoints) pts = ptsObj.totalPoints; } catch(e) {}
              score = Math.min(100, Math.max(0, pts));
            } else if (mid === 'binary-search') {
              try {
                var p = JSON.parse(localStorage.getItem('binary_search_user_progress_v4'));
                if (p) {
                  var tEarned = (p.topicPoints && p.topicPoints.totalEarned) || 0;
                  score = Math.min(100, Math.max(0, tEarned));
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
                      score = Math.min(100, vz + gm + qz);
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
                  var qPts = p.quizHighScore ? Math.round((p.quizHighScore / 100) * 40) : 0;
                  score = Math.min(100, vz * 10 + gm * 10 + qPts);
                }
              } catch(e) {}
            } else if (mid === 'sll') {
              try {
                var p = JSON.parse(localStorage.getItem('algolearn_sll_100_points_progress_v4'));
                if (p) score = Math.min(100, Math.max(0, p.totalPoints || 0));
              } catch(e) {}
            } else if (mid === 'cll') {
              try {
                var pts = JSON.parse(localStorage.getItem('cll-learning-points-v5') || '{}');
                score = Math.min(100, Math.max(0, pts.totalPoints || 0));
              } catch(e) {}
            } else if (mid === 'bfs') {
              try {
                var lvls = JSON.parse(localStorage.getItem('algolearn_completed_levels') || '[]');
                var vids = JSON.parse(localStorage.getItem('algolearn_completed_videos') || '[]');
                var qAns = JSON.parse(localStorage.getItem('algolearn_quiz_answers') || '{}');
                var vScore = Math.min(16, vids.length * 8);
                var gScore = Math.min(64, lvls.length * 8);
                var qCorr = 0;
                Object.keys(qAns).forEach(function(k) { if (qAns[k] && qAns[k].isCorrect === true) qCorr++; });
                var qScore = Math.min(20, qCorr * 2);
                score = Math.min(100, vScore + gScore + qScore);
              } catch(e) {}
            } else if (mid === 'trees') {
              try {
                var isVid = false; var qVal = 0;
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
                if (p) score = Math.min(100, Math.max(0, p.totalTopicPoints || 0));
              } catch(e) {}
            } else if (mid === 'dsa-types') {
              try {
                var p = JSON.parse(localStorage.getItem('algo_ds_types_progress_v1'));
                if (p && p.topicData) score = Math.min(100, Math.max(0, p.topicData.overallTopicScore || 0));
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

        try {
          localStorage.setItem = function(k, v) {
            origSetItem.apply(this, arguments);
            if (k && !k.startsWith('algolearn_') && !k.startsWith('theme')) {
              setTimeout(broadcastModuleProgress, 100);
            }
          };
        } catch(e) {}

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
}

function injectBridgeIntoHtml(htmlFilePath, moduleId) {
  if (!fs.existsSync(htmlFilePath)) return;
  let html = fs.readFileSync(htmlFilePath, 'utf-8');
  const baseTag = `<base href="/dsa-modules/${moduleId}/">`;
  if (!html.includes('<base href=')) {
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>\n  ${baseTag}`);
    } else if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/(<head[^>]*>)/i, `$1\n  ${baseTag}`);
    }
  }
  if (!html.includes('CURRENT_MODULE_ID')) {
    const bridge = getBridgeScript(moduleId);
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${bridge}\n</head>`);
    } else if (html.includes('<body>')) {
      html = html.replace('<body>', `<head>${bridge}</head>\n<body>`);
    } else {
      html = `${bridge}\n${html}`;
    }
  }
  fs.writeFileSync(htmlFilePath, html, 'utf-8');
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git'].includes(entry.name)) continue;
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function buildAll() {
  const vitePath = path.join(FRONTEND_DIR, 'node_modules', 'vite', 'dist', 'node', 'index.js');
  const vite = await import('file:///' + vitePath.replace(/\\/g, '/'));

  if (!fs.existsSync(OUT_BASE_DIR)) {
    fs.mkdirSync(OUT_BASE_DIR, { recursive: true });
  }

  console.log('🚀 Starting DSA Topic Module builds for production static serving...');

  for (const mod of MODULES) {
    const modOutDir = path.join(OUT_BASE_DIR, mod.id);
    const modHtmlPath = path.join(modOutDir, 'index.html');

    if (fs.existsSync(modHtmlPath)) {
      console.log(`⏩ [${mod.id}] Already built in public/dsa-modules/${mod.id}/ (injecting bridge script if needed)`);
      injectBridgeIntoHtml(modHtmlPath, mod.id);
      continue;
    }

    const modSrcDir = path.join(TOPICS_DIR, mod.folder);
    if (!fs.existsSync(modSrcDir)) {
      console.warn(`⚠️ Topic folder not found: ${mod.folder}`);
      continue;
    }

    if (mod.isStatic) {
      console.log(`📦 [${mod.id}] Copying static module from "${mod.folder}"...`);
      copyDirRecursive(modSrcDir, modOutDir);
      injectBridgeIntoHtml(modHtmlPath, mod.id);
      console.log(`✅ [${mod.id}] Static module ready.`);
      continue;
    }

    console.log(`🔨 [${mod.id}] Building with Vite from "${mod.folder}"...`);
    try {
      await vite.build({
        root: modSrcDir,
        base: './',
        build: {
          outDir: modOutDir,
          emptyOutDir: true,
        },
        logLevel: 'warn',
      });
      injectBridgeIntoHtml(modHtmlPath, mod.id);
      console.log(`✅ [${mod.id}] Successfully built into public/dsa-modules/${mod.id}/`);
    } catch (err) {
      console.error(`❌ [${mod.id}] Build error:`, err.message);
    }
  }

  console.log('🎉 All DSA Topic Modules ready for static production deployment!');
}

buildAll().catch((err) => {
  console.error('Fatal error during module build:', err);
  process.exit(1);
});
