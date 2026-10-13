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
  version: 2;
  userId?: string;
  topicId?: string;
  quizPoints: number;
  processedQuizQuestionIds: number[];
  hintUsesCount: number;
  guidedSolveUsesCount: number;
  activities: PointActivityEvent[];
}

const DEFAULT_STORED_DATA: StoredPointsData = {
  version: 2,
  userId: 'user_alice',
  topicId: 'hashing',
  quizPoints: 0,
  processedQuizQuestionIds: [],
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
        pState.completedVideos.forEach((v) => this.knownCompletedVideos.add(v));
      }
      if (Array.isArray(pState.levelsCompleted)) {
        pState.levelsCompleted.forEach((l) => this.knownCompletedLevels.add(l));
      }
    } catch {
      // Ignore
    }
    this.syncProgressActivities(false);
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
        if (parsed && parsed.version === 2) {
          return {
            version: 2,
            userId,
            topicId: 'hashing',
            quizPoints: typeof parsed.quizPoints === 'number' ? Math.min(30, parsed.quizPoints) : 0,
            processedQuizQuestionIds: Array.isArray(parsed.processedQuizQuestionIds) ? parsed.processedQuizQuestionIds : [],
            hintUsesCount: typeof parsed.hintUsesCount === 'number' && parsed.hintUsesCount >= 0 ? parsed.hintUsesCount : 0,
            guidedSolveUsesCount: typeof parsed.guidedSolveUsesCount === 'number' && parsed.guidedSolveUsesCount >= 0 ? parsed.guidedSolveUsesCount : 0,
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
      const storageKey = userManager.getPointsKey(this.currentUserId);
      localStorage.setItem(storageKey, JSON.stringify(this.data));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Syncs completed video (10 pts each, max 20) and game activities (10 pts each, max 50) from progressManager.
   * Learn/Theory contributes 0 points.
   */
  private syncProgressActivities(emitNotification: boolean = false) {
    try {
      const pState = progressManager.getState();
      let hasChanges = false;

      // 1. Game Levels Completed (5 levels, 10 pts each = max 50 pts)
      if (Array.isArray(pState.levelsCompleted)) {
        pState.levelsCompleted.forEach((lvl) => {
          if (lvl >= 1 && lvl <= 5) {
            const isNewToKnown = !this.knownCompletedLevels.has(lvl);
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
              hasChanges = true;

              if (emitNotification && isNewToKnown) {
                this.emitNotification({
                  id: `notif-${Date.now()}-${Math.random()}`,
                  amount: 10,
                  title: '+10 Points',
                  message: 'Game Level Completed',
                  type: 'reward',
                  timestamp: Date.now(),
                });
              }
            }
          }
        });
      }

      // 2. Visualization Modules Completed (2 modules, 10 pts each = max 20 pts)
      if (Array.isArray(pState.completedVideos)) {
        pState.completedVideos.forEach((vid) => {
          const isNewToKnown = !this.knownCompletedVideos.has(vid);
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
            hasChanges = true;

            if (emitNotification && isNewToKnown) {
              this.emitNotification({
                id: `notif-${Date.now()}-${Math.random()}`,
                amount: 10,
                title: '+10 Points',
                message: 'Visualization Completed',
                type: 'reward',
                timestamp: Date.now(),
              });
            }
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
   * Guided Solve penalty: −4 pts per actual use.
   * Hint penalty: −2 pts per actual use.
   */
  public getPoints(): PointsState {
    // 1. Theory Modules: 0 points (Learn/Theory contributes zero points)
    const theoryPoints = 0;

    // 2. Quiz Points: +3 correct, −2 wrong, 0 timeout (capped at max positive 30)
    const quizPoints = Math.min(30, this.data.quizPoints);

    // 3. Visualize Modules: 2 modules, +10 points each (max 20)
    const videoStats = progressManager.getVideoStats();
    const visualizePoints = Math.min(20, Math.max(0, videoStats.completed * 10));

    // 4. Game Levels: 5 levels, +10 points each (max 50)
    const gameStats = progressManager.getGameStats();
    const gamePoints = Math.min(50, Math.max(0, gameStats.completed * 10));

    // 5. Hint Penalties: 2 points per genuine hint use
    const hintPenalties = this.data.hintUsesCount * 2;

    // 6. Guided-Solve Penalties: 4 points per genuine guided-solve use
    const guidedSolvePenalties = this.data.guidedSolveUsesCount * 4;

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
      hintUsesCount: this.data.hintUsesCount,
      guidedSolveUsesCount: this.data.guidedSolveUsesCount,
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
   * Records a genuine hint activation. Deducts 2 points per actual use.
   * Prevents duplicate deductions for the same event.
   */
  public recordHintUse(levelId?: number) {
    const now = Date.now();
    if (now - this.lastHintTimestamp < 500) {
      return; // Ignore duplicate click/event
    }
    this.lastHintTimestamp = now;

    this.data.hintUsesCount += 1;
    const lvlText = levelId ? `Level ${levelId}` : 'Game';
    this.data.activities.unshift({
      id: `hint-${Date.now()}-${Math.random()}`,
      title: `Used Hint: ${lvlText}`,
      typeLabel: 'HINT USED',
      points: -2,
      timestamp: Date.now(),
      userId: this.currentUserId,
      topicId: 'hashing',
      activityId: `hint-${levelId || 'game'}`,
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
  }

  /**
   * Records a genuine guided-solve activation. Deducts 4 points per actual use.
   * Prevents duplicate deductions for the same event.
   */
  public recordGuidedSolveUse(levelId?: number) {
    const now = Date.now();
    if (now - this.lastGuidedSolveTimestamp < 500) {
      return; // Ignore duplicate click/event
    }
    this.lastGuidedSolveTimestamp = now;

    this.data.guidedSolveUsesCount += 1;
    const lvlText = levelId ? `Level ${levelId}` : 'Game';
    this.data.activities.unshift({
      id: `guided-${Date.now()}-${Math.random()}`,
      title: `Used Guided Solve: ${lvlText}`,
      typeLabel: 'GUIDED SOLVE USED',
      points: -4,
      timestamp: Date.now(),
      userId: this.currentUserId,
      topicId: 'hashing',
      activityId: `guided-${levelId || 'game'}`,
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
  }

  /**
   * Resets all points data (used on global reset progress).
   */
  public resetAll() {
    this.data = {
      version: 2,
      userId: this.currentUserId,
      topicId: 'hashing',
      quizPoints: 0,
      processedQuizQuestionIds: [],
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
