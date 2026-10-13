import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Layers,
  Sparkles,
  Zap,
  HelpCircle,
  BookOpen,
  ChevronRight,
  ListOrdered,
  Lightbulb,
  Cpu,
  Compass,
} from 'lucide-react';
import { UserProgress, TheoryLesson } from '../../types';
import { THEORY_LESSONS } from '../../data/theoryData';
import { soundEffects } from '../../services/sound';

// Interactive Lesson Components
import { InteractiveWhatIsDS } from '../theory/InteractiveWhatIsDS';
import { InteractiveClassificationTaxonomy } from '../theory/InteractiveClassificationTaxonomy';
import { InteractivePrimitiveDemo } from '../theory/InteractivePrimitiveDemo';
import { InteractiveNonPrimitiveDemo } from '../theory/InteractiveNonPrimitiveDemo';
import { InteractiveLinearComparison } from '../theory/InteractiveLinearComparison';
import { InteractiveNonLinearTreeGraph } from '../theory/InteractiveNonLinearTreeGraph';
import { InteractiveOperationsVisualizer } from '../theory/InteractiveOperationsVisualizer';
import { InteractiveTradeoffEngine } from '../theory/InteractiveTradeoffEngine';

interface TheoryViewProps {
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  onNavigateToLab?: () => void;
}

export const TheoryView: React.FC<TheoryViewProps> = ({
  progress,
  onUpdateProgress,
  onNavigateToLab,
}) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [showMobileToc, setShowMobileToc] = useState<boolean>(false);

  const completedChapters = progress.completedTheoryChapters || [];
  const totalChapters = THEORY_LESSONS.length;
  const completedCount = new Set(completedChapters).size;

  const currentChapter: TheoryLesson = THEORY_LESSONS[activeChapterIndex] || THEORY_LESSONS[0];
  const isCurrentCompleted = completedChapters.includes(currentChapter.id);

  // Scroll smoothly to top on chapter change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeChapterIndex]);

  const handleSelectChapter = (index: number) => {
    soundEffects.playClick();
    setActiveChapterIndex(index);
    setShowMobileToc(false);
  };

  const handleToggleComplete = () => {
    const chapterId = currentChapter.id;
    soundEffects.playSuccess();

    onUpdateProgress((prev) => {
      const alreadyCompleted = prev.completedTheoryChapters?.includes(chapterId);
      let updatedCompleted: number[];
      let xpEarned = 0;

      if (alreadyCompleted) {
        updatedCompleted = prev.completedTheoryChapters.filter((id) => id !== chapterId);
      } else {
        updatedCompleted = [...(prev.completedTheoryChapters || []), chapterId];
        xpEarned = 0;
      }

      return {
        ...prev,
        xp: prev.xp + xpEarned,
        completedTheoryChapters: updatedCompleted,
        history:
          xpEarned > 0
            ? [
                {
                  title: `Completed Chapter ${currentChapter.chapterNumber || currentChapter.id}: ${currentChapter.title}`,
                  description: `Finished topic in Data Structures and Types`,
                  xpEarned: xpEarned,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
                ...prev.history,
              ]
            : prev.history,
      };
    });
  };

  const handleNextChapter = () => {
    if (activeChapterIndex < THEORY_LESSONS.length - 1) {
      soundEffects.playClick();
      setActiveChapterIndex((prev) => prev + 1);
    }
  };

  const handlePrevChapter = () => {
    if (activeChapterIndex > 0) {
      soundEffects.playClick();
      setActiveChapterIndex((prev) => prev - 1);
    }
  };

  // Helper to render interactive demo corresponding to current chapter
  const renderInteractiveDemo = (lesson: TheoryLesson) => {
    switch (lesson.interactiveDemoType) {
      case 'what-is-ds':
        return <InteractiveWhatIsDS />;
      case 'classification-taxonomy':
        return <InteractiveClassificationTaxonomy />;
      case 'primitive-types':
        return <InteractivePrimitiveDemo />;
      case 'non-primitive-types':
        return <InteractiveNonPrimitiveDemo />;
      case 'linear-comparison':
        return <InteractiveLinearComparison />;
      case 'non-linear-tree-graph':
        return <InteractiveNonLinearTreeGraph />;
      case 'common-operations':
        return <InteractiveOperationsVisualizer />;
      case 'tradeoff-engine':
        return <InteractiveTradeoffEngine />;
      default:
        return <InteractiveWhatIsDS />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* =========================================================================
          PAGE HEADER & OVERALL PROGRESS
          ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                Visual Learning Module
              </span>
              <span className="text-[11px] font-bold text-slate-400 font-mono">
                8 Interactive Chapters
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase font-mono">
              DATA STRUCTURES AND TYPES
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Step-by-step visual lessons designed for high retention: <strong>Concept → Simple Explanation → Visual Diagram → Example → Interactive Demo → Key Takeaway</strong>.
            </p>
          </div>

          {/* Right side of DATA STRUCTURES AND TYPES: 0/8 chapters */}
          <div className="shrink-0 flex items-center self-start sm:self-center">
            <div className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2.5 shadow-2xs">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-base sm:text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {completedCount}/{totalChapters} chapters
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Chapter Selector (Visible only on small screens) */}
      <div className="lg:hidden">
        <button
          onClick={() => setShowMobileToc(!showMobileToc)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-100 shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate font-mono">
            <ListOrdered className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">
              Chapter {currentChapter.chapterNumber}: {currentChapter.title}
            </span>
          </div>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold shrink-0 ml-2">
            {showMobileToc ? 'Close TOC' : 'View All 8 Chapters'}
          </span>
        </button>

        <AnimatePresence>
          {showMobileToc && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-lg max-h-[60vh] overflow-y-auto space-y-1"
            >
              {THEORY_LESSONS.map((ch, idx) => {
                const isCompleted = completedChapters.includes(ch.id);
                const isActive = idx === activeChapterIndex;
                return (
                  <button
                    key={ch.id}
                    onClick={() => handleSelectChapter(idx)}
                    className={`w-full text-left p-3 rounded-xl flex items-start gap-3 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {ch.chapterNumber || (idx + 1 < 10 ? `0${idx + 1}` : idx + 1)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{ch.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{ch.shortDesc}</p>
                    </div>
                    {isCompleted && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* =========================================================================
          MAIN 2-COLUMN LAYOUT: TABLE OF CONTENTS (LEFT) & CONTENT (RIGHT)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =====================================================================
            LEFT SIDEBAR: TABLE OF CONTENTS (8 CHAPTERS)
            ===================================================================== */}
        <aside className="hidden lg:block lg:col-span-4 sticky top-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs max-h-[calc(100vh-6rem)] overflow-y-auto space-y-3">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Curriculum (8 Chapters)
              </span>
            </div>
          </div>

          <nav className="space-y-1.5" aria-label="Chapters">
            {THEORY_LESSONS.map((chapter, index) => {
              const isActive = index === activeChapterIndex;
              const isCompleted = completedChapters.includes(chapter.id);
              const chapterNumStr =
                chapter.chapterNumber || (index + 1 < 10 ? `0${index + 1}` : `${index + 1}`);

              return (
                <button
                  key={chapter.id}
                  id={`toc-chapter-${chapter.id}`}
                  onClick={() => handleSelectChapter(index)}
                  className={`w-full text-left p-3 rounded-2xl transition-all relative flex items-start gap-3 cursor-pointer group ${
                    isActive
                      ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-l-4 border-indigo-600 dark:border-indigo-400 border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {/* Chapter Number */}
                  <div
                    className={`font-mono text-xs font-extrabold shrink-0 mt-0.5 px-2 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 group-hover:text-indigo-600'
                    }`}
                  >
                    {chapterNumStr}
                  </div>

                  {/* Title & Short Description */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <h2
                      className={`text-xs font-bold truncate leading-tight ${
                        isActive
                          ? 'text-indigo-950 dark:text-white'
                          : 'text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300'
                      }`}
                    >
                      {chapter.title}
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed">
                      {chapter.shortDesc}
                    </p>
                  </div>

                  {/* Status Indicator */}
                  <div className="shrink-0 mt-1">
                    {isCompleted ? (
                      <span className="flex items-center text-emerald-600 dark:text-emerald-400" title="Completed">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    ) : isActive ? (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse block" title="Active" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" title="Not Started" />
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* =====================================================================
            RIGHT PANEL: MAIN CHAPTER CONTENT (LEARNING PEDAGOGY PIPELINE)
            ===================================================================== */}
        <main className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-7">
            {/* 1. Header Bar: Chapter Label */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="font-mono text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-3 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/60">
                CHAPTER {currentChapter.chapterNumber} // {currentChapter.categoryLabel || 'FUNDAMENTALS'}
              </span>
            </div>

            {/* 2. Chapter Title & Short Subtitle */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
                {currentChapter.title}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {currentChapter.shortDesc}
              </p>
            </div>

            {/* =================================================================
                STEP 1: CONCEPT & EXECUTIVE DEFINITION
                ================================================================= */}
            {currentChapter.executiveDefinition && (
              <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border-l-4 border-indigo-600 dark:border-indigo-500 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                    1. CORE CONCEPT
                  </span>
                </div>
                <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                  {currentChapter.executiveDefinition}
                </p>
              </div>
            )}

            {/* =================================================================
                STEP 2: SIMPLE EXPLANATION & SPECS
                ================================================================= */}
            <div className="space-y-4">
              {/* Critical Specifications Grid */}
              {currentChapter.criticalSpecifications && currentChapter.criticalSpecifications.length > 0 && (
                <div className="space-y-2.5 p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                      Key Rules & Specifications
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-300/60 dark:border-amber-700/60 ml-auto">
                      Essential
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentChapter.criticalSpecifications.map((spec, sIdx) => {
                      const colonIndex = spec.indexOf(':');
                      const hasColon = colonIndex > 0;
                      const titlePart = hasColon ? spec.slice(0, colonIndex + 1) : '';
                      const descPart = hasColon ? spec.slice(colonIndex + 1) : spec;

                      return (
                        <div
                          key={sIdx}
                          className="p-3 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-amber-200/80 dark:border-amber-800/40 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200 shadow-2xs transition-all hover:border-amber-300 dark:hover:border-amber-700"
                        >
                          <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 mt-1 shrink-0 ring-2 ring-amber-200 dark:ring-amber-900/60" />
                          <span className="leading-snug">
                            {hasColon ? (
                              <>
                                <strong className="font-bold text-slate-900 dark:text-slate-100">{titlePart}</strong>
                                <span>{descPart}</span>
                              </>
                            ) : (
                              <span>{spec}</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Real-World Analogy */}
              {currentChapter.analogy && (
                <div className="p-4 sm:p-5 bg-indigo-50/60 dark:bg-slate-950 rounded-2xl border border-indigo-100 dark:border-slate-800 space-y-1.5 text-slate-900 dark:text-white">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-white">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-700 dark:text-white">
                      Intuition: {currentChapter.analogy.title}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-white leading-relaxed font-medium">
                    {currentChapter.analogy.description}
                  </p>
                </div>
              )}
            </div>

            {/* =================================================================
                STEP 3: VISUAL DIAGRAM
                ================================================================= */}
            {currentChapter.visualDiagram && (
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      2. Visual Diagram: {currentChapter.visualDiagram.operationLabel}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Schematic Architecture
                  </span>
                </div>

                <div className="p-4 bg-slate-950 text-indigo-200 rounded-2xl border border-slate-800 font-mono text-xs overflow-x-auto shadow-inner">
                  <pre className="leading-relaxed whitespace-pre">
                    {currentChapter.visualDiagram.diagramText}
                  </pre>
                  {currentChapter.visualDiagram.notes && (
                    <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                      💡 {currentChapter.visualDiagram.notes}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =================================================================
                STEP 4: STEP-BY-STEP EXAMPLE
                ================================================================= */}
            {currentChapter.example && (
              <div className="p-4 sm:p-5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    3. STEP-BY-STEP EXAMPLE
                  </span>
                  <span className="text-xs font-bold font-mono">{currentChapter.example.title}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                  {currentChapter.example.description}
                </p>
                {currentChapter.example.steps && (
                  <div className="space-y-1.5 pt-1">
                    {currentChapter.example.steps.map((step, stIdx) => (
                      <div
                        key={stIdx}
                        className="p-2.5 bg-slate-50 dark:bg-slate-900/90 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 flex items-center gap-2"
                      >
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {stIdx + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =================================================================
                STEP 5: INTERACTIVE VISUALIZATION LAB
                ================================================================= */}
            <div className="rounded-3xl border border-blue-200/80 dark:border-slate-800 bg-gradient-to-b from-blue-50/40 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 dark:bg-slate-900 p-5 sm:p-7 shadow-xs space-y-4 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blue-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      4. INTERACTIVE VISUALIZATION LAB
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-300">
                      Live interactive sandbox — experiment with data layouts, node operations, and memory states.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-blue-700 dark:text-blue-300 font-bold bg-blue-100/80 dark:bg-blue-950/80 px-2.5 py-1 rounded-full border border-blue-200/60 dark:border-blue-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    Live Interactive Demo
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
                {renderInteractiveDemo(currentChapter)}
              </div>
            </div>

            {/* =================================================================
                STEP 6: KEY TAKEAWAY CARD
                ================================================================= */}
            <div className="p-5 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl space-y-2 border border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 text-amber-400 font-mono">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-extrabold uppercase tracking-wider">
                  5. KEY TAKEAWAY
                </span>
              </div>
              <p className="text-sm sm:text-base font-semibold leading-relaxed text-slate-100">
                {currentChapter.keyTakeaway}
              </p>
            </div>



            {/* =================================================================
                CHAPTER COMPLETION & NAVIGATION BAR
                ================================================================= */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={handleToggleComplete}
                className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                  isCurrentCompleted
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isCurrentCompleted ? 'Chapter Completed ✓' : 'Mark Chapter as Completed'}
                </span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <button
                  onClick={handlePrevChapter}
                  disabled={activeChapterIndex === 0}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={handleNextChapter}
                  disabled={activeChapterIndex === THEORY_LESSONS.length - 1}
                  className="px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/80 dark:border-indigo-800 font-bold text-xs text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Next Chapter</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
