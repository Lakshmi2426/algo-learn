import { UserProgress, Achievement } from '../types';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_push',
    title: 'Binary Search Beginner',
    description: 'Complete your first Binary Search learning activity.',
    iconName: 'ArrowDownToLine',
    xpReward: 50,
    unlocked: false,
    category: 'beginner',
  },
  {
    id: 'lifo_master',
    title: 'Midpoint Master',
    description: 'Calculate middle indices and master pointer adjustments.',
    iconName: 'Layers',
    xpReward: 75,
    unlocked: false,
    category: 'mastery',
  },
  {
    id: 'overflow_explorer',
    title: 'Range Reduction Expert',
    description: 'Inspect and narrow search boundary conditions (low, mid, high).',
    iconName: 'AlertTriangle',
    xpReward: 60,
    unlocked: false,
    category: 'beginner',
  },
  {
    id: 'speed_demon',
    title: 'O(log n) Explorer',
    description: 'Complete a rapid Binary Search speed challenge.',
    iconName: 'Zap',
    xpReward: 150,
    unlocked: false,
    category: 'speed',
  },
  {
    id: 'debugger_pro',
    title: 'Debugging Pro',
    description: 'Spot and eliminate an invalid boundary condition in challenge mode.',
    iconName: 'ShieldAlert',
    xpReward: 100,
    unlocked: false,
    category: 'mastery',
  },
  {
    id: 'lab_explorer',
    title: 'Boundary Tester',
    description: 'Perform interactive search comparisons and test edge cases.',
    iconName: 'FlaskConical',
    xpReward: 120,
    unlocked: false,
    category: 'mastery',
  },
  {
    id: 'quiz_ace',
    title: 'Binary Search Solver',
    description: 'Demonstrate mastery on the final assessment quiz.',
    iconName: 'Award',
    xpReward: 200,
    unlocked: false,
    category: 'quiz',
  },
  {
    id: 'streak_3',
    title: 'Daily Dedication',
    description: 'Maintain a 3-day learning streak.',
    iconName: 'Flame',
    xpReward: 80,
    unlocked: false,
    category: 'beginner',
  },
];

const STORAGE_KEY = 'binary_search_user_progress_v4';
const RESET_APPLIED_KEY = 'binary_search_progress_reset_v4';

const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const getInitialProgress = (): UserProgress => {
  const today = getTodayString();
  return {
    xp: 0,
    level: 1,
    streakDays: 1,
    lastActiveDate: today,
    completedGameLevels: [],
    completedTheoryChapters: [],
    completedLabs: [],
    quizCompleted: false,
    quizHighScore: 0,
    quizTotalQuestionsAnswered: 0,
    totalPushes: 0,
    totalPops: 0,
    achievements: [],
    awardedEventKeys: [],
    topicPoints: {
      visualizeEarned: 0,
      gameEarned: 0,
      quizEarned: 0,
      totalEarned: 0,
      completedVideos: [],
      gameLevelScores: {},
      quizQuestionScores: {},
      quizQuestionAnswered: {},
    },
    history: [
      {
        title: 'Joined AlgoLearn',
        description: 'Initialized Binary Search Interactive Learning Environment',
        xpEarned: 0,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ],
  };
};

export const loadProgress = (): UserProgress => {
  if (typeof window === 'undefined') return getInitialProgress();
  try {
    // Perform guaranteed reset if reset flag is not yet marked done
    if (localStorage.getItem(RESET_APPLIED_KEY) !== 'done') {
      localStorage.removeItem('binary_search_user_progress_v3');
      localStorage.removeItem('binary_search_user_progress_v2');
      localStorage.removeItem('binary_search_user_progress_v1');
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(RESET_APPLIED_KEY, 'done');
      const initial = getInitialProgress();
      saveProgress(initial);
      return initial;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw || raw === 'undefined' || raw === 'null' || raw.trim() === '') {
      const initial = getInitialProgress();
      saveProgress(initial);
      return initial;
    }
    
    let data: UserProgress;
    try {
      data = JSON.parse(raw);
    } catch {
      console.warn('Corrupted progress JSON found in storage, resetting to initial progress.');
      const initial = getInitialProgress();
      saveProgress(initial);
      return initial;
    }

    if (!data || typeof data !== 'object') {
      const initial = getInitialProgress();
      saveProgress(initial);
      return initial;
    }

    // Auto-heal nested updated object if previous state was corrupted
    if ((data as any).updated && typeof (data as any).updated === 'object') {
      data = (data as any).updated;
    }

    // Validate streak
    const today = getTodayString();
    const lastDate = data.lastActiveDate || today;

    if (lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastDate === yesterdayStr) {
        data.streakDays = (data.streakDays || 1) + 1;
      } else {
        data.streakDays = 1;
      }
      data.lastActiveDate = today;
      saveProgress(data);
    }

    // Ensure fields exist
    data.xp = Math.max(0, typeof data.xp === 'number' && !isNaN(data.xp) ? data.xp : 0);
    data.level = Math.floor(data.xp / 250) + 1;
    data.completedGameLevels = Array.isArray(data.completedGameLevels) ? data.completedGameLevels : [];
    data.completedTheoryChapters = Array.isArray(data.completedTheoryChapters) ? data.completedTheoryChapters : [];
    data.completedLabs = Array.isArray((data as any).completedLabs) ? (data as any).completedLabs : [];
    data.achievements = Array.isArray(data.achievements) ? data.achievements : [];
    data.awardedEventKeys = Array.isArray(data.awardedEventKeys) ? data.awardedEventKeys : [];
    data.history = Array.isArray(data.history) ? data.history : [];

    // Ensure topicPoints structure is complete and consistent
    const rawTP = (data as any).topicPoints || {};
    const completedVideos = Array.isArray(rawTP.completedVideos) ? rawTP.completedVideos : (Array.isArray(data.completedLabs) ? data.completedLabs : []);
    const gameLevelScores = rawTP.gameLevelScores && typeof rawTP.gameLevelScores === 'object' ? rawTP.gameLevelScores : {};
    const quizQuestionScores = rawTP.quizQuestionScores && typeof rawTP.quizQuestionScores === 'object' ? rawTP.quizQuestionScores : {};
    const quizQuestionAnswered = rawTP.quizQuestionAnswered && typeof rawTP.quizQuestionAnswered === 'object' ? rawTP.quizQuestionAnswered : {};

    // Calculate/reconcile points strictly following the topic breakdown (Visualize: 2 videos * 5 pts = 10 pts max)
    const visualizeEarned = Math.min(10, Math.max(0, completedVideos.length * 5));
    
    // Sum level scores (clamped between 0 and 60)
    let computedGameEarned = 0;
    if (Object.keys(gameLevelScores).length > 0) {
      computedGameEarned = Object.values(gameLevelScores).reduce<number>((acc, val: any) => acc + (typeof val === 'number' ? val : 0), 0);
    } else if (data.completedGameLevels && data.completedGameLevels.length > 0) {
      // Default backward compatibility: 10 pts per completed level
      computedGameEarned = data.completedGameLevels.length * 10;
    }
    const gameEarned = Math.min(60, Math.max(0, computedGameEarned));

    // Sum quiz question scores (clamped between 0 and 30)
    let computedQuizEarned = 0;
    if (Object.keys(quizQuestionScores).length > 0) {
      computedQuizEarned = Object.values(quizQuestionScores).reduce<number>((acc, val: any) => acc + (typeof val === 'number' ? val : 0), 0);
    } else if (data.quizCompleted) {
      computedQuizEarned = Math.round((Math.max(0, data.quizHighScore || 100) / 100) * 30);
    }
    const quizEarned = Math.min(30, computedQuizEarned);

    const totalEarned = Math.min(100, visualizeEarned + gameEarned + quizEarned);

    data.topicPoints = {
      visualizeEarned,
      gameEarned,
      quizEarned,
      totalEarned,
      completedVideos,
      gameLevelScores,
      quizQuestionScores,
      quizQuestionAnswered,
    };

    return data;
  } catch (e) {
    console.error('Failed to load user progress:', e);
    return getInitialProgress();
  }
};

export const saveProgress = (progress: UserProgress): void => {
  if (typeof window === 'undefined') return;
  try {
    if (!progress || typeof progress !== 'object') {
      return;
    }
    const serialized = JSON.stringify(progress);
    if (!serialized || serialized === 'undefined') {
      return;
    }
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (e) {
    console.error('Failed to save user progress:', e);
  }
};

export const awardXP = (
  current: UserProgress,
  amount: number,
  eventKey: string,
  reasonTitle: string,
  reasonDesc: string
): { updated: UserProgress; awarded: boolean } => {
  if (!eventKey || current.awardedEventKeys.includes(eventKey)) {
    return { updated: current, awarded: false };
  }

  const newXP = current.xp + amount;
  const newLevel = Math.floor(newXP / 250) + 1;
  const newAwardedKeys = [...current.awardedEventKeys, eventKey];
  const newHistory = [
    {
      title: reasonTitle,
      description: reasonDesc,
      xpEarned: amount,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    ...current.history.slice(0, 19),
  ];

  const updated: UserProgress = {
    ...current,
    xp: newXP,
    level: newLevel,
    awardedEventKeys: newAwardedKeys,
    history: newHistory,
  };

  saveProgress(updated);
  return { updated, awarded: true };
};

export const resetAllProgress = (): UserProgress => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('binary_search_user_progress_v3');
      localStorage.removeItem('binary_search_user_progress_v2');
      localStorage.removeItem('binary_search_user_progress_v1');
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(RESET_APPLIED_KEY, 'done');
    } catch {
      // ignore
    }
  }
  const fresh = getInitialProgress();
  saveProgress(fresh);
  return fresh;
};

// =========================================================================
// TOPIC POINTS HELPERS (Binary Search: 20 pts Video + 60 pts Game + 30 pts Quiz = 100 max)
// =========================================================================

export const awardVideoPoints = (
  current: UserProgress,
  videoId: number
): { updated: UserProgress; pointsAwarded: number } => {
  const tp = current.topicPoints || {
    visualizeEarned: 0,
    gameEarned: 0,
    quizEarned: 0,
    totalEarned: 0,
    completedVideos: [],
    gameLevelScores: {},
    quizQuestionScores: {},
    quizQuestionAnswered: {},
  };

  const completedVideos = Array.isArray(tp.completedVideos) ? [...tp.completedVideos] : [];
  if (completedVideos.includes(videoId)) {
    return { updated: current, pointsAwarded: 0 };
  }

  completedVideos.push(videoId);
  const visualizeEarned = Math.min(10, completedVideos.length * 5);
  const totalEarned = Math.min(100, visualizeEarned + tp.gameEarned + tp.quizEarned);

  const completedLabs = Array.isArray(current.completedLabs) ? [...current.completedLabs] : [];
  if (!completedLabs.includes(videoId)) {
    completedLabs.push(videoId);
  }

  const updated: UserProgress = {
    ...current,
    completedLabs,
    topicPoints: {
      ...tp,
      completedVideos,
      visualizeEarned,
      totalEarned,
    },
  };

  saveProgress(updated);
  return { updated, pointsAwarded: 5 };
};

export const deductHintPoints = (
  current: UserProgress,
  levelId: number
): { updated: UserProgress; pointsDeducted: number } => {
  const tp = current.topicPoints || {
    visualizeEarned: 0,
    gameEarned: 0,
    quizEarned: 0,
    totalEarned: 0,
    completedVideos: [],
    gameLevelScores: {},
    quizQuestionScores: {},
    quizQuestionAnswered: {},
  };

  const gameLevelScores = { ...(tp.gameLevelScores || {}) };
  const currentScore = gameLevelScores[levelId] !== undefined ? gameLevelScores[levelId] : 10;
  const newScore = Math.max(0, currentScore - 2);
  gameLevelScores[levelId] = newScore;

  const totalGameEarned = Math.min(60, Math.max(0, Object.values(gameLevelScores).reduce((a, b) => a + b, 0)));
  const totalEarned = Math.min(100, Math.max(0, (tp.visualizeEarned || 0) + totalGameEarned + (tp.quizEarned || 0)));

  const updated: UserProgress = {
    ...current,
    topicPoints: {
      ...tp,
      gameLevelScores,
      gameEarned: totalGameEarned,
      totalEarned,
    },
  };

  saveProgress(updated);
  return { updated, pointsDeducted: 2 };
};

export const deductGuidedSolvePoints = (
  current: UserProgress,
  levelId: number
): { updated: UserProgress; pointsDeducted: number } => {
  const tp = current.topicPoints || {
    visualizeEarned: 0,
    gameEarned: 0,
    quizEarned: 0,
    totalEarned: 0,
    completedVideos: [],
    gameLevelScores: {},
    quizQuestionScores: {},
    quizQuestionAnswered: {},
  };

  const gameLevelScores = { ...(tp.gameLevelScores || {}) };
  const currentScore = gameLevelScores[levelId] !== undefined ? gameLevelScores[levelId] : 10;
  const newScore = Math.max(0, currentScore - 3);
  gameLevelScores[levelId] = newScore;

  const totalGameEarned = Math.min(60, Math.max(0, Object.values(gameLevelScores).reduce((a, b) => a + b, 0)));
  const totalEarned = Math.min(100, Math.max(0, (tp.visualizeEarned || 0) + totalGameEarned + (tp.quizEarned || 0)));

  const updated: UserProgress = {
    ...current,
    topicPoints: {
      ...tp,
      gameLevelScores,
      gameEarned: totalGameEarned,
      totalEarned,
    },
  };

  saveProgress(updated);
  return { updated, pointsDeducted: 3 };
};

export const awardGameLevelPoints = (
  current: UserProgress,
  levelId: number,
  guidedSolvesUsed: number,
  hintsUsed: number
): { updated: UserProgress; pointsAwarded: number } => {
  const tp = current.topicPoints || {
    visualizeEarned: 0,
    gameEarned: 0,
    quizEarned: 0,
    totalEarned: 0,
    completedVideos: [],
    gameLevelScores: {},
    quizQuestionScores: {},
    quizQuestionAnswered: {},
  };

  const gameLevelScores = { ...(tp.gameLevelScores || {}) };

  // Base: 10 points. Deductions: 3 pts per guided solve, 2 pts per hint used
  const deductions = (guidedSolvesUsed * 3) + (hintsUsed * 2);
  const earnedForLevel = Math.max(0, 10 - deductions);

  // If no deductions were used, always allot full 10 points. Otherwise allot earnedForLevel or existing live deductions score.
  const pointsToAllot = deductions === 0 ? 10 : (gameLevelScores[levelId] !== undefined ? gameLevelScores[levelId] : earnedForLevel);
  gameLevelScores[levelId] = pointsToAllot;

  const totalGameEarned = Math.min(60, Math.max(0, Object.values(gameLevelScores).reduce((a, b) => a + b, 0)));
  const totalEarned = Math.min(100, Math.max(0, (tp.visualizeEarned || 0) + totalGameEarned + (tp.quizEarned || 0)));

  const completedGameLevels = Array.isArray(current.completedGameLevels) ? [...current.completedGameLevels] : [];
  if (!completedGameLevels.includes(levelId)) {
    completedGameLevels.push(levelId);
  }

  const updated: UserProgress = {
    ...current,
    completedGameLevels,
    topicPoints: {
      ...tp,
      gameLevelScores,
      gameEarned: totalGameEarned,
      totalEarned,
    },
  };

  saveProgress(updated);
  return { updated, pointsAwarded: pointsToAllot };
};

export const awardQuizQuestionPoints = (
  current: UserProgress,
  questionId: number,
  outcome: 'correct' | 'wrong' | 'timeout'
): { updated: UserProgress; pointsDelta: number } => {
  const tp = current.topicPoints || {
    visualizeEarned: 0,
    gameEarned: 0,
    quizEarned: 0,
    totalEarned: 0,
    completedVideos: [],
    gameLevelScores: {},
    quizQuestionScores: {},
    quizQuestionAnswered: {},
  };

  const quizQuestionAnswered = { ...(tp.quizQuestionAnswered || {}) };
  const quizQuestionScores = { ...(tp.quizQuestionScores || {}) };

  // Ensure each question is scored only once. Prevent duplicate submissions & repeated deductions
  if (quizQuestionAnswered[questionId]) {
    return { updated: current, pointsDelta: 0 };
  }

  quizQuestionAnswered[questionId] = true;

  let pointsDelta = 0;
  if (outcome === 'correct') {
    pointsDelta = 3; // +3 pts
  } else if (outcome === 'wrong') {
    pointsDelta = -1; // -1 pt deduction
  } else {
    pointsDelta = 0; // timeout: zero points
  }

  quizQuestionScores[questionId] = pointsDelta;

  // Total quiz points calculation
  const rawQuizSum = Object.values(quizQuestionScores).reduce((a, b) => a + b, 0);
  const quizEarned = Math.min(30, rawQuizSum);
  const totalEarned = Math.min(100, tp.visualizeEarned + tp.gameEarned + quizEarned);

  const updated: UserProgress = {
    ...current,
    topicPoints: {
      ...tp,
      quizQuestionAnswered,
      quizQuestionScores,
      quizEarned,
      totalEarned,
    },
  };

  saveProgress(updated);
  return { updated, pointsDelta };
};

