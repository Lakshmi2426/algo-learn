import { ModuleRecord, ModuleStatus, UserProgressState } from '../types/game';
import { userManager } from './userManager';

export const FIELD_NOTES_MODULES: Omit<ModuleRecord, 'status' | 'progressPercent'>[] = [
  {
    id: 'fn-01-basics',
    number: '01',
    code: 'FN-01',
    title: 'WHAT IS HASHING? & O(1) ACCESS',
    category: 'FOUNDATION',
    description: 'Understand direct addressing, hash tables, and why hash lookups operate in average O(1) constant time.',
    criteriaDescription: 'Read the foundation theory and complete the interactive O(1) vs O(n) lookup speed race.',
    targetTab: 'THEORY',
    targetChapterId: 'theory-01',
  },
  {
    id: 'fn-02-modulo',
    number: '02',
    code: 'FN-02',
    title: 'THE HASH FUNCTION & MODULO',
    category: 'FOUNDATION',
    description: 'Master the core modulus formula: h(key) = key mod table size to map numbers into array bounds.',
    criteriaDescription: 'Use the interactive modulo arithmetic calculator with at least 2 distinct keys and table sizes.',
    targetTab: 'THEORY',
    targetChapterId: 'theory-02',
  },
  {
    id: 'fn-03-table',
    number: '03',
    code: 'FN-03',
    title: 'THE HASH TABLE ARCHITECTURE',
    category: 'FOUNDATION',
    description: 'Associative data structures mapping keys to values using contiguous array storage and direct addressing.',
    criteriaDescription: 'Study the hash table architecture, key-value storage, and direct memory translation.',
    targetTab: 'THEORY',
    targetChapterId: 'theory-03',
  },
  {
    id: 'fn-04-lifecycle',
    number: '04',
    code: 'FN-04',
    title: 'THE HASHING LIFECYCLE PIPELINE',
    category: 'FOUNDATION',
    description: 'Master the 4-step pipeline for every Insert, Search, and Delete operation.',
    criteriaDescription: 'Inspect the step-by-step hashing pipeline from key input to memory placement.',
    targetTab: 'THEORY',
    targetChapterId: 'theory-04',
  },
  {
    id: 'fn-05-collision',
    number: '05',
    code: 'FN-05',
    title: 'WHAT IS A COLLISION & PARADOX',
    category: 'FOUNDATION',
    description: 'The mathematical inevitability of collisions under the Pigeonhole Principle and Birthday Paradox.',
    criteriaDescription: 'Understand why collisions occur and why resolution strategies are essential.',
    targetTab: 'THEORY',
    targetChapterId: 'theory-05',
  },
  {
    id: 'fn-06-chaining',
    number: '06',
    code: 'FN-06',
    title: 'SEPARATE CHAINING (CLOSED ADDR)',
    category: 'TECHNIQUE',
    description: 'Closed addressing strategy where each slot holds a linked list to gracefully store colliding elements.',
    criteriaDescription: 'Master linked bucket insertion and collision resolution.',
    targetTab: 'THEORY',
    targetChapterId: 'theory-06',
  },
  {
    id: 'fn-07-linear',
    number: '07',
    code: 'FN-07',
    title: 'LINEAR PROBING (OPEN ADDRESSING)',
    category: 'TECHNIQUE',
    description: 'Open addressing algorithm searching sequentially (+1, +2...) for the nearest open slot upon collision.',
    criteriaDescription: 'Master sequential slot searching and probe sequence calculation.',
    targetTab: 'THEORY',
    targetChapterId: 'theory-07',
  },
  {
    id: 'fn-08-quadratic',
    number: '08',
    code: 'FN-08',
    title: 'QUADRATIC PROBING (SQUARE LEAPS)',
    category: 'TECHNIQUE',
    description: 'Leaping open addressing using square increments (+1², +2², +3²) to avoid primary clustering.',
    criteriaDescription: 'Master square leap probing and secondary clustering mitigation.',
    targetTab: 'THEORY',
    targetChapterId: 'theory-08',
  },
  {
    id: 'fn-09-double',
    number: '09',
    code: 'FN-09',
    title: 'DOUBLE HASHING (DUAL FUNCTION)',
    category: 'TECHNIQUE',
    description: 'Advanced dual-hash resolution where a second function h2(key) computes a unique non-zero jump interval.',
    criteriaDescription: 'Master dual-hash computation and step size calculation.',
    targetTab: 'THEORY',
    targetChapterId: 'theory-09',
  },
  {
    id: 'fn-10-realworld',
    number: '10',
    code: 'FN-10',
    title: 'REAL-WORLD APPLICATIONS',
    category: 'ANALYSIS',
    description: 'Explore databases, compilers, caches, and distributed consistent hashing in production systems.',
    criteriaDescription: 'Study industry use cases and production hash table deployments.',
    targetTab: 'THEORY',
    targetChapterId: 'theory-10',
  },
  {
    id: 'fn-11-advantages',
    number: '11',
    code: 'FN-11',
    title: 'CORE ADVANTAGES & PERFORMANCE',
    category: 'ANALYSIS',
    description: 'Deep dive into algorithmic complexity: average O(1) vs worst-case O(n) trade-offs.',
    criteriaDescription: 'Analyze time complexities, space requirements, and hardware cache efficiency.',
    targetTab: 'THEORY',
    targetChapterId: 'theory-11',
  },
  {
    id: 'fn-12-tradeoffs',
    number: '12',
    code: 'FN-12',
    title: 'LIMITATIONS & TRADEOFFS',
    category: 'ANALYSIS',
    description: 'Understand unsorted keys, lack of range queries, rehashing overhead, and cryptographic hashing.',
    criteriaDescription: 'Analyze memory overhead, range search limits, and load factor thresholds.',
    targetTab: 'THEORY',
    targetChapterId: 'theory-12',
  },
];

const INITIAL_PROGRESS: UserProgressState = {
  version: 2,
  userId: 'user_alice',
  topicId: 'hashing',
  modules: {
    'fn-01-basics': 'NOT_STARTED',
    'fn-02-modulo': 'NOT_STARTED',
    'fn-03-table': 'NOT_STARTED',
    'fn-04-lifecycle': 'NOT_STARTED',
    'fn-05-collision': 'NOT_STARTED',
    'fn-06-chaining': 'NOT_STARTED',
    'fn-07-linear': 'NOT_STARTED',
    'fn-08-quadratic': 'NOT_STARTED',
    'fn-09-double': 'NOT_STARTED',
    'fn-10-realworld': 'NOT_STARTED',
    'fn-11-advantages': 'NOT_STARTED',
    'fn-12-tradeoffs': 'NOT_STARTED',
  },
  moduleProgress: {},
  completedTheoryChapters: [],
  currentTheoryChapterId: 'theory-01',
  levelCompletedKeys: {},
  levelsCompleted: [],
  levelsMastered: [],
  quizScores: {},
  quizSubmitted: false,
  quizFinalScore: 0,
  masterChallengesCompleted: [],
  sandboxOperationsCount: 0,
  totalScore: 0,
  streak: 0,
  currentActiveModuleId: 'fn-01-basics',
  lastActiveTimestamp: Date.now(),
  completedVideos: [],
  hasCelebrated100Percent: false,
};

// Normalized map of chapter aliases to standard IDs
export const THEORY_ID_MAP: Record<string, string> = {
  'what-is-hashing': 'theory-01',
  'hash-function': 'theory-02',
  'hash-table': 'theory-03',
  'hashing-lifecycle': 'theory-04',
  'what-is-a-collision': 'theory-05',
  'separate-chaining': 'theory-06',
  'linear-probing': 'theory-07',
  'quadratic-probing': 'theory-08',
  'double-hashing': 'theory-09',
  'real-world-applications': 'theory-10',
  'core-advantages': 'theory-11',
  'limitations-tradeoffs': 'theory-12',
  'load-factor': 'theory-08',
  '01': 'theory-01',
  '02': 'theory-02',
  '03': 'theory-03',
  '04': 'theory-04',
  '05': 'theory-05',
  '06': 'theory-06',
  '07': 'theory-07',
  '08': 'theory-08',
  '09': 'theory-09',
  '10': 'theory-10',
  '11': 'theory-11',
  '12': 'theory-12',
};

export const normalizeTheoryChapterId = (idOrSlug: string): string => {
  if (!idOrSlug) return 'theory-01';
  if (idOrSlug.startsWith('theory-')) return idOrSlug;
  return THEORY_ID_MAP[idOrSlug] || idOrSlug;
};

type ProgressListener = (state: UserProgressState) => void;

class ProgressManager {
  private currentUserId: string;
  private state: UserProgressState;
  private listeners: Set<ProgressListener> = new Set();

  constructor() {
    this.currentUserId = userManager.getCurrentUserId();
    this.state = this.loadState(this.currentUserId);

    if (typeof window !== 'undefined') {
      window.addEventListener('hash_user_changed', (e: Event) => {
        const customEvent = e as CustomEvent;
        const newUserId = customEvent.detail?.id || userManager.getCurrentUserId();
        this.handleUserSwitch(newUserId);
      });
      (window as any).progressManager = this;
    }
  }

  public getCurrentUserId(): string {
    return this.currentUserId;
  }

  public handleUserSwitch(newUserId: string) {
    if (!newUserId) return;
    this.currentUserId = newUserId;
    this.state = this.loadState(newUserId);
    this.notifyListeners();
  }

  private loadState(userId: string = this.currentUserId): UserProgressState {
    const defaultState: UserProgressState = {
      ...INITIAL_PROGRESS,
      userId,
      topicId: 'hashing',
    };

    if (typeof window === 'undefined') return defaultState;
    try {
      const storageKey = userManager.getProgressKey(userId);
      const stored = localStorage.getItem(storageKey);
      if (!stored) return defaultState;
      const parsed = JSON.parse(stored);
      if (parsed && parsed.version === 2) {
        return {
          ...defaultState,
          ...parsed,
          userId,
          topicId: 'hashing',
          completedTheoryChapters: Array.isArray(parsed.completedTheoryChapters)
            ? Array.from(new Set(parsed.completedTheoryChapters.map(normalizeTheoryChapterId)))
            : [],
          currentTheoryChapterId: parsed.currentTheoryChapterId
            ? normalizeTheoryChapterId(parsed.currentTheoryChapterId)
            : 'theory-01',
          completedVideos: Array.isArray(parsed.completedVideos)
            ? Array.from(new Set(parsed.completedVideos))
            : [],
          levelsCompleted: Array.isArray(parsed.levelsCompleted)
            ? Array.from(new Set(parsed.levelsCompleted))
            : [],
        };
      }
      return defaultState;
    } catch {
      return defaultState;
    }
  }

  private saveState() {
    if (typeof window === 'undefined') return;
    try {
      this.state.userId = this.currentUserId;
      this.state.topicId = 'hashing';
      this.state.lastActiveTimestamp = Date.now();
      const storageKey = userManager.getProgressKey(this.currentUserId);
      localStorage.setItem(storageKey, JSON.stringify(this.state));
      this.notifyListeners();
    } catch {
      // Ignore write errors
    }
  }

  public subscribe(listener: ProgressListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const copy = this.getState();
    this.listeners.forEach((fn) => fn(copy));
  }

  public getState(): UserProgressState {
    return JSON.parse(JSON.stringify(this.state));
  }

  // 1. THEORY STATS (12 Modules)
  public getTheoryStats() {
    const list = Array.isArray(this.state.completedTheoryChapters)
      ? Array.from(new Set(this.state.completedTheoryChapters))
      : [];
    const completed = Math.min(12, list.length);
    const total = 12;
    const percentage = Math.round((completed / total) * 100);
    return {
      total,
      completed,
      percentage,
      isComplete: completed >= total,
      completedIds: [...list],
      currentChapterId: this.state.currentTheoryChapterId,
    };
  }

  // 2. VIDEO STATS (2 Video Lessons)
  public getVideoStats() {
    const list = Array.isArray(this.state.completedVideos) ? this.state.completedVideos : [];
    const isIntroCompleted = list.includes('lesson-01') || list.includes('introduction');
    const isCollisionCompleted = list.includes('lesson-02') || list.includes('collision');
    const completed = (isIntroCompleted ? 1 : 0) + (isCollisionCompleted ? 1 : 0);
    const total = 2;
    const percentage = Math.round((completed / total) * 100);

    return {
      total,
      completed,
      percentage,
      isIntroCompleted,
      isCollisionCompleted,
      isComplete: completed >= total,
      completedVideos: [...list],
    };
  }

  // 3. GAME STATS (5 Levels)
  public getGameStats() {
    const rawList = Array.isArray(this.state.levelsCompleted) ? this.state.levelsCompleted : [];
    const completedList = Array.from(new Set(rawList.filter((lvl) => lvl >= 1 && lvl <= 5)));
    const completed = Math.min(5, completedList.length);
    const total = 5;
    const percentage = Math.round((completed / total) * 100);

    return {
      total,
      completed,
      percentage,
      isComplete: completed >= total,
      completedLevels: [...completedList],
    };
  }

  // 4. QUIZ STATS (1 Whole Quiz)
  public getQuizStats() {
    const isSubmitted = Boolean(this.state.quizSubmitted);
    const completed = isSubmitted ? 1 : 0;
    const total = 1;
    const percentage = isSubmitted ? 100 : 0;

    return {
      total,
      completed,
      percentage,
      isSubmitted,
      finalScore: this.state.quizFinalScore || 0,
      isComplete: isSubmitted,
    };
  }

  // ALL 12 MODULES
  public getModules(): ModuleRecord[] {
    const theoryDone = this.state.completedTheoryChapters || [];
    const levelsDone = this.state.levelsCompleted || [];

    const moduleMapping: Record<string, string> = {
      'fn-01-basics': 'theory-01',
      'fn-02-modulo': 'theory-02',
      'fn-03-table': 'theory-03',
      'fn-04-lifecycle': 'theory-04',
      'fn-05-collision': 'theory-05',
      'fn-06-chaining': 'theory-06',
      'fn-07-linear': 'theory-07',
      'fn-08-quadratic': 'theory-08',
      'fn-09-double': 'theory-09',
      'fn-10-realworld': 'theory-10',
      'fn-11-advantages': 'theory-11',
      'fn-12-tradeoffs': 'theory-12',
    };

    return FIELD_NOTES_MODULES.map((m) => {
      let status = this.state.modules[m.id] || 'NOT_STARTED';
      let progressPercent = this.state.moduleProgress[m.id] || 0;
      const chapterId = moduleMapping[m.id];

      if (chapterId && theoryDone.includes(chapterId)) {
        status = 'COMPLETED';
        progressPercent = 100;
      }

      // Also support game level masteries for interactive modules
      if (m.id === 'fn-06-chaining' && levelsDone.includes(2)) {
        status = this.state.levelsMastered.includes(2) ? 'MASTERED' : 'COMPLETED';
        progressPercent = 100;
      } else if (m.id === 'fn-07-linear' && levelsDone.includes(3)) {
        status = this.state.levelsMastered.includes(3) ? 'MASTERED' : 'COMPLETED';
        progressPercent = 100;
      } else if (m.id === 'fn-08-quadratic' && levelsDone.includes(4)) {
        status = this.state.levelsMastered.includes(4) ? 'MASTERED' : 'COMPLETED';
        progressPercent = 100;
      } else if (m.id === 'fn-09-double' && levelsDone.includes(5)) {
        status = this.state.levelsMastered.includes(5) ? 'MASTERED' : 'COMPLETED';
        progressPercent = 100;
      }

      if (status === 'COMPLETED' || status === 'MASTERED') {
        progressPercent = 100;
      } else if (status === 'IN_PROGRESS' && progressPercent === 0) {
        progressPercent = 50;
      }

      return {
        ...m,
        status,
        progressPercent,
      };
    });
  }

  // OVERALL PROGRESS (20 Unique Activities)
  public getStats() {
    const theory = this.getTheoryStats();
    const video = this.getVideoStats();
    const game = this.getGameStats();
    const quiz = this.getQuizStats();

    // Exactly 20 distinct measurable learning activities:
    // 12 Theory Modules + 5 Game Levels + 2 Videos + 1 Quiz
    const total = 20;
    const completed = theory.completed + video.completed + game.completed + quiz.completed;
    const isAllComplete =
      theory.completed === 12 &&
      video.completed === 2 &&
      game.completed === 5 &&
      quiz.completed === 1;

    // Strict 100% calculation: exactly 100% ONLY when every activity is finished
    const percentage = isAllComplete
      ? 100
      : Math.min(99, Math.max(0, Math.round((completed / total) * 100)));

    const modules = this.getModules();
    const mastered = modules.filter((m) => m.status === 'MASTERED').length;

    // Find next unfinished module
    const currentUnfinished =
      modules.find(
        (m) => m.status === 'IN_PROGRESS' || m.status === 'NOT_STARTED'
      ) || modules[modules.length - 1];

    return {
      total,
      completed,
      mastered,
      percentage,
      isAllComplete,
      nextModule: currentUnfinished,
      theory,
      video,
      game,
      quiz,
    };
  }

  // =========================================================================
  // THEORY SPECIFIC PROGRESS (Idempotent & Exact)
  // =========================================================================
  public isTheoryChapterCompleted(chapterId: string): boolean {
    const normalized = normalizeTheoryChapterId(chapterId);
    return (this.state.completedTheoryChapters || []).includes(normalized);
  }

  public completeTheoryChapter(chapterId: string): boolean {
    const normalized = normalizeTheoryChapterId(chapterId);

    if (!this.state.completedTheoryChapters) {
      this.state.completedTheoryChapters = [];
    }

    // Idempotent check: if already completed, do not re-add
    if (this.state.completedTheoryChapters.includes(normalized)) {
      return false; // Already completed
    }

    this.state.completedTheoryChapters.push(normalized);
    this.state.currentTheoryChapterId = normalized;

    // Synchronize underlying module ID
    const chapterToModuleMap: Record<string, string> = {
      'theory-01': 'fn-01-basics',
      'theory-02': 'fn-02-modulo',
      'theory-03': 'fn-03-table',
      'theory-04': 'fn-04-lifecycle',
      'theory-05': 'fn-05-collision',
      'theory-06': 'fn-06-chaining',
      'theory-07': 'fn-07-linear',
      'theory-08': 'fn-08-quadratic',
      'theory-09': 'fn-09-double',
      'theory-10': 'fn-10-realworld',
      'theory-11': 'fn-11-advantages',
      'theory-12': 'fn-12-tradeoffs',
    };

    const targetModuleId = chapterToModuleMap[normalized];
    if (targetModuleId) {
      this.completeModule(targetModuleId);
    }

    this.saveState();
    return true; // Newly completed!
  }

  public setCurrentTheoryChapter(chapterId: string) {
    const normalized = normalizeTheoryChapterId(chapterId);
    this.state.currentTheoryChapterId = normalized;
    this.saveState();
  }

  // =========================================================================
  // VIDEO SPECIFIC PROGRESS (Idempotent & Independent)
  // =========================================================================
  public isVideoCompleted(videoId: string): boolean {
    const list = this.state.completedVideos || [];
    return list.includes(videoId);
  }

  public completeVideo(videoId: string): boolean {
    if (!this.state.completedVideos) {
      this.state.completedVideos = [];
    }
    if (this.state.completedVideos.includes(videoId)) {
      return false; // Already completed
    }
    this.state.completedVideos.push(videoId);
    this.saveState();
    return true; // Newly completed!
  }

  // =========================================================================
  // MODULE LEVEL METHODS
  // =========================================================================
  public startModule(moduleId: string) {
    if (!this.state.modules[moduleId] || this.state.modules[moduleId] === 'NOT_STARTED') {
      this.state.modules[moduleId] = 'IN_PROGRESS';
      this.state.moduleProgress[moduleId] = Math.max(this.state.moduleProgress[moduleId] || 0, 25);
      this.state.currentActiveModuleId = moduleId;
      this.saveState();
    }
  }

  public updateModuleProgress(moduleId: string, percent: number) {
    if (this.state.modules[moduleId] !== 'COMPLETED' && this.state.modules[moduleId] !== 'MASTERED') {
      this.state.modules[moduleId] = 'IN_PROGRESS';
      this.state.moduleProgress[moduleId] = Math.min(
        100,
        Math.max(this.state.moduleProgress[moduleId] || 0, percent)
      );
      this.state.currentActiveModuleId = moduleId;
      this.saveState();
    }
  }

  public completeModule(moduleId: string, isMastered: boolean = false) {
    const currentStatus = this.state.modules[moduleId];
    const newStatus: ModuleStatus =
      isMastered || currentStatus === 'MASTERED' ? 'MASTERED' : 'COMPLETED';

    this.state.modules[moduleId] = newStatus;
    this.state.moduleProgress[moduleId] = 100;
    this.state.currentActiveModuleId = moduleId;
    this.saveState();
  }

  public markLevelCompleted(levelId: number, scoreAwarded: number = 100, isPerfect: boolean = false) {
    if (!this.state.levelsCompleted) {
      this.state.levelsCompleted = [];
    }
    if (!this.state.levelsMastered) {
      this.state.levelsMastered = [];
    }

    const wasAlreadyCompleted = this.state.levelsCompleted.includes(levelId);

    if (!wasAlreadyCompleted) {
      this.state.levelsCompleted.push(levelId);
    }
    if (isPerfect && !this.state.levelsMastered.includes(levelId)) {
      this.state.levelsMastered.push(levelId);
    }

    this.saveState();
  }

  public checkAndCompleteCertification() {
    const stats = this.getStats();
    if (stats.isAllComplete && !this.state.hasCelebrated100Percent) {
      this.saveState();
    }
  }

  public setCelebrationAcknowledged() {
    this.state.hasCelebrated100Percent = true;
    this.saveState();
  }

  public recordQuizCompletion(scores: Record<number, number>, correctCount: number, totalQuestions: number) {
    this.state.quizScores = scores;
    this.state.quizSubmitted = true;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    this.state.quizFinalScore = percentage;
    this.saveState();
  }

  public resetQuizAttempt() {
    this.state.quizScores = {};
    this.state.quizSubmitted = false;
    this.state.quizFinalScore = 0;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(userManager.getQuizAnswersKey(this.currentUserId));
        localStorage.removeItem(userManager.getQuizSubmittedKey(this.currentUserId));
      } catch {
        // Ignore storage errors
      }
    }
    this.saveState();
  }

  public recordMasterChallenge(challengeId: string) {
    if (!this.state.masterChallengesCompleted) {
      this.state.masterChallengesCompleted = [];
    }
    if (!this.state.masterChallengesCompleted.includes(challengeId)) {
      this.state.masterChallengesCompleted.push(challengeId);
    }
    this.saveState();
  }

  public recordSandboxOp() {
    this.state.sandboxOperationsCount += 1;
    this.saveState();
  }

  public resetProgress() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(userManager.getQuizAnswersKey(this.currentUserId));
        localStorage.removeItem(userManager.getQuizSubmittedKey(this.currentUserId));
        localStorage.removeItem(userManager.getProgressKey(this.currentUserId));
      } catch {
        // Ignore storage errors
      }
    }

    this.state = {
      version: 2,
      userId: this.currentUserId,
      topicId: 'hashing',
      modules: {
        'fn-01-basics': 'NOT_STARTED',
        'fn-02-modulo': 'NOT_STARTED',
        'fn-03-table': 'NOT_STARTED',
        'fn-04-lifecycle': 'NOT_STARTED',
        'fn-05-collision': 'NOT_STARTED',
        'fn-06-chaining': 'NOT_STARTED',
        'fn-07-linear': 'NOT_STARTED',
        'fn-08-quadratic': 'NOT_STARTED',
        'fn-09-double': 'NOT_STARTED',
        'fn-10-realworld': 'NOT_STARTED',
        'fn-11-advantages': 'NOT_STARTED',
        'fn-12-tradeoffs': 'NOT_STARTED',
      },
      moduleProgress: {},
      completedTheoryChapters: [],
      currentTheoryChapterId: 'theory-01',
      levelCompletedKeys: {},
      levelsCompleted: [],
      levelsMastered: [],
      quizScores: {},
      quizSubmitted: false,
      quizFinalScore: 0,
      masterChallengesCompleted: [],
      sandboxOperationsCount: 0,
      totalScore: 0,
      streak: 0,
      currentActiveModuleId: 'fn-01-basics',
      lastActiveTimestamp: Date.now(),
      completedVideos: [],
      hasCelebrated100Percent: false,
    };
    this.saveState();
  }
}

export const progressManager = new ProgressManager();
