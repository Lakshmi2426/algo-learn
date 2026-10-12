import React from 'react';
import { motion } from 'motion/react';
import {
  Flame,
  Zap,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  BookOpen,
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { NavigationTab } from '../../types';
import { UserAvatar } from '../common/UserAvatar';

interface DashboardPreviewSectionProps {
  setActiveTab: (tab: NavigationTab) => void;
  onOpenVisualizer: (topicId: string) => void;
}

export const DashboardPreviewSection: React.FC<DashboardPreviewSectionProps> = ({
  setActiveTab,
  onOpenVisualizer,
}) => {
  const { user } = useUser();

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <section className="relative py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/90 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border border-blue-200/90 dark:border-blue-800/80 text-xs font-mono font-bold uppercase tracking-wider mb-2 shadow-2xs">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Learning Momentum</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Daily Progress & Mastery Dashboard
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2">
            Track your cognitive leaps, maintain consecutive practice streaks, and receive smart algorithmic recommendations.
          </p>
        </div>

        {/* Dashboard Preview Card Container */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-blue-200/90 dark:border-slate-800 shadow-[0_12px_36px_-4px_rgba(37,99,235,0.14),0_4px_16px_-2px_rgba(124,58,237,0.08)] dark:shadow-slate-950/60">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Metrics (Col 1-7) */}
            <div className="lg:col-span-7 space-y-5">
              {/* User banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-blue-50/70 dark:bg-slate-800/60 border border-blue-200/85 dark:border-slate-700">
                <div className="flex items-center gap-3.5">
                  <UserAvatar
                    src={user.avatar}
                    name={user.name}
                    size="lg"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {user.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Level {user.level} • Algorithm Architect
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('topics');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 border border-blue-200/85 dark:border-slate-700 text-xs font-bold text-blue-700 hover:text-indigo-700 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
                >
                  Full Profile →
                </button>
              </div>

              {/* Weekly Goal Progress */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-blue-100 dark:border-slate-800">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">Weekly Goal</span>
                  <span className="text-blue-600 dark:text-blue-400 font-mono">
                    {user.weeklyProgressMinutes}/{user.weeklyGoalMinutes} Mins
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((user.weeklyProgressMinutes / user.weeklyGoalMinutes) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Stat Grid with 2 Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-blue-200/85 dark:border-slate-700 shadow-xs">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-1">
                    Current Streak
                  </div>
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5 font-mono">
                    <Flame className="w-5 h-5 fill-current text-blue-500" />
                    {user.streak} Days
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-blue-200/85 dark:border-slate-700 shadow-xs">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-1">
                    Total XP
                  </div>
                  <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 font-mono">
                    <Zap className="w-5 h-5 fill-current text-indigo-500" />
                    {user.xp.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* 7-Day Streak Calendar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Activity Calendar
                  </span>
                  <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold">
                    Goal: {Math.min(100, Math.round((user.weeklyProgressMinutes / user.weeklyGoalMinutes) * 100))}% Achieved
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {daysOfWeek.map((day, idx) => {
                    const isActiveDay = user.streak > 0 && idx < Math.min(7, user.streak);
                    return (
                      <div
                        key={day}
                        className="flex flex-col items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-blue-100 dark:border-slate-800"
                      >
                        <span className="text-[10px] font-mono text-slate-400 mb-1">{day}</span>
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-xs ${
                            isActiveDay
                              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                          }`}
                        >
                          <Flame className="w-3 h-3 fill-current" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Recommendations & Recent Activity (Col 8-12) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              {/* Next Suggested Module */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 dark:bg-slate-800/40 border border-blue-200/90 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    Recommended Next
                  </span>
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>

                <h4 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                  Binary Search Invariants
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  Solidify your logarithmic boundary pointers before advancing to 2D search matrices.
                </p>

                <button
                  onClick={() => onOpenVisualizer('binary-search')}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer hover:shadow-blue-600/30"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Resume Visualizer</span>
                </button>
              </div>

              {/* Milestone Achieved Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-blue-100 dark:border-slate-800 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    {user.badges.find((b) => b.unlocked)?.name || `Level ${user.level} Scholar`}
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {user.badges.find((b) => b.unlocked)
                      ? `Unlocked ${user.badges.find((b) => b.unlocked)?.unlockedAt || 'Recently'}`
                      : `${user.xp} Total XP • Active Learner`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
