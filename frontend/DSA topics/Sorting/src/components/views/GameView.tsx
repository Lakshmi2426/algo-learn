import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { SortGameId, UserProgress, GameStatus } from '../../types';
import { SORT_GAMES } from '../../data/sortGameData';
import { awardXP, recordGamePlay, formatPlayedTime, INITIAL_GAME_STATS, applyPointsEvent } from '../../services/storage';

// Sort Master Modular Game Components
import { GameSelectionPage } from '../game/GameSelectionPage';
import { HorizontalLevelChain } from '../game/HorizontalLevelChain';
import { BubbleSortGame } from '../game/BubbleSortGame';
import { SelectionSortGame } from '../game/SelectionSortGame';
import { InsertionSortGame } from '../game/InsertionSortGame';
import { SortingBattleGame } from '../game/SortingBattleGame';
import { FixAlgorithmGame } from '../game/FixAlgorithmGame';

interface GameViewProps {
  progress: UserProgress;
  activeLevelId: number;
  onSelectLevel: (levelId: number) => void;
  onUpdateProgress: (updated: UserProgress | ((prev: UserProgress) => UserProgress)) => void;
}

type SortViewScreen = 'hub' | 'gameplay';

export const GameView: React.FC<GameViewProps> = ({
  progress,
  onUpdateProgress,
}) => {
  // Navigation Flow:
  // 1. Initial screen: 'hub' with 5 Sorting Game Cards (Bubble, Selection, Insertion, Sorting Battle, Fix Algorithm).
  // 2. Click any card: opens that game's page directly, with the Horizontal Level Chain at top and the active level game right under it.
  // 3. Level 1 complete -> Level 2 unlocks/opens -> Level 3 -> Level 4 -> Level 5.
  const [currentScreen, setCurrentScreen] = useState<SortViewScreen>('hub');
  const [selectedGameId, setSelectedGameId] = useState<SortGameId>('bubble-sort');
  const [selectedLevelNumber, setSelectedLevelNumber] = useState<number>(1);
  const [guidedSolveToast, setGuidedSolveToast] = useState<boolean>(false);
  const guidedToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (guidedToastTimerRef.current) {
        clearTimeout(guidedToastTimerRef.current);
      }
    };
  }, []);

  // Active game metadata
  const activeGame = SORT_GAMES.find((g) => g.id === selectedGameId) || SORT_GAMES[0];
  const activeLevel =
    activeGame.levels.find((l) => l.levelNumber === selectedLevelNumber) || activeGame.levels[0];

  // Handler: user clicks one of the 5 cards on Game Selection Page
  const handleSelectGame = (gameId: SortGameId) => {
    setSelectedGameId(gameId);

    // Track that the user started/played this game
    const updated = recordGamePlay(progress, gameId);
    onUpdateProgress(updated);

    // Open the next incomplete unlocked level, or Level 1 if none or all completed
    const completed = Array.isArray(updated?.sortGameProgress?.[gameId]) ? updated.sortGameProgress[gameId] : [];
    const game = SORT_GAMES.find((g) => g.id === gameId);
    const total = game?.totalLevels || 5;
    let nextLvl = 1;
    for (let i = 1; i <= total; i++) {
      if (!completed.includes(i)) {
        nextLvl = i;
        break;
      }
    }
    setSelectedLevelNumber(nextLvl);
    setCurrentScreen('gameplay');
  };

  // Handler: level completed
  const handleCompleteLevel = (earnedXP: number, earnedScore?: number, performanceMetrics?: string) => {
    const currentCompleted = Array.isArray(progress?.sortGameProgress?.[selectedGameId])
      ? progress.sortGameProgress[selectedGameId]
      : [];
    const updatedGameCompleted = currentCompleted.includes(selectedLevelNumber)
      ? currentCompleted
      : [...currentCompleted, selectedLevelNumber];

    const newSortGameProgress = {
      ...(progress.sortGameProgress || {}),
      [selectedGameId]: updatedGameCompleted,
    };

    const isGameFullyCompleted = updatedGameCompleted.length >= activeGame.totalLevels;
    const newStatus: GameStatus = isGameFullyCompleted ? 'Completed' : 'In Progress';
    const newCompletionPercentage = isGameFullyCompleted
      ? 100
      : Math.min(100, Math.round((updatedGameCompleted.length / activeGame.totalLevels) * 100));

    const existingStats = progress.gameStats?.[selectedGameId] || INITIAL_GAME_STATS[selectedGameId];
    const scoreAchieved = typeof earnedScore === 'number' && earnedScore > 0 ? earnedScore : (earnedXP * 10 || 500);
    const highestScore = Math.max(existingStats.highestScore || 0, scoreAchieved);
    const timesPlayed = Math.max(1, (existingStats.timesPlayed || 0) + 1);
    const bestPerformance = isGameFullyCompleted
      ? `100% Mastered • High Score: ${highestScore} pts`
      : performanceMetrics || `Level ${selectedLevelNumber} Mastered (${scoreAchieved} pts)`;
    const lastPlayedTime = formatPlayedTime(new Date());

    const updatedGameStats = {
      ...(progress.gameStats || INITIAL_GAME_STATS),
      [selectedGameId]: {
        status: newStatus,
        highestScore,
        timesPlayed,
        completionPercentage: newCompletionPercentage,
        bestPerformance,
        lastPlayedTime,
      },
    };

    // Count how many of the 5 game cards have all of their levels completed
    const fullyCompletedGameCardsCount = SORT_GAMES.filter((g) => {
      const list = newSortGameProgress[g.id];
      const uniqueCompleted = Array.isArray(list) ? new Set(list).size : 0;
      return uniqueCompleted >= g.totalLevels;
    }).length;

    const eventKey = `${selectedGameId}_level_${selectedLevelNumber}_award`;
    const awardResult = awardXP(
      {
        ...progress,
        sortGameProgress: newSortGameProgress,
        gameStats: updatedGameStats,
        completedGameLevels: Array.from({ length: fullyCompletedGameCardsCount }, (_, i: number) => i + 1),
      },
      earnedXP,
      eventKey,
      `${activeGame.title} - Level ${selectedLevelNumber} Mastered`,
      `Completed ${activeLevel.title} with high precision`
    );

    let updatedWithPoints = awardResult.updated;
    if (isGameFullyCompleted) {
      updatedWithPoints = applyPointsEvent(
        updatedWithPoints,
        'game',
        9,
        `Completed All 5 Levels of ${activeGame.title} (+9 pts)`,
        `game_card_${selectedGameId}_completed`,
        { gameCardId: selectedGameId }
      );
    }

    onUpdateProgress(updatedWithPoints);
  };

  // Handler: Hint used in game level (-2 points every time a hint is used)
  const handleUseHint = () => {
    const currentCompleted = Array.isArray(progress?.sortGameProgress?.[selectedGameId])
      ? progress.sortGameProgress[selectedGameId]
      : [];
    if (currentCompleted.includes(selectedLevelNumber)) {
      return; // Do not deduct points when replaying an already-completed level
    }
    onUpdateProgress((prev) =>
      applyPointsEvent(
        prev,
        'hint',
        -2,
        `Used Hint in ${activeGame.title} (Level ${selectedLevelNumber}) (-2 pts)`
      )
    );
  };

  // Handler: Guided Solve used for a level (-3 points when user uses Guided Solve)
  const handleUseGuidedSolve = () => {
    const currentCompleted = Array.isArray(progress?.sortGameProgress?.[selectedGameId])
      ? progress.sortGameProgress[selectedGameId]
      : [];
    if (currentCompleted.includes(selectedLevelNumber)) {
      return; // Do not deduct points when replaying an already-completed level
    }
    setGuidedSolveToast(true);
    if (guidedToastTimerRef.current) {
      clearTimeout(guidedToastTimerRef.current);
    }
    guidedToastTimerRef.current = setTimeout(() => {
      setGuidedSolveToast(false);
      guidedToastTimerRef.current = null;
    }, 2000);

    onUpdateProgress((prev) =>
      applyPointsEvent(
        prev,
        'guided_solve',
        -3,
        `Used Guided Solve in ${activeGame.title} (Level ${selectedLevelNumber}) (-3 pts)`,
        `guided_solve_${selectedGameId}_level_${selectedLevelNumber}`
      )
    );
  };

  const handleDismissGuidedToast = () => {
    setGuidedSolveToast(false);
    if (guidedToastTimerRef.current) {
      clearTimeout(guidedToastTimerRef.current);
      guidedToastTimerRef.current = null;
    }
  };

  // Handler: Next Level button clicked in completion modal
  const handleNextLevel = () => {
    if (selectedLevelNumber < activeGame.totalLevels) {
      setSelectedLevelNumber((prev) => prev + 1);
    } else {
      setCurrentScreen('hub');
    }
  };

  return (
    <div className="w-full">
      {/* ─── SCREEN 1: 5-CARD GAME SELECTION HUB ─── */}
      {currentScreen === 'hub' && (
        <GameSelectionPage
          progress={progress}
          onSelectGame={handleSelectGame}
        />
      )}

      {/* ─── SCREEN 2: GAMEPLAY WITH LEVEL CHAINING ON TOP & GAME UNDERNEATH ─── */}
      {currentScreen === 'gameplay' && (
        <div className="space-y-4 max-w-5xl mx-auto pb-12 relative">
          {/* Temporary 2-Second Guided Solve Deduction Toast Notification */}
          {guidedSolveToast && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex justify-center w-full max-w-md px-4 animate-fadeIn">
              <div
                role="status"
                aria-live="polite"
                className="pointer-events-auto flex items-center justify-between gap-3.5 px-4 py-3 rounded-2xl bg-white border border-rose-200 shadow-lg shadow-rose-100/80"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-rose-500 stroke-[2.2]" />
                  </div>
                  <div className="text-xs sm:text-sm tracking-tight whitespace-nowrap">
                    <span className="font-extrabold text-rose-600">−3 Points</span>
                    <span className="text-slate-700 font-bold"> — </span>
                    <span className="font-bold text-slate-900">Guided Solve Used</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDismissGuidedToast}
                  aria-label="Close notification"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Horizontal Level Chain: Level 1 ── Level 2 ── Level 3 ── Level 4 ── Level 5 */}
          <HorizontalLevelChain
            gameTitle={activeGame.title}
            totalLevels={activeGame.totalLevels}
            activeLevelNumber={selectedLevelNumber}
            completedLevels={Array.isArray(progress?.sortGameProgress?.[selectedGameId]) ? progress.sortGameProgress[selectedGameId] : []}
            onSelectLevel={(lvl) => setSelectedLevelNumber(lvl)}
            onBackToGames={() => setCurrentScreen('hub')}
          />

          {/* Active Level Game directly underneath the chain */}
          {selectedGameId === 'bubble-sort' && (
            <BubbleSortGame
              key={`${selectedGameId}-${selectedLevelNumber}`}
              level={activeLevel}
              progress={progress}
              onCompleteLevel={handleCompleteLevel}
              onBackToLevels={() => setCurrentScreen('hub')}
              onNextLevel={handleNextLevel}
              onUseHint={handleUseHint}
              onUseGuidedSolve={handleUseGuidedSolve}
            />
          )}

          {selectedGameId === 'selection-sort' && (
            <SelectionSortGame
              key={`${selectedGameId}-${selectedLevelNumber}`}
              level={activeLevel}
              progress={progress}
              onCompleteLevel={handleCompleteLevel}
              onBackToLevels={() => setCurrentScreen('hub')}
              onNextLevel={handleNextLevel}
              onUseHint={handleUseHint}
              onUseGuidedSolve={handleUseGuidedSolve}
            />
          )}

          {selectedGameId === 'insertion-sort' && (
            <InsertionSortGame
              key={`${selectedGameId}-${selectedLevelNumber}`}
              level={activeLevel}
              progress={progress}
              onCompleteLevel={handleCompleteLevel}
              onBackToLevels={() => setCurrentScreen('hub')}
              onNextLevel={handleNextLevel}
              onUseHint={handleUseHint}
              onUseGuidedSolve={handleUseGuidedSolve}
            />
          )}

          {selectedGameId === 'sorting-battle' && (
            <SortingBattleGame
              key={`${selectedGameId}-${selectedLevelNumber}`}
              level={activeLevel}
              progress={progress}
              onCompleteLevel={handleCompleteLevel}
              onBackToLevels={() => setCurrentScreen('hub')}
              onNextLevel={handleNextLevel}
              onUseHint={handleUseHint}
              onUseGuidedSolve={handleUseGuidedSolve}
            />
          )}

          {selectedGameId === 'fix-algorithm' && (
            <FixAlgorithmGame
              key={`${selectedGameId}-${selectedLevelNumber}`}
              level={activeLevel}
              progress={progress}
              onCompleteLevel={handleCompleteLevel}
              onBackToLevels={() => setCurrentScreen('hub')}
              onNextLevel={handleNextLevel}
              onUseHint={handleUseHint}
              onUseGuidedSolve={handleUseGuidedSolve}
            />
          )}
        </div>
      )}
    </div>
  );
};
