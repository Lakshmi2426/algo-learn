import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Gamepad2,
  BookOpen,
  PlusCircle,
  MoveRight,
  Compass,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';

interface SLLHowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SLLHowToPlayModal: React.FC<SLLHowToPlayModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      num: '①',
      icon: BookOpen,
      title: 'Read the task',
      desc: 'Understand what the linked list should look like in RAM.',
      color: 'text-[#2563EB] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60',
    },
    {
      num: '②',
      icon: PlusCircle,
      title: 'Create a node',
      desc: 'Use the node control to dynamically allocate a new node in memory.',
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
    },
    {
      num: '③',
      icon: MoveRight,
      title: 'Connect nodes',
      desc: 'Drag from the NEXT connector point → destination node, or click both.',
      color: 'text-[#1D4ED8] dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/80',
    },
    {
      num: '④',
      icon: Compass,
      title: 'Set HEAD & TAIL',
      desc: 'Click the node in workspace and assign HEAD (or click Make HEAD).',
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
    },
    {
      num: '⑤',
      icon: Sparkles,
      title: 'Follow the pointers',
      desc: 'Use NEXT links and memory addresses to traverse and verify the chain.',
      color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60',
    },
    {
      num: '⑥',
      icon: CheckCircle2,
      title: 'Complete the task',
      desc: 'When the structure is correct, click CHECK ANSWER to earn XP and advance!',
      color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:rose-950/60',
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="w-full max-w-lg bg-white dark:bg-[#0B1228] border border-slate-200 dark:border-blue-900/30 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-blue-900/20">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shadow-md shadow-blue-600/30">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
                  Interactive Guide
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  HOW TO PLAY
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 6 Steps List */}
          <div className="space-y-2.5 mb-5 max-h-[60vh] overflow-y-auto pr-1">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className="flex items-start gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-[#070B19] border border-slate-100 dark:border-blue-900/20 transition-all hover:bg-slate-100/70 dark:hover:bg-[#0E1736]"
                >
                  <div className={`w-8 h-8 rounded-xl ${s.color} flex items-center justify-center shrink-0 font-mono font-bold text-xs`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                      <span className="text-[#2563EB] dark:text-blue-400 font-mono">{s.num}</span>
                      <span>{s.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug mt-0.5">
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Connect Hint Tooltip */}
          <div className="mb-5 p-3 rounded-2xl bg-[#EFF6FF] dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/30 text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-ping shrink-0" />
            <span>
              <strong>Tip:</strong> In Play Mode, drag the NEXT connector dot or click two nodes to link them instantly without typing memory addresses.
            </span>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            id="sll-got-it-play-btn"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
          >
            <span>GOT IT — START PLAYING</span>
            <Gamepad2 className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
