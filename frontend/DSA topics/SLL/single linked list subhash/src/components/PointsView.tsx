import React, { useState, useEffect } from 'react';
import {
  Award,
  Sparkles,
  BookOpen,
  Eye,
  Gamepad2,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Trophy,
  Star,
  Check,
  XCircle,
  Clock,
  Circle,
} from 'lucide-react';
import {
  progressManager,
  CentralizedProgressState,
  LEARN_ACTIVITIES,
  VISUALIZE_ACTIVITIES,
  GAME_ACTIVITIES,
  GAME_TASK_LIST,
} from '../utils/progressManager';
import { QUIZ_QUESTIONS } from './QuizView';
import { MainViewTab } from '../types/game';
import { soundManager } from '../utils/audio';
import { useScrollReveal } from '../hooks/useScrollReveal';

interface PointsViewProps {
  onNavigateToTab: (tab: MainViewTab, chapterId?: string) => void;
  onResetProgress?: () => void;
}

export const PointsView: React.FC<PointsViewProps> = ({ onNavigateToTab }) => {
  useScrollReveal();
  const [state, setState] = useState<CentralizedProgressState>(() => progressManager.getCentralState());

  useEffect(() => {
    const unsub = progressManager.subscribe((newState) => {
      setState(newState);
    });
    return unsub;
  }, []);

  const totalPoints = state.totalPoints;
  const visualizeScore = state.visualizeScore;
  const gameScore = state.gameScore;
  const quizScore = state.quizScore;
  const mastery = progressManager.getMasteryLevel(totalPoints);
  const percentage = progressManager.getProgressPercentage();

  // Completed levels status
  const insertionTasks = GAME_TASK_LIST.filter((t) => t.category === 'insertion');
  const deletionTasks = GAME_TASK_LIST.filter((t) => t.category === 'deletion');
  const traversalTasks = GAME_TASK_LIST.filter((t) => t.category === 'traversal');

  const insertionDone = insertionTasks.every((t) => progressManager.isCompleted(t.taskId));
  const deletionDone = deletionTasks.every((t) => progressManager.isCompleted(t.taskId));
  const traversalDone = traversalTasks.every((t) => progressManager.isCompleted(t.taskId));

  const insertionScore = insertionTasks.reduce((sum, t) => {
    const ts = progressManager.getGameTaskState(t.taskId);
    return sum + (ts.completed ? ts.finalScore : 0);
  }, 0);

  const deletionScore = deletionTasks.reduce((sum, t) => {
    const ts = progressManager.getGameTaskState(t.taskId);
    return sum + (ts.completed ? ts.finalScore : 0);
  }, 0);

  const traversalScore = traversalTasks.reduce((sum, t) => {
    const ts = progressManager.getGameTaskState(t.taskId);
    return sum + (ts.completed ? ts.finalScore : 0);
  }, 0);

  const quizQuestionRecords = progressManager.getAllQuizQuestions();

  const categories = [
    {
      id: 'visualize' as const,
      name: 'Visualize',
      tab: 'VIDEO' as MainViewTab,
      score: visualizeScore,
      max: 10,
      icon: Eye,
      color: 'cyan',
      description: '2 concept videos: SLL Fundamentals & Pointer Mechanics (5 pts each)',
      badgeClass: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900/40',
      barGradient: 'from-cyan-500 to-blue-600',
    },
    {
      id: 'game' as const,
      name: 'Game',
      tab: 'GAME' as MainViewTab,
      score: gameScore,
      max: 60,
      icon: Gamepad2,
      color: 'emerald',
      description: '3 interactive levels: Insertion (25 pts), Deletion (25 pts), Traversal (10 pts)',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40',
      barGradient: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'quiz' as const,
      name: 'Quiz',
      tab: 'QUIZ' as MainViewTab,
      score: quizScore,
      max: 30,
      icon: HelpCircle,
      color: 'amber',
      description: '10 questions: +3 correct, −1 wrong, 0 timeout (30 pts max)',
      badgeClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-900/40',
      barGradient: 'from-amber-500 to-orange-500',
    },
    {
      id: 'learn' as const,
      name: 'Learn (Theory)',
      tab: 'THEORY' as MainViewTab,
      score: 0,
      max: 0,
      icon: BookOpen,
      color: 'blue',
      description: '15 foundational theory chapters (Learn section awards 0 pts)',
      badgeClass: 'bg-blue-50 dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-300 border-blue-200 dark:border-blue-900/40',
      barGradient: 'from-blue-600 to-indigo-600',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 font-sans text-slate-900 dark:text-white animate-page-enter pb-24">
      {/* Top Header Banner */}
      <div className="border-b border-slate-200 dark:border-blue-900/30 pb-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold font-mono uppercase tracking-widest text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Score & Points Ledger</span>
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-mono">
              Live Real-Time Sync
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight animate-heading-enter">
              Points System
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
              Real-time earned score across all Singly Linked List modules. 100 points maximum.
            </p>
          </div>

          {/* Mastery Level Badge */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div
              className={`px-4 py-2 rounded-2xl border flex items-center gap-2 shadow-xs ${
                mastery.isMaster
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300'
                  : 'bg-white dark:bg-[#0B1228] border-slate-200 dark:border-blue-900/30 text-slate-800 dark:text-slate-200'
              }`}
            >
              <Trophy
                className={`w-4 h-4 ${
                  mastery.isMaster ? 'text-amber-500 fill-amber-500' : 'text-[#2563EB] dark:text-blue-400'
                }`}
              />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500">
                  Mastery Level
                </span>
                <span className="text-xs font-bold font-mono">
                  {mastery.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. TOTAL POINTS HERO CARD WITH LARGE PROGRESS BAR */}
      <div className="bg-white dark:bg-[#0B1228] border border-slate-200 dark:border-blue-900/30 rounded-3xl p-6 sm:p-8 shadow-xs dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none">
          <Trophy className="w-56 h-56 text-[#2563EB]" />
        </div>

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono block mb-1">
                TOTAL POINTS
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl sm:text-7xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight leading-none">
                  {totalPoints}
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-400 dark:text-slate-500 font-mono">
                  / 100
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#2563EB] dark:text-blue-400">
                {percentage}%
              </span>
              <span className="text-xs text-slate-400 block font-mono">Curriculum Complete</span>
            </div>
          </div>

          {/* Large Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-4 sm:h-5 overflow-hidden p-0.5 border border-slate-200 dark:border-blue-900/30">
              <div
                className="bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#6366F1] h-full rounded-full transition-all duration-500 ease-out shadow-xs"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-xs font-mono text-slate-400 dark:text-slate-500 pt-1">
              <span>0 (Beginner)</span>
              <span>25 (Learner)</span>
              <span>50 (Intermediate)</span>
              <span>75 (Advanced)</span>
              <span>100 (Master)</span>
            </div>
          </div>

          {/* 100% Celebration Callout */}
          {totalPoints === 100 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-slate-900 border border-amber-300 dark:border-amber-500/30 flex items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                  <Sparkles className="w-5 h-5 text-amber-100" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 font-display">
                    🎉 MASTER ACHIEVED (100 / 100)
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    You have achieved the maximum possible score across all Singly Linked List modules!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. POINT BREAKDOWN SECTION */}
      <div className="mb-8">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-blue-900/30">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 font-mono">
              POINT BREAKDOWN (100 PTS MAXIMUM)
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Target: 100 Points
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const catPercent =
              cat.max > 0
                ? Math.min(100, Math.max(0, Math.round((cat.score / cat.max) * 100)))
                : Math.round(
                    (Object.keys(state.completedActivities).filter((id) => id.startsWith('learn-')).length / 15) * 100
                  );

            return (
              <div
                key={cat.id}
                className="bg-white dark:bg-[#0B1228] border border-slate-200 dark:border-blue-900/30 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:border-blue-300 dark:hover:border-blue-700/50"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-300">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-base text-slate-900 dark:text-white">
                        {cat.name}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1 font-mono font-bold">
                      {cat.max > 0 ? (
                        <>
                          <span className="text-xl text-slate-900 dark:text-white">
                            {cat.score}
                          </span>
                          <span className="text-xs text-slate-400">/ {cat.max}</span>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 font-normal">
                          0 pts
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div>
                  {/* Category Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mb-3">
                    <div
                      className={`bg-gradient-to-r ${cat.barGradient} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${catPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-blue-900/20 text-xs">
                    <span className="text-[11px] font-mono text-slate-400">
                      {cat.max > 0 ? `${catPercent}% of section` : `${catPercent}% lessons completed`}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playNav();
                        onNavigateToTab(cat.tab);
                      }}
                      className="inline-flex items-center gap-1 font-bold text-[#2563EB] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
                    >
                      <span>Open {cat.name}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* SUMMARY TOTAL LEDGER BOX */}
        <div className="mt-4 p-5 rounded-2xl bg-slate-50 dark:bg-[#070B18] border border-slate-200 dark:border-blue-900/30 flex flex-wrap items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-bold">
              ∑
            </div>
            <div>
              <span className="text-xs uppercase text-slate-400 block font-bold">
                TOTAL MODULE SCORE
              </span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Visualization ({visualizeScore}/10) + Game ({gameScore}/60) + Quiz ({quizScore}/30)
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-1.5 text-right">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {totalPoints}
            </span>
            <span className="text-base text-slate-400 font-bold">/ 100</span>
          </div>
        </div>
      </div>

      {/* 3. DETAILED ACTIVITIES STATUS LIST */}
      <div className="bg-white dark:bg-[#0B1228] border border-slate-200 dark:border-blue-900/30 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-blue-900/20">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 font-mono">
            Activities Checklist & Scoring Status
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {progressManager.getCompletedActivitiesCount()} / {progressManager.getTotalActivitiesCount()} Completed
          </span>
        </div>

        <div className="space-y-6">
          {/* Section A: Visualization (2 videos, 5 pts each = 10 pts) */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500 mb-2">
              <span className="uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                1. Visualization Videos ({visualizeScore} / 10 pts)
              </span>
              <span>2 Videos (5 pts each)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VISUALIZE_ACTIVITIES.map((act, idx) => {
                const isDone = progressManager.isCompleted(act.id);
                return (
                  <div
                    key={act.id}
                    onClick={() => onNavigateToTab('VIDEO')}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isDone
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-[#080D1F] border-slate-200/80 dark:border-blue-900/20 text-slate-600 dark:text-slate-400 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-300">
                        <Eye className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold truncate">Video {idx + 1}: {act.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {isDone ? 'Completed • Reward Claimed' : 'Watch video in full to earn points'}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`font-mono font-bold shrink-0 text-xs px-2.5 py-1 rounded-md ${
                        isDone
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                          : 'bg-cyan-100/70 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300'
                      }`}
                    >
                      {isDone ? '✓ 5 pts' : '+5 pts'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section B: Game Levels (Insertion 25 pts, Deletion 25 pts, Traversal 10 pts = 60 pts) */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500 mb-2">
              <span className="uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                2. Game Levels ({gameScore} / 60 pts)
              </span>
              <span>3 Levels • Insertion (25) • Deletion (25) • Traversal (10)</span>
            </div>

            {/* Game Levels Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div
                onClick={() => onNavigateToTab('GAME')}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  insertionDone
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-[#080D1F] border-slate-200/80 dark:border-blue-900/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">Insertion Level</span>
                  <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    {insertionScore} / 25 pts
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Status: {insertionDone ? '✓ Completed' : 'In Progress'}
                </div>
              </div>

              <div
                onClick={() => onNavigateToTab('GAME')}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  deletionDone
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-[#080D1F] border-slate-200/80 dark:border-blue-900/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">Deletion Level</span>
                  <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    {deletionScore} / 25 pts
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Status: {deletionDone ? '✓ Completed' : 'In Progress'}
                </div>
              </div>

              <div
                onClick={() => onNavigateToTab('GAME')}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  traversalDone
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-[#080D1F] border-slate-200/80 dark:border-blue-900/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">Traversal Level</span>
                  <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    {traversalScore} / 10 pts
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Status: {traversalDone ? '✓ Completed' : 'In Progress'}
                </div>
              </div>
            </div>

            {/* Individual Game Tasks Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {GAME_TASK_LIST.map((game) => {
                const taskState = progressManager.getGameTaskState(game.taskId);
                const isDone = taskState.completed || progressManager.isCompleted(game.taskId);
                const earned = taskState.completed ? taskState.finalScore : 0;
                return (
                  <div
                    key={game.taskId}
                    onClick={() => onNavigateToTab('GAME')}
                    className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between gap-1.5 cursor-pointer transition-all ${
                      isDone
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-[#080D1F] border-slate-200/80 dark:border-blue-900/20 text-slate-600 dark:text-slate-400 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs truncate">{game.title}</span>
                      <span
                        className={`font-mono font-bold text-[11px] px-1.5 py-0.5 rounded-md shrink-0 ${
                          isDone
                            ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isDone ? `✓ +${earned} pts` : `${game.baseScore} pts`}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between font-mono">
                      <span className="capitalize">{game.category}</span>
                      {isDone && (taskState.hintUsed || taskState.guideUsed) && (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          {taskState.hintUsed ? 'Hint (-2) ' : ''}
                          {taskState.guideUsed ? 'Guide (-3)' : ''}
                        </span>
                      )}
                      {!isDone && <span>Reward: {game.baseScore} pts</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section C: Quiz Assessment (10 questions, +3, -1, 0, 30 pts max) */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500 mb-2">
              <span className="uppercase tracking-wider text-amber-600 dark:text-amber-400">
                3. Quiz Assessment Questions ({quizScore} / 30 pts)
              </span>
              <span>10 Questions • +3 Correct • −1 Wrong • 0 Timeout</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {QUIZ_QUESTIONS.map((q, idx) => {
                const record = quizQuestionRecords[q.id];
                const status = record ? record.status : 'unanswered';
                const pts = record ? record.points : 0;

                return (
                  <div
                    key={q.id}
                    onClick={() => onNavigateToTab('QUIZ')}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between gap-1.5 ${
                      status === 'correct'
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                        : status === 'wrong'
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40'
                        : status === 'timeout'
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40'
                        : 'bg-slate-50 dark:bg-[#080D1F] border-slate-200/80 dark:border-blue-900/20 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[11px] text-slate-600 dark:text-slate-300">
                        Q{idx + 1}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          status === 'correct'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : status === 'wrong'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : status === 'timeout'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {status === 'correct'
                          ? '+3 pts'
                          : status === 'wrong'
                          ? '−1 pt'
                          : status === 'timeout'
                          ? '0 pts'
                          : 'Pending'}
                      </span>
                    </div>

                    <div className="text-[11px] font-medium truncate text-slate-800 dark:text-slate-200" title={q.question}>
                      {q.question}
                    </div>

                    <div className="text-[10px] font-mono capitalize">
                      {status === 'correct' && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Correct
                        </span>
                      )}
                      {status === 'wrong' && (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Incorrect
                        </span>
                      )}
                      {status === 'timeout' && (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Timed Out
                        </span>
                      )}
                      {status === 'unanswered' && (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Circle className="w-3 h-3" /> Unanswered
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section D: Learn (15 theory lessons, 0 pts) */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500 mb-2">
              <span className="uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
                4. Learn Section Topics (15 Chapters • 0 pts)
              </span>
              <span>Theory Content Only</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {LEARN_ACTIVITIES.map((act, idx) => {
                const isDone = progressManager.isCompleted(act.id);
                return (
                  <div
                    key={act.id}
                    onClick={() => onNavigateToTab('THEORY', act.theoryChapterId)}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 cursor-pointer transition-all ${
                      isDone
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-[#080D1F] border-slate-200/80 dark:border-blue-900/20 text-slate-600 dark:text-slate-400 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-md bg-white dark:bg-slate-800 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 border border-slate-200 dark:border-slate-700">
                        {idx + 1}
                      </span>
                      <span className="truncate font-medium">{act.title}</span>
                    </div>

                    <span
                      className={`font-mono font-bold shrink-0 text-[10px] px-1.5 py-0.5 rounded-md ${
                        isDone
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isDone ? '✓ Completed' : 'In Progress'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
