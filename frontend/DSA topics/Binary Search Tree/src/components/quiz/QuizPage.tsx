import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Award,
  Check,
  Eye,
  ChevronDown,
  ChevronUp,
  Home,
  Clock,
  Sparkles,
  Lock,
  RotateCcw,
} from 'lucide-react';
import { QUIZ_QUESTIONS } from '../../data/quizData';
import { TreeCanvas } from '../common/TreeCanvas';
import { buildTreeFromValues } from '../../utils/bst';
import { useUserProgress } from '../../context/UserProgressContext';
import { soundManager } from '../../utils/audio';

interface QuizPageProps {
  onGoToHome?: () => void;
  onGoToGame?: () => void;
  onSelectTopic?: (topicIndex: number) => void;
}

const QUIZ_SESSION_STORAGE_KEY = 'bst_quiz_session_state';
const QUESTION_TIME_LIMIT_SECONDS = 20;

interface QuizSavedSession {
  currentIndex: number;
  selectedAnswers: (number | null)[];
  confirmedAnswers: (number | null)[];
  isQuizCompleted: boolean;
  isQuizStarted?: boolean;
}

const getInitialQuizState = (): QuizSavedSession => {
  try {
    const raw =
      localStorage.getItem(QUIZ_SESSION_STORAGE_KEY) ||
      sessionStorage.getItem(QUIZ_SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as QuizSavedSession;
      if (
        typeof parsed.currentIndex === 'number' &&
        parsed.currentIndex >= 0 &&
        parsed.currentIndex < QUIZ_QUESTIONS.length &&
        Array.isArray(parsed.selectedAnswers) &&
        parsed.selectedAnswers.length === QUIZ_QUESTIONS.length &&
        Array.isArray(parsed.confirmedAnswers) &&
        parsed.confirmedAnswers.length === QUIZ_QUESTIONS.length &&
        typeof parsed.isQuizCompleted === 'boolean'
      ) {
        const hasAnyConfirmed = parsed.confirmedAnswers.some((ans) => ans !== null);
        const populatedSelected = parsed.selectedAnswers.map((sel, i) =>
          parsed.confirmedAnswers[i] !== null && parsed.confirmedAnswers[i] !== undefined
            ? parsed.confirmedAnswers[i]
            : sel
        );
        return {
          ...parsed,
          selectedAnswers: populatedSelected,
          isQuizStarted:
            typeof parsed.isQuizStarted === 'boolean'
              ? parsed.isQuizStarted
              : hasAnyConfirmed || parsed.isQuizCompleted,
        };
      }
    }
  } catch (e) {
    console.error('Failed to load quiz session state', e);
  }

  return {
    currentIndex: 0,
    selectedAnswers: new Array(QUIZ_QUESTIONS.length).fill(null),
    confirmedAnswers: new Array(QUIZ_QUESTIONS.length).fill(null),
    isQuizCompleted: false,
    isQuizStarted: false,
  };
};

export const QuizPage: React.FC<QuizPageProps> = ({ onGoToHome, onGoToGame }) => {
  const {
    recordQuizScore,
    addXP,
    unlockBadge,
    updateQuizProgress,
    recordQuizQuestionScore,
    quizQuestionScores,
  } = useUserProgress();

  const [savedInitial] = useState<QuizSavedSession>(() => getInitialQuizState());

  const [currentIndex, setCurrentIndex] = useState<number>(savedInitial.currentIndex);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
    savedInitial.selectedAnswers
  );
  const [confirmedAnswers, setConfirmedAnswers] = useState<(number | null)[]>(
    savedInitial.confirmedAnswers
  );
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(
    savedInitial.isQuizCompleted
  );
  const [isQuizStarted, setIsQuizStarted] = useState<boolean>(
    !!savedInitial.isQuizStarted
  );

  // Time limit per question (20 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(QUESTION_TIME_LIMIT_SECONDS);
  const [collapsedQuestions, setCollapsedQuestions] = useState<Record<number, boolean>>({});

  // Helper to check if a specific question index is unlocked for navigation
  const isQuestionUnlocked = (idx: number): boolean => {
    if (!isQuizStarted) return false;
    if (idx === 0) return true;
    for (let i = 0; i < idx; i++) {
      if (confirmedAnswers[i] === null || confirmedAnswers[i] === undefined) {
        return false;
      }
    }
    return true;
  };

  // Synchronize state with localStorage and sessionStorage whenever it changes
  useEffect(() => {
    try {
      const stateToSave: QuizSavedSession = {
        currentIndex,
        selectedAnswers,
        confirmedAnswers,
        isQuizCompleted,
        isQuizStarted,
      };
      const serialized = JSON.stringify(stateToSave);
      localStorage.setItem(QUIZ_SESSION_STORAGE_KEY, serialized);
      sessionStorage.setItem(QUIZ_SESSION_STORAGE_KEY, serialized);
    } catch (e) {
      console.error('Failed to save quiz state to storage', e);
    }
  }, [currentIndex, selectedAnswers, confirmedAnswers, isQuizCompleted, isQuizStarted]);

  // Synchronize quiz progress to context whenever confirmedAnswers changes
  useEffect(() => {
    updateQuizProgress(confirmedAnswers);
  }, [confirmedAnswers, updateQuizProgress]);

  // Handle global reset event
  useEffect(() => {
    const handleReset = () => {
      setCurrentIndex(0);
      setSelectedAnswers(new Array(QUIZ_QUESTIONS.length).fill(null));
      setConfirmedAnswers(new Array(QUIZ_QUESTIONS.length).fill(null));
      setIsQuizCompleted(false);
      setIsQuizStarted(false);
      setTimeLeft(QUESTION_TIME_LIMIT_SECONDS);
    };
    window.addEventListener('bst-reset-progress', handleReset);
    window.addEventListener('bst-reset-current-activity', handleReset);
    return () => {
      window.removeEventListener('bst-reset-progress', handleReset);
      window.removeEventListener('bst-reset-current-activity', handleReset);
    };
  }, []);

  // Ensure currentIndex never points to a locked question
  useEffect(() => {
    if (!isQuizStarted && currentIndex !== 0) {
      setCurrentIndex(0);
      return;
    }
    if (isQuizStarted && !isQuestionUnlocked(currentIndex)) {
      const firstUnanswered = confirmedAnswers.findIndex((ans) => ans === null);
      setCurrentIndex(firstUnanswered !== -1 ? firstUnanswered : 0);
    }
  }, [isQuizStarted, currentIndex, confirmedAnswers]);

  // Reset timer to 20s whenever changing questions or starting quiz (if not already answered)
  useEffect(() => {
    if (confirmedAnswers[currentIndex] === null) {
      setTimeLeft(QUESTION_TIME_LIMIT_SECONDS);
    }
  }, [currentIndex, confirmedAnswers, isQuizStarted]);

  // Finalize quiz helper
  const finalizeQuiz = (finalConfirmed: (number | null)[]) => {
    let correctCount = 0;
    QUIZ_QUESTIONS.forEach((q, i) => {
      if (finalConfirmed[i] === q.correctIndex) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / QUIZ_QUESTIONS.length) * 100);
    recordQuizScore(percentage);

    if (percentage >= 80) {
      unlockBadge('quiz-ace');
    }
  };

  // Handle Question Timeout (Award zero points, mark as timed out, and advance sequentially)
  const handleQuestionTimeout = () => {
    if (!isQuizStarted) return;
    if (confirmedAnswers[currentIndex] !== null) return;
    soundManager.playError();

    const updatedConfirmed = [...confirmedAnswers];
    // -1 denotes timed out without choosing an answer
    updatedConfirmed[currentIndex] = -1;
    setConfirmedAnswers(updatedConfirmed);

    // Immediate scoring: 0 points on timeout
    recordQuizQuestionScore(currentIndex, 0, 'timeout');
    updateQuizProgress(updatedConfirmed);

    // Automatically advance to the next question or finalize quiz
    const newlyAnsweredCount = updatedConfirmed.filter((ans) => ans !== null).length;
    if (newlyAnsweredCount === QUIZ_QUESTIONS.length) {
      finalizeQuiz(updatedConfirmed);
      setIsQuizCompleted(true);
    } else if (currentIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Timer countdown loop - only runs when quiz has started and question is unanswered
  useEffect(() => {
    if (!isQuizStarted) return;
    if (isQuizCompleted) return;
    if (confirmedAnswers[currentIndex] !== null) return;

    if (timeLeft <= 0) {
      handleQuestionTimeout();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isQuizStarted, currentIndex, confirmedAnswers, isQuizCompleted, timeLeft]);

  const currentQ = QUIZ_QUESTIONS[currentIndex];
  const currentSelected = selectedAnswers[currentIndex];
  const isCurrentConfirmed = confirmedAnswers[currentIndex] !== null;
  const isCurrentTimedOut = confirmedAnswers[currentIndex] === -1;
  const isCurrentCorrect = isCurrentConfirmed && !isCurrentTimedOut && confirmedAnswers[currentIndex] === currentQ.correctIndex;

  // Number of confirmed/answered questions
  const answeredCount = confirmedAnswers.filter((ans) => ans !== null).length;

  const handleStartQuiz = () => {
    if (isQuizStarted) return;
    soundManager.playClick();
    setIsQuizStarted(true);
    setCurrentIndex(0);
    if (confirmedAnswers[0] === null) {
      setTimeLeft(QUESTION_TIME_LIMIT_SECONDS);
    }
  };

  const handleSelectOption = (optionIdx: number) => {
    if (!isQuizStarted || isCurrentConfirmed) return;
    soundManager.playClick();
    const updated = [...selectedAnswers];
    updated[currentIndex] = optionIdx;
    setSelectedAnswers(updated);
  };

  // Submit and immediately score the answer (+3 for correct, -1 for wrong), then advance sequentially
  const handleConfirmAnswer = () => {
    if (!isQuizStarted || currentSelected === null || isCurrentConfirmed) return;

    const isCorrect = currentSelected === currentQ.correctIndex;
    if (isCorrect) {
      soundManager.playSuccess();
      if (!quizQuestionScores || quizQuestionScores[currentIndex] === undefined) {
        addXP(30, 'Correct Quiz Answer: +3 pts');
      }
      recordQuizQuestionScore(currentIndex, 3, 'correct');
    } else {
      soundManager.playError();
      recordQuizQuestionScore(currentIndex, -1, 'wrong');
    }

    const updatedConfirmed = [...confirmedAnswers];
    updatedConfirmed[currentIndex] = currentSelected;
    setConfirmedAnswers(updatedConfirmed);
    updateQuizProgress(updatedConfirmed);

    // Automatically open the next question sequentially, or finalize if all 10 are answered
    const newlyAnsweredCount = updatedConfirmed.filter((ans) => ans !== null).length;
    if (newlyAnsweredCount === QUIZ_QUESTIONS.length) {
      finalizeQuiz(updatedConfirmed);
      setIsQuizCompleted(true);
    } else if (currentIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleNext = () => {
    if (!isQuizStarted || !isCurrentConfirmed) return;
    soundManager.playClick();
    if (currentIndex < QUIZ_QUESTIONS.length - 1 && isQuestionUnlocked(currentIndex + 1)) {
      setCurrentIndex(currentIndex + 1);
    } else if (answeredCount === QUIZ_QUESTIONS.length) {
      setIsQuizCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (!isQuizStarted) return;
    if (currentIndex > 0) {
      soundManager.playClick();
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleRestartQuiz = () => {
    soundManager.playClick();
    setCurrentIndex(0);
    setSelectedAnswers(new Array(QUIZ_QUESTIONS.length).fill(null));
    setConfirmedAnswers(new Array(QUIZ_QUESTIONS.length).fill(null));
    setIsQuizCompleted(false);
    setIsQuizStarted(true);
    setTimeLeft(QUESTION_TIME_LIMIT_SECONDS);
    try {
      localStorage.removeItem(QUIZ_SESSION_STORAGE_KEY);
    } catch {}
  };

  // Compute final statistics
  const totalCorrect = QUIZ_QUESTIONS.reduce((acc, q, i) => {
    return confirmedAnswers[i] === q.correctIndex ? acc + 1 : acc;
  }, 0);
  const totalTimedOut = confirmedAnswers.filter((ans) => ans === -1).length;
  const totalIncorrect = answeredCount - totalCorrect - totalTimedOut;
  const scorePercentage = Math.round((totalCorrect / QUIZ_QUESTIONS.length) * 100);

  const getGradeTitle = (percentage: number) => {
    if (percentage >= 90) return 'MASTER (GRADE A+)';
    if (percentage >= 75) return 'PROFICIENT (GRADE B)';
    if (percentage >= 50) return 'APPRENTICE (GRADE C)';
    return 'NOVICE (GRADE D)';
  };

  const allCollapsed = QUIZ_QUESTIONS.every((_, idx) => !!collapsedQuestions[idx]);

  const toggleAllCollapsed = () => {
    if (allCollapsed) {
      setCollapsedQuestions({});
    } else {
      const next: Record<number, boolean> = {};
      QUIZ_QUESTIONS.forEach((_, idx) => {
        next[idx] = true;
      });
      setCollapsedQuestions(next);
    }
  };

  const toggleQuestionCollapse = (idx: number) => {
    setCollapsedQuestions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <div id="quiz-page-root" className="w-full max-w-4xl mx-auto space-y-5 pb-20 px-2 sm:px-4">
      {/* =======================================================
          1. KNOWLEDGE ASSESSMENT CARD
          ======================================================= */}
      <div className="bg-white dark:bg-[#0D1428] rounded-2xl border border-slate-200 dark:border-[#282054] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-purple-950/80 border border-violet-200 dark:border-purple-800 text-violet-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Binary Search Tree Knowledge Check
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Test your understanding of binary search trees, their properties, insertion, deletion, and traversal techniques.
            </p>
          </div>
        </div>

        {/* Two scoring rules in the existing quiz instructions area */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Correct answer:</span>
            <strong className="font-mono font-bold text-emerald-700 dark:text-emerald-200">+3 points</strong>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-medium">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Wrong answer:</span>
            <strong className="font-mono font-bold text-rose-700 dark:text-rose-200">-1 point</strong>
          </span>
        </div>
      </div>

      {/* =======================================================
          QUESTION STEPPER TRACK:
          Sequential navigation: future questions are visible without
          locked/disabled styling, but cannot be opened directly.
          ======================================================= */}
      {!isQuizCompleted && (
        <div className="bg-white dark:bg-[#0D1428] rounded-2xl border border-slate-200 dark:border-[#282054] p-3 sm:p-4 shadow-xs overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            {QUIZ_QUESTIONS.map((q, idx) => {
              const isCurrent = currentIndex === idx;
              const ans = confirmedAnswers[idx];
              const isAnswered = ans !== null && ans !== undefined;
              const isCorrect = isAnswered && ans === q.correctIndex;
              const isTimedOut = ans === -1;
              const isWrong = isAnswered && !isCorrect && !isTimedOut;

              return (
                <button
                  key={idx}
                  id={`quiz-step-btn-${idx}`}
                  type="button"
                  onClick={() => {
                    // Only allow opening the currently active sequential question
                    if (!isQuizStarted || idx !== currentIndex) return;
                    soundManager.playClick();
                    setCurrentIndex(idx);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                    isCurrent
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs ring-2 ring-indigo-500/20 cursor-pointer'
                      : isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 cursor-default'
                      : isWrong
                      ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 cursor-default'
                      : isTimedOut
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 cursor-default'
                      : 'bg-slate-50 dark:bg-[#111A31] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#1E2640] cursor-default'
                  }`}
                >
                  <span className="font-mono font-bold">{`Q${idx + 1}`}</span>
                  {isCorrect && <Check className="w-3 h-3 stroke-[3]" />}
                  {isWrong && <span className="text-[10px] font-bold">✕</span>}
                  {isTimedOut && <Clock className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =======================================================
          2. ACTIVE QUESTION CARD (DURING QUIZ TAKING)
          ======================================================= */}
      {!isQuizCompleted ? (
        <div className="bg-white dark:bg-[#0D1428] rounded-2xl border border-slate-200 dark:border-[#282054] p-5 sm:p-7 shadow-xs space-y-6">
          {/* Card Header: Question Number, Start Quiz Button (on Q1), Timer, & Evaluation Badge */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E2640] pb-4 flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-md text-xs font-bold bg-violet-50 dark:bg-purple-950/80 text-violet-700 dark:text-purple-300 border border-violet-200 dark:border-purple-800">
                Q{currentIndex + 1} of {QUIZ_QUESTIONS.length}
              </span>

              <span
                id={`quiz-q${currentIndex + 1}-badge`}
                className="px-3 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-[#1E2640] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono"
              >
                Q{currentIndex + 1}
              </span>

              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                {currentQ.code || `CORE-${String(currentIndex + 1).padStart(2, '0')}`}
              </span>
            </div>

            {/* Start Quiz Button (beside Q1) + Timer / Live Evaluation Feedback */}
            <div className="flex items-center gap-2">
              {currentIndex === 0 && !isQuizStarted && !isQuizCompleted && (
                <button
                  id="quiz-start-btn"
                  type="button"
                  onClick={handleStartQuiz}
                  className="px-3.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start Quiz</span>
                </button>
              )}

              {!isCurrentConfirmed ? (
                /* Countdown Timer (20s) */
                <div
                  id="quiz-question-timer"
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-colors ${
                    !isQuizStarted
                      ? 'bg-slate-50 dark:bg-[#111A31] border-slate-200 dark:border-[#1E2640] text-slate-500 dark:text-slate-400'
                      : timeLeft <= 5
                      ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 animate-pulse'
                      : timeLeft <= 10
                      ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                      : 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                  }`}
                  title="20s question countdown timer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{timeLeft}s left</span>
                </div>
              ) : (
                /* Evaluation Status Badge (Immediate feedback + points) */
                <div>
                  {isCurrentTimedOut ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 shadow-2xs font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Timed Out (0 pts)</span>
                    </span>
                  ) : isCurrentCorrect ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 shadow-2xs font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>✓ Correct (+3 pts)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-300 shadow-2xs font-mono">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>✕ Incorrect (-1 pt)</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Question Text */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentIndex + 1}. {currentQ.question}
            </h2>
          </div>

          {/* Visual Tree (if provided for this question) */}
          {currentQ.visualTreeValues && currentQ.visualTreeValues.length > 0 && (
            <div className="p-4 bg-slate-50 dark:bg-[#060817] rounded-xl border border-slate-200 dark:border-[#1E2640] text-center">
              <TreeCanvas
                root={buildTreeFromValues(currentQ.visualTreeValues)}
                width={420}
                className="max-w-xs sm:max-w-md mx-auto pointer-events-none"
              />
            </div>
          )}

          {/* Answer Options Grid */}
          <div className="space-y-3">
            {currentQ.options.map((opt, idx) => {
              const isSelected = isCurrentConfirmed
                ? confirmedAnswers[currentIndex] === idx
                : currentSelected === idx;

              let cardClasses = !isQuizStarted
                ? 'bg-slate-50/40 dark:bg-[#0D1428] border-slate-200/70 dark:border-[#1E2640]/70 text-slate-400 dark:text-slate-500 opacity-65 cursor-default'
                : 'bg-slate-50/50 dark:bg-[#111A31] border-slate-200 dark:border-[#1E2640] text-slate-800 dark:text-slate-200 hover:border-purple-400 dark:hover:border-purple-700 hover:bg-violet-50/30 dark:hover:bg-purple-950/20 cursor-pointer';
              let badgeClasses = !isQuizStarted
                ? 'bg-slate-100 dark:bg-[#111A31] text-slate-400 dark:text-slate-600 border-slate-200 dark:border-[#1E2640]'
                : 'bg-slate-200/80 dark:bg-[#1A2649] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-[#283768]';

              if (isCurrentConfirmed) {
                if (isSelected) {
                  if (isCurrentCorrect) {
                    cardClasses =
                      'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600 text-emerald-950 dark:text-emerald-100 font-semibold shadow-xs cursor-default';
                    badgeClasses =
                      'bg-emerald-600 text-white border-emerald-500';
                  } else {
                    cardClasses =
                      'bg-rose-50 dark:bg-rose-950/40 border-rose-500 dark:border-rose-600 text-rose-950 dark:text-rose-100 font-semibold shadow-xs cursor-default';
                    badgeClasses = 'bg-rose-600 text-white border-rose-500';
                  }
                } else {
                  cardClasses =
                    'bg-slate-50/30 dark:bg-[#0D1428] border-slate-200/60 dark:border-[#1E2640]/60 text-slate-400 dark:text-slate-500 opacity-60 cursor-default';
                  badgeClasses =
                    'bg-slate-100 dark:bg-[#111A31] text-slate-400 dark:text-slate-600 border-slate-200 dark:border-[#1E2640]';
                }
              } else if (isQuizStarted && isSelected) {
                cardClasses =
                  'bg-violet-50 dark:bg-purple-950/60 border-violet-600 dark:border-purple-500 text-violet-950 dark:text-white font-semibold ring-2 ring-purple-500/20 shadow-xs cursor-pointer';
                badgeClasses =
                  'bg-violet-600 dark:bg-purple-600 text-white border-violet-500 dark:border-purple-500';
              }

              return (
                <button
                  key={idx}
                  id={`quiz-opt-${idx}`}
                  type="button"
                  disabled={!isQuizStarted || isCurrentConfirmed}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between gap-3 ${cardClasses}`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs font-mono shrink-0 transition-colors ${badgeClasses}`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-relaxed">{opt}</span>
                  </div>

                  {/* Immediate feedback: ONLY on the option chosen by the user */}
                  {isCurrentConfirmed && isSelected && isCurrentCorrect && (
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs shrink-0 font-mono">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Correct (+3 pts)</span>
                    </span>
                  )}
                  {isCurrentConfirmed && isSelected && !isCurrentCorrect && (
                    <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold text-xs shrink-0 font-mono">
                      <XCircle className="w-5 h-5" />
                      <span>Incorrect (-1 pt)</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Navigation Bar */}
          <div className="border-t border-slate-200 dark:border-[#1E2640] pt-5 flex items-center justify-end gap-3">
            {/* Right: Submit Answer / Next Button */}
            {!isCurrentConfirmed ? (
              <button
                id="quiz-submit-btn"
                type="button"
                disabled={!isQuizStarted || currentSelected === null}
                onClick={handleConfirmAnswer}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
                  isQuizStarted && currentSelected !== null
                    ? 'bg-violet-600 hover:bg-violet-500 dark:bg-purple-600 dark:hover:bg-purple-500 text-white shadow-[0_0_14px_rgba(124,60,255,0.45)] active:scale-95 cursor-pointer'
                    : 'bg-slate-200 dark:bg-[#1A2649] text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>SUBMIT ANSWER</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {currentIndex < QUIZ_QUESTIONS.length - 1 ? (
                  <button
                    id="quiz-next-btn"
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 dark:bg-purple-600 dark:hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_12px_rgba(124,60,255,0.35)] transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>NEXT QUESTION</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    id="quiz-finish-btn"
                    type="button"
                    onClick={() => setIsQuizCompleted(true)}
                    className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 dark:bg-purple-600 dark:hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_12px_rgba(124,60,255,0.35)] transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>VIEW RESULTS</span>
                    <Award className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* =======================================================
            3. QUIZ ASSESSMENT COMPLETED SUMMARY CARD
            ======================================================= */
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0D1428] rounded-2xl border border-slate-200 dark:border-[#282054] p-6 sm:p-8 shadow-xs text-center space-y-6">
            {/* Trophy Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                ★ {getGradeTitle(scorePercentage)} ★
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                QUIZ ASSESSMENT COMPLETED
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                {scorePercentage >= 80
                  ? 'Great job! You have a solid grasp of Binary Search Tree fundamentals, pointer mechanics, node invariants, and traversal lifecycle behavior.'
                  : scorePercentage >= 60
                  ? 'Good effort! You understand core BST concepts well. Review the detailed breakdown below to master every BST technique.'
                  : 'Good attempt! Explore the explanations below for each question, practice in the lab, and try again to achieve mastery.'}
              </p>
            </div>

            {/* Results Metric Grid (Without separate Quiz Points counter) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
              <div className="p-4 bg-slate-50 dark:bg-[#111A31] rounded-xl border border-slate-200 dark:border-[#1E2640]">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Accuracy</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1">
                  {scorePercentage}%
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-[#111A31] rounded-xl border border-slate-200 dark:border-[#1E2640]">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Correct (+3 pts)</div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{totalCorrect}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-[#111A31] rounded-xl border border-slate-200 dark:border-[#1E2640]">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Incorrect (-1 pt)</div>
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono mt-1 flex items-center justify-center gap-1">
                  <XCircle className="w-5 h-5" />
                  <span>{totalIncorrect}</span>
                </div>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                id="quiz-completion-retake-btn"
                type="button"
                onClick={handleRestartQuiz}
                className="px-6 py-2.5 bg-white dark:bg-[#111A31] hover:bg-slate-50 dark:hover:bg-[#18223E] text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-[#282054] transition-colors flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95"
              >
                <RotateCcw className="w-4 h-4 text-indigo-500" />
                <span>Retake Quiz</span>
              </button>

              {onGoToHome && (
                <button
                  id="quiz-completion-home-btn"
                  onClick={onGoToHome}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                >
                  <Home className="w-4 h-4" />
                  <span>Back to Home</span>
                </button>
              )}

              {onGoToGame && (
                <button
                  id="quiz-completion-game-btn"
                  onClick={onGoToGame}
                  className="px-6 py-2.5 bg-white dark:bg-[#111A31] hover:bg-slate-50 dark:hover:bg-[#18223E] text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-[#282054] transition-colors flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95"
                >
                  <Award className="w-4 h-4 text-purple-500" />
                  <span>Play Game Challenges</span>
                </button>
              )}
            </div>
          </div>

          {/* =======================================================
              4. QUESTION BREAKDOWN & ANSWERS (EVERY QUESTION WITH USER CHOICE & CORRECT OPTION)
              ======================================================= */}
          <div className="bg-white dark:bg-[#0D1428] rounded-2xl border border-slate-200 dark:border-[#282054] p-5 sm:p-7 shadow-xs space-y-6">
            {/* Breakdown Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-200 dark:border-[#1E2640] pb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Question Breakdown & Answers
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleAllCollapsed}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#282054] bg-slate-50 dark:bg-[#111A31] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#18223E] flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  {allCollapsed ? (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Expand All</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Collapse All</span>
                    </>
                  )}
                </button>

                <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#111A31] text-xs font-mono font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#282054]">
                  {totalCorrect} of {QUIZ_QUESTIONS.length} Correct
                </span>
              </div>
            </div>

            {/* List of All Questions */}
            <div className="space-y-4">
              {QUIZ_QUESTIONS.map((q, idx) => {
                const userAnswerIdx = confirmedAnswers[idx];
                const isTimedOut = userAnswerIdx === -1;
                const isAnswered = userAnswerIdx !== null && userAnswerIdx !== undefined && !isTimedOut;
                const isCorrect = isAnswered && userAnswerIdx === q.correctIndex;
                const userAnswerText = isTimedOut
                  ? '(Timed out — No answer submitted)'
                  : isAnswered
                  ? q.options[userAnswerIdx]
                  : '(No answer selected)';
                const correctAnswerText = q.options[q.correctIndex];
                const isCollapsed = !!collapsedQuestions[idx];

                const difficultyLabel = q.difficulty === 'Easy' ? 'BASIC' : q.difficulty.toUpperCase();
                const pointsLabel = isCorrect ? '+3 pts' : isTimedOut ? '0 pts' : '-1 pt';

                return (
                  <div
                    key={q.id || idx}
                    className="rounded-2xl border border-slate-200 dark:border-[#1E2640] bg-white dark:bg-[#0D1428] p-4 sm:p-5 transition-all space-y-4 shadow-2xs"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Circular Number Badge: Green if correct, Red if wrong/timed out */}
                        <div
                          className={`w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                            isCorrect ? 'bg-emerald-600' : isTimedOut ? 'bg-amber-600' : 'bg-rose-600'
                          }`}
                        >
                          {idx + 1}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                              {difficultyLabel}
                            </span>
                            <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                              {q.question}
                            </span>
                            <span
                              className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                isCorrect
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                  : isTimedOut
                                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                              }`}
                            >
                              {pointsLabel}
                            </span>
                          </div>

                          {/* Solved / Incorrect status line */}
                          <div className="text-xs font-medium pt-0.5">
                            {isCorrect ? (
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold">✓ Solved Correctly</span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-500 dark:text-slate-400">Your Choice:</span>
                                <span className="font-mono font-semibold">{userAnswerText}</span>
                              </span>
                            ) : isTimedOut ? (
                              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold">⏱️ Timed Out (0 pts)</span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-500 dark:text-slate-400">No option submitted</span>
                              </span>
                            ) : (
                              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold">✕ Incorrect Answer (-1 pt)</span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-500 dark:text-slate-400">Your Choice:</span>
                                <span className="font-mono font-semibold">{userAnswerText}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Hide / Show toggle */}
                      <button
                        type="button"
                        onClick={() => toggleQuestionCollapse(idx)}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0 mt-0.5"
                      >
                        <span>{isCollapsed ? 'Show' : 'Hide'}</span>
                        {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Detailed Expanded View */}
                    {!isCollapsed && (
                      <div className="space-y-4 pt-1">
                        {/* QUESTION PROMPT Box */}
                        <div className="bg-slate-50 dark:bg-[#111A31] p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-[#1E2640] space-y-2">
                          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            QUESTION PROMPT:
                          </div>
                          <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
                            {q.question}
                          </p>
                          {q.visualTreeValues && q.visualTreeValues.length > 0 && (
                            <div className="mt-3 p-3 bg-white dark:bg-[#060817] rounded-lg border border-slate-200 dark:border-[#1E2640] text-center">
                              <TreeCanvas
                                root={buildTreeFromValues(q.visualTreeValues)}
                                width={380}
                                className="max-w-xs sm:max-w-sm mx-auto pointer-events-none"
                              />
                            </div>
                          )}
                        </div>

                        {/* Side-by-side Option Comparison Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* OPTION YOU CHOSE Box */}
                          <div
                            className={`rounded-xl p-4 border flex flex-col justify-between gap-3 ${
                              isCorrect
                                ? 'border-emerald-400 dark:border-emerald-500/70 bg-emerald-50/50 dark:bg-emerald-950/20'
                                : isTimedOut
                                ? 'border-amber-400 dark:border-amber-500/70 bg-amber-50/50 dark:bg-amber-950/20'
                                : 'border-rose-400 dark:border-rose-500/70 bg-rose-50/50 dark:bg-rose-950/20'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div
                                className={`flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider ${
                                  isCorrect
                                    ? 'text-emerald-800 dark:text-emerald-300'
                                    : isTimedOut
                                    ? 'text-amber-800 dark:text-amber-300'
                                    : 'text-rose-700 dark:text-rose-300'
                                }`}
                              >
                                {isCorrect ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                ) : isTimedOut ? (
                                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                )}
                                <span>OPTION YOU CHOSE</span>
                              </div>

                              {isCorrect ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-2xs">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>Correct Choice</span>
                                </span>
                              ) : isTimedOut ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-600 text-white shadow-2xs">
                                  ⏱️ Timed Out
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white shadow-2xs">
                                  ✕ Incorrect
                                </span>
                              )}
                            </div>

                            <div className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-white leading-relaxed">
                              {userAnswerText}
                            </div>
                          </div>

                          {/* OPTION WHICH IS CORRECT Box */}
                          <div className="rounded-xl p-4 border border-emerald-400 dark:border-emerald-500/70 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col justify-between gap-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-emerald-800 dark:text-emerald-300">
                                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                                <span>OPTION WHICH IS CORRECT</span>
                              </div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-2xs">
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Correct Answer</span>
                              </span>
                            </div>

                            <div className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-white leading-relaxed">
                              {correctAnswerText}
                            </div>
                          </div>
                        </div>

                        {/* WHY THIS OPTION IS CORRECT Box */}
                        <div className="rounded-xl p-4 sm:p-5 border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/25 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-slate-700 dark:text-slate-300">
                            <span className="text-amber-500 text-base leading-none">💡</span>
                            <span>WHY THIS OPTION IS CORRECT:</span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                            {q.explanation}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
