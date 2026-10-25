import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Play,
  Code2,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { SLLTaskDef, SolveStep } from '../../types/sllGame';
import { soundManager } from '../../utils/audio';

interface SLLSolveWalkthroughProps {
  task: SLLTaskDef;
  onExitSolve: () => void;
  onTryItYourself: () => void;
}

export const SLLSolveWalkthrough: React.FC<SLLSolveWalkthroughProps> = ({
  task,
  onExitSolve,
  onTryItYourself,
}) => {
  const steps: SolveStep[] = task.solveSteps || [
    {
      stepNumber: 1,
      title: 'Analyze Initial State',
      description: 'Check existing HEAD and TAIL pointers before modifying any memory addresses.',
      simulatedNodes: task.initialNodes,
      simulatedPointers: task.initialPointers,
    },
    {
      stepNumber: 2,
      title: 'Perform Pointer Redirection',
      description: 'Wire the NEXT pointer to ensure no nodes are lost in memory.',
      simulatedNodes: task.initialNodes,
      simulatedPointers: task.initialPointers,
    },
  ];

  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const activeStep = steps[currentStepIdx] || steps[0];
  const isLastStep = currentStepIdx === steps.length - 1;

  const handleNext = () => {
    if (currentStepIdx < steps.length - 1) {
      soundManager.play('step');
      setCurrentStepIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      soundManager.play('step');
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  return (
    <div className="w-full bg-amber-500/10 dark:bg-amber-950/20 border-2 border-amber-400 dark:border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden font-sans">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-amber-300 dark:border-amber-500/30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/30">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Educational Solution Demonstration
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-mono font-bold">
                Step {currentStepIdx + 1} of {steps.length}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {activeStep.title}
            </h3>
          </div>
        </div>

        <button
          onClick={onExitSolve}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#0B1228] border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-50 transition-colors cursor-pointer"
        >
          Exit Solve Mode
        </button>
      </div>

      {/* Main Walkthrough Visual Stage */}
      <div className="my-5 p-4 rounded-2xl bg-white dark:bg-[#070B19] border border-slate-200 dark:border-blue-900/25 min-h-[160px] flex flex-col items-center justify-center">
        {/* Pointer indicators at this step */}
        <div className="flex items-center gap-2 text-xs font-mono mb-3">
          <div className="px-2.5 py-1 rounded-lg bg-[#EFF6FF] dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/40 text-[#2563EB] dark:text-blue-300 font-bold">
            HEAD: {activeStep.simulatedPointers.headAddress !== null ? activeStep.simulatedPointers.headAddress : 'NULL'}
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 text-amber-700 dark:text-amber-300 font-bold">
            TAIL: {activeStep.simulatedPointers.tailAddress !== null ? activeStep.simulatedPointers.tailAddress : 'NULL'}
          </div>
        </div>

        {/* Chain of Nodes */}
        <div className="flex items-center justify-center flex-wrap gap-2 py-2">
          {activeStep.simulatedNodes.length === 0 ? (
            <div className="text-xs font-mono text-slate-400 dark:text-slate-500 italic">
              List is empty (HEAD == NULL, TAIL == NULL)
            </div>
          ) : (
            activeStep.simulatedNodes.map((node) => {
              const isHighlighted = activeStep.highlightAddresses?.includes(node.address);
              return (
                <div key={node.address} className="flex items-center">
                  <motion.div
                    animate={{ scale: isHighlighted ? 1.06 : 1 }}
                    className={`flex flex-col rounded-xl border-2 overflow-hidden shadow-xs ${
                      isHighlighted
                        ? 'border-amber-500 ring-4 ring-amber-500/20 bg-amber-50/60 dark:bg-amber-950/40'
                        : 'border-slate-300 dark:border-blue-900/30 bg-white dark:bg-[#0E1736]'
                    }`}
                    style={{ minWidth: '100px' }}
                  >
                    <div className="bg-slate-100 dark:bg-[#152148] px-2 py-0.5 text-[9px] font-mono flex justify-between border-b border-slate-200 dark:border-blue-900/30">
                      <span className="text-slate-500">ADDR</span>
                      <span className="font-bold text-[#2563EB] dark:text-blue-300">{node.address}</span>
                    </div>
                    <div className="flex items-stretch text-center">
                      <div className="flex-1 py-1 px-1 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-blue-900/30 text-xs">
                        {node.data}
                      </div>
                      <div className="flex-1 py-1 px-1 font-mono text-[9px] font-bold text-[#2563EB] dark:text-blue-300">
                        {node.nextAddress !== null ? node.nextAddress : 'NULL'}
                      </div>
                    </div>
                  </motion.div>
                  <div className="px-1 text-[#2563EB] dark:text-blue-400 flex items-center">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })
          )}
          {activeStep.simulatedNodes.length > 0 && (
            <div className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950 border border-rose-200 text-rose-600 text-[9px] font-mono font-bold">
              NULL
            </div>
          )}
        </div>
      </div>

      {/* Step Explanation Text */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0B1228] border border-amber-200 dark:border-amber-500/30 mb-4">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
          Step Explanation:
        </span>
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
          {activeStep.description}
        </p>

        {activeStep.cCode && (
          <div className="mt-2.5 p-2 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] border border-slate-800">
            <code>{activeStep.cCode}</code>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={handlePrev}
          disabled={currentStepIdx === 0}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white dark:bg-[#0B1228] border border-slate-200 dark:border-blue-900/30 text-slate-700 dark:text-slate-300 disabled:opacity-30 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Previous Step</span>
        </button>

        {isLastStep ? (
          <button
            onClick={() => {
              soundManager.play('click');
              onTryItYourself();
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Now Try This Yourself!</span>
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/30 transition-all cursor-pointer"
          >
            <span>Next Step</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
