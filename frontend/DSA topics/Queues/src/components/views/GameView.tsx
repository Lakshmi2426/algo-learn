import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { GameLevelConfig, GameChallenge, UserProgress } from '../../types';
import { GAME_LEVELS } from '../../data/gameData';
import { GAME_CATALOG, GameMetaData } from '../../data/gameMeta';
import { QueueVisualizer } from '../common/QueueVisualizer';
import { soundEffects } from '../../services/sound';
import { awardXP, applyQueueDeduction } from '../../services/storage';
import { QUEUE_SCORING, getGameLevelPoints } from '../../services/queueScoring';

// Modular Game Components
import { GameHub } from '../game/GameHub';
import { GamePreviewModal } from '../game/GamePreviewModal';
import { GameHeader } from '../game/GameHeader';
import { QuestionCard } from '../game/QuestionCard';
import { AvailableElementsPalette } from '../game/AvailableElementsPalette';
import { GameFeedbackCard } from '../game/GameFeedbackCard';
import { DequeueZone } from '../game/DequeueZone';
import { LevelCompleteModal } from '../game/LevelCompleteModal';
import { InGameLab } from '../game/InGameLab';
import { InlineGuidedSolveCard } from '../game/InlineGuidedSolveCard';
import { LevelMultiQueueInteractive } from '../game/LevelMultiQueueInteractive';
import { LevelCircularInteractive } from '../game/LevelCircularInteractive';
import { LevelSpeedQueueInteractive } from '../game/LevelSpeedQueueInteractive';
import { InteractiveTraceSimulator } from '../game/InteractiveTraceSimulator';
import { InteractiveArena } from '../game/InteractiveArena';
import {
  ArrowRight,
  ArrowDownToLine,
  ArrowUpRight,
  Eye,
  AlertTriangle,
  Flame,
  Clock,
  Play,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Zap,
  Radio,
  ChevronDown,
  ChevronUp,
  Trash2,
  GripVertical,
  Target,
  LogIn,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GameViewProps {
  progress: UserProgress;
  activeLevelId: number;
  onSelectLevel: (levelId: number) => void;
  onUpdateProgress: (updated: UserProgress | ((prev: UserProgress) => UserProgress)) => void;
}

interface GuidedGameSnapshot {
  activeLevelId: number;
  activeQueue: (string | number)[];
  availableElements: (string | number)[];
  mistakes: number;
  selectedChoiceId: string | null;
  selectedEnqueueValue: string | number | null;
  feedbackStatus: 'correct' | 'incorrect' | null;
  feedbackTitle: string;
  feedbackActionText: string;
  feedbackLifoReason: string;
  earnedXP: number;
  currentChallengeIndex: number;
  timedRunning: boolean;
  isUntimedMode: boolean;
  timedSeconds: number;
  timedScore: number;
  timedCombo: number;
  timedStep: number;
}

export const GameView: React.FC<GameViewProps> = ({
  progress,
  activeLevelId,
  onSelectLevel,
  onUpdateProgress,
}) => {
  // Navigation & View Mode: 'hub' (Game Hub), 'playing' (Active Gameplay), or 'lab' (In-Game Experiment Lab)
  const [viewMode, setViewMode] = useState<'hub' | 'playing' | 'lab'>('hub');
  const [selectedGameForPreview, setSelectedGameForPreview] = useState<GameMetaData | null>(null);
  const [isGuidedSolveOpen, setIsGuidedSolveOpen] = useState<boolean>(false);
  const [guidedSolveLevelId, setGuidedSolveLevelId] = useState<number>(activeLevelId);
  const guidedSnapshotRef = useRef<GuidedGameSnapshot | null>(null);

  // Current active level configuration
  const currentLevel: GameLevelConfig =
    GAME_LEVELS.find((l) => l.id === activeLevelId) || GAME_LEVELS[0];

  // Challenge Index within the active level
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState<number>(0);
  const challenges = currentLevel.challenges || [];
  const currentChallenge: GameChallenge =
    challenges[currentChallengeIndex] || challenges[0];

  const [levelCompletedModalOpen, setLevelCompletedModalOpen] = useState<boolean>(false);

  // Active Interactive Queue State
  const [activeQueue, setActiveQueue] = useState<(string | number)[]>([]);
  const [availableElements, setAvailableElements] = useState<(string | number)[]>([]);
  const [mistakes, setMistakes] = useState<number>(0);
  const [isPeeking, setIsPeeking] = useState<boolean>(false);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [selectedEnqueueValue, setSelectedEnqueueValue] = useState<string | number | null>(null);
  const [showLiveSandbox, setShowLiveSandbox] = useState<boolean>(false);
  const [isInteractiveArenaOpen, setIsInteractiveArenaOpen] = useState<boolean>(false);

  // Immediate Action Feedback State
  const [feedbackStatus, setFeedbackStatus] = useState<'correct' | 'incorrect' | null>(null);
  const [feedbackTitle, setFeedbackTitle] = useState<string>('');
  const [feedbackActionText, setFeedbackActionText] = useState<string>('');
  const [feedbackLifoReason, setFeedbackLifoReason] = useState<string>('');
  const [earnedXP, setEarnedXP] = useState<number>(0);

  // Level 4: Timed Queue Master State (30 seconds or untimed practice)
  const [timedRunning, setTimedRunning] = useState<boolean>(false);
  const [isUntimedMode, setIsUntimedMode] = useState<boolean>(false);
  const [timedSeconds, setTimedSeconds] = useState<number>(30);
  const [timedScore, setTimedScore] = useState<number>(0);
  const [timedCombo, setTimedCombo] = useState<number>(1);
  const [timedStep, setTimedStep] = useState<number>(0);

  // Guided Solve Points Deduction Toast Notification State
  const [deductionToast, setDeductionToast] = useState<{
    show: boolean;
    points: number;
  } | null>(null);

  useEffect(() => {
    if (!deductionToast?.show) return;
    const timer = setTimeout(() => {
      setDeductionToast(null);
    }, 2000);
    return () => clearTimeout(timer);
  }, [deductionToast]);

  const renderDeductionToast = () => (
    <AnimatePresence>
      {deductionToast?.show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed top-5 right-5 sm:right-8 z-50 pointer-events-none flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#121824] border-l-4 border-l-rose-500 border-y border-r border-rose-200 dark:border-rose-900/60 shadow-xl text-slate-900 dark:text-slate-100"
          role="status"
          aria-live="polite"
        >
          <div className="w-7 h-7 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold tracking-tight">
            <span className="text-rose-600 dark:text-rose-400 font-black">
              −{deductionToast.points} Points
            </span>
            <span className="text-slate-600 dark:text-slate-300 font-semibold">
              — Guided Solve Used
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Initialize Challenge State
  const setupChallenge = useCallback((challenge: GameChallenge) => {
    if (!challenge) return;

    setActiveQueue(challenge.initialStack ? [...challenge.initialStack] : []);
    setAvailableElements(challenge.availableElements ? [...challenge.availableElements] : []);
    setFeedbackStatus(null);
    setFeedbackTitle('');
    setFeedbackActionText('');
    setFeedbackLifoReason('');
    setIsPeeking(false);
    setSelectedChoiceId(null);
    setSelectedEnqueueValue(null);
    setIsGuidedSolveOpen(false);
  }, []);

  // When active level or challenge changes, re-initialize
  useEffect(() => {
    if (currentChallenge) {
      setupChallenge(currentChallenge);
    }
  }, [activeLevelId, currentChallengeIndex, currentChallenge, setupChallenge]);

  // When switching levels, reset challenge index to 0
  const handleSelectLevel = (levelId: number) => {
    soundEffects.playClick();
    setCurrentChallengeIndex(0);
    setMistakes(0);
    onSelectLevel(levelId);
  };

  // Reset current challenge
  const handleResetChallenge = () => {
    soundEffects.playClick();
    setMistakes(0);
    if (currentChallenge) {
      setupChallenge(currentChallenge);
    }
  };

  // Global Reset Game
  const handleResetGame = () => {
    soundEffects.playClick();
    setCurrentChallengeIndex(0);
    setMistakes(0);
    if (challenges[0]) {
      setupChallenge(challenges[0]);
    }
  };

  // Level 4: 30-Second Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if ((currentLevel.id === 4 || currentLevel.type === 'speed') && timedRunning && timedSeconds > 0) {
      interval = setInterval(() => {
        setTimedSeconds((t) => {
          if (t <= 1) {
            setTimedRunning(false);
            if (timedStep >= 4 && !progress.completedGameLevels.includes(4)) {
              handleTriggerLevelComplete();
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentLevel.id, currentLevel.type, timedRunning, timedSeconds, timedStep]);

  // Trigger Level Complete Reward & Modal
  const handleTriggerLevelComplete = () => {
    soundEffects.playSuccess();
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore
    }

    const rewardPoints = getGameLevelPoints(currentLevel.id);
    const isAlreadyCompleted = progress.completedGameLevels.includes(currentLevel.id);

    if (!isAlreadyCompleted) {
      const { updated } = awardXP(
        progress,
        rewardPoints,
        `game_level_${currentLevel.id}_completed`,
        `Completed Level ${currentLevel.levelNumber || currentLevel.id}`,
        currentLevel.title
      );

      const completed = Array.from(new Set([...updated.completedGameLevels, currentLevel.id]));
      onUpdateProgress({
        ...updated,
        completedGameLevels: completed,
      });
    }

    setLevelCompletedModalOpen(true);
  };

  // Advance to Next Challenge or Trigger Level Complete
  const handleNextChallenge = () => {
    soundEffects.playClick();
    if (currentChallengeIndex < challenges.length - 1) {
      setCurrentChallengeIndex((prev) => prev + 1);
    } else {
      handleTriggerLevelComplete();
    }
  };

  // =========================================================================
  // QUEUE OPERATION HANDLERS
  // =========================================================================

  // 1. ENQUEUE OPERATION
  const handleEnqueue = (val: string | number, itemIndex?: number) => {
    const capacity = currentChallenge.capacity || 5;

    // Check for overflow
    if (activeQueue.length >= capacity) {
      soundEffects.playError();
      setMistakes((m) => m + 1);
      setFeedbackStatus('incorrect');
      setFeedbackTitle('🚨 Queue Overflow!');
      setFeedbackActionText(`Cannot enqueue [${val}] because the bunker is at maximum capacity (${capacity}/${capacity}).`);
      setFeedbackLifoReason(currentChallenge.feedback?.incorrectTip || 'The queue has reached its maximum capacity.');
      return;
    }

    setSelectedEnqueueValue(val);

    if (currentChallenge.mode === 'enqueue') {
      const isTarget = currentChallenge.targetValue === undefined || String(currentChallenge.targetValue) === String(val);

      if (isTarget) {
        soundEffects.playPush();
        try {
          confetti({
            particleCount: 30,
            spread: 45,
            origin: { y: 0.65 },
          });
        } catch {
          // Ignore
        }

        const nextQueue = currentChallenge.targetStack
          ? [...currentChallenge.targetStack]
          : [...activeQueue, val];
        setActiveQueue(nextQueue);

        // Remove from available elements palette
        setAvailableElements((prev) => {
          if (itemIndex !== undefined && itemIndex >= 0 && itemIndex < prev.length) {
            const copy = [...prev];
            copy.splice(itemIndex, 1);
            return copy;
          }
          const idx = prev.findIndex((el) => String(el) === String(val));
          if (idx === -1) return prev;
          const copy = [...prev];
          copy.splice(idx, 1);
          return copy;
        });

        const xpReward = 0;
        setEarnedXP(xpReward);
        const { updated } = awardXP(
          progress,
          xpReward,
          `challenge_${currentChallenge.id}_success`,
          `Completed ${currentChallenge.question}`,
          currentLevel.title
        );
        onUpdateProgress(updated);

        setFeedbackStatus('correct');
        setFeedbackTitle(currentChallenge.feedback.correctTitle);
        setFeedbackActionText(currentChallenge.feedback.correctActionText);
        setFeedbackLifoReason(currentChallenge.feedback.lifoReason);
      } else {
        soundEffects.playError();
        setMistakes((m) => m + 1);
        setFeedbackStatus('incorrect');
        setFeedbackTitle('Incorrect Enqueue Selection');
        setFeedbackActionText(`The algorithm requested survivor [${currentChallenge.targetValue}], but you selected [${val}].`);
        setFeedbackLifoReason(currentChallenge.feedback.incorrectTip);
      }
    } else {
      // In interactive building / tracing modes (e.g. Level 2 Challenge 4):
      // Element dropped at REAR inserts into the queue!
      soundEffects.playPush();
      setActiveQueue((prev) => [...prev, val]);
    }
  };

  // Dynamic Dequeue Options based on active queue elements
  const dequeueCandidates = React.useMemo(() => {
    if (!activeQueue || activeQueue.length === 0) return [];

    const candidates: { value: string | number; positionText: string; isFront: boolean }[] = [];

    activeQueue.forEach((val, idx) => {
      candidates.push({
        value: val,
        positionText: `Waiting in line`,
        isFront: idx === 0,
      });
    });

    // If activeQueue only has 1 or 2 items, provide sensible options so there are always choices
    if (candidates.length < 3) {
      const extraPool = ['A', 'B', 'C', 'D', 'PKT-100', 'PKT-101'];
      for (const extra of extraPool) {
        if (candidates.length >= 3) break;
        if (!candidates.some((c) => String(c.value) === String(extra))) {
          candidates.push({
            value: extra,
            positionText: 'Outside queue',
            isFront: false,
          });
        }
      }
    }

    return candidates;
  }, [activeQueue]);

  // 2. DEQUEUE OPERATION
  const handleDequeue = (attemptedValue?: string | number) => {
    if (activeQueue.length === 0) {
      if (currentChallenge.mode === 'underflow') {
        handleUnderflowTrigger();
        return;
      }
      soundEffects.playError();
      setMistakes((m) => m + 1);
      setFeedbackStatus('incorrect');
      setFeedbackTitle('🚨 Queue Underflow!');
      setFeedbackActionText('Cannot remove an element because the bunker queue is empty (0 / 5).');
      setFeedbackLifoReason('There is no element at the FRONT to remove.');
      return;
    }

    const frontVal = activeQueue[0];
    const isFrontElement =
      attemptedValue === undefined ||
      String(attemptedValue) === String(frontVal);

    if (!isFrontElement) {
      soundEffects.playError();
      setMistakes((m) => m + 1);
      setFeedbackStatus('incorrect');
      setFeedbackTitle(`🚨 FIFO Violation: Cannot Dequeue [${attemptedValue}]`);
      setFeedbackActionText(
        `You selected survivor [${attemptedValue}], which is NOT at position 0 (FRONT). In a Queue, only the FRONT element [${frontVal}] is allowed to depart first.`
      );
      setFeedbackLifoReason(
        `First In, First Out (FIFO) invariant: elements must wait in line. Survivor [${attemptedValue}] cannot cut ahead of [${frontVal}].`
      );
      return;
    }

    soundEffects.playPop();
    const nextQueue = activeQueue.slice(1);
    setActiveQueue(nextQueue);

    if (currentChallenge.mode === 'dequeue') {
      try {
        confetti({
          particleCount: 35,
          spread: 50,
          origin: { y: 0.7 },
        });
      } catch {
        // Ignore
      }

      const xpReward = 0;
      setEarnedXP(xpReward);
      const { updated } = awardXP(
        progress,
        xpReward,
        `challenge_${currentChallenge.id}_success`,
        `Completed ${currentChallenge.question}`,
        currentLevel.title
      );
      onUpdateProgress(updated);

      setFeedbackStatus('correct');
      setFeedbackTitle(currentChallenge.feedback.correctTitle);
      setFeedbackActionText(currentChallenge.feedback.correctActionText);
      setFeedbackLifoReason(currentChallenge.feedback.lifoReason);
    }
  };

  // 3. IDENTIFY FRONT OPERATION
  const handleIdentifyFront = (attemptedValue: string | number) => {
    if (activeQueue.length === 0) return;
    const frontVal = activeQueue[0];
    const isTarget = String(attemptedValue) === String(frontVal);

    if (isTarget) {
      soundEffects.playSuccess();
      try {
        confetti({
          particleCount: 35,
          spread: 50,
          origin: { y: 0.7 },
        });
      } catch {}

      const xpReward = 0;
      setEarnedXP(xpReward);
      const { updated } = awardXP(
        progress,
        xpReward,
        `challenge_${currentChallenge.id}_success`,
        `Identified FRONT element [${frontVal}]`,
        currentLevel.title
      );
      onUpdateProgress(updated);

      setFeedbackStatus('correct');
      setFeedbackTitle(currentChallenge.feedback?.correctTitle || `Identified FRONT Element [${frontVal}]!`);
      setFeedbackActionText(
        currentChallenge.feedback?.correctActionText ||
          `Correct! Element [${frontVal}] stands at position [0] (FRONT pointer).`
      );
      setFeedbackLifoReason(
        currentChallenge.feedback?.lifoReason ||
          'In FIFO Queues, the FRONT pointer always points to index 0, the first element to arrive.'
      );
    } else {
      soundEffects.playError();
      setMistakes((m) => m + 1);
      setFeedbackStatus('incorrect');
      setFeedbackTitle('Incorrect FRONT Selection');
      setFeedbackActionText(
        `You selected [${attemptedValue}], but the element at the FRONT pointer (index 0) is [${frontVal}].`
      );
      setFeedbackLifoReason('The FRONT pointer always references the earliest arrival at position 0.');
    }
  };

  // 4. IDENTIFY REAR OPERATION
  const handleIdentifyRear = (attemptedValue: string | number) => {
    if (activeQueue.length === 0) return;
    const rearVal = activeQueue[activeQueue.length - 1];
    const isTarget = String(attemptedValue) === String(rearVal);

    if (isTarget) {
      soundEffects.playSuccess();
      try {
        confetti({
          particleCount: 35,
          spread: 50,
          origin: { y: 0.7 },
        });
      } catch {}

      const xpReward = 0;
      setEarnedXP(xpReward);
      const { updated } = awardXP(
        progress,
        xpReward,
        `challenge_${currentChallenge.id}_success`,
        `Identified REAR element [${rearVal}]`,
        currentLevel.title
      );
      onUpdateProgress(updated);

      setFeedbackStatus('correct');
      setFeedbackTitle(currentChallenge.feedback?.correctTitle || `Identified REAR Element [${rearVal}]!`);
      setFeedbackActionText(
        currentChallenge.feedback?.correctActionText ||
          `Correct! Element [${rearVal}] stands at the REAR pointer (most recent arrival).`
      );
      setFeedbackLifoReason(
        currentChallenge.feedback?.lifoReason ||
          'In Queues, the REAR pointer always tracks the newest arrival at the end of the line.'
      );
    } else {
      soundEffects.playError();
      setMistakes((m) => m + 1);
      setFeedbackStatus('incorrect');
      setFeedbackTitle('Incorrect REAR Selection');
      setFeedbackActionText(
        `You selected [${attemptedValue}], but the element at the REAR pointer (last position) is [${rearVal}].`
      );
      setFeedbackLifoReason('The REAR pointer always tracks the newest arrival at the end of the line.');
    }
  };

  // INVALID ENQUEUE ATTEMPT HANDLER
  const handleInvalidEnqueue = (reason?: string) => {
    soundEffects.playError();
    setMistakes((m) => m + 1);
    setFeedbackStatus('incorrect');
    setFeedbackTitle('FIFO Enqueue Rule');
    setFeedbackActionText(
      reason || 'Note: Element can only be inserted through the REAR position!'
    );
    setFeedbackLifoReason(
      'In a FIFO (First-In, First-Out) Queue, new elements can strictly only enter at the REAR pointer. Middle and front insertions are forbidden.'
    );
  };

  // 3. PEEK OPERATION
  const handlePeek = () => {
    if (activeQueue.length === 0) {
      soundEffects.playError();
      setMistakes((m) => m + 1);
      setFeedbackStatus('incorrect');
      setFeedbackTitle('Cannot PEEK Empty Queue');
      setFeedbackActionText('The queue is empty (0 / 5). No FRONT element exists to inspect.');
      setFeedbackLifoReason('PEEK requires at least one element at the FRONT.');
      return;
    }

    soundEffects.playSuccess();
    setIsPeeking(true);

    const xpReward = 0;
    setEarnedXP(xpReward);
    const { updated } = awardXP(
      progress,
      xpReward,
      `challenge_${currentChallenge.id}_success`,
      `Completed ${currentChallenge.question}`,
      currentLevel.title
    );
    onUpdateProgress(updated);

    setFeedbackStatus('correct');
    setFeedbackTitle(currentChallenge.feedback.correctTitle);
    setFeedbackActionText(currentChallenge.feedback.correctActionText);
    setFeedbackLifoReason(currentChallenge.feedback.lifoReason);
  };

  // 4. CHOICE SELECTION HANDLER
  const handleSelectChoice = (choice: { id: string; label: string; isCorrect: boolean; why?: string }) => {
    setSelectedChoiceId(choice.id);

    if (choice.isCorrect) {
      soundEffects.playSuccess();
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore
      }

      const xpReward = 0;
      setEarnedXP(xpReward);
      const { updated } = awardXP(
        progress,
        xpReward,
        `challenge_${currentChallenge.id}_success`,
        `Completed ${currentChallenge.question}`,
        currentLevel.title
      );
      onUpdateProgress(updated);

      setFeedbackStatus('correct');
      setFeedbackTitle(currentChallenge.feedback.correctTitle);
      setFeedbackActionText(currentChallenge.feedback.correctActionText);
      setFeedbackLifoReason(choice.why || currentChallenge.feedback.lifoReason);
    } else {
      soundEffects.playError();
      setMistakes((m) => m + 1);

      setFeedbackStatus('incorrect');
      setFeedbackTitle('Incorrect Selection');
      setFeedbackActionText(choice.why || 'That is not the correct queue behavior.');
      setFeedbackLifoReason(currentChallenge.feedback.incorrectTip);
    }
  };

  // 5. OVERFLOW TEST TRIGGER HANDLER
  const handleOverflowTrigger = () => {
    soundEffects.playError();
    try {
      confetti({
        particleCount: 30,
        spread: 40,
        origin: { y: 0.65 },
      });
    } catch {
      // Ignore
    }

    const xpReward = 0;
    setEarnedXP(xpReward);
    const { updated } = awardXP(
      progress,
      xpReward,
      `challenge_${currentChallenge.id}_success`,
      `Tested Overflow Exception`,
      currentLevel.title
    );
    onUpdateProgress(updated);

    setFeedbackStatus('correct');
    setFeedbackTitle(currentChallenge.feedback.correctTitle);
    setFeedbackActionText(currentChallenge.feedback.correctActionText);
    setFeedbackLifoReason(currentChallenge.feedback.lifoReason);
  };

  // 6. UNDERFLOW TEST TRIGGER HANDLER
  const handleUnderflowTrigger = () => {
    soundEffects.playError();
    try {
      confetti({
        particleCount: 30,
        spread: 40,
        origin: { y: 0.65 },
      });
    } catch {
      // Ignore
    }

    const xpReward = 0;
    setEarnedXP(xpReward);
    const { updated } = awardXP(
      progress,
      xpReward,
      `challenge_${currentChallenge.id}_success`,
      `Tested Underflow Exception`,
      currentLevel.title
    );
    onUpdateProgress(updated);

    setFeedbackStatus('correct');
    setFeedbackTitle(currentChallenge.feedback.correctTitle);
    setFeedbackActionText(currentChallenge.feedback.correctActionText);
    setFeedbackLifoReason(currentChallenge.feedback.lifoReason);
  };

  // 7. LEVEL 6 TIMED & UNTIMED RAPID-FIRE ACTIONS
  const handleTimedAction = (action: 'ENQUEUE' | 'DEQUEUE' | 'PEEK', value?: string | number) => {
    if (!timedRunning && !isUntimedMode) return;

    const activePrompt = challenges[timedStep] || challenges[0];

    if (activePrompt.mode === 'enqueue') {
      if (action === 'ENQUEUE' && String(value) === String(activePrompt.targetValue)) {
        soundEffects.playPush();
        setActiveQueue((prev) => [...prev, value!]);
        setTimedScore((s) => s + 100 * timedCombo);
        setTimedCombo((c) => Math.min(3, c + 1));

        if (timedStep < challenges.length - 1) {
          setTimedStep((s) => s + 1);
          setCurrentChallengeIndex((s) => s + 1);
        } else {
          setTimedRunning(false);
          setIsUntimedMode(false);
          handleTriggerLevelComplete();
        }
      } else {
        soundEffects.playError();
        setMistakes((m) => m + 1);
        setTimedCombo(1);
      }
    } else if (activePrompt.mode === 'dequeue') {
      if (action === 'DEQUEUE' && activeQueue.length > 0) {
        soundEffects.playPop();
        setActiveQueue((prev) => prev.slice(1));
        setTimedScore((s) => s + 100 * timedCombo);
        setTimedCombo((c) => Math.min(3, c + 1));

        if (timedStep < challenges.length - 1) {
          setTimedStep((s) => s + 1);
          setCurrentChallengeIndex((s) => s + 1);
        } else {
          setTimedRunning(false);
          setIsUntimedMode(false);
          handleTriggerLevelComplete();
        }
      } else {
        soundEffects.playError();
        setMistakes((m) => m + 1);
        setTimedCombo(1);
      }
    } else if (activePrompt.mode === 'peek') {
      if (action === 'PEEK' && activeQueue.length > 0) {
        soundEffects.playSuccess();
        setIsPeeking(true);
        setTimeout(() => setIsPeeking(false), 1200);
        setTimedScore((s) => s + 100 * timedCombo);
        setTimedCombo((c) => Math.min(3, c + 1));

        if (timedStep < challenges.length - 1) {
          setTimedStep((s) => s + 1);
          setCurrentChallengeIndex((s) => s + 1);
        } else {
          setTimedRunning(false);
          setIsUntimedMode(false);
          handleTriggerLevelComplete();
        }
      } else {
        soundEffects.playError();
        setMistakes((m) => m + 1);
        setTimedCombo(1);
      }
    }
  };

  const handleOpenGuidedSolve = (levelId?: number) => {
    soundEffects.playClick();
    const targetLvl = levelId || activeLevelId;
    const targetLevelConfig = GAME_LEVELS.find((l) => l.id === targetLvl) || currentLevel;
    const targetChallengeIndex = targetLvl === activeLevelId ? currentChallengeIndex : 0;
    const targetChallenge =
      (targetLevelConfig.challenges && targetLevelConfig.challenges[targetChallengeIndex]) ||
      targetLevelConfig.challenges?.[0];

    const isLevelAlreadyCompleted = progress.completedGameLevels.includes(targetLvl);
    if (targetChallenge && !isLevelAlreadyCompleted) {
      const configuredDeduction = Math.abs(QUEUE_SCORING.game.guidedSolveDeduction);
      const eventKey = `guided_solve_${targetLvl}_${targetChallenge.id}`;
      let isNewlyApplied = false;

      onUpdateProgress((prev) => {
        if (prev.completedGameLevels.includes(targetLvl)) return prev;
        const { updated, applied } = applyQueueDeduction(
          prev,
          configuredDeduction,
          eventKey,
          'Used Guided Solve',
          `Guided Solve deduction (-${configuredDeduction} points)`
        );
        isNewlyApplied = applied;
        return updated;
      });

      if (isNewlyApplied) {
        setDeductionToast({
          show: true,
          points: configuredDeduction,
        });
      }
    }
    if (!guidedSnapshotRef.current) {
      guidedSnapshotRef.current = {
        activeLevelId,
        activeQueue: [...activeQueue],
        availableElements: [...availableElements],
        mistakes,
        selectedChoiceId,
        selectedEnqueueValue,
        feedbackStatus,
        feedbackTitle,
        feedbackActionText,
        feedbackLifoReason,
        earnedXP,
        currentChallengeIndex,
        timedRunning,
        isUntimedMode,
        timedSeconds,
        timedScore,
        timedCombo,
        timedStep,
      };
    }
    setGuidedSolveLevelId(targetLvl);
    if (viewMode !== 'playing') {
      handleSelectLevel(targetLvl);
      setViewMode('playing');
    }
    setIsGuidedSolveOpen(true);
  };

  const restoreGuidedGameState = () => {
    const snapshot = guidedSnapshotRef.current;
    if (!snapshot) return;
    if (snapshot.activeLevelId !== activeLevelId) {
      onSelectLevel(snapshot.activeLevelId);
    }
    setActiveQueue([...snapshot.activeQueue]);
    setAvailableElements([...snapshot.availableElements]);
    setMistakes(snapshot.mistakes);
    setSelectedChoiceId(snapshot.selectedChoiceId);
    setSelectedEnqueueValue(snapshot.selectedEnqueueValue);
    setFeedbackStatus(snapshot.feedbackStatus);
    setFeedbackTitle(snapshot.feedbackTitle);
    setFeedbackActionText(snapshot.feedbackActionText);
    setFeedbackLifoReason(snapshot.feedbackLifoReason);
    setEarnedXP(snapshot.earnedXP);
    setCurrentChallengeIndex(snapshot.currentChallengeIndex);
    setTimedRunning(snapshot.timedRunning);
    setIsUntimedMode(snapshot.isUntimedMode);
    setTimedSeconds(snapshot.timedSeconds);
    setTimedScore(snapshot.timedScore);
    setTimedCombo(snapshot.timedCombo);
    setTimedStep(snapshot.timedStep);
    guidedSnapshotRef.current = null;
  };

  const handleGuidedSolveFinish = () => {
    soundEffects.playSuccess();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore
    }

    const xpReward = 0;
    setEarnedXP(xpReward);
    const { updated } = awardXP(
      progress,
      xpReward,
      `challenge_${currentChallenge?.id}_guided_solve`,
      `Completed Guided Walkthrough`,
      currentLevel.title
    );
    onUpdateProgress(updated);

    setFeedbackStatus('correct');
    setFeedbackTitle(currentChallenge?.feedback?.correctTitle || 'Guided Solve Completed!');
    setFeedbackActionText(
      currentChallenge?.feedback?.correctActionText ||
        'The operation was successfully demonstrated on the queue.'
    );
    setFeedbackLifoReason(
      currentChallenge?.feedback?.lifoReason ||
        'FIFO ensures all queue arrivals are serviced in deterministic order.'
    );

  };

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: HUB
  // ─────────────────────────────────────────────────────────────────────────
  if (viewMode === 'hub') {
    return (
      <div className="w-full">
        {renderDeductionToast()}
        <GameHub
          progress={progress}
          activeLevelId={activeLevelId}
          currentChallengeIndex={currentChallengeIndex}
          onOpenPreview={(game) => {
            setSelectedGameForPreview(game);
          }}
          onDirectContinue={(levelId) => {
            handleSelectLevel(levelId);
            setViewMode('playing');
          }}
          onOpenGuidedSolve={(levelId) => {
            handleOpenGuidedSolve(levelId);
          }}
          onOpenInGameLab={() => {
            soundEffects.playClick();
            setViewMode('lab');
          }}
          onUpdateProgress={onUpdateProgress}
        />

        <GamePreviewModal
          game={selectedGameForPreview}
          isOpen={selectedGameForPreview !== null}
          isCompleted={progress.completedGameLevels.includes(selectedGameForPreview?.id || -1)}
          isInProgress={
            selectedGameForPreview?.id === activeLevelId && currentChallengeIndex > 0
          }
          currentChallengeProgress={{
            current: currentChallengeIndex + 1,
            total: challenges.length,
          }}
          onClose={() => setSelectedGameForPreview(null)}
          onStartGame={(gameId) => {
            setSelectedGameForPreview(null);
            handleSelectLevel(gameId);
            setViewMode('playing');
          }}
          onOpenGuidedSolve={(gameId) => {
            setSelectedGameForPreview(null);
            handleOpenGuidedSolve(gameId);
          }}
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: IN-GAME EXPERIMENT LAB
  // ─────────────────────────────────────────────────────────────────────────
  if (viewMode === 'lab') {
    return (
      <div className="w-full animate-in fade-in duration-200">
        {renderDeductionToast()}
        <InGameLab
          progress={progress}
          onUpdateProgress={onUpdateProgress}
          onBackToGame={() => {
            soundEffects.playClick();
            setViewMode('hub');
          }}
          onSelectLevel={(levelId) => {
            handleSelectLevel(levelId);
            setViewMode('playing');
          }}
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: PLAYING (ACTIVE QUEUE GAMEPLAY)
  // ─────────────────────────────────────────────────────────────────────────
  const frontValue = activeQueue.length > 0 ? activeQueue[0] : null;
  const rearValue = activeQueue.length > 0 ? activeQueue[activeQueue.length - 1] : null;

  return (
    <div className="space-y-4 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Level Completed Celebration Modal */}
      <LevelCompleteModal
        isOpen={levelCompletedModalOpen}
        level={currentLevel}
        xpEarned={getGameLevelPoints(currentLevel.id)}
        mistakes={mistakes}
        hasNextLevel={activeLevelId < GAME_LEVELS.length}
        onNextLevel={() => {
          setLevelCompletedModalOpen(false);
          const nextLvlId = activeLevelId + 1;
          if (nextLvlId <= GAME_LEVELS.length) {
            handleSelectLevel(nextLvlId);
            setViewMode('playing');
          } else {
            setViewMode('hub');
          }
        }}
        onReplayLevel={() => {
          setLevelCompletedModalOpen(false);
          setCurrentChallengeIndex(0);
          setMistakes(0);
          if (currentLevel.challenges[0]) {
            setupChallenge(currentLevel.challenges[0]);
          }
        }}
        onClose={() => {
          setLevelCompletedModalOpen(false);
          setViewMode('hub');
        }}
      />

      {/* 1. Minimal Top Game Bar with Game Hub Return */}
      <GameHeader
        currentLevel={currentLevel}
        allLevels={GAME_LEVELS}
        currentChallengeIndex={currentChallengeIndex}
        totalChallenges={challenges.length}
        progress={progress}
        mistakes={mistakes}
        maxMistakes={3}
        isLabActive={false}
        onOpenLab={() => {
          soundEffects.playClick();
          setViewMode('lab');
        }}
        onOpenGuidedSolve={() => handleOpenGuidedSolve(activeLevelId)}
        onSelectLevel={handleSelectLevel}
        onBackToHub={() => {
          soundEffects.playClick();
          setViewMode('hub');
        }}
      />

      {/* 2. Question Card and Guided Solve */}
      {currentChallenge && (
        <QuestionCard
          challenge={currentChallenge}
          levelNumber={currentLevel.levelNumber || currentLevel.id}
          currentChallengeIndex={currentChallengeIndex}
          totalChallenges={challenges.length}
          onOpenGuidedSolve={() => handleOpenGuidedSolve(activeLevelId)}
          onUseHint={() => {
            if (currentChallenge) {
              if (progress.completedGameLevels.includes(activeLevelId)) {
                return;
              }
              onUpdateProgress((prev) => {
                if (prev.completedGameLevels.includes(activeLevelId)) {
                  return prev;
                }
                const { updated } = applyQueueDeduction(
                  prev,
                  QUEUE_SCORING.game.hintDeduction,
                  `hint_${activeLevelId}_${currentChallenge.id}`,
                  'Used Hint',
                  'Hint deduction'
                );
                return updated;
              });
            }
          }}
        />
      )}
      {isGuidedSolveOpen && currentChallenge && (
        <InlineGuidedSolveCard
          challenge={currentChallenge}
          level={currentLevel}
          currentQueue={activeQueue}
          onClose={() => {
            soundEffects.playClick();
            setIsGuidedSolveOpen(false);
            restoreGuidedGameState();
          }}
          onFinish={handleGuidedSolveFinish}
          hasNextLevel={activeLevelId < GAME_LEVELS.length}
          onNextLevel={() => {
            soundEffects.playClick();
            setIsGuidedSolveOpen(false);
            restoreGuidedGameState();
            handleSelectLevel(activeLevelId + 1);
            setViewMode('playing');
          }}
          onUpdateQueuePreview={(previewQueue) => {
            setActiveQueue(previewQueue);
          }}
        />
      )}

      {/* 3. Game Feedback Card (Displays "WHY DID THIS HAPPEN?" upon every operation) */}
      <GameFeedbackCard
        status={feedbackStatus}
        title={feedbackTitle}
        actionText={feedbackActionText}
        lifoReason={feedbackLifoReason}
        xpEarned={earnedXP}
        onNextChallenge={handleNextChallenge}
        onRetry={() => {
          setFeedbackStatus(null);
          if (currentChallenge) setupChallenge(currentChallenge);
        }}
        isLastChallenge={currentChallengeIndex === challenges.length - 1}
      />

      {/* 4. PRIMARY INTERACTIVE ARENA (Matching reference image) */}
      <InteractiveArena
        items={activeQueue}
        capacity={currentChallenge?.capacity || 5}
        availableElements={
          availableElements && availableElements.length > 0
            ? availableElements
            : currentChallenge?.availableElements && currentChallenge.availableElements.length > 0
            ? currentChallenge.availableElements
            : [10, 20, 30, 40]
        }
        simulatorBadgeLabel={
          activeLevelId === 2
            ? 'Execution Trace Simulator'
            : currentLevel.id === 3
            ? 'Multi-Station & Ring Buffer'
            : currentLevel.id === 4
            ? 'Telecom FIFO Buffer'
            : 'Execution Trace Simulator'
        }
        subtitle="Drag elements to FRONT or REAR to build the queue."
        onEnqueue={(val) => handleEnqueue(val)}
        onDequeue={(val) => handleDequeue(val)}
        onSelectElement={(val) => {
          if (currentChallenge?.mode === 'dequeue') {
            handleDequeue(val);
          } else if (
            currentChallenge?.mode === 'identify_front' ||
            currentChallenge?.mode === 'peek'
          ) {
            handleIdentifyFront(val);
          } else if (currentChallenge?.mode === 'identify_rear') {
            handleIdentifyRear(val);
          } else if (currentChallenge?.mode === 'enqueue') {
            handleEnqueue(val);
          } else if (currentChallenge?.choices && currentChallenge.choices.length > 0) {
            const matched = currentChallenge.choices.find(
              (c) =>
                String(c.label).includes(String(val)) ||
                String(c.id).toLowerCase() === String(val).toLowerCase()
            );
            if (matched) {
              handleSelectChoice(matched);
            } else if (String(currentChallenge.targetValue) === String(val)) {
              handleIdentifyFront(val);
            } else {
              soundEffects.playClick();
            }
          } else {
            if (
              currentChallenge?.targetValue !== undefined &&
              String(currentChallenge.targetValue) === String(val)
            ) {
              handleIdentifyFront(val);
            } else {
              handleEnqueue(val);
            }
          }
        }}
        onInvalidAction={(reason) => handleInvalidEnqueue(reason)}
        highlightFront={
          currentChallenge?.mode === 'dequeue' ||
          currentChallenge?.mode === 'peek' ||
          currentChallenge?.mode === 'identify_front'
        }
        highlightRear={
          currentChallenge?.mode === 'enqueue' || currentChallenge?.mode === 'identify_rear'
        }
        selectedElementValue={selectedEnqueueValue || selectedChoiceId}
      />


      {/* MODE: MULTIPLE CHOICE (Level 1, Level 2, Level 3, Level 4) */}
      {currentChallenge?.choices && currentChallenge.choices.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border-2 border-blue-400/80 dark:border-blue-600/80 shadow-md space-y-4">
          {/* Dominant Highlighted Question Banner inside Choice section */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border-2 border-blue-300 dark:border-blue-700 flex items-start gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              ?
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-100/60 dark:bg-blue-900/60 px-2 py-0.5 rounded border border-blue-300 dark:border-blue-700 inline-block">
                QUESTION TO ANSWER:
              </span>
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                {currentChallenge.question}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              SELECT THE CORRECT ANSWER BELOW
            </span>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              Click an option OR drag &amp; drop it into the Answer Drop Zone
            </span>
          </div>

          {/* Interactive Answer Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
            }}
            onDrop={(e) => {
              e.preventDefault();
              const raw = e.dataTransfer.getData('application/json');
              if (raw) {
                try {
                  const choice = JSON.parse(raw);
                  handleSelectChoice(choice);
                } catch {
                  // ignore
                }
              }
            }}
            className="w-full p-3.5 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-950/40 flex items-center justify-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300 select-none transition-colors hover:bg-blue-100/70 dark:hover:bg-blue-900/40 cursor-pointer"
          >
            <span className="text-base">🎯</span>
            <span>Drag and drop your chosen option here (or click any option below)</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {currentChallenge.choices.map((choice, idx) => {
              const isSelected = selectedChoiceId === choice.id;
              const isCorrectFeedback = feedbackStatus === 'correct' && isSelected;
              const isIncorrectFeedback = feedbackStatus === 'incorrect' && isSelected;

              // Highlight bracketed values in choice label
              const parts = choice.label.split(/(\[[^\]]+\])/g);

              return (
                <div
                  key={choice.id || idx}
                  draggable={feedbackStatus !== 'correct'}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify(choice));
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => {
                    if (feedbackStatus !== 'correct') {
                      handleSelectChoice(choice);
                    }
                  }}
                  className={`p-3.5 sm:p-4 rounded-xl text-left border-2 transition-all flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold select-none cursor-pointer ${
                    isCorrectFeedback
                      ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-500 text-blue-950 dark:text-blue-100 shadow-xs ring-2 ring-blue-300 dark:ring-blue-800'
                      : isIncorrectFeedback
                      ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-400 text-slate-900 dark:text-slate-100 ring-2 ring-slate-300 dark:ring-slate-700'
                      : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-800 dark:text-slate-200 hover:scale-[1.01]'
                  }`}
                  title="Click option or drag into Answer Drop Zone"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-snug">
                      {parts.map((p, pIdx) => {
                        if (p.startsWith('[') && p.endsWith(']')) {
                          return (
                            <span
                              key={pIdx}
                              className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800 font-mono font-bold text-xs"
                            >
                              {p}
                            </span>
                          );
                        }
                        return p;
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-normal">
                      Click / Drag
                    </span>
                    {isCorrectFeedback && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                    {isIncorrectFeedback && (
                      <AlertTriangle className="w-5 h-5 text-slate-500 shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE: OVERFLOW TEST (Level 1) */}
      {currentChallenge?.mode === 'overflow' && (
        <div className="bg-slate-100/80 dark:bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider font-mono">
            <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>QUEUE OVERFLOW SIMULATION ZONE</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            The bunker queue is holding 4 survivors out of 4 capacity slots (100% full). Test the software exception guardrail.
          </p>

          <button
            onClick={handleOverflowTrigger}
            disabled={feedbackStatus === 'correct'}
            className="px-5 py-3 rounded-xl font-mono font-black text-xs uppercase tracking-wide bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>ENQUEUE SURVIVOR [E] (TRIGGER & TEST OVERFLOW)</span>
          </button>
        </div>
      )}

      {/* MODE: UNDERFLOW TEST (Level 1) */}
      {currentChallenge?.mode === 'underflow' && (
        <div className="bg-blue-50/60 dark:bg-blue-950/30 p-4 sm:p-5 rounded-2xl border border-blue-200 dark:border-blue-800/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-xs uppercase tracking-wider font-mono">
            <AlertTriangle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>QUEUE UNDERFLOW SIMULATION ZONE</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            The bunker queue is completely empty (0 / 4 survivors). There is no element at the FRONT pointer to remove.
          </p>

          <button
            onClick={handleUnderflowTrigger}
            disabled={feedbackStatus === 'correct'}
            className="px-5 py-3 rounded-xl font-mono font-black text-xs uppercase tracking-wide bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>DEQUEUE EMPTY QUEUE (TRIGGER & TEST UNDERFLOW)</span>
          </button>
        </div>
      )}

      {renderDeductionToast()}
    </div>
  );
};
