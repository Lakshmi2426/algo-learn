import React, { useState, useEffect, useRef } from 'react';
import { TabType, UserProgress } from './types';
import { loadProgress, saveProgress } from './services/storage';
import { soundEffects } from './services/sound';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { HomeDashboard } from './components/views/HomeDashboard';
import { TheoryView } from './components/views/TheoryView';
import { LabView } from './components/views/LabView';
import { GameView } from './components/views/GameView';
import { QuizView } from './components/views/QuizView';
import { ProgressView } from './components/views/ProgressView';
import { ChatbotLogo } from './components/common/ChatbotLogo';
import { CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [activeGameLevelId, setActiveGameLevelId] = useState<number>(1);
  const [isNavOpen, setIsNavOpen] = useState<boolean>(false);
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());
  const [toastInfo, setToastInfo] = useState<{ text: string; isDeduction?: boolean } | null>(null);
  const lastNotifiedEntryIdRef = useRef<string | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  // Auto-dismiss toast message after 4 seconds
  useEffect(() => {
    if (!toastInfo) return;
    const timer = setTimeout(() => {
      setToastInfo(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toastInfo]);

  // Toggle navigation drawer
  const handleToggleNav = () => {
    setIsNavOpen((prev) => !prev);
  };

  const handleCloseNav = () => {
    setIsNavOpen(false);
  };

  // Nav item selection: change tab without closing menu
  const handleSelectTab = (tab: TabType) => {
    setCurrentTab(tab);
  };

  // Close menu when clicking/pressing anywhere other than the menu bar
  useEffect(() => {
    if (!isNavOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Ignore clicks inside the sidebar
      if (sidebarRef.current && sidebarRef.current.contains(target)) {
        return;
      }

      // Ignore clicks on the hamburger toggle button
      if (target.closest('#nav-toggle-btn')) {
        return;
      }

      // User clicked outside the menu bar -> close it
      setIsNavOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isNavOpen]);

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        soundEffects.playClick();
        handleToggleNav();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Keep state synchronized with storage and display points popup notifications
  const handleUpdateProgress = (updatedOrUpdater: UserProgress | ((prev: UserProgress) => UserProgress)) => {
    setProgress((prev) => {
      const next = typeof updatedOrUpdater === 'function' ? updatedOrUpdater(prev) : updatedOrUpdater;
      const sanitized = (next && (next as any).updated && typeof (next as any).updated === 'object')
        ? (next as any).updated
        : next;
      if (sanitized && typeof sanitized === 'object') {
        saveProgress(sanitized);

        // Notify of actual points changes reliably without duplicates
        const latestEntry = sanitized?.pointsLedger?.history?.[0];
        const prevPoints = prev?.pointsLedger?.totalPoints ?? 0;
        const nextPoints = sanitized?.pointsLedger?.totalPoints ?? 0;
        const pointsDiff = nextPoints - prevPoints;

        if (latestEntry && latestEntry.id !== lastNotifiedEntryIdRef.current) {
          lastNotifiedEntryIdRef.current = latestEntry.id;
          if (latestEntry.category !== 'theory') {
            const isDeduction = latestEntry.delta < 0 || pointsDiff < 0;
            const displayPts = latestEntry.delta !== 0 ? (latestEntry.delta > 0 ? `+${latestEntry.delta}` : `${latestEntry.delta}`) : (pointsDiff > 0 ? `+${pointsDiff}` : `${pointsDiff}`);
            const msg = `${displayPts} Points — ${latestEntry.action}`;
            setToastInfo({ text: msg, isDeduction });
          }
        } else if (pointsDiff !== 0 && !latestEntry) {
          const isDeduction = pointsDiff < 0;
          const displayPts = pointsDiff > 0 ? `+${pointsDiff}` : `${pointsDiff}`;
          setToastInfo({ text: `${displayPts} Points Changed`, isDeduction });
        }
      }
      return sanitized;
    });
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 flex antialiased selection:bg-indigo-600 selection:text-white transition-colors duration-200 relative">
      {/* Navigation Bar */}
      <Sidebar
        ref={sidebarRef}
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        progress={progress}
        isOpen={isNavOpen}
        onClose={handleCloseNav}
      />

      {/* Main Workspace Area - Compresses when the menu bar is open */}
      <div className="flex-1 min-w-0 h-full flex flex-col transition-all duration-300 ease-out">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          progress={progress}
          isSidebarOpen={isNavOpen}
          onToggleSidebar={handleToggleNav}
          onSelectTab={handleSelectTab}
        />

        {/* Main Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar scroll-smooth bg-slate-50 dark:bg-slate-950">
          {currentTab === 'home' && (
            <HomeDashboard
              progress={progress}
              onSelectTab={handleSelectTab}
              onSelectGameLevel={(lvlId) => {
                setActiveGameLevelId(lvlId);
                handleSelectTab('game');
              }}
            />
          )}

          {currentTab === 'theory' && (
            <TheoryView
              progress={progress}
              onUpdateProgress={handleUpdateProgress}
              onNavigateToLab={() => handleSelectTab('lab')}
            />
          )}

          {currentTab === 'lab' && (
            <LabView
              progress={progress}
              onUpdateProgress={handleUpdateProgress}
            />
          )}

          {currentTab === 'game' && (
            <GameView
              progress={progress}
              activeLevelId={activeGameLevelId}
              onSelectLevel={setActiveGameLevelId}
              onUpdateProgress={handleUpdateProgress}
            />
          )}

          {currentTab === 'quiz' && (
            <QuizView
              progress={progress}
              onUpdateProgress={handleUpdateProgress}
              onNavigateHome={() => handleSelectTab('home')}
            />
          )}

          {currentTab === 'progress' && (
            <ProgressView
              progress={progress}
            />
          )}
        </main>
      </div>

      {/* Floating Chatbot Assistant Logo (Bottom-Right) */}
      <div id="ai-bot-floating-button" className="floating-chatbot-container fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 transition-transform active:scale-95">
        <ChatbotLogo
          size={56}
          onClick={() => {
            soundEffects.playClick();
          }}
        />
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastInfo && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed top-5 right-5 sm:right-8 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border shadow-lg text-slate-800 dark:text-slate-100 ${
              toastInfo.isDeduction
                ? 'border-amber-300 dark:border-amber-700/80'
                : 'border-emerald-200 dark:border-emerald-800/80'
            }`}
            role="status"
            aria-live="polite"
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                toastInfo.isDeduction
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-xs sm:text-sm font-semibold tracking-tight">
              {toastInfo.text}
            </span>
            <button
              onClick={() => setToastInfo(null)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors ml-1 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
