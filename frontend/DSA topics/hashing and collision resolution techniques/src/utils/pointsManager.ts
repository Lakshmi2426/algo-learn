import { progressManager } from './progressManager';
import { userManager } from './userManager';

export interface PointActivityEvent {
  id: string;
  title: string;
  typeLabel: string;
  points: number;
  timestamp: number;
  userId?: string;
  topicId?: string;
  activityId?: string;
  activityType?: string;
  completionStatus?: string;
}

export interface PointNotification {
  id: string;
  amount: number;
  title: string;
  message: string;
  type: 'reward' | 'penalty';
  timestamp: number;
}

export interface PointsState {
  theoryPoints: number; // 0 points (Learn/Theory contributes 0 pts)
  quizPoints: number; // Max 30 (+3 correct, -2 wrong, 0 timeout, max positive 30)
  visualizePoints: number; // 0 to 20 (2 videos * 10 pts)
  gamePoints: number; // 0 to 50 (5 levels * 10 pts)
  hintPenalties: number; // 2 pts per genuine hint use
  guidedSolvePenalties: number; // 4 pts per genuine guided-solve use
  hintUsesCount: number;
  guidedSolveUsesCount: number;
  totalPoints: number; // Real total, supports negative values, max positive 100
  userId?: string;
  topicId?: string;
}

interface StoredPointsData {
  version: 3;
  userId?: string;
  topicId?: string;
  quizPoints: number;
  processedQuizQuestionIds: number[];
  completedGameLevelIds: number[];
  completedVideoIds: string[];
  deductedHintLevelIds: number[];
  deductedGuidedSolveLevelIds: number[];
  hintUsesCount: number;
  guidedSolveUsesCount: number;
  activities: PointActivityEvent[];
}

const DEFAULT_STORED_DATA: StoredPointsData = {
  version: 3,
  userId: 'user_alice',
  topicId: 'hashing',
  quizPoints: 0,
  processedQuizQuestionIds: [],
  completedGameLevelIds: [],
  completedVideoIds: [],
  deductedHintLevelIds: [],
  deductedGuidedSolveLevelIds: [],
  hintUsesCount: 0,
  guidedSolveUsesCount: 0,
  activities: [],
};

type PointsListener = (state: PointsState) => void;
type NotificationListener = (notification: PointNotification) => void;

class PointsManager {
  private currentUserId: string;
  private data: StoredPointsData;
  private listeners: Set<PointsListener> = new Set();
  private notificationListeners: Set<NotificationListener> = new Set();

  private knownCompletedVideos: Set<string> = new Set();
  private knownCompletedLevels: Set<number> = new Set();
  private lastHintTimestamp: number = 0;
  private lastGuidedSolveTimestamp: number = 0;

  constructor() {
    this.currentUserId = userManager.getCurrentUserId();
    this.data = this.loadData(this.currentUserId);
    this.initKnownCompletions();

    // Listen to progressManager updates (videos, levels completed, or resets)
    progressManager.subscribe(() => {
      this.syncProgressActivities(true);
      this.notifyListeners();
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('hash_user_changed', (e: Event) => {
        const customEvent = e as CustomEvent;
        const newUserId = customEvent.detail?.id || userManager.getCurrentUserId();
        this.handleUserSwitch(newUserId);
      });
      (window as any).pointsManager = this;
    }
  }

  public getCurrentUserId(): string {
    return this.currentUserId;
  }

  public handleUserSwitch(newUserId: string) {
    if (!newUserId) return;
    this.currentUserId = newUserId;
    this.knownCompletedVideos.clear();
    this.knownCompletedLevels.clear();
    this.lastHintTimestamp = 0;
    this.lastGuidedSolveTimestamp = 0;
    this.data = this.loadData(newUserId);
    this.initKnownCompletions();
    this.notifyListeners();
  }

  private initKnownCompletions() {
    try {
      const pState = progressManager.getState();
      if (Array.isArray(pState.completedVideos)) {
        pState.completedVideos.forEach((v) => {
          this.knownCompletedVideos.add(v);
          if (!this.data.completedVideoIds.includes(v)) {
            this.data.completedVideoIds.push(v);
          }
        });
      }
      if (Array.isArray(pState.levelsCompleted)) {
        pState.levelsCompleted.forEach((l) => {
          this.knownCompletedLevels.add(l);
          if (!this.data.completedGameLevelIds.includes(l)) {
            this.data.completedGameLevelIds.push(l);
          }
        });
      }
    } catch {
      // Ignore
    }
    this.syncProgressActivities(false);
  }

  public isLevelCompleted(levelId?: number): boolean {
    if (typeof levelId !== 'number' || isNaN(levelId)) return false;
    if (this.data.completedGameLevelIds && this.data.completedGameLevelIds.includes(levelId)) {
      return true;
    }
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

  public isHintAlreadyDeducted(levelId?: number): boolean {
    if (typeof levelId !== 'number' || isNaN(levelId)) return false;
    return Boolean(this.data.deductedHintLevelIds && this.data.deductedHintLevelIds.includes(levelId));
  }

  public isGuidedSolveAlreadyDeducted(levelId?: number): boolean {
    if (typeof levelId !== 'number' || isNaN(levelId)) return false;
    return Boolean(this.data.deductedGuidedSolveLevelIds && this.data.deductedGuidedSolveLevelIds.includes(levelId));
  }

  private loadData(userId: string = this.currentUserId): StoredPointsData {
    const defaultData: StoredPointsData = {
      ...DEFAULT_STORED_DATA,
      userId,
      topicId: 'hashing',
    };

    if (typeof window === 'undefined') return defaultData;
    try {
      const storageKey = userManager.getPointsKey(userId);
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed) {
          // Initialize completed game levels
          let completedGameLevelIds: number[] = Array.isArray(parsed.completedGameLevelIds)
            ? Array.from(new Set(parsed.completedGameLevelIds.map(Number).filter((n: number) => n >= 1 && n <= 5)))
            : [];
          if (completedGameLevelIds.length === 0) {
            try {
              const pLvl = progressManager.getState().levelsCompleted;
              if (Array.isArray(pLvl)) {
                completedGameLevelIds = Array.from(new Set(pLvl.filter((n) => n >= 1 && n <= 5)));
              }
            } catch {
              // Ignore
            }
          }

          // Initialize completed videos
          let completedVideoIds: string[] = Array.isArray(parsed.completedVideoIds)
            ? Array.from(new Set(parsed.completedVideoIds.map(String)))
            : [];
          if (completedVideoIds.length === 0) {
            try {
              const pVid = progressManager.getState().completedVideos;
              if (Array.isArray(pVid)) {
                completedVideoIds = Array.from(new Set(pVid.map(String)));
              }
            } catch {
              // Ignore
            }
          }

          // Initialize deducted hint levels
          let deductedHintLevelIds: number[] = Array.isArray(parsed.deductedHintLevelIds)
            ? Array.from(new Set(parsed.deductedHintLevelIds.map(Number).filter((n: number) => n >= 1 && n <= 5)))
            : [];

          // Initialize deducted guided solve levels
          let deductedGuidedSolveLevelIds: number[] = Array.isArray(parsed.deductedGuidedSolveLevelIds)
            ? Array.from(new Set(parsed.deductedGuidedSolveLevelIds.map(Number).filter((n: number) => n >= 1 && n <= 5)))
            : [];

          // If migrating from legacy counts, deduce level numbers from existing activities
          if (deductedHintLevelIds.length === 0 && typeof parsed.hintUsesCount === 'number' && parsed.hintUsesCount > 0 && Array.isArray(parsed.activities)) {
            parsed.activities.forEach((act: any) => {
              if (act.typeLabel === 'HINT USED' || act.activityType === 'HINT') {
                const match = (act.title || act.activityId || '').match(/(\d+)/);
                if (match) {
                  const lNum = parseInt(match[1], 10);
                  if (lNum >= 1 && lNum <= 5 && !deductedHintLevelIds.includes(lNum)) {
                    deductedHintLevelIds.push(lNum);
                  }
                }
              }
            });
          }

          if (deductedGuidedSolveLevelIds.length === 0 && typeof parsed.guidedSolveUsesCount === 'number' && parsed.guidedSolveUsesCount > 0 && Array.isArray(parsed.activities)) {
            parsed.activities.forEach((act: any) => {
              if (act.typeLabel === 'GUIDED SOLVE USED' || act.activityType === 'GUIDED_SOLVE') {
                const match = (act.title || act.activityId || '').match(/(\d+)/);
                if (match) {
                  const lNum = parseInt(match[1], 10);
                  if (lNum >= 1 && lNum <= 5 && !deductedGuidedSolveLevelIds.includes(lNum)) {
                    deductedGuidedSolveLevelIds.push(lNum);
                  }
                }
              }
            });
          }

          return {
            version: 3,
            userId,
            topicId: 'hashing',
            quizPoints: typeof parsed.quizPoints === 'number' ? Math.min(30, parsed.quizPoints) : 0,
            processedQuizQuestionIds: Array.isArray(parsed.processedQuizQuestionIds) ? parsed.processedQuizQuestionIds : [],
            completedGameLevelIds,
            completedVideoIds,
            deductedHintLevelIds,
            deductedGuidedSolveLevelIds,
            hintUsesCount: typeof parsed.hintUsesCount === 'number' ? parsed.hintUsesCount : deductedHintLevelIds.length,
            guidedSolveUsesCount: typeof parsed.guidedSolveUsesCount === 'number' ? parsed.guidedSolveUsesCount : deductedGuidedSolveLevelIds.length,
            activities: Array.isArray(parsed.activities)
              ? parsed.activities.map((a: any) => ({
                  ...a,
                  userId: a.userId || userId,
                  topicId: a.topicId || 'hashing',
                  activityId: a.activityId || a.id,
                  activityType: a.activityType || 'ACTIVITY',
                  completionStatus: a.completionStatus || (a.points >= 0 ? 'COMPLETED' : 'PENALTY'),
                }))
              : [],
          };
        }
      }

      // Check for pre-existing quiz answers in user's quiz storage and migrate
      const existingAnswersRaw = localStorage.getItem(userManager.getQuizAnswersKey(userId));
      if (existingAnswersRaw) {
        try {
          const parsedAnswers = JSON.parse(existingAnswersRaw);
          if (parsedAnswers && typeof parsedAnswers === 'object') {
            let initialQuizPts = 0;
            const processedIds: number[] = [];
            const initialActivities: PointActivityEvent[] = [];
            Object.values(parsedAnswers).forEach((rec: any) => {
              if (rec && typeof rec.questionId === 'number') {
                processedIds.push(rec.questionId);
                if (rec.isTimedOut) {
                  initialActivities.push({
                    id: `quiz-init-${rec.questionId}`,
                    title: `Quiz Question ${rec.questionId} Timed Out (0 pts)`,
                    typeLabel: 'QUIZ TIMEOUT',
                    points: 0,
                    timestamp: Date.now() - 60000,
                    userId,
                    topicId: 'hashing',
                    activityId: `quiz-${rec.questionId}`,
                    activityType: 'QUIZ',
                    completionStatus: 'TIMED_OUT',
                  });
                } else if (rec.isCorrect) {
                  initialQuizPts += 3;
                  initialActivities.push({
                    id: `quiz-init-${rec.questionId}`,
                    title: `Correct Quiz Answer (Q${rec.questionId})`,
                    typeLabel: 'QUIZ CORRECT',
                    points: 3,
                    timestamp: Date.now() - 60000,
                    userId,
                    topicId: 'hashing',
                    activityId: `quiz-${rec.questionId}`,
                    activityType: 'QUIZ',
                    completionStatus: 'CORRECT',
                  });
                } else {
                  initialQuizPts -= 2;
                  initialActivities.push({
                    id: `quiz-init-${rec.questionId}`,
                    title: `Incorrect Quiz Answer (Q${rec.questionId})`,
                    typeLabel: 'QUIZ INCORRECT',
                    points: -2,
                    timestamp: Date.now() - 60000,
                    userId,
                    topicId: 'hashing',
                    activityId: `quiz-${rec.questionId}`,
                    activityType: 'QUIZ',
                    completionStatus: 'INCORRECT',
                  });
                }
              }
            });
            initialQuizPts = Math.min(30, initialQuizPts);
            const initialData: StoredPointsData = {
              version: 2,
              userId,
              topicId: 'hashing',
              quizPoints: initialQuizPts,
              processedQuizQuestionIds: processedIds,
              hintUsesCount: 0,
              guidedSolveUsesCount: 0,
              activities: initialActivities,
            };
            localStorage.setItem(storageKey, JSON.stringify(initialData));
            return initialData;
          }
        } catch {
          // Ignore
        }
      }

      return defaultData;
    } catch {
      return defaultData;
    }
  }

  private saveData() {
    if (typeof window === 'undefined') return;
    try {
      this.data.userId = this.currentUserId;
      this.data.topicId = 'hashing';
      const currentPts = this.getPoints();
      const storageKey = userManager.getPointsKey(this.currentUserId);
      const dataToSave = {
        ...this.data,
        totalPoints: currentPts.totalPoints,
        visualizePoints: currentPts.visualizePoints,
        gamePoints: currentPts.gamePoints,
        quizPoints: currentPts.quizPoints,
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      localStorage.setItem('hash_quest_points_system_v2', JSON.stringify({
        totalPoints: currentPts.totalPoints,
      }));
      localStorage.setItem('algolearn_topic_progress_hashing', String(currentPts.totalPoints));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Syncs completed video (10 pts each, max 20) and game activities (10 pts each, max 50) from progressManager.
   * Learn/Theory contributes 0 points.
   * Ensures points are unique and added for single time only!
   */
  private syncProgressActivities(emitNotification: boolean = false) {
    try {
      const pState = progressManager.getState();
      let hasChanges = false;

      // Handle progress reset synchronization
      if (
        Array.isArray(pState.levelsCompleted) &&
        pState.levelsCompleted.length === 0 &&
        Array.isArray(pState.completedVideos) &&
        pState.completedVideos.length === 0 &&
        this.knownCompletedLevels.size > 0
      ) {
        this.resetAll();
        return;
      }

      // 1. Game Levels Completed (5 levels, 10 pts each = max 50 pts)
      if (Array.isArray(pState.levelsCompleted)) {
        pState.levelsCompleted.forEach((lvl) => {
          if (lvl >= 1 && lvl <= 5) {
            const isFirstTimeCompleted = !this.data.completedGameLevelIds.includes(lvl);
            if (isFirstTimeCompleted) {
              this.data.completedGameLevelIds.push(lvl);
              this.knownCompletedLevels.add(lvl);

              const eventId = `game-lvl-${lvl}`;
              if (!this.data.activities.some((a) => a.id === eventId)) {
                this.data.activities.unshift({
                  id: eventId,
                  title: `Completed Game Level ${lvl}`,
                  typeLabel: 'GAME COMPLETED',
                  points: 10,
                  timestamp: Date.now(),
                  userId: this.currentUserId,
                  topicId: 'hashing',
                  activityId: `game-lvl-${lvl}`,
                  activityType: 'GAME',
                  completionStatus: 'COMPLETED',
                });
              }
              hasChanges = true;

              if (emitNotification) {
                this.emitNotification({
                  id: `notif-${Date.now()}-${Math.random()}`,
                  amount: 10,
                  title: '+10 Points',
                  message: 'Game Level Completed',
                  type: 'reward',
                  timestamp: Date.now(),
                });
              }
            } else {
              this.knownCompletedLevels.add(lvl);
            }
          }
        });
      }

      // 2. Visualization Modules Completed (2 modules, 10 pts each = max 20 pts)
      if (Array.isArray(pState.completedVideos)) {
        pState.completedVideos.forEach((vid) => {
          const isFirstTimeCompleted = !this.data.completedVideoIds.includes(vid);
          if (isFirstTimeCompleted) {
            this.data.completedVideoIds.push(vid);
            this.knownCompletedVideos.add(vid);

            const eventId = `video-${vid}`;
            if (!this.data.activities.some((a) => a.id === eventId)) {
              const vidNum = vid.includes('02') || vid.includes('collision') ? '2' : '1';
              this.data.activities.unshift({
                id: eventId,
                title: `Completed Visualization Module ${vidNum}`,
                typeLabel: 'VISUALIZATION COMPLETED',
                points: 10,
                timestamp: Date.now(),
                userId: this.currentUserId,
                topicId: 'hashing',
                activityId: `video-${vid}`,
                activityType: 'VISUALIZATION',
                completionStatus: 'COMPLETED',
              });
            }
            hasChanges = true;

            if (emitNotification) {
              this.emitNotification({
                id: `notif-${Date.now()}-${Math.random()}`,
                amount: 10,
                title: '+10 Points',
                message: 'Visualization Completed',
                type: 'reward',
                timestamp: Date.now(),
              });
            }
          } else {
            this.knownCompletedVideos.add(vid);
          }
        });
      }

      if (hasChanges) {
        this.saveData();
      }
    } catch {
      // Ignore
    }
  }

  public getState(): PointsState {
    return this.getPoints();
  }

  public subscribe(listener: PointsListener): () => void {
    this.listeners.add(listener);
    listener(this.getPoints());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public subscribeNotifications(listener: NotificationListener): () => void {
    this.notificationListeners.add(listener);
    return () => {
      this.notificationListeners.delete(listener);
    };
  }

  public emitNotification(notification: PointNotification) {
    this.notificationListeners.forEach((fn) => {
      try {
        fn(notification);
      } catch {
        // Safe dispatch
      }
    });
  }

  private notifyListeners() {
    const state = this.getPoints();
    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch {
        // Safe dispatch
      }
    });
  }

  /**
   * Centralized Points Calculation
   * Visualization (20) + Game (50) + Quiz (30) = 100 max positive points.
   * Learn / Theory contributes 0 points.
   * Guided Solve penalty: −4 pts per uniquely deducted level.
   * Hint penalty: −2 pts per uniquely deducted level.
   */
  public getPoints(): PointsState {
    // 1. Theory Modules: 0 points (Learn/Theory contributes zero points)
    const theoryPoints = 0;

    // 2. Quiz Points: +3 correct, −2 wrong, 0 timeout (capped at max positive 30)
    const quizPoints = Math.min(30, this.data.quizPoints);

    // 3. Visualize Modules: 2 modules, +10 points each (max 20)
    const uniqueVideosCount = Math.min(
      2,
      Math.max(
        this.data.completedVideoIds ? this.data.completedVideoIds.length : 0,
        progressManager.getVideoStats().completed
      )
    );
    const visualizePoints = Math.min(20, uniqueVideosCount * 10);

    // 4. Game Levels: 5 levels, +10 points each (max 50)
    const uniqueLevelsCount = Math.min(
      5,
      Math.max(
        this.data.completedGameLevelIds ? this.data.completedGameLevelIds.length : 0,
        progressManager.getGameStats().completed
      )
    );
    const gamePoints = Math.min(50, uniqueLevelsCount * 10);

    // 5. Hint Penalties: 2 points per genuine hint use in incomplete levels
    const hintCount = typeof this.data.hintUsesCount === 'number' ? this.data.hintUsesCount : 0;
    const hintPenalties = hintCount * 2;

    // 6. Guided-Solve Penalties: 4 points per genuine guided-solve use in incomplete levels
    const guidedSolveCount = typeof this.data.guidedSolveUsesCount === 'number' ? this.data.guidedSolveUsesCount : 0;
    const guidedSolvePenalties = guidedSolveCount * 4;

    // Total points calculation (allows negative values, maximum positive 100)
    const rawTotal = theoryPoints + quizPoints + visualizePoints + gamePoints - hintPenalties - guidedSolvePenalties;
    const totalPoints = Math.min(100, rawTotal);

    return {
      theoryPoints,
      quizPoints,
      visualizePoints,
      gamePoints,
      hintPenalties,
      guidedSolvePenalties,
      hintUsesCount: hintCount,
      guidedSolveUsesCount: guidedSolveCount,
      totalPoints,
      userId: this.currentUserId,
      topicId: 'hashing',
    };
  }

  public getActivities(): PointActivityEvent[] {
    this.syncProgressActivities(false);
    return [...this.data.activities].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Records a genuine quiz answer submission.
   * Awards +3 for correct, deducts -2 for wrong.
   * Capped at max positive 30 points.
   * Immediately updates points balance, records activity, and triggers notification.
   */
  public recordQuizAnswer(questionId: number, isCorrect: boolean): boolean {
    if (this.data.processedQuizQuestionIds.includes(questionId)) {
      return false; // Prevent duplicate scoring for the same question submission
    }

    this.data.processedQuizQuestionIds.push(questionId);

    const prevQuizPoints = this.data.quizPoints;
    const candidateQuizPoints = isCorrect ? Math.min(30, prevQuizPoints + 3) : prevQuizPoints - 2;
    const actualDelta = candidateQuizPoints - prevQuizPoints;
    this.data.quizPoints = candidateQuizPoints;

    if (actualDelta !== 0) {
      this.data.activities.unshift({
        id: `quiz-${questionId}-${Date.now()}`,
        title: isCorrect ? `Correct Quiz Answer (Q${questionId})` : `Incorrect Quiz Answer (Q${questionId})`,
        typeLabel: isCorrect ? 'QUIZ CORRECT' : 'QUIZ INCORRECT',
        points: actualDelta,
        timestamp: Date.now(),
        userId: this.currentUserId,
        topicId: 'hashing',
        activityId: `quiz-q-${questionId}`,
        activityType: 'QUIZ',
        completionStatus: isCorrect ? 'CORRECT' : 'INCORRECT',
      });
    }

    this.saveData();
    this.notifyListeners();

    // Trigger Popup Notification only for actual applied points change
    if (actualDelta > 0) {
      this.emitNotification({
        id: `notif-${Date.now()}-${Math.random()}`,
        amount: actualDelta,
        title: `+${actualDelta} ${actualDelta === 1 ? 'Point' : 'Points'}`,
        message: 'Correct Answer!',
        type: 'reward',
        timestamp: Date.now(),
      });
    } else if (actualDelta < 0) {
      this.emitNotification({
        id: `notif-${Date.now()}-${Math.random()}`,
        amount: actualDelta,
        title: `${actualDelta} ${Math.abs(actualDelta) === 1 ? 'Point' : 'Points'}`,
        message: 'Incorrect Answer',
        type: 'penalty',
        timestamp: Date.now(),
      });
    }

    return true;
  }

  /**
   * Records a quiz question timeout (0 points awarded, marks processed to prevent repeated scoring).
   */
  public recordQuizTimeout(questionId: number): boolean {
    if (this.data.processedQuizQuestionIds.includes(questionId)) {
      return false;
    }

    this.data.processedQuizQuestionIds.push(questionId);
    this.data.activities.unshift({
      id: `quiz-timeout-${questionId}-${Date.now()}`,
      title: `Quiz Question ${questionId} Timed Out (0 pts)`,
      typeLabel: 'QUIZ TIMEOUT',
      points: 0,
      timestamp: Date.now(),
      userId: this.currentUserId,
      topicId: 'hashing',
      activityId: `quiz-q-${questionId}`,
      activityType: 'QUIZ',
      completionStatus: 'TIMED_OUT',
    });

    this.saveData();
    this.notifyListeners();
    return true;
  }

  /**
   * Resets the quiz score and processed questions when needed.
   */
  public resetQuizPoints() {
    this.data.quizPoints = 0;
    this.data.processedQuizQuestionIds = [];
    this.saveData();
    this.notifyListeners();
  }

  /**
   * Records a genuine hint activation.
   * - If the level is already completed (replaying), NO points are deducted!
   * - If the level is NOT completed, deducts 2 points each time it is clicked.
   */
  public recordHintUse(levelId?: number): boolean {
    const lvl = typeof levelId === 'number' && !isNaN(levelId) ? levelId : null;

    // Strict Rule: If replaying an already completed level, points must NOT be deducted!
    if (lvl && this.isLevelCompleted(lvl)) {
      return false;
    }

    const now = Date.now();
    if (now - this.lastHintTimestamp < 300) {
      return false; // Debounce rapid clicks
    }
    this.lastHintTimestamp = now;

    if (lvl && !this.data.deductedHintLevelIds.includes(lvl)) {
      this.data.deductedHintLevelIds.push(lvl);
    }
    this.data.hintUsesCount = (this.data.hintUsesCount || 0) + 1;

    const lvlText = lvl ? `Level ${lvl}` : 'Game';
    this.data.activities.unshift({
      id: `hint-${lvl || 'act'}-${Date.now()}`,
      title: `Used Hint: ${lvlText}`,
      typeLabel: 'HINT USED',
      points: -2,
      timestamp: Date.now(),
      userId: this.currentUserId,
      topicId: 'hashing',
      activityId: `hint-${lvl || 'game'}`,
      activityType: 'HINT',
      completionStatus: 'PENALTY',
    });

    this.saveData();
    this.notifyListeners();

    // Trigger Popup Notification
    this.emitNotification({
      id: `notif-${Date.now()}-${Math.random()}`,
      amount: -2,
      title: '-2 Points',
      message: 'Hint Used',
      type: 'penalty',
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Records a genuine guided-solve activation.
   * - If the level is already completed (replaying), NO points are deducted!
   * - If the level is NOT completed, deducts 4 points each time it is activated.
   */
  public recordGuidedSolveUse(levelId?: number): boolean {
    const lvl = typeof levelId === 'number' && !isNaN(levelId) ? levelId : null;

    // Strict Rule: If replaying an already completed level, points must NOT be deducted!
    if (lvl && this.isLevelCompleted(lvl)) {
      return false;
    }

    const now = Date.now();
    if (now - this.lastGuidedSolveTimestamp < 300) {
      return false; // Debounce rapid clicks
    }
    this.lastGuidedSolveTimestamp = now;

    if (lvl && !this.data.deductedGuidedSolveLevelIds.includes(lvl)) {
      this.data.deductedGuidedSolveLevelIds.push(lvl);
    }
    this.data.guidedSolveUsesCount = (this.data.guidedSolveUsesCount || 0) + 1;

    const lvlText = lvl ? `Level ${lvl}` : 'Game';
    this.data.activities.unshift({
      id: `guided-${lvl || 'act'}-${Date.now()}`,
      title: `Used Guided Solve: ${lvlText}`,
      typeLabel: 'GUIDED SOLVE USED',
      points: -4,
      timestamp: Date.now(),
      userId: this.currentUserId,
      topicId: 'hashing',
      activityId: `guided-${lvl || 'game'}`,
      activityType: 'GUIDED_SOLVE',
      completionStatus: 'PENALTY',
    });

    this.saveData();
    this.notifyListeners();

    // Trigger Popup Notification
    this.emitNotification({
      id: `notif-${Date.now()}-${Math.random()}`,
      amount: -4,
      title: '-4 Points',
      message: 'Guided Solve Used',
      type: 'penalty',
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Resets all points data (used on global reset progress).
   */
  public resetAll() {
    this.data = {
      version: 3,
      userId: this.currentUserId,
      topicId: 'hashing',
      quizPoints: 0,
      processedQuizQuestionIds: [],
      completedGameLevelIds: [],
      completedVideoIds: [],
      deductedHintLevelIds: [],
      deductedGuidedSolveLevelIds: [],
      hintUsesCount: 0,
      guidedSolveUsesCount: 0,
      activities: [],
    };
    this.knownCompletedVideos.clear();
    this.knownCompletedLevels.clear();
    this.saveData();
    this.notifyListeners();
  }
}

export const pointsManager = new PointsManager();
