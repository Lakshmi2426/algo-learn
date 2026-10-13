import React from 'react';
import {
  TrendingUp,
  Trophy,
  Star,
  Eye,
  Brain,
} from 'lucide-react';
import { UserProgress } from '../../types';
import { getInitialTopicData } from '../../services/storage';

interface ProgressViewProps {
  progress: UserProgress;
  onNavigateToModules?: (tab?: string) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  progress,
}) => {
  // Authoritative student progress data for Data Structures and Types
  const topicData = progress.topicData || getInitialTopicData(progress.completedLabs || []);

  const completedVideos = topicData.completedVideosCount;
  const completedQuestions = topicData.answeredOrTimedOutQuizCount;
  const totalCompletedActivities = completedVideos + completedQuestions;

  // Authoritative calculations
  // Completion Percentage = (Completed Videos + Completed Quiz Questions) / 12 * 100
  const completionPercentage = Math.min(
    100,
    Math.max(0, topicData.completionPercentage ?? Math.round((totalCompletedActivities / 12) * 100))
  );

  const visualizationPoints = topicData.visualizationPoints ?? (completedVideos * 25);
  const visualizationPercentage = Math.min(100, Math.max(0, Math.round((visualizationPoints / 50) * 100)));

  const quizScore = topicData.quizScore ?? 0;
  // Progress bar for quiz is clamped between 0% and 100% of 50 max points
  const quizPercentage = Math.min(100, Math.max(0, Math.round((Math.max(0, quizScore) / 50) * 100)));

  const overallTopicScore = Math.min(
    100,
    topicData.overallTopicScore ?? (visualizationPoints + quizScore)
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-16">
      {/* ─────────────────────────────────────────────────────────────
          CARD A: HEADER AND OVERALL COMPLETION CARD
          ───────────────────────────────────────────────────────────── */}
      <section
        aria-label="Overall Learning Progress"
        className="w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 lg:p-9 shadow-sm dark:shadow-none transition-colors"
      >
        {/* Header with Glowing Blue-Purple Gradient Icon */}
        <div className="flex items-start sm:items-center gap-4 sm:gap-5 pb-6">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.3]" />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-[26px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Data Structures and Types Learning Progress
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Track your journey through Data Structures and Types concepts, algorithms, and practical applications.
            </p>
          </div>
        </div>

        {/* Subtle Divider */}
        <div className="border-t border-slate-200/80 dark:border-slate-800/90 my-1" />

        {/* Overall Completion Section */}
        <div className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                OVERALL COMPLETION
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 font-mono">
                {totalCompletedActivities} of 12 Activities
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete the learning activities to earn up to 100 points.
            </p>
          </div>

          {/* Progress Bar & Percentage */}
          <div className="flex items-center gap-4 sm:gap-6 pt-1">
            <div className="flex-1 h-3 sm:h-3.5 bg-slate-100 dark:bg-slate-800/90 rounded-full overflow-hidden border border-slate-200/70 dark:border-slate-700/60">
              <div
                role="progressbar"
                aria-valuenow={completionPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-700 ease-out shadow-xs"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono shrink-0 min-w-[3.5rem] text-right">
              {completionPercentage}%
            </span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          CARD B: OVERALL TOPIC SCORE CARD
          ───────────────────────────────────────────────────────────── */}
      <section
        aria-label="Overall Topic Score"
        className="w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 lg:p-9 shadow-sm dark:shadow-none transition-colors"
      >
        {/* Header Area with Glowing Trophy Icon & Prominent Star with Score */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-slate-200/80 dark:border-slate-800/90">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              <Trophy className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.3]" />
            </div>

            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                Data Structures and Types Topic Score
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Earned points are calculated from completed, persisted activities.
              </p>
            </div>
          </div>

          {/* Right: Prominent Star Icon + Large Score Display + Total Points Label */}
          <div className="flex items-center gap-3.5 sm:gap-4 shrink-0 sm:pl-4 self-start sm:self-auto">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 flex items-center justify-center shrink-0 shadow-xs">
              <Star className="w-6 h-6 sm:w-7 sm:h-7 fill-amber-400 text-amber-400 drop-shadow-xs" />
            </div>

            <div className="flex flex-col items-start sm:items-end">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tight leading-none">
                {overallTopicScore} / 100
              </span>
              <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-1">
                TOTAL POINTS
              </span>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            TWO CATEGORY CARDS ONLY: VISUALIZATION & QUIZ
            ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 pt-6 sm:pt-8">
          {/* CATEGORY CARD 1: VISUALIZATION */}
          <div className="bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-colors shadow-2xs">
            <div className="space-y-4">
              {/* Category Header: Icon, Title & Score */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/70 border border-blue-200/60 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Eye className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      Visualization
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Complete 2 videos
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                    {visualizationPoints} / 50
                  </span>
                </div>
              </div>

              {/* Progress Bar & Percentage */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {completedVideos} of 2 videos completed
                  </span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {visualizationPercentage}%
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/60">
                  <div
                    role="progressbar"
                    aria-valuenow={visualizationPercentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${visualizationPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <span>Points per video: 25 pts</span>
              <span>Max: 50 pts</span>
            </div>
          </div>

          {/* CATEGORY CARD 2: QUIZ */}
          <div className="bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-colors shadow-2xs">
            <div className="space-y-4">
              {/* Category Header: Icon, Title & Score */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/70 border border-purple-200/60 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Brain className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      Quiz
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Answer 10 quiz questions
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                    quizScore < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                  }`}>
                    {quizScore} / 50
                  </span>
                </div>
              </div>

              {/* Progress Bar & Percentage */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {completedQuestions} of 10 questions completed
                  </span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {quizPercentage}%
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/60">
                  <div
                    role="progressbar"
                    aria-valuenow={quizPercentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      quizScore < 0 ? 'bg-rose-500' : 'bg-blue-600 dark:bg-blue-500'
                    }`}
                    style={{ width: `${quizPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <span>+5 Correct • −2 Wrong</span>
              <span>Max: 50 pts</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
