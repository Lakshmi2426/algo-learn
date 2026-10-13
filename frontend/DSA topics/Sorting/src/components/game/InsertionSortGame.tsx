import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  ArrowRightLeft,
  Check,
  AlertTriangle,
  RotateCcw,
  Trophy,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  MoveRight,
  ArrowDown,
  Lightbulb,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SortCardObject, SortLevelConfig, UserProgress } from '../../types';
import { SortingCard } from './SortingCard';
import { soundEffects } from '../../services/sound';

interface InsertionSortGameProps {
  level: SortLevelConfig;
  progress: UserProgress;
  onCompleteLevel: (earnedXP: number, earnedScore?: number, performanceMetrics?: string) => void;
  onBackToLevels: () => void;
  onNextLevel?: () => void;
  initialGuidedMode?: boolean;
  onUseHint?: () => void;
  onUseGuidedSolve?: () => void;
}

type InsertionStep =
  | 'COMPARE_PREDECESSOR'
  | 'GAME_COMPLETE';

export const InsertionSortGame: React.FC<InsertionSortGameProps> = ({
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
      id: `card-ins-${val}-${idx}-${Date.now()}`,
      value: val,
      position: idx,
      isSorted: idx === 0, // First card is trivially sorted
    }));
  }, []);

  const [cards, setCards] = useState<SortCardObject[]>(() => initializeCards(level.initialArray));
  const [currentIndex, setCurrentIndex] = useState<number>(1); // Current index of the key being inserted
  const [keyTargetBoundary, setKeyTargetBoundary] = useState<number>(1); // Outer loop i (1..n-1)
  const [scanIndex, setScanIndex] = useState<number>(0); // Predecessor being compared (currentIndex - 1)
  const [stepState, setStepState] = useState<InsertionStep>('COMPARE_PREDECESSOR');
  const [dragHoverIndex, setDragHoverIndex] = useState<number | null>(null);

  // In-game Guided Solve mode (no popup/modal — runs directly inside the existing game screen)
  const [isGuidedMode, setIsGuidedMode] = useState<boolean>(initialGuidedMode);
  const [guidedPhase, setGuidedPhase] = useState<'EXPLAIN' | 'PERFORMED'>('EXPLAIN');

  // Telemetry
  const [score, setScore] = useState<number>(500);
  const [moves, setMoves] = useState<number>(0); // Shifts count
  const [comparisonsCount, setComparisonsCount] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(true);
  const [levelStartTime, setLevelStartTime] = useState<number>(() => Date.now());
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [guidedUsesCount, setGuidedUsesCount] = useState<number>(() => (initialGuidedMode ? 1 : 0));
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Modals & hints
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
    title: 'Insertion Sort Initialized',
    message: 'Hold and drag the predecessor card right to shift if it is greater than the key, or click INSERT HERE.',
  });

  const buildComparisonPrompt = useCallback(
    (predVal: number, keyVal: number, predIdx: number, keyIdx: number, guided: boolean) => {
      const needsShift = predVal > keyVal;
      if (guided) {
        return {
          type: 'info' as const,
          title: `Guided Solve • Compare Predecessor ${predVal} (#${predIdx}) with Key ${keyVal} (#${keyIdx})`,
          message: needsShift
            ? `Compare predecessor ${predVal} with key ${keyVal}. Since ${predVal} > ${keyVal}, ${predVal} must shift right to make room for ${keyVal}. Click "Next Step" (or drag ${predVal} right) to shift.`
            : `Compare predecessor ${predVal} with key ${keyVal}. Since ${predVal} ≤ ${keyVal}, no shift is needed — ${keyVal} belongs right here at index ${keyIdx}. Click "Next Step" to insert.`,
        };
      }
      return {
        type: 'info' as const,
        title: `Key Card: ${keyVal} (#${keyIdx}) • Compare with ${predVal} (#${predIdx})`,
        message: needsShift
          ? `${predVal} > ${keyVal}: Hold and drag [${predVal}] right onto [${keyVal}] (or drag [${keyVal}] left) to shift!`
          : `${predVal} ≤ ${keyVal}: Hold and drag if a shift is needed, or click [ INSERT ${keyVal} HERE ] to lock it in place.`,
      };
    },
    []
  );

  // Reset state when level changes
  useEffect(() => {
    const initial = initializeCards(level.initialArray);
    setCards(initial);
    setCurrentIndex(1);
    setKeyTargetBoundary(1);
    setScanIndex(0);
    setStepState('COMPARE_PREDECESSOR');
    setScore(initialGuidedMode ? 450 : 500);
    setMoves(0);
    setComparisonsCount(0);
    setElapsedSeconds(0);
    setLevelStartTime(Date.now());
    setTimerActive(true);
    setHintTier(0);
    setHintsUsed(0);
    setGuidedUsesCount(initialGuidedMode ? 1 : 0);
    setGuidedPhase('EXPLAIN');
    if (initial.length >= 2) {
      setFeedback(
        buildComparisonPrompt(initial[0].value, initial[1].value, 0, 1, isGuidedMode)
      );
    }
  }, [level.levelNumber, level.initialArray, initializeCards]);

  useEffect(() => {
    if (!timerActive || stepState === 'GAME_COMPLETE') return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - levelStartTime) / 1000)));
    }, 250);
    return () => clearInterval(interval);
  }, [timerActive, stepState, levelStartTime]);

  const currentKeyCard = cards[currentIndex];
  const predecessorCard = cards[scanIndex];

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
      setGuidedPhase('EXPLAIN');
      setGuidedUsesCount((g) => g + 1);
      setScore((s) => Math.max(0, s - 50));
      onUseGuidedSolve?.();
      if (predecessorCard && currentKeyCard && stepState !== 'GAME_COMPLETE') {
        setFeedback(
          buildComparisonPrompt(
            predecessorCard.value,
            currentKeyCard.value,
            scanIndex,
            currentIndex,
            true
          )
        );
      }
    } else {
      setIsGuidedMode(false);
      setGuidedPhase('EXPLAIN');
      if (predecessorCard && currentKeyCard && stepState !== 'GAME_COMPLETE') {
        setFeedback(
          buildComparisonPrompt(
            predecessorCard.value,
            currentKeyCard.value,
            scanIndex,
            currentIndex,
            false
          )
        );
      }
    }
  };

  // Commit insertion and lock prefix up to keyTargetBoundary
  const commitInsert = (insertedPos: number, updatedCards?: SortCardObject[], guidedActive = isGuidedMode) => {
    const activeCards = updatedCards || cards;
    const prefixEnd = keyTargetBoundary;

    const newCards = activeCards.map((c, i) => (i <= prefixEnd ? { ...c, isSorted: true } : c));
    setCards(newCards);

    soundEffects.playPush();
    const nextBoundary = prefixEnd + 1;

    if (nextBoundary >= activeCards.length) {
      const finalTimeSec = Math.max(1, Math.floor((Date.now() - levelStartTime) / 1000));
      setElapsedSeconds(finalTimeSec);
      const allSorted = newCards.map((c) => ({ ...c, isSorted: true }));
      setCards(allSorted);
      setStepState('GAME_COMPLETE');
      setTimerActive(false);
      const finalCalculatedScore = computeFinalScore(score, finalTimeSec);
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

    const insertedVal = newCards[insertedPos]?.value;

    if (guidedActive) {
      setKeyTargetBoundary(nextBoundary);
      setCurrentIndex(nextBoundary);
      setScanIndex(nextBoundary - 1);
      setStepState('COMPARE_PREDECESSOR');
      setGuidedPhase('EXPLAIN');
      const nextPredVal = newCards[nextBoundary - 1]?.value;
      const nextKeyVal = newCards[nextBoundary]?.value;
      setFeedback({
        type: 'success',
        title: `Inserted ${insertedVal} at #${insertedPos} → Next Key: ${nextKeyVal} (#${nextBoundary})`,
        message: `Sorted prefix is now [${newCards.slice(0, nextBoundary).map((c) => c.value).join(', ')}]. Next, select key ${nextKeyVal} (#${nextBoundary}) and compare with predecessor ${nextPredVal} (#${nextBoundary - 1}). Click "Next Step" to continue.`,
      });
    } else {
      setFeedback({
        type: 'success',
        title: 'Card Inserted!',
        message: `Card ${insertedVal} is now locked in the sorted prefix.`,
      });

      setTimeout(() => {
        setKeyTargetBoundary(nextBoundary);
        setCurrentIndex(nextBoundary);
        setScanIndex(nextBoundary - 1);
        setStepState('COMPARE_PREDECESSOR');
        setFeedback(
          buildComparisonPrompt(
            newCards[nextBoundary - 1]?.value,
            newCards[nextBoundary]?.value,
            nextBoundary - 1,
            nextBoundary,
            false
          )
        );
      }, 600);
    }
  };

  // Execute shift of predecessor card to the right (swapping scanIndex and currentIndex)
  const executeShift = (guidedActive = isGuidedMode) => {
    if (stepState !== 'COMPARE_PREDECESSOR' || !predecessorCard || !currentKeyCard) return;

    soundEffects.playPush();
    setMoves((m) => m + 1);
    setComparisonsCount((c) => c + 1);
    setScore((s) => (guidedActive ? Math.max(0, s - 15) : s + 40));

    const predVal = predecessorCard.value;
    const keyVal = currentKeyCard.value;

    const newCards = [...cards];
    const temp = newCards[scanIndex];
    newCards[scanIndex] = newCards[scanIndex + 1];
    newCards[scanIndex + 1] = temp;

    newCards[scanIndex] = { ...newCards[scanIndex], position: scanIndex };
    newCards[scanIndex + 1] = { ...newCards[scanIndex + 1], position: scanIndex + 1 };

    setCards(newCards);

    const nextScanIndex = scanIndex - 1;
    const newKeyIndex = scanIndex;

    if (nextScanIndex < 0) {
      // Reached the very front (index 0) of the array!
      setScanIndex(0);
      setCurrentIndex(0);
      commitInsert(0, newCards, guidedActive);
    } else {
      setScanIndex(nextScanIndex);
      setCurrentIndex(newKeyIndex);
      setStepState('COMPARE_PREDECESSOR');
      setGuidedPhase('EXPLAIN');
      const nextPredVal = newCards[nextScanIndex].value;
      if (guidedActive) {
        setFeedback({
          type: 'info',
          title: `Shifted ${predVal} Right → Now Compare Key ${keyVal} with ${nextPredVal} (#${nextScanIndex})`,
          message: `Because ${predVal} > ${keyVal}, we shifted ${predVal} right to index ${newKeyIndex + 1}. Now compare key ${keyVal} with predecessor ${nextPredVal} at index ${nextScanIndex}. ${
            nextPredVal > keyVal
              ? `Since ${nextPredVal} > ${keyVal}, shift ${nextPredVal} right as well.`
              : `Since ${nextPredVal} ≤ ${keyVal}, insert ${keyVal} at index ${newKeyIndex}.`
          } Click "Next Step" to continue.`,
        });
      } else {
        setFeedback(
          buildComparisonPrompt(nextPredVal, keyVal, nextScanIndex, newKeyIndex, false)
        );
      }
    }
  };

  // Drag-to-swap/shift handler
  const handleDragSwap = (fromIdx: number, toIdx: number) => {
    if (stepState !== 'COMPARE_PREDECESSOR' || !predecessorCard || !currentKeyCard) return;

    const isActivePair =
      (fromIdx === scanIndex && toIdx === currentIndex) ||
      (fromIdx === currentIndex && toIdx === scanIndex);

    if (!isActivePair) {
      triggerShake();
      setFeedback({
        type: 'error',
        title: 'Compare Active Key & Predecessor',
        message: `⚠️ Compare predecessor [${predecessorCard.value}] (#${scanIndex}) and key [${currentKeyCard.value}] (#${currentIndex}). Drag between those two cards to shift!`,
      });
      return;
    }

    const needsShift = predecessorCard.value > currentKeyCard.value;
    if (!needsShift) {
      triggerShake();
      setScore((s) => Math.max(0, s - 25));
      setFeedback({
        type: 'error',
        title: 'No Shift Needed!',
        message: `❌ ${predecessorCard.value} is already ≤ ${currentKeyCard.value}. Do not shift — click [ INSERT ${currentKeyCard.value} HERE ]!`,
      });
      return;
    }

    executeShift(isGuidedMode);
  };

  // Compare decision: SHIFT vs INSERT HERE
  const handleShiftDecision = (decision: 'SHIFT' | 'INSERT') => {
    if (stepState !== 'COMPARE_PREDECESSOR' || !predecessorCard || !currentKeyCard) return;

    const predecessorVal = predecessorCard.value;
    const currentVal = currentKeyCard.value;
    const needsShift = predecessorVal > currentVal;

    if (decision === 'SHIFT') {
      if (!needsShift) {
        triggerShake();
        setScore((s) => Math.max(0, s - 25));
        setFeedback({
          type: 'error',
          title: 'No Shift Needed',
          message: `❌ ${predecessorVal} is already <= ${currentVal}. We have found the correct position! Click [ INSERT ${currentVal} HERE ].`,
        });
      } else {
        executeShift(isGuidedMode);
      }
    } else if (decision === 'INSERT') {
      if (needsShift) {
        triggerShake();
        setScore((s) => Math.max(0, s - 25));
        setFeedback({
          type: 'error',
          title: 'Cannot Insert Yet',
          message: `❌ ${predecessorVal} is greater than ${currentVal}. Hold and drag [${predecessorVal}] right onto [${currentVal}] to shift it first!`,
        });
      } else {
        soundEffects.playCorrect();
        setComparisonsCount((c) => c + 1);
        setScore((s) => (isGuidedMode ? Math.max(0, s - 15) : s + 50));
        commitInsert(currentIndex, undefined, isGuidedMode);
      }
    }
  };

  // Guided Solve "Next Step" inside the game screen
  const handleGuidedNextStep = () => {
    if (stepState === 'GAME_COMPLETE' || !predecessorCard || !currentKeyCard) return;
    soundEffects.playClick();
    setGuidedUsesCount((g) => g + 1);

    const needsShift = predecessorCard.value > currentKeyCard.value;
    if (needsShift) {
      executeShift(true);
    } else {
      soundEffects.playCorrect();
      setComparisonsCount((c) => c + 1);
      setScore((s) => Math.max(0, s - 15));
      commitInsert(currentIndex, undefined, true);
    }
  };

  const handleConfirmReset = () => {
    const initial = initializeCards(level.initialArray);
    setCards(initial);
    setCurrentIndex(1);
    setKeyTargetBoundary(1);
    setScanIndex(0);
    setStepState('COMPARE_PREDECESSOR');
    setScore(isGuidedMode ? 450 : 500);
    setMoves(0);
    setComparisonsCount(0);
    setElapsedSeconds(0);
    setLevelStartTime(Date.now());
    setTimerActive(true);
    setHintTier(0);
    setHintsUsed(0);
    setGuidedUsesCount(isGuidedMode ? 1 : 0);
    setGuidedPhase('EXPLAIN');
    if (initial.length >= 2) {
      setFeedback(
        buildComparisonPrompt(initial[0].value, initial[1].value, 0, 1, isGuidedMode)
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
      {/* ─── HEADER BAR ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundEffects.playClick();
              onBackToLevels();
            }}
            className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer"
          >
            ← Levels
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>INSERTION SORT</span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                LV {level.levelNumber}
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Task: Hold & drag larger predecessor cards right to shift, then insert the key.
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
              Shifts: <span className="font-mono text-slate-900 dark:text-white">{moves}</span>
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
            : 'bg-teal-50/90 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900/60 text-teal-900 dark:text-teal-100'
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
                <Lightbulb className="w-5 h-5 text-teal-600" />
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
              className="shrink-0 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md shadow-teal-500/25 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── WORKSPACE WITH CARDS ─── */}
      <div
        className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs relative ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800 text-xs font-bold">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 font-mono">
              Sorted Prefix: [0...{Math.max(0, keyTargetBoundary - 1)}]
            </span>
          </div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
            <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950/80 font-mono">
              Key Card: #{currentIndex} ({currentKeyCard?.value})
            </span>
          </div>
        </div>

        {/* Physical Cards Row */}
        <div className="flex items-center justify-center gap-2 sm:gap-3.5 py-6 overflow-x-auto custom-scrollbar min-h-[160px]">
          {cards.map((card, idx) => {
            const isCurrentKey = idx === currentIndex && stepState !== 'GAME_COMPLETE';
            const isScanTarget = idx === scanIndex && stepState !== 'GAME_COMPLETE';
            const needsShift =
              isScanTarget && predecessorCard && currentKeyCard && predecessorCard.value > currentKeyCard.value;

            return (
              <SortingCard
                key={card.id}
                card={{
                  ...card,
                  isSorted: card.isSorted && !isCurrentKey && !isScanTarget,
                  isCurrent: isCurrentKey,
                  isShifting: Boolean(needsShift),
                }}
                index={idx}
                isSelected={isCurrentKey || isScanTarget}
                isPairHighlighted={isScanTarget}
                isDragCandidate={Boolean(needsShift && isScanTarget)}
                isDropTarget={Boolean(needsShift && isCurrentKey)}
                isDragHovered={dragHoverIndex === idx}
                onDragSwap={handleDragSwap}
                onDragHoverIndex={setDragHoverIndex}
              />
            );
          })}
        </div>

        {/* Decision Controls */}
        <AnimatePresence>
          {stepState === 'COMPARE_PREDECESSOR' && predecessorCard && currentKeyCard && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3"
            >
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 text-center">
                {predecessorCard.value > currentKeyCard.value ? (
                  <>
                    Predecessor <strong className="text-slate-900 dark:text-slate-100">{predecessorCard.value}</strong> &gt; Key <strong className="text-teal-600 dark:text-teal-400">{currentKeyCard.value}</strong>: Hold &amp; drag [{predecessorCard.value}] right onto [{currentKeyCard.value}] to shift!
                  </>
                ) : (
                  <>
                    Predecessor <strong className="text-slate-900 dark:text-slate-100">{predecessorCard.value}</strong> &le; Key <strong className="text-teal-600 dark:text-teal-400">{currentKeyCard.value}</strong>: Click [ INSERT {currentKeyCard.value} HERE ] to lock in place.
                  </>
                )}
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleShiftDecision('INSERT')}
                  className="px-6 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs cursor-pointer active:scale-95 transition-all flex items-center gap-2"
                >
                  <ArrowDown className="w-4 h-4 text-emerald-500" />
                  <span>[ INSERT {currentKeyCard.value} HERE ]</span>
                </button>

                {isGuidedMode && (
                  <button
                    onClick={handleGuidedNextStep}
                    className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md shadow-teal-500/25 cursor-pointer active:scale-95 transition-all flex items-center gap-2"
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
                    Insertion Sort Hint (Tier {hintTier}/3)
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
                  className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs cursor-pointer"
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

