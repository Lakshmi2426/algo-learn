import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowRightLeft,
  Check,
  AlertTriangle,
  RotateCcw,
  Lightbulb,
  Trophy,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SortCardObject, SortLevelConfig, UserProgress } from '../../types';
import { SortingCard } from './SortingCard';
import { soundEffects } from '../../services/sound';

interface BubbleSortGameProps {
  level: SortLevelConfig;
  progress: UserProgress;
  onCompleteLevel: (earnedXP: number, earnedScore?: number, performanceMetrics?: string) => void;
  onBackToLevels: () => void;
  onNextLevel?: () => void;
  initialGuidedMode?: boolean;
  onUseHint?: () => void;
  onUseGuidedSolve?: () => void;
}

type BubbleStep =
  | 'COMPARE_DECIDE'
  | 'ANIMATING_SWAP'
  | 'PASS_COMPLETE'
  | 'GAME_COMPLETE';

export const BubbleSortGame: React.FC<BubbleSortGameProps> = ({
  level,
  onCompleteLevel,
  onBackToLevels,
  onNextLevel,
  initialGuidedMode = false,
  onUseHint,
  onUseGuidedSolve,
}) => {
  // ─── SINGLE SOURCE OF TRUTH: BUBBLE SORT STATE ───
  const initializeCards = useCallback((arr: number[]): SortCardObject[] => {
    return arr.map((val, idx) => ({
      id: `card-${val}-${idx}-${Date.now()}`,
      value: val,
      position: idx,
      isSorted: false,
    }));
  }, []);

  const [cards, setCards] = useState<SortCardObject[]>(() => initializeCards(level.initialArray));
  const [currentPass, setCurrentPass] = useState<number>(1);
  const [currentComparison, setCurrentComparison] = useState<number>(0);
  const [sortedBoundary, setSortedBoundary] = useState<number>(0);
  const [currentAction, setCurrentAction] = useState<BubbleStep>('COMPARE_DECIDE');
  const [gameComplete, setGameComplete] = useState<boolean>(false);
  const [dragHoverIndex, setDragHoverIndex] = useState<number | null>(null);

  // In-game Guided Solve mode (no popup/modal — runs directly inside the existing game area)
  const [isGuidedMode, setIsGuidedMode] = useState<boolean>(initialGuidedMode);
  // In Guided Solve, each pair goes through 'EXPLAIN_COMPARE' -> 'PERFORM_ACTION'
  const [guidedPhase, setGuidedPhase] = useState<'EXPLAIN_COMPARE' | 'PERFORM_ACTION'>('EXPLAIN_COMPARE');

  // Derived algorithm metrics
  const totalPasses = Math.max(1, cards.length - 1);
  const totalComparisonsInPass = Math.max(1, cards.length - currentPass);
  const currentPairLeftIndex = currentComparison;
  const currentPairRightIndex = currentComparison + 1;
  const leftCard = cards[currentPairLeftIndex];
  const rightCard = cards[currentPairRightIndex];

  const isElementSorted = useCallback(
    (idx: number): boolean => {
      if (gameComplete) return true;
      if (sortedBoundary <= 0) return false;
      return idx >= cards.length - sortedBoundary;
    },
    [gameComplete, sortedBoundary, cards.length]
  );

  const renderedCards: SortCardObject[] = cards.map((card, idx) => ({
    ...card,
    position: idx,
    isSorted: isElementSorted(idx),
  }));

  // Telemetry & scoring
  const [score, setScore] = useState<number>(500);
  const [moves, setMoves] = useState<number>(0);
  const [comparisonsCount, setComparisonsCount] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(true);
  const [levelStartTime, setLevelStartTime] = useState<number>(() => Date.now());
  const [guidedUsesCount, setGuidedUsesCount] = useState<number>(() => (initialGuidedMode ? 1 : 0));

  // Contextual feedback & educational messaging
  const [feedback, setFeedback] = useState<{
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
  }>({
    type: 'info',
    title: 'Bubble Sort Initialized',
    message: 'Hold and drag a highlighted card to swap if Left > Right, or click KEEP if already in order.',
  });

  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [hintTier, setHintTier] = useState<number>(0);
  const [showHintModal, setShowHintModal] = useState<boolean>(false);
  const [hintsUsed, setHintsUsed] = useState<number>(0);

  // Calculate final score using Base + Move Score without time penalty
  const computeFinalScore = useCallback(
    (currentRawScore: number, _timeSec: number, _hints: number, _guidedCount: number): number => {
      return Math.max(0, currentRawScore);
    },
    []
  );

  // Helper to build comparison prompt message
  const getPairComparisonFeedback = useCallback(
    (lVal: number, rVal: number, passNum: number, compIdx: number, guided: boolean) => {
      const needsSwap = lVal > rVal;
      if (guided) {
        return {
          type: 'info' as const,
          title: `Guided Solve • Pass ${passNum} (Step ${compIdx + 1}): Compare ${lVal} and ${rVal}`,
          message: needsSwap
            ? `Compare ${lVal} and ${rVal}. Since ${lVal} > ${rVal}, they are out of ascending order and must be swapped. Click "Next Step" (or drag ${lVal} to ${rVal}) to perform the swap.`
            : `Compare ${lVal} and ${rVal}. Since ${lVal} ≤ ${rVal}, they are already in ascending order — no swap is needed. Click "Next Step" to keep their order and advance.`,
        };
      }
      return {
        type: 'info' as const,
        title: `Comparing ${lVal} and ${rVal}`,
        message: needsSwap
          ? `${lVal} > ${rVal}: Hold and drag [${lVal}] onto [${rVal}] to swap them (or click KEEP if no swap is needed).`
          : `${lVal} ≤ ${rVal}: Hold and drag to swap if needed, or click [ KEEP ] if they are already in ascending order.`,
      };
    },
    []
  );

  // Reset state when level changes
  useEffect(() => {
    const initialCards = initializeCards(level.initialArray);
    setCards(initialCards);
    setCurrentPass(1);
    setCurrentComparison(0);
    setSortedBoundary(0);
    setCurrentAction('COMPARE_DECIDE');
    setGameComplete(false);
    setScore(initialGuidedMode ? 450 : 500);
    setMoves(0);
    setComparisonsCount(0);
    setElapsedSeconds(0);
    setLevelStartTime(Date.now());
    setTimerActive(true);
    setHintTier(0);
    setHintsUsed(0);
    setGuidedUsesCount(initialGuidedMode ? 1 : 0);
    setGuidedPhase('EXPLAIN_COMPARE');
    if (initialCards.length >= 2) {
      setFeedback(
        getPairComparisonFeedback(
          initialCards[0].value,
          initialCards[1].value,
          1,
          0,
          isGuidedMode
        )
      );
    }
  }, [level.levelNumber, level.initialArray, initializeCards]);

  // Activate or toggle Guided Solve directly in the game screen from the CURRENT state (never reset)
  const handleToggleGuidedSolve = () => {
    soundEffects.playClick();
    if (!isGuidedMode) {
      setIsGuidedMode(true);
      setGuidedPhase('EXPLAIN_COMPARE');
      setGuidedUsesCount((g) => g + 1);
      setScore((s) => Math.max(0, s - 50));
      onUseGuidedSolve?.();
      if (leftCard && rightCard && !gameComplete) {
        setFeedback(
          getPairComparisonFeedback(leftCard.value, rightCard.value, currentPass, currentComparison, true)
        );
      }
    } else {
      setIsGuidedMode(false);
      setGuidedPhase('EXPLAIN_COMPARE');
      if (leftCard && rightCard && !gameComplete) {
        setFeedback(
          getPairComparisonFeedback(leftCard.value, rightCard.value, currentPass, currentComparison, false)
        );
      }
    }
  };

  // Accurate Timer effect
  useEffect(() => {
    if (!timerActive || gameComplete) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - levelStartTime) / 1000)));
    }, 250);
    return () => clearInterval(interval);
  }, [timerActive, gameComplete, levelStartTime]);

  const triggerShake = () => {
    soundEffects.playError();
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  // Advance pointer to next pair or finish pass
  const advanceToNextPair = (latestCards: SortCardObject[], guidedActive = isGuidedMode) => {
    const nextComp = currentComparison + 1;
    const totalComps = latestCards.length - currentPass;

    if (nextComp >= totalComps) {
      const newSortedBoundary = sortedBoundary + 1;
      setSortedBoundary(newSortedBoundary);

      const isArraySorted = latestCards.every((c, i, arr) => i === 0 || arr[i - 1].value <= c.value);
      const isFinalPass = currentPass >= totalPasses || isArraySorted;

      if (isFinalPass && currentPass >= totalPasses) {
        const finalTimeSec = Math.max(1, Math.floor((Date.now() - levelStartTime) / 1000));
        setElapsedSeconds(finalTimeSec);
        setGameComplete(true);
        setCurrentAction('GAME_COMPLETE');
        setTimerActive(false);
        const finalCalculatedScore = computeFinalScore(score, finalTimeSec, hintsUsed, guidedUsesCount);
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
              ? `Final Sorted Array: [${latestCards.map((c) => c.value).join(', ')}] • Score: ${finalCalculatedScore} pts in ${finalTimeSec}s. Advancing to Level ${level.levelNumber + 1}...`
              : `Final Sorted Array: [${latestCards.map((c) => c.value).join(', ')}] • Score: ${finalCalculatedScore} pts in ${finalTimeSec}s. All levels mastered!`,
        });

        setTimeout(() => {
          if (onNextLevel && level.levelNumber < 5) {
            onNextLevel();
          } else {
            onBackToLevels();
          }
        }, 1200);
        return;
      }

      // Pass completed!
      const nextPassNum = currentPass + 1;
      const lockedIdx = latestCards.length - newSortedBoundary;
      const lockedVal = latestCards[lockedIdx]?.value;

      if (guidedActive) {
        // In Guided Solve, advance cleanly to the start of the next pass and explain the next comparison
        setCurrentPass(nextPassNum);
        setCurrentComparison(0);
        setCurrentAction('COMPARE_DECIDE');
        setGuidedPhase('EXPLAIN_COMPARE');
        const nextL = latestCards[0]?.value;
        const nextR = latestCards[1]?.value;
        setFeedback({
          type: 'info',
          title: `Pass ${currentPass} Complete (${lockedVal} Locked) → Pass ${nextPassNum}: Compare ${nextL} and ${nextR}`,
          message: `${lockedVal} reached its final position at index ${lockedIdx}. Now starting Pass ${nextPassNum}: compare ${nextL} (index 0) and ${nextR} (index 1). ${
            nextL > nextR
              ? `Since ${nextL} > ${nextR}, they need to be swapped.`
              : `Since ${nextL} ≤ ${nextR}, keep their order.`
          } Click "Next Step" to continue.`,
        });
      } else {
        setCurrentAction('PASS_COMPLETE');
        soundEffects.playCorrect();
        setFeedback({
          type: 'success',
          title: `Pass ${currentPass} Complete!`,
          message: `The largest unsorted element (${lockedVal}) has reached its final sorted position at index ${lockedIdx}.`,
        });

        setTimeout(() => {
          setCurrentPass(nextPassNum);
          setCurrentComparison(0);
          setCurrentAction('COMPARE_DECIDE');
          if (latestCards.length >= 2) {
            setFeedback(
              getPairComparisonFeedback(
                latestCards[0].value,
                latestCards[1].value,
                nextPassNum,
                0,
                false
              )
            );
          }
        }, 900);
      }
    } else {
      // Continue next pair in current pass
      setCurrentComparison(nextComp);
      setCurrentAction('COMPARE_DECIDE');
      setGuidedPhase('EXPLAIN_COMPARE');
      const nextL = latestCards[nextComp]?.value;
      const nextR = latestCards[nextComp + 1]?.value;
      if (guidedActive) {
        setFeedback({
          type: 'info',
          title: `Now compare ${nextL} and ${nextR} (Indices ${nextComp} & ${nextComp + 1})`,
          message:
            nextL > nextR
              ? `Compare ${nextL} and ${nextR}. Since ${nextL} is greater than ${nextR}, swap them so the larger value moves right. Click "Next Step" to execute.`
              : `Compare ${nextL} and ${nextR}. Since ${nextL} ≤ ${nextR}, they are already in ascending order. Click "Next Step" to keep them and move on.`,
        });
      } else {
        setFeedback(
          getPairComparisonFeedback(nextL, nextR, currentPass, nextComp, false)
        );
      }
    }
  };

  // Physically perform the swap of the active adjacent pair
  const executeCardSwap = (guidedActive = isGuidedMode) => {
    if (currentAction !== 'COMPARE_DECIDE' || !leftCard || !rightCard) return;

    soundEffects.playPush();
    setCurrentAction('ANIMATING_SWAP');
    setMoves((m) => m + 1);
    setComparisonsCount((c) => c + 1);
    setScore((s) => (guidedActive ? Math.max(0, s - 15) : s + 40));

    const newCards = [...cards];
    const leftVal = newCards[currentPairLeftIndex].value;
    const rightVal = newCards[currentPairRightIndex].value;
    const temp = newCards[currentPairLeftIndex];
    newCards[currentPairLeftIndex] = newCards[currentPairRightIndex];
    newCards[currentPairRightIndex] = temp;

    newCards[currentPairLeftIndex] = { ...newCards[currentPairLeftIndex], position: currentPairLeftIndex };
    newCards[currentPairRightIndex] = { ...newCards[currentPairRightIndex], position: currentPairRightIndex };

    setCards(newCards);

    if (guidedActive) {
      setFeedback({
        type: 'success',
        title: `Swapped ${leftVal} and ${rightVal} → [${newCards.map((c) => c.value).join(', ')}]`,
        message: `${leftVal} is greater than ${rightVal}, so we swapped them. ${leftVal} moved right to index ${currentPairRightIndex} and ${rightVal} moved left to index ${currentPairLeftIndex}. Click "Next Step" to continue.`,
      });
      setCurrentAction('COMPARE_DECIDE');
      setGuidedPhase('PERFORM_ACTION');
    } else {
      setFeedback({
        type: 'success',
        title: 'Swap Successful!',
        message: `${leftVal} and ${rightVal} were swapped via drag. Moving to the next adjacent pair...`,
      });
      setTimeout(() => {
        advanceToNextPair(newCards, false);
      }, 550);
    }
  };

  // Handle Drag-to-Swap between two cards
  const handleDragSwap = (fromIdx: number, toIdx: number) => {
    if (currentAction !== 'COMPARE_DECIDE' || gameComplete) return;

    if (isElementSorted(fromIdx) || isElementSorted(toIdx)) {
      soundEffects.playError();
      setFeedback({
        type: 'warning',
        title: 'Element Already Sorted',
        message: '🔒 That element is already locked in its final sorted position.',
      });
      return;
    }

    const isCurrentPair =
      (fromIdx === currentPairLeftIndex && toIdx === currentPairRightIndex) ||
      (fromIdx === currentPairRightIndex && toIdx === currentPairLeftIndex);

    if (!isCurrentPair) {
      triggerShake();
      setFeedback({
        type: 'error',
        title: 'Adjacent Comparison Rule',
        message: `⚠️ Bubble Sort only swaps the active adjacent pair (#${currentPairLeftIndex} [${leftCard?.value}] and #${currentPairRightIndex} [${rightCard?.value}]).`,
      });
      return;
    }

    const needsSwap = leftCard.value > rightCard.value;
    if (!needsSwap) {
      triggerShake();
      setScore((s) => Math.max(0, s - 25));
      setFeedback({
        type: 'error',
        title: 'No Swap Needed!',
        message: `${leftCard.value} is already ≤ ${rightCard.value}. Do not swap them — click [ KEEP ] to preserve ascending order!`,
      });
      return;
    }

    executeCardSwap(isGuidedMode);
  };

  // Handle player decision: SWAP vs KEEP
  const handleDecision = (decision: 'SWAP' | 'KEEP') => {
    if (currentAction !== 'COMPARE_DECIDE' || !leftCard || !rightCard) return;

    const needsSwap = leftCard.value > rightCard.value;

    if (decision === 'KEEP') {
      if (needsSwap) {
        triggerShake();
        setScore((s) => Math.max(0, s - 25));
        setFeedback({
          type: 'error',
          title: 'Incorrect Decision',
          message: `Not quite! ${leftCard.value} is greater than ${rightCard.value}. Hold and drag [${leftCard.value}] onto [${rightCard.value}] to swap them!`,
        });
      } else {
        soundEffects.playCorrect();
        setScore((s) => (isGuidedMode ? Math.max(0, s - 15) : s + 50));
        setMoves((m) => m + 1);
        setComparisonsCount((c) => c + 1);
        setFeedback({
          type: 'success',
          title: 'Correct! No Swap Needed',
          message: `${leftCard.value} is already smaller than or equal to ${rightCard.value}, so no swap is needed.`,
        });
        advanceToNextPair(cards, isGuidedMode);
      }
    } else if (decision === 'SWAP') {
      if (!needsSwap) {
        triggerShake();
        setScore((s) => Math.max(0, s - 25));
        setFeedback({
          type: 'error',
          title: 'Incorrect Decision',
          message: `No swap needed! ${leftCard.value} is already ≤ ${rightCard.value}. Click [ KEEP ] instead.`,
        });
      } else {
        executeCardSwap(isGuidedMode);
      }
    }
  };

  // Guided Solve: "Next Step" button handler inside the game screen
  const handleGuidedNextStep = () => {
    if (gameComplete || !leftCard || !rightCard) return;
    soundEffects.playClick();

    // If we just performed a swap and are showing the post-swap result, advance to the next comparison
    if (guidedPhase === 'PERFORM_ACTION') {
      advanceToNextPair(cards, true);
      return;
    }

    // Otherwise, execute the current step's required action (Swap or Keep)
    setGuidedUsesCount((g) => g + 1);
    const needsSwap = leftCard.value > rightCard.value;
    if (needsSwap) {
      executeCardSwap(true);
    } else {
      soundEffects.playCorrect();
      setMoves((m) => m + 1);
      setComparisonsCount((c) => c + 1);
      setScore((s) => Math.max(0, s - 15));
      setFeedback({
        type: 'success',
        title: `Kept ${leftCard.value} and ${rightCard.value} in Order`,
        message: `Because ${leftCard.value} ≤ ${rightCard.value}, no swap was needed. Click "Next Step" to move to the next comparison.`,
      });
      setGuidedPhase('PERFORM_ACTION');
    }
  };

  // Reset current problem
  const handleConfirmReset = () => {
    const initialCards = initializeCards(level.initialArray);
    setCards(initialCards);
    setCurrentPass(1);
    setCurrentComparison(0);
    setSortedBoundary(0);
    setCurrentAction('COMPARE_DECIDE');
    setGameComplete(false);
    setScore(isGuidedMode ? 450 : 500);
    setMoves(0);
    setComparisonsCount(0);
    setElapsedSeconds(0);
    setLevelStartTime(Date.now());
    setTimerActive(true);
    setHintTier(0);
    setHintsUsed(0);
    setGuidedUsesCount(isGuidedMode ? 1 : 0);
    setGuidedPhase('EXPLAIN_COMPARE');
    if (initialCards.length >= 2) {
      setFeedback(
        getPairComparisonFeedback(
          initialCards[0].value,
          initialCards[1].value,
          1,
          0,
          isGuidedMode
        )
      );
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
      {/* ─── GAME HEADER BAR ─── */}
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
              <span>BUBBLE SORT</span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                LV {level.levelNumber}
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Task: Hold & drag adjacent cards to swap them into ascending order.
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
              Moves: <span className="font-mono text-slate-900 dark:text-white">{moves}</span>
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
              ) : feedback.type === 'warning' ? (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              ) : (
                <Lightbulb className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold tracking-tight">{feedback.title}</h4>
              <p className="text-xs sm:text-sm opacity-90 mt-0.5 leading-relaxed font-normal">{feedback.message}</p>
            </div>
          </div>

          {isGuidedMode && !gameComplete && (
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

      {/* ─── MAIN INTERACTIVE CARDS WORKSPACE ─── */}
      <div
        className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs relative transition-transform ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Pass & Comparison Tracker Banner */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono">
              Pass: {currentPass} / {totalPasses}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono">
              Comparison: {Math.min(currentComparison + 1, totalComparisonsInPass)} / {totalComparisonsInPass}
            </span>
          </div>

          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isGuidedMode
              ? 'Guided Solve Active: Click Next Step or Drag Cards'
              : 'Hold & Drag Card to Swap, or Click KEEP'}
          </div>
        </div>

        {/* Physical Animated Cards Row */}
        <div className="flex items-center justify-center gap-2 sm:gap-3.5 py-6 overflow-x-auto custom-scrollbar min-h-[160px]">
          {renderedCards.map((card, idx) => {
            const isPairMember =
              !gameComplete && (idx === currentPairLeftIndex || idx === currentPairRightIndex);
            const isSwapNeeded =
              isPairMember && leftCard && rightCard && leftCard.value > rightCard.value;

            return (
              <SortingCard
                key={card.id}
                card={card}
                index={idx}
                isSelected={isPairMember}
                isPairHighlighted={isPairMember && !card.isSorted}
                isDragCandidate={Boolean(isSwapNeeded && idx === currentPairLeftIndex)}
                isDropTarget={Boolean(isSwapNeeded && idx === currentPairRightIndex)}
                isDragHovered={dragHoverIndex === idx}
                onDragSwap={handleDragSwap}
                onDragHoverIndex={setDragHoverIndex}
              />
            );
          })}
        </div>

        {/* Action Decision Control Bar */}
        <AnimatePresence>
          {currentAction === 'COMPARE_DECIDE' && !gameComplete && leftCard && rightCard && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3"
            >
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 text-center">
                {leftCard.value > rightCard.value
                  ? `Hold and drag [${leftCard.value}] onto [${rightCard.value}] to swap them into ascending order!`
                  : `Hold and drag [${leftCard.value}] onto [${rightCard.value}] if they need to swap, or click [ KEEP ] if ${leftCard.value} ≤ ${rightCard.value}.`}
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleDecision('KEEP')}
                  className="px-6 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs cursor-pointer active:scale-95 transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>[ KEEP ORDER ]</span>
                </button>

                {isGuidedMode && (
                  <button
                    onClick={handleGuidedNextStep}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 cursor-pointer active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span>[ NEXT STEP ]</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
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
                    Contextual Hint (Tier {hintTier}/3)
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
                  Got It, Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

