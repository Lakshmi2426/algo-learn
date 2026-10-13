import React from 'react';
import { ArrowRight, Square, Sparkles, Check, HelpCircle } from 'lucide-react';
import { GuidedStepInfo } from '../utils/guidedSolveEngine';

interface GuidedSolvePanelProps {
  stepInfo: GuidedStepInfo;
  onNextStep: () => void;
  onStop: () => void;
  isExecuting?: boolean;
}

export const GuidedSolvePanel: React.FC<GuidedSolvePanelProps> = ({
  stepInfo,
  onNextStep,
  onStop,
  isExecuting = false,
}) => {
  return (
    <div
      id="guided-solve-panel"
      className="max-w-2xl mx-auto w-full bg-white dark:bg-[#111827] border-2 border-[#2563EB]/40 dark:border-[#2563EB]/50 rounded-2xl p-4 sm:p-5 font-sans text-slate-900 dark:text-white shadow-xs dark:shadow-none transition-all duration-200 animate-fadeIn select-none"
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#2563EB] dark:bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Guided Solve
              </h3>
              <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-500/30 text-[#2563EB] dark:text-[#3B82F6]">
                Interactive Teacher
              </span>
              <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300">
                −4 pts
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Step Counter Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#172033] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            Step {stepInfo.currentStep} of {stepInfo.totalSteps}
          </span>
        </div>
      </div>

      {/* Educational Explanation Content */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold font-mono uppercase tracking-wider text-[#2563EB] dark:text-[#3B82F6] mb-1">
            <span>{stepInfo.title}</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {stepInfo.explanation}
          </p>
        </div>

        {/* Formula / Calculation Highlight Box */}
        {stepInfo.formulaStr && (
          <div className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200/80 dark:border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs font-mono">
            <span className="text-slate-500 dark:text-slate-400 font-semibold truncate">
              Formula / Rationale:
            </span>
            <span className="font-bold text-[#2563EB] dark:text-[#3B82F6] truncate">
              {stepInfo.formulaStr}
            </span>
          </div>
        )}

        {/* Action Controls: [ Stop ] and [ Next Step ] */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {/* Stop Button */}
          <button
            id="btn-guided-solve-stop"
            type="button"
            onClick={onStop}
            className="btn-modern-secondary px-3.5 sm:px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Exit Guided Solve and continue manually"
          >
            <Square className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 fill-current" />
            <span>Stop</span>
          </button>

          {/* Next Step Primary Button */}
          {!stepInfo.isComplete ? (
            <button
              id="btn-guided-solve-next-step"
              type="button"
              disabled={isExecuting}
              onClick={onNextStep}
              className={`btn-modern-primary px-4 sm:px-5 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
                isExecuting ? 'opacity-60 pointer-events-none' : ''
              }`}
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5 text-white stroke-[2.5]" />
            </button>
          ) : (
            <button
              id="btn-guided-solve-finish"
              type="button"
              onClick={onStop}
              className="btn-modern-primary px-4 sm:px-5 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              <span>Finished</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
