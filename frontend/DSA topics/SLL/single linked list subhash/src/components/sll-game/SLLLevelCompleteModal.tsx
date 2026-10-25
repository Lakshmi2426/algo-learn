import React from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  Star,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Layers,
  Award,
} from 'lucide-react';
import { soundManager } from '../../utils/audio';

interface SLLLevelCompleteModalProps {
  levelId: number;
  stars: number;
  scoreAwarded: number;
  onNextLevel: () => void;
  onReplayLevel: () => void;
  title: string;
  conceptsLearned: string[];
}

export const SLLLevelCompleteModal: React.FC<SLLLevelCompleteModalProps> = ({
  levelId,
  stars,
  scoreAwarded,
  onNextLevel,
  onReplayLevel,
  title,
  conceptsLearned,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        className="bg-white dark:bg-[#0E1736] border border-slate-200 dark:border-blue-900/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden text-center"
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-blue-600/20 dark:bg-blue-500/20 blur-2xl rounded-full pointer-events-none" />

        {/* Trophy Icon */}
        <div className="relative mx-auto w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-500/40 flex items-center justify-center text-amber-500 shadow-md">
          <Trophy className="w-8 h-8 fill-amber-400 text-amber-600 dark:text-amber-300 animate-bounce" />
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
            Level 0{levelId} Completed!
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            {title} Mastered!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            You successfully performed pointer updates and maintained linked list integrity.
          </p>
        </div>

        {/* Star Rating */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3].map((starIdx) => (
            <motion.div
              key={starIdx}
              initial={{ scale: 0 }}
              animate={{ scale: starIdx <= stars ? 1 : 0.8 }}
              transition={{ delay: starIdx * 0.15, type: 'spring' }}
            >
              <Star
                className={`w-8 h-8 ${
                  starIdx <= stars
                    ? 'fill-amber-400 text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                    : 'text-slate-300 dark:text-slate-700'
                }`}
              />
            </motion.div>
          ))}
        </div>

        {/* Points & Score Card */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-[#080D1F] border border-slate-200 dark:border-blue-900/30 rounded-2xl">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500 block">
              Score Awarded
            </span>
            <span className="text-lg font-mono font-bold text-[#2563EB] dark:text-blue-400">
              +{scoreAwarded} PTS
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500 block">
              Memory Mastery
            </span>
            <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
              100% PASS
            </span>
          </div>
        </div>

        {/* Concepts Learned Pill List */}
        <div className="text-left space-y-2">
          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Key Singly Linked List Takeaways:</span>
          </span>
          <div className="space-y-1.5 pl-2">
            {conceptsLearned.map((c, i) => (
              <div key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <span className="text-[#2563EB] dark:text-blue-400 font-bold">•</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => {
              soundManager.playReset();
              onReplayLevel();
            }}
            className="btn-modern-secondary py-3 px-4 text-xs font-bold font-mono flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>REPLAY LEVEL</span>
          </button>

          <button
            onClick={() => {
              soundManager.playSelect();
              onNextLevel();
            }}
            className="btn-modern-primary py-3 px-4 text-xs font-bold font-mono flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/25"
          >
            <span>{levelId === 5 ? 'VIEW CERTIFICATE' : 'NEXT LEVEL'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
