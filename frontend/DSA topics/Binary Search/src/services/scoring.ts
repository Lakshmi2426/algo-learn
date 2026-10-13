import { UserProgress } from '../types';

export interface PointsBreakdown {
  // Category 1: Theory (Max 24)
  theoryPoints: number;
  theoryCompletedCount: number;
  theoryTotalModules: number;
  theoryPointsPerModule: number;
  theoryMaxPoints: number;

  // Category 2: Quiz (Max 30)
  quizPoints: number;
  quizCorrectCount: number;
  quizWrongCount: number;
  quizTotalQuestions: number;
  quizPointsPerCorrect: number;
  quizPenaltyPerWrong: number;
  quizMaxPoints: number;
  quizAttempted: boolean;

  // Category 3: Visualizations (Max 10)
  visualizationPoints: number;
  visualizationCompletedCount: number;
  visualizationTotalModules: number;
  visualizationPointsPerModule: number;
  visualizationMaxPoints: number;

  // Category 4: Game (Max 36)
  gameBasePoints: number;
  gameCompletedCount: number;
  gameTotalLevels: number;
  gamePointsPerLevel: number;
  gameMaxPoints: number;
  gameHintsUsed: number;
  gameGuidedSolvesUsed: number;
  hintPenaltyPoints: number;
  guidedPenaltyPoints: number;
  totalGamePenalties: number;
  gameNetPoints: number;

  // Overall Total (Max 100)
  totalPoints: number;
  maxPoints: number;
  percentage: number;
  academicGrade: {
    letter: string;
    label: string;
    color: string;
    bg: string;
  };
}

export function calculatePoints(progress: UserProgress): PointsBreakdown {
  // 1. Theory: 12 modules × 2 points = 24 points max
  const theoryTotalModules = 12;
  const theoryPointsPerModule = 2;
  const theoryMaxPoints = 24;
  const theoryCompletedCount = Math.min(
    theoryTotalModules,
    Array.isArray(progress.completedTheoryChapters)
      ? progress.completedTheoryChapters.length
      : 0
  );
  const theoryPoints = theoryCompletedCount * theoryPointsPerModule;

  // 2. Quiz: +3 correct, -1 wrong. Max: 30 points
  const quizTotalQuestions = 10;
  const quizPointsPerCorrect = 3;
  const quizPenaltyPerWrong = 1;
  const quizMaxPoints = 30;

  const quizAttempted =
    Boolean(progress.quizCompleted) ||
    typeof progress.quizCorrectAnswers === 'number' ||
    (typeof progress.quizHighScore === 'number' && progress.quizHighScore > 0);

  let quizCorrectCount = 0;
  let quizWrongCount = 0;

  if (typeof progress.quizCorrectAnswers === 'number') {
    quizCorrectCount = Math.min(quizTotalQuestions, Math.max(0, progress.quizCorrectAnswers));
    quizWrongCount =
      typeof progress.quizWrongAnswers === 'number'
        ? Math.min(quizTotalQuestions, Math.max(0, progress.quizWrongAnswers))
        : Math.max(0, quizTotalQuestions - quizCorrectCount);
  } else if (progress.quizCompleted && typeof progress.quizHighScore === 'number') {
    quizCorrectCount = Math.min(
      quizTotalQuestions,
      Math.max(0, Math.round((progress.quizHighScore / 100) * quizTotalQuestions))
    );
    quizWrongCount = Math.max(0, quizTotalQuestions - quizCorrectCount);
  }

  let quizPoints = 0;
  if (quizAttempted) {
    const rawQuizPoints = quizCorrectCount * quizPointsPerCorrect - quizWrongCount * quizPenaltyPerWrong;
    quizPoints = Math.min(quizMaxPoints, rawQuizPoints);
  }

  // 3. Visualizations: 2 modules × 5 points = 10 points max
  const visualizationTotalModules = 2;
  const visualizationPointsPerModule = 5;
  const visualizationMaxPoints = 10;
  const visualizationCompletedCount = Math.min(
    visualizationTotalModules,
    Array.isArray(progress.completedLabs) ? progress.completedLabs.length : 0
  );
  const visualizationPoints = visualizationCompletedCount * visualizationPointsPerModule;

  // 4. Game: 6 levels × 6 points = 36 points max (less penalties)
  const gameTotalLevels = 6;
  const gamePointsPerLevel = 6;
  const gameMaxPoints = 36;
  const gameCompletedCount = Math.min(
    gameTotalLevels,
    Array.isArray(progress.completedGameLevels) ? progress.completedGameLevels.length : 0
  );
  const gameBasePoints = gameCompletedCount * gamePointsPerLevel;

  const gameHintsUsed = Math.max(0, progress.gameHintsUsed || 0);
  const gameGuidedSolvesUsed = Math.max(0, progress.gameGuidedSolvesUsed || 0);
  const hintPenaltyPoints = gameHintsUsed * 1; // 1 point deduction per hint used
  const guidedPenaltyPoints = gameGuidedSolvesUsed * 2; // 2 points deduction per guided solve used
  const extraGamePenalties = Math.max(0, progress.gamePenalties || 0);
  const totalGamePenalties = hintPenaltyPoints + guidedPenaltyPoints + extraGamePenalties;

  const gameNetPoints = Math.max(0, Math.min(gameMaxPoints, gameBasePoints - totalGamePenalties));

  // Overall Calculation:
  // Total Points = Theory Points + Quiz Points + Visualization Points + Game Net Points
  const maxPoints = 100;
  const totalPoints = Math.min(maxPoints, theoryPoints + quizPoints + visualizationPoints + gameNetPoints);
  const percentage = Math.round((totalPoints / maxPoints) * 100);

  // Academic Grade Descriptor
  let academicGrade = {
    letter: 'F',
    label: 'Not Started',
    color: 'text-slate-500 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800',
  };
  if (totalPoints >= 90) {
    academicGrade = {
      letter: 'A+',
      label: 'Distinction / Mastery',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/70',
    };
  } else if (totalPoints >= 80) {
    academicGrade = {
      letter: 'A',
      label: 'Excellent',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/70',
    };
  } else if (totalPoints >= 70) {
    academicGrade = {
      letter: 'B',
      label: 'Proficient',
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-50 dark:bg-cyan-950/70',
    };
  } else if (totalPoints >= 50) {
    academicGrade = {
      letter: 'C',
      label: 'Developing',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/70',
    };
  } else if (totalPoints > 0) {
    academicGrade = {
      letter: 'D',
      label: 'Foundational',
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/70',
    };
  }

  return {
    theoryPoints,
    theoryCompletedCount,
    theoryTotalModules,
    theoryPointsPerModule,
    theoryMaxPoints,

    quizPoints,
    quizCorrectCount,
    quizWrongCount,
    quizTotalQuestions,
    quizPointsPerCorrect,
    quizPenaltyPerWrong,
    quizMaxPoints,
    quizAttempted,

    visualizationPoints,
    visualizationCompletedCount,
    visualizationTotalModules,
    visualizationPointsPerModule,
    visualizationMaxPoints,

    gameBasePoints,
    gameCompletedCount,
    gameTotalLevels,
    gamePointsPerLevel,
    gameMaxPoints,
    gameHintsUsed,
    gameGuidedSolvesUsed,
    hintPenaltyPoints,
    guidedPenaltyPoints,
    totalGamePenalties,
    gameNetPoints,

    totalPoints,
    maxPoints,
    percentage,
    academicGrade,
  };
}
