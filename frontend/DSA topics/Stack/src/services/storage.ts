import { UserProgress, Achievement } from '../types';

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

const STORAGE_KEY = 'stack_master_user_progress_v2';
const RESET_APPLIED_KEY = 'stack_master_progress_reset_v2';

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
    totalPushes: 0,
    totalPops: 0,
    achievements: [],
    awardedEventKeys: [],
    completedLabs: [],
    gameScores: {},
    gameHintsUsed: {},
    gameGuidedSolveUsed: {},
    quizQuestionScores: {},
    pointsData: {
      quizAnswers: {},
      gamePenalties: {},
    },
    history: [
      {
        title: 'Joined Stack Master',
        description: 'Initialized DSA Interactive Learning Environment',
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
      localStorage.removeItem('stack_master_user_progress');
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
    data.achievements = Array.isArray(data.achievements) ? data.achievements : [];
    data.awardedEventKeys = Array.isArray(data.awardedEventKeys) ? data.awardedEventKeys : [];
    data.history = Array.isArray(data.history) ? data.history : [];
    data.completedLabs = Array.isArray(data.completedLabs) ? data.completedLabs : [];
    data.gameScores = data.gameScores && typeof data.gameScores === 'object' ? data.gameScores : {};
    data.gameHintsUsed = data.gameHintsUsed && typeof data.gameHintsUsed === 'object' ? data.gameHintsUsed : {};
    data.gameGuidedSolveUsed = data.gameGuidedSolveUsed && typeof data.gameGuidedSolveUsed === 'object' ? data.gameGuidedSolveUsed : {};
    data.quizQuestionScores = data.quizQuestionScores && typeof data.quizQuestionScores === 'object' ? data.quizQuestionScores : {};

    return data;
  } catch (e) {
    console.error('Failed to load user progress:', e);
    return getInitialProgress();
  }
};

export interface TopicPointsBreakdown {
  visualizationPoints: number; // max 20 (2 videos x 10 pts)
  maxVisualizationPoints: number; // 20
  completedVideosCount: number; // 0..2
  gamePoints: number; // max 40 (2 games x 20 pts base minus deductions)
  maxGamePoints: number; // 40
  completedGamesCount: number; // 0..2
  quizPoints: number; // max 40 (10 questions x 4 pts correct, -2 wrong, 0 timeout)
  maxQuizPoints: number; // 40
  quizQuestionsAnsweredCount: number; // 0..10
  quizCorrectCount: number;
  totalTopicPoints: number; // max 100
  maxTopicPoints: number; // 100
  completedModulesCount: number; // out of 27
  totalModulesCount: number; // 27
  overallCompletionPercent: number; // 0..100
  theoryCompletedCount: number; // out of 12
}

export const getTopicPointsBreakdown = (progress: UserProgress): TopicPointsBreakdown => {
  // A. Visualization Section: 2 videos, 10 pts each, total 20 pts
  const completedLabsList = progress.completedLabs || [];
  const completedVideosCount = Math.min(2, completedLabsList.filter((id) => id === 1 || id === 2).length);
  const visualizationPoints = Math.min(20, completedVideosCount * 10);

  // B. Game Section: 2 games, 20 pts each, total 40 pts
  // Deductions: Guided Solve -3 pts, Hint -2 pts
  const gameScores = progress.gameScores || {};
  const completedGameLevels = progress.completedGameLevels || [];

  const getGameScore = (gameId: number): number => {
    if (gameScores[gameId] !== undefined) {
      return Math.max(0, Math.min(20, gameScores[gameId]));
    }
    if (completedGameLevels.includes(gameId)) {
      return 20; // default for prior completed
    }
    return 0;
  };

  const g1Score = getGameScore(1);
  const g2Score = getGameScore(2);
  const gamePoints = Math.min(40, Math.max(0, g1Score + g2Score));
  const completedGamesCount = Math.min(2, completedGameLevels.filter((id) => id === 1 || id === 2).length);

  // C. Quiz Section: 10 questions, +4 correct, -2 wrong, 0 timeout, total 40 pts
  const quizScores = progress.quizQuestionScores || {};
  let quizSum = 0;
  let quizCorrectCount = 0;
  Object.values(quizScores).forEach((sc) => {
    quizSum += sc;
    if (sc === 4) quizCorrectCount++;
  });
  const quizPoints = Math.min(40, quizSum);
  const quizQuestionsAnsweredCount = Math.min(10, Object.keys(quizScores).length);

  // Total Topic Points: must equal 100 max
  const totalTopicPoints = Math.min(100, visualizationPoints + gamePoints + quizPoints);

  // Overall modules completed out of 27:
  // 12 Theory + 2 Videos + 2 Games + 10 Quiz Questions + 1 Final Mastered status = 27 modules
  const theoryCompletedCount = Math.min(12, progress.completedTheoryChapters?.length || 0);
  const quizFinishedBonus = progress.quizCompleted ? 1 : 0;
  const completedModulesCount = Math.min(
    27,
    theoryCompletedCount + completedVideosCount + completedGamesCount + quizQuestionsAnsweredCount + quizFinishedBonus
  );
  const overallCompletionPercent = Math.min(100, Math.max(0, Math.round((completedModulesCount / 27) * 100)));

  return {
    visualizationPoints,
    maxVisualizationPoints: 20,
    completedVideosCount,
    gamePoints,
    maxGamePoints: 40,
    completedGamesCount,
    quizPoints,
    maxQuizPoints: 40,
    quizQuestionsAnsweredCount,
    quizCorrectCount,
    totalTopicPoints,
    maxTopicPoints: 100,
    completedModulesCount,
    totalModulesCount: 27,
    overallCompletionPercent,
    theoryCompletedCount,
  };
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
      localStorage.removeItem('stack_master_user_progress');
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
