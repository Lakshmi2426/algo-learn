/**
 * Canonical Topic Progress Synchronization & Leaderboard Aggregator
 *
 * Connects the Mastered Score shown on each topic card with the user's
 * actual, persisted progress inside the corresponding topic module.
 *
 * Provides a single source of truth across all 13 DSA topics without double-counting.
 */

import { DSATopic, UserProfile } from '../types';
import { DSA_TOPICS } from '../data/dsaTopics';

export interface TopicProgressSummary {
  topicScores: Record<string, number>; // moduleId -> score (0..100)
  totalEarned: number; // Sum of progress achieved across all topics
  totalPossible: number; // 13 * 100 = 1300
  overallPercentage: number; // Normalized overall percentage (0..100)
  topicsMasteredCount: number; // Count of topics with progress >= 80%
  topicsStartedCount: number; // Count of topics with progress > 0
  totalXP: number; // XP aggregate derived from topic progress
}

// Canonical list of all 13 integrated module IDs
export const CANONICAL_MODULE_IDS = [
  'stack',
  'hashing',
  'linear-search',
  'binary-search',
  'sorting',
  'sll',
  'dll',
  'cll',
  'queue',
  'bfs',
  'trees',
  'bst',
  'dsa-types',
] as const;

export type CanonicalModuleId = typeof CANONICAL_MODULE_IDS[number];

/**
 * Normalizes any topic ID, slug, or title to its canonical module ID.
 */
export function normalizeToModuleId(topicIdOrTitle: string): CanonicalModuleId | null {
  if (!topicIdOrTitle) return null;
  const norm = topicIdOrTitle.toLowerCase().trim();

  if (norm === 'stack' || norm.includes('stack')) return 'stack';
  if (norm === 'hashing' || norm.includes('hashing') || norm.includes('collision')) return 'hashing';
  if (norm === 'linear-search' || norm === 'linear search' || norm.includes('linear search')) return 'linear-search';
  if (
    norm === 'binary-search' ||
    norm === 'binary search' ||
    (norm.includes('binary') && norm.includes('search') && !norm.includes('tree'))
  ) {
    return 'binary-search';
  }
  if (norm === 'sorting' || norm === 'sort' || norm.includes('sorting')) return 'sorting';
  if (norm === 'sll' || norm === 'singly-linked-list' || norm.includes('singly linked')) return 'sll';
  if (norm === 'dll' || norm === 'doubly-linked-list' || norm.includes('doubly linked')) return 'dll';
  if (norm === 'cll' || norm === 'circular-linked-list' || norm.includes('circular linked')) return 'cll';
  if (norm === 'queue' || norm === 'queues' || norm.includes('queue')) return 'queue';
  if (norm === 'bfs' || norm === 'breadth-first-search' || norm.includes('breadth')) return 'bfs';
  if (norm === 'trees' || norm === 'tree' || norm.includes('tree') && !norm.includes('search')) return 'trees';
  if (norm === 'bst' || norm === 'binary-search-tree' || norm === 'binary search tree' || (norm.includes('binary') && norm.includes('tree'))) {
    return 'bst';
  }
  if (
    norm === 'dsa-types' ||
    norm === 'dsa types' ||
    norm === 'data-structures-and-types' ||
    norm.includes('data structure')
  ) {
    return 'dsa-types';
  }

  return null;
}

/**
 * Safe JSON parser for localStorage values.
 */
function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw || raw === 'undefined' || raw === 'null' || raw.trim() === '') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Reads and computes the actual inner module progress (0..100) directly
 * from the module's native storage data in localStorage.
 */
export function readNativeModuleProgress(moduleId: CanonicalModuleId): number {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return 0;

  try {
    switch (moduleId) {
      case 'stack': {
        const raw = localStorage.getItem('stack_master_user_progress_v2');
        const p: any = safeJsonParse(raw);
        if (!p) return 0;

        const completedLabs: number[] = Array.isArray(p.completedLabs) ? p.completedLabs : [];
        const vizCount = Math.min(2, completedLabs.filter((id) => id === 1 || id === 2).length);
        const vizPts = Math.min(20, vizCount * 10);

        const gameScores = p.gameScores || {};
        const completedGames: number[] = Array.isArray(p.completedGameLevels) ? p.completedGameLevels : [];
        const g1 = gameScores[1] !== undefined ? gameScores[1] : (completedGames.includes(1) ? 20 : 0);
        const g2 = gameScores[2] !== undefined ? gameScores[2] : (completedGames.includes(2) ? 20 : 0);
        const gamePts = Math.min(40, Math.max(0, g1 + g2));

        const quizScores = p.quizQuestionScores || {};
        let quizSum = 0;
        Object.values(quizScores).forEach((sc: any) => { quizSum += Number(sc) || 0; });
        const quizPts = Math.min(40, Math.max(0, quizSum));
        const totalPoints = Math.min(100, Math.max(0, vizPts + gamePts + quizPts));

        return totalPoints;
      }

      case 'hashing': {
        let points = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('hash_user_points_') || k === 'hash_quest_points_system_v2')) {
            const ptsObj: any = safeJsonParse(localStorage.getItem(k));
            if (ptsObj) {
              if (typeof ptsObj.totalPoints === 'number') {
                points = Math.max(points, ptsObj.totalPoints);
              } else {
                const viz = typeof ptsObj.visualizePoints === 'number' ? ptsObj.visualizePoints : 0;
                const game = typeof ptsObj.gamePoints === 'number' ? ptsObj.gamePoints : 0;
                const quiz = typeof ptsObj.quizPoints === 'number' ? ptsObj.quizPoints : 0;
                const hints = typeof ptsObj.hintUsesCount === 'number' ? ptsObj.hintUsesCount * 2 : 0;
                const guides = typeof ptsObj.guidedSolveUsesCount === 'number' ? ptsObj.guidedSolveUsesCount * 4 : 0;
                const compTotal = Math.min(100, Math.max(0, viz + game + quiz - hints - guides));
                points = Math.max(points, compTotal);
              }
            }
          }
        }
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('hash_user_progress_')) {
            const progObj: any = safeJsonParse(localStorage.getItem(k));
            if (progObj) {
              const lvls = Array.isArray(progObj.levelsCompleted) ? progObj.levelsCompleted.length : 0;
              const vids = Array.isArray(progObj.completedVideos) ? progObj.completedVideos.length : 0;
              const qScore = typeof progObj.quizFinalScore === 'number' ? progObj.quizFinalScore : 0;
              const computedFromProg = Math.min(100, Math.max(0, (lvls * 10) + (vids * 10) + Math.min(30, qScore)));
              points = Math.max(points, computedFromProg);
            }
          }
        }
        const directKey = localStorage.getItem('algolearn_topic_progress_hashing');
        if (directKey) {
          const parsed = parseInt(directKey, 10);
          if (!isNaN(parsed) && parsed > 0) points = Math.max(points, parsed);
        }
        return Math.min(100, Math.max(0, points));
      }

      case 'linear-search': {
        let points = 0;
        const rawPts = localStorage.getItem('algo_quest_points_system_v3');
        const pts: any = safeJsonParse(rawPts);
        if (pts && typeof pts.totalPoints === 'number') {
          points = pts.totalPoints;
        }
        const direct = localStorage.getItem('algolearn_topic_progress_linear-search');
        if (direct) {
          const num = parseInt(direct, 10);
          if (!isNaN(num) && num > 0) points = Math.max(points, num);
        }
        return Math.min(100, Math.max(0, points));
      }

      case 'binary-search': {
        const raw = localStorage.getItem('binary_search_user_progress_v4');
        const p: any = safeJsonParse(raw);
        if (!p) return 0;

        const totalEarned = p.topicPoints?.totalEarned || 0;
        return Math.min(100, Math.max(0, totalEarned));
      }

      case 'sorting': {
        let p: any = null;
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('sort_master_user_progress_') || k.startsWith('stack_master_user_progress_v2_fresh_reset_'))) {
            const parsed = safeJsonParse<any>(localStorage.getItem(k));
            if (parsed) { p = parsed; break; }
          }
        }
        if (!p) return 0;

        const ledger = p.pointsLedger || {};
        const viz = Math.min(15, Math.max(0, ledger.visualizationPoints || 0));
        const game = Math.min(45, Math.max(0, (ledger.gamePoints || 0) - ((ledger.hintDeductions || 0) + (ledger.guidedSolveDeductions || 0))));
        const quiz = Math.min(40, Math.max(0, (ledger.quizPoints || 0) - (ledger.wrongQuizDeductions || 0)));
        const totalPoints = Math.min(100, Math.max(0, viz + game + quiz));

        const learn = Math.min(6, p.completedTheoryChapters?.length || 0);
        const labs = Math.min(3, p.completedLabs?.length || 0);
        let games = 0;
        if (p.sortGameProgress && typeof p.sortGameProgress === 'object') {
          games = Object.values(p.sortGameProgress).filter((arr: any) => Array.isArray(arr) && arr.length > 0).length;
        }
        if (Array.isArray(ledger.completedGameCardIds) && ledger.completedGameCardIds.length > 0) {
          games = Math.max(games, ledger.completedGameCardIds.length);
        }
        games = Math.min(5, games);
        const quizQ = Math.min(10, p.quizCompletedQuestions?.length || (p.quizCompleted ? 10 : 0));
        const pct = Math.min(100, Math.round(((learn + labs + games + quizQ) / 24) * 100));

        if (totalPoints === 0 && learn === 0 && labs === 0 && games === 0 && quizQ === 0) {
          return 0;
        }

        return Math.max(totalPoints, pct);
      }

      case 'queue': {
        const raw = localStorage.getItem('queue_master_user_progress_v2') || localStorage.getItem('stack_master_user_progress_v1');
        const p: any = safeJsonParse(raw);
        if (!p) return 0;

        const vizCount = Math.min(2, (p.completedLabs || []).length);
        const gameCount = Math.min(4, (p.completedGameLevels || []).length);
        const theoryCount = Math.min(12, (p.completedTheoryChapters || []).length);
        const quizCount = p.quizCompleted ? 1 : 0;
        const completedModules = vizCount + gameCount + theoryCount + quizCount;
        const pct = Math.min(100, Math.round((completedModules / 19) * 100));

        // Queue scoring: viz 20, game 40, quiz 40
        const vizPts = vizCount * 10;
        const gamePts = gameCount * 10;
        const quizPts = p.quizHighScore ? Math.round((p.quizHighScore / 100) * 40) : 0;
        const totalPts = Math.min(100, Math.max(0, vizPts + gamePts + quizPts));

        return totalPts;
      }

      case 'sll': {
        const raw = localStorage.getItem('algolearn_sll_100_points_progress_v4');
        const p: any = safeJsonParse(raw);
        if (!p) return 0;

        const totalPoints = Math.min(100, Math.max(0, p.totalPoints || 0));
        return totalPoints;
      }

      case 'dll': {
        const rawEv = localStorage.getItem('algolearn_scoring_events_v2');
        const events: any[] = safeJsonParse(rawEv) || [];

        let earnedScore = 0;
        if (Array.isArray(events) && events.length > 0) {
          const dllEvents = events.filter((ev) => ev.topicId === 'dll');
          const vizEvents = dllEvents.filter((ev) => ev.activityType === 'VISUALIZE' && ev.reason === 'VIDEO_COMPLETED');
          const gameEvents = dllEvents.filter((ev) => ev.activityType === 'GAME' && ev.reason === 'GAME_TASK_COMPLETED');
          const correctQuiz = dllEvents.filter((ev) => ev.activityType === 'QUIZ' && ev.reason === 'QUIZ_CORRECT');
          const incorrectQuiz = dllEvents.filter((ev) => ev.activityType === 'QUIZ' && ev.reason === 'QUIZ_INCORRECT');
          const hints = dllEvents.filter((ev) => ev.activityType === 'GAME' && ev.reason === 'HINT_USED');
          const guides = dllEvents.filter((ev) => ev.activityType === 'GAME' && ev.reason === 'GUIDED_SOLVE_STEP');

          const vScore = Math.min(16, vizEvents.length * 8);
          const gScore = Math.max(0, gameEvents.length * 6 - (hints.length * 1 + guides.length * 2));
          const qScore = Math.max(0, correctQuiz.length * 3 - incorrectQuiz.length * 1);
          earnedScore = Math.min(100, Math.round(vScore + gScore + qScore));
        }

        return earnedScore;
      }

      case 'cll': {
        const rawPts = localStorage.getItem('cll-learning-points-v5');
        const pts: any = safeJsonParse(rawPts);
        let totalPoints = 0;
        if (pts && typeof pts.totalPoints === 'number') {
          totalPoints = pts.totalPoints;
        }

        return Math.min(100, Math.max(0, totalPoints));
      }

      case 'bfs': {
        const completedVideos: any[] = safeJsonParse(localStorage.getItem('algolearn_completed_videos')) || [];
        const completedLevels: any[] = safeJsonParse(localStorage.getItem('algolearn_completed_levels')) || [];
        const quizAnswers: Record<string, any> = safeJsonParse(localStorage.getItem('algolearn_quiz_answers')) || {};
        const assistance: Record<string, any> = safeJsonParse(localStorage.getItem('algolearn_game_assistance')) || {};

        const videoScore = Math.min(16, completedVideos.length * 8);

        let gamePositive = Math.min(64, completedLevels.length * 8);
        let gamePenalties = 0;
        Object.values(assistance).forEach((ast: any) => {
          if (!ast) return;
          const hints = ast.hintCount || (ast.hintUsed ? 1 : 0);
          const guided = ast.guidedCount || (ast.guidedUsed ? 1 : 0);
          gamePenalties += hints * 3 + guided * 3;
        });
        const gameScore = Math.max(0, gamePositive - gamePenalties);

        let quizCorrect = 0;
        let quizIncorrect = 0;
        Object.values(quizAnswers).forEach((ans: any) => {
          if (ans?.isCorrect === true) quizCorrect++;
          else if (ans?.isCorrect === false) quizIncorrect++;
        });
        const quizScore = Math.max(0, Math.min(20, quizCorrect * 2 - quizIncorrect * 1));

        const finalScore = Math.min(100, videoScore + gameScore + quizScore);
        return finalScore;
      }

      case 'trees': {
        let isVideoDone = false;
        let quizScoreVal = 0;

        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k) continue;
          if (k.includes('video_completed') && localStorage.getItem(k) === 'true') {
            isVideoDone = true;
          }
          if (k.includes('quiz_score')) {
            const parsed: any = safeJsonParse(localStorage.getItem(k));
            if (parsed && typeof parsed.score === 'number') {
              quizScoreVal = Math.max(quizScoreVal, parsed.score);
            }
          }
        }

        const vizPoints = isVideoDone ? 30 : 0;
        const currentQuizPts = Math.max(0, Math.min(70, quizScoreVal));
        const total = Math.min(100, vizPoints + currentQuizPts);
        return total;
      }

      case 'bst': {
        const raw = localStorage.getItem('bst_explorer_user_stats_main');
        const p: any = safeJsonParse(raw);
        if (!p) return 0;

        const totalPoints = typeof p.totalTopicPoints === 'number' ? p.totalTopicPoints : 0;
        return Math.min(100, Math.max(0, totalPoints));
      }

      case 'dsa-types': {
        const raw = localStorage.getItem('algo_ds_types_progress_v1');
        const p: any = safeJsonParse(raw);
        if (!p || !p.topicData) return 0;

        const topicScore = p.topicData.overallTopicScore || 0;
        return Math.min(100, Math.max(0, topicScore));
      }

      default:
        return 0;
    }
  } catch (err) {
    console.error(`Error reading native progress for ${moduleId}:`, err);
    return 0;
  }
}

/**
 * Identifies the currently active authenticated student.
 * Returns a stable key if authenticated, or null for guest visitors.
 */
export function getActiveStudentKey(): string | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
  const isAuth = localStorage.getItem('algolearn_auth') === 'true';
  if (!isAuth) return null;

  try {
    const raw = localStorage.getItem('algolearn_user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    const id = user.regdNo || user.id || user.email || '';
    if (!id || user.name === 'Guest Learner') return null;
    return id.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  } catch {
    return null;
  }
}

export const NATIVE_STORAGE_KEYS = [
  'stack_master_user_progress_v2',
  'hash_quest_field_notes_progress_v2',
  'hash_quest_points_system_v2',
  'hash_quest_user_device_id_v2',
  'hash_quest_sound_settings',
  'linear_search_field_notes_progress_v2',
  'algo_quest_points_system_v3',
  'binary_search_user_progress_v4',
  'queue_master_user_progress_v2',
  'stack_master_user_progress_v1',
  'algolearn_sll_100_points_progress_v4',
  'dll_quest_user_progress_v1',
  'algolearn_scoring_events_v2',
  'cll_mastery_progress_v1',
  'cll-learning-points-v5',
  'bfs_learner_progress_v2',
  'algolearn_completed_videos',
  'algolearn_completed_levels',
  'algolearn_quiz_answers',
  'algolearn_game_assistance',
  'trees_module_progress_v1',
  'bst_mastery_progress_v1',
  'bst_explorer_user_stats_main',
  'algo_ds_types_progress_v1',
  'algolearn_topics_progress',
];

/**
 * Snapshots the currently active native module progress in localStorage.
 */
export function snapshotActiveModuleKeys(): Record<string, string> {
  const result: Record<string, string> = {};
  if (typeof localStorage === 'undefined') return result;

  try {
    for (const key of NATIVE_STORAGE_KEYS) {
      const val = localStorage.getItem(key);
      if (val !== null) result[key] = val;
    }

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (
        k.startsWith('sort_master_user_progress_') ||
        k.startsWith('stack_master_user_progress_v2_fresh_reset_') ||
        k.startsWith('hash_user_progress_') ||
        k.startsWith('hash_user_points_') ||
        k.startsWith('algolearn_topic_progress_') ||
        k.startsWith('cll-') ||
        k.startsWith('bst_') ||
        k.startsWith('algo_') ||
        k.includes('video_completed') ||
        k.includes('quiz_score')
      ) {
        if (!k.startsWith('algolearn_student_progress_')) {
          const val = localStorage.getItem(k);
          if (val !== null) result[k] = val;
        }
      }
    }
  } catch {}

  return result;
}

/**
 * Clears active module storage so one user's progress is never inherited by another.
 * NEVER deletes student-scoped records (algolearn_student_progress_ or algolearn_topic_progress_<regd>_).
 */
export function clearActiveModuleKeys() {
  if (typeof localStorage === 'undefined') return;
  try {
    for (const key of NATIVE_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }

    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith('algolearn_student_progress_')) continue;
      if (
        k.startsWith('sort_master_user_progress_') ||
        k.startsWith('stack_master_user_progress_v2_fresh_reset_') ||
        k.startsWith('hash_user_progress_') ||
        k.startsWith('hash_user_points_') ||
        k === 'algolearn_topics_progress'
      ) {
        toRemove.push(k);
      } else if (k.startsWith('algolearn_topic_progress_')) {
        const suffix = k.replace('algolearn_topic_progress_', '');
        // Only remove canonical topic global keys, never remove student-scoped keys!
        if (CANONICAL_MODULE_IDS.includes(suffix as any)) {
          toRemove.push(k);
        }
      }
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem('algolearn_active_student_marker');
  } catch {}
}

/**
 * Restores a specific student's isolated module progress into localStorage.
 * Does NOT clear active keys on page refresh for the same student.
 */
export function restoreStudentModuleKeys(studentKey: string) {
  if (typeof localStorage === 'undefined' || !studentKey) return;
  try {
    const lastActiveKey = localStorage.getItem('algolearn_active_student_marker');
    // Only clear if switching from a different student
    if (lastActiveKey && lastActiveKey !== studentKey) {
      clearActiveModuleKeys();
    }
    localStorage.setItem('algolearn_active_student_marker', studentKey);

    const raw = localStorage.getItem(`algolearn_student_progress_${studentKey}`);
    if (raw) {
      const data = safeJsonParse<{
        topicScores?: Record<string, number>;
        moduleKeys?: Record<string, string>;
        xp?: number;
      }>(raw);

      if (data) {
        if (data.moduleKeys) {
          Object.entries(data.moduleKeys).forEach(([key, val]) => {
            if (typeof val === 'string' && val !== null) {
              if (lastActiveKey !== studentKey || !localStorage.getItem(key)) {
                localStorage.setItem(key, val);
              }
            }
          });
        }

        if (data.topicScores) {
          const currentTopics = safeJsonParse<Record<string, number>>(localStorage.getItem('algolearn_topics_progress')) || {};
          Object.entries(data.topicScores).forEach(([modId, score]) => {
            const num = Number(score) || 0;
            const existingScoped = parseInt(localStorage.getItem(`algolearn_topic_progress_${studentKey}_${modId}`) || '0', 10) || 0;
            const existingDirect = parseInt(localStorage.getItem(`algolearn_topic_progress_${modId}`) || '0', 10) || 0;
            const best = Math.max(num, existingScoped, existingDirect);

            localStorage.setItem(`algolearn_topic_progress_${studentKey}_${modId}`, String(best));
            localStorage.setItem(`algolearn_topic_progress_${modId}`, String(best));
            currentTopics[modId] = Math.max(currentTopics[modId] || 0, best);
          });
          localStorage.setItem('algolearn_topics_progress', JSON.stringify(currentTopics));
        }
      }
    }

    // Align all student-scoped keys to global direct topic keys
    CANONICAL_MODULE_IDS.forEach((modId) => {
      const scopedVal = localStorage.getItem(`algolearn_topic_progress_${studentKey}_${modId}`);
      if (scopedVal) {
        const num = parseInt(scopedVal, 10);
        if (!isNaN(num) && num > 0) {
          const curDirect = parseInt(localStorage.getItem(`algolearn_topic_progress_${modId}`) || '0', 10) || 0;
          if (num > curDirect) {
            localStorage.setItem(`algolearn_topic_progress_${modId}`, String(num));
          }
        }
      }
    });
  } catch (err) {
    console.error('Error in restoreStudentModuleKeys:', err);
  }
}

/**
 * Gets the authoritative latest score (0..100) for a given topic ID or title.
 * Unauthenticated guests have strictly 0 progress.
 * Authenticated students read their own isolated progress from multiple fallback layers.
 */
export function getTopicScore(topicIdOrTitle: string, explicitUserKey?: string): number {
  const moduleId = normalizeToModuleId(topicIdOrTitle);
  if (!moduleId) return 0;

  if (typeof localStorage === 'undefined') return 0;

  const studentKey = explicitUserKey !== undefined ? explicitUserKey : getActiveStudentKey();

  // If user is not authenticated (guest), progress is strictly 0
  if (!studentKey) {
    return 0;
  }

  let bestScore = 0;

  // 1. Check student-scoped progress record
  const studentDataRaw = localStorage.getItem(`algolearn_student_progress_${studentKey}`);
  const studentData = safeJsonParse<{
    topicScores?: Record<string, number>;
    xp?: number;
  }>(studentDataRaw);

  if (studentData?.topicScores && typeof studentData.topicScores[moduleId] === 'number') {
    bestScore = Math.max(bestScore, studentData.topicScores[moduleId]);
  }

  // 2. Check student-scoped direct key
  const scopedDirect = localStorage.getItem(`algolearn_topic_progress_${studentKey}_${moduleId}`);
  if (scopedDirect) {
    const parsed = parseInt(scopedDirect, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      bestScore = Math.max(bestScore, parsed);
    }
  }

  // 3. Check general direct key
  const direct = localStorage.getItem(`algolearn_topic_progress_${moduleId}`);
  if (direct) {
    const parsed = parseInt(direct, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      bestScore = Math.max(bestScore, parsed);
    }
  }

  // 4. Check algolearn_topics_progress map
  const topicsMap = safeJsonParse<Record<string, number>>(localStorage.getItem('algolearn_topics_progress'));
  if (topicsMap && typeof topicsMap[moduleId] === 'number') {
    bestScore = Math.max(bestScore, topicsMap[moduleId]);
  }

  // 5. Check user's exploredTopics in algolearn_user
  try {
    const rawUser = localStorage.getItem('algolearn_user');
    if (rawUser) {
      const userObj = JSON.parse(rawUser);
      if (Array.isArray(userObj.exploredTopics)) {
        const item = userObj.exploredTopics.find(
          (t: any) => normalizeToModuleId(t.id) === moduleId || normalizeToModuleId(t.title) === moduleId
        );
        if (item && typeof item.progress === 'number') {
          bestScore = Math.max(bestScore, item.progress);
        }
      }
    }
  } catch {}

  // 6. Check native module storage
  const nativeScore = readNativeModuleProgress(moduleId);
  bestScore = Math.min(100, Math.max(bestScore, nativeScore));

  // Align keys so they persist across page refreshes
  if (bestScore > 0) {
    if (scopedDirect !== String(bestScore)) {
      try {
        localStorage.setItem(`algolearn_topic_progress_${studentKey}_${moduleId}`, String(bestScore));
      } catch {}
    }
    if (direct !== String(bestScore)) {
      try {
        localStorage.setItem(`algolearn_topic_progress_${moduleId}`, String(bestScore));
      } catch {}
    }
  }

  return bestScore;
}

/**
 * Persists an updated score (0..100) for a topic for the authenticated student.
 */
export function setTopicScore(topicIdOrTitle: string, score: number, explicitUserKey?: string): number {
  const moduleId = normalizeToModuleId(topicIdOrTitle);
  if (!moduleId) return 0;

  const cleanScore = Math.min(100, Math.max(0, Math.round(score)));
  if (typeof localStorage === 'undefined') return cleanScore;

  const studentKey = explicitUserKey !== undefined ? explicitUserKey : getActiveStudentKey();
  if (!studentKey) {
    return 0;
  }

  // 1. Save student-scoped direct key and global topic key
  localStorage.setItem(`algolearn_topic_progress_${studentKey}_${moduleId}`, String(cleanScore));
  localStorage.setItem(`algolearn_topic_progress_${moduleId}`, String(cleanScore));

  // 2. Update algolearn_topics_progress map
  try {
    const currentTopics = safeJsonParse<Record<string, number>>(localStorage.getItem('algolearn_topics_progress')) || {};
    currentTopics[moduleId] = Math.max(currentTopics[moduleId] || 0, cleanScore);
    localStorage.setItem('algolearn_topics_progress', JSON.stringify(currentTopics));
  } catch {}

  // 3. Update student-scoped full progress record
  const studentDataRaw = localStorage.getItem(`algolearn_student_progress_${studentKey}`);
  const studentData = safeJsonParse<{
    topicScores?: Record<string, number>;
    moduleKeys?: Record<string, any>;
    xp?: number;
  }>(studentDataRaw) || { topicScores: {}, moduleKeys: {}, xp: 0 };

  if (!studentData.topicScores) studentData.topicScores = {};
  studentData.topicScores[moduleId] = Math.max(studentData.topicScores[moduleId] || 0, cleanScore);

  // Snapshot active module keys for this student
  studentData.moduleKeys = snapshotActiveModuleKeys();

  // Compute updated XP (Leaderboard XP = exact sum of topic points)
  let sumScores = 0;
  CANONICAL_MODULE_IDS.forEach((id) => {
    sumScores += (studentData.topicScores?.[id] || (id === moduleId ? cleanScore : 0));
  });
  studentData.xp = sumScores;

  localStorage.setItem(`algolearn_student_progress_${studentKey}`, JSON.stringify(studentData));

  // 4. Update algolearn_user if current user matches
  try {
    const rawUser = localStorage.getItem('algolearn_user');
    if (rawUser) {
      const userObj = JSON.parse(rawUser);
      const uKey = (userObj.regdNo || userObj.id || userObj.email || '').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      if (uKey === studentKey) {
        if (!userObj.exploredTopics) userObj.exploredTopics = [];
        const idx = userObj.exploredTopics.findIndex(
          (t: any) => normalizeToModuleId(t.id) === moduleId || normalizeToModuleId(t.title) === moduleId
        );
        if (idx >= 0) {
          userObj.exploredTopics[idx].progress = Math.max(userObj.exploredTopics[idx].progress || 0, cleanScore);
          userObj.exploredTopics[idx].status = userObj.exploredTopics[idx].progress >= 80 ? 'completed' : 'in_progress';
        } else {
          userObj.exploredTopics.push({
            id: moduleId,
            title: moduleId,
            progress: cleanScore,
            status: cleanScore >= 80 ? 'completed' : cleanScore > 0 ? 'in_progress' : 'not_started',
            lastAccessed: 'Recently',
          });
        }
        userObj.xp = Math.max(userObj.xp || 0, sumScores);
        userObj.topicsMastered = Object.values(studentData.topicScores).filter((sc) => Number(sc) >= 80).length;
        localStorage.setItem('algolearn_user', JSON.stringify(userObj));
      }
    }
  } catch {}

  // 5. Dispatch browser event for reactive update
  try {
    window.dispatchEvent(
      new CustomEvent('algolearn_topic_progress_updated', {
        detail: { moduleId, score: cleanScore, studentKey },
      })
    );
  } catch {}

  return cleanScore;
}

/**
 * Aggregates all topics' real scores across the platform for the active or specified student.
 */
export function getAllTopicsProgress(explicitUserKey?: string): TopicProgressSummary {
  const topicScores: Record<string, number> = {};
  let totalEarned = 0;
  let topicsMasteredCount = 0;
  let topicsStartedCount = 0;

  const studentKey = explicitUserKey !== undefined ? explicitUserKey : getActiveStudentKey();

  if (!studentKey) {
    CANONICAL_MODULE_IDS.forEach((modId) => {
      topicScores[modId] = 0;
    });
    return {
      topicScores,
      totalEarned: 0,
      totalPossible: CANONICAL_MODULE_IDS.length * 100,
      overallPercentage: 0,
      topicsMasteredCount: 0,
      topicsStartedCount: 0,
      totalXP: 0,
    };
  }

  CANONICAL_MODULE_IDS.forEach((modId) => {
    const score = getTopicScore(modId, studentKey);
    topicScores[modId] = score;
    totalEarned += score;
    if (score >= 80) {
      topicsMasteredCount++;
    }
    if (score > 0) {
      topicsStartedCount++;
    }
  });

  const totalPossible = CANONICAL_MODULE_IDS.length * 100;
  const overallPercentage = Math.min(
    100,
    Math.round((totalEarned / totalPossible) * 100)
  );

  // CRITICAL REQUIREMENT 6: Leaderboard XP = sum of earned points across all topics
  const totalXP = totalEarned;

  return {
    topicScores,
    totalEarned,
    totalPossible,
    overallPercentage,
    topicsMasteredCount,
    topicsStartedCount,
    totalXP,
  };
}

/**
 * Harmonizes a UserProfile object with the latest per-topic progress.
 */
export function syncUserProfileWithTopicProgress(user: UserProfile): UserProfile {
  const studentKey = (user.regdNo || user.id || user.email || '').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const isGuest = !studentKey || user.name === 'Guest Learner';

  const summary = isGuest
    ? { topicScores: {} as Record<string, number>, totalEarned: 0, totalPossible: 1300, overallPercentage: 0, topicsMasteredCount: 0, topicsStartedCount: 0, totalXP: 0 }
    : getAllTopicsProgress(studentKey);

  const exploredTopics = DSA_TOPICS.map((topic) => {
    const modId = normalizeToModuleId(topic.id) || normalizeToModuleId(topic.title);
    const existing = user.exploredTopics?.find(
      (t) => normalizeToModuleId(t.id) === modId || normalizeToModuleId(t.title) === modId
    );
    const score = (!isGuest && modId) ? Math.max(summary.topicScores[modId] || 0, existing?.progress || 0) : 0;

    return {
      id: topic.id,
      title: topic.title,
      progress: score,
      lastAccessed: score > 0 ? 'Recently' : (existing?.lastAccessed || 'Not started'),
      status: (score >= 80 ? 'completed' : score > 0 ? 'in_progress' : 'not_started') as 'completed' | 'in_progress' | 'not_started',
    };
  });

  return {
    ...user,
    exploredTopics,
    topicsMastered: isGuest ? 0 : Math.max(summary.topicsMasteredCount, user.topicsMastered || 0),
    xp: isGuest ? 0 : Math.max(user.xp || 0, summary.totalXP),
  };
}
