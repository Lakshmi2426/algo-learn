import React, { useState } from 'react';
import { CheckCircle2, ArrowRight, Check, Lightbulb, Sparkles, Activity, AlertTriangle, Layers } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { pointsManager } from '../utils/pointsManager';
import { GuidedSolvePanel } from './GuidedSolvePanel';

interface Level2Round {
  array: number[];
  target: number;
  duplicateIndices: number[];
  budget: number;
}

interface Level2GameplayProps {
  onLevelComplete: (levelId: number, score: number) => void;
  onScoreUpdate: (delta: number) => void;
  onStreakUpdate: (streak: number) => void;
}

export const Level2Gameplay: React.FC<Level2GameplayProps> = ({
  onLevelComplete,
  onScoreUpdate,
  onStreakUpdate,
}) => {
  const rounds: Level2Round[] = [
    {
      array: [14, 42, 29, 42, 55, 68],
      target: 42,
      duplicateIndices: [1, 3],
      budget: 6,
    },
    {
      array: [8, 17, 33, 50, 33, 71, 33],
      target: 33,
      duplicateIndices: [2, 4, 6],
      budget: 7,
    },
  ];

  const [roundIndex, setRoundIndex] = useState<number>(0);
  const [pointer, setPointer] = useState<number>(0);
  const [comparisons, setComparisons] = useState<number>(0);
  const [foundIndices, setFoundIndices] = useState<number[]>([]);
  // Awaiting choice when an occurrence is discovered: Stop vs Continue
  const [isAwaitingDuplicateChoice, setIsAwaitingDuplicateChoice] = useState<boolean>(false);
  const [isRoundFinished, setIsRoundFinished] = useState<boolean>(false);

  const [feedback, setFeedback] = useState<string>(
    'Find ALL occurrences of the target within the comparison budget.'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGuidedSolveActive, setIsGuidedSolveActive] = useState<boolean>(false);
  const [currentHint, setCurrentHint] = useState<string | null>(null);

  const currentRound = rounds[roundIndex];
  const isAllRoundsComplete = roundIndex >= rounds.length - 1 && isRoundFinished;

  const isLevelDone = pointsManager.isLevelCompleted(2);
  const isHintUsed = pointsManager.isHintAlreadyDeducted(2);
  const isGuidedUsed = pointsManager.isGuidedSolveAlreadyDeducted(2);

  const handleUseHint = () => {
    soundManager.playClick();
    pointsManager.recordHintUsed(2, `Level 2: Round ${roundIndex + 1}`);
    setCurrentHint(
      `Multiple Occurrences Rule: Unlike single-item search which returns early, finding ALL occurrences requires an exhaustive O(n) scan so that duplicates at later indices (such as index ${currentRound.duplicateIndices[currentRound.duplicateIndices.length - 1]}) are not missed.`
    );
  };

  const handleCheckNext = () => {
    if (isRoundFinished || isAwaitingDuplicateChoice) return;

    soundManager.playClick();
    const currentVal = currentRound.array[pointer];
    const nextComparisons = comparisons + 1;
    setComparisons(nextComparisons);

    if (currentVal === currentRound.target) {
      soundManager.playCalcSuccess();
      const updatedFound = [...foundIndices, pointer];
      setFoundIndices(updatedFound);
      setIsAwaitingDuplicateChoice(true);
      setFeedback(`Target ${currentRound.target} detected at index [${pointer}]! Occurrence ${updatedFound.length} of ${currentRound.duplicateIndices.length}.`);
    } else {
      if (pointer >= currentRound.array.length - 1) {
        // Reached end of array
        finishRound();
      } else {
        setPointer((prev) => prev + 1);
        setFeedback(`arr[${pointer}] (${currentVal}) ≠ ${currentRound.target}. Advancing to index [${pointer + 1}]...`);
      }
    }
  };

  const handleDuplicateDecision = (continueScanning: boolean) => {
    if (!continueScanning) {
      soundManager.playError();
      setErrorMessage(
        `Stopping now misses later duplicates! To find ALL occurrences, Linear Search must inspect all n elements.`
      );
      setTimeout(() => setErrorMessage(null), 2500);
      return;
    }

    soundManager.playClick();
    setIsAwaitingDuplicateChoice(false);

    if (pointer >= currentRound.array.length - 1) {
      finishRound();
    } else {
      const nextPtr = pointer + 1;
      setPointer(nextPtr);
      setFeedback(`Continuing scan: advancing pointer to index [${nextPtr}].`);
    }
  };

  const finishRound = () => {
    soundManager.playCalcSuccess();
    setIsRoundFinished(true);
    setFeedback(`✓ Round ${roundIndex + 1} completed! All occurrences found at indices: [${currentRound.duplicateIndices.join(', ')}].`);
    onScoreUpdate(50);
    onStreakUpdate(roundIndex + 1);
  };

  const handleNextRound = () => {
    if (roundIndex < rounds.length - 1) {
      soundManager.playSelect();
      const nextIdx = roundIndex + 1;
      setRoundIndex(nextIdx);
      setPointer(0);
      setComparisons(0);
      setFoundIndices([]);
      setIsAwaitingDuplicateChoice(false);
      setIsRoundFinished(false);
      setFeedback(`Round ${nextIdx + 1}: Find all occurrences of target ${rounds[nextIdx].target}.`);
    } else {
      soundManager.playLevelVictory();
      onLevelComplete(2, 100);
    }
  };

  const getGuidedSolveExplanation = () => {
    if (isRoundFinished) {
      return `Round ${roundIndex + 1} finished! Total ${foundIndices.length} occurrences collected in ${comparisons} comparisons.`;
    }
    if (isAwaitingDuplicateChoice) {
      return `Match found at index ${pointer}. Since the goal is ALL occurrences, the algorithm records index ${pointer} and must CONTINUE scanning remaining slots.`;
    }
    return `Inspecting index ${pointer} (value ${currentRound.array[pointer]}). Comparison ${comparisons + 1} of budget ${currentRound.budget}.`;
  };

  const handleGuidedNextStep = () => {
    if (isRoundFinished) {
      handleNextRound();
      return;
    }
    if (isAwaitingDuplicateChoice) {
      handleDuplicateDecision(true);
    } else {
      handleCheckNext();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-page-enter">
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-5 sm:p-6 shadow-xs">
        {/* Mission & Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-blue-500/15">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-[#EFF6FF] dark:bg-blue-950/60 border border-[#DBEAFE] dark:border-blue-500/30 text-[#2563EB] dark:text-[#3B82F6] rounded-lg text-xs font-bold font-mono">
              ROUND {roundIndex + 1} OF {rounds.length}
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
              Collect <span className="text-amber-600 dark:text-amber-400 font-extrabold">ALL OCCURRENCES</span> of target{' '}
              <span className="font-mono text-[#2563EB] dark:text-[#3B82F6] text-lg font-extrabold px-2 py-0.5 bg-[#EFF6FF] dark:bg-blue-900/40 rounded-md border border-[#DBEAFE] dark:border-blue-500/30">
                {currentRound.target}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-mono text-xs text-slate-600 dark:text-slate-300">
              <span>Budget:</span>
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-blue-500/30 rounded-md font-bold text-slate-900 dark:text-white">
                {comparisons} / {currentRound.budget}
              </span>
            </div>

            {!isRoundFinished && (
              <button
                id="btn-lvl2-hint"
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

            {!isGuidedSolveActive && !isRoundFinished && (
              <button
                id="btn-lvl2-start-guided-solve"
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  pointsManager.recordGuidedSolveUsed(2, 'Level 2');
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

        {/* Dynamic Hint Banner — ONLY VISIBLE ON DEMAND */}
        {currentHint && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 rounded-xl text-xs font-medium text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2 animate-fade-in">
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

        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2 animate-shake">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Guided Solve Step-by-Step Panel */}
        {isGuidedSolveActive && (
          <div className="pt-4">
            <GuidedSolvePanel
              stepNumber={isRoundFinished ? currentRound.budget : comparisons + 1}
              totalSteps={currentRound.budget}
              explanation={getGuidedSolveExplanation()}
              isComplete={isRoundFinished}
              nextButtonLabel={
                isRoundFinished
                  ? roundIndex < rounds.length - 1 ? 'Next Round' : 'Complete Level 2'
                  : isAwaitingDuplicateChoice
                  ? 'Continue Scanning (Collect All Occurrences)'
                  : `Compare [${pointer}] with ${currentRound.target}`
              }
              onNextStep={handleGuidedNextStep}
              onStop={() => setIsGuidedSolveActive(false)}
            />
          </div>
        )}

        {/* Occurrences Counter & Progress */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200/80 dark:border-blue-500/20 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
            <span className="text-slate-500 dark:text-slate-400">FOUND OCCURRENCES:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
              {foundIndices.length} of {currentRound.duplicateIndices.length} indices: [{foundIndices.join(', ') || 'none'}]
            </span>
          </div>
          <div className="text-slate-500 dark:text-slate-400">
            Complexity: <code className="text-[#2563EB] dark:text-[#3B82F6]">O(n) Exhaustive Traversal</code>
          </div>
        </div>

        {/* Array Elements Display */}
        <div className="pt-6 pb-2">
          <div className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center justify-between">
            <span>Array Elements</span>
            <span className="text-[#2563EB] dark:text-[#3B82F6]">Pointer: Index {pointer}</span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-7 gap-2 sm:gap-3">
            {currentRound.array.map((val, idx) => {
              const isVisited = idx <= pointer && comparisons > 0;
              const isCurrent = idx === pointer && !isRoundFinished;
              const isMatch = foundIndices.includes(idx);
              const isMismatch = isVisited && !isMatch && (!isCurrent || isAwaitingDuplicateChoice);

              return (
                <div
                  key={idx}
                  id={`lvl2-array-cell-${idx}`}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 select-none min-h-[90px] ${
                    isMatch
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-md ring-4 ring-emerald-500/20 scale-105'
                      : isMismatch
                      ? 'bg-slate-50 dark:bg-[#0F172A] border-slate-300 dark:border-blue-500/20 text-slate-400 dark:text-slate-500 opacity-80'
                      : isCurrent
                      ? 'bg-[#EFF6FF] dark:bg-blue-950/40 border-[#2563EB] dark:border-[#3B82F6] text-[#2563EB] dark:text-white shadow-md ring-4 ring-blue-500/20 scale-105'
                      : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-blue-500/20 text-slate-700 dark:text-slate-300 opacity-60'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 mb-1">
                    [{idx}]
                  </span>
                  <span className="text-lg sm:text-xl font-bold font-mono">{val}</span>
                  <div className="mt-1 text-[9px] font-mono font-bold">
                    {isMatch ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" /> MATCH
                      </span>
                    ) : isMismatch ? (
                      <span className="text-slate-400 dark:text-slate-500">≠ {currentRound.target}</span>
                    ) : isCurrent ? (
                      <span className="text-[#2563EB] dark:text-[#3B82F6] animate-pulse">CHECKING</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600">WAIT</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action & Feedback Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-blue-500/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6] shrink-0" />
            <span>{feedback}</span>
          </div>

          {!isRoundFinished ? (
            !isAwaitingDuplicateChoice ? (
              <button
                id="btn-lvl2-check-next"
                onClick={handleCheckNext}
                className="btn-modern-primary px-5 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm w-full sm:w-auto justify-center"
              >
                <span>Compare [{pointer}] with {currentRound.target}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  id="btn-lvl2-stop-early"
                  onClick={() => handleDuplicateDecision(false)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
                >
                  Stop Here (Return Index {pointer})
                </button>
                <button
                  id="btn-lvl2-continue-scan"
                  onClick={() => handleDuplicateDecision(true)}
                  className="btn-modern-primary bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Continue Scan (Find All Occurrences)</span>
                </button>
              </div>
            )
          ) : (
            <button
              id="btn-lvl2-next-round"
              onClick={handleNextRound}
              className="btn-modern-primary px-6 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md w-full sm:w-auto justify-center"
            >
              <span>{isAllRoundsComplete ? 'Complete Level 2' : 'Next Round'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
