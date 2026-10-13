import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  BookOpen,
  Gamepad2,
  Check,
  Star,
  Layers,
  ChevronRight,
  ListOrdered,
  Trophy,
  Home,
  Clock,
  Timer,
  Play,
  AlertCircle,
} from 'lucide-react';
import { progressManager } from '../utils/progressManager';
import { pointsManager } from '../utils/pointsManager';
import { soundManager } from '../utils/audio';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { userManager } from '../utils/userManager';

export interface QuizViewProps {
  onNavigateToTheory: (chapterId?: string) => void;
  onNavigateToQuest: (levelId?: number) => void;
  onNavigateToProgress: () => void;
  onNavigateToHome?: () => void;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  correctAnswerText: string;
  explanation: string;
  exampleSnippet?: string;
  techniqueCode: string;
  targetChapterId?: string;
  targetLevelId?: number;
}

export interface StudentAnswerRecord {
  questionId: number;
  selectedOptionIndex: number;
  selectedAnswerText: string;
  correctOptionIndex: number;
  correctAnswerText: string;
  isCorrect: boolean;
  isTimedOut?: boolean;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: '1. What is hashing in data structures?',
    options: [
      'A sorting algorithm for array elements',
      'A technique to map keys to array indexes for fast O(1) storage and retrieval',
      'A binary tree rebalancing mechanism',
      'A linear sequential search scan',
    ],
    correctIndex: 1,
    correctAnswerText: 'A technique to map keys to array indexes for fast O(1) storage and retrieval',
    explanation:
      'Hashing is a technique used to store and retrieve data quickly in average O(1) constant time by using a mathematical hash function to compute direct memory slot positions.',
    techniqueCode: 'CORE-01',
    targetChapterId: 'what-is-hashing',
  },
  {
    id: 2,
    question: '2. What is the primary role of a hash function?',
    options: [
      'To sort elements in ascending numerical order',
      'To compress data files for network transfer',
      'To calculate the array index where a given key should be stored',
      'To delete duplicate elements from memory',
    ],
    correctIndex: 2,
    correctAnswerText: 'To calculate the array index where a given key should be stored',
    explanation:
      'A hash function calculates the exact numerical index in the hash table where a key should be stored or retrieved using deterministic arithmetic.',
    techniqueCode: 'CORE-02',
    targetChapterId: 'hash-function',
    targetLevelId: 1,
  },
  {
    id: 3,
    question: '3. What is a hash table?',
    options: [
      'An array-based data structure that stores key-value pairs using calculated hash indexes',
      'A database table sorted alphabetically',
      'A singly linked list with pointer traversal',
      'A heap queue used exclusively for scheduling',
    ],
    correctIndex: 0,
    correctAnswerText: 'An array-based data structure that stores key-value pairs using calculated hash indexes',
    explanation:
      'A hash table is a data structure that implements an associative array abstract data type, using a hash function to compute an index into an array of buckets or slots.',
    techniqueCode: 'CORE-03',
    targetChapterId: 'hash-table',
  },
  {
    id: 4,
    question: '4. Using the modulo formula h(key) = key % 10, where will key 25 be stored?',
    options: ['Index 2', 'Index 5', 'Index 10', 'Index 25'],
    correctIndex: 1,
    correctAnswerText: 'Index 5',
    explanation:
      '25 % 10 = 5. Dividing 25 by 10 leaves a remainder of 5, so key 25 maps to table slot index 5.',
    techniqueCode: 'MATH-04',
    targetChapterId: 'hash-function',
    targetLevelId: 1,
  },
  {
    id: 5,
    question: '5. What is a collision in a hash table?',
    options: [
      'When an element is deleted from memory',
      'When the hash table is completely empty',
      'When two different keys produce the exact same hash index',
      'When a search query fails to find a key',
    ],
    correctIndex: 2,
    correctAnswerText: 'When two different keys produce the exact same hash index',
    explanation:
      'A collision occurs when two or more distinct keys evaluate to the exact same table slot when passed through the hash function (e.g. h(k1) == h(k2)).',
    techniqueCode: 'COLLISION-05',
    targetChapterId: 'what-is-a-collision',
  },
  {
    id: 6,
    question: '6. If 23 % 10 = 3 and 33 % 10 = 3, what occurs during insertion of 33?',
    options: [
      'Both keys are automatically deleted',
      'A collision occurs at index 3 and requires a resolution strategy',
      'The table becomes corrupted and throws a fatal error',
      'Key 33 silently overwrites key 23 without warning',
    ],
    correctIndex: 1,
    correctAnswerText: 'A collision occurs at index 3 and requires a resolution strategy',
    explanation:
      'Both 23 % 10 and 33 % 10 evaluate to index 3. Because slot 3 is already occupied when 33 arrives, a collision occurs and must be resolved.',
    techniqueCode: 'COLLISION-06',
    targetChapterId: 'what-is-a-collision',
    targetLevelId: 2,
  },
  {
    id: 7,
    question: '7. Which technique attaches a linked chain to each bucket upon collision?',
    options: [
      'Linear Probing',
      'Quadratic Probing',
      'Separate Chaining',
      'Binary Search',
    ],
    correctIndex: 2,
    correctAnswerText: 'Separate Chaining',
    explanation:
      'Separate Chaining (closed addressing) stores colliding keys in a linked list attached directly to that bucket, e.g., Slot 3: [23] → [33] → [43].',
    exampleSnippet: 'Slot 3: [23] → [33] → [43]',
    techniqueCode: 'CHAIN-07',
    targetChapterId: 'separate-chaining',
    targetLevelId: 2,
  },
  {
    id: 8,
    question: '8. How does Linear Probing resolve a collision at index h?',
    options: [
      'Sequentially checks the next consecutive positions (h+1, h+2, h+3...) mod m',
      'Deletes the existing element in that slot',
      'Creates a binary search tree in memory',
      'Stops the insertion and reports table failure',
    ],
    correctIndex: 0,
    correctAnswerText: 'Sequentially checks the next consecutive positions (h+1, h+2, h+3...) mod m',
    explanation:
      'Linear Probing is an open addressing strategy that sequentially checks consecutive slots: (hash + i) % m for i = 1, 2, 3... until an empty slot is located.',
    techniqueCode: 'PROBE-08',
    targetChapterId: 'linear-probing',
    targetLevelId: 3,
  },
  {
    id: 9,
    question: '9. What jump pattern does Quadratic Probing use to avoid primary clustering?',
    options: [
      'Random pseudo-generated offsets',
      'Squared increments such as 1², 2², 3²...: (hash + i²) mod m',
      'Sequential steps of +1 only',
      'Halving the table index on each step',
    ],
    correctIndex: 1,
    correctAnswerText: 'Squared increments such as 1², 2², 3²...: (hash + i²) mod m',
    explanation:
      'Quadratic Probing uses squared jump offsets (hash + 1², hash + 2², hash + 3²...) % m to spread keys across the table and avoid contiguous clusters.',
    techniqueCode: 'PROBE-09',
    targetChapterId: 'quadratic-probing',
    targetLevelId: 4,
  },
  {
    id: 10,
    question: '10. What is used in Double Hashing to calculate probe steps?',
    options: [
      'Two sorting algorithms',
      'Two linked lists per bucket',
      'A second hash function h2(key) that computes a non-zero jump interval',
      'Two separate hash tables',
    ],
    correctIndex: 2,
    correctAnswerText: 'A second hash function h2(key) that computes a non-zero jump interval',
    explanation:
      'Double Hashing uses two hash functions: h1(key) computes the initial slot index, while h2(key) computes a key-dependent jump interval: index = (h1 + i * h2) % m.',
    techniqueCode: 'PROBE-10',
    targetChapterId: 'double-hashing',
    targetLevelId: 5,
  },
];

export const QuizView: React.FC<QuizViewProps> = ({
  onNavigateToTheory,
  onNavigateToQuest,
  onNavigateToProgress,
  onNavigateToHome,
}) => {
  useScrollReveal();

  const loadAnswersForUser = (userId?: string): Record<number, StudentAnswerRecord> => {
    try {
      const stored = localStorage.getItem(userManager.getQuizAnswersKey(userId));
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return {};
  };

  const loadSubmittedForUser = (userId?: string): boolean => {
    try {
      const pState = progressManager.getState();
      if (!pState.quizSubmitted) {
        return false;
      }
      const storedSub = localStorage.getItem(userManager.getQuizSubmittedKey(userId));
      if (storedSub !== null) {
        return storedSub === 'true';
      }
      return Boolean(pState.quizSubmitted);
    } catch {
      return false;
    }
  };

  const loadQuizStartedForUser = (userId?: string): boolean => {
    try {
      const stored = localStorage.getItem(userManager.getQuizStartedKey(userId));
      if (stored === 'true') return true;
      const ans = loadAnswersForUser(userId);
      if (Object.keys(ans).length > 0) return true;
    } catch {
      // fallback
    }
    return false;
  };

  const loadActiveQuestionIndex = (userId?: string): number => {
    try {
      const storedTimer = localStorage.getItem(userManager.getQuizTimerKey(userId));
      if (storedTimer) {
        const parsed = JSON.parse(storedTimer);
        if (typeof parsed.questionIndex === 'number' && parsed.questionIndex >= 0 && parsed.questionIndex < QUIZ_QUESTIONS.length) {
          return parsed.questionIndex;
        }
      }
    } catch {
      // fallback
    }
    const answers = loadAnswersForUser(userId);
    const firstUnanswered = QUIZ_QUESTIONS.findIndex((q) => answers[q.id] === undefined);
    return firstUnanswered >= 0 ? firstUnanswered : 0;
  };

  // Load persisted student answers for current user
  const [studentAnswers, setStudentAnswers] = useState<Record<number, StudentAnswerRecord>>(() => {
    return loadAnswersForUser();
  });

  const [isSubmitted, setIsSubmitted] = useState<boolean>(() => {
    return loadSubmittedForUser();
  });

  // Navigation within Quiz (0-indexed current question)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(() => {
    return loadActiveQuestionIndex();
  });
  // Temporary selection before confirming/submitting the question
  const [pendingSelection, setPendingSelection] = useState<number | null>(null);

  // Per-question countdown timer (20 seconds per question)
  const QUESTION_TIME_LIMIT = 20;
  const [timeLeft, setTimeLeft] = useState<number>(QUESTION_TIME_LIMIT);
  const [isQuizStarted, setIsQuizStarted] = useState<boolean>(() => {
    return loadQuizStartedForUser();
  });
  const [startQuizWarning, setStartQuizWarning] = useState<string | null>(null);

  // Subscribe to user changes to load user-specific quiz state cleanly
  useEffect(() => {
    const handleUserChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newUserId = customEvent.detail?.id || userManager.getCurrentUserId();
      const freshAnswers = loadAnswersForUser(newUserId);
      const freshSubmitted = loadSubmittedForUser(newUserId);
      const freshStarted = loadQuizStartedForUser(newUserId);
      const freshIndex = loadActiveQuestionIndex(newUserId);

      setStudentAnswers(freshAnswers);
      setIsSubmitted(freshSubmitted);
      setIsQuizStarted(freshStarted);
      setStartQuizWarning(null);
      setCurrentQuestionIndex(freshIndex);
      setPendingSelection(null);
    };

    window.addEventListener('hash_user_changed', handleUserChanged);
    return () => {
      window.removeEventListener('hash_user_changed', handleUserChanged);
    };
  }, []);

  // Subscribe to progressManager for reset synchronization
  useEffect(() => {
    const unsub = progressManager.subscribe((pState) => {
      if (!pState.quizSubmitted && Object.keys(pState.quizScores || {}).length === 0) {
        const currentAns = loadAnswersForUser();
        if (Object.keys(currentAns).length === 0) {
          setStudentAnswers({});
          setIsSubmitted(false);
          setIsQuizStarted(false);
          setPendingSelection(null);
          setCurrentQuestionIndex(0);
          try {
            localStorage.removeItem(userManager.getQuizStartedKey());
            localStorage.removeItem(userManager.getQuizTimerKey());
          } catch {
            // Ignore
          }
        }
      }
    });
    return unsub;
  }, []);

  // Persist isQuizStarted to localStorage
  useEffect(() => {
    try {
      if (isQuizStarted) {
        localStorage.setItem(userManager.getQuizStartedKey(), 'true');
      } else {
        localStorage.removeItem(userManager.getQuizStartedKey());
      }
    } catch {
      // Ignore
    }
  }, [isQuizStarted]);

  // Subscribe to pointsManager for live score display
  const [pointsState, setPointsState] = useState(() => pointsManager.getState());

  useEffect(() => {
    const unsub = pointsManager.subscribe((st) => setPointsState(st));
    return unsub;
  }, []);

  const handleStartQuiz = useCallback(() => {
    setIsQuizStarted(true);
    setStartQuizWarning(null);
    try {
      localStorage.setItem(userManager.getQuizStartedKey(), 'true');
    } catch {
      // Ignore
    }
    soundManager.playClick();
  }, []);

  // Current question helper
  const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex] || QUIZ_QUESTIONS[0];
  const currentAnswerRecord = studentAnswers[currentQuestion.id];
  const isCurrentQuestionAnswered = currentAnswerRecord !== undefined;

  // Handle countdown timer timeout (0 points awarded)
  const handleTimeout = useCallback((qId: number) => {
    const q = QUIZ_QUESTIONS.find((item) => item.id === qId) || currentQuestion;
    const timeoutRecord: StudentAnswerRecord = {
      questionId: q.id,
      selectedOptionIndex: -1,
      selectedAnswerText: 'Timed Out (No Answer)',
      correctOptionIndex: q.correctIndex,
      correctAnswerText: q.correctAnswerText,
      isCorrect: false,
      isTimedOut: true,
    };
    setTimeLeft(0);
    setStudentAnswers((prev) => {
      if (prev[q.id]) return prev;
      return { ...prev, [q.id]: timeoutRecord };
    });
    try {
      localStorage.removeItem(userManager.getQuizTimerKey());
    } catch {
      // Ignore
    }
    pointsManager.recordQuizTimeout(q.id);
    soundManager.playQuizWrong();
  }, [currentQuestion]);

  // Countdown timer effect with real wall-clock tracking across tab switches and page navigations
  useEffect(() => {
    if (!isQuizStarted || isCurrentQuestionAnswered || isSubmitted) return;

    const targetQId = currentQuestion.id;
    const timerKey = userManager.getQuizTimerKey();

    let deadline: number;
    try {
      const savedTimer = localStorage.getItem(timerKey);
      if (savedTimer) {
        const parsed = JSON.parse(savedTimer);
        if (parsed.questionId === targetQId && typeof parsed.deadline === 'number') {
          deadline = parsed.deadline;
        } else {
          deadline = Date.now() + QUESTION_TIME_LIMIT * 1000;
          localStorage.setItem(
            timerKey,
            JSON.stringify({ questionId: targetQId, questionIndex: currentQuestionIndex, deadline })
          );
        }
      } else {
        deadline = Date.now() + QUESTION_TIME_LIMIT * 1000;
        localStorage.setItem(
          timerKey,
          JSON.stringify({ questionId: targetQId, questionIndex: currentQuestionIndex, deadline })
        );
      }
    } catch {
      deadline = Date.now() + QUESTION_TIME_LIMIT * 1000;
    }

    const checkAndSyncTimer = (): boolean => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        handleTimeout(targetQId);
        return false;
      }
      return true;
    };

    const isRunning = checkAndSyncTimer();
    if (!isRunning) return;

    const interval = setInterval(() => {
      const keepGoing = checkAndSyncTimer();
      if (!keepGoing) {
        clearInterval(interval);
      }
    }, 250);

    const handleVisibilityOrFocus = () => {
      checkAndSyncTimer();
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('pageshow', handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('pageshow', handleVisibilityOrFocus);
    };
  }, [isQuizStarted, currentQuestionIndex, isCurrentQuestionAnswered, isSubmitted, currentQuestion.id, handleTimeout]);

  // Synchronize selection with current question record
  useEffect(() => {
    if (currentAnswerRecord !== undefined) {
      setPendingSelection(currentAnswerRecord.selectedOptionIndex);
    } else {
      setPendingSelection(null);
    }
  }, [currentQuestionIndex, currentAnswerRecord]);

  // Persist answers to localStorage whenever they change
  useEffect(() => {
    try {
      if (Object.keys(studentAnswers).length === 0) {
        localStorage.removeItem(userManager.getQuizAnswersKey());
      } else {
        localStorage.setItem(userManager.getQuizAnswersKey(), JSON.stringify(studentAnswers));
      }
    } catch {
      // Ignore storage errors
    }
  }, [studentAnswers]);

  // Persist isSubmitted to localStorage whenever it changes
  useEffect(() => {
    try {
      if (isSubmitted) {
        localStorage.setItem(userManager.getQuizSubmittedKey(), 'true');
      } else {
        localStorage.removeItem(userManager.getQuizSubmittedKey());
      }
    } catch {
      // Ignore storage errors
    }
  }, [isSubmitted]);

  // Calculate score deterministically from stored answers
  const { score, totalQuestions, percentage } = useMemo(() => {
    let correct = 0;
    QUIZ_QUESTIONS.forEach((q) => {
      const rec = studentAnswers[q.id];
      if (rec && rec.isCorrect) {
        correct++;
      }
    });
    const total = QUIZ_QUESTIONS.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return {
      score: correct,
      totalQuestions: total,
      percentage: pct,
      correctAnswersCount: correct,
    };
  }, [studentAnswers]);

  // Dynamic Certificate / Completion Card Theme based on final quiz percentage
  const themeConfig = useMemo(() => {
    if (percentage >= 80) {
      return {
        trophyBg: 'bg-emerald-600 dark:bg-emerald-600',
        trophyShadow: 'shadow-emerald-500/20 dark:shadow-emerald-950/50',
        badgeBorder: 'border-emerald-500/40 dark:border-emerald-500/40',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
        badgeTextClr: 'text-emerald-700 dark:text-emerald-300',
        badgeText: '★ OUTSTANDING MASTERY (GRADE A) ★',
        description: 'Incredible performance! You demonstrated thorough command of Hash Table operations and algorithmic constraints.',
        scoreCardBorder: 'border-emerald-200/80 dark:border-emerald-500/40',
        scoreText: 'text-emerald-600 dark:text-emerald-400',
        scorePillBg: 'bg-emerald-50/80 dark:bg-emerald-950/40',
        scorePillBorder: 'border-emerald-200 dark:border-emerald-500/30',
        scorePillText: 'text-emerald-800 dark:text-emerald-300',
        scoreHeaderClr: 'text-emerald-700 dark:text-emerald-300',
        cardBorder: 'border-emerald-200/80 dark:border-emerald-900/50',
      };
    } else if (percentage >= 40) {
      return {
        trophyBg: 'bg-[#2563EB] dark:bg-[#2563EB]',
        trophyShadow: 'shadow-blue-500/20 dark:shadow-blue-950/50',
        badgeBorder: 'border-blue-400/40 dark:border-blue-500/40',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/60',
        badgeTextClr: 'text-blue-700 dark:text-blue-300',
        badgeText: '★ COMPETENT MASTERY (GRADE B) ★',
        description: 'Good job! You have a solid grasp of hashing principles with a few areas to refine.',
        scoreCardBorder: 'border-blue-200/80 dark:border-blue-500/40',
        scoreText: 'text-[#2563EB] dark:text-[#3B82F6]',
        scorePillBg: 'bg-blue-50/80 dark:bg-blue-950/40',
        scorePillBorder: 'border-blue-200 dark:border-blue-500/30',
        scorePillText: 'text-blue-800 dark:text-blue-300',
        scoreHeaderClr: 'text-[#2563EB] dark:text-[#3B82F6]',
        cardBorder: 'border-blue-200/80 dark:border-blue-900/50',
      };
    } else {
      return {
        trophyBg: 'bg-amber-500 dark:bg-amber-500',
        trophyShadow: 'shadow-amber-500/20 dark:shadow-amber-950/50',
        badgeBorder: 'border-amber-400/40 dark:border-amber-500/40',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
        badgeTextClr: 'text-amber-700 dark:text-amber-300',
        badgeText: '★ NEEDS REVIEW (GRADE C) ★',
        description: 'Keep practicing! Review the learning chapters and visual sandbox to strengthen your understanding.',
        scoreCardBorder: 'border-amber-200/80 dark:border-amber-500/40',
        scoreText: 'text-amber-600 dark:text-amber-400',
        scorePillBg: 'bg-amber-50/80 dark:bg-amber-950/40',
        scorePillBorder: 'border-amber-200 dark:border-amber-500/30',
        scorePillText: 'text-amber-800 dark:text-amber-300',
        scoreHeaderClr: 'text-amber-700 dark:text-amber-300',
        cardBorder: 'border-amber-200/80 dark:border-amber-900/50',
      };
    }
  }, [percentage]);

  // Handle student selecting an option (prevent selection if answered or timed out)
  const handleSelectOption = (optionIndex: number) => {
    if (isCurrentQuestionAnswered || isSubmitted) return;
    if (!isQuizStarted) {
      setStartQuizWarning('Please click Start Quiz first to begin the quiz.');
      soundManager.playError();
      setPendingSelection(optionIndex);
      return;
    }
    setStartQuizWarning(null);
    soundManager.playQuizSelect();
    setPendingSelection(optionIndex);
  };

  // Handle confirming answer for current question (Records answer without revealing final result screen)
  const handleConfirmAnswer = () => {
    if (!isQuizStarted) {
      setStartQuizWarning('Please click Start Quiz first to begin the quiz.');
      soundManager.playError();
      return;
    }
    if (pendingSelection === null || isCurrentQuestionAnswered) return;

    const q = currentQuestion;
    const isCorrect = pendingSelection === q.correctIndex;
    const selectedText = q.options[pendingSelection] || '';

    const newRecord: StudentAnswerRecord = {
      questionId: q.id,
      selectedOptionIndex: pendingSelection,
      selectedAnswerText: selectedText,
      correctOptionIndex: q.correctIndex,
      correctAnswerText: q.correctAnswerText,
      isCorrect,
    };

    const updatedAnswers = {
      ...studentAnswers,
      [q.id]: newRecord,
    };

    setStudentAnswers(updatedAnswers);
    try {
      localStorage.removeItem(userManager.getQuizTimerKey());
    } catch {
      // Ignore
    }
    pointsManager.recordQuizAnswer(q.id, isCorrect);

    // Play appropriate interaction sound
    if (isCorrect) {
      soundManager.playQuizCorrect();
    } else {
      soundManager.playQuizWrong();
    }
  };

  // Handle submitting the entire examination ONLY when user clicks "Complete & Review"
  const handleSubmitExamination = () => {
    if (!isQuizStarted) {
      setStartQuizWarning('Please click Start Quiz first to begin the quiz.');
      soundManager.playError();
      return;
    }
    // If pending selection on current question is not saved yet, save it
    const updatedAnswers = { ...studentAnswers };
    if (pendingSelection !== null && !updatedAnswers[currentQuestion.id]) {
      const q = currentQuestion;
      const isCorrect = pendingSelection === q.correctIndex;
      const selectedText = q.options[pendingSelection] || '';
      const newRecord: StudentAnswerRecord = {
        questionId: q.id,
        selectedOptionIndex: pendingSelection,
        selectedAnswerText: selectedText,
        correctOptionIndex: q.correctIndex,
        correctAnswerText: q.correctAnswerText,
        isCorrect,
      };
      updatedAnswers[q.id] = newRecord;
      setStudentAnswers(updatedAnswers);
      pointsManager.recordQuizAnswer(q.id, isCorrect);
    }

    const totalAnswered = Object.keys(updatedAnswers).length;
    if (totalAnswered < QUIZ_QUESTIONS.length) {
      soundManager.playError();
      const firstUnansweredIndex = QUIZ_QUESTIONS.findIndex((quest) => updatedAnswers[quest.id] === undefined);
      if (firstUnansweredIndex >= 0) {
        setCurrentQuestionIndex(firstUnansweredIndex);
      }
      return;
    }

    setIsSubmitted(true);
    try {
      localStorage.setItem(userManager.getQuizSubmittedKey(), 'true');
      localStorage.removeItem(userManager.getQuizTimerKey());
    } catch {
      // Ignore storage errors
    }

    // Calculate final correct score
    let calculatedCorrect = 0;
    QUIZ_QUESTIONS.forEach((q) => {
      const rec = updatedAnswers[q.id];
      if (rec && rec.isCorrect) calculatedCorrect++;
    });

    // Synchronize with progressManager
    const rawScoresMap: Record<number, number> = {};
    (Object.values(updatedAnswers) as StudentAnswerRecord[]).forEach((rec) => {
      rawScoresMap[rec.questionId] = rec.selectedOptionIndex;
    });

    progressManager.recordQuizCompletion(rawScoresMap, calculatedCorrect, QUIZ_QUESTIONS.length);

    if (calculatedCorrect >= 6) {
      soundManager.playQuizComplete();
    } else {
      soundManager.playQuizWrong();
    }
  };

  const answeredCount = Object.keys(studentAnswers).length;

  return (
    <div className="w-full max-w-4xl mx-auto py-4 px-4 font-sans text-slate-900 dark:text-white animate-page-enter">
      {/* Scoring Banner */}
      <div className="w-full mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-blue-950/40 border border-blue-200/80 dark:border-blue-500/30 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-xs">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
          <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Scoring Rules:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-semibold">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/50">
            Correct: +3 pts
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-100/80 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300/60 dark:border-rose-800/50">
            Wrong: −2 pts
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Timeout / Unanswered: 0 pts
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-100/80 text-[#2563EB] dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300/60 dark:border-blue-800/50 font-bold">
            Max Score: 30 pts
          </span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl pb-6 mb-6 bg-white dark:bg-[#111827] p-6 sm:p-8 shadow-xs dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] reveal-on-scroll">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-500/30 text-[#2563EB] dark:text-[#3B82F6] rounded-lg text-xs font-semibold uppercase tracking-wider font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
            <span>Knowledge Assessment</span>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/50 text-[#2563EB] dark:text-[#3B82F6] font-mono text-xs font-bold">
              Quiz Score: {pointsState.quizPoints} / 30 pts
            </span>
            {isSubmitted && (
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold">
                Completed
              </span>
            )}
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight animate-heading-enter">
          Hashing Knowledge Check
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl mt-1 leading-relaxed">
          Test your understanding of modulo formulas, hash collisions, separate chaining, linear/quadratic probing, and double hashing.
        </p>

        {/* Question Index Tabs / Progress Tracker */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2 mb-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
              <span>
                Progress: <strong className="text-[#2563EB] dark:text-[#3B82F6] font-mono">{answeredCount}</strong> / {totalQuestions} Answered
              </span>
            </div>
            {isSubmitted && (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
                {score} / {totalQuestions} Correct
              </span>
            )}
          </div>

          {/* Question Index Pills */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
            {QUIZ_QUESTIONS.map((q, idx) => {
              const rec = studentAnswers[q.id];
              const isAnswered = rec !== undefined;
              const isCurrent = currentQuestionIndex === idx && !isSubmitted;

              let pillStyle = 'bg-slate-50 dark:bg-[#0B1120] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#172033]';
              if (isCurrent) {
                pillStyle = 'bg-[#2563EB] dark:bg-[#2563EB] text-white border-[#1D4ED8] dark:border-[#2563EB] font-bold shadow-xs dark:shadow-none';
              } else if (isAnswered) {
                if (rec.isTimedOut) {
                  pillStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 font-semibold';
                } else if (rec.isCorrect) {
                  pillStyle = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 font-semibold';
                } else {
                  pillStyle = 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-500/30 font-semibold';
                }
              }

              return (
                <button
                  key={q.id}
                  id={`btn-quiz-jump-${q.id}`}
                  onClick={() => {
                    if (isSubmitted) {
                      const el = document.getElementById(`quiz-review-card-${q.id}`);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    } else if (!isQuizStarted) {
                      setStartQuizWarning('Please click Start Quiz first to begin the quiz.');
                      soundManager.playError();
                      return;
                    } else {
                      soundManager.playNav();
                      setCurrentQuestionIndex(idx);
                    }
                  }}
                  className={`py-2 text-center text-xs font-mono rounded-lg border transition-all cursor-pointer ${pillStyle}`}
                  title={`Question ${idx + 1}`}
                >
                  <span>Q{idx + 1}</span>
                  {isAnswered && (
                    <span className="block text-[10px] leading-tight mt-0.5">
                      {rec.isTimedOut ? '⏱' : rec.isCorrect ? '✓' : '✕'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* QUIZ COMPLETION VIEW (Displayed ONLY after Complete & Review is clicked) */}
      {isSubmitted ? (
        <div className="space-y-8">
          {/* 1. Dynamic Quiz Assessment Completed Section */}
          <div
            id="quiz-result-card"
            className={`p-6 sm:p-10 lg:p-12 bg-white dark:bg-[#111827] border ${themeConfig.cardBorder} rounded-3xl shadow-xs dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] flex flex-col items-center justify-center text-center animate-editorial-scale transition-all`}
          >
            {/* 1. Top Achievement Trophy Icon */}
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl ${themeConfig.trophyBg} flex items-center justify-center shadow-lg ${themeConfig.trophyShadow} mx-auto mb-4 sm:mb-5`}>
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-white stroke-[2.2]" />
            </div>

            {/* 2. Achievement Badge */}
            <div className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full border ${themeConfig.badgeBorder} ${themeConfig.badgeBg} ${themeConfig.badgeTextClr} font-mono text-[11px] sm:text-xs font-bold tracking-wider uppercase mb-3 sm:mb-4`}>
              {themeConfig.badgeText}
            </div>

            {/* 3. Main Completion Heading */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] dark:text-white tracking-tight uppercase mb-3">
              QUIZ ASSESSMENT COMPLETED
            </h2>

            {/* 4. Supporting Description */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed font-normal mb-6 sm:mb-8">
              {themeConfig.description}
            </p>

            {/* 5. Large Highlighted Score Card */}
            <div className={`w-full max-w-md mx-auto p-6 sm:p-8 bg-white dark:bg-[#0B1120] border-2 ${themeConfig.scoreCardBorder} rounded-3xl shadow-xs dark:shadow-none flex flex-col items-center justify-center text-center mb-6 sm:mb-8`}>
              <span className={`text-[11px] sm:text-xs font-mono font-bold tracking-[0.2em] ${themeConfig.scoreHeaderClr} uppercase mb-2`}>
                FINAL HIGHLIGHTED SCORE
              </span>
              <div className={`text-5xl sm:text-6xl font-black ${themeConfig.scoreText} font-sans tracking-tight leading-none my-2`}>
                {percentage}%
              </div>
              <div className={`mt-3 px-4 py-1.5 rounded-xl ${themeConfig.scorePillBg} border ${themeConfig.scorePillBorder} ${themeConfig.scorePillText} font-mono text-xs sm:text-sm font-semibold`}>
                {score} / {totalQuestions} Questions Correct
              </div>
            </div>

            {/* 6. Summary Statistics Cards (CORRECT, INCORRECT, ACCURACY - STRICTLY NO XP) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full max-w-2xl mx-auto">
              {/* CORRECT CARD */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center text-center">
                <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1.5">
                  CORRECT
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono flex items-center justify-center gap-1.5">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  {score}
                </span>
              </div>

              {/* INCORRECT CARD */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center text-center">
                <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1.5">
                  INCORRECT
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-rose-500 dark:text-rose-400 font-mono">
                  {totalQuestions - score}
                </span>
              </div>

              {/* ACCURACY CARD */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center text-center">
                <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1.5">
                  ACCURACY
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {percentage}%
                </span>
              </div>
            </div>

            {/* Action Button: Back to Home */}
            <div className="flex items-center justify-center gap-3.5 mt-8 w-full max-w-md mx-auto">
              <button
                id="btn-quiz-back-to-home"
                type="button"
                onClick={() => {
                  soundManager.playNav();
                  if (onNavigateToHome) {
                    onNavigateToHome();
                  } else {
                    onNavigateToProgress();
                  }
                }}
                className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#2563EB] dark:hover:bg-blue-600 text-white font-sans text-sm font-semibold shadow-md dark:shadow-none transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4 stroke-[2.2] text-white" />
                <span>Back to Overview</span>
              </button>
            </div>
          </div>

          {/* 2. QUESTION OVERVIEW SECTION (Directly Below Completion Certificate) */}
          <div id="quiz-question-overview-section" className="space-y-6">
            {/* Section Heading */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 font-display">
                <ListOrdered className="w-5 h-5 text-[#2563EB] dark:text-[#3B82F6]" />
                <span>Full Question-by-Question Review</span>
              </h3>
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold font-mono">
                {score} of {totalQuestions} Correct
              </span>
            </div>

            {/* 10 Question Review Cards (Sequential Order 01 to 10) */}
            <div className="space-y-5">
              {QUIZ_QUESTIONS.map((q, idx) => {
                const rec = studentAnswers[q.id];
                const isCorrect = rec?.isCorrect || false;
                const cleanQuestionText = q.question.replace(/^\d+\.\s*/, '');
                const questionNumberStr = idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`;

                return (
                  <div
                    key={q.id}
                    id={`quiz-review-card-${q.id}`}
                    className={`p-6 sm:p-7 rounded-[22px] sm:rounded-[24px] bg-white dark:bg-[#111827] transition-all shadow-xs dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] ${
                      isCorrect
                        ? 'border-2 border-emerald-400 dark:border-emerald-500/50'
                        : 'border-2 border-rose-300 dark:border-rose-500/50'
                    }`}
                  >
                    {/* Top Header: Badge + Identifier (Left) & Status Badge (Right) */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="px-3 py-1 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-full text-xs font-bold font-mono tracking-wide shadow-xs inline-flex items-center justify-center">
                          Question {questionNumberStr}
                        </span>
                        <span className="text-xs font-bold text-[#2563EB] dark:text-[#3B82F6] font-mono tracking-wider">
                          {q.techniqueCode}
                        </span>
                      </div>

                      <div>
                        {rec?.isTimedOut ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold font-sans">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Timed Out (0 pts)</span>
                          </div>
                        ) : isCorrect ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold font-sans">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Correct (+3 pts)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-bold font-sans">
                            <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Incorrect (−2 pts)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Question Statement */}
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-3.5 mb-4 leading-snug break-words">
                      {cleanQuestionText}
                    </h4>

                    {/* Submission and Correct Answer Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                      {/* Left: Your Submission */}
                      <div
                        className={`p-3.5 sm:p-4 rounded-xl border ${
                          isCorrect
                            ? 'bg-[#E8FAF0] dark:bg-emerald-950/40 border-[#A7F3D0] dark:border-emerald-500/30'
                            : 'bg-[#FEECEB] dark:bg-rose-950/40 border-rose-200 dark:border-rose-500/30'
                        }`}
                      >
                        <div
                          className={`text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase mb-1.5 font-sans ${
                            isCorrect ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          YOUR SUBMISSION:
                        </div>
                        <div className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 break-words">
                          {rec
                            ? `${String.fromCharCode(65 + rec.selectedOptionIndex)}: ${rec.selectedAnswerText}`
                            : 'No Answer Submitted'}
                        </div>
                      </div>

                      {/* Right: Correct Answer */}
                      <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B1120]">
                        <div className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400 mb-1.5 font-sans">
                          CORRECT ANSWER:
                        </div>
                        <div className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 break-words">
                          {String.fromCharCode(65 + q.correctIndex)}: {q.correctAnswerText}
                        </div>
                      </div>
                    </div>

                    {/* Technical Explanation Panel */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-2">
                        <HelpCircle className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
                        <span>Technical Explanation:</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed mb-3 font-normal">
                        {q.explanation}
                      </p>

                      {q.exampleSnippet && (
                        <div className="mb-3 p-2.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-blue-500/30 rounded-lg font-mono text-xs text-[#2563EB] dark:text-[#3B82F6] font-semibold">
                          Example: {q.exampleSnippet}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                        {q.targetChapterId && (
                          <button
                            onClick={() => {
                              soundManager.playNav();
                              onNavigateToTheory(q.targetChapterId);
                            }}
                            className="text-[#2563EB] dark:text-[#3B82F6] hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-xs inline-flex items-center gap-1.5 hover:underline cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Review in Theory Guide →</span>
                          </button>
                        )}
                        {q.targetLevelId && (
                          <button
                            onClick={() => {
                              soundManager.playNav();
                              onNavigateToQuest(q.targetLevelId);
                            }}
                            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold text-xs inline-flex items-center gap-1.5 hover:underline cursor-pointer"
                          >
                            <Gamepad2 className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
                            <span>Practice in Quest Level {q.targetLevelId} →</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Taking the Quiz: Step-by-Step Question Flow (Questions 1 to 10) */
        <div className="space-y-6">
          <div
            key={currentQuestion.id}
            id={`quiz-step-card-${currentQuestion.id}`}
            className={`p-6 sm:p-8 border rounded-2xl transition-all bg-white dark:bg-[#111827] shadow-xs dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] animate-chapter-switch ${
              isCurrentQuestionAnswered
                ? currentAnswerRecord?.isCorrect
                  ? 'border-emerald-300 dark:border-emerald-500/40 ring-1 ring-emerald-200 dark:ring-emerald-500/30'
                  : 'border-rose-300 dark:border-rose-500/40 ring-1 ring-rose-200 dark:ring-rose-500/30'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            {/* Question Header */}
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-md text-xs font-bold font-mono shadow-xs">
                  Question {currentQuestionIndex + 1 < 10 ? `0${currentQuestionIndex + 1}` : currentQuestionIndex + 1} of {totalQuestions}
                </span>
                <span className="text-xs font-semibold text-[#2563EB] dark:text-[#3B82F6] font-mono">{currentQuestion.techniqueCode}</span>
              </div>

              {isCurrentQuestionAnswered ? (
                <div className="flex items-center gap-2">
                  {currentAnswerRecord?.isTimedOut ? (
                    <>
                      <div
                        id="quiz-question-timer-expired"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono text-xs font-bold border bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800"
                        aria-label="0 seconds remain - Timed Out"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>⏱ 0s remaining</span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Timed Out (0 pts)</span>
                      </span>
                    </>
                  ) : currentAnswerRecord?.isCorrect ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 rounded-lg">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Correct (+3 pts)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/60 text-xs font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 rounded-lg">
                      <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Incorrect (−2 pts)</span>
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-2.5">
                  {!isQuizStarted && (
                    <button
                      id="btn-start-quiz"
                      type="button"
                      onClick={handleStartQuiz}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#2563EB] dark:hover:bg-[#1D4ED8] text-white border border-[#1D4ED8] dark:border-[#3B82F6] rounded-lg text-xs font-bold font-mono tracking-wide shadow-xs transition-all cursor-pointer active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Quiz</span>
                    </button>
                  )}
                  <div
                    id="quiz-question-timer"
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono text-xs font-bold border transition-all ${
                      !isQuizStarted
                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800'
                        : timeLeft <= 10
                        ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800 animate-pulse'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800'
                    }`}
                    aria-label={`Time remaining: ${timeLeft} seconds`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>⏱ {timeLeft}s remaining</span>
                  </div>
                </div>
              )}
            </div>

            {/* Inactive State Warning Banner */}
            {startQuizWarning && !isQuizStarted && (
              <div
                id="quiz-start-warning"
                role="alert"
                className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 animate-fade-in shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{startQuizWarning}</span>
                </div>
                <button
                  type="button"
                  onClick={handleStartQuiz}
                  className="px-2.5 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-bold font-mono shrink-0 cursor-pointer transition-all active:scale-95"
                >
                  Start Quiz
                </button>
              </div>
            )}

            {/* Question Statement */}
            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-6 leading-snug break-words">
              {currentQuestion.question}
            </p>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((opt, optIdx) => {
                const isSelected = pendingSelection === optIdx;
                let optStyle =
                  'bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-[#172033] text-slate-800 dark:text-slate-200';

                if (isCurrentQuestionAnswered) {
                  if (optIdx === currentQuestion.correctIndex) {
                    optStyle =
                      'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-bold ring-2 ring-emerald-400 dark:ring-emerald-500/40';
                  } else if (isSelected && !currentAnswerRecord?.isCorrect) {
                    optStyle = 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-950 dark:text-rose-200 font-bold';
                  } else {
                    optStyle = 'bg-white dark:bg-[#0B1120] opacity-40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500';
                  }
                } else if (isSelected) {
                  optStyle =
                    'bg-blue-50/80 dark:bg-blue-950/60 border-[#2563EB] dark:border-[#3B82F6] text-blue-950 dark:text-white font-semibold ring-2 ring-blue-500 dark:ring-blue-500/30';
                }

                return (
                  <button
                    key={optIdx}
                    id={`quiz-q${currentQuestion.id}-opt${optIdx}`}
                    onClick={() => handleSelectOption(optIdx)}
                    disabled={isCurrentQuestionAnswered && isSubmitted}
                    style={{ animationDelay: `${(optIdx + 1) * 60}ms` }}
                    className={`w-full p-4 text-left text-sm font-sans rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer animate-chapter-switch ${optStyle}`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border text-xs font-bold font-mono ${
                        isSelected
                          ? isCurrentQuestionAnswered
                            ? optIdx === currentQuestion.correctIndex
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-rose-600 text-white border-rose-600'
                            : 'bg-[#2563EB] dark:bg-[#2563EB] text-white border-[#1D4ED8] dark:border-[#2563EB]'
                          : 'bg-slate-100 dark:bg-[#0B1120] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="flex-1 pt-0.5 leading-relaxed break-words">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Answer Confirmation / Next Button Bar */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                disabled={!isQuizStarted || currentQuestionIndex === 0}
                onClick={() => {
                  if (!isQuizStarted) {
                    setStartQuizWarning('Please click Start Quiz first to begin the quiz.');
                    soundManager.playError();
                    return;
                  }
                  soundManager.playNav();
                  setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
                }}
                className={`btn-modern-secondary px-4 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  !isQuizStarted || currentQuestionIndex === 0 ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              {!isCurrentQuestionAnswered ? (
                <button
                  id="btn-confirm-answer"
                  disabled={isQuizStarted && pendingSelection === null}
                  onClick={handleConfirmAnswer}
                  className={`btn-modern-primary px-6 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                    !isQuizStarted || pendingSelection !== null ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed pointer-events-none'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Submit Answer</span>
                </button>
              ) : currentQuestionIndex < totalQuestions - 1 ? (
                <button
                  id="btn-next-question"
                  onClick={() => {
                    if (!isQuizStarted) {
                      setStartQuizWarning('Please click Start Quiz first to begin the quiz.');
                      soundManager.playError();
                      return;
                    }
                    soundManager.playClick();
                    setCurrentQuestionIndex((prev) => prev + 1);
                  }}
                  className="btn-modern-primary px-6 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  id="btn-finish-quiz"
                  onClick={handleSubmitExamination}
                  className="btn-modern-primary px-6 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  <Award className="w-4 h-4" />
                  <span>Complete & Review</span>
                </button>
              )}
            </div>

            {/* Technical Explanation Panel (visible once answered) */}
            {isCurrentQuestionAnswered && (
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120] rounded-xl p-4 sm:p-5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-2">
                  <HelpCircle className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
                  <span>Technical Explanation:</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3 font-normal text-sm">
                  {currentQuestion.explanation}
                </p>

                {currentQuestion.exampleSnippet && (
                  <div className="mb-3 p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-blue-500/30 rounded-lg font-mono text-xs text-[#2563EB] dark:text-[#3B82F6] font-semibold">
                    Example: {currentQuestion.exampleSnippet}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                  {currentQuestion.targetChapterId && (
                    <button
                      onClick={() => {
                        soundManager.playNav();
                        onNavigateToTheory(currentQuestion.targetChapterId);
                      }}
                      className="text-[#2563EB] dark:text-[#3B82F6] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Review in Theory Guide →</span>
                    </button>
                  )}
                  {currentQuestion.targetLevelId && (
                    <button
                      onClick={() => {
                        soundManager.playNav();
                        onNavigateToQuest(currentQuestion.targetLevelId);
                      }}
                      className="text-slate-700 dark:text-slate-300 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Gamepad2 className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
                      <span>Practice in Quest Level {currentQuestion.targetLevelId} →</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default QuizView;
