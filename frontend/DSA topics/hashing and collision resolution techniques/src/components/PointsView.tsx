import React, { useState, useEffect } from 'react';
import {
  Award,
  TrendingUp,
  BookOpen,
  Sparkles,
  Gamepad2,
  HelpCircle,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { pointsManager, PointsState, PointActivityEvent } from '../utils/pointsManager';
import { progressManager } from '../utils/progressManager';
import { MainViewTab } from '../types/game';

export interface PointsViewProps {
  onNavigateToTab?: (tab: MainViewTab) => void;
}

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export const PointsView: React.FC<PointsViewProps> = () => {
  const [points, setPoints] = useState<PointsState>(() => pointsManager.getPoints());
  const [activities, setActivities] = useState<PointActivityEvent[]>(() => pointsManager.getActivities());

  useEffect(() => {
    const unsubPoints = pointsManager.subscribe((newPoints) => {
      setPoints(newPoints);
      setActivities(pointsManager.getActivities());
    });
    const unsubProgress = progressManager.subscribe(() => {
      setPoints(pointsManager.getPoints());
      setActivities(pointsManager.getActivities());
    });
    return () => {
      unsubPoints();
      unsubProgress();
    };
  }, []);

  const totalPenalties = points.hintPenalties + points.guidedSolvePenalties;

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8 font-sans text-[#0F172A] animate-page-enter">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 1. Points Header Card (Screenshot 1) */}
        <div
          id="points-header-card"
          className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          {/* Left Content */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] rounded-full text-[11px] font-bold uppercase tracking-wider font-mono">
              <Award className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>CENTRAL POINTS SYSTEM</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Points
            </h1>

            <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
              Overall score earned across Theory modules, Quiz challenges, Visualizations, and Game levels.
            </p>
          </div>

          {/* Right Compact Total Points Card */}
          <div
            id="points-total-summary-card"
            className="bg-[#F4F9FF] border border-[#D8E9FE] rounded-2xl p-5 sm:p-6 text-right shrink-0 w-full md:w-56 shadow-2xs"
          >
            <div className="text-[11px] font-bold font-mono uppercase tracking-wider text-[#2563EB] mb-1">
              TOTAL POINTS
            </div>
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#0F172A]">
                {points.totalPoints}
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-slate-500">
                / 100
              </span>
            </div>
            <div className="text-xs font-mono font-medium text-slate-500 mt-1">
              {points.totalPoints} / 100 Points
            </div>
          </div>
        </div>

        {/* 2. Main Two-Column Layout (Screenshot 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Points Breakdown Card (~2/3 width) */}
          <div
            id="points-breakdown-card"
            className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-[#0F172A]">Points Breakdown</h2>
              </div>
              <span className="text-xs font-mono text-slate-400">Categorized</span>
            </div>

            {/* Category Rows in Exact Order */}
            <div className="divide-y divide-slate-100">
              {/* 1. Visualization */}
              <div className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-[#0F172A]">Visualization (Max 20)</span>
                </div>
                <span className="text-sm font-bold font-mono text-[#0F172A]">
                  +{points.visualizePoints}
                </span>
              </div>

              {/* 2. Games */}
              <div className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                    <Gamepad2 className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-[#0F172A]">Games (Max 50)</span>
                </div>
                <span className="text-sm font-bold font-mono text-[#0F172A]">
                  +{points.gamePoints}
                </span>
              </div>

              {/* 3. Quiz */}
              <div className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FAF5FF] text-[#9333EA] flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-[#0F172A]">Quiz (Max 30)</span>
                </div>
                <span className="text-sm font-bold font-mono text-[#0F172A]">
                  {points.quizPoints >= 0 ? `+${points.quizPoints}` : `${points.quizPoints}`}
                </span>
              </div>

              {/* 4. Theory / Learn (0 pts) */}
              <div className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Theory / Learn (Non-scored)</span>
                </div>
                <span className="text-sm font-mono text-slate-400">
                  +0
                </span>
              </div>

              {/* 5. Penalties */}
              <div className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-[#0F172A]">Penalties (Hint & Guided Solve)</span>
                </div>
                <span className={`text-sm font-bold font-mono ${totalPenalties > 0 ? 'text-[#DC2626]' : 'text-[#0F172A]'}`}>
                  {totalPenalties > 0 ? `-${totalPenalties}` : '+0'}
                </span>
              </div>
            </div>

            {/* Total Row */}
            <div className="pt-4 mt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-base font-bold text-[#0F172A]">Total Score</span>
              <span className="text-base sm:text-lg font-bold font-mono text-[#2563EB]">
                {points.totalPoints} / 100
              </span>
            </div>
          </div>

          {/* Right Column: SCORING RULES Card (~1/3 width) */}
          <div
            id="points-scoring-rules-card"
            className="lg:col-span-1 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-2">
                <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F172A]">
                  SCORING RULES
                </h3>
              </div>

              {/* Rules List */}
              <div className="divide-y divide-slate-100 text-xs">
                {/* Visualize Rule */}
                <div className="py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-600">Complete Visualize video (2 × +10)</span>
                  <div className="font-mono shrink-0 text-right">
                    <span className="text-[#059669] font-bold">+10</span>{' '}
                    <span className="text-slate-400 font-medium">(max 20)</span>
                  </div>
                </div>

                {/* Game Rule */}
                <div className="py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-600">Complete Game level (5 × +10)</span>
                  <div className="font-mono shrink-0 text-right">
                    <span className="text-[#059669] font-bold">+10</span>{' '}
                    <span className="text-slate-400 font-medium">(max 50)</span>
                  </div>
                </div>

                {/* Quiz Correct Rule */}
                <div className="py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-600">Quiz question correct</span>
                  <span className="font-mono text-[#059669] font-bold shrink-0">+3</span>
                </div>

                {/* Quiz Incorrect Rule */}
                <div className="py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-600">Quiz question incorrect</span>
                  <span className="font-mono text-[#DC2626] font-bold shrink-0">−2</span>
                </div>

                {/* Quiz Timeout Rule */}
                <div className="py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-600">Quiz timeout or unanswered</span>
                  <span className="font-mono text-slate-500 font-bold shrink-0">0</span>
                </div>

                {/* Quiz Cap Rule */}
                <div className="py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-600">Quiz Category Cap</span>
                  <span className="font-mono text-[#0F172A] font-bold shrink-0">Max 30</span>
                </div>

                {/* Hint Penalty Rule */}
                <div className="py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-600">Use Hint (per actual use)</span>
                  <span className="font-mono text-[#DC2626] font-bold shrink-0">−2</span>
                </div>

                {/* Guided Solve Penalty Rule */}
                <div className="py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-600">Use Guided Solve (per actual use)</span>
                  <span className="font-mono text-[#DC2626] font-bold shrink-0">−4</span>
                </div>

                {/* Theory Rule */}
                <div className="py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-600">Learn / Theory modules</span>
                  <span className="font-mono text-slate-400 font-bold shrink-0">0 pts</span>
                </div>

                {/* Total Score Scale */}
                <div className="py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-600">Total Max Positive</span>
                  <span className="font-mono text-[#0F172A] font-bold shrink-0">100 Points</span>
                </div>
              </div>
            </div>

            {/* Bottom Explanatory Note */}
            <p className="text-[11px] text-slate-400 leading-relaxed pt-4 border-t border-slate-100 mt-3">
              Completion rewards are awarded once per unique module or level. Hints and Guided Solves deduct points for every actual use, including repeated uses in the same level. The total reflects all earned points and deductions.
            </p>
          </div>
        </div>

        {/* 3. Recent Activity Section (Screenshot 3) */}
        <div
          id="points-recent-activity-card"
          className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A]">Recent Activity</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {activities.length} {activities.length === 1 ? 'event' : 'events'}
            </span>
          </div>

          {/* Activity Rows List */}
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((item) => {
                const isPositive = item.points >= 0;
                return (
                  <div
                    key={item.id}
                    className="bg-[#F8FAFC] border border-slate-200/70 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Transaction Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono shrink-0 border ${
                          isPositive
                            ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]'
                            : 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
                        }`}
                      >
                        {isPositive ? `+${item.points}` : item.points}
                      </span>

                      {/* Event Details */}
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#0F172A] truncate">
                          {item.title}
                        </h4>
                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">
                          {item.typeLabel}
                        </p>
                      </div>
                    </div>

                    {/* Relative Timestamp */}
                    <span className="text-xs font-mono text-slate-400 shrink-0">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-xs font-mono text-slate-400">
              No recent points activity recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
