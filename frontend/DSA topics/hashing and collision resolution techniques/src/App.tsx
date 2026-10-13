import React, { useState, useEffect } from 'react';
import { GameState, LevelConfig, ProbeStep, TableSlot, TechniqueType } from './types/game';
import { GAME_LEVELS } from './data/levels';
import {
  calculateBaseHash,
  calculateH2,
  computeDoubleHashSequence,
  computeLinearProbeSequence,
  computeQuadraticProbeSequence,
} from './utils/hashAlgorithms';
import { soundManager } from './utils/audio';
import { MainViewTab } from './types/game';
import { SidebarNav } from './components/SidebarNav';
import { TopHeader } from './components/TopHeader';
import { HomePage } from './components/HomePage';
import { LevelProgressBar } from './components/LevelProgressBar';
import { CurrentKeyCard } from './components/CurrentKeyCard';
import { HashTable } from './components/HashTable';
import { ProbingController } from './components/ProbingController';
import { ExplanationPanel } from './components/ExplanationPanel';
import { CollisionModal } from './components/CollisionModal';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { SandboxMode } from './components/SandboxMode';
import { LearnHashingSection } from './components/LearnHashingSection';
import { VideoTutorialsView } from './components/VideoTutorialsView';
import { MyProgressView } from './components/MyProgressView';
import { QuizView } from './components/QuizView';
import { QuestCompletionView } from './components/QuestCompletionView';
import { NotFoundView } from './components/NotFoundView';
import { GameHintCard } from './components/GameHintCard';
import { GameLevelGuide } from './components/GameLevelGuide';
import { CompletionCelebrationModal } from './components/CompletionCelebrationModal';
import { ResetProgressModal } from './components/ResetProgressModal';
import { AIBotFloatingButton } from './components/AIBotFloatingButton';
import { GuidedSolvePanel } from './components/GuidedSolvePanel';
import { getGuidedSolveStepInfo } from './utils/guidedSolveEngine';
import { GameLevelCardsView } from './components/GameLevelCardsView';
import { PointsView } from './components/PointsView';
import { PointsNotificationToast } from './components/PointsNotificationToast';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { progressManager } from './utils/progressManager';
import { pointsManager } from './utils/pointsManager';
import { useScrollReveal } from './hooks/useScrollReveal';

type ActiveViewTab = MainViewTab | 'NOT_FOUND';

const parseHashToTab = (hashStr: string): ActiveViewTab => {
  const cleanHash = hashStr.replace(/^#\/?/, '').toLowerCase().trim();
  if (!cleanHash || cleanHash === 'home' || cleanHash === 'overview') return 'HOME';
  if (cleanHash === 'theory' || cleanHash === 'learn') return 'THEORY';
  if (cleanHash === 'video' || cleanHash === 'videos' || cleanHash === 'visualize') return 'VIDEO';
  if (cleanHash === 'game' || cleanHash === 'quest') return 'GAME';
  if (cleanHash === 'lab' || cleanHash === 'sandbox') return 'LAB';
  if (cleanHash === 'quiz' || cleanHash === 'exam') return 'QUIZ';
  if (cleanHash === 'progress') return 'PROGRESS';
  if (cleanHash === 'points' || cleanHash === 'score') return 'POINTS';
  return 'NOT_FOUND';
};

const getTabHash = (tab: ActiveViewTab): string => {
  switch (tab) {
    case 'HOME': return '#overview';
    case 'THEORY': return '#theory';
    case 'VIDEO': return '#video';
    case 'GAME':
    case 'QUEST': return '#game';
    case 'LAB': return '#lab';
    case 'QUIZ': return '#quiz';
    case 'PROGRESS': return '#progress';
    case 'POINTS': return '#points';
    case 'NOT_FOUND': return '#404';
    default: return '#overview';
  }
};

export default function App() {
  // Navigation View State (Initialized from URL Hash with HOME fallback)
  const [activeTab, setActiveTab] = useState<ActiveViewTab>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      return parseHashToTab(window.location.hash);
    }
    return 'HOME';
  });

  const handleTabChange = (tab: ActiveViewTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const targetHash = getTabHash(tab);
      if (window.location.hash !== targetHash) {
        window.history.replaceState(null, '', targetHash);
      }
    }
  };

  // Synchronize activeTab when browser back/forward buttons or hash changes occur
  useEffect(() => {
    const handleHashChange = () => {
      const parsedTab = parseHashToTab(window.location.hash);
      setActiveTab(parsedTab);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  const [activeTheoryTopic, setActiveTheoryTopic] = useState<string>('what-is-hashing');
  const [show100Celebration, setShow100Celebration] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState<boolean>(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileSidebarOpen((prev) => !prev);
    } else {
      setDesktopSidebarOpen((prev) => !prev);
    }
  };

  // Close sidebar on outside click across desktop and mobile
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
      const isSidebarOpen = isDesktop ? desktopSidebarOpen : mobileSidebarOpen;
      if (!isSidebarOpen) return;

      const isInsideSidebar = target.closest('#app-sidebar-container') || target.closest('#app-sidebar-navigation');
      const isToggleButton = target.closest('#btn-sidebar-toggle');

      if (!isInsideSidebar && !isToggleButton) {
        if (isDesktop) {
          setDesktopSidebarOpen(false);
        } else {
          setMobileSidebarOpen(false);
        }
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [desktopSidebarOpen, mobileSidebarOpen]);

  // Game Configuration State
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const [completedLevels, setCompletedLevels] = useState<number[]>(() => {
    const state = progressManager.getState();
    return state.levelsCompleted;
  });
  const [score, setScore] = useState<number>(() => {
    return progressManager.getState().totalScore;
  });
  const [streak, setStreak] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [gameViewMode, setGameViewMode] = useState<'SELECTION' | 'PLAYING'>('SELECTION');

  // Trigger scroll-to-reveal animations on tab and level changes
  useScrollReveal([activeTab, currentLevelIndex]);

  // Monitor for progress updates and 100% completion event across the application
  useEffect(() => {
    const syncProgress = () => {
      const stats = progressManager.getStats();
      const state = progressManager.getState();
      setCompletedLevels([...state.levelsCompleted]);
      setScore(state.totalScore);
      if (stats.percentage === 100 && !state.hasCelebrated100Percent) {
        setShow100Celebration(true);
        progressManager.setCelebrationAcknowledged();
      }
    };

    syncProgress();
    const unsubscribe = progressManager.subscribe(() => {
      syncProgress();
    });
    return unsubscribe;
  }, []);

  // Strict 5/5 game completion status
  const isAllLevelsCompleted = [1, 2, 3, 4, 5].every(
    (lvl) => completedLevels.includes(lvl) || progressManager.getState().levelsCompleted.includes(lvl)
  );

  // Guard against direct access to completion (Level 6) before all 5 levels are completed
  useEffect(() => {
    if (currentLevelIndex >= 5 && !isAllLevelsCompleted) {
      const safeIndex = Math.min(completedLevels.length, 4);
      setCurrentLevelIndex(safeIndex);
      initLevel(safeIndex);
    }
  }, [currentLevelIndex, isAllLevelsCompleted, completedLevels]);

  // Active Level State
  const currentLevel: LevelConfig = GAME_LEVELS[Math.min(currentLevelIndex, 4)] || GAME_LEVELS[0];
  const [slots, setSlots] = useState<TableSlot[]>(() =>
    Array.from({ length: 10 }, (_, i) => ({
      index: i,
      items: [],
      status: 'idle',
    }))
  );
  const [keySequenceIndex, setKeySequenceIndex] = useState<number>(0);
  const [currentKey, setCurrentKey] = useState<number | null>(null);
  const [gameState, setGameState] = useState<GameState>('INTRO');
  const [calculatedIndex, setCalculatedIndex] = useState<number | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Collision & Probing State
  const [collidedSlotIndex, setCollidedSlotIndex] = useState<number | null>(null);
  const [collidingExistingKey, setCollidingExistingKey] = useState<number | null>(null);
  const [probeSteps, setProbeSteps] = useState<ProbeStep[]>([]);
  const [currentProbeStepIndex, setCurrentProbeStepIndex] = useState<number>(0);
  const [isProbing, setIsProbing] = useState<boolean>(false);

  // Modals & Interactive Overlays
  const [showCollisionModal, setShowCollisionModal] = useState<boolean>(false);
  const [showLevelCompleteModal, setShowLevelCompleteModal] = useState<boolean>(false);

  // Guided Solve State
  const [isGuidedSolveActive, setIsGuidedSolveActive] = useState<boolean>(false);
  const [isExecutingGuidedStep, setIsExecutingGuidedStep] = useState<boolean>(false);

  // Sandbox pre-configuration
  const [sandboxTechnique, setSandboxTechnique] = useState<TechniqueType>('linear');

  // Initialize level
  const initLevel = (levelIdx: number, customKeys?: number[], customTechnique?: TechniqueType) => {
    const lvl = GAME_LEVELS[levelIdx] || GAME_LEVELS[0];
    const size = lvl.tableSize || 10;

    setSlots(
      Array.from({ length: size }, (_, i) => ({
        index: i,
        items: [],
        status: 'idle',
      }))
    );
    setKeySequenceIndex(0);
    const keys = customKeys || lvl.keysSequence;
    const firstKey = keys[0] ?? null;
    setCurrentKey(firstKey);
    setCalculatedIndex(null);
    setTargetIndex(null);
    setCollidedSlotIndex(null);
    setCollidingExistingKey(null);
    setProbeSteps([]);
    setCurrentProbeStepIndex(0);
    setIsProbing(false);
    setShowCollisionModal(false);
    setShowLevelCompleteModal(false);
    setIsGuidedSolveActive(false);
    setIsExecutingGuidedStep(false);
    setGameState('KEY_APPEARS');

    if (firstKey !== null) {
      soundManager.playKeyAppear();
    }
  };

  // Level effect
  useEffect(() => {
    if (activeTab === 'GAME' || activeTab === 'QUEST') {
      initLevel(currentLevelIndex);
    }
  }, [currentLevelIndex, activeTab]);

  // Subscribe to progress manager
  useEffect(() => {
    const unsub = progressManager.subscribe((pState) => {
      setCompletedLevels(pState.levelsCompleted);
      setScore(pState.totalScore);
    });
    return () => unsub();
  }, []);

  // Dynamic Page Title & Meta Description for Production SEO and Tab Precision
  useEffect(() => {
    let title = 'AlgoLearn — Interactive Data Structures & Hashing Mastery';
    let desc = 'Master hash functions, collision resolution strategies (separate chaining, linear & quadratic probing, double hashing), and time complexity with interactive visual algorithms on AlgoLearn.';

    switch (activeTab) {
      case 'HOME':
        title = 'AlgoLearn — Interactive Data Structures & Hashing Mastery';
        desc = 'Master hash functions, collision resolution strategies (separate chaining, linear & quadratic probing, double hashing), and time complexity with interactive visual algorithms on AlgoLearn.';
        break;
      case 'THEORY':
        title = 'Theory & Principles | AlgoLearn';
        desc = 'In-depth theoretical foundations of hash tables, load factors, collision resolution, and hash function properties.';
        break;
      case 'GAME':
      case 'QUEST':
        title = `Level 0${currentLevel.id}: ${currentLevel.title} | AlgoLearn`;
        desc = `Interactive hashing game level 0${currentLevel.id} covering ${currentLevel.technique} collision resolution and array slot mapping.`;
        break;
      case 'LAB':
      case 'SANDBOX':
        title = 'Interactive Sandbox Lab | AlgoLearn';
        desc = 'Free-play experimentation lab for testing custom hash table capacities, keys, load factors, and collision resolution algorithms.';
        break;
      case 'VIDEO':
        title = 'Video Masterclasses | AlgoLearn';
        desc = 'High-definition video lessons and visual animations breaking down hash table architectures and collision resolution techniques.';
        break;
      case 'QUIZ':
        title = 'Knowledge Assessment Quiz | AlgoLearn';
        desc = 'Comprehensive 10-question evaluation covering hash calculations, separate chaining, linear/quadratic probing, and double hashing.';
        break;
      case 'PROGRESS':
        title = 'My Mastery & Progress | AlgoLearn';
        desc = 'Track completed quest levels, accuracy scores, video progress, and assessment certificates on AlgoLearn.';
        break;
      case 'NOT_FOUND':
        title = 'Page Not Found (404) | AlgoLearn';
        desc = 'The requested curriculum page or module could not be found on AlgoLearn.';
        break;
    }

    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', desc);
    }

    // Dynamic canonical link synchronization
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    const hash = activeTab === 'HOME' ? '' : getTabHash(activeTab);
    canonical.setAttribute('href', `${currentOrigin}${currentPath}${hash}`);
  }, [activeTab, currentLevel.id, currentLevel.title, currentLevel.technique]);

  // Handle calculation
  const performCalculation = (keyVal: number | string) => {
    setIsCalculating(true);
    const numKey = Number(keyVal);
    const m = Number(currentLevel.tableSize);
    const hash = calculateBaseHash(numKey, m);
    setCalculatedIndex(hash);
    setTargetIndex(hash);
    setIsCalculating(false);
    setGameState('INDEX_FOUND');
    soundManager.playCalcSuccess();
    setScore((s) => s + 10);
    setStreak((st) => st + 1);
  };

  const handleManualModulusSubmit = (userAnswer: number | string): boolean => {
    if (currentKey === null) return false;
    const numAns = Number(userAnswer);
    const numKey = Number(currentKey);
    const m = Number(currentLevel.tableSize);
    const correctHash = calculateBaseHash(numKey, m);
    if (numAns === correctHash) {
      setCalculatedIndex(correctHash);
      setTargetIndex(correctHash);
      setGameState('INDEX_FOUND');
      soundManager.playCalcSuccess();
      setScore((s) => s + 15);
      setStreak((st) => st + 1);
      return true;
    } else {
      soundManager.playError();
      setStreak(0);
      return false;
    }
  };

  // Drag handlers
  const handleDragStart = () => {
    if (calculatedIndex !== null && gameState === 'INDEX_FOUND') {
      soundManager.playDragStart();
      setGameState('DRAGGING');
    }
  };

  const handleDragEnd = () => {
    if (gameState === 'DRAGGING') {
      setGameState('INDEX_FOUND');
    }
  };

  // Cell interaction & Placement
  const handleCellClick = (cellIndex: number) => {
    if (gameState === 'INDEX_FOUND' || gameState === 'DRAGGING') {
      if (currentKey === null) return;
      const expectedHash = calculateBaseHash(currentKey, currentLevel.tableSize);
      if (cellIndex === expectedHash) {
        placeKeyInSlot(cellIndex);
      } else {
        soundManager.playDropInvalid();
      }
    }
  };

  const handleDropOnCell = (cellIndex: number) => {
    if (gameState === 'INDEX_FOUND' || gameState === 'DRAGGING') {
      if (currentKey === null) return;
      const expectedHash = calculateBaseHash(currentKey, currentLevel.tableSize);
      if (cellIndex === expectedHash) {
        placeKeyInSlot(cellIndex);
      } else {
        soundManager.playDropInvalid();
      }
    }
  };

  // Core Key Placement Logic
  const placeKeyInSlot = (slotIdx: number) => {
    if (currentKey === null) return;
    const baseHash = calculateBaseHash(currentKey, currentLevel.tableSize);
    const slot = slots[slotIdx];

    // Separate Chaining
    if (currentLevel.technique === 'chaining') {
      soundManager.playChain();
      setSlots((prev) =>
        prev.map((s) => {
          if (s.index === slotIdx) {
            return {
              ...s,
              status: 'occupied',
              items: [...s.items, { id: `key-${Date.now()}`, value: currentKey, initialHash: baseHash }],
            };
          }
          return s;
        })
      );
      advanceToNextKey(slotIdx);
      return;
    }

    // Open Addressing
    const isOccupied = slot.items.length > 0;

    if (!isOccupied) {
      soundManager.playInsert();
      setSlots((prev) =>
        prev.map((s) => {
          if (s.index === slotIdx) {
            return {
              ...s,
              status: 'occupied',
              items: [{ id: `key-${Date.now()}`, value: currentKey, initialHash: baseHash }],
            };
          }
          return s;
        })
      );
      advanceToNextKey(slotIdx);
    } else {
      // Collision detected
      soundManager.playCollision();
      setCollidedSlotIndex(slotIdx);
      setCollidingExistingKey(slot.items[0].value);
      setGameState('COLLISION_PAUSE');

      if (currentLevel.id === 1) {
        setShowCollisionModal(true);
      } else {
        startProbingSequence(slotIdx, currentKey);
      }
    }
  };

  // Start Probing
  const startProbingSequence = (_slotIdx: number, keyVal: number) => {
    setIsProbing(true);
    setCurrentProbeStepIndex(0);
    setGameState('PROBING_INTERACTION');

    let sequence: ProbeStep[] = [];
    if (currentLevel.technique === 'linear') {
      sequence = computeLinearProbeSequence(keyVal, currentLevel.tableSize, slots);
    } else if (currentLevel.technique === 'quadratic') {
      sequence = computeQuadraticProbeSequence(keyVal, currentLevel.tableSize, slots);
    } else if (currentLevel.technique === 'double_hashing') {
      sequence = computeDoubleHashSequence(keyVal, currentLevel.tableSize, slots);
    }

    setProbeSteps(sequence);
  };

  const handleNextProbeStep = () => {
    if (currentProbeStepIndex < probeSteps.length - 1) {
      soundManager.playProbeStep();
      setCurrentProbeStepIndex((prev) => prev + 1);
    }
  };

  const handleAutoSolveProbe = () => {
    if (probeSteps.length === 0) return;
    const finalStepIdx = probeSteps.length - 1;
    setCurrentProbeStepIndex(finalStepIdx);
    soundManager.playProbeStep();
  };

  const handleConfirmProbeInsertion = () => {
    if (currentKey === null || probeSteps.length === 0) return;
    const finalStep = probeSteps[currentProbeStepIndex];
    if (finalStep.isOccupied) {
      soundManager.playDropInvalid();
      return;
    }

    const baseHash = calculateBaseHash(currentKey, currentLevel.tableSize);
    soundManager.playResolution();
    setSlots((prev) =>
      prev.map((s) => {
        if (s.index === finalStep.targetIndex) {
          return {
            ...s,
            status: 'occupied',
            items: [
              {
                id: `key-${Date.now()}`,
                value: currentKey,
                probesCount: currentProbeStepIndex,
                initialHash: baseHash,
                finalIndex: finalStep.targetIndex,
              },
            ],
          };
        }
        return s;
      })
    );

    setIsProbing(false);
    setProbeSteps([]);
    advanceToNextKey(finalStep.targetIndex);
  };

  // Advance Sequence
  const advanceToNextKey = (lastInsertedSlot: number) => {
    const nextSeqIdx = keySequenceIndex + 1;
    const seq = currentLevel.keysSequence;

    if (nextSeqIdx < seq.length) {
      setKeySequenceIndex(nextSeqIdx);
      const nextKey = seq[nextSeqIdx];
      setCurrentKey(nextKey);
      setCalculatedIndex(null);
      setTargetIndex(null);
      setCollidedSlotIndex(null);
      setCollidingExistingKey(null);
      setGameState('KEY_APPEARS');
      soundManager.playKeyAppear();
    } else {
      // Level Completed
      setGameState('LEVEL_COMPLETE');
      soundManager.playLevelVictory();
      setShowLevelCompleteModal(true);

      progressManager.markLevelCompleted(currentLevel.id, 100, streak >= 3);
    }
  };

  const handleProceedFromCollision = () => {
    setShowCollisionModal(false);
    progressManager.markLevelCompleted(1, 100, streak >= 3);
    setCurrentLevelIndex(1); // Advance to Level 2
    initLevel(1);
    setGameViewMode('PLAYING');
  };

  const handleNextLevel = () => {
    setShowLevelCompleteModal(false);
    if (currentLevelIndex < GAME_LEVELS.length - 1) {
      const nextIndex = currentLevelIndex + 1;
      setCurrentLevelIndex(nextIndex);
      initLevel(nextIndex);
      setGameViewMode('PLAYING');
    } else {
      // All 5 levels completed! Move to Level 6: Completion Milestone
      setCurrentLevelIndex(5);
      setGameViewMode('PLAYING');
    }
  };

  // Smart Resume / Continue Learning Action
  const handleContinueLearning = () => {
    const stats = progressManager.getStats();
    const nextMod = stats.nextModule;

    if (!nextMod || nextMod.id === 'fn-01-basics' || nextMod.id === 'fn-02-modulo') {
      setActiveTheoryTopic(nextMod?.targetChapterId || 'theory-01');
      setActiveTab('THEORY');
      return;
    }

    if (nextMod.id === 'fn-10-completion') {
      if (isAllLevelsCompleted) {
        setCurrentLevelIndex(5);
        setGameViewMode('PLAYING');
        setActiveTab('GAME');
      } else {
        const targetLvl = Math.min(completedLevels.length, 4);
        setCurrentLevelIndex(targetLvl);
        initLevel(targetLvl);
        setGameViewMode('PLAYING');
        setActiveTab('GAME');
      }
      return;
    }

    if (nextMod.targetTab === 'GAME' || (nextMod.targetLevelId && nextMod.targetLevelId >= 1)) {
      const targetLvl = (nextMod.targetLevelId || 1) - 1;
      if (targetLvl >= 5 && !isAllLevelsCompleted) {
        const safeLvl = Math.min(completedLevels.length, 4);
        setCurrentLevelIndex(safeLvl);
        initLevel(safeLvl);
      } else {
        setCurrentLevelIndex(targetLvl);
        if (targetLvl < 5) initLevel(targetLvl);
      }
      setGameViewMode('PLAYING');
      setActiveTab('GAME');
      return;
    }

    if (nextMod.id === 'fn-09-quiz' || nextMod.targetChapterId === 'knowledge-quiz') {
      setActiveTab('QUIZ');
      return;
    }

    if (nextMod.targetTab === 'LEARN' || nextMod.targetTab === 'THEORY') {
      setActiveTheoryTopic(nextMod.targetChapterId || 'theory-01');
      setActiveTab('THEORY');
      return;
    }

    // Default fallback
    setActiveTab('GAME');
  };

  // Direct trigger to Theory from Topic card
  const handleNavigateToTheory = (chapterId?: string) => {
    if (chapterId) {
      setActiveTheoryTopic(chapterId);
    }
    setActiveTab('THEORY');
  };

  const handleNavigateToQuest = (levelId?: number) => {
    if (levelId) {
      if (levelId === 6 && !isAllLevelsCompleted) {
        const safeLvl = Math.min(completedLevels.length, 4);
        setCurrentLevelIndex(safeLvl);
        initLevel(safeLvl);
      } else {
        setCurrentLevelIndex(levelId - 1);
        if (levelId <= 5) initLevel(levelId - 1);
      }
      setGameViewMode('PLAYING');
    } else {
      setGameViewMode('SELECTION');
    }
    setActiveTab('GAME');
  };

  const currentStep = probeSteps[currentProbeStepIndex];
  const h2Val = currentKey !== null ? calculateH2(currentKey) : 1;

  // Compute live Guided Solve Step Information
  const guidedStepInfo = getGuidedSolveStepInfo(
    currentLevel,
    slots,
    keySequenceIndex,
    currentKey,
    calculatedIndex,
    gameState,
    isProbing,
    currentProbeStepIndex,
    probeSteps
  );

  const handleGuidedSolveNextStep = () => {
    if (isExecutingGuidedStep) return;
    setIsExecutingGuidedStep(true);

    try {
      const stepInfo = getGuidedSolveStepInfo(
        currentLevel,
        slots,
        keySequenceIndex,
        currentKey,
        calculatedIndex,
        gameState,
        isProbing,
        currentProbeStepIndex,
        probeSteps
      );

      switch (stepInfo.actionType) {
        case 'CALCULATE': {
          if (currentKey !== null) {
            performCalculation(currentKey);
          }
          break;
        }
        case 'PLACE': {
          if (calculatedIndex !== null) {
            placeKeyInSlot(calculatedIndex);
          } else if (currentKey !== null) {
            const baseH = calculateBaseHash(currentKey, currentLevel.tableSize);
            placeKeyInSlot(baseH);
          }
          break;
        }
        case 'PROCEED_COLLISION': {
          handleProceedFromCollision();
          break;
        }
        case 'NEXT_PROBE': {
          handleNextProbeStep();
          break;
        }
        case 'CONFIRM_PROBE': {
          handleConfirmProbeInsertion();
          break;
        }
        case 'COMPLETE': {
          setIsGuidedSolveActive(false);
          break;
        }
      }
    } finally {
      setTimeout(() => {
        setIsExecutingGuidedStep(false);
      }, 50);
    }
  };

  const handleGuidedSolveStop = () => {
    setIsGuidedSolveActive(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] font-sans flex antialiased selection:bg-[#2563EB] dark:selection:bg-[#3B82F6] selection:text-white transition-colors duration-300">
      {/* Sticky Left Sidebar Navigation */}
      <SidebarNav
        activeTab={activeTab === 'NOT_FOUND' ? 'HOME' : activeTab}
        onChangeTab={(tab) => {
          handleTabChange(tab);
          setMobileSidebarOpen(false);
        }}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        isDesktopOpen={desktopSidebarOpen}
        onToggleDesktopCollapse={() => setDesktopSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${desktopSidebarOpen ? 'lg:pl-64' : 'lg:pl-0'
          }`}
      >
        {/* Top Header Bar */}
        <TopHeader
          activeTab={activeTab === 'NOT_FOUND' ? 'HOME' : activeTab}
          currentLevelId={currentLevelIndex >= 5 && isAllLevelsCompleted ? 6 : currentLevel.id}
          score={score}
          streak={streak}
          technique={currentLevel.technique}
          isMuted={isMuted}
          onToggleMute={() => {
            const next = !isMuted;
            setIsMuted(next);
            soundManager.setMuted(next);
          }}
          speed={speed}
          onChangeSpeed={(sp) => setSpeed(sp)}
          onResetLevel={() => initLevel(currentLevelIndex)}
          onResetAllProgress={() => setShowResetModal(true)}
          onToggleMobileSidebar={handleToggleSidebar}
          isDesktopSidebarOpen={desktopSidebarOpen}
          isMobileSidebarOpen={mobileSidebarOpen}
        />

        {/* Page Main Content Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-[76px] sm:pt-[84px] pb-8 flex flex-col gap-6">
          <div
            key={activeTab}
            className="w-full flex-1 flex flex-col gap-6 animate-page-enter"
          >
            {/* 1. HOME LANDING PAGE */}
            {activeTab === 'HOME' && (
              <HomePage
                onContinueLearning={handleContinueLearning}
                onExploreTopics={() => {
                  setActiveTheoryTopic('theory-01');
                  handleTabChange('THEORY');
                }}
                onNavigateToTab={(tab, targetOption) => {
                  if (tab === 'THEORY') {
                    if (typeof targetOption === 'string') {
                      setActiveTheoryTopic(targetOption);
                    }
                    handleTabChange('THEORY');
                  } else if (tab === 'GAME' || tab === 'QUEST') {
                    if (typeof targetOption === 'number') {
                      if (targetOption === 6 && !isAllLevelsCompleted) {
                        const safeLvl = Math.min(completedLevels.length, 4);
                        setCurrentLevelIndex(safeLvl);
                        initLevel(safeLvl);
                      } else {
                        setCurrentLevelIndex(targetOption - 1);
                        if (targetOption <= 5) initLevel(targetOption - 1);
                      }
                      setGameViewMode('PLAYING');
                    } else {
                      setGameViewMode('SELECTION');
                    }
                    handleTabChange('GAME');
                  } else if (tab === 'LAB') {
                    handleTabChange('LAB');
                  } else if (tab === 'QUIZ') {
                    handleTabChange('QUIZ');
                  } else if (tab === 'PROGRESS') {
                    handleTabChange('PROGRESS');
                  }
                }}
              />
            )}

            {/* 2. THEORY SECTION */}
            {activeTab === 'THEORY' && (
              <LearnHashingSection
                initialTopic={activeTheoryTopic}
                onStartLevel={(lvlId) => {
                  if (lvlId === 6 && !isAllLevelsCompleted) {
                    const safeLvl = Math.min(completedLevels.length, 4);
                    setCurrentLevelIndex(safeLvl);
                    initLevel(safeLvl);
                  } else {
                    setCurrentLevelIndex(lvlId - 1);
                    if (lvlId <= 5) initLevel(lvlId - 1);
                  }
                  setGameViewMode('PLAYING');
                  handleTabChange('GAME');
                }}
                onOpenSandbox={(tech) => {
                  if (tech) setSandboxTechnique(tech);
                  handleTabChange('LAB');
                }}
              />
            )}

            {/* 2.5. VIDEO LEARNING SECTION */}
            {activeTab === 'VIDEO' && (
              <VideoTutorialsView />
            )}

            {/* 3. GAME PLAY SECTION */}
            {(activeTab === 'GAME' || activeTab === 'QUEST') && (
              gameViewMode === 'SELECTION' ? (
                <GameLevelCardsView
                  levels={GAME_LEVELS}
                  completedLevels={completedLevels}
                  currentLevelIndex={currentLevelIndex}
                  onSelectPlayLevel={(lvlId) => {
                    setCurrentLevelIndex(lvlId - 1);
                    initLevel(lvlId - 1);
                    setGameViewMode('PLAYING');
                  }}
                  isAllLevelsCompleted={isAllLevelsCompleted}
                  onOpenLab={() => handleTabChange('LAB')}
                  score={score}
                  streak={streak}
                />
              ) : (
                <div className="flex flex-col gap-6 animate-page-enter">
                  {/* Top Bar with Return to Level Selection Cards */}
                  <div className="w-full max-w-4xl mx-auto flex items-center justify-between px-2 pt-1 font-sans">
                    <button
                      id="btn-back-to-level-cards"
                      onClick={() => {
                        soundManager.playClick();
                        setGameViewMode('SELECTION');
                      }}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500/40 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
                      <span>← Level Selection Cards</span>
                    </button>

                    <div className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>
                        {currentLevelIndex >= 5 && isAllLevelsCompleted
                          ? 'Milestone 06: Completion'
                          : `Playing Level 0${currentLevel.id}`}
                      </span>
                    </div>
                  </div>

                  {/* Level Stepper Bar */}
                  <LevelProgressBar
                    currentLevelId={currentLevelIndex >= 5 && isAllLevelsCompleted ? 6 : currentLevel.id}
                    completedLevels={completedLevels}
                    onSelectLevel={(lvlId) => {
                      if (lvlId === 6 && !isAllLevelsCompleted) {
                        // Blocked: Cannot enter Completion until all 5 levels are complete
                        return;
                      }
                      soundManager.playClick();
                      setCurrentLevelIndex(lvlId - 1);
                      if (lvlId <= 5) {
                        initLevel(lvlId - 1);
                      }
                      setGameViewMode('PLAYING');
                    }}
                    onOpenLab={() => handleTabChange('LAB')}
                    isCompletionActive={currentLevelIndex >= 5 && isAllLevelsCompleted}
                  />

                  {/* Level 6: Quest Completion & Mastery Certificate */}
                  {currentLevelIndex >= 5 && isAllLevelsCompleted ? (
                    <QuestCompletionView
                      onReplayLevel={(lvlId) => {
                        setCurrentLevelIndex(lvlId - 1);
                        initLevel(lvlId - 1);
                        setGameViewMode('PLAYING');
                      }}
                      onOpenTheory={() => {
                        setActiveTheoryTopic('what-is-hashing');
                        handleTabChange('THEORY');
                      }}
                      onOpenSandbox={() => {
                        handleTabChange('LAB');
                      }}
                      onOpenQuiz={() => {
                        handleTabChange('QUIZ');
                      }}
                      onOpenProgress={() => {
                        handleTabChange('PROGRESS');
                      }}
                    />
                  ) : (
                    <div key={`game-level-${currentLevel.id}`} className="flex flex-col gap-6 animate-chapter-switch">
                      {/* Level Title & Subtitle Banner */}
                      <div className="text-center max-w-2xl mx-auto font-sans">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-500/30 text-[#2563EB] dark:text-[#3B82F6] text-xs font-bold mb-2 uppercase font-mono rounded-lg">
                          <Sparkles className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
                          <span>Level {currentLevel.id < 10 ? `0${currentLevel.id}` : currentLevel.id} • {currentLevel.title}</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-bold font-display text-[#111827] dark:text-[#F8FAFC] tracking-tight animate-heading-enter">
                          {currentLevel.subtitle}
                        </h1>
                      </div>

                      {/* Level Instruction Guide (Technical Field Notes Guide) */}
                      <GameLevelGuide levelId={currentLevel.id} />

                      {/* Compact Interactive Guided Solve Teacher Panel */}
                      {isGuidedSolveActive && (
                        <GuidedSolvePanel
                          stepInfo={guidedStepInfo}
                          onNextStep={handleGuidedSolveNextStep}
                          onStop={handleGuidedSolveStop}
                          isExecuting={isExecutingGuidedStep}
                        />
                      )}

                      {/* Active Key Interaction Area */}
                      <CurrentKeyCard
                        currentKey={currentKey}
                        level={currentLevel}
                        gameState={gameState}
                        calculatedIndex={calculatedIndex}
                        targetIndex={isProbing ? currentStep?.targetIndex ?? targetIndex : targetIndex}
                        isCalculating={isCalculating}
                        onCalculate={() => currentKey !== null && performCalculation(currentKey)}
                        onSubmitManualAnswer={handleManualModulusSubmit}
                        onAutoPlace={() => {
                          if (isProbing) {
                            handleConfirmProbeInsertion();
                          } else if (currentKey !== null) {
                            const targetSlot = calculatedIndex !== null
                              ? calculatedIndex
                              : calculateBaseHash(currentKey, currentLevel.tableSize);
                            placeKeyInSlot(targetSlot);
                          }
                        }}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        probeStepNumber={currentProbeStepIndex}
                        probeFormulaStr={currentStep?.calculationStr}
                        isProbing={isProbing}
                        isGuidedSolveActive={isGuidedSolveActive}
                        onToggleGuidedSolve={() =>
                          setIsGuidedSolveActive((prev) => {
                            const nextState = !prev;
                            if (nextState) {
                              pointsManager.recordGuidedSolveUse(currentLevel.id);
                            }
                            return nextState;
                          })
                        }
                      />

                      {/* Contextual Field Hint System */}
                      <GameHintCard
                        level={currentLevel}
                        gameState={gameState}
                        currentKey={currentKey}
                        calculatedIndex={calculatedIndex}
                        targetIndex={targetIndex}
                        isProbing={isProbing}
                        probeStepNumber={currentProbeStepIndex}
                        currentProbeStep={currentStep}
                      />

                      {/* Probing Step Controller */}
                      {isProbing && currentKey !== null && (
                        <ProbingController
                          technique={currentLevel.technique}
                          currentKey={currentKey}
                          baseHash={calculatedIndex !== null ? calculatedIndex : calculateBaseHash(currentKey, currentLevel.tableSize)}
                          h2Val={h2Val}
                          currentStepIndex={currentProbeStepIndex}
                          allSteps={probeSteps}
                          onNextStep={handleNextProbeStep}
                          onAutoSolveProbe={handleAutoSolveProbe}
                          onConfirmInsertion={handleConfirmProbeInsertion}
                          isCompleted={!currentStep?.isOccupied}
                        />
                      )}

                      {/* The Visual Hash Table Array */}
                      <HashTable
                        slots={slots}
                        technique={currentLevel.technique}
                        targetIndex={!isProbing ? targetIndex : null}
                        probingIndex={isProbing ? currentStep?.targetIndex ?? null : null}
                        collidedIndex={collidedSlotIndex}
                        incomingKey={currentKey}
                        onCellClick={handleCellClick}
                        onDropKey={handleDropOnCell}
                        tableSize={currentLevel.tableSize}
                      />

                      {/* Dynamic Explanation Panel */}
                      <ExplanationPanel
                        level={currentLevel}
                        gameState={gameState}
                        currentKey={currentKey}
                        calculatedIndex={calculatedIndex}
                        targetIndex={targetIndex}
                        probingIndex={isProbing ? currentStep?.targetIndex ?? null : null}
                        isProbing={isProbing}
                        probeStepNumber={currentProbeStepIndex}
                      />
                    </div>
                  )}
                </div>
              )
            )}

            {/* 4. LAB WORKBENCH SECTION */}
            {activeTab === 'LAB' && (
              <SandboxMode
                initialTechnique={sandboxTechnique}
                onExit={() => handleTabChange('GAME')}
                onOpenTheory={() => {
                  setActiveTheoryTopic('theory-01');
                  handleTabChange('THEORY');
                }}
              />
            )}

            {/* 5. QUIZ EXAMINATION SECTION */}
            {activeTab === 'QUIZ' && (
              <QuizView
                onNavigateToTheory={handleNavigateToTheory}
                onNavigateToQuest={handleNavigateToQuest}
                onNavigateToProgress={() => handleTabChange('PROGRESS')}
                onNavigateToHome={() => handleTabChange('HOME')}
              />
            )}

            {/* 6. PROGRESS AUDIT SECTION */}
            {activeTab === 'PROGRESS' && (
              <MyProgressView
                onNavigateToTab={(tab, levelId, chapterId) => {
                  if (tab === 'THEORY' || tab === 'LEARN') {
                    if (chapterId) setActiveTheoryTopic(chapterId);
                    handleTabChange('THEORY');
                  } else if (tab === 'QUEST' || tab === 'GAME') {
                    if (levelId) {
                      setCurrentLevelIndex(levelId - 1);
                      if (levelId <= 5) initLevel(levelId - 1);
                      setGameViewMode('PLAYING');
                    } else {
                      setGameViewMode('SELECTION');
                    }
                    handleTabChange('GAME');
                  } else if (tab === 'LAB' || tab === 'SANDBOX') {
                    handleTabChange('LAB');
                  } else if (tab === 'QUIZ' || tab === 'EXAM') {
                    handleTabChange('QUIZ');
                  } else {
                    handleTabChange(tab as MainViewTab);
                  }
                }}
              />
            )}

            {/* 6.5. POINTS REWARD AUDIT SECTION */}
            {activeTab === 'POINTS' && (
              <PointsView
                onNavigateToTab={(tab) => handleTabChange(tab)}
              />
            )}

            {/* 7. CUSTOM 404 ERROR SECTION */}
            {activeTab === 'NOT_FOUND' && (
              <NotFoundView
                onNavigateHome={() => handleTabChange('HOME')}
                onNavigateTheory={() => {
                  setActiveTheoryTopic('theory-01');
                  handleTabChange('THEORY');
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Collision Discovery Modal (Level 1 collision moment) */}
      {showCollisionModal && collidingExistingKey !== null && currentKey !== null && (
        <CollisionModal
          incomingKey={currentKey}
          existingKey={collidingExistingKey}
          index={collidedSlotIndex ?? 3}
          tableSize={currentLevel.tableSize}
          onProceedToResolution={handleProceedFromCollision}
        />
      )}

      {/* Level Completion Modal */}
      {showLevelCompleteModal && (
        <LevelCompleteModal
          level={currentLevel}
          score={score}
          onNextLevel={handleNextLevel}
          onOpenLab={() => {
            setShowLevelCompleteModal(false);
            setActiveTab('LAB');
          }}
          onReplayLevel={() => {
            setShowLevelCompleteModal(false);
            initLevel(currentLevelIndex);
          }}
          hasNextLevel={currentLevelIndex < GAME_LEVELS.length - 1}
        />
      )}

      {/* 100% Curriculum Completion Celebration Modal */}
      <CompletionCelebrationModal
        isOpen={show100Celebration}
        onClose={() => setShow100Celebration(false)}
        onNavigateToLab={() => {
          setShow100Celebration(false);
          setActiveTab('LAB');
        }}
        onNavigateToProgress={() => {
          setShow100Celebration(false);
          setActiveTab('PROGRESS');
        }}
      />

      {/* Centered Reset Progress Confirmation Modal */}
      <ResetProgressModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={() => {
          progressManager.resetProgress();
          pointsManager.resetAll();
          setScore(0);
          setStreak(0);
          setCompletedLevels([]);
          setCurrentLevelIndex(0);
          initLevel(0);
          setGameViewMode('SELECTION');
          setShowResetModal(false);
        }}
      />

      {/* Global AI Bot Floating Icon */}
      <AIBotFloatingButton />

      {/* Global Points Activity Popup Toast Notification */}
      <PointsNotificationToast />
    </div>
  );
}
