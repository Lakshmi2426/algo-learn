import { ActivityRecord, ModuleRecord, ModuleStatus, SLLActivityCategory, UserProgressState } from '../types/game';

const STORAGE_KEY_V4 = 'algolearn_sll_100_points_progress_v4';
const STORAGE_KEY_V3_LEGACY = 'algolearn_sll_100_points_progress_v3';

export const TOTAL_POINTS_MAX = 100;
export const TOTAL_CONCEPTS = 15;

/**
 * NEW POINT SYSTEM CONFIGURATION:
 * Total maximum positive points: 100
 * - Learn/Theory: 0 points (removed all point rewards)
 * - Visualization: 10 points (2 videos @ 5 points each)
 * - Game: 60 points (Insertion 25, Deletion 25, Traversal 10)
 * - Quiz: 30 points (10 questions @ +3 correct, -1 wrong, 0 timeout)
 */
export const CATEGORY_MAX = {
  learn: 0,
  visualize: 10,
  game: 60,
  quiz: 30,
} as const;

export const LEARN_ACTIVITIES: Array<{
  id: string;
  theoryChapterId: string;
  title: string;
  points: number;
}> = [
  { id: 'learn_intro', theoryChapterId: 'theory-01', title: 'Introduction to SLL', points: 0 },
  { id: 'learn_operations', theoryChapterId: 'theory-02', title: 'Operations of SLL', points: 0 },
  { id: 'learn_insert_beginning', theoryChapterId: 'theory-03', title: 'Insert at Beginning', points: 0 },
  { id: 'learn_insert_end', theoryChapterId: 'theory-04', title: 'Insert at End', points: 0 },
  { id: 'learn_insert_position', theoryChapterId: 'theory-05', title: 'Insert at Position', points: 0 },
  { id: 'learn_delete_beginning', theoryChapterId: 'theory-06', title: 'Delete at Beginning', points: 0 },
  { id: 'learn_delete_end', theoryChapterId: 'theory-07', title: 'Delete at End', points: 0 },
  { id: 'learn_delete_position', theoryChapterId: 'theory-08', title: 'Delete at Position', points: 0 },
  { id: 'learn_searching', theoryChapterId: 'theory-09', title: 'Searching', points: 0 },
  { id: 'learn_display', theoryChapterId: 'theory-10', title: 'Display', points: 0 },
  { id: 'learn_complexities', theoryChapterId: 'theory-11', title: 'Time Complexities', points: 0 },
  { id: 'learn_advantages', theoryChapterId: 'theory-12', title: 'Advantages', points: 0 },
  { id: 'learn_disadvantages', theoryChapterId: 'theory-13', title: 'Disadvantages', points: 0 },
  { id: 'learn_applications', theoryChapterId: 'theory-14', title: 'Applications', points: 0 },
  { id: 'learn_mastery', theoryChapterId: 'theory-15', title: 'Learn Completion / Mastery', points: 0 },
];

/**
 * 2 VISUALIZATION VIDEOS (5 POINTS EACH = 10 POINTS TOTAL)
 */
export const VISUALIZE_ACTIVITIES: Array<{
  id: string;
  title: string;
  points: number;
  description: string;
}> = [
  {
    id: 'lesson-01',
    title: 'Introduction to Singly Linked List',
    points: 5,
    description: 'Foundations of Singly Linked Lists, node structure, head and tail pointers',
  },
  {
    id: 'lesson-02',
    title: 'Singly Linked List Operations',
    points: 5,
    description: 'Mastering insertions, deletions, linear search, and pointer updates',
  },
];

export const GAME_ACTIVITIES: Record<'insertion' | 'deletion' | 'traversal', {
  id: string;
  categoryName: 'insertion' | 'deletion' | 'traversal';
  title: string;
  baseScore: number;
}> = {
  insertion: { id: 'game_insertion', categoryName: 'insertion', title: 'Insertion Level', baseScore: 25 },
  deletion: { id: 'game_deletion', categoryName: 'deletion', title: 'Deletion Level', baseScore: 25 },
  traversal: { id: 'game_traversal', categoryName: 'traversal', title: 'Traversal Level', baseScore: 10 },
};

export interface GameTaskScoringState {
  taskId: string;
  internalId: string;
  category: 'insertion' | 'deletion' | 'traversal';
  title: string;
  baseScore: number;
  hintUsed: boolean;
  guideUsed: boolean;
  conceptUsed: boolean;
  hintCount?: number;
  guideCount?: number;
  hintPenalty: number; // 2 per hint use
  guidePenalty: number; // 3 per guide solve use
  finalScore: number;
  completed: boolean;
  attempts?: number;
  completedAt?: number;
}

/**
 * GAME LEVEL TASKS (TOTAL 60 POINTS):
 * Insertion: 25 points (6 + 6 + 6 + 7)
 * Deletion: 25 points (8 + 8 + 9)
 * Traversal: 10 points (10)
 */
export const GAME_TASK_DEFINITIONS: Record<string, {
  taskId: string;
  internalId: string;
  category: 'insertion' | 'deletion' | 'traversal';
  title: string;
  baseScore: number;
}> = {
  game_insertion_create_node: {
    taskId: 'game_insertion_create_node',
    internalId: 'L1_T1',
    category: 'insertion',
    title: 'Create a Node',
    baseScore: 6,
  },
  game_insertion_beginning: {
    taskId: 'game_insertion_beginning',
    internalId: 'L1_T3',
    category: 'insertion',
    title: 'Insert at Beginning',
    baseScore: 6,
  },
  game_insertion_end: {
    taskId: 'game_insertion_end',
    internalId: 'L1_T4',
    category: 'insertion',
    title: 'Insert at End',
    baseScore: 6,
  },
  game_insertion_position: {
    taskId: 'game_insertion_position',
    internalId: 'L4_T1',
    category: 'insertion',
    title: 'Insert at Any Position',
    baseScore: 7,
  },
  game_deletion_beginning: {
    taskId: 'game_deletion_beginning',
    internalId: 'L2_T1',
    category: 'deletion',
    title: 'Delete at Beginning',
    baseScore: 8,
  },
  game_deletion_end: {
    taskId: 'game_deletion_end',
    internalId: 'L2_T2',
    category: 'deletion',
    title: 'Delete at End',
    baseScore: 8,
  },
  game_deletion_position: {
    taskId: 'game_deletion_position',
    internalId: 'L4_T2',
    category: 'deletion',
    title: 'Delete at Any Position',
    baseScore: 9,
  },
  game_traversal_print: {
    taskId: 'game_traversal_print',
    internalId: 'L3_T1',
    category: 'traversal',
    title: 'Traverse and Print',
    baseScore: 10,
  },
};

export const TASK_ID_ALIASES: Record<string, string> = {
  L1_T1: 'game_insertion_create_node',
  L1_T3: 'game_insertion_beginning',
  L1_T4: 'game_insertion_end',
  L4_T1: 'game_insertion_position',
  L2_T1: 'game_deletion_beginning',
  L2_T2: 'game_deletion_end',
  L4_T2: 'game_deletion_position',
  L3_T1: 'game_traversal_print',
};

export const GAME_TASK_LIST = Object.values(GAME_TASK_DEFINITIONS);

export function toCanonicalGameTaskId(id: string): string {
  if (GAME_TASK_DEFINITIONS[id]) return id;
  if (TASK_ID_ALIASES[id]) return TASK_ID_ALIASES[id];
  return id;
}

export function createDefaultGameTasks(): Record<string, GameTaskScoringState> {
  const result: Record<string, GameTaskScoringState> = {};
  for (const [key, def] of Object.entries(GAME_TASK_DEFINITIONS)) {
    result[key] = {
      taskId: def.taskId,
      internalId: def.internalId,
      category: def.category,
      title: def.title,
      baseScore: def.baseScore,
      hintUsed: false,
      guideUsed: false,
      conceptUsed: false,
      hintCount: 0,
      guideCount: 0,
      hintPenalty: 0,
      guidePenalty: 0,
      finalScore: 0,
      completed: false,
      attempts: 1,
    };
  }
  return result;
}

export interface QuizQuestionRecord {
  questionId: number;
  status: 'correct' | 'wrong' | 'timeout' | 'unanswered';
  points: number; // +3, -1, 0
  selectedOptionIndex?: number;
  answeredAt?: number;
}

export interface QuizSessionState {
  hasStarted: boolean;
  currentQuestionIndex: number;
  timeLeft: number;
  isSubmitted: boolean;
  studentAnswers: Record<number, any>;
  shuffledOptions?: Record<number, string[]>;
}

export interface CentralizedProgressState {
  version: number;
  totalPoints: number; // 0 - 100
  learnScore: number; // strictly 0
  visualizeScore: number; // 0 - 10
  gameScore: number; // 0 - 60
  quizScore: number; // 0 - 30
  completedActivities: Record<string, ActivityRecord>;
  gameTasks: Record<string, GameTaskScoringState>;
  gameAssistance: Record<string, { hintUsed: boolean; guideUsed: boolean; hintCount?: number; guideCount?: number; attempts: number }>;
  quizQuestions: Record<number, QuizQuestionRecord>;
  hasCelebrated100Percent: boolean;
  lastActiveTimestamp: number;
  completedVideos?: string[];
  levelsCompleted?: number[];
  totalScore?: number;
  quizSubmitted?: boolean;
  quizSession?: QuizSessionState;
}

const INITIAL_CENTRAL_STATE: CentralizedProgressState = {
  version: 4,
  totalPoints: 0,
  learnScore: 0,
  visualizeScore: 0,
  gameScore: 0,
  quizScore: 0,
  completedActivities: {},
  gameTasks: createDefaultGameTasks(),
  gameAssistance: {},
  quizQuestions: {},
  hasCelebrated100Percent: false,
  lastActiveTimestamp: Date.now(),
  completedVideos: [],
  levelsCompleted: [],
  totalScore: 0,
  quizSubmitted: false,
  quizSession: {
    hasStarted: false,
    currentQuestionIndex: 0,
    timeLeft: 20,
    isSubmitted: false,
    studentAnswers: {},
  },
};

type ProgressListener = (state: CentralizedProgressState) => void;

export interface PointDeductionNotification {
  id: number;
  points: number;
  reason: 'Guided Solve Used' | 'Hint Used';
}

export type DeductionListener = (notification: PointDeductionNotification) => void;

class ProgressManager {
  private state: CentralizedProgressState;
  private listeners: Set<ProgressListener> = new Set();
  private deductionListeners: Set<DeductionListener> = new Set();

  constructor() {
    this.state = this.loadState();
    this.recalculateScores();
    this.saveState();
  }

  private loadState(): CentralizedProgressState {
    if (typeof window === 'undefined') return INITIAL_CENTRAL_STATE;
    try {
      let stored = localStorage.getItem(STORAGE_KEY_V4);
      let legacyData: any = null;

      if (!stored) {
        // Fallback to check legacy v3 for data migration
        stored = localStorage.getItem(STORAGE_KEY_V3_LEGACY);
        if (stored) {
          legacyData = JSON.parse(stored);
        }
      }

      const raw = stored ? (legacyData || JSON.parse(stored)) : null;

      if (raw && typeof raw === 'object') {
        const gameTasks = createDefaultGameTasks();
        if (raw.gameTasks && typeof raw.gameTasks === 'object') {
          for (const [k, v] of Object.entries(raw.gameTasks)) {
            const canonical = toCanonicalGameTaskId(k);
            if (gameTasks[canonical] && v && typeof v === 'object') {
              const val = v as Partial<GameTaskScoringState>;
              const def = GAME_TASK_DEFINITIONS[canonical];
              const hintUsed = Boolean(val.hintUsed);
              const guideUsed = Boolean(val.guideUsed);
              const hintCount = val.hintCount || (hintUsed ? 1 : 0);
              const guideCount = val.guideCount || (guideUsed ? 1 : 0);
              const hintPenalty = typeof val.hintPenalty === 'number' ? val.hintPenalty : hintCount * 2;
              const guidePenalty = typeof val.guidePenalty === 'number' ? val.guidePenalty : guideCount * 3;
              const finalScore = val.completed
                ? (typeof val.finalScore === 'number' ? val.finalScore : Math.max(0, def.baseScore - hintPenalty - guidePenalty))
                : 0;

              gameTasks[canonical] = {
                ...gameTasks[canonical],
                ...val,
                taskId: canonical,
                baseScore: def.baseScore,
                internalId: def.internalId,
                category: def.category,
                title: def.title,
                hintUsed,
                guideUsed,
                hintCount,
                guideCount,
                hintPenalty,
                guidePenalty,
                finalScore,
              };
            }
          }
        }

        const completedActivities: Record<string, ActivityRecord> = { ...(raw.completedActivities || {}) };

        // Zero out any legacy learn activity points
        Object.keys(completedActivities).forEach((id) => {
          if (completedActivities[id]?.category === 'learn') {
            completedActivities[id].pointsAwarded = 0;
            completedActivities[id].maxPoints = 0;
          }
        });

        // Clean up any legacy bulk activities
        delete completedActivities['game_insertion'];
        delete completedActivities['game_deletion'];
        delete completedActivities['game_traversal'];

        // Synchronize game tasks into completed activities with preserved first-play scoring
        for (const [taskKey, taskDef] of Object.entries(GAME_TASK_DEFINITIONS)) {
          const canonical = taskKey;
          const rec = completedActivities[canonical] || completedActivities[taskDef.internalId];
          if (rec && rec.category === 'game') {
            gameTasks[canonical].completed = true;
            const finalScore = typeof rec.pointsAwarded === 'number'
              ? rec.pointsAwarded
              : (typeof gameTasks[canonical].finalScore === 'number'
                  ? gameTasks[canonical].finalScore
                  : Math.max(0, taskDef.baseScore - gameTasks[canonical].hintPenalty - gameTasks[canonical].guidePenalty));
            gameTasks[canonical].finalScore = finalScore;
            completedActivities[canonical] = {
              id: canonical,
              category: 'game',
              pointsAwarded: finalScore,
              maxPoints: taskDef.baseScore,
              completedAt: rec.completedAt || Date.now(),
              metadata: {
                ...rec.metadata,
                taskId: canonical,
                internalId: taskDef.internalId,
                category: taskDef.category,
                baseScore: taskDef.baseScore,
                hintUsed: gameTasks[canonical].hintUsed,
                guideUsed: gameTasks[canonical].guideUsed,
                hintPenalty: gameTasks[canonical].hintPenalty,
                guidePenalty: gameTasks[canonical].guidePenalty,
                finalScore: finalScore,
              },
            };
          }
        }

        // Migrate or initialize quiz questions
        const quizQuestions: Record<number, QuizQuestionRecord> = raw.quizQuestions || {};

        return {
          ...INITIAL_CENTRAL_STATE,
          ...raw,
          version: 4,
          completedActivities,
          gameTasks,
          quizQuestions,
          gameAssistance: raw.gameAssistance || {},
        };
      }
      return INITIAL_CENTRAL_STATE;
    } catch {
      return INITIAL_CENTRAL_STATE;
    }
  }

  private saveState() {
    if (typeof window === 'undefined') return;
    try {
      this.state.lastActiveTimestamp = Date.now();
      localStorage.setItem(STORAGE_KEY_V4, JSON.stringify(this.state));
      this.notifyListeners();
    } catch (e) {
      console.error('Error saving progress to localStorage', e);
    }
  }

  public subscribe(listener: ProgressListener): () => void {
    this.listeners.add(listener);
    listener(this.getCentralState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onPointDeduction(callback: DeductionListener): () => void {
    this.deductionListeners.add(callback);
    return () => {
      this.deductionListeners.delete(callback);
    };
  }

  public emitPointDeduction(points: number, reason: 'Guided Solve Used' | 'Hint Used') {
    const notif: PointDeductionNotification = {
      id: Date.now() + Math.random(),
      points,
      reason,
    };
    this.deductionListeners.forEach((fn) => {
      try {
        fn(notif);
      } catch (err) {
        console.error('Error in deduction listener', err);
      }
    });
  }

  private notifyListeners() {
    const copy = this.getCentralState();
    this.listeners.forEach((fn) => {
      try {
        fn(copy);
      } catch (err) {
        console.error('Error in progress listener', err);
      }
    });
  }

  public getCentralState(): CentralizedProgressState {
    const raw = JSON.parse(JSON.stringify(this.state));
    const levelsDone: number[] = [];
    if (this.isTopicComplete('insertion')) levelsDone.push(1);
    if (this.isTopicComplete('deletion')) levelsDone.push(2);
    if (this.isTopicComplete('traversal')) levelsDone.push(3);

    return {
      ...raw,
      completedVideos: VISUALIZE_ACTIVITIES.filter((a) => this.isCompleted(a.id)).map((a) => a.id),
      levelsCompleted: levelsDone,
      totalScore: this.getTotalPoints(),
      quizSubmitted: this.isCompleted('quiz_single_linked_list') || Boolean(raw.quizSubmitted),
    };
  }

  public isTopicComplete(topic: 'insertion' | 'deletion' | 'traversal'): boolean {
    const topicTasks = Object.values(GAME_TASK_DEFINITIONS).filter((d) => d.category === topic);
    return topicTasks.every((d) => {
      const state = this.getGameTaskState(d.taskId);
      return state.completed || this.isCompleted(d.taskId) || this.isCompleted(d.internalId);
    });
  }

  // =========================================================================
  // CORE 100-POINT SCORING API
  // =========================================================================

  public getTotalPoints(): number {
    return Math.min(100, Math.max(0, this.state.totalPoints));
  }

  public getCategoryScore(category: SLLActivityCategory): number {
    switch (category) {
      case 'learn':
        return 0; // Strictly 0 points
      case 'visualize':
        return Math.min(CATEGORY_MAX.visualize, Math.max(0, this.state.visualizeScore));
      case 'game':
        return Math.min(CATEGORY_MAX.game, Math.max(0, this.state.gameScore));
      case 'quiz':
        return Math.min(CATEGORY_MAX.quiz, Math.max(0, this.state.quizScore));
      default:
        return 0;
    }
  }

  public getCategoryMax(category: SLLActivityCategory): number {
    return CATEGORY_MAX[category] || 0;
  }

  public isCompleted(activityId: string): boolean {
    const canonical = toCanonicalGameTaskId(activityId);
    if (this.state.completedActivities && (this.state.completedActivities[activityId] || this.state.completedActivities[canonical])) {
      return true;
    }
    if (this.state.gameTasks && this.state.gameTasks[canonical]?.completed) {
      return true;
    }
    return false;
  }

  public getActivity(activityId: string): ActivityRecord | null {
    const canonical = toCanonicalGameTaskId(activityId);
    return (
      (this.state.completedActivities && (this.state.completedActivities[canonical] || this.state.completedActivities[activityId])) ||
      null
    );
  }

  /**
   * Recalculates total points and all category scores
   */
  private recalculateScores() {
    let visualize = 0;
    let game = 0;
    let quiz = 0;

    Object.values(this.state.completedActivities).forEach((rec) => {
      if (rec.category === 'visualize') {
        visualize += rec.pointsAwarded;
      } else if (rec.category === 'game') {
        game += rec.pointsAwarded;
      } else if (rec.category === 'quiz') {
        // If question-by-question scoring is not active yet, use bulk record
        if (!this.state.quizQuestions || Object.keys(this.state.quizQuestions).length === 0) {
          quiz += rec.pointsAwarded;
        }
      }
    });

    // If real-time question-by-question quiz records exist, they are the source of truth
    if (this.state.quizQuestions && Object.keys(this.state.quizQuestions).length > 0) {
      let qPointsSum = 0;
      Object.values(this.state.quizQuestions).forEach((qRec) => {
        qPointsSum += qRec.points;
      });
      quiz = Math.min(CATEGORY_MAX.quiz, Math.max(0, qPointsSum));
    }

    // Live ongoing penalties (Guided Solve and Hint) on active (uncompleted) tasks
    const ongoingGamePenalties = Object.values(this.state.gameTasks || {})
      .filter((t) => !t.completed)
      .reduce(
        (sum, t) =>
          sum +
          (t.guidePenalty || ((t.guideCount || 0) * 3)) +
          (t.hintPenalty || ((t.hintCount || 0) * 2)),
        0
      );

    this.state.learnScore = 0; // Strictly zero points for Learn/Theory
    this.state.visualizeScore = Math.min(CATEGORY_MAX.visualize, Math.max(0, visualize));
    this.state.gameScore = Math.min(CATEGORY_MAX.game, Math.max(0, game - ongoingGamePenalties));
    this.state.quizScore = Math.min(CATEGORY_MAX.quiz, Math.max(0, quiz));
    this.state.totalPoints = Math.min(
      100,
      Math.max(0, this.state.visualizeScore + this.state.gameScore + this.state.quizScore)
    );
    this.state.totalScore = this.state.totalPoints;
  }

  /**
   * Generic completion handler with duplicate points protection
   */
  public markCompleted(
    activityId: string,
    category: SLLActivityCategory,
    points: number,
    metadata?: ActivityRecord['metadata']
  ): boolean {
    // DUPLICATE PROTECTION: never award points twice for the same activity
    if (this.isCompleted(activityId)) {
      return false;
    }

    const maxAllowed = CATEGORY_MAX[category];
    const currentScore = this.getCategoryScore(category);
    const roomInCat = Math.max(0, maxAllowed - currentScore);
    const actualAward = category === 'learn' ? 0 : Math.min(points, roomInCat);

    const record: ActivityRecord = {
      id: activityId,
      category,
      pointsAwarded: actualAward,
      maxPoints: points,
      completedAt: Date.now(),
      metadata,
    };

    this.state.completedActivities[activityId] = record;
    this.recalculateScores();
    this.saveState();
    return true;
  }

  /**
   * Complete Learn section: Keep tracking completion, but award ZERO points
   */
  public completeLearnSection(sectionNumber: number): { newlyCompleted: boolean; pointsAwarded: number } {
    const item = LEARN_ACTIVITIES[sectionNumber - 1];
    if (!item) return { newlyCompleted: false, pointsAwarded: 0 };

    if (this.isCompleted(item.id)) {
      return { newlyCompleted: false, pointsAwarded: 0 };
    }

    const awarded = this.markCompleted(item.id, 'learn', 0, { sectionNumber, title: item.title });
    return { newlyCompleted: awarded, pointsAwarded: 0 };
  }

  public completeLearnByChapterId(chapterId: string): { newlyCompleted: boolean; pointsAwarded: number } {
    const item = LEARN_ACTIVITIES.find((l) => l.theoryChapterId === chapterId);
    if (!item) return { newlyCompleted: false, pointsAwarded: 0 };
    return this.completeLearnSection(LEARN_ACTIVITIES.indexOf(item) + 1);
  }

  /**
   * Complete a Visualize video (lesson-01 or lesson-02)
   * Awards 5 points per video up to 10 points max. Incomplete videos receive 0 points.
   * Duplicate protection prevents repeated points on replaying.
   */
  public completeVisualizeActivity(activityId: string): { newlyCompleted: boolean; pointsAwarded: number } {
    const act = VISUALIZE_ACTIVITIES.find((v) => v.id === activityId);
    if (!act) return { newlyCompleted: false, pointsAwarded: 0 };

    if (this.isCompleted(act.id)) {
      return { newlyCompleted: false, pointsAwarded: 0 };
    }

    const awarded = this.markCompleted(act.id, 'visualize', act.points, { title: act.title });
    return { newlyCompleted: awarded, pointsAwarded: awarded ? act.points : 0 };
  }

  /**
   * Complete an Interactive Visualizer activity.
   * Tracks completion for UI state, but awards ZERO (0) points.
   * The interactive visualizer is purely for learning and does NOT award score or XP.
   */
  public completeInteractiveVisualizerActivity(activityId: string): { newlyCompleted: boolean; pointsAwarded: number } {
    if (this.isCompleted(activityId)) {
      return { newlyCompleted: false, pointsAwarded: 0 };
    }

    const awarded = this.markCompleted(activityId, 'visualize', 0, {
      title: activityId,
      type: 'interactive_visualizer',
    });
    return { newlyCompleted: awarded, pointsAwarded: 0 };
  }

  // =========================================================================
  // GAME ASSISTANCE & PENALTY ENGINE
  // =========================================================================

  public getGameTaskState(id: string): GameTaskScoringState {
    const canonical = toCanonicalGameTaskId(id);
    if (this.state.gameTasks && this.state.gameTasks[canonical]) {
      return this.state.gameTasks[canonical];
    }
    const def = GAME_TASK_DEFINITIONS[canonical];
    if (def) {
      const task: GameTaskScoringState = {
        taskId: def.taskId,
        internalId: def.internalId,
        category: def.category,
        title: def.title,
        baseScore: def.baseScore,
        hintUsed: false,
        guideUsed: false,
        conceptUsed: false,
        hintCount: 0,
        guideCount: 0,
        hintPenalty: 0,
        guidePenalty: 0,
        finalScore: 0,
        completed: false,
        attempts: 1,
      };
      if (!this.state.gameTasks) this.state.gameTasks = {};
      this.state.gameTasks[canonical] = task;
      return task;
    }
    return {
      taskId: canonical,
      internalId: canonical,
      category: 'insertion',
      title: canonical,
      baseScore: 6,
      hintUsed: false,
      guideUsed: false,
      conceptUsed: false,
      hintCount: 0,
      guideCount: 0,
      hintPenalty: 0,
      guidePenalty: 0,
      finalScore: 0,
      completed: false,
      attempts: 1,
    };
  }

  /**
   * Applies deductions for actual Hint (-2 pts) and Guided Solve (-3 pts) usage.
   * Subsequent genuine uses apply additional deductions while preventing duplicate deductions for the exact same event.
   * Point-neutral on replays: once a game/level has completed its first play, hints and guide actions never alter points.
   */
  public recordGameTaskAssistance(id: string, type: 'hint' | 'guide' | 'concept'): void {
    const canonical = toCanonicalGameTaskId(id);
    const task = this.getGameTaskState(canonical);

    // POINT-NEUTRAL REPLAY RULE:
    // Once first play of that specific task/game is completed, replays are point-neutral.
    if (task.completed === true || this.isCompleted(canonical)) {
      return;
    }

    if (type === 'hint') {
      task.hintUsed = true;
      task.hintCount = (task.hintCount || 0) + 1;
      task.hintPenalty = task.hintCount * 2;
    } else if (type === 'guide') {
      if (!task.guideUsed) {
        task.guideUsed = true;
        task.guideCount = 1;
        task.guidePenalty = 3;
      }
    } else if (type === 'concept') {
      task.conceptUsed = true;
    }

    if (!this.state.gameAssistance[canonical]) {
      this.state.gameAssistance[canonical] = { hintUsed: false, guideUsed: false, attempts: 1, hintCount: 0, guideCount: 0 };
    }
    if (type === 'hint') {
      this.state.gameAssistance[canonical].hintUsed = true;
      this.state.gameAssistance[canonical].hintCount = task.hintCount;
    } else if (type === 'guide') {
      this.state.gameAssistance[canonical].guideUsed = true;
      this.state.gameAssistance[canonical].guideCount = 1;
    }

    this.recalculateScores();
    this.saveState();

    if (type === 'hint') {
      this.emitPointDeduction(2, 'Hint Used');
    }
  }

  /**
   * Explicit GUIDEDSOLVE point deduction:
   * Deducts configured 3 points exactly once when a new Guided Solve session begins during first play.
   * Never deducts points for individual Next Step clicks, rerenders, or session completion.
   * Activating Guided Solve again after stopping counts as a new session on first play.
   * Once the user's first play of that specific game/level is completed, all subsequent replays
   * are completely point-neutral (zero deductions, zero penalty increases, zero toasts).
   */
  public startGuidedSolveSession(taskId: string): number {
    const canonical = toCanonicalGameTaskId(taskId);
    const task = this.getGameTaskState(canonical);

    // POINT-NEUTRAL REPLAY RULE:
    // All replays of completed games/levels are completely point-neutral.
    if (task.completed === true || this.isCompleted(canonical)) {
      return this.getTotalPoints();
    }

    task.guideUsed = true;
    task.guideCount = (task.guideCount || 0) + 1;
    task.guidePenalty = task.guideCount * 3;

    if (!this.state.gameAssistance[canonical]) {
      this.state.gameAssistance[canonical] = { hintUsed: false, guideUsed: true, attempts: 1, hintCount: 0, guideCount: task.guideCount };
    } else {
      this.state.gameAssistance[canonical].guideUsed = true;
      this.state.gameAssistance[canonical].guideCount = task.guideCount;
    }

    this.recalculateScores();
    this.saveState();
    this.emitPointDeduction(3, 'Guided Solve Used');
    return this.getTotalPoints();
  }

  public deductGuidedSolvePoints(taskId: string): number {
    return this.startGuidedSolveSession(taskId);
  }

  public isGuidedSolveUsed(taskId: string): boolean {
    const canonical = toCanonicalGameTaskId(taskId);
    const task = this.getGameTaskState(canonical);
    return Boolean(task.guideUsed);
  }

  public deductHintPoints(taskId: string): number {
    this.recordGameTaskAssistance(taskId, 'hint');
    return this.getTotalPoints();
  }

  public recordGameAssistance(keyOrTaskId: string, type: 'hint' | 'guide' | 'concept'): void {
    this.recordGameTaskAssistance(keyOrTaskId, type);
  }

  public incrementGameAttempt(keyOrTaskId: string): number {
    const canonical = toCanonicalGameTaskId(keyOrTaskId);
    const task = this.getGameTaskState(canonical);
    task.attempts = (task.attempts || 1) + 1;

    if (!this.state.gameAssistance[keyOrTaskId]) {
      this.state.gameAssistance[keyOrTaskId] = { hintUsed: false, guideUsed: false, attempts: 1 };
    } else {
      this.state.gameAssistance[keyOrTaskId].attempts += 1;
    }
    this.saveState();
    return task.attempts;
  }

  public getGameAssistance(keyOrTaskId: string) {
    const canonical = toCanonicalGameTaskId(keyOrTaskId);
    const task = this.getGameTaskState(canonical);
    return {
      hintUsed: task.hintUsed,
      guideUsed: task.guideUsed,
      attempts: task.attempts || 1,
    };
  }

  /**
   * Calculates game score with deductions:
   * finalScore = Math.max(0, baseScore - (hintPenalty) - (guidePenalty))
   * Replays preserve first-play score and penalties.
   */
  public calculateGameScore(
    category: 'insertion' | 'deletion' | 'traversal',
    taskId?: string
  ): {
    baseScore: number;
    hintUsed: boolean;
    guideUsed: boolean;
    hintPenalty: number;
    guidePenalty: number;
    totalPenalty: number;
    finalScore: number;
  } {
    if (taskId) {
      const canonical = toCanonicalGameTaskId(taskId);
      const task = this.getGameTaskState(canonical);
      const isAlreadyDone = task.completed === true || this.isCompleted(canonical);
      const hintPenalty = task.hintPenalty || (task.hintUsed ? 2 : 0);
      const guidePenalty = task.guidePenalty || (task.guideUsed ? 3 : 0);
      const totalPenalty = hintPenalty + guidePenalty;
      const finalScore = isAlreadyDone && typeof task.finalScore === 'number'
        ? task.finalScore
        : Math.max(0, task.baseScore - totalPenalty);
      return {
        baseScore: task.baseScore,
        hintUsed: task.hintUsed,
        guideUsed: task.guideUsed,
        hintPenalty,
        guidePenalty,
        totalPenalty,
        finalScore,
      };
    }

    const baseScore = category === 'traversal' ? 10 : 25;
    return {
      baseScore,
      hintUsed: false,
      guideUsed: false,
      hintPenalty: 0,
      guidePenalty: 0,
      totalPenalty: 0,
      finalScore: baseScore,
    };
  }

  /**
   * Complete a game task: Awards configured points with negative marking.
   * Duplicate protection: Replays award 0 XP.
   */
  public completeGameTask(taskId: string): {
    newlyCompleted: boolean;
    task: GameTaskScoringState;
    baseScore: number;
    hintPenalty: number;
    guidePenalty: number;
    totalPenalty: number;
    finalScore: number;
    alreadyCompleted: boolean;
  } {
    const canonical = toCanonicalGameTaskId(taskId);
    const task = this.getGameTaskState(canonical);

    // DUPLICATE PROTECTION: If already completed, award 0 additional points
    if (task.completed === true || this.isCompleted(canonical)) {
      const hintPenalty = task.hintPenalty || (task.hintUsed ? 2 : 0);
      const guidePenalty = task.guidePenalty || (task.guideUsed ? 3 : 0);
      return {
        newlyCompleted: false,
        task,
        baseScore: task.baseScore,
        hintPenalty,
        guidePenalty,
        totalPenalty: hintPenalty + guidePenalty,
        finalScore: 0,
        alreadyCompleted: true,
      };
    }

    const hintPenalty = task.hintPenalty || (task.hintUsed ? 2 : 0);
    const guidePenalty = task.guidePenalty || (task.guideUsed ? 3 : 0);
    const totalPenalty = hintPenalty + guidePenalty;
    const finalScore = Math.max(0, task.baseScore - totalPenalty);

    task.hintPenalty = hintPenalty;
    task.guidePenalty = guidePenalty;
    task.finalScore = finalScore;
    task.completed = true;
    task.completedAt = Date.now();

    const maxAllowed = CATEGORY_MAX.game;
    const currentScore = this.getCategoryScore('game');
    const roomInCat = Math.max(0, maxAllowed - currentScore);
    const actualAward = Math.min(finalScore, roomInCat);

    const record: ActivityRecord = {
      id: canonical,
      category: 'game',
      pointsAwarded: actualAward,
      maxPoints: task.baseScore,
      completedAt: Date.now(),
      metadata: {
        taskId: canonical,
        internalId: task.internalId,
        category: task.category,
        baseScore: task.baseScore,
        hintUsed: task.hintUsed,
        guideUsed: task.guideUsed,
        conceptUsed: task.conceptUsed,
        hintPenalty,
        guidePenalty,
        finalScore: actualAward,
        attempts: task.attempts || 1,
      },
    };

    this.state.completedActivities[canonical] = record;
    this.state.gameTasks[canonical] = task;
    this.recalculateScores();
    this.saveState();

    return {
      newlyCompleted: true,
      task,
      baseScore: task.baseScore,
      hintPenalty,
      guidePenalty,
      totalPenalty,
      finalScore: actualAward,
      alreadyCompleted: false,
    };
  }

  public completeGameCategory(
    category: 'insertion' | 'deletion' | 'traversal',
    taskId?: string
  ): {
    newlyCompleted: boolean;
    baseScore: number;
    hintPenalty: number;
    guidePenalty: number;
    totalPenalty: number;
    finalScore: number;
    alreadyCompleted: boolean;
  } {
    if (taskId) {
      return this.completeGameTask(taskId);
    }

    const base = category === 'traversal' ? 10 : 25;
    return {
      newlyCompleted: false,
      baseScore: base,
      hintPenalty: 0,
      guidePenalty: 0,
      totalPenalty: 0,
      finalScore: 0,
      alreadyCompleted: false,
    };
  }

  public getGameTopicEarnedScore(topic: 'insertion' | 'deletion' | 'traversal'): number {
    let sum = 0;
    for (const def of Object.values(GAME_TASK_DEFINITIONS)) {
      if (def.category === topic) {
        const task = this.getGameTaskState(def.taskId);
        if (task.completed) {
          sum += task.finalScore;
        }
      }
    }
    return sum;
  }

  // =========================================================================
  // QUIZ ENGINE (10 QUESTIONS, +3 CORRECT, -1 WRONG, 0 TIMEOUT, 30 PTS MAX)
  // =========================================================================

  /**
   * Real-time question evaluation: Immediately award (+3) or deduct (-1) points,
   * or award 0 on timeout. Prevents duplicate submissions.
   */
  public recordQuizQuestion(
    questionId: number,
    status: 'correct' | 'wrong' | 'timeout',
    selectedOptionIndex?: number
  ): { points: number; quizScore: number; totalScore: number; isDuplicate: boolean } {
    if (!this.state.quizQuestions) {
      this.state.quizQuestions = {};
    }

    // DUPLICATE PROTECTION: Question already answered or timed-out cannot be scored again
    const existing = this.state.quizQuestions[questionId];
    if (existing && existing.status !== 'unanswered') {
      return {
        points: existing.points,
        quizScore: this.getCategoryScore('quiz'),
        totalScore: this.getTotalPoints(),
        isDuplicate: true,
      };
    }

    let pointsAwarded = 0;
    if (status === 'correct') {
      pointsAwarded = 3;
    } else if (status === 'wrong') {
      pointsAwarded = -1;
    } else {
      pointsAwarded = 0; // Timeout or unanswered = 0
    }

    this.state.quizQuestions[questionId] = {
      questionId,
      status,
      points: pointsAwarded,
      selectedOptionIndex,
      answeredAt: Date.now(),
    };

    // Recalculate Quiz category score
    this.recalculateScores();
    this.saveState();

    return {
      points: pointsAwarded,
      quizScore: this.getCategoryScore('quiz'),
      totalScore: this.getTotalPoints(),
      isDuplicate: false,
    };
  }

  public getQuizQuestionRecord(questionId: number): QuizQuestionRecord | undefined {
    return this.state.quizQuestions?.[questionId];
  }

  public getAllQuizQuestions(): Record<number, QuizQuestionRecord> {
    return this.state.quizQuestions || {};
  }

  public recordQuizCompletion(
    studentAnswers: any,
    correctCount: number,
    totalQuestions: number
  ) {
    this.state.quizSubmitted = true;
    const activityId = 'quiz_single_linked_list';

    // Calculate sum from individual question records if available
    let calculatedPoints = 0;
    if (this.state.quizQuestions && Object.keys(this.state.quizQuestions).length > 0) {
      let sum = 0;
      Object.values(this.state.quizQuestions).forEach((q) => {
        sum += q.points;
      });
      calculatedPoints = Math.min(30, Math.max(0, sum));
    } else {
      // Fallback calculation
      calculatedPoints = Math.min(30, Math.max(0, correctCount * 3));
    }

    this.markCompleted(activityId, 'quiz', calculatedPoints, {
      correctCount,
      totalQuestions,
      studentAnswers,
      percentage: Math.round((correctCount / Math.max(1, totalQuestions)) * 100),
    });

    return {
      newlyCompleted: true,
      quizScore: this.getCategoryScore('quiz'),
      pointsAwarded: calculatedPoints,
    };
  }

  public saveQuizSession(session: Partial<QuizSessionState>): void {
    const current = this.getQuizSession();
    this.state.quizSession = {
      ...current,
      ...session,
    };
    if (session.isSubmitted !== undefined) {
      this.state.quizSubmitted = session.isSubmitted;
    }
    this.saveState();
  }

  public getQuizSession(): QuizSessionState {
    const defaultSession: QuizSessionState = {
      hasStarted: false,
      currentQuestionIndex: 0,
      timeLeft: 20,
      isSubmitted: false,
      studentAnswers: {},
    };
    if (this.state.quizSession && typeof this.state.quizSession === 'object') {
      return {
        ...defaultSession,
        ...this.state.quizSession,
      };
    }
    return defaultSession;
  }

  public resetQuizSession(): void {
    this.state.quizSession = {
      hasStarted: false,
      currentQuestionIndex: 0,
      timeLeft: 20,
      isSubmitted: false,
      studentAnswers: {},
    };
    this.state.quizQuestions = {};
    this.state.quizSubmitted = false;
    delete this.state.completedActivities['quiz_single_linked_list'];
    this.recalculateScores();
    this.saveState();
  }

  // =========================================================================
  // MASTERY & PROGRESS METRICS
  // =========================================================================

  public getProgressPercentage(): number {
    return Math.min(100, Math.max(0, Math.round((this.getTotalPoints() / 100) * 100)));
  }

  public getMasteryLevel(score?: number): {
    tier: 'Beginner' | 'Learner' | 'Intermediate' | 'Advanced' | 'Master';
    label: string;
    badge: string;
    isMaster: boolean;
  } {
    const pts = score !== undefined ? score : this.getTotalPoints();
    if (pts >= 100) {
      return { tier: 'Master', label: '🎉 MASTER', badge: '100 / 100', isMaster: true };
    }
    if (pts >= 75) {
      return { tier: 'Advanced', label: 'Advanced', badge: '75–99 Points', isMaster: false };
    }
    if (pts >= 50) {
      return { tier: 'Intermediate', label: 'Intermediate', badge: '50–74 Points', isMaster: false };
    }
    if (pts >= 25) {
      return { tier: 'Learner', label: 'Learner', badge: '25–49 Points', isMaster: false };
    }
    return { tier: 'Beginner', label: 'Beginner', badge: '0–24 Points', isMaster: false };
  }

  public getCompletedActivitiesCount(): number {
    return Object.keys(this.state.completedActivities).length;
  }

  public getTotalActivitiesCount(): number {
    // 15 Learn + 2 Videos + 8 Game Tasks + 10 Quiz Questions = 35
    return 35;
  }

  public setCelebrationAcknowledged() {
    this.state.hasCelebrated100Percent = true;
    this.saveState();
  }

  // =========================================================================
  // BACKWARD COMPATIBILITY ADAPTERS
  // =========================================================================

  public getState(): UserProgressState {
    const completedTheory = LEARN_ACTIVITIES.filter((a) => this.isCompleted(a.id)).map((a) => a.theoryChapterId);
    const quizRec = this.getActivity('quiz_single_linked_list');

    return {
      version: 4,
      modules: {},
      moduleProgress: {},
      completedTheoryChapters: completedTheory,
      currentTheoryChapterId: 'theory-01',
      levelCompletedKeys: {},
      levelsCompleted: [
        this.isTopicComplete('insertion') ? 1 : 0,
        this.isTopicComplete('deletion') ? 2 : 0,
        this.isTopicComplete('traversal') ? 3 : 0,
      ].filter((x) => x > 0),
      levelsMastered: [],
      quizScores: quizRec?.metadata?.studentAnswers || {},
      quizSubmitted: Boolean(this.state.quizSubmitted || quizRec),
      quizFinalScore: this.getCategoryScore('quiz'),
      sandboxOperationsCount: 0,
      totalScore: this.getTotalPoints(),
      streak: 0,
      currentActiveModuleId: 'fn-01-basics',
      lastActiveTimestamp: this.state.lastActiveTimestamp,
      hasCelebrated100Percent: this.state.hasCelebrated100Percent,
      completedVideos: VISUALIZE_ACTIVITIES.filter((a) => this.isCompleted(a.id)).map((a) => a.id),
    };
  }

  public getStats() {
    const total = this.getTotalActivitiesCount();
    const completed = this.getCompletedActivitiesCount();
    const percentage = this.getProgressPercentage();
    const isAllComplete = percentage === 100;
    const mastery = this.getMasteryLevel();

    return {
      total,
      completed,
      mastered: isAllComplete ? 1 : 0,
      percentage,
      isAllComplete,
      masteryLevel: mastery.label,
      theory: {
        total: 15,
        completed: LEARN_ACTIVITIES.filter((a) => this.isCompleted(a.id)).length,
        percentage: 0, // 0 points
      },
      video: {
        total: 2,
        completed: VISUALIZE_ACTIVITIES.filter((a) => this.isCompleted(a.id)).length,
        percentage: Math.round((this.getCategoryScore('visualize') / 10) * 100),
      },
      game: {
        total: 3,
        completed: [
          this.isTopicComplete('insertion') ? 'game_insertion' : null,
          this.isTopicComplete('deletion') ? 'game_deletion' : null,
          this.isTopicComplete('traversal') ? 'game_traversal' : null,
        ].filter(Boolean).length,
        percentage: Math.round((this.getCategoryScore('game') / 60) * 100),
      },
      quiz: {
        total: 10,
        completed: Object.values(this.state.quizQuestions || {}).filter((q) => q.status !== 'unanswered').length,
        isSubmitted: Boolean(this.state.quizSubmitted || this.isCompleted('quiz_single_linked_list')),
        finalScore: this.getCategoryScore('quiz'),
        percentage: Math.round((this.getCategoryScore('quiz') / 30) * 100),
      },
      nextModule: this.getModules().find((m) => m.status !== 'COMPLETED') || null,
    };
  }

  public getTheoryStats() {
    const completedList = LEARN_ACTIVITIES.filter((a) => this.isCompleted(a.id)).map((a) => a.theoryChapterId);
    return {
      total: 15,
      completed: completedList.length,
      percentage: Math.round((completedList.length / 15) * 100),
      isComplete: completedList.length >= 15,
      completedIds: completedList,
      currentChapterId: 'theory-01',
    };
  }

  public getVideoStats() {
    const completedIds = VISUALIZE_ACTIVITIES.filter((a) => this.isCompleted(a.id)).map((a) => a.id);
    return {
      total: 2,
      completed: completedIds.length,
      percentage: Math.round((this.getCategoryScore('visualize') / 10) * 100),
      isComplete: completedIds.length >= 2,
      completedVideos: completedIds,
    };
  }

  public getGameStats() {
    const ids = [
      this.isTopicComplete('insertion') ? 'game_insertion' : null,
      this.isTopicComplete('deletion') ? 'game_deletion' : null,
      this.isTopicComplete('traversal') ? 'game_traversal' : null,
    ].filter(Boolean) as string[];
    return {
      total: 3,
      completed: ids.length,
      percentage: Math.round((this.getCategoryScore('game') / 60) * 100),
      isComplete: ids.length >= 3,
      completedLevels: ids,
    };
  }

  public getQuizStats() {
    const isSubmitted = Boolean(this.state.quizSubmitted || this.isCompleted('quiz_single_linked_list'));
    const answeredCount = Object.values(this.state.quizQuestions || {}).filter((q) => q.status !== 'unanswered').length;
    return {
      total: 10,
      completed: answeredCount,
      percentage: Math.round((this.getCategoryScore('quiz') / 30) * 100),
      isSubmitted,
      finalScore: this.getCategoryScore('quiz'),
      isComplete: isSubmitted || answeredCount === 10,
    };
  }

  public isTheoryChapterCompleted(chapterId: string): boolean {
    const act = LEARN_ACTIVITIES.find((l) => l.theoryChapterId === chapterId);
    return act ? this.isCompleted(act.id) : false;
  }

  public completeTheoryChapter(chapterId: string): boolean {
    const result = this.completeLearnByChapterId(chapterId);
    return result.newlyCompleted;
  }

  public isVideoCompleted(videoId: string): boolean {
    return this.isCompleted(videoId);
  }

  public completeVideo(videoId: string): boolean {
    const result = this.completeVisualizeActivity(videoId);
    return result.newlyCompleted;
  }

  public markLevelCompleted(levelId: number, _score: number = 100, _isPerfect: boolean = false) {
    if (levelId === 1) this.completeGameCategory('insertion');
    else if (levelId === 2) this.completeGameCategory('deletion');
    else if (levelId === 3) this.completeGameCategory('traversal');
  }

  public checkAndCompleteCertification() {
    if (this.getTotalPoints() === 100 && !this.state.hasCelebrated100Percent) {
      this.saveState();
    }
  }

  public addScore(_points: number) {
    // Score is strictly tied to real activities
  }

  public startModule(_moduleId: string) {}
  public updateModuleProgress(_moduleId: string, _percent: number) {}
  public completeModule(_moduleId: string) {}
  public recordSandboxOp() {}
  public setCurrentTheoryChapter(_id: string) {}
  public getModules(): ModuleRecord[] {
    return LEARN_ACTIVITIES.map((item, idx) => {
      const isDone = this.isCompleted(item.id);
      return {
        id: item.id,
        number: String(idx + 1).padStart(2, '0'),
        code: `SLL-${String(idx + 1).padStart(2, '0')}`,
        title: item.title,
        category: 'FOUNDATION',
        description: `Learn ${item.title}.`,
        status: (isDone ? 'COMPLETED' : 'NOT_STARTED') as ModuleStatus,
        progressPercent: isDone ? 100 : 0,
        criteriaDescription: `Complete learning chapter ${item.title}.`,
        targetTab: 'THEORY',
        targetChapterId: item.theoryChapterId,
      };
    });
  }

  public resetProgress(): void {
    this.state = {
      ...INITIAL_CENTRAL_STATE,
      gameTasks: createDefaultGameTasks(),
      completedActivities: {},
      gameAssistance: {},
      quizQuestions: {},
      lastActiveTimestamp: Date.now(),
    };
    this.saveState();
  }
}

export const normalizeTheoryChapterId = (id: string): string => {
  if (!id) return 'theory-01';
  if (id.startsWith('theory-')) return id;
  const match = LEARN_ACTIVITIES.find((a) => a.id === id);
  return match ? match.theoryChapterId : id;
};

export const progressManager = new ProgressManager();
