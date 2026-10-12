import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider, useUser } from './context/UserContext';
import { QuestionsProvider } from './context/QuestionsContext';
import { TeachersProvider } from './context/TeachersContext';
import { AlgorithmBackground } from './components/common/AlgorithmBackground';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HeroSection } from './components/home/HeroSection';
import { QuickStatsSection } from './components/home/QuickStatsSection';
import { FeaturedTopicsSection } from './components/home/FeaturedTopicsSection';
import { LearningJourneySection } from './components/home/LearningJourneySection';
import { AIAssistantPreviewSection } from './components/home/AIAssistantPreviewSection';
import { LeaderboardPreviewSection } from './components/home/LeaderboardPreviewSection';
import { TopicsCatalog } from './components/topics/TopicsCatalog';
import { TeacherWorkspace } from './components/teacher/TeacherWorkspace';
import { LeaderboardView } from './components/leaderboard/LeaderboardView';
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { AboutView } from './components/about/AboutView';
import { AuthModal } from './components/auth/AuthModal';
import { DSAModuleViewer } from './components/topics/DSAModuleViewer';
import { getModuleFromHash, ModuleRouteConfig, INTEGRATED_MODULES } from './utils/moduleRoutes';
import { NavigationTab } from './types';

const MainAppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [activeModule, setActiveModule] = useState<ModuleRouteConfig | null>(null);
  const [teacherInitialTopic, setTeacherInitialTopic] = useState<string>('');
  const {
    showAuthModal,
    setShowAuthModal,
    authModalMode,
    setAuthModalMode,
    isAuthenticated,
  } = useUser();

  const handleQuickAsk = (prompt: string) => {
    setTeacherInitialTopic(prompt);
    setActiveTab('ask-teacher');
    window.location.hash = '#ask-teacher';
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleOpenAuth = (mode: 'login' | 'signup' | 'admin' = 'login') => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  // Sync state with URL hash
  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash;
      const mod = getModuleFromHash(hash);
      if (mod) {
        if (!isAuthenticated) {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('algolearn_pending_module_hash', hash);
          }
          window.location.hash = '#topics';
          setAuthModalMode('login');
          setShowAuthModal(true);
          return;
        }
        setActiveModule(mod);
        return;
      }

      setActiveModule(null);

      const clean = hash.replace(/^[\/#]+/, '').trim().toLowerCase();
      if (clean === 'topics' || clean === 'visualize') {
        setActiveTab('topics');
      } else if (clean === 'ask-teacher' || clean === 'teachers' || clean === 'ai-tutor') {
        setActiveTab('ask-teacher');
      } else if (clean === 'leaderboard') {
        setActiveTab('leaderboard');
      } else if (clean === 'profile') {
        setActiveTab('home');
      } else if (clean === 'about') {
        setActiveTab('about');
      } else if (clean === 'admin') {
        setActiveTab('admin');
      } else if (clean === 'home' || clean === '') {
        setActiveTab('home');
      }
    };

    handleHashSync();
    window.addEventListener('hashchange', handleHashSync);
    window.addEventListener('popstate', handleHashSync);

    const handleGlobalNavMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      if (event.data.type === 'ALGOLEARN_NAVIGATE') {
        if (event.data.tab === 'home') {
          setActiveModule(null);
          setActiveTab('home');
          window.location.hash = '';
          window.scrollTo({ top: 0, behavior: 'instant' });
        } else if (event.data.tab === 'ask-teacher') {
          setActiveModule(null);
          setActiveTab('ask-teacher');
          window.location.hash = '#ask-teacher';
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
      }
    };

    window.addEventListener('message', handleGlobalNavMessage);

    return () => {
      window.removeEventListener('hashchange', handleHashSync);
      window.removeEventListener('popstate', handleHashSync);
      window.removeEventListener('message', handleGlobalNavMessage);
    };
  }, [isAuthenticated, setAuthModalMode, setShowAuthModal]);

  // Scroll to top when activeTab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  return (
    <div className="relative min-h-screen bg-[#f6f9fe] dark:bg-[#070b14] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white transition-colors duration-300">
      {/* Persistent Module Viewer for Integrated Topics — Zero Reloading Delay */}
      <div
        className="fixed inset-0 z-50"
        style={{
          display: activeModule ? 'block' : 'none',
          visibility: activeModule ? 'visible' : 'hidden',
          pointerEvents: activeModule ? 'auto' : 'none',
        }}
      >
        <DSAModuleViewer
          moduleConfig={activeModule}
          onNavigateHome={() => {
            setActiveModule(null);
            setActiveTab('home');
            window.location.hash = '';
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          onNavigateAskTeacher={() => {
            setActiveModule(null);
            setActiveTab('ask-teacher');
            window.location.hash = '#ask-teacher';
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
        />
      </div>

      {!activeModule && (
        <>
          {/* Background Interactive Particle Canvas */}
          <AlgorithmBackground />

          {/* Main Sticky Navbar */}
          <Navbar
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              if (tab === 'home') window.location.hash = '';
              else window.location.hash = `#${tab}`;
            }}
            onOpenAuth={handleOpenAuth}
          />

          {/* Content Router based on activeTab — Instant 0.05s Navigation Without Blank Page Delay */}
          <main className="relative z-10">
            {activeTab === 'home' && (
              <div key="home">
                {/* 1. Hero Section with 3D Poster Carousel */}
                <HeroSection setActiveTab={setActiveTab} />

                {/* 2. Quick Stats Counters */}
                <QuickStatsSection />

                {/* 3. Explore by Topic (4 Featured Topics Only) */}
                <FeaturedTopicsSection setActiveTab={setActiveTab} />

                {/* 4. Learning Journey Methodology */}
                <LearningJourneySection setActiveTab={setActiveTab} />

                {/* 5. Ask a Teacher Preview */}
                <AIAssistantPreviewSection
                  setActiveTab={setActiveTab}
                  onQuickAsk={handleQuickAsk}
                />

                {/* 6. Global Arena / Leaderboard Podium Preview */}
                <LeaderboardPreviewSection setActiveTab={setActiveTab} />
              </div>
            )}

            {activeTab === 'topics' && (
              <div key="topics">
                <TopicsCatalog onAskTeacher={handleQuickAsk} />
              </div>
            )}

            {activeTab === 'ask-teacher' && (
              <div key="ask-teacher">
                <TeacherWorkspace
                  initialTopicTitle={teacherInitialTopic || undefined}
                  setActiveTab={setActiveTab}
                />
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div key="leaderboard">
                <LeaderboardView />
              </div>
            )}

            {activeTab === 'admin' && (
              <div key="admin">
                <AdminDashboardView setActiveTab={setActiveTab} />
              </div>
            )}

            {activeTab === 'about' && (
              <div key="about">
                <AboutView setActiveTab={setActiveTab} />
              </div>
            )}
          </main>

          {/* Floating Action Button — "Ask a Teacher" */}
          {activeTab !== 'ask-teacher' && (
            <button
              onClick={() => {
                setTeacherInitialTopic('');
                setActiveTab('ask-teacher');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-label="Ask a Teacher"
              title="Ask a Teacher — Get DSA help from an expert"
              className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 shadow-[0_8px_24px_-4px_rgba(37,99,235,0.45),0_0_16px_rgba(99,102,241,0.25)] hover:shadow-[0_12px_32px_-2px_rgba(37,99,235,0.55),0_0_24px_rgba(124,58,237,0.35)] hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 cursor-pointer select-none"
              id="floating-ask-teacher-btn"
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Global Footer */}
          {activeTab !== 'ask-teacher' && <Footer setActiveTab={setActiveTab} />}
        </>
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
        onNavigateTab={setActiveTab}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <TeachersProvider>
          <QuestionsProvider>
            <MainAppContent />
          </QuestionsProvider>
        </TeachersProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
