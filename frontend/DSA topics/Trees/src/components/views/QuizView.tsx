import React, { useState, useEffect, useRef } from 'react';
import { QUIZ_QUESTIONS, TREE_TOPICS } from '../../data/treeData';
import { TopicId, QuizQuestion } from '../../types';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  Clock,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { getActiveUserId, getUserStorageKey } from '../../utils/userStorage';

export interface QuizSavedState {
  currentQuestionIndex: number;
  userAnswers: Record<string, number>;
  confirmedQuestions: Record<string, boolean>;
  questionTimeouts?: Record<string, boolean>;
  hintsUsed?: Record<string, boolean>;
  guidedSolveUsed?: Record<string, boolean>;
  submitted: boolean;
  hasStarted?: boolean;
}

// In-memory cache isolated per user ID ensures zero cross-user leakage
const inMemoryQuizStateMap = new Map<string, QuizSavedState>();

export const loadSavedQuizState = (userId?: string): QuizSavedState | null => {
  const effectiveUserId = userId || getActiveUserId();
  if (inMemoryQuizStateMap.has(effectiveUserId)) {
    return inMemoryQuizStateMap.get(effectiveUserId)!;
  }
  try {
    const storageKey = getUserStorageKey(effectiveUserId, 'quiz_state');
    const raw = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      inMemoryQuizStateMap.set(effectiveUserId, parsed);
      return parsed;
    }
  } catch {}
  return null;
};

export const saveQuizState = (state: QuizSavedState, userId?: string) => {
  const effectiveUserId = userId || getActiveUserId();
  inMemoryQuizStateMap.set(effectiveUserId, state);
  try {
    const storageKey = getUserStorageKey(effectiveUserId, 'quiz_state');
    const serialized = JSON.stringify(state);
    sessionStorage.setItem(storageKey, serialized);
    localStorage.setItem(storageKey, serialized);
  } catch {}
};

export const clearSavedQuizState = (userId?: string) => {
  const effectiveUserId = userId || getActiveUserId();
  inMemoryQuizStateMap.delete(effectiveUserId);
  try {
    const storageKey = getUserStorageKey(effectiveUserId, 'quiz_state');
    sessionStorage.removeItem(storageKey);
    localStorage.removeItem(storageKey);
  } catch {}
};

// Points Configuration:
// - 14 questions
// - Correct answer: +5 points
// - Incorrect answer: −2 points
// - Unanswered question or timeout: 0 points
// - Maximum available quiz points: 70
export const QUESTION_TIME_LIMIT = 20; // 20-second countdown timer for each question
export const POINTS_CORRECT = 5;
export const PENALTY_INCORRECT = 2;
export const MAX_QUIZ_POINTS = 70; // 14 * 5 = 70

/**
 * Calculates points for a single question strictly once:
 * - Unconfirmed: 0 pts
 * - Timed out (time expired): −2 pts (treated as wrong question)
 * - Correct: +5 pts
 * - Incorrect: −2 pts
 */
export const calculateQuestionPoints = (
  qId: string,
  confirmedQuestions: Record<string, boolean>,
  questionTimeouts: Record<string, boolean>,
  userAnswers: Record<string, number>
): number => {
  const q = QUIZ_QUESTIONS.find((item) => item.id === qId);
  if (!q || !confirmedQuestions[qId]) return 0;
  // If timed out: automatically penalize as a wrong question (-2 pts)
  if (questionTimeouts[qId]) return -PENALTY_INCORRECT;
  if (userAnswers[qId] === undefined) return 0;
  if (userAnswers[qId] === q.correctAnswerIndex) return POINTS_CORRECT;
  return -PENALTY_INCORRECT;
};

/**
 * Calculates total quiz points across all 14 questions:
 * Evaluated strictly once per question. Max: 70 points, non-negative.
 */
export const calculateTotalQuizPoints = (
  confirmedQuestions: Record<string, boolean>,
  questionTimeouts: Record<string, boolean>,
  userAnswers: Record<string, number>
): number => {
  let total = 0;
  QUIZ_QUESTIONS.forEach((q) => {
    total += calculateQuestionPoints(q.id, confirmedQuestions, questionTimeouts, userAnswers);
  });
  return Math.min(MAX_QUIZ_POINTS, total);
};

interface QuizViewProps {
  isDarkMode: boolean;
  userId?: string;
  onUpdateQuizScore?: (score: number, total: number) => void;
  onUpdateQuizProgress?: (completed: number, total: number) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  isDarkMode,
  userId,
  onUpdateQuizScore,
  onUpdateQuizProgress
}) => {
  const effectiveUserId = userId || getActiveUserId();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(() => {
    const saved = loadSavedQuizState(effectiveUserId);
    if (typeof saved?.currentQuestionIndex === 'number') {
      return Math.max(0, Math.min(QUIZ_QUESTIONS.length - 1, saved.currentQuestionIndex));
    }
    return 0;
  });

  const [userAnswers, setUserAnswers] = useState<Record<string, number>>(() => {
    const saved = loadSavedQuizState(effectiveUserId);
    return saved?.userAnswers ?? {};
  });

  const [confirmedQuestions, setConfirmedQuestions] = useState<Record<string, boolean>>(() => {
    const saved = loadSavedQuizState(effectiveUserId);
    return saved?.confirmedQuestions ?? {};
  });

  const [questionTimeouts, setQuestionTimeouts] = useState<Record<string, boolean>>(() => {
    const saved = loadSavedQuizState(effectiveUserId);
    return saved?.questionTimeouts ?? {};
  });

  const [submitted, setSubmitted] = useState<boolean>(() => {
    const saved = loadSavedQuizState(effectiveUserId);
    return Boolean(saved?.submitted);
  });

  const [hasStarted, setHasStarted] = useState<boolean>(() => {
    const saved = loadSavedQuizState(effectiveUserId);
    if (saved?.hasStarted !== undefined) return saved.hasStarted;
    // If the user already answered any question or submitted, they have already started
    if (saved && (Object.keys(saved.userAnswers || {}).length > 0 || Object.keys(saved.confirmedQuestions || {}).length > 0 || saved.submitted)) {
      return true;
    }
    return false;
  });

  // 20-second countdown timer for current question
  const [timeLeft, setTimeLeft] = useState<number>(QUESTION_TIME_LIMIT);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalQuestions = QUIZ_QUESTIONS.length;
  const currentQ = QUIZ_QUESTIONS[currentQuestionIndex] || QUIZ_QUESTIONS[0];
  const selectedAnswer = userAnswers[currentQ?.id];
  const isCurrentConfirmed = Boolean(confirmedQuestions[currentQ?.id]);
  const isCurrentTimedOut = Boolean(questionTimeouts[currentQ?.id]);
  const answeredCount = Object.keys(confirmedQuestions).length;

  // Active 20-second countdown timer effect
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Timer runs only when quiz has started, question is unconfirmed, not timed out, and not submitted
    if (!hasStarted || isCurrentConfirmed || isCurrentTimedOut || submitted) {
      return;
    }

    const targetQId = currentQ.id;
    setTimeLeft(QUESTION_TIME_LIMIT);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          // Question timed out: automatically mark as timeout (treated as wrong question: -2 pts)
          setQuestionTimeouts((old) => ({ ...old, [targetQId]: true }));
          setConfirmedQuestions((old) => ({ ...old, [targetQId]: true }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentQuestionIndex, hasStarted, isCurrentConfirmed, isCurrentTimedOut, submitted, currentQ?.id]);

  // Persist state to storage
  useEffect(() => {
    saveQuizState({
      currentQuestionIndex,
      userAnswers,
      confirmedQuestions,
      questionTimeouts,
      submitted,
      hasStarted
    }, effectiveUserId);
  }, [currentQuestionIndex, userAnswers, confirmedQuestions, questionTimeouts, submitted, hasStarted, effectiveUserId]);

  // Sync progress & scores to parent and storage
  useEffect(() => {
    if (onUpdateQuizProgress) {
      onUpdateQuizProgress(answeredCount, totalQuestions);
    }
  }, [answeredCount, totalQuestions, onUpdateQuizProgress]);

  useEffect(() => {
    if (onUpdateQuizScore) {
      const pts = calculateTotalQuizPoints(confirmedQuestions, questionTimeouts, userAnswers);
      onUpdateQuizScore(pts, MAX_QUIZ_POINTS);
    }
  }, [confirmedQuestions, userAnswers, questionTimeouts, onUpdateQuizScore]);

  const handleSelectOption = (optionIndex: number) => {
    if (submitted || isCurrentConfirmed || isCurrentTimedOut) return;
    if (!hasStarted) {
      setHasStarted(true);
    }
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex
    }));
  };

  // Triggered when 20s time limit expires (treated as wrong question, -2 points)
  const handleTimeExpired = () => {
    if (isCurrentConfirmed || isCurrentTimedOut) return;
    const qId = currentQ.id;
    setQuestionTimeouts((prev) => ({ ...prev, [qId]: true }));
    setConfirmedQuestions((prev) => ({ ...prev, [qId]: true }));
  };

  // Triggered when student clicks Submit Answer (+5 or -2 points evaluated once)
  const handleConfirmAnswer = () => {
    if (selectedAnswer === undefined || isCurrentConfirmed || isCurrentTimedOut) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const qId = currentQ.id;
    setConfirmedQuestions((prev) => ({ ...prev, [qId]: true }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setSubmitted(true);
      if (onUpdateQuizScore) {
        onUpdateQuizScore(calculateTotalQuizPoints(confirmedQuestions, questionTimeouts, userAnswers), MAX_QUIZ_POINTS);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleStartQuiz = () => {
    setHasStarted(true);
    setTimeLeft(QUESTION_TIME_LIMIT);
  };

  const handleRetakeQuiz = () => {
    clearSavedQuizState(effectiveUserId);
    setUserAnswers({});
    setConfirmedQuestions({});
    setQuestionTimeouts({});
    setSubmitted(false);
    setHasStarted(false);
    setCurrentQuestionIndex(0);
    setTimeLeft(QUESTION_TIME_LIMIT);
    if (onUpdateQuizScore) {
      onUpdateQuizScore(0, MAX_QUIZ_POINTS);
    }
    if (onUpdateQuizProgress) {
      onUpdateQuizProgress(0, totalQuestions);
    }
  };

  const handleFinishEarly = () => {
    setSubmitted(true);
    if (onUpdateQuizScore) {
      onUpdateQuizScore(calculateTotalQuizPoints(confirmedQuestions, questionTimeouts, userAnswers), MAX_QUIZ_POINTS);
    }
  };

  const isCorrect = selectedAnswer !== undefined && selectedAnswer === currentQ?.correctAnswerIndex;
  const currentTopicMeta = TREE_TOPICS.find((t) => t.id === currentQ.topicId);

  // Statistics for completion view
  const totalEarnedPoints = calculateTotalQuizPoints(confirmedQuestions, questionTimeouts, userAnswers);
  let correctCount = 0;
  let incorrectCount = 0;

  QUIZ_QUESTIONS.forEach((q) => {
    if (confirmedQuestions[q.id]) {
      if (questionTimeouts[q.id]) {
        // Timed out: treated as a wrong question (-2 pts)
        incorrectCount++;
      } else if (userAnswers[q.id] === undefined) {
        // Unanswered
      } else if (userAnswers[q.id] === q.correctAnswerIndex) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    }
  });

  return (
    <div className="max-w-3xl mx-auto space-y-4 py-2">
      {/* 1. Knowledge Assessment Card - Tree Knowledge Check */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border transition-all duration-200 ${
          isDarkMode
            ? 'bg-[#0a1020] border-blue-900/40 text-slate-100 shadow-xl shadow-blue-950/20'
            : 'bg-white border-slate-200/80 text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.02)]'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                isDarkMode
                  ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400'
                  : 'bg-[#e8f7f0] border-[#bbf0d8] text-[#059669]'
              }`}
            >
              <HelpCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <h1
              id="quiz-header-title"
              style={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}
              className={`text-lg sm:text-xl font-black tracking-tight ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}
            >
              Tree Knowledge Check
            </h1>
          </div>

          {/* Question counter pill on the right as shown in reference */}
          {!submitted && (
            <div
              className={`px-3.5 py-1.5 rounded-xl border text-xs sm:text-[13px] font-mono font-semibold shrink-0 ${
                isDarkMode
                  ? 'bg-[#0e172a] border-blue-900/50 text-slate-300'
                  : 'bg-slate-100 border-slate-300 text-slate-800'
              }`}
            >
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </div>
          )}
        </div>

        <p className={`text-xs sm:text-sm mt-2 font-normal leading-relaxed ${
          isDarkMode ? 'text-slate-400' : 'text-slate-600'
        }`}>
          Test your understanding of tree data structures, their properties, insertion, deletion, and traversal techniques.
        </p>
      </div>

      {/* VIEW A: Quiz In-Progress Mode */}
      {!submitted && (
        <>
          {/* 2. Scoring Rules Box with Start Quiz option */}
          <div
            className={`px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl border flex items-center justify-between flex-wrap gap-3 ${
              isDarkMode
                ? 'bg-[#231b09]/70 border-amber-600/40 text-amber-200 shadow-sm'
                : 'bg-amber-50/90 border-amber-300 text-amber-900 shadow-xs'
            }`}
          >
            <div className="flex items-center flex-wrap gap-y-1 text-xs sm:text-[13px] font-bold">
              <span>Correct answer: +5 points</span>
              <span className="mx-2 sm:mx-3 text-amber-400 select-none font-normal">|</span>
              <span>Incorrect answer: -2 points</span>
            </div>

            {/* Start Quiz button / In-Progress status */}
            <div className="flex items-center gap-3 ml-auto">
              {!hasStarted ? (
                <button
                  id="btn-start-quiz"
                  onClick={handleStartQuiz}
                  className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Start Quiz
                </button>
              ) : (
                <span className="text-[11px] font-semibold font-mono px-2.5 py-1 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-600 dark:text-blue-300">
                  Active
                </span>
              )}
            </div>
          </div>

          {/* 3. Slim Horizontal Progress Bar */}
          <div
            className={`w-full h-1.5 rounded-full overflow-hidden ${
              isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
            }`}
          >
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${Math.max(4, Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100))}%`
              }}
            />
          </div>

          {/* 4. Question Navigation Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto py-1 scrollbar-none">
            {QUIZ_QUESTIONS.map((q, idx) => {
              const isCurrent = idx === currentQuestionIndex;
              const isConfirmed = Boolean(confirmedQuestions[q.id]);
              const isTimedOut = Boolean(questionTimeouts[q.id]);
              const isAnsCorrect = userAnswers[q.id] === q.correctAnswerIndex;

              let btnStyle = '';

              if (isCurrent) {
                btnStyle = isDarkMode
                  ? 'bg-blue-600 text-white font-bold border border-blue-500 shadow-sm ring-2 ring-blue-500/40'
                  : 'bg-blue-600 text-white font-bold border border-blue-600 shadow-sm ring-2 ring-blue-400/30';
              } else if (isConfirmed) {
                if (isTimedOut) {
                  btnStyle = isDarkMode
                    ? 'bg-rose-950/40 border border-rose-600/70 text-rose-200 font-semibold'
                    : 'bg-rose-50 border border-rose-300 text-rose-800 font-semibold';
                } else if (isAnsCorrect) {
                  btnStyle = isDarkMode
                    ? 'bg-emerald-950/40 border border-emerald-600/60 text-emerald-300 font-semibold'
                    : 'bg-emerald-50 border border-emerald-300 text-emerald-800 font-semibold';
                } else {
                  btnStyle = isDarkMode
                    ? 'bg-rose-950/40 border border-rose-600/60 text-rose-300 font-semibold'
                    : 'bg-rose-50 border border-rose-300 text-rose-800 font-semibold';
                }
              } else {
                btnStyle = isDarkMode
                  ? 'bg-[#0f172a] text-slate-400 border border-blue-950/70 hover:border-blue-600/60 hover:text-slate-200'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 shadow-xs';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => handleJumpToQuestion(idx)}
                  className={`min-w-[38px] px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-center cursor-pointer shrink-0 ${btnStyle}`}
                  title={`Question ${idx + 1}: ${
                    isConfirmed
                      ? isTimedOut
                        ? 'Timed Out (-2 pts)'
                        : isAnsCorrect
                        ? 'Correct (+5 pts)'
                        : 'Incorrect (-2 pts)'
                      : 'Not Answered'
                  }`}
                >
                  Q{idx + 1}
                </button>
              );
            })}
          </div>

          {/* 5. Single Question Card */}
          {currentQ && (
            <div
              className={`p-6 sm:p-8 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
                isDarkMode
                  ? 'bg-[#0a1020] border-blue-900/40 text-slate-100 shadow-xl shadow-blue-950/20'
                  : 'bg-white border-slate-200/90 text-slate-900 shadow-md shadow-slate-200/60'
              }`}
            >
              {/* Card Top Meta & 20s Countdown Timer */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                    isDarkMode
                      ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    ★ {currentTopicMeta?.difficulty === 'Intermediate' ? 'INTERMEDIATE LEVEL' : currentTopicMeta?.difficulty === 'Advanced' ? 'ADVANCED LEVEL' : 'BASIC LEVEL'}
                  </span>
                </div>

                {/* Live Countdown Timer Badge during question answering */}
                {!isCurrentConfirmed && hasStarted && (
                  <span
                    className={`text-xs font-bold font-mono flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                      timeLeft <= 5
                        ? 'bg-rose-500/20 border-rose-500 text-rose-500 animate-pulse font-extrabold'
                        : isDarkMode
                        ? 'bg-[#151c2e] border-amber-500/40 text-amber-300'
                        : 'bg-amber-50 border-amber-300 text-amber-800'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timeLeft} seconds</span>
                  </span>
                )}

                {/* Result Badge shown only once confirmed */}
                {isCurrentConfirmed && (
                  <span
                    className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                      isCurrentTimedOut
                        ? isDarkMode
                          ? 'bg-rose-950/60 border-rose-600/70 text-rose-300'
                          : 'bg-rose-100 border-rose-300 text-rose-800'
                        : isCorrect
                        ? isDarkMode
                          ? 'bg-emerald-950/60 border-emerald-600 text-emerald-400'
                          : 'bg-emerald-50 border-emerald-400 text-emerald-800'
                        : isDarkMode
                        ? 'bg-rose-950/60 border-rose-600 text-rose-400'
                        : 'bg-rose-50 border-rose-400 text-rose-800'
                    }`}
                  >
                    {isCurrentTimedOut ? (
                      <>
                        <Clock className="w-4 h-4" /> timeout (-2 pts)
                      </>
                    ) : isCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Correct (+5 pts)
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" /> Incorrect (-2 pts)
                      </>
                    )}
                  </span>
                )}
              </div>

              {/* Question Title */}
              <h3 className="text-base sm:text-lg font-bold mb-5 leading-relaxed text-slate-900 dark:text-white">
                {currentQ.question}
              </h3>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = selectedAnswer === optIdx;
                  let optionStyle = isDarkMode
                    ? 'bg-[#091122] border-blue-950/70 text-slate-200 hover:border-blue-500/50'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-blue-300 hover:bg-blue-50/40 shadow-xs';

                  if (isSelected && !isCurrentConfirmed) {
                    optionStyle = isDarkMode
                      ? 'bg-blue-600/25 border-blue-500 text-white font-bold ring-1 ring-blue-500/40'
                      : 'bg-blue-50 border-blue-500 text-blue-950 font-bold ring-1 ring-blue-500/40';
                  }

                  // Coloring rule:
                  // If chosen correct answer -> make that option choice GREEN
                  // If chosen wrong answer -> make that option choice RED
                  // If wrong -> DO NOT show or reveal the correct answer!
                  if (isCurrentConfirmed) {
                    if (isSelected && isCorrect) {
                      // Selected and Correct -> GREEN
                      optionStyle = isDarkMode
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold ring-1 ring-emerald-500/50'
                        : 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-1 ring-emerald-400/40';
                    } else if (isSelected && !isCorrect) {
                      // Selected and Incorrect -> RED
                      optionStyle = isDarkMode
                        ? 'bg-rose-950/60 border-rose-500 text-rose-200 font-semibold ring-1 ring-rose-500/50'
                        : 'bg-rose-50 border-rose-500 text-rose-900 font-semibold ring-1 ring-rose-400/40';
                    } else {
                      // All other options remain unrevealed
                      optionStyle = isDarkMode
                        ? 'bg-[#091122]/40 border-blue-950/40 text-slate-500 opacity-60'
                        : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={isCurrentConfirmed || isCurrentTimedOut}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${optionStyle} ${
                        isCurrentConfirmed ? 'cursor-default' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-mono font-bold shrink-0">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>

                      {/* Only reveal checkmark if the user got it right */}
                      {isCurrentConfirmed && isSelected && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                      )}
                      {/* Show red X on incorrect choice */}
                      {isCurrentConfirmed && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Box on Confirmation - When correct */}
              {isCurrentConfirmed && isCorrect && (
                <div
                  className={`mt-6 p-4 rounded-2xl border text-xs leading-relaxed ${
                    isDarkMode
                      ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  }`}
                >
                  <span className={`font-bold uppercase tracking-wider block mb-1 ${
                    isDarkMode ? 'text-emerald-400' : 'text-emerald-800'
                  }`}>
                    💡 Explanation
                  </span>
                  <p>{currentQ.explanation}</p>
                </div>
              )}

              {/* Explanation Box on Confirmation - When incorrect (minus two points + explanation, without revealing answer) */}
              {isCurrentConfirmed && !isCorrect && !isCurrentTimedOut && (
                <div
                  className={`mt-6 p-4 rounded-2xl border text-xs leading-relaxed ${
                    isDarkMode
                      ? 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                      : 'bg-rose-50/70 border-rose-200 text-rose-950'
                  }`}
                >
                  <span className={`font-bold uppercase tracking-wider block mb-1 text-rose-500`}>
                    💡 Explanation (-2 pts)
                  </span>
                  <p className="leading-relaxed">{currentQ.explanation}</p>
                </div>
              )}

              {/* Explanation Box on Confirmation - When timed out (timeout minus two points + explanation, without revealing answer) */}
              {isCurrentConfirmed && isCurrentTimedOut && (
                <div
                  className={`mt-6 p-4 rounded-2xl border text-xs leading-relaxed ${
                    isDarkMode
                      ? 'bg-rose-950/25 border-rose-900/50 text-rose-300'
                      : 'bg-rose-50/70 border-rose-200 text-rose-950'
                  }`}
                >
                  <span className="font-bold uppercase tracking-wider block mb-1 text-rose-500">
                    💡 timeout (-2 pts) — Explanation
                  </span>
                  <p className="leading-relaxed">{currentQ.explanation}</p>
                </div>
              )}

              {/* Navigation & Action Controls Row */}
              <div className="mt-8 pt-2 flex items-center justify-between gap-3">
                {/* Left: Previous Button only */}
                <div>
                  <button
                    id="quiz-prev-btn"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                      currentQuestionIndex > 0
                        ? isDarkMode
                          ? 'bg-[#141b2d] hover:bg-[#1c2740] text-slate-200 border border-blue-900/40 cursor-pointer'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-xs cursor-pointer'
                        : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Prev</span>
                  </button>
                </div>

                {/* Right: Submit Answer / Next Button */}
                <div className="flex items-center gap-2.5">
                  {!isCurrentConfirmed ? (
                    <button
                      id="quiz-confirm-btn"
                      onClick={handleConfirmAnswer}
                      disabled={selectedAnswer === undefined}
                      className={`flex items-center gap-2 px-6 sm:px-7 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md ${
                        selectedAnswer !== undefined
                          ? isDarkMode
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40 ring-1 ring-blue-400/50 cursor-pointer hover:scale-[1.02]'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30 cursor-pointer hover:scale-[1.02]'
                          : isDarkMode
                          ? 'bg-[#141b2d]/60 text-slate-500 border border-blue-950/40 cursor-not-allowed opacity-60'
                          : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <span>Submit Answer</span>
                    </button>
                  ) : (
                    <button
                      id="quiz-next-btn"
                      onClick={handleNext}
                      className={`flex items-center gap-2 px-6 sm:px-7 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer hover:scale-[1.02] ${
                        isDarkMode
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40 ring-1 ring-blue-400/50'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30'
                      }`}
                    >
                      <span>
                        {currentQuestionIndex === totalQuestions - 1 ? 'Finish Assessment' : 'Next Question'}
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* VIEW B: Quiz Completed Mode */}
      {/* After completion of the quiz, every question contains correct answer, answer the user chose, and explanation */}
      {submitted && (
        <div className="space-y-6">
          {/* Assessment Summary Card */}
          <div
            className={`p-6 sm:p-7 rounded-2xl border transition-all duration-200 ${
              isDarkMode
                ? 'bg-[#0a1020] border-blue-900/40 text-slate-100 shadow-xl shadow-blue-950/20'
                : 'bg-white border-slate-200/90 text-slate-900 shadow-md shadow-slate-200/60'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                    isDarkMode
                      ? 'bg-blue-950/60 border-blue-700/60 text-blue-400'
                      : 'bg-blue-50 border-blue-200 text-blue-600'
                  }`}
                >
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Assessment Completed
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    All {totalQuestions} questions evaluated with live algorithmic explanations.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Total Score
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
                    {totalEarnedPoints} / {MAX_QUIZ_POINTS} pts
                  </div>
                </div>

                <button
                  onClick={handleRetakeQuiz}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isDarkMode
                      ? 'bg-[#0e172a] hover:bg-[#162238] text-slate-200 border-blue-900/50'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                  }`}
                  title="Retake Quiz"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>
              </div>
            </div>

            {/* Score Breakdown Pills */}
            <div className="grid grid-cols-3 gap-3 pt-4">
              <div
                className={`p-3 rounded-xl border text-center ${
                  isDarkMode
                    ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                }`}
              >
                <div className="text-xs font-semibold">Correct</div>
                <div className="text-lg sm:text-xl font-black mt-0.5">
                  {correctCount} <span className="text-xs font-normal opacity-80">(+{correctCount * POINTS_CORRECT} pts)</span>
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border text-center ${
                  isDarkMode
                    ? 'bg-rose-950/30 border-rose-900/50 text-rose-300'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}
              >
                <div className="text-xs font-semibold">Incorrect</div>
                <div className="text-lg sm:text-xl font-black mt-0.5">
                  {incorrectCount} <span className="text-xs font-normal opacity-80">(-{incorrectCount * PENALTY_INCORRECT} pts)</span>
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border text-center ${
                  isDarkMode
                    ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                    : 'bg-slate-50 border-slate-300 text-slate-700'
                }`}
              >
                <div className="text-xs font-semibold">Unanswered</div>
                <div className="text-lg sm:text-xl font-black mt-0.5">
                  {totalQuestions - (correctCount + incorrectCount)} <span className="text-xs font-normal opacity-80">(0 pts)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span>Question-by-Question Review</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {totalQuestions} questions reviewed
              </span>
            </div>

            {QUIZ_QUESTIONS.map((q, qIndex) => {
              const userChoice = userAnswers[q.id];
              const isConfirmed = Boolean(confirmedQuestions[q.id]);
              const isTimedOut = Boolean(questionTimeouts[q.id]);
              const hasAnswered = isConfirmed && userChoice !== undefined && !isTimedOut;
              const isUserCorrect = hasAnswered && userChoice === q.correctAnswerIndex;
              const isUserWrong = (hasAnswered && userChoice !== q.correctAnswerIndex) || isTimedOut;
              const qTopicMeta = TREE_TOPICS.find((t) => t.id === q.topicId);

              const selectedOptionLetter = hasAnswered ? String.fromCharCode(65 + userChoice!) : '';
              const selectedOptionText = hasAnswered ? q.options[userChoice!] : '';
              const correctOptionLetter = String.fromCharCode(65 + q.correctAnswerIndex);
              const correctOptionText = q.options[q.correctAnswerIndex];

              return (
                <div
                  key={q.id}
                  className={`p-5 sm:p-6 rounded-2xl border transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-[#0a1020] border-blue-900/40 text-slate-100 shadow-md'
                      : 'bg-white border-slate-200/90 text-slate-900 shadow-xs'
                  }`}
                >
                  {/* Question Header: Number, ID, Difficulty, and Result Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                        isDarkMode
                          ? 'bg-slate-800 text-slate-300 border-slate-700'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        Question {qIndex + 1} of {totalQuestions}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider border ${
                        isDarkMode
                          ? 'bg-blue-950/40 text-blue-300 border-blue-800/50'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {q.id.toUpperCase()}
                      </span>
                      {qTopicMeta && (
                        <span className={`hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                          isDarkMode
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {qTopicMeta.difficulty || 'BASIC'}
                        </span>
                      )}
                    </div>

                    {/* Result Badge */}
                    <div>
                      {isUserCorrect ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          isDarkMode
                            ? 'bg-emerald-950/60 border-emerald-600 text-emerald-400'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        }`}>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Correct (+5 pts)
                        </span>
                      ) : isTimedOut ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          isDarkMode
                            ? 'bg-rose-950/60 border-rose-600 text-rose-400'
                            : 'bg-rose-50 border-rose-300 text-rose-800'
                        }`}>
                          <Clock className="w-4 h-4 text-rose-500" />
                          timeout (-2 pts)
                        </span>
                      ) : hasAnswered && isUserWrong ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          isDarkMode
                            ? 'bg-rose-950/60 border-rose-600 text-rose-400'
                            : 'bg-rose-50 border-rose-300 text-rose-800'
                        }`}>
                          <XCircle className="w-4 h-4 text-rose-500" />
                          Incorrect (-2 pts)
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          isDarkMode
                            ? 'bg-slate-800 border-slate-700 text-slate-400'
                            : 'bg-slate-100 border-slate-300 text-slate-600'
                        }`}>
                          <HelpCircle className="w-4 h-4 text-slate-500" />
                          Unanswered (0 pts)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <h4 className="text-base sm:text-lg font-bold mb-4 leading-relaxed text-slate-900 dark:text-white">
                    {q.question}
                  </h4>

                  {/* Side-by-Side: Your Answer (Left) vs Correct Answer (Right) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 mb-4">
                    {/* Left Card: Your Answer */}
                    <div
                      className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                        isTimedOut
                          ? isDarkMode
                            ? 'bg-rose-950/35 border-rose-600/70 text-rose-100'
                            : 'bg-rose-50/90 border-rose-300 text-rose-950'
                          : !hasAnswered
                          ? isDarkMode
                            ? 'bg-[#121829] border-slate-800 text-slate-300'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                          : isUserCorrect
                          ? isDarkMode
                            ? 'bg-emerald-950/35 border-emerald-600/70 text-emerald-100'
                            : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                          : isDarkMode
                          ? 'bg-rose-950/35 border-rose-600/70 text-rose-100'
                          : 'bg-rose-50/90 border-rose-300 text-rose-950'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-black/5 dark:border-white/5">
                          <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                            isTimedOut
                              ? 'text-rose-700 dark:text-rose-300'
                              : !hasAnswered
                              ? 'text-slate-500 dark:text-slate-400'
                              : isUserCorrect
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-rose-700 dark:text-rose-300'
                          }`}>
                            {isUserCorrect ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : isTimedOut ? (
                              <Clock className="w-3.5 h-3.5 text-rose-500" />
                            ) : hasAnswered ? (
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            ) : (
                              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            Your Answer
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              isTimedOut
                                ? 'bg-rose-200/80 dark:bg-rose-900/60 text-rose-900 dark:text-rose-300 border border-rose-400/40'
                                : !hasAnswered
                                ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                : isUserCorrect
                                ? 'bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300 border border-emerald-400/40'
                                : 'bg-rose-200/80 dark:bg-rose-900/60 text-rose-900 dark:text-rose-300 border border-rose-400/40'
                            }`}
                          >
                            {isTimedOut ? 'timeout' : !hasAnswered ? 'Unanswered' : isUserCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>

                        <div className="pt-1">
                          {isTimedOut ? (
                            <div className="flex items-start gap-2 text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 py-1">
                              <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                              <span>timeout (-2 pts)</span>
                            </div>
                          ) : hasAnswered ? (
                            <div className="flex items-start gap-2.5">
                              <span
                                className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 border mt-0.5 ${
                                  isUserCorrect
                                    ? 'bg-emerald-600 text-white border-emerald-500'
                                    : 'bg-rose-600 text-white border-rose-500'
                                }`}
                              >
                                {selectedOptionLetter}
                              </span>
                              <span className="text-sm font-semibold leading-snug">
                                {selectedOptionText}
                              </span>
                            </div>
                          ) : (
                            <div className="text-xs sm:text-sm font-medium italic opacity-75 py-1">
                              No answer selected for this question.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Card: Correct Answer */}
                    <div
                      className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                        isDarkMode
                          ? 'bg-emerald-950/25 border-emerald-700/60 text-emerald-100'
                          : 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-emerald-500/10 dark:border-emerald-500/20">
                          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Correct Answer
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300 border border-emerald-400/40">
                            Key
                          </span>
                        </div>

                        <div className="pt-1 flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 border mt-0.5 bg-emerald-600 text-white border-emerald-500">
                            {correctOptionLetter}
                          </span>
                          <span className="text-sm font-semibold leading-snug">
                            {correctOptionText}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Explanation Panel */}
                  <div
                    className={`p-4 sm:p-4.5 rounded-xl border text-xs sm:text-sm leading-relaxed ${
                      isDarkMode
                        ? 'bg-blue-950/25 border-blue-900/50 text-blue-100'
                        : 'bg-blue-50/75 border-blue-200 text-blue-950'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5 font-bold uppercase tracking-wider text-xs text-blue-600 dark:text-blue-400">
                      <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>Why this is correct</span>
                    </div>
                    <p className="leading-relaxed pl-6 text-xs sm:text-[13px] opacity-95">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Retake Button */}
          <div className="pt-2 pb-6 flex justify-center">
            <button
              onClick={handleRetakeQuiz}
              className={`flex items-center gap-2 px-7 py-3 rounded-2xl text-sm font-bold transition-all shadow-md cursor-pointer hover:scale-[1.02] ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40 ring-1 ring-blue-400/50'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-300/60'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Quiz Assessment</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
