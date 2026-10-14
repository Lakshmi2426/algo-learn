import {
  POINTS_CONFIG,
  PointsActivityEvent,
  PointsBreakdown,
  PointsNotification,
  PointsState,
} from '../types/points';
import { progressManager } from './progressManager';

const POINTS_STORAGE_KEY = 'algo_quest_points_system_v3';

const createInitialPointsState = (): PointsState => ({
  version: 4,
  completedTheoryIds: [],
  completedVisualizeIds: [],
  completedGameLevelIds: [],
  answeredQuizQuestionIds: [],
  quizCompleted: false,
  quizScore: 0,
  deductedHintLevelIds: [],
  deductedGuidedSolveLevelIds: [],
  hintPenaltiesTotal: 0,
  hintUsesCount: 0,
  guidedSolvePenaltiesTotal: 0,
  guidedSolveUsesCount: 0,
  totalPoints: 0,
  history: [],
});

type PointsListener = (state: PointsState) => void;
type PointsNotificationListener = (notification: PointsNotification) => void;

class PointsManager {
  private state: PointsState;
  private listeners: Set<PointsListener> = new Set();
  private notificationListeners: Set<PointsNotificationListener> = new Set();
  private lastActionTimestamps: Map<string, number> = new Map();

  constructor() {
    this.state = this.loadState();
    this.syncWithExistingProgress();
  }

  private loadState(): PointsState {
    if (typeof window === 'undefined') return createInitialPointsState();
    try {
      const stored = localStorage.getItem(POINTS_STORAGE_KEY);
      if (!stored) {
        // Fallback check for v2 migration
        const v2Stored = localStorage.getItem('algo_quest_points_system_v2');
        if (v2Stored) {
          const v2Parsed = JSON.parse(v2Stored);
          if (v2Parsed) {
            return {
              version: 4,
              completedTheoryIds: Array.isArray(v2Parsed.completedTheoryIds)
                ? Array.from(new Set(v2Parsed.completedTheoryIds))
                : [],
              completedVisualizeIds: Array.isArray(v2Parsed.completedVisualizeIds)
                ? Array.from(new Set(v2Parsed.completedVisualizeIds))
                : [],
              completedGameLevelIds: Array.isArray(v2Parsed.completedGameLevelIds)
                ? Array.from(new Set(v2Parsed.completedGameLevelIds))
                : [],
              answeredQuizQuestionIds: [],
              quizCompleted: false,
              quizScore: Number(v2Parsed.quizScore) || 0,
              deductedHintLevelIds: [],
              deductedGuidedSolveLevelIds: [],
              hintPenaltiesTotal: Math.max(0, Number(v2Parsed.hintPenaltiesTotal) || 0),
              hintUsesCount: Math.max(0, Number(v2Parsed.hintUsesCount) || 0),
              guidedSolvePenaltiesTotal: Math.max(0, Number(v2Parsed.guidedSolvePenaltiesTotal) || 0),
              guidedSolveUsesCount: Math.max(0, Number(v2Parsed.guidedSolveUsesCount) || 0),
              totalPoints: Number(v2Parsed.totalPoints) || 0,
              history: [],
            };
          }
        }
        return createInitialPointsState();
      }

      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed.totalPoints === 'number') {
        let answeredQuizIds: number[] = Array.isArray(parsed.answeredQuizQuestionIds)
          ? parsed.answeredQuizQuestionIds
          : [];

        // If answeredQuizIds is not yet populated, check existing quiz answers in localStorage
        if (answeredQuizIds.length === 0 && typeof window !== 'undefined') {
          try {
            const rawAnswers = localStorage.getItem('linear_search_quiz_answers_v1') || localStorage.getItem('hash_quest_quiz_answers_v4');
            if (rawAnswers) {
              const parsedAns = JSON.parse(rawAnswers);
              if (parsedAns && typeof parsedAns === 'object') {
                answeredQuizIds = Object.keys(parsedAns).map(Number).filter((n) => !isNaN(n) && n > 0);
              }
            }
          } catch {
            // Ignore
          }
        }

        const isQuizDone = Boolean(parsed.quizCompleted) && answeredQuizIds.length >= POINTS_CONFIG.TOTAL_QUIZ_QUESTIONS;

        return {
          version: 4,
          completedTheoryIds: Array.isArray(parsed.completedTheoryIds)
            ? Array.from(new Set(parsed.completedTheoryIds))
            : [],
          completedVisualizeIds: Array.isArray(parsed.completedVisualizeIds)
            ? Array.from(new Set(parsed.completedVisualizeIds))
            : [],
          completedGameLevelIds: Array.isArray(parsed.completedGameLevelIds)
            ? Array.from(new Set(parsed.completedGameLevelIds))
            : [],
          answeredQuizQuestionIds: answeredQuizIds,
          quizCompleted: isQuizDone,
          quizScore: Number(parsed.quizScore) || 0,
          deductedHintLevelIds: Array.isArray(parsed.deductedHintLevelIds)
            ? Array.from(new Set(parsed.deductedHintLevelIds))
            : [],
          deductedGuidedSolveLevelIds: Array.isArray(parsed.deductedGuidedSolveLevelIds)
            ? Array.from(new Set(parsed.deductedGuidedSolveLevelIds))
            : [],
          hintPenaltiesTotal: Math.max(0, Number(parsed.hintPenaltiesTotal) || 0),
          hintUsesCount: Math.max(0, Number(parsed.hintUsesCount) || 0),
          guidedSolvePenaltiesTotal: Math.max(0, Number(parsed.guidedSolvePenaltiesTotal) || 0),
          guidedSolveUsesCount: Math.max(0, Number(parsed.guidedSolveUsesCount) || 0),
          totalPoints: Number(parsed.totalPoints) || 0,
          history: Array.isArray(parsed.history) ? parsed.history : [],
        };
      }
      return createInitialPointsState();
    } catch {
      return createInitialPointsState();
    }
  }

  /**
   * Safely imports previously completed progress without resetting anything
   */
  private syncWithExistingProgress() {
    try {
      const pState = progressManager.getState();
      let changed = false;

      // Sync theory modules
      if (Array.isArray(pState.completedTheoryChapters)) {
        for (const chapId of pState.completedTheoryChapters) {
          if (!this.state.completedTheoryIds.includes(chapId)) {
            this.state.completedTheoryIds.push(chapId);
            changed = true;
          }
        }
      }

      // Sync video lessons
      if (Array.isArray(pState.completedVideos)) {
        for (const vidId of pState.completedVideos) {
          if (!this.state.completedVisualizeIds.includes(vidId)) {
            this.state.completedVisualizeIds.push(vidId);
            changed = true;
          }
        }
      }

      // Sync game levels
      if (Array.isArray(pState.levelsCompleted)) {
        for (const lvlId of pState.levelsCompleted) {
          if (typeof lvlId === 'number' && !this.state.completedGameLevelIds.includes(lvlId)) {
            this.state.completedGameLevelIds.push(lvlId);
            changed = true;
          }
        }
      }

      // Sync quiz submission status: strictly only complete if all 10 questions were answered!
      const isQuizFullyDone = Boolean(pState.quizSubmitted) &&
        Array.isArray(this.state.answeredQuizQuestionIds) &&
        this.state.answeredQuizQuestionIds.length >= POINTS_CONFIG.TOTAL_QUIZ_QUESTIONS;

      if (isQuizFullyDone && !this.state.quizCompleted) {
        this.state.quizCompleted = true;
        changed = true;
      } else if (!isQuizFullyDone && this.state.quizCompleted) {
        this.state.quizCompleted = false;
        changed = true;
      }

      const prevTotal = this.state.totalPoints;
      this.recalculateTotal();
      if (changed || this.state.totalPoints !== prevTotal) {
        this.saveState();
      }
    } catch {
      // Ignore sync errors
    }
  }

  private saveState() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(POINTS_STORAGE_KEY, JSON.stringify(this.state));
      localStorage.setItem('algolearn_topic_progress_linear-search', String(this.state.totalPoints));
      this.notifyListeners();
    } catch {
      // Ignore write errors
    }
  }

  /**
   * Recalculates total points without clamping negative balances to zero.
   * Total = Theory + Quiz + Visualize + Games - (Hint Penalties + Guided Solve Penalties)
   */
  private recalculateTotal() {
    const theory = 0; // Learn/Theory contributes 0 points to Linear Search
    const quiz = Math.min(POINTS_CONFIG.MAX_QUIZ, this.state.quizScore);
    const visualize = Math.min(
      POINTS_CONFIG.MAX_VISUALIZE,
      this.state.completedVisualizeIds.length * POINTS_CONFIG.VISUALIZE_PER_MODULE
    );
    const game = Math.min(
      POINTS_CONFIG.MAX_GAME,
      this.state.completedGameLevelIds.length * POINTS_CONFIG.GAME_PER_LEVEL
    );

    const gross = quiz + visualize + game;
    const deductions = this.state.hintPenaltiesTotal + this.state.guidedSolvePenaltiesTotal;

    this.state.totalPoints = Math.min(POINTS_CONFIG.MAX_TOTAL_POINTS, gross - deductions);
  }

  private addHistoryEvent(event: PointsActivityEvent) {
    if (!Array.isArray(this.state.history)) {
      this.state.history = [];
    }
    this.state.history.unshift(event);
  }

  public subscribe(listener: PointsListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onNotification(listener: PointsNotificationListener): () => void {
    this.notificationListeners.add(listener);
    return () => {
      this.notificationListeners.delete(listener);
    };
  }

  private triggerNotification(notification: PointsNotification) {
    this.notificationListeners.forEach((fn) => {
      try {
        fn(notification);
      } catch {
        // Safe dispatch
      }
    });
  }

  private notifyListeners() {
    const copy = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(copy);
      } catch {
        // Safe dispatch
      }
    });
  }

  public getState(): PointsState {
    return JSON.parse(JSON.stringify(this.state));
  }

  public getTotalPoints(): number {
    return this.state.totalPoints;
  }

  public getHistory(): PointsActivityEvent[] {
    return Array.isArray(this.state.history) ? [...this.state.history] : [];
  }

  private isDebounced(actionKey: string, cooldownMs = 200): boolean {
    const now = Date.now();
    const last = this.lastActionTimestamps.get(actionKey) || 0;
    if (now - last < cooldownMs) {
      return true;
    }
    this.lastActionTimestamps.set(actionKey, now);
    return false;
  }

  // =========================================================================
  // LEVEL STATUS & DEDUCTION CHECKS
  // =========================================================================

  private extractLevelId(levelIdOrContext?: number | string): number | null {
    if (typeof levelIdOrContext === 'number' && !isNaN(levelIdOrContext) && levelIdOrContext > 0) {
      return levelIdOrContext;
    }
    if (typeof levelIdOrContext === 'string') {
      const match = levelIdOrContext.match(/level\s*(\d+)/i) || levelIdOrContext.match(/lvl\s*(\d+)/i);
      if (match) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return null;
  }

  /**
   * Checks if a level has already been completed.
   */
  public isLevelCompleted(levelId: number): boolean {
    if (this.state.completedGameLevelIds.includes(levelId)) return true;
    try {
      const pState = progressManager.getState();
      if (Array.isArray(pState.levelsCompleted) && pState.levelsCompleted.includes(levelId)) {
        return true;
      }
    } catch {
      // Ignore
    }
    return false;
  }

  /**
   * Checks if hint penalty has already been deducted for this level.
   */
  public isHintAlreadyDeducted(levelId: number): boolean {
    return this.state.deductedHintLevelIds.includes(levelId);
  }

  /**
   * Checks if guided solve penalty has already been deducted for this level.
   */
  public isGuidedSolveAlreadyDeducted(levelId: number): boolean {
    return this.state.deductedGuidedSolveLevelIds.includes(levelId);
  }

  // =========================================================================
  // ACTIONS: UNIQUE & SINGLE-TIME POINT MARKING AND DEDUCTIONS
  // =========================================================================

  /**
   * Complete Theory Module: 0 Points (Marked once)
   */
  public recordTheoryCompleted(moduleId: string, _title?: string): boolean {
    if (!moduleId || this.state.completedTheoryIds.includes(moduleId)) {
      return false; // Already tracked
    }
    this.state.completedTheoryIds.push(moduleId);
    this.saveState();
    return true;
  }

  /**
   * Complete Visualize Module: +10 Points (One time only)
   */
  public recordVideoCompleted(videoId: string, title?: string): boolean {
    if (!videoId || this.state.completedVisualizeIds.includes(videoId)) {
      return false; // Already awarded once
    }
    this.state.completedVisualizeIds.push(videoId);

    const vidNumber = videoId.replace(/\D/g, '') || '1';
    const pointsAdded = POINTS_CONFIG.VISUALIZE_PER_MODULE;

    this.addHistoryEvent({
      id: `video_${videoId}_${Date.now()}`,
      type: 'VISUALIZE_COMPLETED',
      description: title ? `Completed Visualization: ${title}` : `Completed Visualization Module ${parseInt(vidNumber, 10)}`,
      categoryLabel: 'VISUALIZATION COMPLETED',
      pointsChange: pointsAdded,
      timestamp: Date.now(),
    });

    this.recalculateTotal();
    this.saveState();

    this.triggerNotification({
      id: `toast_video_${videoId}_${Date.now()}`,
      pointsChange: pointsAdded,
      title: `+${pointsAdded} Points`,
      message: 'Visualization Completed',
      type: 'reward',
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Complete Game Level: +10 Points (One time only)
   * If played again after completing, no points awarded.
   */
  public recordGameCompleted(levelId: number): boolean {
    if (!levelId || this.state.completedGameLevelIds.includes(levelId)) {
      return false; // Already awarded once! Playing again awards no points.
    }
    this.state.completedGameLevelIds.push(levelId);

    const pointsAdded = POINTS_CONFIG.GAME_PER_LEVEL;

    this.addHistoryEvent({
      id: `game_${levelId}_${Date.now()}`,
      type: 'GAME_COMPLETED',
      description: `Completed Game Level ${levelId}`,
      categoryLabel: 'GAME COMPLETED',
      pointsChange: pointsAdded,
      timestamp: Date.now(),
    });

    this.recalculateTotal();
    this.saveState();

    this.triggerNotification({
      id: `toast_game_${levelId}_${Date.now()}`,
      pointsChange: pointsAdded,
      title: `+${pointsAdded} Points`,
      message: 'Game Level Completed',
      type: 'reward',
      timestamp: Date.now(),
    });

    return true;
  }

  public recordVisualizeCompleted(videoId: string, title?: string): boolean {
    return this.recordVideoCompleted(videoId, title);
  }

  /**
   * Hint Used: -2 Points per use while level is not completed.
   * - If level is not completed: deducts -2 each time hint is clicked.
   * - Once level is completed: NO points are deducted if played again!
   */
  public recordHintUsed(levelIdOrContext?: number | string, contextStr?: string): boolean {
    const lvl = this.extractLevelId(levelIdOrContext) || this.extractLevelId(contextStr);
    const context = typeof levelIdOrContext === 'string' ? levelIdOrContext : (contextStr || (lvl ? `Level ${lvl}` : 'Game'));

    // Once a level is completed, playing it again deducts ZERO points!
    if (lvl && this.isLevelCompleted(lvl)) {
      return false;
    }

    const debounceKey = `hint_${lvl || context || 'act'}`;
    if (this.isDebounced(debounceKey, 150)) return false;

    this.state.hintPenaltiesTotal += POINTS_CONFIG.HINT_PENALTY;
    this.state.hintUsesCount += 1;

    this.addHistoryEvent({
      id: `hint_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: 'HINT_USED',
      description: context ? `Used Hint: ${context}` : 'Used Hint',
      categoryLabel: 'HINT USED',
      pointsChange: -POINTS_CONFIG.HINT_PENALTY,
      timestamp: Date.now(),
    });

    this.recalculateTotal();
    this.saveState();

    this.triggerNotification({
      id: `toast_hint_${Date.now()}`,
      pointsChange: -POINTS_CONFIG.HINT_PENALTY,
      title: `-${POINTS_CONFIG.HINT_PENALTY} Points`,
      message: 'Hint Used (-2 pts)',
      type: 'penalty',
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Guided Solve Used: -4 Points per use while level is not completed.
   * - If level is not completed: deducts -4 each time guided solve is activated.
   * - Once level is completed: NO points are deducted if played again!
   */
  public recordGuidedSolveUsed(levelId?: number, context?: string): boolean {
    const lvl = levelId || this.extractLevelId(context);

    // Once a level is completed, playing it again deducts ZERO points!
    if (lvl && this.isLevelCompleted(lvl)) {
      return false;
    }

    const debounceKey = `guided_${lvl || 'lvl'}_${context || 'act'}`;
    if (this.isDebounced(debounceKey, 150)) return false;

    this.state.guidedSolvePenaltiesTotal += POINTS_CONFIG.GUIDED_SOLVE_PENALTY;
    this.state.guidedSolveUsesCount += 1;

    const desc = lvl
      ? context
        ? `Used Guided Solve: Level ${lvl} (${context})`
        : `Used Guided Solve: Level ${lvl}`
      : 'Used Guided Solve';

    this.addHistoryEvent({
      id: `guided_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: 'GUIDED_SOLVE_USED',
      description: desc,
      categoryLabel: 'GUIDED SOLVE USED',
      pointsChange: -POINTS_CONFIG.GUIDED_SOLVE_PENALTY,
      timestamp: Date.now(),
    });

    this.recalculateTotal();
    this.saveState();

    this.triggerNotification({
      id: `toast_guided_${Date.now()}`,
      pointsChange: -POINTS_CONFIG.GUIDED_SOLVE_PENALTY,
      title: `-${POINTS_CONFIG.GUIDED_SOLVE_PENALTY} Points`,
      message: 'Guided Solve Used (-4 pts)',
      type: 'penalty',
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Quiz Question Answer:
   * - Correct: +4 Points
   * - Wrong: -3 Points
   * - Maximum Quiz Score: 40 Points
   * Rules:
   * 1. If quiz is already completed, no points awarded or deducted on retake!
   * 2. Each question can only be scored once.
   */
  public recordQuizAnswer(questionId: number, isCorrect: boolean): boolean {
    if (!Array.isArray(this.state.answeredQuizQuestionIds)) {
      this.state.answeredQuizQuestionIds = [];
    }

    // Rule 1: If quiz has already been completed, no scoring on replay!
    if (this.state.quizCompleted) {
      return false;
    }

    // Rule 2: Prevent duplicate scoring for the same question
    if (this.state.answeredQuizQuestionIds.includes(questionId)) {
      return false;
    }

    const prevQuiz = this.state.quizScore;
    let targetQuiz: number;
    let actualDelta: number;

    if (isCorrect) {
      targetQuiz = Math.min(POINTS_CONFIG.MAX_QUIZ, prevQuiz + POINTS_CONFIG.QUIZ_CORRECT);
      actualDelta = targetQuiz - prevQuiz;
    } else {
      targetQuiz = prevQuiz + POINTS_CONFIG.QUIZ_WRONG;
      actualDelta = POINTS_CONFIG.QUIZ_WRONG;
    }

    this.state.answeredQuizQuestionIds.push(questionId);
    this.state.quizScore = targetQuiz;
    this.recalculateTotal();

    const desc = isCorrect ? 'Correct Answer!' : 'Incorrect Answer';
    const title = actualDelta > 0
      ? `+${actualDelta} ${actualDelta === 1 ? 'Point' : 'Points'}`
      : `${actualDelta} ${Math.abs(actualDelta) === 1 ? 'Point' : 'Points'}`;

    this.addHistoryEvent({
      id: `quiz_${questionId}_${Date.now()}`,
      type: isCorrect ? 'QUIZ_CORRECT' : 'QUIZ_WRONG',
      description: isCorrect ? `Correct Quiz Answer (Q${questionId})` : `Incorrect Quiz Answer (Q${questionId})`,
      categoryLabel: isCorrect ? 'QUIZ CORRECT' : 'QUIZ INCORRECT',
      pointsChange: actualDelta,
      timestamp: Date.now(),
    });

    this.saveState();

    this.triggerNotification({
      id: `toast_quiz_${questionId}_${Date.now()}`,
      pointsChange: actualDelta,
      title,
      message: desc,
      type: isCorrect ? 'reward' : 'penalty',
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Quiz Question Timeout: 0 Points (Marked once)
   */
  public recordQuizTimeout(questionId: number): boolean {
    if (!Array.isArray(this.state.answeredQuizQuestionIds)) {
      this.state.answeredQuizQuestionIds = [];
    }

    if (this.state.quizCompleted || this.state.answeredQuizQuestionIds.includes(questionId)) {
      return false;
    }

    this.state.answeredQuizQuestionIds.push(questionId);

    this.addHistoryEvent({
      id: `quiz_timeout_${questionId}_${Date.now()}`,
      type: 'QUIZ_TIMEOUT',
      description: `Question Q${questionId} Timed Out (0 pts)`,
      categoryLabel: 'QUIZ TIMEOUT',
      pointsChange: 0,
      timestamp: Date.now(),
    });

    this.saveState();

    this.triggerNotification({
      id: `toast_quiz_timeout_${questionId}_${Date.now()}`,
      pointsChange: 0,
      title: '0 Points',
      message: `Question ${questionId} Timed Out`,
      type: 'penalty',
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Marks the entire Quiz as completed.
   * Locks the quiz points so replay/retake gives 0 points and deducts 0 points.
   */
  public recordQuizCompleted(): void {
    if (!this.state.quizCompleted) {
      this.state.quizCompleted = true;
      this.saveState();
    }
  }

  /**
   * Called when student retakes quiz for practice.
   * If quiz has already been completed, points and scoring are LOCKED (not reset).
   */
  public resetQuizAttempt(): void {
    if (this.state.quizCompleted) {
      // Points remain locked: practicing does not alter existing score
      return;
    }
    this.state.answeredQuizQuestionIds = [];
    this.state.quizScore = 0;
    this.recalculateTotal();
    this.saveState();
  }

  /**
   * Resets all points, activity history, and penalties.
   */
  public resetAllPoints() {
    this.lastActionTimestamps.clear();
    this.state = createInitialPointsState();
    this.saveState();
    this.notifyListeners();
  }

  /**
   * Returns current Points breakdown according to the 100-point curriculum
   */
  public getBreakdown(): PointsBreakdown {
    const theoryScore = 0;
    const quizScore = this.state.quizScore;
    const visualizeScore = Math.min(
      POINTS_CONFIG.MAX_VISUALIZE,
      this.state.completedVisualizeIds.length * POINTS_CONFIG.VISUALIZE_PER_MODULE
    );
    const grossGameScore = Math.min(
      POINTS_CONFIG.MAX_GAME,
      this.state.completedGameLevelIds.length * POINTS_CONFIG.GAME_PER_LEVEL
    );

    const hintPenalties = this.state.hintPenaltiesTotal;
    const guidedSolvePenalties = this.state.guidedSolvePenaltiesTotal;
    const penaltiesTotal = hintPenalties + guidedSolvePenalties;

    // Net Game Score considers guided solve and hint deductions
    const gameScore = grossGameScore - penaltiesTotal;

    return {
      theoryScore,
      maxTheory: POINTS_CONFIG.MAX_THEORY,
      visualizeScore,
      maxVisualize: POINTS_CONFIG.MAX_VISUALIZE,
      gameScore,
      maxGame: POINTS_CONFIG.MAX_GAME,
      quizScore,
      maxQuiz: POINTS_CONFIG.MAX_QUIZ,
      penaltiesTotal,
      hintPenalties,
      hintUsesCount: this.state.hintUsesCount,
      guidedSolvePenalties,
      guidedSolveUsesCount: this.state.guidedSolveUsesCount,
      totalPoints: this.state.totalPoints,
      maxTotalPoints: POINTS_CONFIG.MAX_TOTAL_POINTS,
    };
  }
}

export const pointsManager = new PointsManager();
