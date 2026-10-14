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
  topicScores: Record<string, number>; // moduleId -> points (0..100)
  topicPoints: Record<string, number>; // moduleId -> Total Points (0..100)
  topicCompletions: Record<string, number>; // moduleId -> Overall Completion % (0..100)
  totalEarned: number; // Sum of points achieved across all topics
  totalPossible: number; // 13 * 100 = 1300
  overallPercentage: number; // Normalized overall percentage (0..100)
  topicsMasteredCount: number; // Count of topics with completion >= 80%
  topicsStartedCount: number; // Count of topics with progress > 0
  totalXP: number; // Leaderboard Total Points = sum of topic Total Points
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

        if (typeof p.totalTopicPoints === 'number') {
          return Math.min(100, p.totalTopicPoints);
        }

        const completedLabs: number[] = Array.isArray(p.completedLabs) ? p.completedLabs : [];
        const vizCount = Math.min(2, completedLabs.filter((id) => id === 1 || id === 2).length);
        const vizPts = Math.min(20, vizCount * 10);

        const gameScores = p.gameScores || {};
        const completedGames: number[] = Array.isArray(p.completedGameLevels) ? p.completedGameLevels : [];
        const g1 = gameScores[1] !== undefined ? gameScores[1] : (completedGames.includes(1) ? 20 : 0);
        const g2 = gameScores[2] !== undefined ? gameScores[2] : (completedGames.includes(2) ? 20 : 0);
        const gamePts = Math.min(40, g1 + g2);

        const quizScores = p.quizQuestionScores || {};
        let quizSum = 0;
        Object.values(quizScores).forEach((sc: any) => { quizSum += Number(sc) || 0; });
        const quizPts = Math.min(40, quizSum);
        const totalPoints = Math.min(100, vizPts + gamePts + quizPts);

        return totalPoints;
      }

      case 'hashing': {
        let points = 0;
        let found = false;
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('hash_user_points_') || k === 'hash_quest_points_system_v2')) {
            const ptsObj: any = safeJsonParse(localStorage.getItem(k));
            if (ptsObj) {
              if (typeof ptsObj.totalPoints === 'number') {
                points = found ? Math.max(points, ptsObj.totalPoints) : ptsObj.totalPoints;
                found = true;
              } else {
                const viz = typeof ptsObj.visualizePoints === 'number' ? ptsObj.visualizePoints : 0;
                const game = typeof ptsObj.gamePoints === 'number' ? ptsObj.gamePoints : 0;
                const quiz = typeof ptsObj.quizPoints === 'number' ? ptsObj.quizPoints : 0;
                const hints = typeof ptsObj.hintUsesCount === 'number' ? ptsObj.hintUsesCount * 2 : 0;
                const guides = typeof ptsObj.guidedSolveUsesCount === 'number' ? ptsObj.guidedSolveUsesCount * 4 : 0;
                const compTotal = Math.min(100, viz + game + quiz - hints - guides);
                points = found ? Math.max(points, compTotal) : compTotal;
                found = true;
              }
            }
          }
        }
        if (!found) {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('hash_user_progress_')) {
              const progObj: any = safeJsonParse(localStorage.getItem(k));
              if (progObj) {
                const lvls = Array.isArray(progObj.levelsCompleted) ? progObj.levelsCompleted.length : 0;
                const vids = Array.isArray(progObj.completedVideos) ? progObj.completedVideos.length : 0;
                const qScore = typeof progObj.quizFinalScore === 'number' ? progObj.quizFinalScore : 0;
                const computedFromProg = Math.min(100, (lvls * 10) + (vids * 10) + Math.min(30, qScore));
                points = computedFromProg;
                found = true;
                break;
              }
            }
          }
        }
        return Math.min(100, points);
      }

      case 'linear-search': {
        let points = 0;
        const rawPts = localStorage.getItem('algo_quest_points_system_v3');
        const pts: any = safeJsonParse(rawPts);
        if (pts && typeof pts.totalPoints === 'number') {
          points = pts.totalPoints;
        }
        return Math.min(100, points);
      }

      case 'binary-search': {
        const raw = localStorage.getItem('binary_search_user_progress_v4');
        const p: any = safeJsonParse(raw);
        if (!p) return 0;

        const totalEarned = p.topicPoints?.totalEarned !== undefined ? p.topicPoints.totalEarned : (p.totalPoints || 0);
        return Math.min(100, totalEarned);
      }

      case 'sorting': {
        let p: any = null;
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('sort_master_user_progress_')) {
            const parsed = safeJsonParse<any>(localStorage.getItem(k));
            if (parsed) { p = parsed; break; }
          }
        }
        if (!p) return 0;

        if (typeof p.totalScore === 'number') return Math.min(100, p.totalScore);
        const ledger = p.pointsLedger || {};
        if (typeof ledger.totalPoints === 'number') return Math.min(100, ledger.totalPoints);
        if (typeof ledger.totalPointsEarned === 'number') return Math.min(100, ledger.totalPointsEarned);

        const viz = Math.min(15, Math.max(0, ledger.visualizationPoints || 0));
        const game = Math.min(45, (ledger.gamePoints || 0) - ((ledger.hintDeductions || 0) + (ledger.guidedSolveDeductions || 0)));
        const quiz = Math.min(40, (ledger.quizPoints || 0) - (ledger.wrongQuizDeductions || 0));
        const totalPoints = Math.min(100, viz + game + quiz);

        return totalPoints;
      }

      case 'queue': {
        const raw = localStorage.getItem('queue_master_user_progress_v2');
        const p: any = safeJsonParse(raw);
        if (!p) return 0;

        if (typeof p.queueScore === 'number') {
          return Math.min(100, p.queueScore);
        }
        if (typeof p.totalTopicPoints === 'number') {
          return Math.min(100, p.totalTopicPoints);
        }
        if (typeof p.totalPoints === 'number') {
          return Math.min(100, p.totalPoints);
        }

        // Authoritative QUEUE_SCORING rules:
        // learn: 0, visualize: 12 pts (6 per lab, max 2 labs),
        // game: 40 pts (lvl 1: 13, lvl 2: 13, lvl 3: 14), quiz: 48 pts (4 per correct, -2 per incorrect)
        const vizCount = Math.min(2, (p.completedLabs || []).filter((id: number) => id >= 1 && id <= 2).length);
        const vizPts = vizCount * 6;

        const completedLevels = new Set(
          (p.completedGameLevels || []).filter((id: number) => id >= 1 && id <= 3)
        );
        let rawGamePts = 0;
        completedLevels.forEach((lvl: any) => {
          rawGamePts += lvl === 3 ? 14 : 13;
        });
        const deductions = Math.max(0, p.queueDeductions || 0);
        const gamePts = Math.min(40, rawGamePts) - deductions;

        let quizPts = 0;
        if (p.quizQuestionResults && typeof p.quizQuestionResults === 'object') {
          const results = Object.values(p.quizQuestionResults);
          const correct = results.filter((r) => r === 'correct').length;
          const incorrect = results.filter((r) => r === 'incorrect').length;
          quizPts = Math.min(48, correct * 4 - incorrect * 2);
        } else if (p.quizHighScore !== undefined) {
          quizPts = p.quizHighScore;
        }

        return Math.min(100, vizPts + gamePts + quizPts);
      }

      case 'sll': {
        const raw = localStorage.getItem('algolearn_sll_100_points_progress_v4');
        const p: any = safeJsonParse(raw);
        if (!p) return 0;

        const totalPoints = Math.min(100, p.totalPoints !== undefined ? p.totalPoints : 0);
        return totalPoints;
      }

      case 'dll': {
        let earnedScore = 0;
        const rawState = localStorage.getItem('dll_field_notes_progress_v2');
        const stateObj: any = safeJsonParse(rawState);
        if (stateObj && typeof stateObj.totalScore === 'number') {
          earnedScore = stateObj.totalScore;
        }

        const rawEv = localStorage.getItem('algolearn_scoring_events_v2');
        const events: any[] = safeJsonParse(rawEv) || [];
        if (Array.isArray(events) && events.length > 0) {
          const dllEvents = events.filter((ev) => ev.topicId === 'dll');
          const vizEvents = dllEvents.filter((ev) => ev.activityType === 'VISUALIZE' && ev.reason === 'VIDEO_COMPLETED');
          const gameEvents = dllEvents.filter((ev) => ev.activityType === 'GAME' && ev.reason === 'GAME_TASK_COMPLETED');
          const correctQuiz = dllEvents.filter((ev) => ev.activityType === 'QUIZ' && ev.reason === 'QUIZ_CORRECT');
          const incorrectQuiz = dllEvents.filter((ev) => ev.activityType === 'QUIZ' && ev.reason === 'QUIZ_INCORRECT');
          const hints = dllEvents.filter((ev) => ev.activityType === 'GAME' && ev.reason === 'HINT_USED');
          const guides = dllEvents.filter((ev) => ev.activityType === 'GAME' && ev.reason === 'GUIDED_SOLVE_STEP');

          const vScore = Math.min(16, vizEvents.length * 8);
          const gScore = gameEvents.length * 6 - (hints.length * 1 + guides.length * 2);
          const qScore = correctQuiz.length * 3 - incorrectQuiz.length * 1;
          const fromEvents = Math.min(100, Math.round(vScore + gScore + qScore));
          earnedScore = Math.max(earnedScore, fromEvents);
        }

        return Math.min(100, earnedScore);
      }

      case 'cll': {
        const rawPts = localStorage.getItem('cll-learning-points-v5');
        const pts: any = safeJsonParse(rawPts);
        let totalPoints = 0;
        if (pts && typeof pts.totalPoints === 'number') {
          totalPoints = pts.totalPoints;
        }

        return Math.min(100, totalPoints);
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
        const gameScore = gamePositive - gamePenalties;

        let quizCorrect = 0;
        let quizIncorrect = 0;
        Object.values(quizAnswers).forEach((ans: any) => {
          if (ans?.isCorrect === true) quizCorrect++;
          else if (ans?.isCorrect === false) quizIncorrect++;
        });
        const quizScore = Math.min(20, quizCorrect * 2 - quizIncorrect * 1);

        const finalScore = Math.min(100, videoScore + gameScore + quizScore);
        return finalScore;
      }

      case 'trees': {
        let isVideoDone = false;
        let quizScoreVal: number | null = null;

        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k) continue;
          if (k.includes('video_completed') && localStorage.getItem(k) === 'true') {
            isVideoDone = true;
          }
          if (k.includes('quiz_score')) {
            const parsed: any = safeJsonParse(localStorage.getItem(k));
            if (parsed && typeof parsed.score === 'number') {
              quizScoreVal = quizScoreVal !== null ? Math.max(quizScoreVal, parsed.score) : parsed.score;
            }
          }
        }

        const vizPoints = isVideoDone ? 30 : 0;
        const currentQuizPts = quizScoreVal !== null ? Math.min(70, quizScoreVal) : 0;
        const total = Math.min(100, vizPoints + currentQuizPts);
        return total;
      }

      case 'bst': {
        const raw = localStorage.getItem('bst_explorer_user_stats_main');
        const p: any = safeJsonParse(raw);
        if (!p) return 0;

        if (typeof p.totalTopicPoints === 'number') {
          return Math.min(100, p.totalTopicPoints);
        }

        const vCount = Array.isArray(p.completedVideos) ? p.completedVideos.length : (Array.isArray(p.completedLessons) ? p.completedLessons.length : 0);
        const viz = Math.min(20, vCount * 4);
        const gScores = p.gameScores || {};
        let rawGame = 0;
        Object.values(gScores).forEach((v: any) => { rawGame += Number(v) || 0; });
        const gCount = Array.isArray(p.completedGameChallenges) ? p.completedGameChallenges.length : 0;
        const game = Math.min(50, rawGame > 0 ? rawGame : gCount * 10);
        const qScores = p.quizQuestionScores || {};
        let rawQuiz = 0;
        Object.values(qScores).forEach((v: any) => { rawQuiz += Number(v) || 0; });
        const quiz = Math.min(30, Object.keys(qScores).length > 0 ? rawQuiz : (p.quizScores?.mainQuiz ? Math.round((p.quizScores.mainQuiz / 100) * 30) : 0));
        return Math.min(100, viz + game + quiz);
      }

      case 'dsa-types': {
        const raw = localStorage.getItem('algo_ds_types_progress_v1');
        const p: any = safeJsonParse(raw);
        if (!p || !p.topicData) return 0;

        const topicScore = p.topicData.overallTopicScore || 0;
        return Math.min(100, topicScore);
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
 * Reads the authoritative Overall Completion percentage (0..100)
 * displayed at the top of each topic's Progress page.
 * Never negative, clamped between 0 and 100.
 */
export function readNativeModuleCompletion(moduleId: CanonicalModuleId): number {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return 0;

  try {
    switch (moduleId) {
      case 'stack': {
        const raw = localStorage.getItem('stack_master_user_progress_v2');
        const p: any = safeJsonParse(raw);
        if (!p) return 0;
        if (typeof p.overallCompletionPercent === 'number') {
          return Math.min(100, Math.max(0, Math.round(p.overallCompletionPercent)));
        }
        const completedLabs: number[] = Array.isArray(p.completedLabs) ? p.completedLabs : [];
        const completedVideosCount = Math.min(2, completedLabs.filter((id) => id === 1 || id === 2).length);
        const completedGamesCount = Math.min(2, (p.completedGameLevels || []).filter((id: number) => id === 1 || id === 2).length);
        const quizScores = p.quizQuestionScores || {};
        const quizQuestionsAnsweredCount = Math.min(10, Object.keys(quizScores).length);
        const theoryCompletedCount = Math.min(12, p.completedTheoryChapters?.length || 0);
        const quizFinishedBonus = p.quizCompleted ? 1 : 0;
        const completedModulesCount = Math.min(
          27,
          theoryCompletedCount + completedVideosCount + completedGamesCount + quizQuestionsAnsweredCount + quizFinishedBonus
        );
        return Math.min(100, Math.max(0, Math.round((completedModulesCount / 27) * 100)));
      }

      case 'queue': {
        const raw = localStorage.getItem('queue_master_user_progress_v2');
        const p: any = safeJsonParse(raw);
        if (!p) return 0;
        const completedLearn = new Set((p.completedTheoryChapters || []).filter((id: number) => id >= 1 && id <= 20)).size;
        const completedVisualize = new Set((p.completedLabs || []).filter((id: number) => id >= 1 && id <= 2)).size;
        const completedGame = new Set((p.completedGameLevels || []).filter((id: number) => id >= 1 && id <= 3)).size;
        const completedQuiz = p.quizCompleted ? 1 : 0;
        const totalModules = 26; // 20 learn + 2 visualize + 3 game + 1 quiz
        const completedModules = Math.min(totalModules, completedLearn + completedVisualize + completedGame + completedQuiz);
        return Math.min(100, Math.max(0, Math.round((completedModules / totalModules) * 100)));
      }

      case 'hashing': {
        let progObj: any = null;
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('hash_user_progress_') || k === 'hash_quest_field_notes_progress_v2')) {
            const parsed = safeJsonParse<any>(localStorage.getItem(k));
            if (parsed) {
              progObj = parsed;
              break;
            }
          }
        }
        if (!progObj) return 0;
        const theoryDone = Array.isArray(progObj.completedTheoryChapters) ? progObj.completedTheoryChapters.length : 0;
        const videoDone = Array.isArray(progObj.completedVideos) ? progObj.completedVideos.length : 0;
        const rawLevels = Array.isArray(progObj.levelsCompleted) ? progObj.levelsCompleted : [];
        const gameDone = new Set(rawLevels.filter((lvl: number) => lvl >= 1 && lvl <= 5)).size;
        const quizDone = progObj.quizSubmitted ? 1 : 0;
        const completed = Math.min(12, theoryDone) + Math.min(2, videoDone) + Math.min(5, gameDone) + quizDone;
        const isAllComplete = theoryDone >= 12 && videoDone >= 2 && gameDone >= 5 && quizDone >= 1;
        return isAllComplete ? 100 : Math.min(99, Math.max(0, Math.round((completed / 20) * 100)));
      }

      case 'linear-search': {
        const progObj: any = safeJsonParse(localStorage.getItem('linear_search_field_notes_progress_v2'));
        if (!progObj) return 0;
        const theoryDone = Array.isArray(progObj.completedTheoryChapters) ? progObj.completedTheoryChapters.length : 0;
        const videoDone = Array.isArray(progObj.completedVideos) ? progObj.completedVideos.length : 0;
        const rawLevels = Array.isArray(progObj.levelsCompleted) ? progObj.levelsCompleted : [];
        const gameDone = new Set(rawLevels.filter((lvl: number) => lvl >= 1 && lvl <= 4)).size;
        const quizDone = progObj.quizSubmitted ? 1 : 0;
        const completed = Math.min(12, theoryDone) + Math.min(2, videoDone) + Math.min(4, gameDone) + quizDone;
        const isAllComplete = theoryDone >= 12 && videoDone >= 2 && gameDone >= 4 && quizDone >= 1;
        return isAllComplete ? 100 : Math.min(99, Math.max(0, Math.round((completed / 19) * 100)));
      }

      case 'binary-search': {
        const raw = localStorage.getItem('binary_search_user_progress_v4');
        const p: any = safeJsonParse(raw);
        if (!p) return 0;
        const totalEarned = p.topicPoints?.totalEarned !== undefined ? p.topicPoints.totalEarned : (p.totalPoints || 0);
        return Math.min(100, Math.max(0, Math.round(totalEarned)));
      }

      case 'sorting': {
        let p: any = null;
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('sort_master_user_progress_')) {
            const parsed = safeJsonParse<any>(localStorage.getItem(k));
            if (parsed) { p = parsed; break; }
          }
        }
        if (!p) return 0;
        const ledger = p.pointsLedger || {};
        const completedLearnCount = Math.min(6, (p.completedTheoryChapters?.length || 0));
        const completedVideosCount = Math.min(3, (p.completedLabs?.length || ledger.completedVideoIds?.length || 0));
        const completedGamesCount = Math.min(5, (p.completedGameLevels?.length || ledger.completedGameCardIds?.length || 0));
        const completedQuizCount = Math.min(10, Object.keys(ledger.quizQuestionRecords || p.quizQuestionScores || {}).length);
        const completedActivities = completedLearnCount + completedVideosCount + completedGamesCount + completedQuizCount;
        return Math.min(100, Math.max(0, Math.round((completedActivities / 24) * 100)));
      }

      case 'sll': {
        const raw = localStorage.getItem('algolearn_sll_100_points_progress_v4');
        const p: any = safeJsonParse(raw);
        if (!p) return 0;
        const totalPoints = p.totalPoints !== undefined ? p.totalPoints : 0;
        return Math.min(100, Math.max(0, Math.round(totalPoints)));
      }

      case 'dll': {
        const rawState = localStorage.getItem('dll_field_notes_progress_v2');
        const stateObj: any = safeJsonParse(rawState);
        const rawEv = localStorage.getItem('algolearn_scoring_events_v2');
        const events: any[] = safeJsonParse(rawEv) || [];
        const theoryDone = Math.min(12, (stateObj?.completedTheoryChapters || []).length);
        let vDone = 0;
        let gDone = 0;
        let qDone = 0;
        if (Array.isArray(events) && events.length > 0) {
          const dllEvents = events.filter((ev) => ev.topicId === 'dll');
          vDone = new Set(dllEvents.filter((ev) => ev.activityType === 'VISUALIZE' && ev.reason === 'VIDEO_COMPLETED').map((ev) => ev.activityId)).size;
          gDone = new Set(dllEvents.filter((ev) => ev.activityType === 'GAME' && ev.reason === 'GAME_TASK_COMPLETED').map((ev) => ev.activityId)).size;
          qDone = new Set(dllEvents.filter((ev) => ev.activityType === 'QUIZ').map((ev) => ev.activityId)).size;
        }
        const completed = theoryDone + Math.min(2, vDone) + Math.min(6, gDone) + Math.min(10, qDone);
        return Math.min(100, Math.max(0, Math.round((completed / 30) * 100)));
      }

      case 'cll': {
        const raw = localStorage.getItem('cll_field_notes_progress_v2') || localStorage.getItem('cll_mastery_progress_v1');
        const p: any = safeJsonParse(raw);
        if (!p) return 0;
        const theoryDone = Array.isArray(p.completedTheoryChapters) ? p.completedTheoryChapters.length : 0;
        const videoDone = Array.isArray(p.completedVideos) ? p.completedVideos.length : 0;
        const rawLevels = Array.isArray(p.levelsCompleted) ? p.levelsCompleted : [];
        const gameDone = new Set(rawLevels.filter((lvl: number) => lvl >= 1 && lvl <= 5)).size;
        const quizDone = p.quizSubmitted ? 1 : 0;
        const completed = Math.min(17, theoryDone) + Math.min(2, videoDone) + Math.min(5, gameDone) + quizDone;
        const isAll = theoryDone >= 17 && videoDone >= 2 && gameDone >= 5 && quizDone >= 1;
        return isAll ? 100 : Math.min(99, Math.max(0, Math.round((completed / 25) * 100)));
      }

      case 'bfs': {
        const completedVideos: any[] = safeJsonParse(localStorage.getItem('algolearn_completed_videos')) || [];
        const completedLevels: any[] = safeJsonParse(localStorage.getItem('algolearn_completed_levels')) || [];
        const quizAnswers: Record<string, any> = safeJsonParse(localStorage.getItem('algolearn_quiz_answers')) || {};
        const bfsProg: any = safeJsonParse(localStorage.getItem('bfs_learner_progress_v2')) || {};
        const learnDone = Math.min(12, (bfsProg.completedChapters || []).length);
        const videoDone = Math.min(2, completedVideos.length);
        const gameDone = Math.min(8, completedLevels.length);
        const quizDone = Math.min(10, Object.keys(quizAnswers).length);
        const completed = learnDone + videoDone + gameDone + quizDone;
        return Math.min(100, Math.max(0, Math.round((completed / 32) * 100)));
      }

      case 'trees': {
        let completedTopicsCount = 0;
        let isVideoDone = false;
        let isQuizDone = false;
        let scoreVal = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k) continue;
          if (k.includes('completed_topics')) {
            const parsed: any = safeJsonParse(localStorage.getItem(k));
            if (Array.isArray(parsed)) completedTopicsCount = Math.max(completedTopicsCount, parsed.length);
          }
          if (k.includes('video_completed') && localStorage.getItem(k) === 'true') {
            isVideoDone = true;
          }
          if (k.includes('quiz_score')) {
            const parsed: any = safeJsonParse(localStorage.getItem(k));
            if (parsed && typeof parsed.score === 'number') {
              scoreVal = Math.max(scoreVal, parsed.score);
            }
          }
          if (k.includes('quiz_state')) {
            const parsed: any = safeJsonParse(localStorage.getItem(k));
            if (parsed?.confirmedQuestions && Object.keys(parsed.confirmedQuestions).length >= 14) {
              isQuizDone = true;
            }
          }
        }
        const isMastery = (isVideoDone ? 30 : 0) + scoreVal >= 70;
        const completed = Math.min(10, Math.min(7, completedTopicsCount) + (isVideoDone ? 1 : 0) + (isQuizDone ? 1 : 0) + (isMastery ? 1 : 0));
        return Math.min(100, Math.max(0, Math.round((completed / 10) * 100)));
      }

      case 'bst': {
        const raw = localStorage.getItem('bst_explorer_user_stats_main');
        const p: any = safeJsonParse(raw);
        if (!p) return 0;
        const learnCount = Array.isArray(p.completedTopics) ? Math.min(20, p.completedTopics.length) : 0;
        const vCount = Array.isArray(p.completedVideos) ? Math.min(5, p.completedVideos.length) : (Array.isArray(p.completedLessons) ? Math.min(5, p.completedLessons.length) : 0);
        const gCount = Array.isArray(p.completedGameChallenges) ? Math.min(5, p.completedGameChallenges.length) : 0;
        const qCount = p.quizQuestionScores ? Math.min(10, Object.keys(p.quizQuestionScores).length) : (p.quizScores?.mainQuiz ? 10 : 0);
        const completed = Math.min(40, learnCount + vCount + gCount + qCount);
        return Math.min(100, Math.max(0, Math.round((completed / 40) * 100)));
      }

      case 'dsa-types': {
        const raw = localStorage.getItem('algo_ds_types_progress_v1');
        const p: any = safeJsonParse(raw);
        if (!p || !p.topicData) return 0;
        if (typeof p.topicData.completionPercentage === 'number') {
          return Math.min(100, Math.max(0, Math.round(p.topicData.completionPercentage)));
        }
        const completedVideos = Math.min(2, p.topicData.completedVideosCount || 0);
        const completedQuestions = Math.min(10, p.topicData.answeredOrTimedOutQuizCount || 0);
        const total = completedVideos + completedQuestions;
        return Math.min(100, Math.max(0, Math.round((total / 12) * 100)));
      }

      default:
        return 0;
    }
  } catch (err) {
    console.error(`Error reading native completion for ${moduleId}:`, err);
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
  'dll_field_notes_progress_v2',
  'dll_quest_user_progress_v1',
  'algolearn_scoring_events_v2',
  'cll_field_notes_progress_v2',
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
  'algolearn_topics_completions',
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
      // NEVER delete student-scoped persistent progress:
      if (k.startsWith('algolearn_student_progress_')) continue;
      if (k.startsWith('algolearn_student_questions_')) continue;
      // Do not delete user account authentication keys:
      if (
        k === 'algolearn_user' ||
        k === 'algolearn_auth' ||
        k === 'algolearn_token' ||
        k === 'algolearn_role' ||
        k === 'algolearn_registered_students'
      ) continue;

      // Check if this is an unscoped canonical topic key:
      if (k.startsWith('algolearn_topic_progress_')) {
        const suffix = k.replace('algolearn_topic_progress_', '');
        if (CANONICAL_MODULE_IDS.includes(suffix as any)) {
          toRemove.push(k);
        }
        continue;
      }
      if (k.startsWith('algolearn_topic_completion_')) {
        const suffix = k.replace('algolearn_topic_completion_', '');
        if (CANONICAL_MODULE_IDS.includes(suffix as any)) {
          toRemove.push(k);
        }
        continue;
      }

      // If it's a student-scoped key (e.g. algolearn_topic_progress_2300030001_stack), keep it!
      if (
        k.startsWith('algolearn_topic_progress_') ||
        k.startsWith('algolearn_topic_completion_')
      ) {
        continue;
      }

      // Remove any active module session keys:
      if (
        k === 'algolearn_topics_progress' ||
        k === 'algolearn_topics_completions' ||
        k === 'algo_quest_points_system_v3' ||
        k === 'algo_quest_points_system_v2' ||
        k.startsWith('sort_master_user_progress_') ||
        k.startsWith('stack_master_user_progress_') ||
        k.startsWith('hash_user_progress_') ||
        k.startsWith('hash_user_points_') ||
        k.startsWith('queue_master_user_progress_') ||
        k.startsWith('binary_search_user_progress_') ||
        k.startsWith('bfs_learner_progress_') ||
        k.startsWith('trees_module_progress_') ||
        k.startsWith('bst_') ||
        k.startsWith('cll') ||
        k.startsWith('dll_') ||
        k.startsWith('sll_') ||
        k.startsWith('algo_') ||
        k.startsWith('linear_search_') ||
        k.includes('video_completed') ||
        k.includes('quiz_score') ||
        k.includes('quiz_answers') ||
        k.includes('game_assistance') ||
        k.includes('scoring_events')
      ) {
        toRemove.push(k);
      }
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem('algolearn_active_student_marker');
  } catch {}
}

/**
 * Initializes a new student's progress and points strictly to 0 across all topics.
 */
export function initNewStudentProgress(studentKey: string) {
  if (typeof localStorage === 'undefined' || !studentKey) return;
  try {
    const initialData = {
      topicScores: {} as Record<string, number>,
      topicCompletions: {} as Record<string, number>,
      moduleKeys: {} as Record<string, string>,
      xp: 0,
    };
    CANONICAL_MODULE_IDS.forEach((modId) => {
      initialData.topicScores[modId] = 0;
      initialData.topicCompletions[modId] = 0;
      localStorage.setItem(`algolearn_topic_progress_${studentKey}_${modId}`, "0");
      localStorage.setItem(`algolearn_topic_completion_${studentKey}_${modId}`, "0");
      localStorage.setItem(`algolearn_topic_progress_${modId}`, "0");
      localStorage.setItem(`algolearn_topic_completion_${modId}`, "0");
    });
    localStorage.setItem(`algolearn_student_progress_${studentKey}`, JSON.stringify(initialData));
    localStorage.setItem('algolearn_topics_progress', '{}');
    localStorage.setItem('algolearn_topics_completions', '{}');
    localStorage.setItem('algolearn_active_student_marker', studentKey);
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
    // Clear active keys if switching from a different student or if no marker exists
    if (!lastActiveKey || lastActiveKey !== studentKey) {
      clearActiveModuleKeys();
    }
    localStorage.setItem('algolearn_active_student_marker', studentKey);

    const raw = localStorage.getItem(`algolearn_student_progress_${studentKey}`);
    if (raw) {
      const data = safeJsonParse<{
        topicScores?: Record<string, number>;
        topicCompletions?: Record<string, number>;
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

        const currentTopics = safeJsonParse<Record<string, number>>(localStorage.getItem('algolearn_topics_progress')) || {};
        if (data.topicScores) {
          Object.entries(data.topicScores).forEach(([modId, score]) => {
            const num = Number(score);
            if (!isNaN(num)) {
              localStorage.setItem(`algolearn_topic_progress_${studentKey}_${modId}`, String(num));
              localStorage.setItem(`algolearn_topic_progress_${modId}`, String(num));
              currentTopics[modId] = num;
            }
          });
        }
        localStorage.setItem('algolearn_topics_progress', JSON.stringify(currentTopics));

        const currentCompletions = safeJsonParse<Record<string, number>>(localStorage.getItem('algolearn_topics_completions')) || {};
        if (data.topicCompletions) {
          Object.entries(data.topicCompletions).forEach(([modId, comp]) => {
            const num = Number(comp);
            if (!isNaN(num)) {
              localStorage.setItem(`algolearn_topic_completion_${studentKey}_${modId}`, String(num));
              localStorage.setItem(`algolearn_topic_completion_${modId}`, String(num));
              currentCompletions[modId] = num;
            }
          });
        }
        localStorage.setItem('algolearn_topics_completions', JSON.stringify(currentCompletions));
      }
    } else {
      // If student has no recorded local state, initialize clean 0s for this new user
      initNewStudentProgress(studentKey);
    }

    // Align all student-scoped keys to global direct topic keys
    CANONICAL_MODULE_IDS.forEach((modId) => {
      const scopedScore = localStorage.getItem(`algolearn_topic_progress_${studentKey}_${modId}`);
      if (scopedScore !== null && scopedScore !== undefined) {
        const num = parseInt(scopedScore, 10);
        if (!isNaN(num)) {
          localStorage.setItem(`algolearn_topic_progress_${modId}`, String(num));
        }
      } else {
        localStorage.setItem(`algolearn_topic_progress_${modId}`, "0");
      }
      const scopedComp = localStorage.getItem(`algolearn_topic_completion_${studentKey}_${modId}`);
      if (scopedComp !== null && scopedComp !== undefined) {
        const num = parseInt(scopedComp, 10);
        if (!isNaN(num)) {
          localStorage.setItem(`algolearn_topic_completion_${modId}`, String(num));
        }
      } else {
        localStorage.setItem(`algolearn_topic_completion_${modId}`, "0");
      }
    });
  } catch (err) {
    console.error('Error in restoreStudentModuleKeys:', err);
  }
}

/**
 * Gets the authoritative latest Total Points earned (out of 100) for a given topic.
 * Unauthenticated guests have strictly 0 points.
 * Authenticated students read strictly their own earned points.
 */
export function getTopicScore(topicIdOrTitle: string, explicitUserKey?: string): number {
  const moduleId = normalizeToModuleId(topicIdOrTitle);
  if (!moduleId) return 0;

  if (typeof localStorage === 'undefined') return 0;

  const activeKey = getActiveStudentKey();
  const studentKey = explicitUserKey !== undefined ? explicitUserKey : activeKey;

  // If user is not authenticated (guest), points are strictly 0
  if (!studentKey) {
    return 0;
  }

  // 1. Check student's own scoped direct key
  const scopedDirectRaw = localStorage.getItem(`algolearn_topic_progress_${studentKey}_${moduleId}`);
  const scopedDirect = scopedDirectRaw !== null ? parseInt(scopedDirectRaw, 10) : null;

  // 2. Check student's own scoped progress record
  const studentDataRaw = localStorage.getItem(`algolearn_student_progress_${studentKey}`);
  const studentData = safeJsonParse<{
    topicScores?: Record<string, number>;
    xp?: number;
  }>(studentDataRaw);
  const studentRecordedScore = studentData?.topicScores && typeof studentData.topicScores[moduleId] === 'number'
    ? studentData.topicScores[moduleId]
    : null;

  // IMPORTANT: If querying another student (not the active student), NEVER read active native module progress!
  // Active native module progress in localStorage belongs only to the currently logged in student.
  if (studentKey !== activeKey) {
    if (scopedDirect !== null && !isNaN(scopedDirect)) {
      return Math.min(100, Math.max(0, scopedDirect));
    }
    if (studentRecordedScore !== null && !isNaN(studentRecordedScore)) {
      return Math.min(100, Math.max(0, studentRecordedScore));
    }
    return 0; // Other student has no recorded score for this topic -> 0
  }

  // Active student: Check if currently actively playing in this session
  const activeMarker = localStorage.getItem('algolearn_active_student_marker');
  let nativeScore = 0;
  if (activeMarker === studentKey) {
    nativeScore = readNativeModuleProgress(moduleId);
  }

  let finalScore = 0;
  if (scopedDirect !== null && !isNaN(scopedDirect)) {
    finalScore = scopedDirect;
    if (nativeScore > finalScore) {
      finalScore = nativeScore;
    }
  } else if (studentRecordedScore !== null && !isNaN(studentRecordedScore)) {
    finalScore = studentRecordedScore;
    if (nativeScore > finalScore) {
      finalScore = nativeScore;
    }
  } else if (nativeScore > 0) {
    finalScore = nativeScore;
  } else {
    // New user with no scores -> STRICTLY 0 (never inherit unscoped global keys)
    finalScore = 0;
  }

  finalScore = Math.min(100, Math.max(0, finalScore));

  // Align scoped key so it persists for this active student
  if (scopedDirectRaw !== String(finalScore)) {
    try {
      localStorage.setItem(`algolearn_topic_progress_${studentKey}_${moduleId}`, String(finalScore));
    } catch {}
  }
  if (localStorage.getItem(`algolearn_topic_progress_${moduleId}`) !== String(finalScore)) {
    try {
      localStorage.setItem(`algolearn_topic_progress_${moduleId}`, String(finalScore));
    } catch {}
  }

  return finalScore;
}

export const getTopicPoints = getTopicScore;

/**
 * Gets the authoritative Overall Completion percentage (0..100) for a given topic.
 * Strictly isolated per student.
 */
export function getTopicCompletion(topicIdOrTitle: string, explicitUserKey?: string): number {
  const moduleId = normalizeToModuleId(topicIdOrTitle);
  if (!moduleId) return 0;

  if (typeof localStorage === 'undefined') return 0;

  const activeKey = getActiveStudentKey();
  const studentKey = explicitUserKey !== undefined ? explicitUserKey : activeKey;
  if (!studentKey) {
    return 0; // Guest learners have strictly 0 completion
  }

  // 1. Check student-scoped direct completion key
  const scopedDirectRaw = localStorage.getItem(`algolearn_topic_completion_${studentKey}_${moduleId}`);
  const scopedDirect = scopedDirectRaw !== null ? parseInt(scopedDirectRaw, 10) : null;

  // 2. Check student-scoped completion record
  const studentDataRaw = localStorage.getItem(`algolearn_student_progress_${studentKey}`);
  const studentData = safeJsonParse<{
    topicScores?: Record<string, number>;
    topicCompletions?: Record<string, number>;
    xp?: number;
  }>(studentDataRaw);
  const studentRecordedComp = studentData?.topicCompletions && typeof studentData.topicCompletions[moduleId] === 'number'
    ? studentData.topicCompletions[moduleId]
    : null;

  // If querying another student, only return that student's own record:
  if (studentKey !== activeKey) {
    if (scopedDirect !== null && !isNaN(scopedDirect)) {
      return Math.min(100, Math.max(0, scopedDirect));
    }
    if (studentRecordedComp !== null && !isNaN(studentRecordedComp)) {
      return Math.min(100, Math.max(0, studentRecordedComp));
    }
    return 0;
  }

  // Active student: Check native completion if marker matches
  const activeMarker = localStorage.getItem('algolearn_active_student_marker');
  let nativeComp = 0;
  if (activeMarker === studentKey) {
    nativeComp = readNativeModuleCompletion(moduleId);
  }

  let finalComp = 0;
  if (scopedDirect !== null && !isNaN(scopedDirect)) {
    finalComp = scopedDirect;
    if (nativeComp > finalComp) {
      finalComp = nativeComp;
    }
  } else if (studentRecordedComp !== null && !isNaN(studentRecordedComp)) {
    finalComp = studentRecordedComp;
    if (nativeComp > finalComp) {
      finalComp = nativeComp;
    }
  } else if (nativeComp > 0) {
    finalComp = nativeComp;
  } else {
    // New user -> STRICTLY 0
    finalComp = 0;
  }

  finalComp = Math.max(0, Math.min(100, Math.round(finalComp)));

  if (scopedDirectRaw !== String(finalComp)) {
    try {
      localStorage.setItem(`algolearn_topic_completion_${studentKey}_${moduleId}`, String(finalComp));
    } catch {}
  }
  if (localStorage.getItem(`algolearn_topic_completion_${moduleId}`) !== String(finalComp)) {
    try {
      localStorage.setItem(`algolearn_topic_completion_${moduleId}`, String(finalComp));
    } catch {}
  }

  return finalComp;
}

/**
 * Persists an updated score (points out of 100) for a topic for the authenticated student.
 */
export function setTopicScore(topicIdOrTitle: string, score: number, explicitUserKey?: string): number {
  const moduleId = normalizeToModuleId(topicIdOrTitle);
  if (!moduleId) return 0;

  const cleanScore = Math.min(100, Math.round(score));
  if (typeof localStorage === 'undefined') return cleanScore;

  const studentKey = explicitUserKey !== undefined ? explicitUserKey : getActiveStudentKey();
  if (!studentKey) {
    return 0;
  }

  // 1. Save student-scoped direct key
  localStorage.setItem(`algolearn_topic_progress_${studentKey}_${moduleId}`, String(cleanScore));

  const activeKey = getActiveStudentKey();
  if (studentKey === activeKey) {
    localStorage.setItem(`algolearn_topic_progress_${moduleId}`, String(cleanScore));
    // 2. Update algolearn_topics_progress map
    try {
      const currentTopics = safeJsonParse<Record<string, number>>(localStorage.getItem('algolearn_topics_progress')) || {};
      currentTopics[moduleId] = cleanScore;
      localStorage.setItem('algolearn_topics_progress', JSON.stringify(currentTopics));
    } catch {}
  }

  // 3. Update student-scoped full progress record
  const studentDataRaw = localStorage.getItem(`algolearn_student_progress_${studentKey}`);
  const studentData = safeJsonParse<{
    topicScores?: Record<string, number>;
    topicCompletions?: Record<string, number>;
    moduleKeys?: Record<string, any>;
    xp?: number;
  }>(studentDataRaw) || { topicScores: {}, topicCompletions: {}, moduleKeys: {}, xp: 0 };

  if (!studentData.topicScores) studentData.topicScores = {};
  studentData.topicScores[moduleId] = cleanScore;

  // Snapshot active module keys for this student
  studentData.moduleKeys = snapshotActiveModuleKeys();

  // Compute updated XP (Leaderboard Total Points = exact sum of topic Total Points)
  let sumScores = 0;
  CANONICAL_MODULE_IDS.forEach((id) => {
    sumScores += (studentData.topicScores?.[id] || (id === moduleId ? cleanScore : 0));
  });
  studentData.xp = sumScores;

  localStorage.setItem(`algolearn_student_progress_${studentKey}`, JSON.stringify(studentData));

  // 4. Update algolearn_user xp if current user matches
  try {
    const rawUser = localStorage.getItem('algolearn_user');
    if (rawUser) {
      const userObj = JSON.parse(rawUser);
      const uKey = (userObj.regdNo || userObj.id || userObj.email || '').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      if (uKey === studentKey) {
        userObj.xp = sumScores;
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
 * Persists an updated Overall Completion percentage (0..100) for a topic.
 */
export function setTopicCompletion(topicIdOrTitle: string, completion: number, explicitUserKey?: string): number {
  const moduleId = normalizeToModuleId(topicIdOrTitle);
  if (!moduleId) return 0;

  const cleanComp = Math.max(0, Math.min(100, Math.round(completion)));
  if (typeof localStorage === 'undefined') return cleanComp;

  const studentKey = explicitUserKey !== undefined ? explicitUserKey : getActiveStudentKey();
  if (!studentKey) return 0;

  localStorage.setItem(`algolearn_topic_completion_${studentKey}_${moduleId}`, String(cleanComp));
  const activeKey = getActiveStudentKey();
  if (studentKey === activeKey) {
    localStorage.setItem(`algolearn_topic_completion_${moduleId}`, String(cleanComp));
    try {
      const currentCompletions = safeJsonParse<Record<string, number>>(localStorage.getItem('algolearn_topics_completions')) || {};
      currentCompletions[moduleId] = cleanComp;
      localStorage.setItem('algolearn_topics_completions', JSON.stringify(currentCompletions));
    } catch {}
  }

  const studentDataRaw = localStorage.getItem(`algolearn_student_progress_${studentKey}`);
  const studentData = safeJsonParse<{
    topicScores?: Record<string, number>;
    topicCompletions?: Record<string, number>;
    moduleKeys?: Record<string, any>;
    xp?: number;
  }>(studentDataRaw) || { topicScores: {}, topicCompletions: {}, moduleKeys: {}, xp: 0 };

  if (!studentData.topicCompletions) studentData.topicCompletions = {};
  studentData.topicCompletions[moduleId] = cleanComp;

  localStorage.setItem(`algolearn_student_progress_${studentKey}`, JSON.stringify(studentData));

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
          userObj.exploredTopics[idx].progress = cleanComp;
          userObj.exploredTopics[idx].status = cleanComp >= 80 ? 'completed' : cleanComp > 0 ? 'in_progress' : 'not_started';
        } else {
          userObj.exploredTopics.push({
            id: moduleId,
            title: moduleId,
            progress: cleanComp,
            status: cleanComp >= 80 ? 'completed' : cleanComp > 0 ? 'in_progress' : 'not_started',
            lastAccessed: 'Recently',
          });
        }
        userObj.topicsMastered = Object.values(studentData.topicCompletions).filter((c) => Number(c) >= 80).length;
        localStorage.setItem('algolearn_user', JSON.stringify(userObj));
      }
    }
  } catch {}

  try {
    window.dispatchEvent(
      new CustomEvent('algolearn_topic_progress_updated', {
        detail: { moduleId, completion: cleanComp, studentKey },
      })
    );
  } catch {}

  return cleanComp;
}

/**
 * Aggregates all topics' real scores and completion percentages across the platform.
 * Leaderboard total points = sum of actual Total Points displayed in each topic's Progress page.
 * Count each topic exactly once.
 */
export function getAllTopicsProgress(explicitUserKey?: string): TopicProgressSummary {
  const topicScores: Record<string, number> = {};
  const topicPoints: Record<string, number> = {};
  const topicCompletions: Record<string, number> = {};
  let totalEarned = 0;
  let topicsMasteredCount = 0;
  let topicsStartedCount = 0;

  const studentKey = explicitUserKey !== undefined ? explicitUserKey : getActiveStudentKey();

  if (!studentKey) {
    CANONICAL_MODULE_IDS.forEach((modId) => {
      topicScores[modId] = 0;
      topicPoints[modId] = 0;
      topicCompletions[modId] = 0;
    });
    return {
      topicScores,
      topicPoints,
      topicCompletions,
      totalEarned: 0,
      totalPossible: CANONICAL_MODULE_IDS.length * 100,
      overallPercentage: 0,
      topicsMasteredCount: 0,
      topicsStartedCount: 0,
      totalXP: 0,
    };
  }

  CANONICAL_MODULE_IDS.forEach((modId) => {
    const points = getTopicScore(modId, studentKey);
    const completion = getTopicCompletion(modId, studentKey);
    topicScores[modId] = points;
    topicPoints[modId] = points;
    topicCompletions[modId] = completion;
    totalEarned += points;

    if (completion >= 80) {
      topicsMasteredCount++;
    }
    if (completion > 0 || points > 0) {
      topicsStartedCount++;
    }
  });

  const totalPossible = CANONICAL_MODULE_IDS.length * 100;
  // Leaderboard total points = exact sum of actual Total Points displayed in each topic's Progress page
  const totalXP = totalEarned;
  const overallPercentage = Math.min(
    100,
    Math.round((totalEarned / totalPossible) * 100)
  );

  return {
    topicScores,
    topicPoints,
    topicCompletions,
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
 * exploredTopics.progress stores the topic's Overall Completion percentage.
 * user.xp stores the sum of all topic Total Points for the leaderboard.
 */
export function syncUserProfileWithTopicProgress(user: UserProfile): UserProfile {
  const studentKey = (user.regdNo || user.id || user.email || '').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const isGuest = !studentKey || user.name === 'Guest Learner';

  const summary = isGuest
    ? {
        topicScores: {} as Record<string, number>,
        topicPoints: {} as Record<string, number>,
        topicCompletions: {} as Record<string, number>,
        totalEarned: 0,
        totalPossible: 1300,
        overallPercentage: 0,
        topicsMasteredCount: 0,
        topicsStartedCount: 0,
        totalXP: 0,
      }
    : getAllTopicsProgress(studentKey);

  const exploredTopics = DSA_TOPICS.map((topic) => {
    const modId = normalizeToModuleId(topic.id) || normalizeToModuleId(topic.title);
    const comp = (!isGuest && modId)
      ? (summary.topicCompletions[modId] !== undefined ? summary.topicCompletions[modId] : 0)
      : 0;

    return {
      id: topic.id,
      title: topic.title,
      progress: comp,
      lastAccessed: comp !== 0 ? 'Recently' : 'Not started',
      status: (comp >= 80 ? 'completed' : comp !== 0 ? 'in_progress' : 'not_started') as 'completed' | 'in_progress' | 'not_started',
    };
  });

  return {
    ...user,
    exploredTopics,
    topicsMastered: isGuest ? 0 : summary.topicsMasteredCount,
    xp: isGuest ? 0 : summary.totalXP,
  };
}
