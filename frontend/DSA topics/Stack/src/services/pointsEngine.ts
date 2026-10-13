import { UserProgress } from '../types';
import { THEORY_LESSONS } from '../data/theoryData';
import { QUIZ_QUESTIONS } from '../data/quizData';
import { GAME_LEVELS } from '../data/gameData';

export const VISUALIZATION_MODULES = [
  { id: 1, lessonNumber: 'LESSON 01', title: 'STACK DATA STRUCTURE' },
  { id: 2, lessonNumber: 'LESSON 02', title: 'BASIC STACK OPERATIONS' },
];

export interface TheoryModuleStatus {
  id: number;
  chapterNumber: string;
  title: string;
  completed: boolean;
  pointsAwarded: number;
}

export interface TheoryPointsBreakdown {
  completedCount: number;
  totalModules: number;
  points: number;
  maxPoints: number;
  modules: TheoryModuleStatus[];
}

export interface QuizQuestionStatus {
  id: number;
  questionText: string;
  isAnswered: boolean;
  isCorrect?: boolean;
  selectedOption?: string | null;
  submittedAt?: string;
}

export interface QuizPointsBreakdown {
  correctCount: number;
  incorrectCount: number;
  totalAnswered: number;
  rawScore: number;
  points: number;
  maxPoints: number;
  questions: QuizQuestionStatus[];
}

export interface VisualizationModuleStatus {
  id: number;
  lessonNumber: string;
  title: string;
  completed: boolean;
  pointsAwarded: number;
}

export interface VisualizationPointsBreakdown {
  completedCount: number;
  totalModules: number;
  points: number;
  maxPoints: number;
  modules: VisualizationModuleStatus[];
}

export interface GameLevelBreakdown {
  levelId: number;
  levelNumber: number;
  title: string;
  isCompleted: boolean;
  basePointsAwarded: number;
  maxBasePoints: number;
  hintUses: number;
  hintPenalty: number;
  guidedSolveUses: number;
  guidedSolvePenalty: number;
  totalPenalties: number;
  finalScore: number;
  maxScore: number;
}

export interface GamePointsBreakdown {
  level1: GameLevelBreakdown;
  level2: GameLevelBreakdown;
  points: number;
  maxPoints: number;
}

export interface TotalPointsSummary {
  theory: TheoryPointsBreakdown;
  quiz: QuizPointsBreakdown;
  visualizations: VisualizationPointsBreakdown;
  game: GamePointsBreakdown;
  totalPoints: number;
  maxTotalPoints: number;
  percentage: number;
}

// =========================================================================
// 1. THEORY MODULE SCORING (12 modules × 3 points = 36 max)
// =========================================================================
export const calculateTheoryPoints = (progress: UserProgress): TheoryPointsBreakdown => {
  const completedIds = new Set(progress.completedTheoryChapters || []);
  const targetLessons = THEORY_LESSONS.slice(0, 12);

  const modules: TheoryModuleStatus[] = targetLessons.map((lesson) => {
    const isDone = completedIds.has(lesson.id);
    return {
      id: lesson.id,
      chapterNumber: lesson.chapterNumber || `CH ${String(lesson.id).padStart(2, '0')}`,
      title: lesson.title,
      completed: isDone,
      pointsAwarded: isDone ? 3 : 0,
    };
  });

  const completedCount = modules.filter((m) => m.completed).length;
  const points = Math.min(36, completedCount * 3);

  return {
    completedCount,
    totalModules: 12,
    points,
    maxPoints: 36,
    modules,
  };
};

// =========================================================================
// 2. QUIZ SCORING (+3 correct, -1 incorrect, capped at 20 max, floored at 0)
// =========================================================================
export const calculateQuizPoints = (progress: UserProgress): QuizPointsBreakdown => {
  const storedAnswers = progress.pointsData?.quizAnswers || {};

  const questions: QuizQuestionStatus[] = QUIZ_QUESTIONS.map((q) => {
    const record = storedAnswers[q.id];
    if (record) {
      return {
        id: q.id,
        questionText: q.question,
        isAnswered: true,
        isCorrect: record.isCorrect,
        selectedOption: record.selectedOption,
        submittedAt: record.submittedAt,
      };
    }
    return {
      id: q.id,
      questionText: q.question,
      isAnswered: false,
    };
  });

  let correctCount = 0;
  let incorrectCount = 0;

  for (const q of questions) {
    if (q.isAnswered) {
      if (q.isCorrect) {
        correctCount += 1;
      } else {
        incorrectCount += 1;
      }
    }
  }

  const totalAnswered = correctCount + incorrectCount;
  const rawScore = correctCount * 3 - incorrectCount * 1;
  const points = Math.min(20, rawScore);

  return {
    correctCount,
    incorrectCount,
    totalAnswered,
    rawScore,
    points,
    maxPoints: 20,
    questions,
  };
};

// =========================================================================
// 3. VISUALIZATION SCORING (2 modules × 2 points = 4 max)
// =========================================================================
export const calculateVisualizationPoints = (progress: UserProgress): VisualizationPointsBreakdown => {
  const completedLabIds = new Set(progress.completedLabs || []);
  const targetLessons = VISUALIZATION_MODULES.slice(0, 2);

  const modules: VisualizationModuleStatus[] = targetLessons.map((lesson) => {
    const isDone = completedLabIds.has(lesson.id);
    return {
      id: lesson.id,
      lessonNumber: lesson.lessonNumber || `LESSON 0${lesson.id}`,
      title: lesson.title,
      completed: isDone,
      pointsAwarded: isDone ? 2 : 0,
    };
  });

  const completedCount = modules.filter((m) => m.completed).length;
  const points = Math.min(4, completedCount * 2);

  return {
    completedCount,
    totalModules: 2,
    points,
    maxPoints: 4,
    modules,
  };
};

// =========================================================================
// 4. GAME SCORING (2 levels × 20 points = 40 max)
// Level Score = Math.max(0, 20 - (2 × hintUses) - (3 × guidedSolveUses))
// =========================================================================
export const calculateGamePoints = (progress: UserProgress): GamePointsBreakdown => {
  const completedLevels = new Set(progress.completedGameLevels || []);
  const penaltiesData = progress.pointsData?.gamePenalties || {};

  const computeLevelBreakdown = (levelId: number): GameLevelBreakdown => {
    const levelConfig = GAME_LEVELS.find((l) => l.id === levelId);
    const title = levelConfig?.title || `Level ${levelId}`;
    const levelNumber = levelConfig?.levelNumber || levelId;

    const isCompleted = completedLevels.has(levelId);
    const penaltyRecord = penaltiesData[levelId] || {
      hintCount: 0,
      hintEventKeys: [],
      guidedSolveCount: 0,
      guidedSolveEventKeys: [],
    };

    const hintUses = Math.max(0, penaltyRecord.hintCount || penaltyRecord.hintEventKeys?.length || 0);
    const hintPenalty = hintUses * 2;

    const guidedSolveUses = Math.max(0, penaltyRecord.guidedSolveCount || penaltyRecord.guidedSolveEventKeys?.length || 0);
    const guidedSolvePenalty = guidedSolveUses * 3;

    const totalPenalties = hintPenalty + guidedSolvePenalty;

    // Base completion points: 20, awarded ONLY after completing the level
    const basePointsAwarded = isCompleted ? 20 : 0;
    const finalScore = isCompleted ? Math.max(0, 20 - totalPenalties) : 0;

    return {
      levelId,
      levelNumber,
      title,
      isCompleted,
      basePointsAwarded,
      maxBasePoints: 20,
      hintUses,
      hintPenalty,
      guidedSolveUses,
      guidedSolvePenalty,
      totalPenalties,
      finalScore,
      maxScore: 20,
    };
  };

  const level1 = computeLevelBreakdown(1);
  const level2 = computeLevelBreakdown(2);

  const points = Math.min(40, Math.max(0, level1.finalScore + level2.finalScore));

  return {
    level1,
    level2,
    points,
    maxPoints: 40,
  };
};

// =========================================================================
// 5. TOTAL POINTS SUMMARY (0 to 100 max)
// =========================================================================
export const calculateTotalPoints = (progress: UserProgress): TotalPointsSummary => {
  const theory = calculateTheoryPoints(progress);
  const quiz = calculateQuizPoints(progress);
  const visualizations = calculateVisualizationPoints(progress);
  const game = calculateGamePoints(progress);

  const rawTotal = theory.points + quiz.points + visualizations.points + game.points;
  const totalPoints = Math.min(100, rawTotal);
  const percentage = Math.round((totalPoints / 100) * 100);

  return {
    theory,
    quiz,
    visualizations,
    game,
    totalPoints,
    maxTotalPoints: 100,
    percentage,
  };
};
