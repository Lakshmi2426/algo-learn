import { UserProgress } from '../types';

export const QUEUE_SCORING = {
  learn: { total: 0, pointsPerModule: 0, moduleCount: 20 },
  visualize: { total: 12, pointsPerActivity: 6, activityCount: 2 },
  game: { total: 40, pointsPerLevel: 13, levelCount: 3, guidedSolveDeduction: -3, hintDeduction: -2 },
  quiz: { total: 48, pointsPerCorrect: 4, pointsPerIncorrect: -2, questionCount: 12, timeLimitSeconds: 20 },
  total: 100,
} as const;

export const getGameLevelPoints = (levelId: number): number => {
  if (levelId === 3) return 14;
  return 13;
};

export interface QueueScoreBreakdown {
  learn: number;
  visualize: number;
  game: number;
  quiz: number;
  deductions: number;
  overall: number;
}

type ProgressWithQueueData = UserProgress & {
  completedLabs?: number[];
  quizQuestionResults?: Record<string, 'correct' | 'incorrect' | 'unanswered'>;
  queueDeductions?: number;
  queueScore?: number;
};

export const getQueueScoreBreakdown = (progress: UserProgress): QueueScoreBreakdown => {
  const data = progress as ProgressWithQueueData;
  const learn = Math.min(
    QUEUE_SCORING.learn.total,
    (progress.completedTheoryChapters || []).filter((id) => id >= 1 && id <= QUEUE_SCORING.learn.moduleCount).length *
      QUEUE_SCORING.learn.pointsPerModule
  );
  const visualize = Math.min(
    QUEUE_SCORING.visualize.total,
    (data.completedLabs || []).filter((id) => id >= 1 && id <= QUEUE_SCORING.visualize.activityCount).length *
      QUEUE_SCORING.visualize.pointsPerActivity
  );
  const completedLevelIds = new Set(
    (progress.completedGameLevels || []).filter((id) => id >= 1 && id <= QUEUE_SCORING.game.levelCount)
  );
  let rawGamePoints = 0;
  completedLevelIds.forEach((lvlId) => {
    rawGamePoints += getGameLevelPoints(lvlId);
  });
  const completedGamePoints = Math.min(QUEUE_SCORING.game.total, rawGamePoints);

  const deductions = Math.max(0, data.queueDeductions || 0);
  const game = Math.max(0, completedGamePoints - deductions);
  const results = Object.values(data.quizQuestionResults || {});
  const quiz = Math.min(
    QUEUE_SCORING.quiz.total,
    results.filter((result) => result === 'correct').length * QUEUE_SCORING.quiz.pointsPerCorrect +
      results.filter((result) => result === 'incorrect').length * QUEUE_SCORING.quiz.pointsPerIncorrect
  );
  return {
    learn,
    visualize,
    game,
    quiz,
    deductions,
    overall: Math.min(QUEUE_SCORING.total, learn + visualize + game + quiz),
  };
};

export const syncQueueScore = (progress: UserProgress): UserProgress => {
  const breakdown = getQueueScoreBreakdown(progress);
  const currentScore = breakdown.overall;
  return {
    ...progress,
    queueScore: currentScore,
  };
};
