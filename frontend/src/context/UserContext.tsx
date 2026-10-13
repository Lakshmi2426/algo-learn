import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { UserProfile, AchievementBadge, StudentProgressRecord, UserRole } from '../types';
import { TEACHERS } from '../data/teachersData';
import {
  syncUserProfileWithTopicProgress,
  setTopicScore,
  getAllTopicsProgress,
  restoreStudentModuleKeys,
  clearActiveModuleKeys,
  snapshotActiveModuleKeys,
  getActiveStudentKey,
} from '../utils/topicProgress';
import { apiUrl } from '../config/api';
import { navigateAlgoLearn } from '../utils/navigation';

export const INITIAL_STUDENTS: StudentProgressRecord[] = [];

interface UserContextType {
  user: UserProfile;
  role: UserRole;
  isAuthenticated: boolean;
  studentsList: StudentProgressRecord[];
  addXP: (amount: number, reason?: string) => void;
  markTopicProgress: (topicId: string, progress: number) => void;
  solveProblem: (problemName: string, xpReward?: number) => void;
  login: (regdNo: string, password: string) => Promise<{ success: boolean; message?: string; notFound?: boolean }>;
  registerStudent: (data: {
    name: string;
    branch: string;
    regdNo: string;
    password?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  isRegdNoTaken: (regdNo: string) => boolean;
  loginAsAdmin: (name: string, adminCode: string) => Promise<{ success: boolean; message?: string; role?: string }>;
  logout: () => Promise<void> | void;
  recoverSession: (regdNo: string, password: string) => Promise<{ success: boolean; message?: string }>;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authModalMode: 'login' | 'signup' | 'admin';
  setAuthModalMode: (mode: 'login' | 'signup' | 'admin') => void;
  triggerConfetti: () => void;
}

const initialBadges: AchievementBadge[] = [
  {
    id: 'first-step',
    name: 'First Step',
    description: 'Began your DSA journey on AlgoLearn',
    icon: '🚀',
    unlocked: false,
    rarity: 'Common',
  },
  {
    id: 'array-architect',
    name: 'Array Architect',
    description: 'Mastered 2-Pointer & Sliding Window techniques',
    icon: '🧱',
    unlocked: false,
    rarity: 'Rare',
  },
  {
    id: 'tree-whisperer',
    name: 'Tree Whisperer',
    description: 'Solved all Binary Tree & BST traversals',
    icon: '🌲',
    unlocked: false,
    rarity: 'Epic',
  },
  {
    id: 'graph-navigator',
    name: 'Graph Navigator',
    description: 'Conquered Dijkstra & Topological Sort algorithms',
    icon: '🕸️',
    unlocked: false,
    rarity: 'Epic',
  },
  {
    id: 'speed-sorter',
    name: 'Speed Sorter',
    description: 'Won 5 algorithm race battles in the Arcade',
    icon: '⚡',
    unlocked: false,
    rarity: 'Rare',
  },
  {
    id: 'streak-champion',
    name: 'Streak Champion',
    description: 'Maintained a 7-day consecutive practice streak',
    icon: '🔥',
    unlocked: false,
    rarity: 'Legendary',
  },
];

const defaultUser: UserProfile = {
  id: '',
  name: 'Guest Learner',
  username: 'guest_user',
  email: '',
  avatar: '',
  xp: 0,
  level: 1,
  streak: 0,
  problemsSolved: 0,
  topicsMastered: 0,
  weeklyGoalMinutes: 180,
  weeklyProgressMinutes: 0,
  joinedDate: 'Today',
  badges: [],
  recentActivity: [],
  exploredTopics: [],
};

export const isRealStudent = (s: any): boolean => {
  if (!s || typeof s !== 'object') return false;

  const mockIds = [
    'std-101', 'std-102', 'std-103', 'std-104', 'std-105', 'std-106',
    'usr-9428', 'usr-101', 'usr-102', 'usr-103', 'usr-104', 'usr-105'
  ];
  if (s.id && mockIds.includes(s.id)) return false;

  const mockEmails = [
    'alex.mercer@dev.io',
    'elena.rostova@tech.edu',
    'marcus.v@cloudcorp.org',
    'priya.sharma@algorithmics.in',
    'david.kim@seoulcode.kr',
    'sophia.l@sorbonne.fr',
    'demo@algolearn.edu',
    'sample@algolearn.edu',
    'test@algolearn.edu',
    'liam@fastsort.io',
    'liam.fastsort@gmail.com',
  ];
  if (s.email && mockEmails.includes(s.email.toLowerCase())) return false;

  const mockUsernames = [
    'liam_fast_sort',
    'alex_mercer',
    'elena_rostova',
    'marcus_vance',
  ];
  if (s.username && mockUsernames.includes(s.username.toLowerCase())) return false;

  const mockNames = [
    'Liam O\'Connor',
    'Liam O\'connor',
    'Liam',
    'Alex Mercer',
    'Elena Rostova',
    'Marcus Vance',
    'Priya Sharma',
    'David Kim',
    'Sophia Laurent',
    'Aarav Patel',
    'Sarah Jenkins',
  ];
  if (
    s.name &&
    (mockNames.includes(s.name) ||
      s.name.toLowerCase().includes("o'connor") ||
      s.name.toLowerCase().includes('liam') ||
      s.name.toLowerCase().includes('mercer'))
  ) {
    return false;
  }

  if (!s.name || s.name === 'Guest Learner' || s.name === 'Student') return false;

  return true;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      const isAuth = localStorage.getItem('algolearn_auth') === 'true';
      if (!isAuth) {
        return defaultUser;
      }
      const saved = localStorage.getItem('algolearn_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (
            parsed.id === 'usr-9428' ||
            parsed.name === 'Alex Mercer' ||
            parsed.email === 'alex.mercer@dev.io' ||
            !parsed.email
          ) {
            localStorage.removeItem('algolearn_user');
            localStorage.removeItem('algolearn_auth');
            return defaultUser;
          }
          if (parsed.avatar && parsed.avatar.includes('unsplash.com')) {
            parsed.avatar = '';
          }
          const studentKey = (parsed.regdNo || parsed.id || parsed.email || '').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
          if (studentKey) {
            restoreStudentModuleKeys(studentKey);
          }
          return syncUserProfileWithTopicProgress(parsed);
        } catch (e) {
          console.error(e);
        }
      }
      return defaultUser;
    }
    return defaultUser;
  });

  const [role, setRole] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('algolearn_role');
      if (savedRole === 'admin' || savedRole === 'student' || savedRole === 'teacher') {
        return savedRole as UserRole;
      }
    }
    return 'student';
  });

  const [registeredStudents, setRegisteredStudents] = useState<StudentProgressRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('algolearn_registered_students');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const clean = parsed.filter(isRealStudent);
            localStorage.setItem('algolearn_registered_students', JSON.stringify(clean));
            return clean;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    return INITIAL_STUDENTS;
  });

  // Sync registered students from server API on mount
  useEffect(() => {
    fetch(apiUrl('/api/students'))
      .then((res) => {
        if (!res.ok) throw new Error('API not available');
        return res.json();
      })
      .then((data) => {
        if (data?.students && Array.isArray(data.students)) {
          const cleanServerStudents = data.students.filter(isRealStudent);
          const activeKey = getActiveStudentKey();
          const allProg = getAllTopicsProgress(activeKey || undefined);

          const formatted: StudentProgressRecord[] = cleanServerStudents.map((s: any) => {
            const sKey = (s.regdNo || s.id || '').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
            const isCurrent = Boolean(activeKey && sKey === activeKey);

            if (isCurrent && s.progress && typeof s.progress === 'object') {
              Object.entries(s.progress).forEach(([tKey, scoreVal]) => {
                const num = Number(scoreVal);
                if (!isNaN(num) && num > 0) {
                  const curScore = getTopicScore(tKey, activeKey);
                  if (num > curScore) {
                    setTopicScore(tKey, num, activeKey);
                  }
                }
              });
            }

            const userXp = isCurrent ? Math.max(s.xp || 0, allProg.totalXP) : (s.xp || 0);
            const userMastered = isCurrent ? Math.max(s.topicsCompleted || 0, allProg.topicsMasteredCount) : (s.topicsCompleted || 0);
            const userStarted = isCurrent ? Math.max(s.topicsStarted || 0, allProg.topicsStartedCount) : (s.topicsStarted || 0);
            const userProgress = isCurrent ? Math.max(s.overallProgress || 0, allProg.overallPercentage) : (s.overallProgress || 0);

            return {
              id: s.id || s._id,
              name: s.name,
              email: s.email || `${(s.regdNo || '').toLowerCase()}@algolearn.edu`,
              avatar: s.avatar || '',
              regdNo: s.regdNo,
              branch: s.branch,
              topicsStarted: userStarted,
              topicsCompleted: userMastered,
              overallProgress: userProgress,
              lastActive: s.lastActive || 'Just now',
              streak: 1,
              currentStage: s.currentStage || 'Phase 1: Foundations',
              xp: userXp,
              exploredTopics: s.exploredTopics || [],
              recentActivities: s.recentActivities || [],
            };
          });

          setRegisteredStudents(formatted);
          if (typeof window !== 'undefined') {
            localStorage.setItem('algolearn_registered_students', JSON.stringify(formatted));
          }
        }
      })
      .catch(() => {
        // Fallback to local storage
      });
  }, []);

  // Issue 13: Verify active session against backend (every 10s & on focus)
  // If student logs in on another device (Device B), Device A's session is invalidated on server.
  // When Device A verifies its session, it receives 401 with sessionRevoked and logs out automatically.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isVerifying = false;
    const verifySession = () => {
      const token = localStorage.getItem('algolearn_token');
      const isAuth = localStorage.getItem('algolearn_auth') === 'true';
      if (!isAuth || !token || isVerifying) return;

      isVerifying = true;
      fetch(apiUrl('/api/auth/me'), {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
        .then((res) => {
          if (!res.ok) {
            if (res.status === 401 || res.status === 404) {
              logout();
            }
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (data?.student) {
            const student = data.student;
            const studentKey = student.regdNo.toLowerCase();
            restoreStudentModuleKeys(studentKey);

            if (student.progress && typeof student.progress === 'object') {
              Object.entries(student.progress).forEach(([tKey, scoreVal]) => {
                const num = Number(scoreVal);
                if (!isNaN(num) && num > 0) {
                  const cur = getTopicScore(tKey, studentKey);
                  if (num > cur) {
                    setTopicScore(tKey, num, studentKey);
                  }
                }
              });
            }

            const latestProg = getAllTopicsProgress(studentKey);

            setUser((prev) => {
              const updated = {
                ...prev,
                id: student._id || student.id,
                name: student.name,
                branch: student.branch,
                regdNo: student.regdNo,
                xp: Math.max(prev.xp || 0, student.xp || 0, latestProg.totalXP),
                topicsMastered: Math.max(prev.topicsMastered || 0, student.topicsCompleted || 0, latestProg.topicsMasteredCount),
              };
              const synced = syncUserProfileWithTopicProgress(updated);
              try {
                localStorage.setItem('algolearn_user', JSON.stringify(synced));
              } catch {}
              return synced;
            });
          }
        })
        .catch(() => {})
        .finally(() => {
          isVerifying = false;
        });
    };

    // Initial check on mount
    verifySession();

    // Check periodically every 10 seconds
    const intervalId = setInterval(verifySession, 10000);

    // Check immediately when window regains focus
    window.addEventListener('focus', verifySession);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', verifySession);
    };
  }, []);

  // Save registered students whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('algolearn_registered_students', JSON.stringify(registeredStudents));
    }
  }, [registeredStudents]);

  const userRef = React.useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Synchronize user profile & students with real-time topic progress
  useEffect(() => {
    let syncTimeout: any = null;

    const handleProgressChange = () => {
      const activeKey = getActiveStudentKey() || (userRef.current?.regdNo ? userRef.current.regdNo.toLowerCase() : undefined);
      const allProg = getAllTopicsProgress(activeKey);

      setUser((prev) => {
        const synced = syncUserProfileWithTopicProgress(prev);
        if (synced.regdNo || (synced.name && synced.name !== 'Guest Learner')) {
          try {
            localStorage.setItem('algolearn_user', JSON.stringify(synced));
          } catch {}

          if (syncTimeout) clearTimeout(syncTimeout);
          syncTimeout = setTimeout(() => {
            const payload = {
              studentName: synced.name,
              regdNo: synced.regdNo,
              xp: Math.max(synced.xp || 0, allProg.totalXP),
              progress: allProg.topicScores,
              topicsCompleted: Math.max(synced.topicsMastered || 0, allProg.topicsMasteredCount),
              topicsStarted: allProg.topicsStartedCount,
              overallProgress: allProg.overallPercentage,
            };

            const token = localStorage.getItem('algolearn_token');
            const authHeaders: Record<string, string> = {
              'Content-Type': 'application/json',
            };
            if (token) {
              authHeaders['Authorization'] = `Bearer ${token}`;
            }

            fetch(apiUrl('/api/leaderboard/sync'), {
              method: 'POST',
              headers: authHeaders,
              credentials: 'include',
              body: JSON.stringify(payload),
            }).catch(() => {});

            if (synced.regdNo) {
              fetch(apiUrl(`/api/students/${encodeURIComponent(synced.regdNo)}/progress`), {
                method: 'PUT',
                headers: authHeaders,
                credentials: 'include',
                body: JSON.stringify(payload),
              }).catch(() => {});
            }
          }, 300);
        }
        return synced;
      });

      const currentUser = userRef.current;
      setRegisteredStudents((prevList) => {
        const nextList = prevList.map((s) => {
          if (
            (currentUser.regdNo && s.regdNo?.toUpperCase() === currentUser.regdNo?.toUpperCase()) ||
            (currentUser.email && s.email.toLowerCase() === currentUser.email.toLowerCase()) ||
            (currentUser.name && s.name.toLowerCase() === currentUser.name.toLowerCase())
          ) {
            return {
              ...s,
              xp: Math.max(s.xp || 0, allProg.totalXP),
              topicsCompleted: Math.max(s.topicsCompleted || 0, allProg.topicsMasteredCount),
              topicsStarted: Math.max(s.topicsStarted || 0, allProg.topicsStartedCount),
              overallProgress: Math.max(s.overallProgress || 0, allProg.overallPercentage),
              lastActive: 'Just now',
            };
          }
          return s;
        });
        try {
          localStorage.setItem('algolearn_registered_students', JSON.stringify(nextList));
        } catch {}
        return nextList;
      });
    };

    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object' && event.data.type === 'ALGOLEARN_TOPIC_PROGRESS_UPDATE') {
        const { moduleId, score } = event.data;
        if (moduleId && typeof score === 'number') {
          setTopicScore(moduleId, score);
          handleProgressChange();
        }
      }
    };

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key && (event.key.startsWith('algolearn_topic') || event.key.startsWith('algolearn_topics'))) {
        handleProgressChange();
      }
    };

    window.addEventListener('algolearn_topic_progress_updated', handleProgressChange);
    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('message', handleWindowMessage);

    return () => {
      if (syncTimeout) clearTimeout(syncTimeout);
      window.removeEventListener('algolearn_topic_progress_updated', handleProgressChange);
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('message', handleWindowMessage);
    };
  }, []);

  // Fresh visitor must be logged out unless explicit valid session exists
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('algolearn_auth') === 'true';
    }
    return false;
  });

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'admin'>('login');

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('algolearn_auth', 'true');
      localStorage.setItem('algolearn_user', JSON.stringify(user));
      localStorage.setItem('algolearn_role', role);
    } else {
      localStorage.removeItem('algolearn_auth');
    }
  }, [isAuthenticated, user, role]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#2563eb', '#3b82f6', '#60a5fa', '#1d4ed8', '#93c5fd'],
      });
    } catch (e) {
      // safe fallback
    }
  };

  const addXP = (amount: number, reason?: string) => {
    setUser((prev) => {
      const newXp = prev.xp + amount;
      const newLevel = Math.floor(newXp / 350) + 1;
      const leveledUp = newLevel > prev.level;

      if (leveledUp) {
        triggerConfetti();
      }

      const updatedBadges = (prev.badges.length > 0 ? prev.badges : initialBadges).map((b) => {
        if (b.id === 'first-step' && newXp > 0 && !b.unlocked) {
          return { ...b, unlocked: true, unlockedAt: 'Just now' };
        }
        if (b.id === 'streak-champion' && prev.streak >= 7 && !b.unlocked) {
          return { ...b, unlocked: true, unlockedAt: 'Just now' };
        }
        return b;
      });

      const newActivity = reason
        ? [
            {
              id: 'act-' + Date.now(),
              action: leveledUp ? 'Leveled Up!' : 'Earned XP',
              target: reason,
              xpEarned: amount,
              timestamp: 'Just now',
            },
            ...prev.recentActivity.slice(0, 7),
          ]
        : prev.recentActivity;

      const updatedUser = {
        ...prev,
        xp: newXp,
        level: newLevel,
        badges: updatedBadges,
        recentActivity: newActivity,
      };

      if (updatedUser.regdNo || (updatedUser.name && updatedUser.name !== 'Guest Learner')) {
        fetch(apiUrl('/api/leaderboard/sync'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: updatedUser.name,
            regdNo: updatedUser.regdNo,
            xp: newXp,
          }),
        }).catch(() => {});

        setRegisteredStudents((prevList) => {
          return prevList.map((s) => {
            if (
              (updatedUser.regdNo && s.regdNo === updatedUser.regdNo) ||
              (updatedUser.email && s.email.toLowerCase() === updatedUser.email.toLowerCase()) ||
              (updatedUser.name && s.name.toLowerCase() === updatedUser.name.toLowerCase())
            ) {
              return {
                ...s,
                xp: newXp,
                streak: updatedUser.streak,
                topicsCompleted: updatedUser.topicsMastered || s.topicsCompleted,
                overallProgress: Math.min(100, Math.round(((updatedUser.topicsMastered || s.topicsCompleted) / 18) * 100)),
                lastActive: 'Just now',
              };
            }
            return s;
          });
        });
      }

      return updatedUser;
    });
  };

  const markTopicProgress = (topicId: string, progress: number) => {
    setTopicScore(topicId, progress);
    setUser((prev) => syncUserProfileWithTopicProgress(prev));
  };

  const solveProblem = (problemName: string, xpReward = 120) => {
    setUser((prev) => ({
      ...prev,
      problemsSolved: prev.problemsSolved + 1,
    }));
    addXP(xpReward, `Solved: ${problemName}`);
    triggerConfetti();
  };

  const isRegdNoTaken = (regdNo: string): boolean => {
    const trimmed = regdNo.trim().toUpperCase();
    if (!trimmed) return false;
    return registeredStudents.some(
      (s) => s.regdNo && s.regdNo.toUpperCase() === trimmed
    );
  };

  const login = async (
    regdNoInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; message?: string; notFound?: boolean }> => {
    const cleanRegdNo = (regdNoInput || '').trim().toUpperCase();

    if (!cleanRegdNo) {
      return { success: false, message: 'Registration Number is required.' };
    }

    if (!/^[A-Z0-9]{10}$/.test(cleanRegdNo) || cleanRegdNo.length !== 10) {
      return {
        success: false,
        message: 'Registration Number must be exactly 10 uppercase characters (letters and digits).',
      };
    }

    if (!passwordInput || !passwordInput.trim()) {
      return { success: false, message: 'Password is required.' };
    }

    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          regdNo: cleanRegdNo,
          password: passwordInput.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        return {
          success: false,
          notFound: data?.notFound || res.status === 404,
          message:
            data?.error ||
            (res.status === 409
              ? 'This account is already logged in on another session. Please sign out from the active session before logging in again.'
              : 'Invalid credentials. Please check your password.'),
        };
      }

      if (data?.success && data?.student) {
        const student = data.student;
        const studentKey = student.regdNo.toLowerCase();

        if (typeof window !== 'undefined') {
          localStorage.setItem('algolearn_auth', 'true');
          localStorage.setItem('algolearn_token', data.token);
          localStorage.setItem('algolearn_role', 'student');
          localStorage.setItem('dsa_user_email', `${student.regdNo.toLowerCase()}@algolearn.edu`);
          localStorage.setItem('current_user', `${student.regdNo.toLowerCase()}@algolearn.edu`);
          restoreStudentModuleKeys(studentKey);
        }

        if (student.progress && typeof student.progress === 'object') {
          Object.entries(student.progress).forEach(([tKey, scoreVal]) => {
            const num = Number(scoreVal);
            if (!isNaN(num) && num > 0) {
              setTopicScore(tKey, num, studentKey);
            }
          });
        }

        setIsAuthenticated(true);
        setRole('student');

        const updatedUser = syncUserProfileWithTopicProgress({
          ...defaultUser,
          id: student.id,
          name: student.name,
          branch: student.branch,
          regdNo: student.regdNo,
          username: student.regdNo.toLowerCase(),
          email: `${student.regdNo.toLowerCase()}@algolearn.edu`,
          xp: student.xp || 0,
        });

        setUser(updatedUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('algolearn_user', JSON.stringify(updatedUser));
        }

        // Sync leaderboard if needed
        if (student.regdNo) {
          const allProg = getAllTopicsProgress(studentKey);
          fetch(apiUrl('/api/leaderboard/sync'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentName: student.name,
              regdNo: student.regdNo,
              xp: allProg.totalXP || student.xp || 0,
            }),
          }).catch(() => {});
        }

        setShowAuthModal(false);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('algolearn_topic_progress_updated'));
          const pendingMod =
            sessionStorage.getItem('algolearn_pending_module') ||
            sessionStorage.getItem('algolearn_pending_module_hash');
          if (pendingMod) {
            sessionStorage.removeItem('algolearn_pending_module');
            sessionStorage.removeItem('algolearn_pending_module_hash');
            const modId = pendingMod.replace(/^.*topics[\/#]+/i, '').trim().toLowerCase();
            setTimeout(() => {
              navigateAlgoLearn('topics', modId || pendingMod);
            }, 50);
          }
        }

        return { success: true };
      }

      return { success: false, message: 'Invalid response from server.' };
    } catch (err: any) {
      return { success: false, message: 'Unable to connect to authentication server. Please try again.' };
    }
  };

  const registerStudent = async (data: {
    name: string;
    branch: string;
    regdNo: string;
    password?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    const cleanName = (data.name || '').trim();
    if (!cleanName) {
      return { success: false, message: 'Name is required.' };
    }

    const cleanBranch = (data.branch || '').trim();
    if (!cleanBranch) {
      return { success: false, message: 'Branch is required (e.g. 3/4-CSD-A).' };
    }

    const cleanRegdNo = (data.regdNo || '').trim().toUpperCase();
    if (!cleanRegdNo) {
      return {
        success: false,
        message: 'Registration Number is required.',
      };
    }

    if (!/^[A-Z0-9]{10}$/.test(cleanRegdNo) || cleanRegdNo.length !== 10) {
      return {
        success: false,
        message: 'Registration Number must contain exactly 10 characters consisting only of uppercase letters (A–Z) and digits (0–9).',
      };
    }

    // Use provided password or fallback to registration number if empty
    const initialPassword = (data.password && data.password.trim()) ? data.password.trim() : cleanRegdNo;

    try {
      const res = await fetch(apiUrl('/api/auth/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: cleanName,
          branch: cleanBranch,
          regdNo: cleanRegdNo,
          password: initialPassword,
        }),
      });

      const resData = await res.json().catch(() => null);

      if (!res.ok) {
        return {
          success: false,
          message: resData?.error || 'Registration failed.',
        };
      }

      if (resData?.success && resData?.student) {
        const student = resData.student;
        const studentKey = student.regdNo.toLowerCase();

        // Newly registered student starts with ZERO progress and ZERO earned points
        if (typeof window !== 'undefined') {
          clearActiveModuleKeys();
          localStorage.setItem(
            `algolearn_student_progress_${studentKey}`,
            JSON.stringify({
              topicScores: {},
              moduleKeys: {},
              xp: 0,
            })
          );
          localStorage.setItem('algolearn_auth', 'true');
          localStorage.setItem('algolearn_token', resData.token);
          localStorage.setItem('algolearn_role', 'student');
          localStorage.setItem('dsa_user_email', `${student.regdNo.toLowerCase()}@algolearn.edu`);
          localStorage.setItem('current_user', `${student.regdNo.toLowerCase()}@algolearn.edu`);
        }

        setIsAuthenticated(true);
        setRole('student');

        const newUser = syncUserProfileWithTopicProgress({
          ...defaultUser,
          id: student.id,
          name: student.name,
          branch: student.branch,
          regdNo: student.regdNo,
          username: student.regdNo.toLowerCase(),
          email: `${student.regdNo.toLowerCase()}@algolearn.edu`,
          xp: 0,
        });

        setUser(newUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('algolearn_user', JSON.stringify(newUser));
        }

        // Add to active students list
        const newRecord: StudentProgressRecord = {
          id: student.id,
          name: student.name,
          branch: student.branch,
          email: `${student.regdNo.toLowerCase()}@algolearn.edu`,
          avatar: '',
          regdNo: student.regdNo,
          topicsStarted: 0,
          topicsCompleted: 0,
          overallProgress: 0,
          lastActive: 'Just now',
          streak: 1,
          currentStage: 'Phase 1: Foundations',
          exploredTopics: [],
          xp: 0,
          recentActivities: [
            {
              id: 'act-' + Date.now(),
              title: 'Registered on AlgoLearn',
              type: 'concept_read',
              timestamp: 'Just now',
            },
          ],
        };
        setRegisteredStudents((prev) => [newRecord, ...prev]);

        setShowAuthModal(false);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('algolearn_topic_progress_updated'));
          const pendingMod =
            sessionStorage.getItem('algolearn_pending_module') ||
            sessionStorage.getItem('algolearn_pending_module_hash');
          if (pendingMod) {
            sessionStorage.removeItem('algolearn_pending_module');
            sessionStorage.removeItem('algolearn_pending_module_hash');
            const modId = pendingMod.replace(/^.*topics[\/#]+/i, '').trim().toLowerCase();
            setTimeout(() => {
              navigateAlgoLearn('topics', modId || pendingMod);
            }, 50);
          }
        }

        return { success: true };
      }

      return { success: false, message: 'Unexpected server response.' };
    } catch (err: any) {
      return { success: false, message: 'Network error connecting to backend.' };
    }
  };

  const loginAsAdmin = async (
    nameInput: string,
    adminCodeInput: string
  ): Promise<{ success: boolean; message?: string; role?: string }> => {
    const cleanName = (nameInput || '').trim();
    const cleanCode = (adminCodeInput || '').trim();

    if (!cleanName) {
      return { success: false, message: 'Administrator Name is required.' };
    }

    if (!cleanCode) {
      return { success: false, message: 'Admin Access Code is required.' };
    }

    try {
      const res = await fetch(apiUrl('/api/auth/admin-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          adminCode: cleanCode,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        return {
          success: false,
          message: data?.error || 'Invalid administrator access code. Access denied.',
        };
      }

      if (data?.success && data?.user) {
        const userRole = (data.user.role === 'teacher' ? 'teacher' : 'admin') as UserRole;
        if (typeof window !== 'undefined') {
          localStorage.setItem('algolearn_auth', 'true');
          localStorage.setItem('algolearn_token', data.token);
          localStorage.setItem('algolearn_role', userRole);
        }

        setIsAuthenticated(true);
        setRole(userRole);

        const authenticatedProfile: UserProfile = {
          ...defaultUser,
          id: data.user.id,
          name: data.user.name,
          email: data.user.email || `${cleanName.toLowerCase().replace(/\s+/g, '.')}@algolearn.edu`,
          username: cleanName.toLowerCase().replace(/\s+/g, '_'),
        };

        setUser(authenticatedProfile);
        if (typeof window !== 'undefined') {
          localStorage.setItem('algolearn_user', JSON.stringify(authenticatedProfile));
        }

        setShowAuthModal(false);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('algolearn_topic_progress_updated'));
        }
        return { success: true, role: userRole };
      }

      return { success: false, message: 'Invalid admin verification response.' };
    } catch (err: any) {
      return { success: false, message: 'Network error connecting to admin authentication service.' };
    }
  };

  const logout = async () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('algolearn_token');
      const currentKey = getActiveStudentKey();
      try {
        await fetch(apiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ regdNo: user?.regdNo || currentKey }),
          credentials: 'include',
        });
      } catch (e) {
        console.error('Logout error:', e);
      }

      if (currentKey) {
        // Snapshot current student's progress before logout
        const snap = snapshotActiveModuleKeys();
        const existingRaw = localStorage.getItem(`algolearn_student_progress_${currentKey}`);
        let existing: any = {};
        try { if (existingRaw) existing = JSON.parse(existingRaw); } catch {}
        existing.moduleKeys = snap;
        localStorage.setItem(`algolearn_student_progress_${currentKey}`, JSON.stringify(existing));
      }

      clearActiveModuleKeys();
      localStorage.removeItem('algolearn_auth');
      localStorage.removeItem('algolearn_token');
      localStorage.removeItem('algolearn_role');
      localStorage.removeItem('algolearn_user');
      localStorage.removeItem('dsa_user_email');
      localStorage.removeItem('current_user');

      // Clear Ask a Teacher chat history from local storage on logout for student privacy
      localStorage.removeItem('algolearn_student_questions');
      if (user?.id) {
        localStorage.removeItem(`algolearn_student_questions_${user.id}`);
      }

      window.dispatchEvent(new CustomEvent('algolearn_topic_progress_updated'));
      window.dispatchEvent(new CustomEvent('algolearn_student_logged_out'));
    }

    setIsAuthenticated(false);
    setRole('student');
    setUser(defaultUser);
    setAuthModalMode('login');
  };

  const recoverSession = async (
    regdNoInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanRegdNo = (regdNoInput || '').trim().toUpperCase();
    if (!cleanRegdNo || !passwordInput) {
      return { success: false, message: 'Registration Number and Password are required.' };
    }

    try {
      const res = await fetch(apiUrl('/api/auth/recover-session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ regdNo: cleanRegdNo, password: passwordInput.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        return { success: false, message: data?.error || 'Failed to release active session.' };
      }
      return {
        success: true,
        message: data?.message || 'Previous active session released successfully. You may now log in.',
      };
    } catch {
      return { success: false, message: 'Network error connecting to authentication server.' };
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        studentsList: registeredStudents,
        addXP,
        markTopicProgress,
        solveProblem,
        login,
        registerStudent,
        isRegdNoTaken,
        loginAsAdmin,
        logout,
        recoverSession,
        showAuthModal,
        setShowAuthModal,
        authModalMode,
        setAuthModalMode,
        triggerConfetti,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
