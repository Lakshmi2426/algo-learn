import React from 'react';
import { LayoutGrid, BookOpen, ArrowLeft, HelpCircle } from 'lucide-react';
import { soundManager } from '../utils/audio';

export interface NotFoundViewProps {
  onNavigateHome: () => void;
  onNavigateTheory: () => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({
  onNavigateHome,
  onNavigateTheory,
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto py-12 px-4 flex flex-col items-center justify-center text-center font-sans animate-page-enter">
      <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] w-full">
        {/* Badge & Code */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-mono font-bold uppercase tracking-wider mb-6">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Error 404 • Resource Not Located</span>
        </div>

        {/* 404 Graphic Display */}
        <div className="mb-6 select-none">
          <span className="text-6xl sm:text-8xl font-extrabold font-mono tracking-tighter text-[#2563EB] dark:text-[#3B82F6]">
            404
          </span>
        </div>

        {/* Main Heading & Description */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
          Module or Page Not Found
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-8 leading-relaxed">
          The curriculum module, exercise, or URL route you requested does not exist or has been relocated.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5">
          <button
            id="btn-404-home"
            onClick={() => {
              soundManager.playPrimaryClick();
              onNavigateHome();
            }}
            className="btn-modern-primary px-5 py-3 text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <LayoutGrid className="w-4 h-4" />
            <span>Return to Overview</span>
          </button>

          <button
            id="btn-404-theory"
            onClick={() => {
              soundManager.playSecondaryClick();
              onNavigateTheory();
            }}
            className="btn-modern-secondary px-5 py-3 text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <BookOpen className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
            <span>Explore Theory</span>
          </button>
        </div>
      </div>
    </div>
  );
};
