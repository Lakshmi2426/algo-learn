import React, { useState } from 'react';
import { CheckCircle2, ArrowRight, Check, Lightbulb, Sparkles, Activity, AlertTriangle } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { pointsManager } from '../utils/pointsManager';
import { GuidedSolvePanel } from './GuidedSolvePanel';

interface Level1GameplayProps {
  onLevelComplete: (levelId: number, score: number) => void;
  onScoreUpdate: (delta: number) => void;
  onStreakUpdate: (streak: number) => void;
}

export const Level1Gameplay: React.FC<Level1GameplayProps> = ({
  onLevelComplete,
  onScoreUpdate,
  onStreakUpdate,
}) => {
  const array = [12, 25, 7, 18, 30];
  const target = 7;

  // Pointer position in array
  const [pointer, setPointer] = useState<number>(0);
  // Set of revealed indices (face-down cards)
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  // Whether the current card has just been flipped and awaits comparison decision
  const [isAwaitingDecision, setIsAwaitingDecision] = useState<boolean>(false);
  const [isFound, setIsFound] = useState<boolean>(false);
  const [comparisons, setComparisons] = useState<number>(0);

  const [feedback, setFeedback] = useState<string>(
    'Cards are face-down. Click "Inspect arr[0]" to flip the first card.'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGuidedSolveActive, setIsGuidedSolveActive] = useState<boolean>(false);
  const [currentHint, setCurrentHint] = useState<string | null>(null);

  const isLevelDone = pointsManager.isLevelCompleted(1);
  const isHintUsed = pointsManager.isHintAlreadyDeducted(1);
  const isGuidedUsed = pointsManager.isGuidedSolveAlreadyDeducted(1);

  const handleUseHint = () => {
    soundManager.playClick();
    pointsManager.recordHintUsed(1, 'Level 1: Sequential Traversal');
    setCurrentHint(
      `Loop Invariant: Linear Search checks elements sequentially. At index [${pointer}], compare arr[${pointer}] (${array[pointer]}) with target ${target}. If arr[${pointer}] !== ${target}, the algorithm MUST advance pointer i to ${pointer + 1}. If equal, return index ${pointer}.`
    );
  };

  // Step 1: Flip card at current pointer
  const handleInspectCard = (clickedIndex?: number) => {
    if (isFound || isAwaitingDecision) return;

    if (clickedIndex !== undefined && clickedIndex !== pointer) {
      soundManager.playError();
      setErrorMessage(`Linear Search must inspect elements sequentially starting from index ${pointer}!`);
      setTimeout(() => setErrorMessage(null), 2500);
      return;
    }

    soundManager.playClick();
    if (!revealedIndices.includes(pointer)) {
      setRevealedIndices((prev) => [...prev, pointer]);
    }
    setComparisons((prev) => prev + 1);
    setIsAwaitingDecision(true);
    setFeedback(`Card [${pointer}] revealed value ${array[pointer]}. Compare with target ${target}.`);
  };

  // Step 2: User decides whether arr[pointer] === target or to advance
  const handleDecision = (userClaimFound: boolean) => {
    const currentVal = array[pointer];
    const isActualMatch = currentVal === target;

    if (userClaimFound) {
      if (isActualMatch) {
        soundManager.playCalcSuccess();
        setIsFound(true);
        setIsAwaitingDecision(false);
        setFeedback(`✓ Match! arr[${pointer}] === ${target}. Target found after ${comparisons} comparisons!`);
        onScoreUpdate(50);
        onStreakUpdate(1);
      } else {
        soundManager.playError();
        setErrorMessage(`Mismatch! arr[${pointer}] = ${currentVal} ≠ ${target}. You cannot return index ${pointer}.`);
        setTimeout(() => setErrorMessage(null), 2500);
      }
    } else {
      // User claimed no match (advance pointer)
      if (!isActualMatch) {
        soundManager.playClick();
        setIsAwaitingDecision(false);
        const nextPtr = pointer + 1;
        setPointer(nextPtr);
        setFeedback(`Correct: ${currentVal} ≠ ${target}. Loop advances pointer to index [${nextPtr}].`);
      } else {
        soundManager.playError();
        setErrorMessage(`Wait! arr[${pointer}] = ${currentVal} DOES equal target ${target}! Claim the match.`);
        setTimeout(() => setErrorMessage(null), 2500);
      }
    }
  };

  const handleComplete = () => {
    soundManager.playLevelVictory();
    onLevelComplete(1, 100);
  };

  const getGuidedSolveExplanation = () => {
    if (isFound) {
      return `Target ${target} was found at index 2 after 3 comparisons. Linear search loop terminates!`;
    }
    if (!isAwaitingDecision) {
      return `Step ${pointer + 1}: Inspect card at index [${pointer}]. Linear Search always visits cards strictly in order from left to right.`;
    }
    const val = array[pointer];
    if (val === target) {
      return `arr[${pointer}] equals ${target}! The loop condition (arr[i] === target) is satisfied. Select "Match Found (Return Index ${pointer})".`;
    }
    return `arr[${pointer}] is ${val}, which does NOT equal target ${target}. Select "No Match (Advance to i = ${pointer + 1})".`;
  };

  const handleGuidedNextStep = () => {
    if (isFound) {
      handleComplete();
      return;
    }
    if (!isAwaitingDecision) {
      handleInspectCard();
    } else {
      const isActualMatch = array[pointer] === target;
      handleDecision(isActualMatch);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-page-enter">
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-5 sm:p-6 shadow-xs">
        {/* Mission & Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-blue-500/15">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-[#EFF6FF] dark:bg-blue-950/60 border border-[#DBEAFE] dark:border-blue-500/30 text-[#2563EB] dark:text-[#3B82F6] rounded-lg text-xs font-bold font-mono">
              LEVEL 1 MISSION
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
              Find target number{' '}
              <span className="font-mono text-[#2563EB] dark:text-[#3B82F6] text-lg font-extrabold px-2 py-0.5 bg-[#EFF6FF] dark:bg-blue-900/40 rounded-md border border-[#DBEAFE] dark:border-blue-500/30">
                {target}
              </span>{' '}
              behind face-down cards
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-mono text-xs text-slate-600 dark:text-slate-300">
              <span>Comparisons:</span>
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-blue-500/30 rounded-md font-bold text-slate-900 dark:text-white">
                {comparisons}
              </span>
            </div>

            {!isFound && (
              <button
                id="btn-lvl1-hint"
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

            {!isGuidedSolveActive && !isFound && (
              <button
                id="btn-lvl1-start-guided-solve"
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  pointsManager.recordGuidedSolveUsed(1, 'Level 1');
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

        {/* Dynamic Hint Banner — VISIBLE ONLY WHEN USER CLICKS HINT BUTTON */}
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
              stepNumber={isFound ? 4 : comparisons + 1}
              totalSteps={4}
              explanation={getGuidedSolveExplanation()}
              isComplete={isFound}
              nextButtonLabel={
                isFound
                  ? 'Complete Level 1'
                  : !isAwaitingDecision
                  ? `Inspect arr[${pointer}]`
                  : array[pointer] === target
                  ? `Claim Match (${target} === ${target})`
                  : `Advance (i = ${pointer + 1})`
              }
              onNextStep={handleGuidedNextStep}
              onStop={() => setIsGuidedSolveActive(false)}
            />
          </div>
        )}

        {/* Loop State HUD */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200/80 dark:border-blue-500/20 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 dark:text-slate-400">LOOP STATE:</span>
            <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">
              i = {pointer}
            </span>
            <span className="text-slate-600 dark:text-slate-300">
              arr[{pointer}] = {revealedIndices.includes(pointer) ? array[pointer] : '? (Face Down)'}
            </span>
          </div>
          <div className="text-slate-500 dark:text-slate-400">
            Invariant: <code className="text-[#2563EB] dark:text-[#3B82F6]">for (let i = 0; i &lt; n; i++)</code>
          </div>
        </div>

        {/* Interactive Face-Down Card Deck */}
        <div className="pt-6 pb-2">
          <div className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center justify-between">
            <span>Face-Down Cards (Flip in sequential order)</span>
            <span className="text-[#2563EB] dark:text-[#3B82F6]">Current Pointer: Index {pointer}</span>
          </div>

          <div className="grid grid-cols-5 gap-2 sm:gap-4">
            {array.map((val, idx) => {
              const isRevealed = revealedIndices.includes(idx);
              const isCurrent = idx === pointer && !isFound;
              const isMatch = isRevealed && val === target && isFound;
              const isMismatch = isRevealed && val !== target;

              return (
                <button
                  key={idx}
                  id={`lvl1-array-cell-${idx}`}
                  onClick={() => handleInspectCard(idx)}
                  disabled={isFound || isRevealed || idx !== pointer}
                  className={`relative flex flex-col items-center justify-center p-3 sm:p-5 rounded-xl border-2 transition-all duration-300 select-none min-h-[110px] ${
                    isMatch
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-md scale-105 ring-4 ring-emerald-500/20'
                      : isMismatch
                      ? 'bg-slate-100 dark:bg-[#0F172A] border-slate-300 dark:border-blue-500/20 text-slate-500 dark:text-slate-400 opacity-90'
                      : isCurrent
                      ? 'bg-gradient-to-b from-[#EFF6FF] to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30 border-[#2563EB] dark:border-[#3B82F6] text-[#2563EB] dark:text-white shadow-md scale-105 ring-4 ring-blue-500/20 cursor-pointer animate-pulse'
                      : 'bg-slate-50 dark:bg-[#111827] border-dashed border-slate-300 dark:border-blue-500/20 text-slate-400 dark:text-slate-600 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 mb-1">
                    [{idx}]
                  </span>

                  {isRevealed ? (
                    <span className="text-xl sm:text-2xl font-bold font-mono transition-transform duration-300 scale-100">
                      {val}
                    </span>
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-base shadow-2xs">
                      ?
                    </div>
                  )}

                  <div className="mt-2 text-[10px] font-mono font-bold flex items-center gap-1">
                    {isMatch ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> MATCH
                      </span>
                    ) : isMismatch ? (
                      <span className="text-rose-500 dark:text-rose-400">≠ {target}</span>
                    ) : isCurrent ? (
                      <span className="text-[#2563EB] dark:text-[#3B82F6]">INSPECT</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600">LOCKED</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Decision & Action Control Box */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-blue-500/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6] shrink-0" />
            <span>{feedback}</span>
          </div>

          {!isFound ? (
            !isAwaitingDecision ? (
              <button
                id="btn-lvl1-inspect-next"
                onClick={() => handleInspectCard()}
                className="btn-modern-primary px-5 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm w-full sm:w-auto justify-center"
              >
                <span>Inspect arr[{pointer}]</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  id="btn-lvl1-claim-mismatch"
                  onClick={() => handleDecision(false)}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shadow-2xs flex-1 sm:flex-initial"
                >
                  arr[{pointer}] ≠ {target} (Advance)
                </button>
                <button
                  id="btn-lvl1-claim-match"
                  onClick={() => handleDecision(true)}
                  className="btn-modern-primary bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm flex-1 sm:flex-initial"
                >
                  <Check className="w-4 h-4" />
                  <span>arr[{pointer}] === {target} (Return {pointer})</span>
                </button>
              </div>
            )
          ) : (
            <button
              id="btn-lvl1-complete"
              onClick={handleComplete}
              className="btn-modern-primary bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md w-full sm:w-auto justify-center animate-bounce"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Level 1</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
