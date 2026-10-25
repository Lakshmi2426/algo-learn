import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Star, ArrowRight, RotateCcw, Crown } from 'lucide-react';
import { soundManager } from '../../utils/audio';

interface SLLTopicCompleteModalProps {
  topicTitle: string;
  scoreAwarded: number;
  onBackToTopics: () => void;
  onReplayTopic: () => void;
  hasNextTopic: boolean;
  onNextTopic?: () => void;
}

export const SLLTopicCompleteModal: React.FC<SLLTopicCompleteModalProps> = ({
  topicTitle,
  scoreAwarded,
  onBackToTopics,
  onReplayTopic,
  hasNextTopic,
  onNextTopic,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 15 }}
        className="bg-white dark:bg-[#0B1228] border border-blue-200/90 dark:border-blue-900/40 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden text-center"
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-blue-600/15 blur-2xl rounded-full pointer-events-none" />

        {/* Icon in Blue */}
        <div className="relative mx-auto w-16 h-16 rounded-3xl bg-[#EFF6FF] dark:bg-blue-950/80 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-[#2563EB] dark:text-blue-400 shadow-md">
          <Crown className="w-8 h-8 stroke-[2.5]" />
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-[#2563EB] dark:text-blue-300 bg-[#EFF6FF] dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/40">
            Topic Mastered
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            {topicTitle} Completed!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
            You successfully mastered all operations and maintained zero dangling pointers.
          </p>
        </div>

        {/* Points Card */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#EFF6FF]/60 dark:bg-[#070B19] border border-blue-200/80 dark:border-blue-900/30 rounded-2xl">
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
              Pointer Integrity
            </span>
            <span className="text-lg font-mono font-bold text-[#2563EB] dark:text-blue-400">
              100% PASS
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          {hasNextTopic && onNextTopic ? (
            <button
              onClick={() => {
                soundManager.play('click');
                onNextTopic();
              }}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm hover:shadow-md hover:shadow-blue-600/25"
            >
              <span>Explore Next Topic</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                soundManager.play('click');
                onBackToTopics();
              }}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm hover:shadow-md hover:shadow-blue-600/25"
            >
              <span>Back to Topics</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              soundManager.play('click');
              onBackToTopics();
            }}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>Back to Topics Menu</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
