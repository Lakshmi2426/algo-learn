import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Trophy,
  Star,
  Eye,
  Gamepad2,
  HelpCircle,
} from 'lucide-react';
import {
  progressManager,
  CentralizedProgressState,
  VISUALIZE_ACTIVITIES,
} from '../utils/progressManager';
import { MainViewTab } from '../types/game';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { soundManager } from '../utils/audio';

interface MyProgressViewProps {
  onNavigateToTab: (tab: MainViewTab, levelId?: number, chapterId?: string) => void;
}

export const MyProgressView: React.FC<MyProgressViewProps> = ({ onNavigateToTab }) => {
  useScrollReveal();
  const [centralState, setCentralState] = useState<CentralizedProgressState>(() =>
    progressManager.getCentralState()
  );

  useEffect(() => {
    const unsubscribe = progressManager.subscribe((state) => {
      setCentralState(state);
    });
    return unsubscribe;
  }, []);

  // 1. Module point calculations matching exact points allocation:
  // Visualise: 10 max (10%)
  const visScore = Math.min(
    10,
    Math.max(0, progressManager.getCategoryScore('visualize'))
  );
  const visPercent = Math.min(100, Math.round((visScore / 10) * 100));

  // Game: 60 max (60%)
  const gScore = Math.min(
    60,
    Math.max(0, progressManager.getCategoryScore('game'))
  );
  const gamePercent = Math.min(100, Math.round((gScore / 60) * 100));

  // Quiz: 30 max (30%)
  const qScore = Math.min(
    30,
    Math.max(0, progressManager.getCategoryScore('quiz'))
  );
  const quizPercent = Math.min(100, Math.round((qScore / 30) * 100));

  // Overall Score & Percentage (Visualise + Game + Quiz only = 100 max)
  const totalPoints = Math.min(
    100,
    Math.max(0, typeof centralState.totalPoints === 'number' ? centralState.totalPoints : progressManager.getTotalPoints())
  );
  const overallPercentage = Math.min(100, Math.max(0, Math.round((totalPoints / 100) * 100)));

  // Quiz question-wise records and statistics
  const quizQuestionsList = centralState.quizQuestions || {};
  const answeredQuizCount = Object.values(quizQuestionsList).filter(
    (q) => q.status !== 'unanswered'
  ).length;
  const correctQuizCount = Object.values(quizQuestionsList).filter(
    (q) => q.status === 'correct'
  ).length;
  const wrongQuizCount = Object.values(quizQuestionsList).filter(
    (q) => q.status === 'wrong'
  ).length;

  // Completed activities count across Visualise (2), Game (3), and Quiz (10) = 15 total
  const completedVis = VISUALIZE_ACTIVITIES.filter((v) => progressManager.isCompleted(v.id)).length;
  const completedGame = Object.values(centralState.gameTasks || {}).filter((t) => t.completed).length;
  const completedQuiz = answeredQuizCount;
  const completedActivities = completedVis + completedGame + completedQuiz;
  const totalActivities = 15;

  // Penalties calculations for bottom ledger row
  const gamePenalties = Object.values(centralState.gameTasks || {}).reduce(
    (sum, t) => sum + (t.hintPenalty || ((t.hintCount || 0) * 2)) + (t.guidePenalty || ((t.guideCount || 0) * 3)),
    0
  );
  const quizPenalties = Object.values(centralState.quizQuestions || {}).filter(
    (q) => q.status === 'wrong'
  ).length;
  const earnedPositive = Math.min(100, totalPoints + gamePenalties + quizPenalties);

  // Completed videos for Visualise card subtext
  const completedVideos = Object.keys(centralState.completedActivities || {}).filter(
    (id) => id === 'lesson-01' || id === 'lesson-02'
  ).length;

  const moduleCards = [
    {
      id: 'visualize',
      name: 'Visualize',
      score: visScore,
      max: 10,
      percentage: visPercent,
      description: 'Complete visualization activities to earn points.',
      subtext: `${completedVideos} / 2 videos completed • 5 pts each`,
      icon: Eye,
      tab: 'VIDEO' as MainViewTab,
      iconContainerClass: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-purple-900/40',
      barColor: '#9333EA',
    },
    {
      id: 'game',
      name: 'Game',
      score: gScore,
      max: 60,
      percentage: gamePercent,
      description: 'Complete game activities to earn points.',
      subtext: 'Complete 3 game challenges • 60 pts total',
      icon: Gamepad2,
      tab: 'GAME' as MainViewTab,
      iconContainerClass: 'bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-300 border border-teal-100 dark:border-teal-900/40',
      barColor: '#0D9488',
    },
    {
      id: 'quiz',
      name: 'Quiz',
      score: qScore,
      max: 30,
      percentage: quizPercent,
      description: 'Complete quiz activities to earn points.',
      subtext:
        answeredQuizCount > 0
          ? `${answeredQuizCount} / 10 answered (${correctQuizCount} correct [+${correctQuizCount * 3} pts], ${wrongQuizCount} wrong [${wrongQuizCount > 0 ? `-${wrongQuizCount} pts` : '0 pts'}])`
          : '10 questions • +3 correct, -1 wrong (0 / 10 answered)',
      icon: HelpCircle,
      tab: 'QUIZ' as MainViewTab,
      iconContainerClass: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-purple-900/40',
      barColor: '#9333EA',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 font-sans text-slate-900 dark:text-white animate-page-enter pb-24">
      {/* =========================================================================
          PANEL 1: HEADER SECTION (Matching Reference Image 2)
         ========================================================================= */}
      <div className="bg-white dark:bg-[#0B1228] border border-slate-200/90 dark:border-blue-900/30 rounded-2xl p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6">
        {/* Title Row with Gradient Icon & Accented Heading */}
        <div className="flex items-start gap-3.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shrink-0 shadow-xs">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 flex-wrap">
              <span>Single LinkedList</span>
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Learning Progress
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Track your journey through Single LinkedList concepts, algorithms, problem solving, complexity, and practical applications.
            </p>
          </div>
        </div>

        {/* Overall Completion Block */}
        <div className="pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100 font-sans">
                OVERALL COMPLETION
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60 font-sans">
                {completedActivities} of {totalActivities} Activities
              </span>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold font-sans text-blue-600 dark:text-blue-400">
              {overallPercentage}%
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Complete all learning activities to master Single LinkedList and earn 100 points.
          </p>

          {/* Large Overall Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          PANEL 2: OVERALL PROGRESS / TOPIC SCORE PANEL (Matching Reference Image 1)
         ========================================================================= */}
      <div className="bg-white dark:bg-[#0B1228] border border-slate-200/90 dark:border-blue-900/30 rounded-2xl p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        {/* Panel Header: Title on Left, Points Badge on Right */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-blue-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shrink-0 shadow-xs">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                Overall Progress
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Your learning progress across all sections and activities.
              </p>
            </div>
          </div>

          {/* Points Badge (Matching Reference Image 1) */}
          <div className="bg-[#EFF6FF] dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/40 rounded-2xl px-5 py-2.5 flex items-center gap-3 shadow-xs">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400 shrink-0" />
            <div className="flex flex-col text-right">
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400 leading-none">
                {totalPoints} / 100
              </span>
              <span className="text-[10px] font-bold font-mono tracking-wider text-slate-500 dark:text-slate-400 uppercase mt-1">
                TOTAL POINTS
              </span>
            </div>
          </div>
        </div>

        {/* 3 Module Cards: Visualize, Game, Quiz (Arranged neatly with no gaps) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {moduleCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.id}
                onClick={() => {
                  soundManager.playNav();
                  onNavigateToTab(card.tab);
                }}
                className="bg-white dark:bg-[#070B18] border border-slate-200/80 dark:border-blue-900/30 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-blue-300 dark:hover:border-blue-700/50 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Top: Icon + Name */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={`p-2 rounded-xl transition-transform group-hover:scale-105 ${card.iconContainerClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {card.name}
                    </span>
                  </div>

                  {/* Earned Points display: 0 / maximum points */}
                  <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                    {card.score} <span className="text-base text-slate-400 font-normal">/ {card.max}</span>
                  </div>

                  {/* Horizontal Progress Bar + Percentage */}
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${card.percentage}%`,
                          backgroundColor: card.barColor,
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400 shrink-0">
                      {card.percentage}%
                    </span>
                  </div>
                </div>

                <div>
                  {/* Description matching specification */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                    {card.description}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-1">
                    {card.subtext}
                  </p>

                  {/* Question-wise points indicator for Quiz */}
                  {card.id === 'quiz' && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-blue-900/20">
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                        <span>Question-Wise:</span>
                        <span className="text-blue-600 dark:text-blue-400 font-extrabold">{card.score} / 30 pts</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1 text-center font-mono text-[10px]">
                        {Array.from({ length: 10 }, (_, i) => {
                          const qNum = i + 1;
                          const rec = centralState.quizQuestions?.[qNum];
                          if (!rec || rec.status === 'unanswered') {
                            return (
                              <div
                                key={qNum}
                                className="py-0.5 px-1 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-slate-400 dark:text-slate-500 font-medium"
                                title={`Q${qNum}: Unanswered`}
                              >
                                Q{qNum}
                              </div>
                            );
                          }
                          if (rec.status === 'correct') {
                            return (
                              <div
                                key={qNum}
                                className="py-0.5 px-1 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 text-emerald-600 dark:text-emerald-400 font-bold"
                                title={`Q${qNum}: Correct (+3 pts)`}
                              >
                                +3
                              </div>
                            );
                          }
                          if (rec.status === 'wrong') {
                            return (
                              <div
                                key={qNum}
                                className="py-0.5 px-1 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700/60 text-rose-600 dark:text-rose-400 font-bold"
                                title={`Q${qNum}: Wrong (-1 pt)`}
                              >
                                -1
                              </div>
                            );
                          }
                          return (
                            <div
                              key={qNum}
                              className="py-0.5 px-1 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 text-amber-600 dark:text-amber-400 font-bold"
                              title={`Q${qNum}: Timed out (0 pts)`}
                            >
                              0
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Ledger Summary Row */}
        <div className="mt-6 p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#070B18] border border-slate-200/80 dark:border-blue-900/30 flex flex-wrap items-center justify-between gap-3 text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400">Earned Positive Marks:</span>
            <span className="px-2 py-0.5 rounded-md font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
              +{earnedPositive} pts
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400">Game Penalties:</span>
            <span className="px-2 py-0.5 rounded-md font-mono font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
              -{gamePenalties} pts
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400">Quiz Penalties:</span>
            <span className="px-2 py-0.5 rounded-md font-mono font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
              -{quizPenalties} pts
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <span className="text-slate-600 dark:text-slate-400 font-sans">Final Score:</span>
            <span className="px-2.5 py-0.5 rounded-md font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
              {totalPoints} / 100
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

