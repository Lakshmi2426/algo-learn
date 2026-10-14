import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, XCircle, Lightbulb, Sparkles, Activity, AlertTriangle, Zap } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { pointsManager } from '../utils/pointsManager';
import { GuidedSolvePanel } from './GuidedSolvePanel';

interface Level3Round {
  array: number[];
  target: number;
  breakIndex: number;
  savedComparisons: number;
}

interface Level3GameplayProps {
  onLevelComplete: (levelId: number, score: number) => void;
  onScoreUpdate: (delta: number) => void;
  onStreakUpdate: (streak: number) => void;
}

export const Level3Gameplay: React.FC<Level3GameplayProps> = ({
  onLevelComplete,
  onScoreUpdate,
  onStreakUpdate,
}) => {
  const rounds: Level3Round[] = [
    {
      array: [14, 25, 38, 52, 69],
      target: 30,
      breakIndex: 2, // 38 > 30
      savedComparisons: 2, // skips index 3 and 4
    },
    {
      array: [7, 15, 23, 41, 56, 78, 90],
      target: 25,
      breakIndex: 3, // 41 > 25
      savedComparisons: 3, // skips index 4, 5, 6
    },
  ];

  const [roundIndex, setRoundIndex] = useState<number>(0);
  const [pointer, setPointer] = useState<number>(0);
  const [comparisons, setComparisons] = useState<number>(0);
  const [status, setStatus] = useState<'searching' | 'decision_needed' | 'round_completed'>('searching');
  const [feedback, setFeedback] = useState<string>(
    'The array is sorted ascending. Compare elements sequentially to test early-exit condition.'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGuidedSolveActive, setIsGuidedSolveActive] = useState<boolean>(false);
  const [currentHint, setCurrentHint] = useState<string | null>(null);

  const currentRound = rounds[roundIndex];
  const isDecisionPhase = status === 'decision_needed';
  const isRoundDone = status === 'round_completed';
  const isAllRoundsComplete = roundIndex >= rounds.length - 1 && isRoundDone;

  const isLevelDone = pointsManager.isLevelCompleted(3);
  const isHintUsed = pointsManager.isHintAlreadyDeducted(3);
  const isGuidedUsed = pointsManager.isGuidedSolveAlreadyDeducted(3);

  const handleUseHint = () => {
    soundManager.playClick();
    pointsManager.recordHintUsed(3, `Level 3: Early-Exit Linear Search (Round ${roundIndex + 1})`);
    setCurrentHint(
      `Sorted Array Optimization: The array is sorted ascending. If arr[i] > target (at index [${currentRound.breakIndex}], arr[${currentRound.breakIndex}] = ${currentRound.array[currentRound.breakIndex]} > ${currentRound.target}), no subsequent element can equal ${currentRound.target}. You should trigger "if (arr[i] > target) break;" to terminate immediately and save ${currentRound.savedComparisons} comparisons!`
    );
  };

  const handleCheck = (clickedIndex?: number) => {
    if (status !== 'searching') return;

    if (clickedIndex !== undefined && clickedIndex !== pointer) {
      soundManager.playError();
      setErrorMessage(`Check elements sequentially starting at index [${pointer}].`);
      setTimeout(() => setErrorMessage(null), 2500);
      return;
    }

    const currentVal = currentRound.array[pointer];
    const nextComparisons = comparisons + 1;
    setComparisons(nextComparisons);

    if (pointer === currentRound.breakIndex) {
      soundManager.playCalcSuccess();
      setStatus('decision_needed');
      setFeedback(
        `arr[${pointer}] (${currentVal}) > target (${currentRound.target})! How should Linear Search handle this in a sorted array?`
      );
    } else {
      soundManager.playClick();
      const nextPtr = pointer + 1;
      setPointer(nextPtr);
      setFeedback(`arr[${pointer}] (${currentVal}) < ${currentRound.target}. Advancing to index [${nextPtr}]...`);
    }
  };

  const handleDecision = (earlyBreak: boolean) => {
    if (earlyBreak) {
      soundManager.playCalcSuccess();
      setStatus('round_completed');
      setFeedback(
        `✓ Optimal Early Exit! Since arr[${currentRound.breakIndex}] = ${currentRound.array[currentRound.breakIndex]} > ${currentRound.target}, remaining elements are guaranteed greater. Saved ${currentRound.savedComparisons} comparisons!`
      );
      onScoreUpdate(50);
      onStreakUpdate(roundIndex + 1);
    } else {
      soundManager.playError();
      setErrorMessage(
        `Suboptimal! In a sorted array, arr[i] > target guarantees the target cannot exist ahead. Continuing wastes comparisons!`
      );
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleNextRound = () => {
    if (roundIndex < rounds.length - 1) {
      soundManager.playSelect();
      const nextIdx = roundIndex + 1;
      setRoundIndex(nextIdx);
      setPointer(0);
      setComparisons(0);
      setStatus('searching');
      setErrorMessage(null);
      setCurrentHint(null);
      setFeedback(`Round ${nextIdx + 1}: Sorted array with target ${rounds[nextIdx].target}. Find the early-exit point!`);
    } else {
      soundManager.playLevelVictory();
      onLevelComplete(3, 100);
    }
  };

  const getGuidedSolveExplanation = () => {
    if (status === 'round_completed') {
      if (roundIndex < rounds.length - 1) {
        return `Round ${roundIndex + 1} completed with ${currentRound.savedComparisons} comparisons saved! Click Next Step to proceed to Round ${roundIndex + 2}.`;
      }
      return `All sorted array rounds completed! Stopping as soon as arr[i] > target saved maximum comparisons.`;
    }
    if (status === 'decision_needed') {
      return `At index [${pointer}], arr[${pointer}] = ${currentRound.array[pointer]} which is GREATER than target ${currentRound.target}. Because the array is sorted, every subsequent number is even larger. Select "Early Exit: Target Absent" to save ${currentRound.savedComparisons} comparisons!`;
    }
    const val = currentRound.array[pointer];
    return `Index [${pointer}] contains ${val}. Since ${val} < ${currentRound.target}, target could still exist ahead. Click "Compare [${pointer}] with ${currentRound.target}" to advance.`;
  };

  const handleGuidedNextStep = () => {
    if (status === 'searching') {
      handleCheck();
    } else if (status === 'decision_needed') {
      handleDecision(true);
    } else {
      handleNextRound();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-page-enter">
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-5 sm:p-6 shadow-xs">
        {/* Header HUD */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-blue-500/15">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-[#EFF6FF] dark:bg-blue-950/60 border border-[#DBEAFE] dark:border-blue-500/30 text-[#2563EB] dark:text-[#3B82F6] rounded-lg text-xs font-bold font-mono">
              ROUND {roundIndex + 1} OF {rounds.length}
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
              Target:{' '}
              <span className="font-mono text-[#2563EB] dark:text-[#3B82F6] text-lg font-extrabold px-2 py-0.5 bg-[#EFF6FF] dark:bg-blue-900/40 rounded-md border border-[#DBEAFE] dark:border-blue-500/30">
                {currentRound.target}
              </span>
            </span>
            <span className="hidden sm:inline-flex px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded text-xs font-semibold">
              Sorted Ascending
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400">COMPARISONS:</span>
              <span className="px-3 py-1 bg-[#2563EB] text-white rounded-lg font-bold text-sm shadow-xs animate-scale">
                {comparisons}
              </span>
            </div>

            {isRoundDone && (
              <div className="flex items-center gap-1 text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Saved {currentRound.savedComparisons}</span>
              </div>
            )}

            {!isAllRoundsComplete && (
              <button
                id="btn-lvl3-hint"
                type="button"
                onClick={handleUseHint}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-95"
                title="Get a hint"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Hint</span>
                {isLevelDone ? (
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">Free</span>
                ) : (
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">−2 pts</span>
                )}
              </button>
            )}

            {!isGuidedSolveActive && !isAllRoundsComplete && (
              <button
                id="btn-lvl3-start-guided-solve"
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  pointsManager.recordGuidedSolveUsed(3, 'Level 3');
                  setIsGuidedSolveActive(true);
                }}
                className="btn-modern-secondary px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs select-none guided-solve-btn"
                title="Start Guided Solve step-by-step walkthrough"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
                <span>Guided Solve</span>
                {isLevelDone ? (
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">Free</span>
                ) : (
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-500/30">−4 pts</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Hint Banner (ONLY appears when user clicks Hint button) */}
        {currentHint && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 rounded-xl text-xs font-medium text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
              <span><strong>Hint:</strong> {currentHint}</span>
            </div>
            <button
              onClick={() => setCurrentHint(null)}
              className="text-amber-700 hover:text-amber-950 dark:text-amber-400 font-bold text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs font-medium text-rose-800 dark:text-rose-200 flex items-center gap-2 animate-shake">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Guided Solve Step-by-Step Panel */}
        {isGuidedSolveActive && (
          <div className="pt-4">
            <GuidedSolvePanel
              stepNumber={
                status === 'round_completed'
                  ? currentRound.breakIndex + 3
                  : status === 'decision_needed'
                  ? currentRound.breakIndex + 2
                  : pointer + 1
              }
              totalSteps={currentRound.breakIndex + 3}
              explanation={getGuidedSolveExplanation()}
              isComplete={isAllRoundsComplete}
              nextButtonLabel={
                status === 'searching'
                  ? `Compare [${pointer}] with ${currentRound.target}`
                  : status === 'decision_needed'
                  ? `Trigger Early Exit (Break)`
                  : roundIndex < rounds.length - 1
                  ? `Proceed to Round ${roundIndex + 2}`
                  : 'Complete Level 3'
              }
              onNextStep={handleGuidedNextStep}
              onStop={() => setIsGuidedSolveActive(false)}
            />
          </div>
        )}

        {/* Interactive Sorted Array Display */}
        <div className="pt-6 pb-2">
          <div className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center justify-between">
            <span>Ascending Sorted Array ({currentRound.array.length} items)</span>
            <span className="text-[#2563EB] dark:text-[#3B82F6]">Pointer: Index [{pointer}]</span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 sm:gap-3">
            {currentRound.array.map((val, idx) => {
              const isChecked = idx < pointer || (idx === pointer && (isDecisionPhase || isRoundDone));
              const isCurrent = idx === pointer && !isDecisionPhase && !isRoundDone;
              const isBreakPoint = idx === currentRound.breakIndex && (isDecisionPhase || isRoundDone);
              const isSkipped = isRoundDone && idx > currentRound.breakIndex;

              return (
                <button
                  key={idx}
                  id={`lvl3-array-cell-${idx}`}
                  onClick={() => handleCheck(idx)}
                  disabled={isDecisionPhase || isRoundDone || idx < pointer}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 select-none ${
                    isBreakPoint
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-900 dark:text-amber-200 shadow-md scale-105 ring-4 ring-amber-500/20'
                      : isSkipped
                      ? 'bg-slate-100/50 dark:bg-slate-900/30 border-dashed border-slate-300 dark:border-slate-800 text-slate-400 dark:text-slate-600 opacity-50 cursor-not-allowed'
                      : isChecked
                      ? 'bg-slate-50 dark:bg-[#0F172A] border-slate-300 dark:border-blue-500/20 text-slate-500 dark:text-slate-400 opacity-80'
                      : isCurrent
                      ? 'bg-[#EFF6FF]/70 dark:bg-blue-950/40 border-[#2563EB] dark:border-[#3B82F6] text-[#2563EB] dark:text-white shadow-md scale-105 ring-4 ring-blue-500/20 cursor-pointer'
                      : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-blue-500/20 text-slate-700 dark:text-slate-300 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 mb-1">
                    [{idx}]
                  </span>
                  <span className="text-lg sm:text-xl font-bold font-mono">{val}</span>
                  <div className="mt-1.5 text-[9px] font-mono font-bold">
                    {isBreakPoint ? (
                      <span className="text-amber-600 dark:text-amber-400 font-extrabold">{val} &gt; {currentRound.target}!</span>
                    ) : isSkipped ? (
                      <span className="text-emerald-600 dark:text-emerald-500">SAVED</span>
                    ) : isChecked ? (
                      <span className="text-slate-400">{val} &lt; {currentRound.target}</span>
                    ) : isCurrent ? (
                      <span className="text-[#2563EB] dark:text-[#3B82F6] animate-pulse">CHECK</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600">WAIT</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Algorithmic Decision Section: Early Break vs Continue Scanning */}
        {isDecisionPhase && (
          <div className="mt-6 p-4 sm:p-5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 rounded-xl space-y-3 animate-fade-in">
            <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 fill-current" />
              <span>Optimization Decision: arr[{pointer}] = {currentRound.array[pointer]} &gt; {currentRound.target}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              Because the array is sorted in ascending order, every subsequent element is guaranteed to be ≥ {currentRound.array[pointer]}. Should you break immediately or continue?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                id="btn-lvl3-decision-early-break"
                onClick={() => handleDecision(true)}
                className="btn-modern-primary bg-amber-600 hover:bg-amber-700 text-white py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Early Exit: if (arr[i] &gt; target) break;</span>
              </button>
              <button
                id="btn-lvl3-decision-continue"
                onClick={() => handleDecision(false)}
                className="btn-modern-secondary py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:border-rose-400"
              >
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <span>Continue Scanning to Index [{pointer + 1}]</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer & Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-blue-500/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6] shrink-0" />
            <span>{feedback}</span>
          </div>

          {status === 'searching' && (
            <button
              id="btn-lvl3-check-next"
              onClick={() => handleCheck()}
              className="btn-modern-primary px-5 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm w-full sm:w-auto justify-center"
            >
              <span>
                Compare [{pointer}] with {currentRound.target}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {isRoundDone && (
            <button
              id="btn-lvl3-next-round"
              onClick={handleNextRound}
              className="btn-modern-primary px-6 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md w-full sm:w-auto justify-center"
            >
              <span>{isAllRoundsComplete ? 'Complete Level 3' : 'Next Round'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
