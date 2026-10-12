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
  loginAsAdmin: (name: string, adminCode: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
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
      if (savedRole === 'admin' || savedRole === 'student') {
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
            const clean = parsed
              .filter(isRealStudent)
              .filter((s) => {
                const r = (s.regdNo || '').toLowerCase();
                return (
                  !r.includes('test') &&
                  !s.name?.startsWith('Student Valid') &&
                  r !== '123sdfgd6t' &&
                  r !== '123sdfgbhj' &&
                  r !== '23sd56e678' &&
                  r !== '24b91a6239'
                );
              });
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
    fetch('/api/students')
      .then((res) => {
        if (!res.ok) throw new Error('API not available');
        return res.json();
      })
      .then((data) => {
        if (data?.students && Array.isArray(data.students)) {
          const cleanServerStudents = data.students.filter(isRealStudent);
          const activeKey = getActiveStudentKey();
          const allProg = getAllTopicsProgress();

          const formatted: StudentProgressRecord[] = cleanServerStudents.map((s: any) => {
            const sKey = (s.regdNo || s.id || '').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
            const isCurrent = Boolean(activeKey && sKey === activeKey);
            return {
              id: s.id || s._id,
              name: s.name,
              email: s.email || `${(s.regdNo || '').toLowerCase()}@algolearn.edu`,
              avatar: s.avatar || '',
              regdNo: s.regdNo,
              branch: s.branch,
              topicsStarted: isCurrent ? allProg.topicsStartedCount : (s.topicsStarted || 0),
              topicsCompleted: isCurrent ? allProg.topicsMasteredCount : (s.topicsCompleted || 0),
              overallProgress: isCurrent ? allProg.overallPercentage : (s.overallProgress || 0),
              lastActive: s.lastActive || 'Just now',
              streak: 1,
              currentStage: s.currentStage || 'Phase 1: Foundations',
              xp: isCurrent ? allProg.totalXP : (s.xp || 0),
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

  // Verify authenticated session against backend on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('algolearn_token');
    const isAuth = localStorage.getItem('algolearn_auth') === 'true';
    if (isAuth && token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
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
            setUser((prev) => ({
              ...prev,
              id: student._id || student.id,
              name: student.name,
              branch: student.branch,
              regdNo: student.regdNo,
              xp: student.xp || 0,
            }));
          }
        })
        .catch(() => {});
    }
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
      const allProg = getAllTopicsProgress();

      setUser((prev) => {
        const synced = syncUserProfileWithTopicProgress(prev);
        if (synced.regdNo || (synced.name && synced.name !== 'Guest Learner')) {
          if (syncTimeout) clearTimeout(syncTimeout);
          syncTimeout = setTimeout(() => {
            const payload = {
              studentName: synced.name,
              regdNo: synced.regdNo,
              xp: allProg.totalXP,
              topicsCompleted: allProg.topicsMasteredCount,
              topicsStarted: allProg.topicsStartedCount,
              overallProgress: allProg.overallPercentage,
            };

            fetch('/api/leaderboard/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            }).catch(() => {});

            if (synced.regdNo) {
              fetch(`/api/students/${encodeURIComponent(synced.regdNo)}/progress`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              }).catch(() => {});
            }
          }, 300);
        }
        return synced;
      });

      const currentUser = userRef.current;
      setRegisteredStudents((prevList) => {
        return prevList.map((s) => {
          if (
            (currentUser.regdNo && s.regdNo?.toUpperCase() === currentUser.regdNo?.toUpperCase()) ||
            (currentUser.email && s.email.toLowerCase() === currentUser.email.toLowerCase()) ||
            (currentUser.name && s.name.toLowerCase() === currentUser.name.toLowerCase())
          ) {
            return {
              ...s,
              xp: allProg.totalXP,
              topicsCompleted: allProg.topicsMasteredCount,
              topicsStarted: allProg.topicsStartedCount,
              overallProgress: allProg.overallPercentage,
              lastActive: 'Just now',
            };
          }
          return s;
        });
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
        fetch('/api/leaderboard/sync', {
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          message: data?.error || 'Account not found. Please sign up first.',
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
          fetch('/api/leaderboard/sync', {
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
          const pendingHash = sessionStorage.getItem('algolearn_pending_module_hash');
          if (pendingHash) {
            sessionStorage.removeItem('algolearn_pending_module_hash');
            setTimeout(() => {
              window.location.hash = pendingHash;
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

    // Password equals registration number
    const initialPassword = cleanRegdNo;

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          const pendingHash = sessionStorage.getItem('algolearn_pending_module_hash');
          if (pendingHash) {
            sessionStorage.removeItem('algolearn_pending_module_hash');
            setTimeout(() => {
              window.location.hash = pendingHash;
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
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanName = (nameInput || '').trim();
    const cleanCode = (adminCodeInput || '').trim();

    if (!cleanName) {
      return { success: false, message: 'Administrator Name is required.' };
    }

    if (!cleanCode) {
      return { success: false, message: 'Admin Access Code is required.' };
    }

    try {
      const res = await fetch('/api/auth/admin-login', {
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
        if (typeof window !== 'undefined') {
          localStorage.setItem('algolearn_auth', 'true');
          localStorage.setItem('algolearn_token', data.token);
          localStorage.setItem('algolearn_role', 'admin');
        }

        setIsAuthenticated(true);
        setRole('admin');

        const adminUser: UserProfile = {
          ...defaultUser,
          id: data.user.id,
          name: data.user.name,
          email: data.user.email || `${cleanName.toLowerCase().replace(/\s+/g, '.')}@algolearn.edu`,
          username: cleanName.toLowerCase().replace(/\s+/g, '_'),
        };

        setUser(adminUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('algolearn_user', JSON.stringify(adminUser));
        }

        setShowAuthModal(false);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('algolearn_topic_progress_updated'));
        }
        return { success: true };
      }

      return { success: false, message: 'Invalid admin verification response.' };
    } catch (err: any) {
      return { success: false, message: 'Network error connecting to admin authentication service.' };
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      const currentKey = getActiveStudentKey();
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

      window.dispatchEvent(new CustomEvent('algolearn_topic_progress_updated'));
    }

    setIsAuthenticated(false);
    setRole('student');
    setUser(defaultUser);
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
