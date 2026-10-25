import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lightbulb,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
  Square,
  Pause,
  Database,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SLLTeacherStep, SLLNode, SLLPointerState } from '../../types/sllGame';

interface SLLTeacherBannerProps {
  step: SLLTeacherStep | null;
  lastActionResult: string | null;
  isTaskComplete: boolean;
  completedSteps?: number[];
  isGuidedSolveActive?: boolean;
  isExecuting?: boolean;
  onExecuteStep?: () => void;
  onStartGuidedSolve?: () => void;
  onExecuteNextStep?: () => void;
  onStopGuidedSolve?: () => void;
  onSwitchToPlay?: () => void;
  onNextTask: () => void;
  hasNextTask: boolean;
  nodes?: SLLNode[];
  pointers?: SLLPointerState;
}

export const SLLTeacherBanner: React.FC<SLLTeacherBannerProps> = ({
  step,
  lastActionResult,
  isTaskComplete,
  completedSteps = [],
  isGuidedSolveActive = false,
  isExecuting = false,
  onExecuteStep,
  onStartGuidedSolve,
  onExecuteNextStep,
  onStopGuidedSolve,
  onNextTask,
  hasNextTask,
  nodes = [],
  pointers = { headAddress: null, tailAddress: null, currentAddress: null, tempAddress: null, prevAddress: null },
}) => {
  const [showMatrix, setShowMatrix] = useState<boolean>(false);

  const handleStart = onStartGuidedSolve || onExecuteStep || (() => {});
  const handleNext = onExecuteNextStep || onExecuteStep || (() => {});
  const handleStop = onStopGuidedSolve || (() => {});

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
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7C3F00] dark:text-[#FDBA5A]">
                TEACHING ASSISTANT
              </span>
              {isGuidedSolveActive && !isTaskComplete && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-[9px] font-bold font-mono animate-pulse">
                  GUIDED MODE ACTIVE
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
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

        {/* Toggle RAM Matrix button */}
        {nodes.length > 0 && !isTaskComplete && (
          <button
            type="button"
            onClick={() => setShowMatrix((prev) => !prev)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/80 hover:bg-white dark:bg-[#2A1D0D] dark:hover:bg-[#382611] border border-[#FDBA5A]/70 text-[#7C3F00] dark:text-[#FDBA5A] text-[11px] font-bold cursor-pointer transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{showMatrix ? 'Hide RAM Matrix' : 'Show RAM Matrix'}</span>
            {showMatrix ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
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
          {/* Linked List Visual Chain Diagram */}
          <div className="p-2.5 rounded-2xl bg-white/70 dark:bg-[#160E05]/60 border border-[#FDBA5A]/50">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-[#F59E0B]" />
                Linked List State & Pointer Flow:
              </span>
              {step.targetAddress !== undefined && step.targetAddress !== null && (
                <span className="text-[10px] font-mono font-semibold text-amber-700 dark:text-amber-300">
                  Target Address: {step.targetAddress}
                </span>
              )}
            </div>

            {/* Visual Node Flow */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin">
              <div className="flex items-center gap-1 shrink-0">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300">
                  HEAD: {pointers?.headAddress ?? 'NULL'}
                </span>
                <span className="text-slate-400 font-mono text-xs">──►</span>
              </div>

              {nodes.length === 0 ? (
                <div className="flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-slate-400 py-1">
                  <span className="italic">(Empty List)</span>
                </div>
              ) : (
                nodes.map((node) => {
                  const isTarget = step.targetAddress === node.address || step.highlightAddresses?.includes(node.address);
                  const isHead = pointers?.headAddress === node.address;
                  const isTail = pointers?.tailAddress === node.address;
                  const isCurrent = pointers?.currentAddress === node.address;

                  return (
                    <React.Fragment key={node.address}>
                      <div
                        className={`shrink-0 rounded-xl px-2.5 py-1.5 border font-mono text-xs transition-all ${
                          isTarget
                            ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-500 shadow-xs ring-2 ring-amber-400/50'
                            : 'bg-white dark:bg-[#2A1D0D] border-slate-300 dark:border-amber-900/40 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white">[{node.data}]</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">@{node.address}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-amber-900/30 mt-1 pt-0.5">
                          <span>NEXT:</span>
                          <span className={node.nextAddress ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 italic'}>
                            {node.nextAddress ?? 'NULL'}
                          </span>
                        </div>
                        {(isHead || isTail || isCurrent || isTarget) && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {isHead && <span className="px-1 rounded bg-blue-500 text-white text-[9px] font-bold">HEAD</span>}
                            {isTail && <span className="px-1 rounded bg-emerald-500 text-white text-[9px] font-bold">TAIL</span>}
                            {isCurrent && <span className="px-1 rounded bg-purple-500 text-white text-[9px] font-bold">CURRENT</span>}
                            {isTarget && !isHead && !isTail && !isCurrent && (
                              <span className="px-1 rounded bg-amber-500 text-white text-[9px] font-bold">TARGET</span>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-slate-400 font-mono text-xs shrink-0">──►</span>
                    </React.Fragment>
                  );
                })
              )}
              <span className="shrink-0 font-mono text-xs text-slate-500 dark:text-slate-400 font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                NULL
              </span>
            </div>
          </div>

          {/* Collapsible RAM State Matrix */}
          <AnimatePresence>
            {showMatrix && nodes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-xl border border-slate-200 dark:border-amber-900/40 bg-white/80 dark:bg-[#160E05]/80 p-2 font-mono text-[11px]"
              >
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-amber-900/40 text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-1 px-2 font-bold">Address</th>
                      <th className="py-1 px-2 font-bold">Data</th>
                      <th className="py-1 px-2 font-bold">Next Ptr</th>
                      <th className="py-1 px-2 font-bold">Pointers / Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-amber-900/20">
                    {nodes.map((node) => {
                      const isHead = pointers?.headAddress === node.address;
                      const isTail = pointers?.tailAddress === node.address;
                      const isCurrent = pointers?.currentAddress === node.address;
                      const isTarget = step.targetAddress === node.address || step.highlightAddresses?.includes(node.address);

                      return (
                        <tr
                          key={node.address}
                          className={isTarget ? 'bg-amber-100/60 dark:bg-amber-900/30 font-semibold' : ''}
                        >
                          <td className="py-1 px-2 text-slate-800 dark:text-slate-200">
                            {node.address}
                            {isTarget && <span className="ml-1 text-amber-600 dark:text-amber-400 font-bold">★</span>}
                          </td>
                          <td className="py-1 px-2 text-slate-900 dark:text-white font-bold">{node.data}</td>
                          <td className="py-1 px-2 text-blue-600 dark:text-blue-400">
                            {node.nextAddress !== null ? node.nextAddress : 'NULL'}
                          </td>
                          <td className="py-1 px-2">
                            <div className="flex items-center gap-1 flex-wrap">
                              {isHead && <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 text-[9px] font-bold">HEAD</span>}
                              {isTail && <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 text-[9px] font-bold">TAIL</span>}
                              {isCurrent && <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 text-[9px] font-bold">CURRENT</span>}
                              {isTarget && !isHead && !isTail && !isCurrent && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 text-[9px] font-bold">TARGET</span>
                              )}
                              {!isHead && !isTail && !isCurrent && !isTarget && (
                                <span className="text-slate-400 text-[10px]">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 2-3 Bullet Points Explanations */}
          <div className="space-y-2">
            {/* 1. WHAT */}
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#2A1D0D] border border-[#FDBA5A] text-[#7C3F00] dark:text-[#FDBA5A] font-mono text-[10px] font-bold shrink-0 mt-0.5">
                WHAT
              </span>
              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                {step.what}
              </p>
            </div>

            {/* 2. WHY */}
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded-md bg-white/90 dark:bg-[#2A1D0D] border border-[#FDBA5A]/70 text-[#7C3F00] dark:text-[#FDBA5A] font-mono text-[10px] font-bold shrink-0 mt-0.5">
                WHY
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {step.why}
              </p>
            </div>

            {/* 3. CHANGES / POINTERS */}
            {step.pointersUpdated && (
              <div className="flex items-start gap-2">
                <span className="px-2 py-0.5 rounded-md bg-white/90 dark:bg-[#2A1D0D] border border-blue-400 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold shrink-0 mt-0.5">
                  CHANGES
                </span>
                <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed font-semibold">
                  {step.pointersUpdated}
                </p>
              </div>
            )}
          </div>

          {/* Last Step Result Feedback (if any) */}
          {lastActionResult && (
            <div className="p-2.5 rounded-xl bg-emerald-100/90 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200 text-xs font-medium flex items-center gap-2 transition-all duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{lastActionResult}</span>
            </div>
          )}

          {/* Action Trigger Row with Next Step & Stop Guided Solve */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#FDBA5A]/30">
            <div className="flex items-center gap-2 flex-wrap">
              {isGuidedSolveActive ? (
                <>
                  {/* NEXT STEP BUTTON */}
                  <button
                    type="button"
                    id="guide-solve-next-step-btn"
                    onClick={handleNext}
                    disabled={isExecuting || isTaskComplete}
                    className={`py-2 px-4 rounded-xl font-bold text-xs shadow-xs flex items-center gap-2 transition-transform ${
                      isExecuting || isTaskComplete
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                        : 'bg-[#F59E0B] hover:bg-[#D97706] text-white cursor-pointer hover:scale-105 active:scale-95 shadow-md shadow-amber-500/20'
                    }`}
                  >
                    <Zap className="w-4 h-4 fill-white text-white" />
                    <span>{isExecuting ? 'Executing...' : 'Next Step'}</span>
                  </button>

                  {/* STOP GUIDED SOLVE BUTTON */}
                  <button
                    type="button"
                    id="guide-solve-stop-btn"
                    onClick={handleStop}
                    className="py-2 px-3.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-[#2A1D0D] dark:hover:bg-[#382611] border border-slate-300 dark:border-amber-900/40 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  >
                    <Square className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    <span>Stop Guided Solve</span>
                  </button>
                </>
              ) : (
                /* START GUIDED SOLVE BUTTON */
                <button
                  type="button"
                  id="guide-solve-start-btn"
                  onClick={handleStart}
                  className="py-2.5 px-4 rounded-2xl bg-[#FFF3E0] hover:bg-[#FFE7C4] dark:bg-[#2A1D0D] dark:hover:bg-[#382611] border-2 border-[#FDBA5A] text-[#7C3F00] dark:text-[#FDBA5A] font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                >
                  <Zap className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                  <span>GUIDED SOLVE</span>
                  <span className="text-[10px] opacity-75 font-normal">(-3 pts once)</span>
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
