import { UserProgress, Achievement, SortGameId, GameStats, GameStatus, PointsLedger, PointsCategory } from '../types';

export const getInitialPointsLedger = (): PointsLedger => ({
  totalPoints: 0,
  totalEarned: 0,
  totalDeducted: 0,
  theoryPoints: 0,
  visualizationPoints: 0,
  gamePoints: 0,
  quizPoints: 0,
  hintDeductions: 0,
  guidedSolveDeductions: 0,
  wrongQuizDeductions: 0,
  completedVideoIds: [],
  completedGameCardIds: [],
  quizQuestionRecords: {},
  awardedKeys: [],
  history: [],
});

export const normalizePointsLedger = (raw?: Partial<PointsLedger>): PointsLedger => {
  const base = getInitialPointsLedger();
  if (!raw || typeof raw !== 'object') return base;

  const completedVideoIds = Array.isArray(raw.completedVideoIds)
    ? Array.from(new Set(raw.completedVideoIds.filter((id) => ['bubble', 'insertion', 'selection'].includes(id))))
    : [];
  const completedGameCardIds = Array.isArray(raw.completedGameCardIds)
    ? Array.from(
        new Set(
          raw.completedGameCardIds.filter((id) =>
            ['bubble-sort', 'selection-sort', 'insertion-sort', 'sorting-battle', 'fix-algorithm'].includes(id)
          )
        )
      )
    : [];

  const quizQuestionRecords: Record<number, any> =
    raw.quizQuestionRecords && typeof raw.quizQuestionRecords === 'object'
      ? { ...raw.quizQuestionRecords }
      : {};

  const theoryPoints = Math.max(0, Number(raw.theoryPoints) || 0);
  // Strict caps: Visualization max 15 (3 * 5), Game max 45 (5 * 9), Quiz max 40 (10 * 4)
  const visualizationPoints = Math.min(
    15,
    completedVideoIds.length > 0
      ? completedVideoIds.length * 5
      : Math.max(0, Number(raw.visualizationPoints) || 0)
  );
  const gamePoints = Math.min(
    45,
    completedGameCardIds.length > 0
      ? completedGameCardIds.length * 9
      : Math.max(0, Number(raw.gamePoints) || 0)
  );

  const recordedCorrectQuizCount = Object.values(quizQuestionRecords).filter(
    (r) => r && r.status === 'correct'
  ).length;
  const recordedWrongQuizCount = Object.values(quizQuestionRecords).filter(
    (r) => r && r.status === 'wrong'
  ).length;

  const quizPoints = Math.min(
    40,
    Object.keys(quizQuestionRecords).length > 0
      ? recordedCorrectQuizCount * 4
      : Math.max(0, Number(raw.quizPoints) || 0)
  );

  const hintDeductions = Math.max(0, Number(raw.hintDeductions) || 0);
  const guidedSolveDeductions = Math.max(0, Number(raw.guidedSolveDeductions) || 0);
  const wrongQuizDeductions =
    Object.keys(quizQuestionRecords).length > 0
      ? recordedWrongQuizCount * 1
      : Math.max(0, Number(raw.wrongQuizDeductions) || 0);

  // Total base positive points across the 100-point structure (Game 45 + Quiz 40 + Visualize 15 = 100 max)
  const totalEarned = Math.min(100, gamePoints + quizPoints + visualizationPoints);
  const totalDeducted = hintDeductions + guidedSolveDeductions + wrongQuizDeductions;
  const totalPoints = Math.min(100, totalEarned - totalDeducted);

  return {
    totalPoints,
    totalEarned,
    totalDeducted,
    theoryPoints,
    visualizationPoints,
    gamePoints,
    quizPoints,
    hintDeductions,
    guidedSolveDeductions,
    wrongQuizDeductions,
    completedVideoIds,
    completedGameCardIds,
    quizQuestionRecords,
    awardedKeys: Array.isArray(raw.awardedKeys) ? raw.awardedKeys : [],
    history: Array.isArray(raw.history) ? raw.history : [],
  };
};

export const applyPointsEvent = (
  progress: UserProgress,
  category: PointsCategory,
  delta: number,
  action: string,
  uniqueKey?: string,
  extraMeta?: {
    videoId?: string;
    gameCardId?: string;
    quizQuestionIndex?: number;
    quizRecord?: {
      status: 'correct' | 'wrong' | 'timeout';
      selectedOption?: string | null;
      draggedOrder?: string[];
    };
  }
): UserProgress => {
  const ledger = normalizePointsLedger(progress.pointsLedger);
  if (uniqueKey && ledger.awardedKeys.includes(uniqueKey)) {
    return progress;
  }

  // Prevent duplicate quiz question scoring
  if (
    typeof extraMeta?.quizQuestionIndex === 'number' &&
    ledger.quizQuestionRecords?.[extraMeta.quizQuestionIndex]
  ) {
    return progress;
  }

  const absAmount = Math.abs(delta);

  const nextCompletedVideoIds = [...(ledger.completedVideoIds || [])];
  if (category === 'visualization' && extraMeta?.videoId && !nextCompletedVideoIds.includes(extraMeta.videoId)) {
    nextCompletedVideoIds.push(extraMeta.videoId);
  }

  const nextCompletedGameCardIds = [...(ledger.completedGameCardIds || [])];
  if (category === 'game' && extraMeta?.gameCardId && !nextCompletedGameCardIds.includes(extraMeta.gameCardId)) {
    nextCompletedGameCardIds.push(extraMeta.gameCardId);
  }

  const nextQuizRecords = { ...(ledger.quizQuestionRecords || {}) };
  if (typeof extraMeta?.quizQuestionIndex === 'number' && extraMeta.quizRecord) {
    nextQuizRecords[extraMeta.quizQuestionIndex] = {
      status: extraMeta.quizRecord.status,
      selectedOption: extraMeta.quizRecord.selectedOption,
      draggedOrder: extraMeta.quizRecord.draggedOrder,
      pointsDelta: delta,
      answeredAt: formatPlayedTime(new Date()),
    };
  }

  const nextTheoryPoints = category === 'theory' ? ledger.theoryPoints + absAmount : ledger.theoryPoints;
  const nextVisualizationPoints = Math.min(
    15,
    category === 'visualization' ? ledger.visualizationPoints + absAmount : ledger.visualizationPoints
  );
  const nextGamePoints = Math.min(
    45,
    category === 'game' ? ledger.gamePoints + absAmount : ledger.gamePoints
  );
  const nextQuizPoints = Math.min(
    40,
    category === 'quiz_correct' ? ledger.quizPoints + absAmount : ledger.quizPoints
  );

  const nextHintDeductions = category === 'hint' ? ledger.hintDeductions + absAmount : ledger.hintDeductions;
  const nextGuidedSolveDeductions =
    category === 'guided_solve' ? ledger.guidedSolveDeductions + absAmount : ledger.guidedSolveDeductions;
  const nextWrongQuizDeductions =
    category === 'quiz_wrong' ? ledger.wrongQuizDeductions + absAmount : ledger.wrongQuizDeductions;

  const nextEarned = Math.min(100, nextGamePoints + nextQuizPoints + nextVisualizationPoints);
  const nextDeducted = nextHintDeductions + nextGuidedSolveDeductions + nextWrongQuizDeductions;
  const nextTotal = Math.min(100, nextEarned - nextDeducted);

  const nextLedger: PointsLedger = {
    ...ledger,
    totalPoints: nextTotal,
    totalEarned: nextEarned,
    totalDeducted: nextDeducted,
    theoryPoints: nextTheoryPoints,
    visualizationPoints: nextVisualizationPoints,
    gamePoints: nextGamePoints,
    quizPoints: nextQuizPoints,
    hintDeductions: nextHintDeductions,
    guidedSolveDeductions: nextGuidedSolveDeductions,
    wrongQuizDeductions: nextWrongQuizDeductions,
    completedVideoIds: nextCompletedVideoIds,
    completedGameCardIds: nextCompletedGameCardIds,
    quizQuestionRecords: nextQuizRecords,
    awardedKeys: uniqueKey ? [...ledger.awardedKeys, uniqueKey] : ledger.awardedKeys,
    history: [
      {
        id: `pt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        action,
        category,
        delta,
        timestamp: formatPlayedTime(new Date()),
      },
      ...ledger.history.slice(0, 99),
    ],
  };

  return {
    ...progress,
    pointsLedger: nextLedger,
  };
};

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_push',
    title: 'First Push',
    description: 'Push your very first element onto the Stack.',
    iconName: 'ArrowDownToLine',
    xpReward: 50,
    unlocked: false,
    category: 'beginner',
  },
  {
    id: 'lifo_master',
    title: 'LIFO Disciple',
    description: 'Successfully complete 5 LIFO pop operations in the Lab or Game.',
    iconName: 'Layers',
    xpReward: 75,
    unlocked: false,
    category: 'mastery',
  },
  {
    id: 'overflow_explorer',
    title: 'Boundary Tester',
    description: 'Experience Stack Overflow or Underflow state in the Lab.',
    iconName: 'AlertTriangle',
    xpReward: 60,
    unlocked: false,
    category: 'beginner',
  },
  {
    id: 'speed_demon',
    title: 'Speed Stacker',
    description: 'Complete the Level 6 Speed Stack challenge under 60 seconds.',
    iconName: 'Zap',
    xpReward: 150,
    unlocked: false,
    category: 'speed',
  },
  {
    id: 'debugger_pro',
    title: 'Debugging Pro',
    description: 'Spot and eliminate an invalid underflow operation in Level 5.',
    iconName: 'ShieldAlert',
    xpReward: 100,
    unlocked: false,
    category: 'mastery',
  },
  {
    id: 'lab_explorer',
    title: 'Lab Explorer',
    description: 'Perform 10 or more interactive Push and Pop operations in the Lab.',
    iconName: 'FlaskConical',
    xpReward: 120,
    unlocked: false,
    category: 'mastery',
  },
  {
    id: 'quiz_ace',
    title: 'Stack Master Grandmaster',
    description: 'Score 100% on the final interactive Quiz.',
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

export const INITIAL_GAME_STATS: Record<SortGameId, GameStats> = {
  'bubble-sort': {
    status: 'Not Started',
    highestScore: 0,
    timesPlayed: 0,
    completionPercentage: 0,
    bestPerformance: 'No attempts yet',
    lastPlayedTime: 'Not played yet',
  },
  'selection-sort': {
    status: 'Not Started',
    highestScore: 0,
    timesPlayed: 0,
    completionPercentage: 0,
    bestPerformance: 'No attempts yet',
    lastPlayedTime: 'Not played yet',
  },
  'insertion-sort': {
    status: 'Not Started',
    highestScore: 0,
    timesPlayed: 0,
    completionPercentage: 0,
    bestPerformance: 'No attempts yet',
    lastPlayedTime: 'Not played yet',
  },
  'sorting-battle': {
    status: 'Not Started',
    highestScore: 0,
    timesPlayed: 0,
    completionPercentage: 0,
    bestPerformance: 'No attempts yet',
    lastPlayedTime: 'Not played yet',
  },
  'fix-algorithm': {
    status: 'Not Started',
    highestScore: 0,
    timesPlayed: 0,
    completionPercentage: 0,
    bestPerformance: 'No attempts yet',
    lastPlayedTime: 'Not played yet',
  },
};

export const formatPlayedTime = (date: Date = new Date()): string => {
  try {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return `Today, ${timeStr}`;
    }
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${timeStr}`;
    }
    return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${timeStr}`;
  } catch {
    return 'Just now';
  }
};

const STORAGE_VERSION = 'v2_fresh_reset_20261009';
const QUIZ_RESET_VERSION = 'quiz_reset_v1_20261010';

export const getActiveUserKey = (): string => {
  if (typeof window === 'undefined') return 'guest_user';
  try {
    const email =
      localStorage.getItem('dsa_user_email') ||
      localStorage.getItem('current_user') ||
      '';
    if (!email) return 'guest_user';
    return email.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  } catch {
    return 'guest_user';
  }
};

const getStorageKey = (): string => {
  const userKey = getActiveUserKey();
  return `sort_master_user_progress_${STORAGE_VERSION}_${userKey}`;
};

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
    quizCompleted: false,
    quizHighScore: 0,
    quizTotalQuestionsAnswered: 0,
    quizCompletedQuestions: [],
    totalPushes: 0,
    totalPops: 0,
    achievements: [],
    awardedEventKeys: [],
    completedLabs: [],
    sortGameProgress: {
      'bubble-sort': [],
      'selection-sort': [],
      'insertion-sort': [],
      'sorting-battle': [],
      'fix-algorithm': [],
    },
    gameStats: {
      ...INITIAL_GAME_STATS,
    },
    pointsLedger: getInitialPointsLedger(),
    history: [
      {
        title: 'Joined DSA Platform',
        description: 'Initialized Sorting Algorithms Interactive Learning Platform',
        xpEarned: 0,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ],
  };
};

export const loadProgress = (): UserProgress => {
  if (typeof window === 'undefined') return getInitialProgress();
  try {
    const primaryKey = getStorageKey();
    let raw = localStorage.getItem(primaryKey);

    // Fallback to legacy key if present
    if (!raw || raw === 'undefined' || raw === 'null' || raw.trim() === '') {
      const userKey = getActiveUserKey();
      raw = localStorage.getItem(`stack_master_user_progress_${STORAGE_VERSION}_${userKey}`);
    }

    if (!raw || raw === 'undefined' || raw === 'null' || raw.trim() === '') {
      const initial = getInitialProgress();
      localStorage.setItem(`sort_master_quiz_reset_${getActiveUserKey()}`, QUIZ_RESET_VERSION);
      saveProgress(initial);
      return initial;
    }
    
    let data: UserProgress;
    try {
      data = JSON.parse(raw);
    } catch {
      console.warn('Corrupted progress JSON found in storage, resetting to initial progress.');
      const initial = getInitialProgress();
      localStorage.setItem(`stack_master_quiz_reset_${getActiveUserKey()}`, QUIZ_RESET_VERSION);
      saveProgress(initial);
      return initial;
    }

    if (!data || typeof data !== 'object') {
      const initial = getInitialProgress();
      localStorage.setItem(`stack_master_quiz_reset_${getActiveUserKey()}`, QUIZ_RESET_VERSION);
      saveProgress(initial);
      return initial;
    }

    // Defensively unwrap if nested under { updated } from awardXP
    if (data && (data as any).updated && typeof (data as any).updated === 'object') {
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

    // Ensure core fields exist
    data.xp = Math.max(0, typeof data.xp === 'number' && !isNaN(data.xp) ? data.xp : 0);
    data.level = Math.floor(data.xp / 250) + 1;
    data.completedGameLevels = Array.isArray(data.completedGameLevels) ? data.completedGameLevels : [];
    data.completedTheoryChapters = Array.isArray(data.completedTheoryChapters) ? data.completedTheoryChapters : [];
    data.achievements = Array.isArray(data.achievements) ? data.achievements : [];
    data.awardedEventKeys = Array.isArray(data.awardedEventKeys) ? data.awardedEventKeys : [];
    data.sortGameProgress = (data.sortGameProgress && typeof data.sortGameProgress === 'object') ? data.sortGameProgress : {
      'bubble-sort': [],
      'selection-sort': [],
      'insertion-sort': [],
      'sorting-battle': [],
      'fix-algorithm': [],
    };
    data.completedLabs = Array.isArray(data.completedLabs) ? data.completedLabs : [];

    // Apply one-time quiz reset if not yet applied for this user
    const quizResetKey = `stack_master_quiz_reset_${getActiveUserKey()}`;
    if (localStorage.getItem(quizResetKey) !== QUIZ_RESET_VERSION) {
      data.quizCompleted = false;
      data.quizHighScore = 0;
      data.quizTotalQuestionsAnswered = 0;
      data.quizCompletedQuestions = [];
      data.awardedEventKeys = data.awardedEventKeys.filter((k) => !k.startsWith('quiz_'));
      if (data.pointsLedger) {
        data.pointsLedger.quizPoints = 0;
        data.pointsLedger.wrongQuizDeductions = 0;
        data.pointsLedger.quizQuestionRecords = {};
        if (Array.isArray(data.pointsLedger.awardedKeys)) {
          data.pointsLedger.awardedKeys = data.pointsLedger.awardedKeys.filter(
            (k) => !k.startsWith('quiz_q_')
          );
        }
        if (Array.isArray(data.pointsLedger.history)) {
          data.pointsLedger.history = data.pointsLedger.history.filter(
            (h) =>
              h &&
              h.category !== 'quiz_correct' &&
              h.category !== 'quiz_wrong' &&
              h.category !== 'quiz_timeout'
          );
        }
      }
      localStorage.setItem(quizResetKey, QUIZ_RESET_VERSION);
      data.pointsLedger = normalizePointsLedger(data.pointsLedger);
      saveProgress(data);
    } else {
      data.pointsLedger = normalizePointsLedger(data.pointsLedger);
    }
    data.history = Array.isArray(data.history)
      ? data.history.map((item) => {
          if (!item) return item;
          let title = item.title || '';
          let description = item.description || '';
          if (/whatsapp\s*video(\s*2026-09-06)?/i.test(title)) {
            title = 'Sorting Algorithm Video';
          }
          if (/whatsapp\s*video(\s*2026-09-06)?/i.test(description)) {
            description = description.replace(/whatsapp\s*video(\s*2026-09-06)?/gi, 'Sorting Video');
          }
          return {
            ...item,
            title,
            description,
          };
        })
      : [];

    // Ensure gameStats exists and accurately syncs with sortGameProgress
    const gameIds: SortGameId[] = [
      'bubble-sort',
      'selection-sort',
      'insertion-sort',
      'sorting-battle',
      'fix-algorithm',
    ];

    if (!data.gameStats || typeof data.gameStats !== 'object') {
      data.gameStats = { ...INITIAL_GAME_STATS };
    }

    for (const gid of gameIds) {
      const completedList = Array.isArray(data.sortGameProgress?.[gid]) ? data.sortGameProgress[gid] : [];
      const completedCount = completedList.length;
      const existing = data.gameStats[gid] || { ...INITIAL_GAME_STATS[gid] };

      const isCompleted = existing.status === 'Completed' || completedCount >= 5;
      const isStarted = isCompleted || existing.status === 'In Progress' || completedCount > 0 || (existing.timesPlayed || 0) > 0;

      const status: GameStatus = isCompleted ? 'Completed' : isStarted ? 'In Progress' : 'Not Started';
      const completionPercentage = isCompleted
        ? 100
        : Math.max(existing.completionPercentage || 0, Math.min(100, Math.round((completedCount / 5) * 100)));
      const highestScore = Math.max(existing.highestScore || 0, completedCount * 50);
      const timesPlayed = Math.max(existing.timesPlayed || 0, completedCount > 0 ? completedCount : (isStarted ? 1 : 0));
      const bestPerformance =
        existing.bestPerformance && existing.bestPerformance !== 'None' && existing.bestPerformance !== 'No attempts yet'
          ? existing.bestPerformance
          : isCompleted
          ? `100% Mastered • High Score: ${highestScore} pts`
          : completedCount > 0
          ? `${completedCount}/5 Levels Cleared`
          : 'No attempts yet';
      const lastPlayedTime =
        existing.lastPlayedTime && existing.lastPlayedTime !== 'Not played yet'
          ? existing.lastPlayedTime
          : (isStarted ? formatPlayedTime(new Date()) : 'Not played yet');

      data.gameStats[gid] = {
        status,
        highestScore,
        timesPlayed,
        completionPercentage,
        bestPerformance,
        lastPlayedTime,
      };
    }

    const fullyCompletedCards = gameIds.filter((gid) => {
      const completedList = Array.isArray(data.sortGameProgress?.[gid]) ? data.sortGameProgress[gid] : [];
      return new Set(completedList).size >= 5;
    });
    const fullyCompletedCardsCount = fullyCompletedCards.length;
    data.completedGameLevels = Array.from({ length: fullyCompletedCardsCount }, (_, i) => i + 1);
    data.pointsLedger = normalizePointsLedger({
      ...data.pointsLedger,
      completedGameCardIds: Array.from(
        new Set([...(data.pointsLedger?.completedGameCardIds || []), ...fullyCompletedCards])
      ),
    });

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
    const cleanProgress = ((progress as any).updated && typeof (progress as any).updated === 'object')
      ? (progress as any).updated
      : progress;
    const serialized = JSON.stringify(cleanProgress);
    if (!serialized || serialized === 'undefined') {
      return;
    }
    localStorage.setItem(getStorageKey(), serialized);
  } catch (e) {
    console.error('Failed to save user progress:', e);
  }
};

export const recordGamePlay = (progress: UserProgress, gameId: SortGameId): UserProgress => {
  const currentStats = progress.gameStats?.[gameId] || INITIAL_GAME_STATS[gameId];
  const updatedStats: GameStats = {
    ...currentStats,
    timesPlayed: (currentStats.timesPlayed || 0) + 1,
    lastPlayedTime: formatPlayedTime(new Date()),
    status: currentStats.status === 'Completed' ? 'Completed' : 'In Progress',
  };

  const updated: UserProgress = {
    ...progress,
    gameStats: {
      ...(progress.gameStats || INITIAL_GAME_STATS),
      [gameId]: updatedStats,
    },
  };

  saveProgress(updated);
  return updated;
};

export const awardXP = (
  current: UserProgress,
  amount: number,
  eventKey: string,
  reasonTitle: string,
  reasonDesc: string
): { updated: UserProgress; awarded: boolean } => {
  const awardedKeys = Array.isArray(current?.awardedEventKeys) ? current.awardedEventKeys : [];
  if (!eventKey || awardedKeys.includes(eventKey)) {
    return { updated: current, awarded: false };
  }

  const newXP = (current?.xp || 0) + amount;
  const newLevel = Math.floor(newXP / 250) + 1;
  const newAwardedKeys = [...awardedKeys, eventKey];
  const currentHistory = Array.isArray(current?.history) ? current.history : [];
  const newHistory = [
    {
      title: reasonTitle,
      description: reasonDesc,
      xpEarned: amount,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    ...currentHistory.slice(0, 19),
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
  const fresh = getInitialProgress();
  saveProgress(fresh);
  return fresh;
};
