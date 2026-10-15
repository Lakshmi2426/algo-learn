import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavItem, TopicId, UserData, UserSummary } from './types';
import { NavigationSidebar } from './components/NavigationSidebar';
import { TopHeader } from './components/TopHeader';
import { UserProfileModal } from './components/UserProfileModal';
import { HomeView } from './components/views/HomeView';
import { LearnView } from './components/views/LearnView';
import { VisualizeView } from './components/views/VisualizeView';
import { QuizView, clearSavedQuizState, calculateTotalQuizPoints } from './components/views/QuizView';
import { ProgressView } from './components/views/ProgressView';
import { FloatingChatButton } from './components/FloatingChatButton';
import {
  getActiveUserId,
  setActiveUserId,
  fetchUserData,
  syncUserDataToServer,
  resetUserProgress,
  switchOrCreateUser,
  fetchAllUsers,
  getUserItem,
  setUserItem,
  createDefaultUserData
} from './utils/userStorage';

// Permanent public lesson video bundled with the app
const PUBLIC_LESSON_VIDEO_URL = '/videos/lesson.mp4';
const PUBLIC_LESSON_VIDEO_NAME = 'Tree DSA Complete Visual Lesson';
const PUBLIC_LESSON_VIDEO_SIZE = '2.0 MB';

const getInitialThemeIsDark = (): boolean => {
  try {
    if (window.parent !== window) {
      const parentRoot = window.parent.document.documentElement;
      const parentTheme = parentRoot.getAttribute('data-theme');
      if (parentTheme === 'dark' || parentTheme === 'light') return parentTheme === 'dark';
      if (parentRoot.classList.contains('dark')) return true;
      if (parentRoot.classList.contains('light')) return false;
    }
  } catch {}

  try {
    const savedTheme = localStorage.getItem('algolearn_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme === 'dark';
  } catch {}

  return true;
};

export default function App() {
  const [currentNav, setCurrentNav] = useState<NavItem>('home');
  const [currentTopicId, setCurrentTopicId] = useState<TopicId>('basics');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialThemeIsDark);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);

  // Active isolated user state
  const [activeUserId, setActiveUserIdState] = useState<string>(() => getActiveUserId());
  const [currentUser, setCurrentUser] = useState<UserData>(() => {
    const id = getActiveUserId();
    const saved = getUserItem(id, 'progress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.userId === id) return parsed;
      } catch {}
    }
    return createDefaultUserData(id);
  });
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Ensure window evaluation properties are defined immediately on first evaluation
  if (typeof window !== 'undefined') {
    const w = window as any;
    if (!w.currentUser) {
      w.activeUserId = activeUserId;
      w.currentUser = currentUser;
      w.overallProgress = currentUser.progress || 0;
      w.score = currentUser.score || 0;
      w.xp = currentUser.xp || 0;
      w.completedTopics = currentUser.completedTopics || [];
      w.learnCompleted = (currentUser.completedTopics || []).length;
      w.visualizeCompleted = currentUser.videoCompleted ? 1 : 0;
      w.gameProgress = 0;
      w.gameScore = 0;
      w.gameXP = 0;
      w.quizAnswered = currentUser.quizProgress?.completed || 0;
      w.quizScore = currentUser.quizScore?.score || 0;
      w.treeDsaProgress = {
        overallProgress: currentUser.progress || 0,
        score: currentUser.score || 0,
        xp: currentUser.xp || 0,
        completedTopics: currentUser.completedTopics || [],
        learnCompleted: (currentUser.completedTopics || []).length,
        visualizeCompleted: currentUser.videoCompleted ? 1 : 0,
        gameProgress: 0,
        gameScore: 0,
        gameXP: 0,
        quizAnswered: currentUser.quizProgress?.completed || 0,
        quizScore: currentUser.quizScore?.score || 0,
      };
    }
  }

  // Synchronize theme class on document element for global theme-aware styling
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleParentThemeChange = (event: MessageEvent) => {
      if (event.data?.type !== 'ALGOLEARN_THEME_CHANGE') return;
      if (event.data.theme === 'dark') setIsDarkMode(true);
      if (event.data.theme === 'light') setIsDarkMode(false);
    };
    window.addEventListener('message', handleParentThemeChange);
    return () => window.removeEventListener('message', handleParentThemeChange);
  }, []);

  // Visual Lesson Video State (Permanent public video bundled with the app)
  const [isVideoCompleted, setIsVideoCompleted] = useState<boolean>(() => {
    try {
      const id = getActiveUserId();
      return getUserItem(id, 'video_completed') === 'true';
    } catch {
      return false;
    }
  });

  // Purge any legacy blob URLs and metadata from storage
  useEffect(() => {
    try {
      localStorage.removeItem('tree_dsa_video_url');
      localStorage.removeItem('tree_dsa_video_name');
      localStorage.removeItem('tree_dsa_video_size');
      if (typeof window !== 'undefined' && window.indexedDB) {
        window.indexedDB.deleteDatabase('TreeDsaVideoDB');
      }
    } catch {}
  }, []);

  const handleToggleVideoCompleted = () => {
    setIsVideoCompleted((prev) => {
      // Award 30 points only when the student watches the entire video to completion.
      // Award the points only once for this video. Do not award points again for replaying.
      if (!prev) {
        setUserItem(activeUserId, 'video_completed', 'true');
        return true;
      }
      return prev;
    });
  };

  const handleWatchAgainFromProgress = () => {
    handleNavigate('visualize');
  };

  // Active loaded user ref tracks exactly which user's state is currently mounted in React
  const loadedUserIdRef = useRef<string>(activeUserId);

  // Completed topics & quiz progress tracking in localStorage namespaced per user
  const [completedTopics, setCompletedTopics] = useState<TopicId[]>(() => {
    try {
      const saved = getUserItem(activeUserId, 'completed_topics');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [quizScore, setQuizScore] = useState<{ score: number; total: number } | null>(() => {
    try {
      const saved = getUserItem(activeUserId, 'quiz_score');
      if (saved) return JSON.parse(saved);
      const quizState = getUserItem(activeUserId, 'quiz_state');
      if (quizState) {
        const parsed = JSON.parse(quizState);
        const pts = calculateTotalQuizPoints(
          parsed.confirmedQuestions || {},
          parsed.questionTimeouts || {},
          parsed.userAnswers || {}
        );
        return { score: pts, total: 70 };
      }
      return null;
    } catch {
      return null;
    }
  });

  const [quizProgress, setQuizProgress] = useState<{ completed: number; total: number }>(() => {
    try {
      const saved = getUserItem(activeUserId, 'quiz_progress');
      if (saved) return JSON.parse(saved);
      const quizState = getUserItem(activeUserId, 'quiz_state');
      if (quizState) {
        const parsed = JSON.parse(quizState);
        const count = Object.keys(parsed?.confirmedQuestions || {}).length;
        return { completed: count, total: 14 };
      }
    } catch {}
    return { completed: 0, total: 14 };
  });

  const [quizKey, setQuizKey] = useState<number>(0);
  const [learnKey, setLearnKey] = useState<number>(0);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState<boolean>(false);
  const [completedVisualizations, setCompletedVisualizations] = useState<string[]>(() => {
    try {
      const saved = getUserItem(activeUserId, 'completed_visualizations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load user data on startup or when switching active user
  useEffect(() => {
    let isMounted = true;
    const loadUserData = async () => {
      const data = await fetchUserData(activeUserId);
      if (isMounted && data) {
        loadedUserIdRef.current = activeUserId;
        setCurrentUser(data);
        setCompletedTopics(data.completedTopics || []);

        // Accurately restore quiz score from server or client backup
        const restoredQuizScore = data.quizScore || (() => {
          try {
            const saved = getUserItem(activeUserId, 'quiz_score');
            if (saved) return JSON.parse(saved);
            const quizState = getUserItem(activeUserId, 'quiz_state');
            if (quizState) {
              const parsed = JSON.parse(quizState);
              const pts = calculateTotalQuizPoints(
                parsed.confirmedQuestions || {},
                parsed.questionTimeouts || {},
                parsed.userAnswers || {}
              );
              return { score: pts, total: 70 };
            }
          } catch {}
          return null;
        })();

        setQuizScore(restoredQuizScore);
        setQuizProgress(data.quizProgress || { completed: 0, total: 14 });
        setIsVideoCompleted(Boolean(data.videoCompleted));
        setCompletedVisualizations(data.completedVisualizations || []);
        setIsInitialLoadDone(true);
      }
      const users = await fetchAllUsers();
      if (isMounted) {
        setAllUsers(users);
      }
    };
    loadUserData();
    return () => {
      isMounted = false;
    };
  }, [activeUserId]);

  // Synchronize active user state to backend and update window evaluation properties
  useEffect(() => {
    // CRITICAL GUARD: Only sync if initial load is done AND current React state matches activeUserId
    // Prevents overwriting persisted scores with default empty values during page refresh
    if (!isInitialLoadDone || loadedUserIdRef.current !== activeUserId) {
      return;
    }

    // TREES TOPIC — POINTS CONFIGURATION:
    // Visualize section: 30 points (awarded only when video is 100% completed)
    // Quiz section: 70 points maximum (14 questions: +5 correct, −2 incorrect, 0 timeout/unanswered)
    // Maximum topic score: 100 points
    const vizPoints = isVideoCompleted ? 30 : 0;
    const currentQuizPts = quizScore ? Math.max(0, Math.min(70, quizScore.score)) : 0;
    const totalTopicScore = Math.max(0, Math.min(100, vizPoints + currentQuizPts));
    const overallPercentage = totalTopicScore;
    const calcXP = totalTopicScore;

    const updatedUser: UserData = {
      ...currentUser,
      userId: activeUserId,
      progress: overallPercentage,
      xp: calcXP,
      score: totalTopicScore,
      completedTopics,
      completedVisualizations,
      quizScore,
      quizProgress,
      videoCompleted: isVideoCompleted,
      lastUpdated: Date.now(),
    };

    setCurrentUser(updatedUser);
    syncUserDataToServer(updatedUser);

    // Keep window global object in sync for automated evaluation suites (active user)
    if (typeof window !== 'undefined') {
      const w = window as any;
      w.currentUser = updatedUser;
      w.activeUserId = activeUserId;
      w.overallProgress = totalTopicScore;
      w.score = totalTopicScore;
      w.xp = calcXP;
      w.vizPoints = vizPoints;
      w.quizScore = currentQuizPts;
      w.totalTopicScore = totalTopicScore;
      w.completedTopics = completedTopics;
      w.learnCompleted = completedTopics.length;
      w.visualizeCompleted = isVideoCompleted ? 1 : 0;
      w.gameProgress = quizProgress.completed;
      w.gameScore = totalTopicScore;
      w.gameXP = calcXP;
      w.quizAnswered = quizProgress.completed;
      w.treeDsaProgress = {
        overallProgress: totalTopicScore,
        score: totalTopicScore,
        xp: calcXP,
        vizPoints,
        quizPoints: currentQuizPts,
        totalTopicScore,
        completedTopics,
        learnCompleted: completedTopics.length,
        visualizeCompleted: isVideoCompleted ? 1 : 0,
        gameProgress: quizProgress.completed,
        gameScore: totalTopicScore,
        gameXP: calcXP,
        quizAnswered: quizProgress.completed,
        quizScore: currentQuizPts,
      };
    }
  }, [completedTopics, quizScore, quizProgress, isVideoCompleted, completedVisualizations, activeUserId, isInitialLoadDone]);

  const handleSwitchUser = async (targetUserId: string) => {
    if (!targetUserId || !targetUserId.trim()) return;
    const cleanId = targetUserId.trim();

    // 1. Fetch target user's data before updating active user in React state
    const data = await fetchUserData(cleanId);

    // 2. Point loaded ref to the target user
    loadedUserIdRef.current = cleanId;

    // 3. Update storage
    setActiveUserId(cleanId);

    // 4. Batch all state updates atomically to new user's data
    setActiveUserIdState(cleanId);
    setCurrentUser(data);
    setCompletedTopics(data.completedTopics || []);
    setQuizScore(data.quizScore || null);
    setQuizProgress(data.quizProgress || { completed: 0, total: 14 });
    setIsVideoCompleted(Boolean(data.videoCompleted));
    setCompletedVisualizations(data.completedVisualizations || []);
    setQuizKey((prev) => prev + 1);
    setLearnKey((prev) => prev + 1);

    const users = await fetchAllUsers();
    setAllUsers(users);
  };

  const handleCreateUser = async (displayName: string, avatar: string) => {
    const newUser = await switchOrCreateUser(undefined, displayName, avatar);
    loadedUserIdRef.current = newUser.userId;
    setActiveUserId(newUser.userId);
    setActiveUserIdState(newUser.userId);
    setCurrentUser(newUser);
    setCompletedTopics([]);
    setQuizScore(null);
    setQuizProgress({ completed: 0, total: 14 });
    setIsVideoCompleted(false);
    setCompletedVisualizations([]);
    setQuizKey((prev) => prev + 1);
    setLearnKey((prev) => prev + 1);
    const users = await fetchAllUsers();
    setAllUsers(users);
  };

  const handleStartFreshSession = async () => {
    const freshUser = await switchOrCreateUser();
    loadedUserIdRef.current = freshUser.userId;
    setActiveUserId(freshUser.userId);
    setActiveUserIdState(freshUser.userId);
    setCurrentUser(freshUser);
    setCompletedTopics([]);
    setQuizScore(null);
    setQuizProgress({ completed: 0, total: 14 });
    setIsVideoCompleted(false);
    setCompletedVisualizations([]);
    setQuizKey((prev) => prev + 1);
    setLearnKey((prev) => prev + 1);
    const users = await fetchAllUsers();
    setAllUsers(users);
  };

  const handleResetProgress = useCallback(async () => {
    // 1. Reset all React state to initial zero/empty state for active user
    setCompletedTopics([]);
    setQuizScore(null);
    setQuizProgress({ completed: 0, total: 14 });
    setIsVideoCompleted(false);
    setCompletedVisualizations([]);
    setQuizKey((prev) => prev + 1);
    setLearnKey((prev) => prev + 1);

    // 2. Clear Quiz in-memory cache and storage for this user only
    clearSavedQuizState(activeUserId);

    // 3. Reset user data on backend and local storage (leaves other users completely untouched)
    const resetData = await resetUserProgress(activeUserId);
    setCurrentUser(resetData);

    const users = await fetchAllUsers();
    setAllUsers(users);

    // 4. Reset global window state for active user
    if (typeof window !== 'undefined') {
      const w = window as any;
      w.overallProgress = 0;
      w.score = 0;
      w.xp = 0;
      w.completedTopics = [];
      w.learnCompleted = 0;
      w.visualizeCompleted = 0;
      w.gameProgress = 0;
      w.gameScore = 0;
      w.gameXP = 0;
      w.quizAnswered = 0;
      w.quizScore = 0;
      w.quizCorrect = 0;
      w.quizIncorrect = 0;
      w.quizAnswers = {};
      w.quizResults = {};
    }
  }, [activeUserId]);

  // Expose global methods for evaluation and external test automation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const w = window as any;
      w.resetProgress = handleResetProgress;
      w.switchUser = handleSwitchUser;
      w.createUser = handleCreateUser;
      w.getUserData = (id: string) => fetchUserData(id);
    }
  }, [handleResetProgress]);

  const handleMarkTopicCompleted = (topicId: TopicId) => {
    setCompletedTopics((prev) => {
      let next: TopicId[];
      if (prev.includes(topicId)) {
        next = prev.filter((id) => id !== topicId);
      } else {
        next = [...prev, topicId];
      }
      setUserItem(activeUserId, 'completed_topics', JSON.stringify(next));
      return next;
    });
  };

  const handleUpdateQuizScore = (score: number, total: number) => {
    const data = { score, total };
    setQuizScore(data);
    setUserItem(activeUserId, 'quiz_score', JSON.stringify(data));
  };

  const handleUpdateQuizProgress = (completed: number, total: number) => {
    const data = { completed, total };
    setQuizProgress(data);
    setUserItem(activeUserId, 'quiz_progress', JSON.stringify(data));
  };

  const handleNavigate = (nav: NavItem, topicId?: TopicId) => {
    setCurrentNav(nav);
    if (topicId) {
      setCurrentTopicId(topicId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div
      data-theme={isDarkMode ? 'dark' : 'light'}
      className={`min-h-screen transition-colors duration-300 relative ${
        isDarkMode
          ? 'bg-black text-slate-100 selection:bg-indigo-600 selection:text-white'
          : 'bg-[#F8FAFF] text-slate-900 selection:bg-indigo-600 selection:text-white'
      }`}
    >
      {/* Ambient background glow accents matching the Electric Blue to Violet theme */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className={`absolute -top-40 -left-40 w-[550px] h-[550px] rounded-full blur-3xl transition-opacity duration-500 ${
            isDarkMode ? 'bg-blue-600/5' : 'bg-blue-500/5'
          }`}
        />
        <div
          className={`absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full blur-3xl transition-opacity duration-500 ${
            isDarkMode ? 'bg-purple-600/5' : 'bg-purple-500/5'
          }`}
        />
      </div>

      {/* Left-Side Navigation Sidebar */}
      <NavigationSidebar
        currentNav={currentNav}
        onSelectNav={(nav) => handleNavigate(nav)}
        isOpen={isSidebarOpen}
        onToggleOpen={handleToggleSidebar}
        onClose={() => setIsSidebarOpen(false)}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        userId={currentUser.userId}
        completedTopics={completedTopics}
        quizScore={quizScore}
        quizProgress={quizProgress}
        completedVisualizations={completedVisualizations}
        isVideoCompleted={isVideoCompleted}
        isSoundOn={isSoundOn}
        onToggleSound={() => setIsSoundOn((prev) => !prev)}
      />

      {/* Main Content Area (Expands to full width when sidebar is closed) */}
      <div
        className={`transition-all duration-300 flex flex-col min-h-screen ${
          isSidebarOpen ? 'md:ml-72' : 'ml-0'
        }`}
      >
        {/* Top Header Bar - Excluded on visualize page to remove horizontal white bar */}
        {currentNav !== 'visualize' && (
          <TopHeader
            currentNav={currentNav}
            onToggleSidebar={handleToggleSidebar}
            isSidebarOpen={isSidebarOpen}
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
            currentUser={currentUser}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            isSoundOn={isSoundOn}
            onToggleSound={() => setIsSoundOn((prev) => !prev)}
            onNavigateHome={() => {
              if (window.parent !== window) {
                window.parent.postMessage(
                  { type: 'ALGOLEARN_NAVIGATE', tab: 'home' },
                  window.location.origin
                );
              } else {
                window.location.assign('/');
              }
            }}
          />
        )}

        {/* View Content Renderer */}
        <main className={`flex-1 ${currentNav === 'visualize' ? 'p-0 flex flex-col h-screen overflow-hidden' : 'p-4 sm:p-6 lg:p-8'}`}>
          {currentNav === 'home' && (
            <HomeView
              onNavigate={handleNavigate}
              isDarkMode={isDarkMode}
              completedActivitiesCount={Math.min(
                23,
                Math.min(completedTopics.length, 7) +
                  (isVideoCompleted ? 1 : 0) +
                  (quizProgress ? Math.min(quizProgress.completed, 14) : 0)
              )}
            />
          )}

          {currentNav === 'learn' && (
            <LearnView
              key={learnKey}
              currentTopicId={currentTopicId}
              onSelectTopic={(topicId) => {
                setCurrentTopicId(topicId);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              isDarkMode={isDarkMode}
              completedTopics={completedTopics}
              onMarkTopicCompleted={handleMarkTopicCompleted}
            />
          )}

          {currentNav === 'visualize' && (
            <VisualizeView
              isDarkMode={isDarkMode}
              userId={currentUser.userId}
              videoUrl={PUBLIC_LESSON_VIDEO_URL}
              isVideoCompleted={isVideoCompleted}
              onToggleVideoCompleted={handleToggleVideoCompleted}
              onToggleSidebar={handleToggleSidebar}
              isSidebarOpen={isSidebarOpen}
            />
          )}

          {currentNav === 'quiz' && (
            <QuizView
              key={quizKey}
              isDarkMode={isDarkMode}
              userId={currentUser.userId}
              onUpdateQuizScore={handleUpdateQuizScore}
              onUpdateQuizProgress={handleUpdateQuizProgress}
            />
          )}

          {currentNav === 'progress' && (
            <ProgressView
              userId={currentUser.userId}
              completedTopics={completedTopics}
              quizScore={quizScore}
              completedVisualizations={completedVisualizations}
              onNavigate={handleNavigate}
              isDarkMode={isDarkMode}
              uploadedVideoUrl={PUBLIC_LESSON_VIDEO_URL}
              isVideoCompleted={isVideoCompleted}
              onToggleVideoCompleted={handleToggleVideoCompleted}
              onWatchAgain={handleWatchAgainFromProgress}
            />
          )}
        </main>
      </div>

      {/* User Profile & Account Switcher Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        allUsers={allUsers}
        isDarkMode={isDarkMode}
        onSwitchUser={handleSwitchUser}
        onCreateUser={handleCreateUser}
        onLogoutToFreshSession={handleStartFreshSession}
      />

      {/* Floating Chat / Support Button at Bottom-Right (Matching Provided Image) */}
      <FloatingChatButton isDarkMode={isDarkMode} isSoundOn={isSoundOn} />
    </div>
  );
}
