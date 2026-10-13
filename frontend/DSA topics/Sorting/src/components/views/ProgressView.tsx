import React from 'react';
import {
  TrendingUp,
  Eye,
  Gamepad2,
  ClipboardCheck,
  Star,
} from 'lucide-react';
import { SortGameId, UserProgress } from '../../types';
import { normalizePointsLedger } from '../../services/storage';

const FIVE_GAME_CARD_IDS: { id: SortGameId; totalLevels: number }[] = [
  { id: 'bubble-sort', totalLevels: 2 },
  { id: 'selection-sort', totalLevels: 2 },
  { id: 'insertion-sort', totalLevels: 2 },
  { id: 'sorting-battle', totalLevels: 2 },
  { id: 'fix-algorithm', totalLevels: 5 },
];

interface ProgressViewProps {
  progress: UserProgress;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  progress,
}) => {
  const ledger = normalizePointsLedger(progress.pointsLedger);

  // ─── OVERALL COMPLETION CALCULATION (SEPARATE FROM TOTAL POINTS) ───
  // Learn: 6 topics/concepts
  const completedLearnCount = Math.min(
    6,
    Array.isArray(progress.completedTheoryChapters)
      ? new Set(progress.completedTheoryChapters).size
      : 0
  );

  // Visualize: 3 video cards
  const completedVideosCount = Math.min(
    3,
    Math.max(
      ledger.completedVideoIds?.length || 0,
      Array.isArray(progress.completedLabs) ? new Set(progress.completedLabs).size : 0
    )
  );

  // Game: 5 game cards
  const completedGamesCount = Math.min(
    5,
    FIVE_GAME_CARD_IDS.filter(
      (c) =>
        (Array.isArray(progress.sortGameProgress?.[c.id])
          ? new Set(progress.sortGameProgress[c.id]).size
          : 0) >= c.totalLevels ||
        progress.gameStats?.[c.id]?.status === 'Completed' ||
        ledger.completedGameCardIds?.includes(c.id)
    ).length
  );

  // Quiz: 10 questions
  const recordedQuizCount = ledger.quizQuestionRecords
    ? Object.keys(ledger.quizQuestionRecords).length
    : 0;
  const completedQuizCount = Math.min(
    10,
    Math.max(
      recordedQuizCount,
      Array.isArray(progress.quizCompletedQuestions)
        ? new Set(progress.quizCompletedQuestions).size
        : progress.quizCompleted
        ? 10
        : progress.quizTotalQuestionsAnswered
        ? Math.min(10, progress.quizTotalQuestionsAnswered)
        : 0
    )
  );

  // Overall Completion Percentage (across Learn 6 + Visualize 3 + Game 5 + Quiz 10 = 24 activities)
  const totalActivities = 6 + 3 + 5 + 10;
  const completedActivities =
    completedLearnCount + completedVideosCount + completedGamesCount + completedQuizCount;
  const overallCompletionPercentage = Math.min(
    100,
    Math.round((completedActivities / totalActivities) * 100)
  );

  // ─── SCORES (MAX 100: Visualize 15 + Game 45 + Quiz 40) ───
  // Visualize: 3 videos × 5 points = 15 max
  const visualizeScore = Math.min(
    15,
    Math.max(0, Math.max(ledger.visualizationPoints, completedVideosCount * 5))
  );
  const visualizeScorePct = Math.min(100, Math.round((visualizeScore / 15) * 100));

  // Game: 5 cards × 9 points = 45 max, minus Hint (-2) and Guided Solve (-3) deductions
  const gameBasePoints = Math.min(
    45,
    Math.max(ledger.gamePoints, completedGamesCount * 9)
  );
  const gameDeductions = ledger.hintDeductions + ledger.guidedSolveDeductions;
  const gameScore = Math.min(45, Math.max(0, gameBasePoints - gameDeductions));
  const gameScorePct = Math.min(100, Math.round((gameScore / 45) * 100));

  // Quiz: 10 questions × 4 points = 40 max, minus Wrong Answer (-1) deductions
  const quizBasePoints = Math.min(40, ledger.quizPoints);
  const quizDeductions = ledger.wrongQuizDeductions;
  const quizScore = Math.min(40, quizBasePoints - quizDeductions);
  const quizScorePct = Math.min(100, Math.round((Math.max(0, quizScore) / 40) * 100));

  // Total Points dynamically calculated by adding Visualize, Game, and Quiz scores
  const totalPoints = Math.min(100, visualizeScore + gameScore + quizScore);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* 1. Section Heading & 2. Overall Completion */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Sorting{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Learning Progress
            </span>
          </h1>
        </div>

        {/* Overall Completion Row + Horizontal Progress Bar */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Overall Completion
            </span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {overallCompletionPercentage}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full transition-all duration-300"
              style={{ width: `${overallCompletionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Sorting Topic Score Card */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Sorting Topic Score
          </h2>
          <div className="flex items-center gap-1.5 text-sm sm:text-base font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.55)] shrink-0" />
            <span>Total Points: {totalPoints}/100</span>
          </div>
        </div>

        {/* Three Smaller Section Cards: Visualize, Game, Quiz */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Visualize Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Eye className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Visualize
              </span>
            </div>

            <div className="font-mono text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              {visualizeScore}/15
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${visualizeScorePct}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0">
                {visualizeScorePct}%
              </span>
            </div>
          </div>

          {/* Game Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Gamepad2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Game
              </span>
            </div>

            <div className="font-mono text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              {gameScore}/45
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${gameScorePct}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0">
                {gameScorePct}%
              </span>
            </div>
          </div>

          {/* Quiz Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Quiz
              </span>
            </div>

            <div className="font-mono text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              {quizScore}/40
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${quizScorePct}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0">
                {quizScorePct}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
