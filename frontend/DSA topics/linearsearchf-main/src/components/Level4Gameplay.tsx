import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, XCircle, Lightbulb, Sparkles, Activity, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { pointsManager } from '../utils/pointsManager';
import { GuidedSolvePanel } from './GuidedSolvePanel';

type ChallengeType = 'absent_worst_case' | 'sentinel_internal' | 'sentinel_absent' | 'sentinel_last_element';

interface Level4Challenge {
  type: ChallengeType;
  title: string;
  subtitle: string;
  array: number[];
  target: number;
  lastVal?: number;
  sentinelIndex?: number;
  expectedStopIndex: number;
  decisionPrompt: string;
  options: { id: string; label: string; isCorrect: boolean; explanation: string }[];
}

interface Level4GameplayProps {
  onLevelComplete: (levelId: number, score: number) => void;
  onScoreUpdate: (delta: number) => void;
  onStreakUpdate: (streak: number) => void;
}

export const Level4Gameplay: React.FC<Level4GameplayProps> = ({
  onLevelComplete,
  onScoreUpdate,
  onStreakUpdate,
}) => {
  const challenges: Level4Challenge[] = [
    {
      type: 'absent_worst_case',
      title: 'Absent Element Traversal (Worst Case O(n))',
      subtitle: 'Unsorted array — verify target absence requires full traversal before returning -1',
      array: [18, 45, 9, 72, 33, 61, 24],
      target: 50,
      expectedStopIndex: 6,
      decisionPrompt: 'Search reached the end of the unsorted array without finding target 50. What is the return value?',
      options: [
        {
          id: 'opt-return-neg-1',
          label: 'Return -1 (Exhaustive O(n) Scan Complete: Target Absent)',
          isCorrect: true,
          explanation: 'In an unsorted array, an absent element requires inspecting all n items. Return -1 indicates target not found.',
        },
        {
          id: 'opt-return-last-idx',
          label: 'Return index 6 (Last Checked Index)',
          isCorrect: false,
          explanation: 'Incorrect: arr[6] is 24, not target 50. Returning index 6 would falsely claim 50 was found.',
        },
        {
          id: 'opt-early-stop',
          label: 'Stop early and return 0',
          isCorrect: false,
          explanation: 'Incorrect: You cannot stop early in an unsorted array without missing potential matches.',
        },
      ],
    },
    {
      type: 'sentinel_internal',
      title: 'Sentinel Search: Match Before Last Index',
      subtitle: 'Sentinel eliminates boundary check (i < n). arr[n-1] replaced by target 49 temporarily',
      array: [35, 12, 84, 49, 49], // last element replaced with target 49
      target: 49,
      lastVal: 67, // original arr[4] was 67
      sentinelIndex: 4,
      expectedStopIndex: 3,
      decisionPrompt: 'Loop while(arr[i] != target) stopped at i = 3. Is this a genuine match or the sentinel?',
      options: [
        {
          id: 'opt-genuine-internal',
          label: 'Genuine Match at Index 3 (Since i < n - 1, 3 < 4)',
          isCorrect: true,
          explanation: 'Because loop stopped at index 3 < (n - 1), target was located in the original array body before the sentinel.',
        },
        {
          id: 'opt-sentinel-only',
          label: 'Sentinel Match (Return -1)',
          isCorrect: false,
          explanation: 'Incorrect: The sentinel is at index 4. Stopping at index 3 means an authentic match was encountered.',
        },
      ],
    },
    {
      type: 'sentinel_absent',
      title: 'Sentinel Search: Target Absent (Sentinel Hit)',
      subtitle: 'arr[n-1] replaced by target 99. Match occurs at sentinel index (i = n - 1)',
      array: [28, 54, 16, 73, 99], // last element replaced with sentinel 99
      target: 99,
      lastVal: 91, // original arr[4] was 91
      sentinelIndex: 4,
      expectedStopIndex: 4,
      decisionPrompt: 'Loop terminated at i = 4 (n - 1). Original element was lastVal = 91. What is the algorithm outcome?',
      options: [
        {
          id: 'opt-absent-sentinel',
          label: 'Target Absent: Return -1 (lastVal 91 ≠ target 99, match was sentinel only)',
          isCorrect: true,
          explanation: 'Since i == n - 1 and original lastVal (91) ≠ target (99), the hit was solely the inserted sentinel. Target is absent: return -1.',
        },
        {
          id: 'opt-genuine-match-sentinel',
          label: 'Genuine Match at Index 4 (Return 4)',
          isCorrect: false,
          explanation: 'Incorrect: Index 4 originally held 91, not 99. The match was only our temporary sentinel!',
        },
      ],
    },
    {
      type: 'sentinel_last_element',
      title: 'Sentinel Search: Genuine Match at Last Index',
      subtitle: 'Original arr[n-1] was already 88! Loop stops at i = n - 1',
      array: [15, 62, 40, 88], // last element was originally 88, sentinel is also 88
      target: 88,
      lastVal: 88,
      sentinelIndex: 3,
      expectedStopIndex: 3,
      decisionPrompt: 'Loop terminated at i = 3 (n - 1). Original lastVal was 88 === target 88. What is the outcome?',
      options: [
        {
          id: 'opt-genuine-at-last',
          label: 'Genuine Match at Index 3 (lastVal === target 88, return 3)',
          isCorrect: true,
          explanation: 'Because original lastVal equals target (88 == 88), target was genuinely present at index n - 1! Return index 3.',
        },
        {
          id: 'opt-false-sentinel',
          label: 'Target Absent (Return -1)',
          isCorrect: false,
          explanation: 'Incorrect: The original last value was 88, which equals the target. Target is genuinely present.',
        },
      ],
    },
  ];

  const [challengeIndex, setChallengeIndex] = useState<number>(0);
  const [pointer, setPointer] = useState<number>(0);
  const [comparisons, setComparisons] = useState<number>(0);
  const [status, setStatus] = useState<'searching' | 'decision_needed' | 'challenge_completed'>('searching');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>(
    'Examine how Linear Search handles edge cases and eliminates boundary checks.'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGuidedSolveActive, setIsGuidedSolveActive] = useState<boolean>(false);
  const [currentHint, setCurrentHint] = useState<string | null>(null);

  const currentChallenge = challenges[challengeIndex];
  const isDecisionPhase = status === 'decision_needed';
  const isChallengeDone = status === 'challenge_completed';
  const isAllChallengesComplete = challengeIndex >= challenges.length - 1 && isChallengeDone;

  const isLevelDone = pointsManager.isLevelCompleted(4);
  const isHintUsed = pointsManager.isHintAlreadyDeducted(4);
  const isGuidedUsed = pointsManager.isGuidedSolveAlreadyDeducted(4);

  const handleUseHint = () => {
    soundManager.playClick();
    pointsManager.recordHintUsed(4, `Level 4: Master Challenge (${currentChallenge.title})`);
    if (currentChallenge.type === 'absent_worst_case') {
      setCurrentHint(
        `Worst-Case Traversal: In an unsorted array, the target could appear at any position. To confirm absence, linear search must inspect all n elements (O(n) comparisons) and return -1.`
      );
    } else {
      setCurrentHint(
        `Sentinel Search Logic: By setting arr[n-1] = target, we remove the "i < n" check from the loop. After while(arr[i] != target) i++ stops: If i < n - 1, genuine match at i. If i == n - 1, check if original lastVal == target; if yes return n - 1, otherwise return -1.`
      );
    }
  };

  const handleCheck = (clickedIndex?: number) => {
    if (status !== 'searching') return;

    if (clickedIndex !== undefined && clickedIndex !== pointer) {
      soundManager.playError();
      setErrorMessage(`Check elements sequentially starting at index [${pointer}].`);
      setTimeout(() => setErrorMessage(null), 2500);
      return;
    }

    const currentVal = currentChallenge.array[pointer];
    const nextComparisons = comparisons + 1;
    setComparisons(nextComparisons);

    if (pointer === currentChallenge.expectedStopIndex) {
      soundManager.playCalcSuccess();
      setStatus('decision_needed');
      setFeedback(
        `Pointer reached index [${pointer}] (${currentVal}). Analyze the result below!`
      );
    } else {
      soundManager.playClick();
      const nextPtr = pointer + 1;
      setPointer(nextPtr);
      setFeedback(`arr[${pointer}] (${currentVal}) ≠ ${currentChallenge.target}. Advancing to index [${nextPtr}]...`);
    }
  };

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
    const opt = currentChallenge.options.find((o) => o.id === optionId);

    if (opt?.isCorrect) {
      soundManager.playCalcSuccess();
      setStatus('challenge_completed');
      setFeedback(`✓ Correct! ${opt.explanation}`);
      onScoreUpdate(50);
      onStreakUpdate(challengeIndex + 1);
    } else {
      soundManager.playError();
      setErrorMessage(opt?.explanation || 'Incorrect choice. Review sentinel logic and retry!');
      setTimeout(() => setErrorMessage(null), 3500);
    }
  };

  const handleNextChallenge = () => {
    if (challengeIndex < challenges.length - 1) {
      soundManager.playSelect();
      const nextIdx = challengeIndex + 1;
      setChallengeIndex(nextIdx);
      setPointer(0);
      setComparisons(0);
      setStatus('searching');
      setSelectedOption(null);
      setErrorMessage(null);
      setCurrentHint(null);
      setFeedback(`Challenge ${nextIdx + 1}: ${challenges[nextIdx].title}`);
    } else {
      soundManager.playLevelVictory();
      onLevelComplete(4, 100);
    }
  };

  const getGuidedSolveExplanation = () => {
    if (status === 'challenge_completed') {
      if (challengeIndex < challenges.length - 1) {
        return `Challenge ${challengeIndex + 1} solved! Click Next Step to proceed to Challenge ${challengeIndex + 2}.`;
      }
      return `Master challenge completed! You have mastered worst-case linear search and sentinel boundary elimination.`;
    }
    if (status === 'decision_needed') {
      const correct = currentChallenge.options.find((o) => o.isCorrect);
      return `Pointer stopped at index [${pointer}]. Correct conclusion: "${correct?.label}". ${correct?.explanation}`;
    }
    const val = currentChallenge.array[pointer];
    return `Index [${pointer}] has value ${val}. Compare with target ${currentChallenge.target} to advance the search loop.`;
  };

  const handleGuidedNextStep = () => {
    if (status === 'searching') {
      handleCheck();
    } else if (status === 'decision_needed') {
      const correct = currentChallenge.options.find((o) => o.isCorrect);
      if (correct) handleOptionSelect(correct.id);
    } else {
      handleNextChallenge();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-page-enter">
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-5 sm:p-6 shadow-xs">
        {/* Header HUD */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-blue-500/15">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-[#EFF6FF] dark:bg-blue-950/60 border border-[#DBEAFE] dark:border-blue-500/30 text-[#2563EB] dark:text-[#3B82F6] rounded-lg text-xs font-bold font-mono">
              CHALLENGE {challengeIndex + 1} OF {challenges.length}
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
              Target:{' '}
              <span className="font-mono text-[#2563EB] dark:text-[#3B82F6] text-lg font-extrabold px-2 py-0.5 bg-[#EFF6FF] dark:bg-blue-900/40 rounded-md border border-[#DBEAFE] dark:border-blue-500/30">
                {currentChallenge.target}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400">COMPARISONS:</span>
              <span className="px-3 py-1 bg-[#2563EB] text-white rounded-lg font-bold text-sm shadow-xs animate-scale">
                {comparisons}
              </span>
            </div>

            {!isAllChallengesComplete && (
              <button
                id="btn-lvl4-hint"
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

            {!isGuidedSolveActive && !isAllChallengesComplete && (
              <button
                id="btn-lvl4-start-guided-solve"
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  pointsManager.recordGuidedSolveUsed(4, 'Level 4');
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
                status === 'challenge_completed'
                  ? currentChallenge.expectedStopIndex + 3
                  : status === 'decision_needed'
                  ? currentChallenge.expectedStopIndex + 2
                  : pointer + 1
              }
              totalSteps={currentChallenge.expectedStopIndex + 3}
              explanation={getGuidedSolveExplanation()}
              isComplete={isAllChallengesComplete}
              nextButtonLabel={
                status === 'searching'
                  ? `Compare [${pointer}] with ${currentChallenge.target}`
                  : status === 'decision_needed'
                  ? 'Confirm Algorithmic Decision'
                  : challengeIndex < challenges.length - 1
                  ? `Proceed to Challenge ${challengeIndex + 2}`
                  : 'Complete Master Challenge'
              }
              onNextStep={handleGuidedNextStep}
              onStop={() => setIsGuidedSolveActive(false)}
            />
          </div>
        )}

        {/* Sentinel Technique Banner */}
        {currentChallenge.sentinelIndex !== undefined && (
          <div className="mt-4 p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/30 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#2563EB] dark:text-[#3B82F6] shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-slate-900 dark:text-white">Sentinel Optimization Active: </span>
              <span className="text-slate-600 dark:text-slate-300">
                Original <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-800">arr[{currentChallenge.sentinelIndex}] = {currentChallenge.lastVal}</code> replaced with sentinel <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-[#2563EB] dark:text-[#3B82F6]">{currentChallenge.target}</code>. Loop checks only <code className="font-mono">arr[i] != target</code> (no bounds check needed!).
              </span>
            </div>
          </div>
        )}

        {/* Array Visualization */}
        <div className="pt-5 pb-2">
          <div className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center justify-between">
            <span>{currentChallenge.title}</span>
            <span className="text-[#2563EB] dark:text-[#3B82F6]">Pointer: Index [{pointer}]</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-3">
            {currentChallenge.array.map((val, idx) => {
              const isChecked = idx < pointer || (idx === pointer && (isDecisionPhase || isChallengeDone));
              const isCurrent = idx === pointer && !isDecisionPhase && !isChallengeDone;
              const isSentinelSlot = currentChallenge.sentinelIndex === idx;
              const isStopIndex = idx === currentChallenge.expectedStopIndex && (isDecisionPhase || isChallengeDone);

              return (
                <button
                  key={idx}
                  id={`lvl4-array-cell-${idx}`}
                  onClick={() => handleCheck(idx)}
                  disabled={isDecisionPhase || isChallengeDone || idx < pointer}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 select-none ${
                    isStopIndex
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-200 shadow-md scale-105 ring-4 ring-emerald-500/20'
                      : isSentinelSlot
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-dashed border-amber-400 text-amber-900 dark:text-amber-200'
                      : isChecked
                      ? 'bg-slate-50 dark:bg-[#0F172A] border-slate-300 dark:border-blue-500/20 text-slate-400 dark:text-slate-500 opacity-80'
                      : isCurrent
                      ? 'bg-[#EFF6FF]/70 dark:bg-blue-950/40 border-[#2563EB] dark:border-[#3B82F6] text-[#2563EB] dark:text-white shadow-md scale-105 ring-4 ring-blue-500/20 cursor-pointer'
                      : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-blue-500/20 text-slate-700 dark:text-slate-300 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 mb-1">
                    [{idx}]
                  </span>
                  <span className="text-lg sm:text-xl font-bold font-mono">{val}</span>
                  <div className="mt-1 text-[9px] font-mono font-bold">
                    {isStopIndex ? (
                      <span className="text-emerald-600 dark:text-emerald-400">STOP AT {idx}</span>
                    ) : isSentinelSlot ? (
                      <span className="text-amber-600 dark:text-amber-400">SENTINEL</span>
                    ) : isChecked ? (
                      <span className="text-slate-400">≠ {currentChallenge.target}</span>
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

        {/* Algorithmic Decision Options */}
        {isDecisionPhase && (
          <div className="mt-6 p-4 sm:p-5 bg-[#EFF6FF]/70 dark:bg-blue-950/40 border border-[#DBEAFE] dark:border-blue-500/30 rounded-xl space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-[#2563EB] dark:text-[#3B82F6] uppercase font-mono tracking-wider">
              <Zap className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
              <span>Algorithmic Outcome Calculation</span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {currentChallenge.decisionPrompt}
            </h4>

            <div className="grid grid-cols-1 gap-2.5">
              {currentChallenge.options.map((opt) => {
                const isSelected = selectedOption === opt.id;
                const showSuccess = isSelected && opt.isCorrect;
                const showError = isSelected && !opt.isCorrect;

                return (
                  <button
                    key={opt.id}
                    id={`lvl4-opt-${opt.id}`}
                    onClick={() => handleOptionSelect(opt.id)}
                    disabled={isChallengeDone}
                    className={`text-left p-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                      showSuccess
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 shadow-xs'
                        : showError
                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-800 dark:text-rose-200'
                        : isChallengeDone && opt.isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                        : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-blue-500/20 text-slate-800 dark:text-slate-200 hover:border-[#2563EB] dark:hover:border-[#3B82F6]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {showSuccess && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                    {showError && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                  </button>
                );
              })}
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
              id="btn-lvl4-check-next"
              onClick={() => handleCheck()}
              className="btn-modern-primary px-5 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm w-full sm:w-auto justify-center"
            >
              <span>
                Compare [{pointer}] with {currentChallenge.target}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {isChallengeDone && (
            <button
              id="btn-lvl4-next-challenge"
              onClick={handleNextChallenge}
              className="btn-modern-primary px-6 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md w-full sm:w-auto justify-center"
            >
              <span>{isAllChallengesComplete ? 'Complete Level 4 (Master)' : 'Next Challenge'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
