import React from 'react';
import {
  Play,
  RotateCcw,
  Lock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Hash,
  Layers,
  Zap,
  FlaskConical,
  Gamepad2,
} from 'lucide-react';
import { LevelConfig } from '../types/game';
import { soundManager } from '../utils/audio';

interface GameLevelCardsViewProps {
  levels: LevelConfig[];
  completedLevels: number[];
  currentLevelIndex: number;
  onSelectPlayLevel: (levelId: number) => void;
  isAllLevelsCompleted?: boolean;
  onOpenLab: () => void;
  score?: number;
  streak?: number;
}

export const GameLevelCardsView: React.FC<GameLevelCardsViewProps> = ({
  levels,
  completedLevels,
  currentLevelIndex,
  onSelectPlayLevel,
  isAllLevelsCompleted,
  onOpenLab,
  score = 0,
  streak = 0,
}) => {
  // Technique category badges
  const getTechniqueBadge = (technique: string) => {
    switch (technique) {
      case 'basic':
        return { label: 'Direct Modulo', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-500/30' };
      case 'chaining':
        return { label: 'Closed Addressing', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-500/30' };
      case 'linear':
        return { label: 'Open Addressing', color: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-500/30' };
      case 'quadratic':
        return { label: 'Open Addressing', color: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-500/30' };
      case 'double_hashing':
        return { label: 'Dual Function', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-500/30' };
      default:
        return { label: 'Hashing', color: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' };
    }
  };

  const completedCount = completedLevels.length;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-2 flex flex-col gap-8 animate-page-enter font-sans">
      {/* 1. Header & Introduction in Reference-Structured Card */}
      <div className="w-full bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] reveal-on-scroll">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          {/* Left Column: Eyebrow Badge, Main Title, and Description */}
          <div className="flex-1 min-w-0">
            {/* Small Blue Outlined Eyebrow Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#3B82F6] border border-blue-200/80 dark:border-blue-500/30 rounded-lg text-xs font-bold uppercase tracking-wider font-mono shadow-2xs">
              <Gamepad2 className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
              <span>Interactive Challenges • 5 Core Levels</span>
            </div>

            {/* Large Main Game Section Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mt-2.5 animate-heading-enter">
              Hash Quest: Level Selection
            </h1>

            {/* Supporting Description */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-normal mt-2 leading-relaxed max-w-2xl">
              Choose a challenge level to test and master hash algorithms, collision handling, and probing step-by-step through interactive visual gameplay.
            </p>
          </div>

          {/* Right Column: Progress Summary Card */}
          <div className="w-full sm:w-auto bg-slate-50/90 dark:bg-[#0B1120] border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 sm:px-4 sm:py-3 shadow-2xs flex flex-col gap-1.5 shrink-0 self-start lg:self-auto">
            <div className="flex items-center justify-between gap-4 text-xs font-mono">
              <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
                Progress Summary
              </span>
              <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#3B82F6] font-bold text-[10px] uppercase font-mono">
                {completedCount === levels.length ? 'Completed' : 'In Progress'}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Completed Levels</span>
              <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                <strong className="text-[#2563EB] dark:text-[#3B82F6] text-base">{completedCount}</strong> / {levels.length}
              </span>
            </div>
          </div>
        </div>

        {/* Subtle Horizontal Divider */}
        <div className="w-full border-t border-slate-200/80 dark:border-slate-800 my-5" />

        {/* Overall Completion Row & Progress Bar */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-400">
              Overall Completion
            </span>
            <span className="text-[#2563EB] dark:text-[#3B82F6] font-bold text-xs sm:text-sm">
              {Math.round((completedCount / levels.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-800/80">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / levels.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. EXACTLY FIVE LEVEL CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {levels.map((level, idx) => {
          const isCompleted = completedLevels.includes(level.id);
          // Sequential unlocking: Level 1 is always unlocked; subsequent levels require the previous level completed
          const isUnlocked = level.id === 1 || completedLevels.includes(level.id - 1);
          const isInProgress = !isCompleted && isUnlocked && currentLevelIndex === idx;
          const techBadge = getTechniqueBadge(level.technique);
          const levelCode = level.id < 10 ? `0${level.id}` : `${level.id}`;

          return (
            <div
              key={`level-card-${level.id}`}
              id={`game-level-card-${level.id}`}
              className={`group relative rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 shadow-xs ${
                isCompleted
                  ? 'bg-white dark:bg-[#111827] border-blue-200/80 dark:border-blue-500/30 hover:border-blue-400 dark:hover:border-blue-400 hover:shadow-md'
                  : isInProgress
                  ? 'bg-white dark:bg-[#111827] border-[#2563EB] dark:border-[#3B82F6] ring-2 ring-blue-500/20 shadow-md hover:shadow-lg'
                  : isUnlocked
                  ? 'bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/40 hover:shadow-md'
                  : 'bg-slate-50/70 dark:bg-[#0E1526]/70 border-slate-200/70 dark:border-slate-800/80 opacity-80'
              }`}
            >
              <div>
                {/* Top Row: Level Number Badge & Status Pill */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-xs font-extrabold tracking-wider px-2.5 py-1 rounded-lg border uppercase ${
                        isCompleted
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-500/40'
                          : isInProgress
                          ? 'bg-[#2563EB] text-white border-[#2563EB]'
                          : isUnlocked
                          ? 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                          : 'bg-slate-200 text-slate-500 border-slate-300 dark:bg-slate-800/60 dark:text-slate-500 dark:border-slate-700'
                      }`}
                    >
                      LEVEL {levelCode}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold font-mono bg-blue-50 dark:bg-blue-950/80 text-[#2563EB] dark:text-[#3B82F6] border border-blue-200 dark:border-blue-500/40">
                      +10 pts
                    </span>
                  </div>

                  {/* Status Indicator */}
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                      COMPLETED
                    </span>
                  ) : isInProgress ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-500/30 px-2 py-0.5 rounded-full">
                      <Zap className="w-3 h-3 fill-blue-500" />
                      IN PROGRESS
                    </span>
                  ) : isUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
                      AVAILABLE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold font-mono text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-full">
                      <Lock className="w-3 h-3" />
                      LOCKED
                    </span>
                  )}
                </div>

                {/* Level Title & Subtitle */}
                <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] transition-colors leading-snug">
                  {level.title}
                </h2>
                <p className="text-xs font-medium text-[#2563EB] dark:text-[#3B82F6] mt-1 leading-snug">
                  {level.subtitle}
                </p>

                {/* Short Basic Information / Preview */}
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed line-clamp-3">
                  {level.introExplanation}
                </p>

                {/* Educational Specs / Formula Box */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500 dark:text-slate-400">Formula</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                      {level.formulaDisplay}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Technique</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${techBadge.color}`}>
                      {techBadge.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Keys Sequence</span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                      {level.keysSequence.length} Keys ({level.keysSequence.join(', ')})
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button: PLAY */}
              <div className="mt-5 pt-3">
                {isUnlocked ? (
                  <button
                    id={`btn-play-level-${level.id}`}
                    onClick={() => {
                      soundManager.playClick();
                      onSelectPlayLevel(level.id);
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs active:scale-[0.98] ${
                      isInProgress
                        ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md shadow-blue-500/20'
                        : isCompleted
                        ? 'bg-white hover:bg-blue-50 text-[#2563EB] border border-blue-300 dark:bg-[#111827] dark:hover:bg-blue-950/40 dark:text-[#3B82F6] dark:border-blue-500/40'
                        : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Replay Level {level.id}</span>
                      </>
                    ) : isInProgress ? (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Continue Level {level.id}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play Level {level.id}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    disabled
                    id={`btn-locked-level-${level.id}`}
                    className="w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-75"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Locked • Complete Level {level.id - 1}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. INTERACTIVE LAB CARD (Horizontal Full-Width Card) */}
      <div
        id="card-game-lab"
        className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 transition-all duration-300 shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500/40"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl shrink-0 bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#3B82F6] border border-blue-100 dark:border-blue-500/30 shadow-2xs">
              <FlaskConical className="w-7 h-7 stroke-[2]" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#3B82F6]">
                  LAB
                </span>
                <span className="text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-500/30">
                  Interactive Workbench
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white">
                Interactive Lab
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
                Experiment freely with custom table capacities, collision resolution algorithms, search paths, and load factor thresholds in the interactive laboratory.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="sm:shrink-0">
            <button
              id="btn-open-lab-card"
              onClick={() => {
                soundManager.playClick();
                onOpenLab();
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98]"
            >
              <span>Open Lab</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
