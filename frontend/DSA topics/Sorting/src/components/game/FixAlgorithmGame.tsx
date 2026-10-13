import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wrench,
  Check,
  AlertTriangle,
  Clock,
  Trophy,
  HelpCircle,
  ArrowRight,
  Bug,
  Lightbulb,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SortCardObject, SortLevelConfig, UserProgress } from '../../types';
import { SortingCard } from './SortingCard';
import { soundEffects } from '../../services/sound';

interface FixAlgorithmGameProps {
  level: SortLevelConfig;
  progress: UserProgress;
  onCompleteLevel: (earnedXP: number, score?: number, performanceMetrics?: string) => void;
  onBackToLevels: () => void;
  onNextLevel?: () => void;
  onUseHint?: () => void;
  onUseGuidedSolve?: () => void;
}

interface QuestionScenario {
  prompt: string;
  operationsTrace: string[];
  swapIndices: [number, number];
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
    resultingArray: number[];
  }[];
}

interface GuidedFixStep {
  title: string;
  explanation: string;
  arrayState: number[];
  highlightIndices: number[];
  sortedIndices: number[];
  selectedOptionId?: string;
  isComplete?: boolean;
}

function buildFixGuidedSteps(levelNum: number, initialArray: number[]): GuidedFixStep[] {
  if (levelNum === 1) {
    return [
      {
        title: 'Guided Solve Step 1: Inspect Current Array [5, 3, 9, 7]',
        explanation:
          'Pass 1 just swapped 9 and 3 at indices 1 and 2, producing [5, 3, 9, 7]. Now compare index 2 (9) and index 3 (7). Click "Next Step" (or drag 9 onto 7) to perform the fix.',
        arrayState: [5, 3, 9, 7],
        highlightIndices: [2, 3],
        sortedIndices: [],
        selectedOptionId: 'opt-a',
      },
      {
        title: 'Guided Solve Step 2: Swap 9 and 7 → [5, 3, 7, 9]',
        explanation:
          'Since 9 > 7, we swap them so 9 bubbles to index 3 and locks at the end of Pass 1! Click "Next Step" to finish sorting the remaining unsorted pair [5, 3].',
        arrayState: [5, 3, 7, 9],
        highlightIndices: [0, 1],
        sortedIndices: [3],
        selectedOptionId: 'opt-a',
      },
      {
        title: 'Guided Solve Step 3: Swap 5 and 3 → Complete Sorted Array [3, 5, 7, 9]',
        explanation:
          'Comparing 5 and 3 at indices 0 and 1: since 5 > 3, swap them to reach the completely sorted array [3, 5, 7, 9]!',
        arrayState: [3, 5, 7, 9],
        highlightIndices: [],
        sortedIndices: [0, 1, 2, 3],
        selectedOptionId: 'opt-a',
        isComplete: true,
      },
    ];
  } else if (levelNum === 2) {
    return [
      {
        title: 'Guided Solve Step 1: Scan Unsorted Section [29, 14, 37, 10]',
        explanation:
          'Index 0 (8) is already sorted. Scanning indices 1..4 ([29, 14, 37, 10]) reveals that 10 at index 4 is the true minimum (not 14). Click "Next Step" (or drag 10 to 29) to swap 10 into index 1.',
        arrayState: [8, 29, 14, 37, 10],
        highlightIndices: [1, 4],
        sortedIndices: [0],
        selectedOptionId: 'opt-a',
      },
      {
        title: 'Guided Solve Step 2: Swapped 10 ⇄ 29 → [8, 10, 14, 37, 29]',
        explanation:
          'True minimum 10 is now locked at index 1, and 14 at index 2 is already the next minimum. Next, compare 37 and 29 at indices 3 and 4. Click "Next Step" to swap 37 and 29.',
        arrayState: [8, 10, 14, 37, 29],
        highlightIndices: [3, 4],
        sortedIndices: [0, 1, 2],
        selectedOptionId: 'opt-a',
      },
      {
        title: 'Guided Solve Step 3: Complete Sorted Array [8, 10, 14, 29, 37]',
        explanation:
          'Swapped 29 and 37 at indices 3 and 4. The entire array is now completely sorted in ascending order: [8, 10, 14, 29, 37]!',
        arrayState: [8, 10, 14, 29, 37],
        highlightIndices: [],
        sortedIndices: [0, 1, 2, 3, 4],
        selectedOptionId: 'opt-a',
        isComplete: true,
      },
    ];
  } else if (levelNum === 3) {
    const arr = [...initialArray];
    return [
      {
        title: `Guided Solve Step 1: Shift 27 Right for Key 12`,
        explanation:
          'In Insertion Sort on [8, 15, 27, 12], key = 12. First compare 27 with 12: since 27 > 12, shift 27 right. Now we must also compare 15 with 12. Click "Next Step" (or drag 15 right) to continue.',
        arrayState: arr.length === 4 ? [8, 15, 12, 27] : [...arr],
        highlightIndices: [1, 2],
        sortedIndices: [0],
        selectedOptionId: 'opt-a',
      },
      {
        title: 'Guided Solve Step 2: Shift 15 Right and Insert 12 After 8',
        explanation:
          'Since 15 > 12, shift 15 right as well. Since 8 ≤ 12, insert 12 at index 1 to reach the completely sorted state: [8, 12, 15, 27]!',
        arrayState: [8, 12, 15, 27],
        highlightIndices: [],
        sortedIndices: [0, 1, 2, 3],
        selectedOptionId: 'opt-a',
        isComplete: true,
      },
    ];
  } else if (levelNum === 4) {
    return [
      {
        title: 'Guided Solve Step 1: Swap 5 and 4 → [1, 2, 3, 4, 5]',
        explanation:
          'In Bubble Sort on [1, 2, 3, 5, 4], compare arr[3] (5) and arr[4] (4). Since 5 > 4, swap them. Click "Next Step" to set the adaptive swapped flag.',
        arrayState: [1, 2, 3, 4, 5],
        highlightIndices: [3, 4],
        sortedIndices: [],
        selectedOptionId: 'opt-a',
      },
      {
        title: 'Guided Solve Step 2: Flag swapped = true & Complete Verification',
        explanation:
          'Because a swap occurred, swapped must be marked true! Pass 2 runs next, observes zero swaps, and properly confirms monotonic order: [1, 2, 3, 4, 5]!',
        arrayState: [1, 2, 3, 4, 5],
        highlightIndices: [],
        sortedIndices: [0, 1, 2, 3, 4],
        selectedOptionId: 'opt-a',
        isComplete: true,
      },
    ];
  } else {
    // Level 5
    return [
      {
        title: 'Guided Solve Step 1: Inspect Duplicate Keys [4a, 2, 4b, 1]',
        explanation:
          'Notice duplicate cards 4a at index 0 and 4b at index 2. If the comparator uses >=, equal cards 4a and 4b will swap, violating stability! Click "Next Step" to correct the comparator to strict >.',
        arrayState: [4, 2, 4, 1],
        highlightIndices: [0, 2],
        sortedIndices: [],
        selectedOptionId: 'opt-a',
      },
      {
        title: 'Guided Solve Step 2: Stable Order Preserved → [1, 2, 4a, 4b]',
        explanation:
          'With the strict condition (arr[j] > arr[j+1]), 4a and 4b never cross each other. After bubbling 1 and 2, 4a remains before 4b in stable sorted order: [1, 2, 4, 4]!',
        arrayState: [1, 2, 4, 4],
        highlightIndices: [],
        sortedIndices: [0, 1, 2, 3],
        selectedOptionId: 'opt-a',
        isComplete: true,
      },
    ];
  }
}

export const FixAlgorithmGame: React.FC<FixAlgorithmGameProps> = ({
  level,
  onCompleteLevel,
  onBackToLevels,
  onNextLevel,
  onUseHint,
  onUseGuidedSolve,
}) => {
  // Generate level-specific scenarios
  const getScenario = (levelNum: number): QuestionScenario => {
    switch (levelNum) {
      case 1:
        return {
          prompt:
            'Bubble Sort Pass 1 is partially executed on [5, 9, 3, 7]. The pointer just finished comparing and swapping elements at indices 1 and 2. What operation must execute NEXT?',
          operationsTrace: [
            '1. Compare index 0 (5) and index 1 (9) -> 5 <= 9, KEEP.',
            '2. Compare index 1 (9) and index 2 (3) -> 9 > 3, SWAPPED to [5, 3, 9, 7].',
          ],
          swapIndices: [2, 3],
          options: [
            {
              id: 'opt-a',
              text: 'Compare index 2 (9) and index 3 (7), and swap them since 9 > 7.',
              isCorrect: true,
              explanation:
                'Correct! The Bubble Sort inner loop pointer advances from j=1 to j=2, comparing arr[2] (9) and arr[3] (7). Since 9 > 7, they swap to [5, 3, 7, 9].',
              resultingArray: [5, 3, 7, 9],
            },
            {
              id: 'opt-b',
              text: 'Lock element 9 at index 2 as permanently sorted.',
              isCorrect: false,
              explanation:
                'Incorrect. Elements only lock at the end of the full pass (index 3), not mid-array!',
              resultingArray: [5, 3, 9, 7],
            },
            {
              id: 'opt-c',
              text: 'Immediately restart from index 0 comparing 5 and 3.',
              isCorrect: false,
              explanation:
                'Incorrect. Bubble Sort does not restart early; it finishes the current pass all the way to the unsorted boundary.',
              resultingArray: [5, 3, 9, 7],
            },
          ],
        };
      case 2:
        return {
          prompt:
            'Selection Sort on [8, 29, 14, 37, 10] with sorted section [8]. A buggy function picked 14 as the minimum for Pass 2. What is the true minimum of the unsorted segment?',
          operationsTrace: [
            'Sorted prefix: [8] (index 0).',
            'Unsorted section to scan: [29, 14, 37, 10] (indices 1..4).',
            'Buggy scan prematurely selected 14.',
          ],
          swapIndices: [1, 4],
          options: [
            {
              id: 'opt-a',
              text: 'Card 10 at index 4 is the true minimum; swap 10 with 29 at index 1.',
              isCorrect: true,
              explanation:
                'Correct! 10 < 14 and 10 < 29. Selection Sort must check all elements in the unsorted section before committing.',
              resultingArray: [8, 10, 14, 37, 29],
            },
            {
              id: 'opt-b',
              text: 'Card 14 is already correct because it appeared earlier in the array.',
              isCorrect: false,
              explanation:
                'Incorrect! Selection sort looks for absolute minimum value, not first occurrence.',
              resultingArray: [8, 29, 14, 37, 10],
            },
            {
              id: 'opt-c',
              text: 'Card 8 should be swapped again with 10.',
              isCorrect: false,
              explanation:
                'Incorrect! Card 8 is in the already sorted prefix and should never be altered.',
              resultingArray: [8, 29, 14, 37, 10],
            },
          ],
        };
      case 3:
        return {
          prompt:
            'Insertion Sort on prefix [8, 15, 27] when key is 12. The program shifted 27 but stopped without comparing 15. What is the necessary fix?',
          operationsTrace: [
            'Sorted prefix: [8, 15, 27]. Key element: 12.',
            'Step 1: 27 > 12 -> shifted 27 to the right.',
            'Bug: Program attempted to drop 12 before testing 15!',
          ],
          swapIndices: [1, 3],
          options: [
            {
              id: 'opt-a',
              text: 'Compare 15 with 12; since 15 > 12, shift 15 right as well, then place 12 after 8.',
              isCorrect: true,
              explanation:
                'Correct! The while loop must continue while (j >= 0 && arr[j] > key). Since 15 > 12, 15 must shift right before 12 can be inserted.',
              resultingArray: [8, 12, 15, 27],
            },
            {
              id: 'opt-b',
              text: 'Swap 12 with 8 directly to save operations.',
              isCorrect: false,
              explanation: 'Incorrect. 8 <= 12, so 8 must stay to the left of 12.',
              resultingArray: [8, 15, 27, 12],
            },
            {
              id: 'opt-c',
              text: 'Leave 12 at the end and stop sorting.',
              isCorrect: false,
              explanation:
                'Incorrect. Insertion Sort must maintain the invariant of a sorted prefix on every iteration.',
              resultingArray: [8, 15, 27, 12],
            },
          ],
        };
      case 4:
        return {
          prompt:
            'In an adaptive Bubble Sort on [1, 2, 3, 5, 4], Pass 1 just performed a swap between 5 and 4, producing [1, 2, 3, 4, 5]. A buggy function left swapped = false. What must happen?',
          operationsTrace: [
            'Array: [1, 2, 3, 5, 4].',
            'Pass 1: Swapped 5 and 4 -> [1, 2, 3, 4, 5].',
            'Bug: swapped flag remained false instead of being updated to true!',
          ],
          swapIndices: [3, 4],
          options: [
            {
              id: 'opt-a',
              text: 'Set swapped = true so Pass 2 executes, making a full non-swapping verification pass before terminating.',
              isCorrect: true,
              explanation:
                'Correct! An adaptive Bubble Sort must set swapped = true whenever any swap occurs. This guarantees that another pass runs to confirm zero inversions remain before exiting.',
              resultingArray: [1, 2, 3, 4, 5],
            },
            {
              id: 'opt-b',
              text: 'Leave swapped = false so the algorithm can terminate immediately without checking.',
              isCorrect: false,
              explanation:
                'Incorrect! Terminating prematurely without a verifying pass can cause failure on partially unsorted inputs.',
              resultingArray: [1, 2, 3, 5, 4],
            },
            {
              id: 'opt-c',
              text: 'Swap 5 and 4 backwards back to [1, 2, 3, 5, 4].',
              isCorrect: false,
              explanation:
                'Incorrect! Reversing swaps destroys progress toward sorted order.',
              resultingArray: [1, 2, 3, 5, 4],
            },
          ],
        };
      default:
        // Level 5
        return {
          prompt:
            'When sorting [4a, 2, 4b, 1] with duplicate values 4a and 4b, a developer wrote the comparison condition as if (arr[j] >= arr[j+1]) swap(). What invariant does this break and how should it be fixed?',
          operationsTrace: [
            'Array contains duplicate keys: 4a (index 0) and 4b (index 2).',
            'Buggy condition: if (arr[j] >= arr[j+1]) causes equal elements to swap!',
          ],
          swapIndices: [0, 2],
          options: [
            {
              id: 'opt-a',
              text: 'Change >= to strictly > (arr[j] > arr[j+1]) so equal elements never swap, preserving stability.',
              isCorrect: true,
              explanation:
                'Correct! To maintain stability, equal keys must never swap past each other. Using strict inequality (>) ensures duplicate elements maintain their original relative input sequence.',
              resultingArray: [1, 2, 4, 4],
            },
            {
              id: 'opt-b',
              text: 'Keep >= and delete the duplicate element from the array entirely.',
              isCorrect: false,
              explanation:
                'Incorrect! Data structures must preserve all customer records and data points without dropping duplicates.',
              resultingArray: [4, 2, 4, 1],
            },
            {
              id: 'opt-c',
              text: 'Reverse the array so 4b is in front of 4a.',
              isCorrect: false,
              explanation:
                'Incorrect! That would intentionally violate the stability requirement.',
              resultingArray: [4, 2, 4, 1],
            },
          ],
        };
    }
  };

  const scenario = getScenario(level.levelNumber);
  const guidedSteps = useMemo(
    () => buildFixGuidedSteps(level.levelNumber, level.initialArray),
    [level.levelNumber, level.initialArray]
  );

  const [cards, setCards] = useState<SortCardObject[]>(() =>
    level.initialArray.map((val, idx) => ({
      id: `fix-card-${val}-${idx}-${Date.now()}`,
      value: val,
      position: idx,
    }))
  );

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [dragHoverIndex, setDragHoverIndex] = useState<number | null>(null);

  // In-game Guided Solve state (no modal/popup — runs inside the game area)
  const [isGuidedMode, setIsGuidedMode] = useState<boolean>(false);
  const [guidedStepIndex, setGuidedStepIndex] = useState<number>(0);

  // Reset state when level changes
  useEffect(() => {
    setCards(
      level.initialArray.map((val, idx) => ({
        id: `fix-card-${val}-${idx}-${Date.now()}`,
        value: val,
        position: idx,
      }))
    );
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
    setIsSolved(false);
    setIsGuidedMode(false);
    setGuidedStepIndex(0);
    setScore(500);
    setElapsedSeconds(0);
    setLevelStartTime(Date.now());
    setTimerActive(true);
    setHintTier(0);
    setCompletionSummary(null);
  }, [level.levelNumber, level.initialArray]);

  // Scoring & Accurate Timer
  const [score, setScore] = useState<number>(500);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [levelStartTime, setLevelStartTime] = useState<number>(() => Date.now());
  const [timerActive, setTimerActive] = useState<boolean>(true);
  const [hintTier, setHintTier] = useState<number>(0);
  const [showHintModal, setShowHintModal] = useState<boolean>(false);
  const [completionSummary, setCompletionSummary] = useState<{
    finalScore: number;
    timeTaken: number;
  } | null>(null);

  const computeFinalScore = (rawScore: number, timeSec: number): number => {
    const targetSeconds = 25;
    const timeBonus = timeSec <= targetSeconds ? (targetSeconds - timeSec) * 4 : 0;
    const timePenalty = timeSec > targetSeconds ? (timeSec - targetSeconds) * 3 : 0;
    return Math.max(0, rawScore + timeBonus - timePenalty);
  };

  useEffect(() => {
    if (!timerActive || isSolved) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - levelStartTime) / 1000)));
    }, 250);
    return () => clearInterval(interval);
  }, [timerActive, isSolved, levelStartTime]);

  const applyGuidedStepState = (step: GuidedFixStep, currentScoreVal = score) => {
    const newCards: SortCardObject[] = step.arrayState.map((val, idx) => ({
      id: `fix-card-${val}-${idx}-${Date.now()}`,
      value: val,
      position: idx,
      isSorted: step.sortedIndices.includes(idx),
    }));
    setCards(newCards);
    if (step.selectedOptionId) {
      setSelectedOptionId(step.selectedOptionId);
    }
    if (step.isComplete && !isSolved) {
      const finalTimeSec = Math.max(1, Math.floor((Date.now() - levelStartTime) / 1000));
      setElapsedSeconds(finalTimeSec);
      const finalCalculatedScore = computeFinalScore(currentScoreVal, finalTimeSec);
      setScore(finalCalculatedScore);
      setCompletionSummary({ finalScore: finalCalculatedScore, timeTaken: finalTimeSec });
      setIsAnswerSubmitted(true);
      setIsSolved(true);
      setTimerActive(false);
      soundEffects.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      onCompleteLevel(
        level.xpReward,
        finalCalculatedScore,
        level.levelNumber === 5
          ? `All 5 Levels Mastered • Final Score: ${finalCalculatedScore} pts • Time: ${finalTimeSec}s`
          : `Level ${level.levelNumber} Completed • Score: ${finalCalculatedScore} pts • Time: ${finalTimeSec}s`
      );
      setTimeout(() => {
        if (onNextLevel && level.levelNumber < 5) {
          onNextLevel();
        } else {
          onBackToLevels();
        }
      }, 1200);
    }
  };

  const handleToggleGuidedSolve = () => {
    soundEffects.playClick();
    if (!isGuidedMode) {
      setIsGuidedMode(true);
      setScore((s) => Math.max(0, s - 50));
      onUseGuidedSolve?.();
      // Continue from current guidedStepIndex without resetting the current cards state
      const currentArrStr = cards.map((c) => c.value).join(',');
      const matchingIdx = guidedSteps.findIndex(
        (s) => s.arrayState.join(',') === currentArrStr
      );
      if (matchingIdx !== -1) {
        setGuidedStepIndex(matchingIdx);
        if (guidedSteps[matchingIdx].selectedOptionId && !selectedOptionId) {
          setSelectedOptionId(guidedSteps[matchingIdx].selectedOptionId!);
        }
      } else if (!selectedOptionId && guidedSteps[guidedStepIndex]?.selectedOptionId) {
        setSelectedOptionId(guidedSteps[guidedStepIndex].selectedOptionId!);
      }
    } else {
      setIsGuidedMode(false);
    }
  };

  const handleGuidedNextStep = () => {
    if (!isGuidedMode) return;
    soundEffects.playPush();
    const penalizedScore = Math.max(0, score - 25);
    setScore(penalizedScore);
    const nextIdx = Math.min(guidedStepIndex + 1, guidedSteps.length - 1);
    setGuidedStepIndex(nextIdx);
    applyGuidedStepState(guidedSteps[nextIdx], penalizedScore);
  };

  // Drag-to-swap directly on the physical cards
  const handleCardDragSwap = (fromIndex: number, direction: 'left' | 'right' | number) => {
    setDragHoverIndex(null);
    if (isSolved) return;

    if (isGuidedMode) {
      handleGuidedNextStep();
      return;
    }

    const targetIndex = typeof direction === 'number' ? direction : (direction === 'right' ? fromIndex + 1 : fromIndex - 1);
    if (targetIndex < 0 || targetIndex >= cards.length) return;

    soundEffects.playPush();
    const updated = [...cards];
    const temp = updated[fromIndex];
    updated[fromIndex] = { ...updated[targetIndex], position: fromIndex };
    updated[targetIndex] = { ...temp, position: targetIndex };
    setCards(updated);

    // If the user dragged the target bug pair, automatically select the correct fix option
    setSelectedOptionId('opt-a');
  };

  const handleSelectOption = (optId: string) => {
    if (isSolved) return;
    soundEffects.playClick();
    setSelectedOptionId(optId);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOptionId || isAnswerSubmitted) return;

    const chosen = scenario.options.find((o) => o.id === selectedOptionId);
    if (!chosen) return;

    setIsAnswerSubmitted(true);

    if (chosen.isCorrect) {
      soundEffects.playCorrect();
      const finalTimeSec = Math.max(1, Math.floor((Date.now() - levelStartTime) / 1000));
      setElapsedSeconds(finalTimeSec);
      const rawWithSolveBonus = score + 80;
      const finalCalculatedScore = computeFinalScore(rawWithSolveBonus, finalTimeSec);
      setScore(finalCalculatedScore);
      setCompletionSummary({ finalScore: finalCalculatedScore, timeTaken: finalTimeSec });
      setIsSolved(true);
      setTimerActive(false);

      // Animate the resulting fixed array directly on the physical cards!
      const newCards = chosen.resultingArray.map((val, idx) => ({
        id: `fix-card-${val}-${idx}-${Date.now()}`,
        value: val,
        position: idx,
        isSorted: true,
      }));
      setCards(newCards);

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      onCompleteLevel(
        level.xpReward,
        finalCalculatedScore,
        level.levelNumber === 5
          ? `All 5 Levels Mastered • Final Score: ${finalCalculatedScore} pts • Time: ${finalTimeSec}s`
          : `Level ${level.levelNumber} Completed • Score: ${finalCalculatedScore} pts • Time: ${finalTimeSec}s`
      );

      setTimeout(() => {
        if (onNextLevel && level.levelNumber < 5) {
          onNextLevel();
        } else {
          onBackToLevels();
        }
      }, 1200);
    } else {
      soundEffects.playError();
      setScore((s) => Math.max(0, s - 30));
    }
  };

  const handleRetryQuestion = () => {
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
  };

  const handleUseHint = () => {
    soundEffects.playClick();
    const nextTier = Math.min(hintTier + 1, 3);
    setHintTier(nextTier);
    setScore((s) => Math.max(0, s - 40));
    setShowHintModal(true);
    onUseHint?.();
  };

  const currentGuidedStep = isGuidedMode ? guidedSteps[guidedStepIndex] : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* ─── HEADER BAR ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundEffects.playClick();
              onBackToLevels();
            }}
            className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer"
          >
            ← Levels
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>FIX THE ALGORITHM</span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                LV {level.levelNumber}
              </span>
              {isGuidedMode && (
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-600 text-white">
                  GUIDED SOLVE ACTIVE
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detect algorithm anomalies, invariant violations, and execute the correction.
            </p>
          </div>
        </div>

        {/* Hint + Guided Solve ON/OFF + Metrics */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleUseHint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-amber-400 text-slate-700 dark:text-slate-300 hover:text-amber-600 font-bold text-xs shadow-2xs transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Hint</span>
            </button>

            <button
              onClick={handleToggleGuidedSolve}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs transition-colors cursor-pointer ${
                isGuidedMode
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 dark:bg-blue-950/70 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{isGuidedMode ? 'OFF' : 'Guided Solve'}</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{elapsedSeconds}s</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── PROBLEM SCENARIO & TRACE CARD ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-rose-600 dark:text-rose-400 tracking-wider">
          <Bug className="w-4 h-4" />
          <span>EXECUTION TRACE & BUG DETECTION</span>
        </div>

        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
          {scenario.prompt}
        </h2>

        {/* Operations Trace Log Box */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 font-mono text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Execution History:
          </div>
          {scenario.operationsTrace.map((trace, i) => (
            <div key={i} className="leading-relaxed">
              {trace}
            </div>
          ))}
        </div>

        {/* In-game Guided Solve Step Banner */}
        {currentGuidedStep && (
          <div className="p-4 rounded-2xl bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-extrabold text-blue-900 dark:text-blue-200">
                {currentGuidedStep.title}
              </h4>
              <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                {currentGuidedStep.explanation}
              </p>
            </div>
            {!isSolved && (
              <button
                onClick={handleGuidedNextStep}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Current State Cards Row */}
        <div className="pt-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Current Physical Cards (Hold & Drag to Swap):
          </div>
          <div className="flex items-center justify-center gap-2.5 py-4 overflow-x-auto">
            {cards.map((card, idx) => {
              const isHighlighted = currentGuidedStep
                ? currentGuidedStep.highlightIndices.includes(idx)
                : scenario.swapIndices.includes(idx);

              return (
                <SortingCard
                  key={card.id}
                  card={card}
                  index={idx}
                  isComparing={isHighlighted && !isSolved}
                  isSelected={isSolved}
                  isDraggable={!isSolved && !card.isSorted}
                  isDragTarget={dragHoverIndex === idx}
                  onDragSwap={handleCardDragSwap}
                  onDragHoverTarget={(dir) => {
                    if (!dir) {
                      setDragHoverIndex(null);
                    } else {
                      setDragHoverIndex(dir === 'right' ? idx + 1 : idx - 1);
                    }
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── MULTIPLE CHOICE DEBUG OPTIONS ─── */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Select the Algorithmic Fix:
        </h3>

        <div className="space-y-3">
          {scenario.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            const showFeedback = isAnswerSubmitted && isSelected;

            return (
              <div
                key={opt.id}
                onClick={() => handleSelectOption(opt.id)}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? isAnswerSubmitted
                      ? opt.isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500'
                        : 'bg-rose-50 dark:bg-rose-950/60 border-rose-500'
                      : 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-400/40'
                    : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                    {opt.text}
                  </span>
                  {isSelected && (
                    <div className="shrink-0 mt-0.5">
                      {isAnswerSubmitted ? (
                        opt.isCorrect ? (
                          <Check className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-rose-600" />
                        )
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-rose-600" />
                      )}
                    </div>
                  )}
                </div>

                {showFeedback && (
                  <p
                    className={`text-xs mt-2.5 font-medium leading-relaxed ${
                      opt.isCorrect
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {opt.explanation}
                    {opt.isCorrect && completionSummary && (
                      <span className="block mt-1 font-bold">
                        Final Score: {completionSummary.finalScore} pts • Time Taken: {completionSummary.timeTaken}s
                      </span>
                    )}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── SUBMIT OR RETRY BUTTON ─── */}
      <div className="flex items-center justify-end pt-2">
        <div className="flex items-center gap-3">
          {isGuidedMode && !isSolved && (
            <button
              onClick={handleGuidedNextStep}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {isAnswerSubmitted && !isSolved && (
            <button
              onClick={handleRetryQuestion}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Try Another Option
            </button>
          )}

          {!isSolved && (
            <button
              disabled={!selectedOptionId || isAnswerSubmitted}
              onClick={handleSubmitAnswer}
              className={`px-7 py-3 rounded-2xl font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                selectedOptionId && !isAnswerSubmitted
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-rose-500/25 active:scale-95'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>APPLY BUG FIX</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── HINT MODAL ─── */}
      <AnimatePresence>
        {showHintModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Algorithm Fix Hint (Tier {hintTier}/3)
                  </h3>
                  <p className="text-xs text-slate-500">
                    {hintTier === 1
                      ? 'General Concept'
                      : hintTier === 2
                      ? 'Specific Guidance'
                      : 'Direct Clue'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {level.hints[hintTier - 1] || level.hints[0]}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowHintModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
