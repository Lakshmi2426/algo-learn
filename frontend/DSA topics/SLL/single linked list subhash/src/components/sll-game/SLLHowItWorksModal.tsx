import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lightbulb, CheckCircle2, ArrowRight, BookOpen } from 'lucide-react';
import { HowItWorksInfo } from '../../types/sllGame';

interface SLLHowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  info?: HowItWorksInfo;
  taskTitle: string;
}

export const SLLHowItWorksModal: React.FC<SLLHowItWorksModalProps> = ({
  isOpen,
  onClose,
  info,
  taskTitle,
}) => {
  if (!isOpen || !info) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="bg-white dark:bg-[#0B1228] border border-slate-200 dark:border-blue-900/30 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl overflow-hidden relative"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                Visual Concept Guide
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {info.title || taskTitle}
              </h3>
            </div>
          </div>

          {/* ASCII / Visual Flow Diagram */}
          <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs border border-slate-800 mb-4 overflow-x-auto shadow-inner">
            <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Visual Pointer Flow Diagram:</span>
            </div>
            <pre className="text-emerald-300 whitespace-pre font-mono leading-relaxed text-[11px] sm:text-xs">
              {info.diagram}
            </pre>
          </div>

          {/* Step list */}
          <div className="space-y-2 mb-4">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Execution Steps:
            </span>
            {info.steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-[#070B19] border border-slate-200 dark:border-blue-900/20 text-xs text-slate-700 dark:text-slate-300"
              >
                <div className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <span className="leading-relaxed font-medium">{step}</span>
              </div>
            ))}
          </div>

          {/* Key Rule Callout */}
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs mb-5">
            <strong className="block font-bold mb-0.5">⚠️ Golden Rule to Remember:</strong>
            <span className="leading-relaxed">{info.keyRule}</span>
          </div>

          {/* Got it button */}
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Got it! Let's Try It</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
