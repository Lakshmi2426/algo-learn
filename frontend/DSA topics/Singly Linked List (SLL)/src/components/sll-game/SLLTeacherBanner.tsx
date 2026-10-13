import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lightbulb,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Play,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { SLLTeacherStep } from '../../types/sllGame';

interface SLLTeacherBannerProps {
  step: SLLTeacherStep | null;
  lastActionResult: string | null;
  isTaskComplete: boolean;
  completedSteps?: number[];
  onExecuteStep: () => void;
  onSwitchToPlay?: () => void;
  onNextTask: () => void;
  hasNextTask: boolean;
}

export const SLLTeacherBanner: React.FC<SLLTeacherBannerProps> = ({
  step,
  lastActionResult,
  isTaskComplete,
  completedSteps = [],
  onExecuteStep,
  onSwitchToPlay,
  onNextTask,
  hasNextTask,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-3xl p-4 sm:p-5 bg-[#FFF3E0] dark:bg-[#1E150B] border-2 border-[#FDBA5A] dark:border-[#FDBA5A]/50 shadow-xs relative overflow-hidden font-sans mb-3"
    >
      {/* Decorative subtle background icon */}
      <Lightbulb className="absolute -right-4 -bottom-4 w-28 h-28 text-[#F59E0B]/10 dark:text-[#F59E0B]/10 pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-[#FDBA5A]/40 dark:border-[#FDBA5A]/25 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-white dark:bg-[#2A1D0D] border border-[#FDBA5A] flex items-center justify-center font-bold shadow-xs">
            <Lightbulb className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7C3F00] dark:text-[#FDBA5A]">
              TEACHING ASSISTANT
            </span>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {isTaskComplete
                  ? 'Task Finished!'
                  : step
                  ? `Step ${step.stepNumber} of ${step.totalSteps}: ${step.title}`
                  : 'All Steps Complete!'}
              </h4>
              {step && typeof step.totalSteps === 'number' && step.totalSteps > 1 && (
                <div className="flex items-center gap-1 ml-1.5">
                  {Array.from({ length: Math.max(0, Math.floor(step.totalSteps)) }).map((_, idx) => {
                    const stepNum = idx + 1;
                    const isDone = completedSteps.includes(stepNum);
                    const isCurr = step.stepNumber === stepNum && !isTaskComplete;
                    return (
                      <span
                        key={stepNum}
                        className={`h-1.5 rounded-full transition-all ${
                          isDone
                            ? 'w-3.5 bg-emerald-500'
                            : isCurr
                            ? 'w-5 bg-[#F59E0B] animate-pulse'
                            : 'w-2 bg-[#FDBA5A]/60 dark:bg-amber-900/60'
                        }`}
                        title={`Step ${stepNum}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isTaskComplete ? (
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Excellent! You built the linked list correctly.</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            All pointer linkages, memory addresses, and data criteria match the target specification.
          </p>
          <div className="pt-1">
            <button
              type="button"
              id="teacher-next-task-btn"
              onClick={onNextTask}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
            >
              <span>{hasNextTask ? 'Continue to Next Task' : 'Complete Level!'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : step ? (
        <div className="space-y-3 relative z-10">
          {/* WHAT WE ARE DOING */}
          <div className="flex items-start gap-2">
            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#2A1D0D] border border-[#FDBA5A] text-[#7C3F00] dark:text-[#FDBA5A] font-mono text-[10px] font-bold shrink-0 mt-0.5">
              WHAT
            </span>
            <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-snug">
              {step.what}
            </p>
          </div>

          {/* WHY WE ARE DOING IT */}
          <div className="flex items-start gap-2">
            <span className="px-2 py-0.5 rounded-md bg-white/90 dark:bg-[#2A1D0D] border border-[#FDBA5A]/70 text-[#7C3F00] dark:text-[#FDBA5A] font-mono text-[10px] font-bold shrink-0 mt-0.5">
              WHY
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {step.why}
            </p>
          </div>

          {/* POINTERS UPDATED */}
          {step.pointersUpdated && (
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded-md bg-white/90 dark:bg-[#2A1D0D] border border-blue-400 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold shrink-0 mt-0.5">
                POINTERS
              </span>
              <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed font-semibold">
                {step.pointersUpdated}
              </p>
            </div>
          )}

          {/* Last Step Result (if any) */}
          {lastActionResult && (
            <div
              className="p-2.5 rounded-xl bg-emerald-100/90 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200 text-xs font-medium flex items-center gap-2 transition-all duration-150"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{lastActionResult}</span>
            </div>
          )}

          {/* Action Trigger Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="guide-solve-perform-step-btn"
                onClick={onExecuteStep}
                className="py-2.5 px-4 rounded-2xl bg-[#FFF3E0] hover:bg-[#FFE7C4] dark:bg-[#2A1D0D] dark:hover:bg-[#382611] border-2 border-[#FDBA5A] text-[#7C3F00] dark:text-[#FDBA5A] font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
              >
                <Zap className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                <span>Next Step</span>
              </button>

              {onSwitchToPlay && (
                <button
                  type="button"
                  id="guide-solve-exit-btn"
                  onClick={onSwitchToPlay}
                  className="py-2.5 px-3.5 rounded-2xl bg-white dark:bg-[#2A1D0D] border border-amber-300 dark:border-amber-700/60 text-slate-700 dark:text-amber-200 font-semibold text-xs hover:bg-amber-50 dark:hover:bg-[#382611] flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>Exit Guided Solve</span>
                </button>
              )}
            </div>

            <span className="text-[11px] text-[#7C3F00]/90 dark:text-[#FDBA5A]/90 font-medium">
              One click = One step. Never auto-finishes entire level.
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Current operations look complete! Click Check Answer to verify.</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
