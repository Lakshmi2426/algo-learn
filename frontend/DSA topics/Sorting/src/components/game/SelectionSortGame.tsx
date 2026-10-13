import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowRightLeft,
  Check,
  AlertTriangle,
  RotateCcw,
  Trophy,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
  Lightbulb,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SortCardObject, SortLevelConfig, UserProgress } from '../../types';
import { SortingCard } from './SortingCard';
import { soundEffects } from '../../services/sound';

interface SelectionSortGameProps {
  level: SortLevelConfig;
  progress: UserProgress;
  onCompleteLevel: (earnedXP: number, earnedScore?: number, performanceMetrics?: string) => void;
  onBackToLevels: () => void;
  onNextLevel?: () => void;
  initialGuidedMode?: boolean;
  onUseHint?: () => void;
  onUseGuidedSolve?: () => void;
}

type SelectionStep =
  | 'FIND_MINIMUM'
  | 'MINIMUM_FOUND'
  | 'ANIMATING_SWAP'
  | 'PASS_COMPLETE'
  | 'GAME_COMPLETE';

export const SelectionSortGame: React.FC<SelectionSortGameProps> = ({
  level,
  onCompleteLevel,
  onBackToLevels,
  onNextLevel,
  initialGuidedMode = false,
  onUseHint,
  onUseGuidedSolve,
}) => {
  const initializeCards = useCallback((arr: number[]): SortCardObject[] => {
    return arr.map((val, idx) => ({
      id: `card-sel-${val}-${idx}-${Date.now()}`,
      value: val,
      position: idx,
      isSorted: false,
    }));
  }, []);

  const [cards, setCards] = useState<SortCardObject[]>(() => initializeCards(level.initialArray));
  const [sortedIndex, setSortedIndex] = useState<number>(0); // cards[0...sortedIndex-1] are sorted
  const [stepState, setStepState] = useState<SelectionStep>('FIND_MINIMUM');
  const [selectedMinIndex, setSelectedMinIndex] = useState<number | null>(null);
  const [dragHoverIndex, setDragHoverIndex] = useState<number | null>(null);

  // In-game Guided Solve mode (no popup/modal — runs directly inside the existing game area)
  const [isGuidedMode, setIsGuidedMode] = useState<boolean>(initialGuidedMode);

  // Telemetry
  const [score, setScore] = useState<number>(500);
  const [moves, setMoves] = useState<number>(0);
  const [comparisonsCount, setComparisonsCount] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(true);
  const [levelStartTime, setLevelStartTime] = useState<number>(() => Date.now());
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [guidedUsesCount, setGuidedUsesCount] = useState<number>(() => (initialGuidedMode ? 1 : 0));
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Hints
  const [hintTier, setHintTier] = useState<number>(0);
  const [showHintModal, setShowHintModal] = useState<boolean>(false);

  const computeFinalScore = useCallback(
    (currentRawScore: number, _timeSec: number): number => {
      return Math.max(0, currentRawScore);
    },
    []
  );

  // Contextual feedback
  const [feedback, setFeedback] = useState<{
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
  }>({
    type: 'info',
    title: 'Selection Sort Initialized',
    message: 'Find the minimum card in the unsorted section and drag it to the first unsorted slot (#0).',
  });

  // Compute true minimum in unsorted portion
  const getTrueMinimumIndexFor = useCallback((cardList: SortCardObject[], startIdx: number): number => {
    let minIdx = startIdx;
    for (let i = startIdx + 1; i < cardList.length; i++) {
      if (cardList[i].value < cardList[minIdx].value) {
        minIdx = i;
      }
    }
    return minIdx;
  }, []);

  const getTrueMinimumIndex = useCallback((): number => {
    return getTrueMinimumIndexFor(cards, sortedIndex);
  }, [cards, sortedIndex, getTrueMinimumIndexFor]);

  // Reset state when level changes
  useEffect(() => {
    const initial = initializeCards(level.initialArray);
    setCards(initial);
    setSortedIndex(0);
    setStepState('FIND_MINIMUM');
    setSelectedMinIndex(null);
    setScore(initialGuidedMode ? 450 : 500);
    setMoves(0);
    setComparisonsCount(0);
    setElapsedSeconds(0);
    setLevelStartTime(Date.now());
    setTimerActive(true);
    setHintTier(0);
    setHintsUsed(0);
    setGuidedUsesCount(initialGuidedMode ? 1 : 0);

    if (isGuidedMode) {
      const minIdx = getTrueMinimumIndexFor(initial, 0);
      setFeedback({
        type: 'info',
        title: `Guided Solve • Pass 1: Scan Unsorted Section [${initial.map((c) => c.value).join(', ')}]`,
        message: `Compare all unsorted elements to find the minimum value. The smallest value is ${initial[minIdx]?.value} at index #${minIdx}. Click "Next Step" to select ${initial[minIdx]?.value} as the minimum.`,
      });
    } else {
      setFeedback({
        type: 'info',
        title: `Level ${level.levelNumber}: ${level.title}`,
        message: 'Hold and drag the minimum card in the unsorted section to slot #0 (or click the minimum card).',
      });
    }
  }, [level.levelNumber, level.initialArray, initializeCards]);

  // Accurate Timer
  useEffect(() => {
    if (!timerActive || stepState === 'GAME_COMPLETE') return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - levelStartTime) / 1000)));
    }, 250);
    return () => clearInterval(interval);
  }, [timerActive, stepState, levelStartTime]);

  const triggerShake = () => {
    soundEffects.playError();
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  // Toggle in-game Guided Solve from the CURRENT state without resetting
  const handleToggleGuidedSolve = () => {
    soundEffects.playClick();
    if (!isGuidedMode) {
      setIsGuidedMode(true);
      setGuidedUsesCount((g) => g + 1);
      setScore((s) => Math.max(0, s - 50));
      onUseGuidedSolve?.();
      if (stepState !== 'GAME_COMPLETE') {
        const minIdx = getTrueMinimumIndexFor(cards, sortedIndex);
        const minVal = cards[minIdx]?.value;
        const targetVal = cards[sortedIndex]?.value;
        if (stepState === 'MINIMUM_FOUND' && selectedMinIndex !== null) {
          setFeedback({
            type: 'info',
            title: `Guided Solve • Pass ${sortedIndex + 1}: Swap Minimum ${cards[selectedMinIndex]?.value} into Slot #${sortedIndex}`,
            message: `${cards[selectedMinIndex]?.value} is selected as the minimum. Click "Next Step" (or drag ${cards[selectedMinIndex]?.value} to slot #${sortedIndex}) to swap it with ${targetVal}.`,
          });
        } else {
          setFeedback({
            type: 'info',
            title: `Guided Solve • Pass ${sortedIndex + 1}: Find Minimum in [${cards.slice(sortedIndex).map((c) => c.value).join(', ')}]`,
            message: `Scan the unsorted elements from index #${sortedIndex} to #${cards.length - 1}. The smallest element is ${minVal} at index #${minIdx}. Click "Next Step" to select ${minVal} as the minimum.`,
          });
        }
      }
    } else {
      setIsGuidedMode(false);
      if (stepState !== 'GAME_COMPLETE') {
        setFeedback({
          type: 'info',
          title: `Pass ${sortedIndex + 1}`,
          message:
            selectedMinIndex !== null
              ? `Minimum ${cards[selectedMinIndex]?.value} selected! Hold and drag [${cards[selectedMinIndex]?.value}] into slot #${sortedIndex}.`
              : `Hold and drag the minimum card in the unsorted section into slot #${sortedIndex}.`,
        });
      }
    }
  };

  // Execute the physical placement/swap of minIdx into sortedIndex
  const executePlacementWithMin = (minIdxToUse: number, guidedActive = isGuidedMode) => {
    if (stepState === 'GAME_COMPLETE' || stepState === 'ANIMATING_SWAP') return;

    soundEffects.playPush();
    setStepState('ANIMATING_SWAP');
    setMoves((m) => m + 1);
    const updatedRawScore = guidedActive ? Math.max(0, score - 15) : score + 50;
    setScore(updatedRawScore);

    const newCards = [...cards];
    const minCard = newCards[minIdxToUse];
    const targetCard = newCards[sortedIndex];

    // Physically swap
    newCards[sortedIndex] = { ...minCard, isSorted: true, isMinimum: false };
    if (minIdxToUse !== sortedIndex) {
      newCards[minIdxToUse] = { ...targetCard, isMinimum: false };
      newCards[minIdxToUse].position = minIdxToUse;
    }
    newCards[sortedIndex].position = sortedIndex;

    setCards(newCards);

    const nextSortedIndex = sortedIndex + 1;

    // Check if finished
    if (nextSortedIndex >= cards.length - 1) {
      const finalTimeSec = Math.max(1, Math.floor((Date.now() - levelStartTime) / 1000));
      setElapsedSeconds(finalTimeSec);
      const allSorted = newCards.map((c) => ({ ...c, isSorted: true, isMinimum: false }));
      setCards(allSorted);
      setSortedIndex(cards.length);
      setSelectedMinIndex(null);
      setStepState('GAME_COMPLETE');
      setTimerActive(false);
      const finalCalculatedScore = computeFinalScore(updatedRawScore, finalTimeSec);
      setScore(finalCalculatedScore);
      soundEffects.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      onCompleteLevel(
        level.xpReward,
        finalCalculatedScore,
        level.levelNumber === 5
          ? `All 5 Levels Mastered • Final Score: ${finalCalculatedScore} pts • Time: ${finalTimeSec}s`
          : `Level ${level.levelNumber} Completed • Score: ${finalCalculatedScore} pts • Time: ${finalTimeSec}s`
      );
      setFeedback({
        type: 'success',
        title: `Level ${level.levelNumber} Complete! Final Score: ${finalCalculatedScore} pts • Time Taken: ${finalTimeSec}s`,
        message:
          level.levelNumber < 5
            ? `Final Sorted Array: [${allSorted.map((c) => c.value).join(', ')}] • Score: ${finalCalculatedScore} pts in ${finalTimeSec}s. Advancing to Level ${level.levelNumber + 1}...`
            : `Final Sorted Array: [${allSorted.map((c) => c.value).join(', ')}] • Score: ${finalCalculatedScore} pts in ${finalTimeSec}s. All levels mastered!`,
      });

      setTimeout(() => {
        if (onNextLevel && level.levelNumber < 5) {
          onNextLevel();
        } else {
          onBackToLevels();
        }
      }, 1100);
      return;
    }

    if (guidedActive) {
      setSortedIndex(nextSortedIndex);
      setSelectedMinIndex(null);
      setStepState('FIND_MINIMUM');
      const nextMinIdx = getTrueMinimumIndexFor(newCards, nextSortedIndex);
      const nextMinVal = newCards[nextMinIdx]?.value;
      setFeedback({
        type: 'success',
        title:
          minIdxToUse === sortedIndex
            ? `Locked ${minCard.value} at #${sortedIndex} → Pass ${nextSortedIndex + 1}: Scan Unsorted Section`
            : `Swapped ${minCard.value} ⇄ ${targetCard.value} → Pass ${nextSortedIndex + 1}: Scan Unsorted Section`,
        message: `${minCard.value} is now locked at index #${sortedIndex}. Next, scan remaining unsorted elements [${newCards
          .slice(nextSortedIndex)
          .map((c) => c.value)
          .join(', ')}] — the next minimum is ${nextMinVal} at index #${nextMinIdx}. Click "Next Step" to select it.`,
      });
    } else {
      setFeedback({
        type: 'success',
        title: 'Minimum Swapped into Place!',
        message: `Card ${minCard.value} is now locked in sorted position #${sortedIndex}.`,
      });

      setTimeout(() => {
        setSortedIndex(nextSortedIndex);
        setSelectedMinIndex(null);
        setStepState('FIND_MINIMUM');
        setFeedback({
          type: 'info',
          title: `Pass ${nextSortedIndex + 1}`,
          message: `Hold and drag the minimum card in the remaining unsorted section to slot #${nextSortedIndex}.`,
        });
      }, 550);
    }
  };

  // Drag-to-swap handler for Selection Sort
  const handleDragSwap = (fromIdx: number, toIdx: number) => {
    if (stepState === 'GAME_COMPLETE' || stepState === 'ANIMATING_SWAP') return;

    if (fromIdx < sortedIndex || toIdx < sortedIndex) {
      soundEffects.playError();
      setFeedback({
        type: 'warning',
        title: 'Already in Sorted Section',
        message: '🔒 Cards in the sorted left section are locked. Drag the minimum unsorted card into the first unsorted slot!',
      });
      return;
    }

    const trueMinIdx = getTrueMinimumIndex();
    const isDraggingMinToTarget =
      (fromIdx === trueMinIdx && toIdx === sortedIndex) ||
      (fromIdx === sortedIndex && toIdx === trueMinIdx);

    if (!isDraggingMinToTarget) {
      triggerShake();
      setScore((s) => Math.max(0, s - 25));
      if (fromIdx !== trueMinIdx && toIdx === sortedIndex) {
        setFeedback({
          type: 'error',
          title: 'Not the Minimum!',
          message: `❌ ${cards[fromIdx].value} is not the minimum of the unsorted section. Find the smallest value and drag it to slot #${sortedIndex}!`,
        });
      } else {
        setFeedback({
          type: 'error',
          title: 'Target Slot Rule',
          message: `⚠️ In Selection Sort, drag the minimum card (${cards[trueMinIdx].value}) directly to the first unsorted slot (#${sortedIndex}).`,
        });
      }
      return;
    }

    setComparisonsCount((c) => c + (cards.length - sortedIndex));
    executePlacementWithMin(trueMinIdx, isGuidedMode);
  };

  // Card click handler (supports selecting minimum or confirming when minimum is already at sortedIndex)
  const handleCardClick = (clickedIdx: number) => {
    if (stepState === 'GAME_COMPLETE' || stepState === 'ANIMATING_SWAP') return;

    if (clickedIdx < sortedIndex || cards[clickedIdx].isSorted) {
      soundEffects.playError();
      setFeedback({
        type: 'warning',
        title: 'Already in Sorted Section',
        message: '🔒 This card is already locked in the sorted partition. Look at the unsorted cards on the right!',
      });
      return;
    }

    const trueMinIdx = getTrueMinimumIndex();

    if (stepState === 'FIND_MINIMUM') {
      setComparisonsCount((c) => c + (cards.length - sortedIndex));

      if (clickedIdx === trueMinIdx) {
        soundEffects.playCorrect();
        if (trueMinIdx === sortedIndex) {
          // Minimum is already in the first unsorted slot (#sortedIndex), lock it directly!
          executePlacementWithMin(trueMinIdx, isGuidedMode);
        } else {
          setSelectedMinIndex(clickedIdx);
          setStepState('MINIMUM_FOUND');
          setScore((s) => s + 30);
          setFeedback({
            type: 'success',
            title: `Minimum Found: ${cards[clickedIdx].value}`,
            message: `Now hold and drag [${cards[clickedIdx].value}] to slot #${sortedIndex} (${cards[sortedIndex].value}) to swap them!`,
          });
        }
      } else {
        triggerShake();
        setScore((s) => Math.max(0, s - 25));
        setFeedback({
          type: 'error',
          title: 'Not the Minimum',
          message: `❌ ${cards[clickedIdx].value} is not the smallest card in the unsorted section. Compare all numbers carefully!`,
        });
      }
    } else if (stepState === 'MINIMUM_FOUND' && selectedMinIndex !== null) {
      if (clickedIdx === sortedIndex || clickedIdx === selectedMinIndex) {
        executePlacementWithMin(selectedMinIndex, isGuidedMode);
      }
    }
  };

  // Guided Solve "Next Step" inside the game screen
  const handleGuidedNextStep = () => {
    if (stepState === 'GAME_COMPLETE' || stepState === 'ANIMATING_SWAP') return;
    soundEffects.playClick();
    setGuidedUsesCount((g) => g + 1);

    const trueMinIdx = getTrueMinimumIndex();

    if (stepState === 'FIND_MINIMUM') {
      // Step 1 of pass: Highlight & select the minimum
      soundEffects.playCorrect();
      setComparisonsCount((c) => c + (cards.length - sortedIndex));
      setScore((s) => Math.max(0, s - 15));
      setSelectedMinIndex(trueMinIdx);
      setStepState('MINIMUM_FOUND');
      const minVal = cards[trueMinIdx]?.value;
      const targetVal = cards[sortedIndex]?.value;
      setFeedback({
        type: 'info',
        title: `Minimum Selected: ${minVal} at Index #${trueMinIdx}`,
        message:
          trueMinIdx === sortedIndex
            ? `${minVal} is the smallest value and is already at the first unsorted slot (#${sortedIndex}). Click "Next Step" to lock ${minVal} in the sorted section.`
            : `${minVal} is the smallest value in the unsorted section. It must be swapped into the first unsorted slot (#${sortedIndex}, currently holding ${targetVal}). Click "Next Step" (or drag ${minVal} to ${targetVal}) to perform the swap.`,
      });
    } else if (stepState === 'MINIMUM_FOUND') {
      // Step 2 of pass: Perform the swap and lock
      executePlacementWithMin(selectedMinIndex ?? trueMinIdx, true);
    }
  };

  const handleConfirmReset = () => {
    const initial = initializeCards(level.initialArray);
    setCards(initial);
    setSortedIndex(0);
    setStepState('FIND_MINIMUM');
    setSelectedMinIndex(null);
    setScore(isGuidedMode ? 450 : 500);
    setMoves(0);
    setComparisonsCount(0);
    setElapsedSeconds(0);
    setLevelStartTime(Date.now());
    setTimerActive(true);
    setHintTier(0);
    setHintsUsed(0);
    setGuidedUsesCount(isGuidedMode ? 1 : 0);
    if (isGuidedMode) {
      const minIdx = getTrueMinimumIndexFor(initial, 0);
      setFeedback({
        type: 'info',
        title: `Guided Solve • Pass 1: Scan Unsorted Section [${initial.map((c) => c.value).join(', ')}]`,
        message: `Compare all unsorted elements to find the minimum value (${initial[minIdx]?.value} at index #${minIdx}). Click "Next Step" to select it.`,
      });
    } else {
      setFeedback({
        type: 'info',
        title: 'Challenge Reset',
        message: 'Hold and drag the minimum element in the unsorted section to slot #0.',
      });
    }
  };

  const handleUseHint = () => {
    soundEffects.playClick();
    const nextTier = Math.min(hintTier + 1, 3);
    setHintTier(nextTier);
    setHintsUsed((h) => h + 1);
    setScore((s) => Math.max(0, s - 40));
    setShowHintModal(true);
    onUseHint?.();
  };

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
            className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer"
          >
            ← Levels
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>SELECTION SORT</span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                LV {level.levelNumber}
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Task: Find the minimum card and drag it to the front of the unsorted section.
            </p>
          </div>
        </div>

        {/* Hint + Guided Solve ON/OFF + Live Metrics */}
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
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-blue-50 dark:bg-blue-950/70 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{isGuidedMode ? 'OFF' : 'Guided Solve'}</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-slate-700 dark:text-slate-300">
              Swaps: <span className="font-mono text-slate-900 dark:text-white">{moves}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── EDUCATIONAL FEEDBACK CALLOUT ─── */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          feedback.type === 'error'
            ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-100'
            : feedback.type === 'success'
            ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-100'
            : feedback.type === 'warning'
            ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-100'
            : 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-100'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {feedback.type === 'error' ? (
                <ShieldAlert className="w-5 h-5 text-rose-600" />
              ) : feedback.type === 'success' ? (
                <Check className="w-5 h-5 text-emerald-600" />
              ) : (
                <Lightbulb className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold tracking-tight">{feedback.title}</h4>
              <p className="text-xs sm:text-sm opacity-90 mt-0.5 leading-relaxed font-normal">{feedback.message}</p>
            </div>
          </div>

          {isGuidedMode && stepState !== 'GAME_COMPLETE' && (
            <button
              onClick={handleGuidedNextStep}
              className="shrink-0 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── WORKSPACE WITH VISIBLE SORTED/UNSORTED PARTITION ─── */}
      <div
        className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs relative ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Partition Indicators */}
        <div className="grid grid-cols-2 gap-4 pb-4 mb-6 border-b border-slate-100 dark:border-slate-800 text-xs font-bold">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>SORTED SECTION ({sortedIndex} items)</span>
          </div>
          <div className="flex items-center justify-end gap-2 text-blue-600 dark:text-blue-400">
            <span>UNSORTED SECTION ({cards.length - sortedIndex} items)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>
        </div>

        {/* Cards Display with Partition Divider */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 py-6 overflow-x-auto custom-scrollbar min-h-[160px]">
          {cards.map((card, idx) => {
            const isMin = selectedMinIndex === idx;
            const isTarget = stepState !== 'GAME_COMPLETE' && idx === sortedIndex;

            return (
              <React.Fragment key={card.id}>
                {/* Visual Partition Divider Line */}
                {idx === sortedIndex && idx > 0 && (
                  <div className="flex flex-col items-center justify-center px-1 shrink-0">
                    <div className="w-0.5 h-24 bg-gradient-to-b from-emerald-500 to-blue-500 rounded-full" />
                    <span className="text-[9px] font-mono font-bold text-slate-400 mt-1">DIVIDER</span>
                  </div>
                )}

                <SortingCard
                  card={{ ...card, isMinimum: isMin }}
                  index={idx}
                  isSelected={isMin}
                  isDragCandidate={isMin}
                  isDropTarget={isTarget && !card.isSorted}
                  isDragHovered={dragHoverIndex === idx}
                  onCardClick={() => handleCardClick(idx)}
                  onDragSwap={handleDragSwap}
                  onDragHoverIndex={setDragHoverIndex}
                />
              </React.Fragment>
            );
          })}
        </div>

        {/* Action Bar */}
        <AnimatePresence>
          {stepState !== 'GAME_COMPLETE' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3"
            >
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 text-center">
                {selectedMinIndex !== null
                  ? `Minimum ${cards[selectedMinIndex]?.value} selected! Hold and drag [${cards[selectedMinIndex]?.value}] to slot #${sortedIndex} (${cards[sortedIndex]?.value}) to swap them.`
                  : `Hold and drag the smallest card in the unsorted section directly onto slot #${sortedIndex} (${cards[sortedIndex]?.value})!`}
              </p>

              {isGuidedMode && (
                <button
                  onClick={handleGuidedNextStep}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 cursor-pointer active:scale-95 transition-all flex items-center gap-2"
                >
                  <span>[ NEXT STEP ]</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
                    Selection Sort Hint (Tier {hintTier}/3)
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
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer"
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

