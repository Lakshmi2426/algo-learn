export const POINTS_CONFIG = {
  THEORY_PER_MODULE: 0,
  MAX_THEORY: 0,
  TOTAL_THEORY_MODULES: 12,

  QUIZ_CORRECT: 4,
  QUIZ_WRONG: -3,
  MAX_QUIZ: 40,
  TOTAL_QUIZ_QUESTIONS: 10,

  VISUALIZE_PER_MODULE: 10,
  MAX_VISUALIZE: 20,
  TOTAL_VISUALIZE_MODULES: 2,

  GAME_PER_LEVEL: 10,
  MAX_GAME: 40,
  TOTAL_GAME_LEVELS: 4,

  HINT_PENALTY: 2,
  GUIDED_SOLVE_PENALTY: 4,

  MAX_TOTAL_POINTS: 100,
} as const;

export interface PointsActivityEvent {
  id: string;
  type: string;
  description: string;
  categoryLabel: string;
  pointsChange: number;
  timestamp: number;
}

export interface PointsBreakdown {
  theoryScore: number;
  maxTheory: number;
  visualizeScore: number;
  maxVisualize: number;
  gameScore: number;
  maxGame: number;
  quizScore: number;
  maxQuiz: number;
  penaltiesTotal: number;
  hintPenalties: number;
  hintUsesCount: number;
  guidedSolvePenalties: number;
  guidedSolveUsesCount: number;
  totalPoints: number;
  maxTotalPoints: number;
}

export interface PointsNotification {
  id: string;
  pointsChange: number;
  title: string;
  message: string;
  type: 'reward' | 'penalty';
  timestamp: number;
}

export interface PointsState {
  version: number;
  completedTheoryIds: string[];
  completedVisualizeIds: string[];
  completedGameLevelIds: number[];
  answeredQuizQuestionIds: number[];
  quizCompleted: boolean;
  quizScore: number;
  deductedHintLevelIds: number[];
  deductedGuidedSolveLevelIds: number[];
  hintPenaltiesTotal: number;
  hintUsesCount: number;
  guidedSolvePenaltiesTotal: number;
  guidedSolveUsesCount: number;
  totalPoints: number;
  history: PointsActivityEvent[];
}
