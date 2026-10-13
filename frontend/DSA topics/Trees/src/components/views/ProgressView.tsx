import React, { useState, useEffect } from 'react';
import { NavItem, TopicId } from '../../types';
import {
  TrendingUp,
  Award,
  Video,
  BrainCircuit,
  ArrowRight,
  Sparkles,
  Star
} from 'lucide-react';
import { getActiveUserId, getUserItem } from '../../utils/userStorage';
import { QUIZ_QUESTIONS, TREE_TOPICS } from '../../data/treeData';
import {
  loadSavedQuizState,
  calculateTotalQuizPoints,
  MAX_QUIZ_POINTS
} from './QuizView';

interface ProgressViewProps {
  userId?: string;
  completedTopics: TopicId[];
  quizScore: { score: number; total: number } | null;
  completedVisualizations?: string[];
  onNavigate: (nav: NavItem, topicId?: TopicId) => void;
  onToggleTopicCompleted?: (topicId: TopicId) => void;
  isDarkMode: boolean;
  uploadedVideoUrl?: string | null;
  uploadedVideoName?: string;
  uploadedVideoSize?: string;
  isVideoCompleted?: boolean;
  onUploadVideo?: (file: File) => void;
  onRemoveVideo?: () => void;
  onToggleVideoCompleted?: () => void;
  onWatchAgain?: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  completedTopics = [],
  quizScore,
  onNavigate,
  isDarkMode,
  userId,
  isVideoCompleted = false,
  completedVisualizations = [],
}) => {
  const effectiveUserId = userId || getActiveUserId();

  // Load live quiz state
  const [quizStateTick, setQuizStateTick] = useState<number>(0);

  useEffect(() => {
    setQuizStateTick((t) => t + 1);
  }, [quizScore]);

  const quizState = loadSavedQuizState(effectiveUserId);
  const confirmed = quizState?.confirmedQuestions || {};
  const userAnswers = quizState?.userAnswers || {};
  const questionTimeouts = quizState?.questionTimeouts || {};

  // =========================================================================
  // SCORING CONFIGURATION (STRICT RULES):
  // Quiz: 70 points maximum
  // Visualize: 30 points maximum
  // Combined total: 100 points maximum
  // Total score starts at 0 / 100 for a new user and never exceeds 100.
  // =========================================================================
  const totalVizPointsEarned = isVideoCompleted ? 30 : 0; // 0 or 30 pts
  const calculatedQuizPts = calculateTotalQuizPoints(confirmed, questionTimeouts, userAnswers);
  const totalQuizPointsEarned = Object.keys(confirmed).length > 0
    ? calculatedQuizPts
    : (quizScore?.score ?? (() => {
        try {
          const raw = getUserItem(effectiveUserId, 'quiz_score');
          if (raw) return JSON.parse(raw).score;
        } catch {}
        return 0;
      })());
  const totalScoreEarned = Math.min(100, totalVizPointsEarned + totalQuizPointsEarned);

  const vizPercent = isVideoCompleted ? 100 : 0;

  // Quiz statistics
  const totalQuestions = QUIZ_QUESTIONS.length; // 14
  const answeredQuestionsCount = Object.keys(confirmed).length;

  const quizCompletionPercent = Math.min(
    100,
    Math.round((answeredQuestionsCount / totalQuestions) * 100)
  );

  // =========================================================================
  // OVERALL ACTIVITIES (Total 10 Activities):
  // Calculated dynamically from actual persisted activity data:
  // - 7 Learn Table of Contents topics (from current syllabus TREE_TOPICS)
  // - 1 Visualize masterclass video lesson
  // - 1 Quiz assessment
  // - 1 Topic mastery milestone (score >= 70 pts)
  // Total: 10 Activities
  // =========================================================================
  const totalLearnTopics = TREE_TOPICS.length; // 7
  const completedLearnCount = completedTopics.length; // 0..7
  const isQuizFullyCompleted = answeredQuestionsCount >= totalQuestions;
  const isMasteryMilestone = totalScoreEarned >= 70;

  const totalActivities = 10;
  const completedActivitiesCount = Math.min(
    totalActivities,
    completedLearnCount +
      (isVideoCompleted ? 1 : 0) +
      (isQuizFullyCompleted ? 1 : 0) +
      (isMasteryMilestone ? 1 : 0)
  );

  const overallActivitiesPercent = Math.min(
    100,
    Math.round((completedActivitiesCount / totalActivities) * 100)
  );

  return (
    <div id="progress-view-root" className="max-w-5xl mx-auto space-y-6 py-4 px-2 sm:px-4">
      {/* =====================================================================
          CARD 1: Overall Learning Progress Card
          Matching the screenshot's dashboard structure, typography, and layout
          ===================================================================== */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border transition-all duration-200 ${
          isDarkMode
            ? 'bg-[#0d1424] border-blue-950/70 text-white shadow-xl shadow-black/30'
            : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
        }`}
      >
        {/* Header Row */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/25 text-white">
            <TrendingUp className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              TreeDSA <span className="text-blue-500 dark:text-blue-400">Learning Progress</span>
            </h1>
            <p
              className={`text-xs sm:text-sm mt-1 leading-relaxed ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Track your journey through tree concepts, algorithms, problem solving, complexity, and practical applications.
            </p>
          </div>
        </div>

        {/* Counter, Subtitle & Big Percentage Row */}
        <div className="mt-7 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center flex-wrap gap-2.5">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-700'
                }`}
              >
                OVERALL COMPLETION
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${
                  isDarkMode
                    ? 'bg-[#141d33] border-slate-700/60 text-slate-200'
                    : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                {completedActivitiesCount} of {totalActivities} Activities
              </span>
            </div>
            <p
              className={`text-xs mt-2 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              Complete all learning activities to master TreeDSA and earn 100 points.
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-500 font-mono tracking-tight leading-none">
              {overallActivitiesPercent}%
            </div>
          </div>
        </div>

        {/* Horizontal Progress Bar */}
        <div
          className={`w-full h-3 rounded-full overflow-hidden mt-4 ${
            isDarkMode ? 'bg-slate-800/90' : 'bg-slate-100'
          }`}
        >
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-700 ease-out"
            style={{ width: `${Math.max(overallActivitiesPercent > 0 ? 3 : 0, overallActivitiesPercent)}%` }}
          />
        </div>
      </div>

      {/* =====================================================================
          CARD 2: TreeDSA Topic Score Card
          Display total score (0 / 100), Quiz (70 pts), Visualize (30 pts)
          Game card completely removed per user instruction.
          ===================================================================== */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border transition-all duration-200 ${
          isDarkMode
            ? 'bg-[#0d1424] border-blue-950/70 text-white shadow-xl shadow-black/30'
            : 'bg-white border-slate-200/90 text-slate-900 shadow-md shadow-slate-200/60'
        }`}
      >
        {/* Header of Score Card with Total Points Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#0066FF] to-[#2563EB] flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/25 text-white">
              <Award className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                TreeDSA Topic Score
              </h2>
              <p
                className={`text-xs sm:text-sm mt-1 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Earned points are calculated from completed, persisted activities.
              </p>
            </div>
          </div>

          {/* Total Score Badge Box matching reference design */}
          <div
            className={`px-5 py-3 rounded-2xl border flex items-center gap-3.5 self-start sm:self-auto shrink-0 ${
              isDarkMode
                ? 'bg-[#090e1c] border-slate-800/90 text-white'
                : 'bg-slate-50 border-slate-200/90 text-slate-900 shadow-xs'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-500 shadow-sm shadow-amber-500/20">
              <Star className="w-4.5 h-4.5 fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.85)] animate-pulse" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black font-mono tracking-tight leading-none">
                <span className="text-blue-600 dark:text-blue-400">{totalScoreEarned}</span>{' '}
                <span
                  className={`text-sm sm:text-base font-bold ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  / 100
                </span>
              </div>
              <div
                className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                TOTAL POINTS
              </div>
            </div>
          </div>
        </div>

        {/* Two Category Cards arranged side-by-side (Visualize: 30 pts, Quiz: 70 pts) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-7">
          {/* Category Card 1: Visualization (30 pts max) */}
          <div
            className={`p-5 sm:p-6 rounded-2xl border flex flex-col justify-between transition-all ${
              isDarkMode
                ? 'bg-[#090e1c] border-slate-800/80 hover:border-blue-900/50'
                : 'bg-slate-50/80 border-slate-200/90 hover:border-blue-300'
            }`}
          >
            <div>
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                    isDarkMode
                      ? 'bg-blue-600/20 border-blue-500/30 text-blue-400'
                      : 'bg-blue-100 border-blue-200 text-blue-700'
                  }`}
                >
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <div
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Visualization
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono mt-0.5">
                    <span>{totalVizPointsEarned}</span>{' '}
                    <span
                      className={`text-sm font-semibold ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      / 30 pts
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar + 0/23 (not in percentage) */}
              <div className="flex items-center gap-3 mt-5">
                <div
                  className={`flex-1 h-2 rounded-full overflow-hidden ${
                    isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${isVideoCompleted ? 100 : 0}%` }}
                  />
                </div>
                <span
                  id="progress-visualize-count"
                  className={`text-xs font-bold font-mono shrink-0 ${
                    isDarkMode ? 'text-blue-400 font-extrabold' : 'text-blue-700 font-extrabold'
                  }`}
                >
                  {isVideoCompleted ? '1 / 1' : '0 / 1'}
                </span>
              </div>

              {/* Activity description */}
              <p
                className={`text-xs mt-3.5 font-medium ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {isVideoCompleted
                  ? 'Masterclass visualization completed (1 / 1, +30 pts)'
                  : 'Tree DSA masterclass visualization (0 / 1, +30 pts)'}
              </p>
            </div>

            <button
              onClick={() => onNavigate('visualize')}
              className={`mt-5 w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                isDarkMode
                  ? 'bg-[#0e172a] hover:bg-[#162238] border-blue-900/40 text-blue-300 hover:text-white'
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-blue-700 shadow-xs'
              }`}
            >
              <span>{isVideoCompleted ? 'Rewatch Visualization' : 'Watch Visualization'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Category Card 2: Quiz (70 pts max) */}
          <div
            className={`p-5 sm:p-6 rounded-2xl border flex flex-col justify-between transition-all ${
              isDarkMode
                ? 'bg-[#090e1c] border-slate-800/80 hover:border-slate-700/90'
                : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                    isDarkMode
                      ? 'bg-blue-600/20 border-blue-500/30 text-blue-400'
                      : 'bg-blue-100 border-blue-200 text-blue-700'
                  }`}
                >
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <div
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Quiz
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono mt-0.5">
                    <span>{totalQuizPointsEarned}</span>{' '}
                    <span
                      className={`text-sm font-semibold ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      / 70 pts
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar + percentage */}
              <div className="flex items-center gap-3 mt-5">
                <div
                  className={`flex-1 h-2 rounded-full overflow-hidden ${
                    isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${quizCompletionPercent}%` }}
                  />
                </div>
                <span
                  className={`text-xs font-bold font-mono shrink-0 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  {quizCompletionPercent}%
                </span>
              </div>

              {/* Activity description */}
              <p
                className={`text-xs mt-3.5 font-medium ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {answeredQuestionsCount} of {totalQuestions} questions answered (+5 correct, -2 wrong)
              </p>
            </div>

            <button
              onClick={() => onNavigate('quiz')}
              className={`mt-5 w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                isDarkMode
                  ? 'bg-[#12182b] hover:bg-[#1a233e] border-blue-900/40 text-blue-300 hover:text-white'
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-blue-700 shadow-xs'
              }`}
            >
              <span>
                {answeredQuestionsCount >= totalQuestions
                  ? 'Review Quiz Results'
                  : answeredQuestionsCount > 0
                  ? 'Resume Quiz Assessment'
                  : 'Start Quiz Assessment'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

