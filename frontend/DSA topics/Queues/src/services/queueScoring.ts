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
  quizSession?: UserProgress['quizSession'];
  queueDeductions?: number;
  queueScore?: number;
};

type QuizAnswerEvidence = {
  isSubmitted?: boolean;
  isAttempted?: boolean;
  isCorrect?: boolean;
};

/** Only an explicitly submitted answer can earn points or incur a penalty. */
export const getQueueQuizQuestionStatus = (
  answer?: QuizAnswerEvidence
): 'correct' | 'incorrect' | 'unanswered' => {
  if (answer?.isSubmitted !== true || answer.isAttempted !== true) return 'unanswered';
  if (answer.isCorrect === true) return 'correct';
  if (answer.isCorrect === false) return 'incorrect';
  return 'unanswered';
};

export const getQueueQuizPoints = (answers: Record<string, QuizAnswerEvidence> = {}): number =>
  Object.entries(answers).reduce((points, [questionIndex, answer]) => {
    const index = Number(questionIndex);
    if (!Number.isInteger(index) || index < 0 || index >= QUEUE_SCORING.quiz.questionCount) return points;
    const status = getQueueQuizQuestionStatus(answer);
    if (status === 'correct') return points + QUEUE_SCORING.quiz.pointsPerCorrect;
    if (status === 'incorrect') return points + QUEUE_SCORING.quiz.pointsPerIncorrect;
    return points;
  }, 0);

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
  // Results alone may contain legacy incorrect statuses from timeouts/skips.
  // Award/deduct only when the session also contains explicit submitted-answer evidence.
  const quiz = Math.min(QUEUE_SCORING.quiz.total, getQueueQuizPoints(data.quizSession?.answers || {}));
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
