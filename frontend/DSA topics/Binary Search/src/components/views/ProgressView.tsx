import React from 'react';
import {
  TrendingUp,
  Trophy,
  Star,
  Eye,
  Gamepad2,
  Brain,
} from 'lucide-react';
import { TabType, UserProgress } from '../../types';
import { soundEffects } from '../../services/sound';

interface ProgressViewProps {
  progress: UserProgress;
  onResetProgress?: () => void;
  onNavigateTab?: (tab: TabType) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  progress,
  onNavigateTab,
}) => {
  // Topic Points System Breakdown (Total 100 points: Visualize 10 + Game 60 + Quiz 30)
  const tp = progress.topicPoints || {
    visualizeEarned: 0,
    gameEarned: 0,
    quizEarned: 0,
    totalEarned: 0,
  };

  const visualizeEarned = Math.min(10, tp.visualizeEarned || 0);
  const gameEarned = Math.min(60, tp.gameEarned || 0);
  const quizEarned = Math.min(30, tp.quizEarned || 0);
  const totalTopicPoints = Math.min(100, visualizeEarned + gameEarned + quizEarned);

  // Module completion counters
  const completedVideos = progress.completedLabs?.length || tp.completedVideos?.length || 0;
  const completedGames = progress.completedGameLevels?.length || Object.keys(tp.gameLevelScores || {}).length || 0;
  const completedQuizCount = progress.quizCompleted ? 10 : Object.keys(tp.quizQuestionAnswered || {}).length;

  const totalModulesCount = 18; // 2 Videos + 6 Games + 10 Quiz Questions
  const completedModulesCount = Math.min(
    totalModulesCount,
    Math.min(2, completedVideos) + Math.min(6, completedGames) + Math.min(10, completedQuizCount)
  );

  const overallCompletionPercent = Math.round((completedModulesCount / totalModulesCount) * 100);

  const visualizePercent = Math.round((visualizeEarned / 10) * 100);
  const gamePercent = Math.round((gameEarned / 60) * 100);
  const quizPercent = Math.round((quizEarned / 30) * 100);

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* ─── CARD 1: BINARY SEARCH LEARNING PROGRESS ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-8 sm:p-10 shadow-xs space-y-6">
        <div className="flex items-start gap-4 sm:gap-5">
          {/* Rounded square icon container with royal blue gradient */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
            <TrendingUp className="w-7 h-7 stroke-[2.5]" />
          </div>

          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Binary Search <span className="text-blue-600 dark:text-blue-400">Learning </span><span className="text-purple-600 dark:text-purple-400">Progress</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal max-w-2xl">
              Track your journey through Binary Search concepts, sequential scan algorithms, problem solving, complexity, and practical applications.
            </p>
          </div>
        </div>

        {/* Overall Completion Section */}
        <div className="pt-2 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  OVERALL COMPLETION
                </span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700">
                  {completedModulesCount} of {totalModulesCount} Modules
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Complete all learning activities to master Binary Search and earn 100 points.
              </p>
            </div>

            <div className="text-3xl sm:text-4xl font-black font-mono text-blue-600 dark:text-blue-400 self-start sm:self-auto">
              {overallCompletionPercent}%
            </div>
          </div>

          {/* Full-width Horizontal Progress Bar */}
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-750">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(overallCompletionPercent > 0 ? 3 : 0, overallCompletionPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── CARD 2: BINARY SEARCH TOPIC SCORE & ACTIVITY BREAKDOWN ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-8 sm:p-10 shadow-xs space-y-6">
        {/* Header Row: Title & Star Score Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
              <Trophy className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Binary Search Topic Score
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Earned points are calculated from completed, persisted activities.
              </p>
            </div>
          </div>

          {/* Star Total Points Widget */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-2xs self-start sm:self-center">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-500 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>

            <div>
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                  {totalTopicPoints}
                </span>
                <span className="text-slate-400 font-bold text-base sm:text-lg">
                  / 100
                </span>
              </div>
              <span className="text-[9px] font-mono font-bold tracking-widest text-slate-400 uppercase block">
                TOTAL POINTS
              </span>
            </div>
          </div>
        </div>

        {/* 3 Activity Cards Grid: Visualize, Game, Quiz */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. VISUALIZE CARD */}
          <div
            onClick={() => {
              soundEffects.playClick();
              if (onNavigateTab) onNavigateTab('lab');
            }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xs hover:border-purple-300 dark:hover:border-purple-600/60 transition-all cursor-pointer group space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Eye className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                {visualizePercent}%
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Visualize
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                {visualizeEarned} / 10
              </div>
            </div>

            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${visualizePercent}%` }}
              />
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500 font-normal">
              Complete visualizations &amp; videos
            </p>
          </div>

          {/* 2. GAME CARD */}
          <div
            onClick={() => {
              soundEffects.playClick();
              if (onNavigateTab) onNavigateTab('game');
            }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xs hover:border-blue-300 dark:hover:border-blue-600/60 transition-all cursor-pointer group space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Gamepad2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                {gamePercent}%
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Game
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                {gameEarned} / 60
              </div>
            </div>

            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${gamePercent}%` }}
              />
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500 font-normal">
              Complete game levels
            </p>
          </div>

          {/* 3. QUIZ CARD */}
          <div
            onClick={() => {
              soundEffects.playClick();
              if (onNavigateTab) onNavigateTab('quiz');
            }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xs hover:border-blue-300 dark:hover:border-blue-600/60 transition-all cursor-pointer group space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Brain className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                {quizPercent}%
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Quiz
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                {quizEarned} / 30
              </div>
            </div>

            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${quizPercent}%` }}
              />
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500 font-normal">
              Answer quiz questions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
