import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Layers,
  Star,
  Timer,
  Activity,
  Play,
  Check,
  CheckCircle2,
  ArrowRight,
  PlusCircle,
  Link as LinkIcon,
  Trash2,
  Eye,
  Search,
  Zap,
  BookOpen,
  Award,
  Cpu,
  Code2,
} from 'lucide-react';
import { SLL_TASKS, LEVEL_TASK_IDS, LEVEL_METADATA } from '../../data/sllTasks';
import { progressManager } from '../../utils/progressManager';
import { soundManager } from '../../utils/audio';

interface SLLOperationsMenuProps {
  currentLevelId: number;
  onSelectLevel: (lvlId: number) => void;
  onSelectTask: (taskId: string) => void;
  completedTasks: string[];
  totalScore: number;
}

export const SLLOperationsMenu: React.FC<SLLOperationsMenuProps> = ({
  currentLevelId,
  onSelectLevel,
  onSelectTask,
  completedTasks,
  totalScore,
}) => {
  const currentMeta = LEVEL_METADATA[currentLevelId] || LEVEL_METADATA[1];
  const taskIds = LEVEL_TASK_IDS[currentLevelId] || [];
  const levelTasks = taskIds.map((id) => SLL_TASKS[id]).filter(Boolean);

  const isLevelCompleted = progressManager.getState().levelsCompleted.includes(currentLevelId);

  const getTaskIcon = (taskIndex: number, levelId: number) => {
    if (levelId === 3) return <Eye className="w-5 h-5" />;
    if (levelId === 5) return <Zap className="w-5 h-5" />;
    if (levelId === 2) return <Trash2 className="w-5 h-5" />;
    if (levelId === 4) {
      return taskIndex === 4 ? <Search className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />;
    }
    return taskIndex === 1 || taskIndex === 2 ? <PlusCircle className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />;
  };

  return (
    <div className="flex flex-col gap-6 animate-chapter-switch max-w-6xl mx-auto w-full font-sans">
      {/* 1. TOP SECTION: LEVEL PROGRESS & HUD STATS */}
      <div className="bg-white dark:bg-[#0B1228] border border-slate-200 dark:border-blue-900/30 rounded-3xl p-4 sm:p-5 shadow-xs dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] flex flex-col gap-4">
        {/* Level Title & Stepper row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-blue-900/20 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EFF6FF] dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/30 flex items-center justify-center text-[#2563EB] dark:text-blue-400 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2563EB] dark:text-blue-400 block">
                HANDS-ON POINTER MANIPULATION • LEVEL 0{currentLevelId} OF 05
              </span>
              <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
                {currentMeta.title}
              </h2>
            </div>
          </div>

          {/* Level Switcher Chips */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#070B19] p-1 rounded-2xl border border-slate-200 dark:border-blue-900/30">
            {[1, 2, 3, 4, 5].map((lvl) => {
              const isCurrent = currentLevelId === lvl;
              const isDone = progressManager.getState().levelsCompleted.includes(lvl);
              return (
                <button
                  key={lvl}
                  onClick={() => {
                    soundManager.play('click');
                    onSelectLevel(lvl);
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#2563EB] text-white shadow-md shadow-blue-600/30 scale-105'
                      : isDone
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-blue-950/50'
                  }`}
                >
                  <span>L0{lvl}</span>
                  {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Level Overview Description */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          {currentMeta.subtitle}
        </p>

        {/* Information Mini-Panels for Current Level: Interaction Mode & Tasks in Level */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <div
            id="game-card-interaction-mode"
            className="p-3 rounded-2xl bg-slate-50 dark:bg-[#070B18] border border-slate-200 dark:border-blue-900/20 flex flex-col min-w-[190px] sm:min-w-[210px]"
          >
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Interaction Mode</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              Manual Pointers & Memory
            </span>
          </div>

          <div
            id="game-card-tasks-in-level"
            className="p-3 rounded-2xl bg-slate-50 dark:bg-[#070B18] border border-slate-200 dark:border-blue-900/20 flex flex-col min-w-[190px] sm:min-w-[210px]"
          >
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Tasks in Level</span>
            <span className="text-xs font-bold text-[#2563EB] dark:text-blue-400 mt-0.5">
              {levelTasks.length} Hands-on Task{levelTasks.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* 2. TASK SELECTION CARDS GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#2563EB] dark:text-blue-400" />
            <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
              Choose Task to Play
            </h3>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-500">
            {completedTasks.filter((id) => taskIds.includes(id)).length}/{taskIds.length} Completed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {levelTasks.map((task) => {
            const isCompleted = completedTasks.includes(task.id);

            return (
              <motion.div
                key={task.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.15 }}
                className={`flex flex-col justify-between p-5 rounded-3xl border-2 transition-all bg-white dark:bg-[#0B1228] shadow-xs hover:shadow-lg ${
                  isCompleted
                    ? 'border-emerald-400/80 dark:border-emerald-500/40 hover:border-emerald-500'
                    : 'border-slate-200 dark:border-blue-900/30 hover:border-[#2563EB] dark:hover:border-blue-400'
                }`}
              >
                <div className="flex-1">
                  {/* Card Header: Icon & Task Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] dark:bg-blue-950/80 text-[#2563EB] dark:text-blue-400 border border-blue-200 dark:border-blue-900/30 flex items-center justify-center shadow-xs">
                        {getTaskIcon(task.taskIndex, currentLevelId)}
                      </div>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Task #{task.taskIndex}
                      </span>
                    </div>

                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Done</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono font-bold text-[#2563EB] dark:text-blue-300 bg-[#EFF6FF] dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                        +{task.xpReward} XP
                      </span>
                    )}
                  </div>

                  {/* Title & Objective */}
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 leading-snug">
                    {task.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {task.objective}
                  </p>
                </div>

                {/* PLAY TASK BUTTON */}
                <button
                  id={`play-task-${task.id}`}
                  onClick={() => {
                    soundManager.play('click');
                    onSelectTask(task.id);
                  }}
                  className={`w-full mt-4 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md ${
                    isCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                      : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-blue-600/20'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isCompleted ? 'Replay Task' : 'Play Task'}</span>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
