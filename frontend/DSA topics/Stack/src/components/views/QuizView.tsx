import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Trophy,
  Star,
  Check,
  AlertCircle,
  Eye,
  Home,
  ShieldCheck,
  Clock,
  Timer,
  Play,
  X,
} from 'lucide-react';
import { QuizQuestion, UserProgress } from '../../types';
import { QUIZ_QUESTIONS } from '../../data/quizData';
import { soundEffects } from '../../services/sound';
import { awardXP } from '../../services/storage';
import { triggerPointsToast } from '../../services/pointsToast';

interface QuizViewProps {
  progress: UserProgress;
  onUpdateProgress: (updated: UserProgress | ((prev: UserProgress) => UserProgress)) => void;
  onNavigateHome?: () => void;
}

interface QuestionAnswerState {
  selectedOption: string | null;
  draggedOrder: string[];
  isSubmitted: boolean;
  isCorrect: boolean;
  isTimedOut?: boolean;
}

const QUESTION_TIME_LIMIT = 20; // Exactly 20 seconds time limit per question across all topics
const STACK_QUIZ_SESSION_KEY = 'stack_quiz_session_state';

export const QuizView: React.FC<QuizViewProps> = ({
  progress,
  onUpdateProgress,
  onNavigateHome,
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STACK_QUIZ_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.currentIdx === 'number' && parsed.currentIdx >= 0 && parsed.currentIdx < QUIZ_QUESTIONS.length) {
          return parsed.currentIdx;
        }
      }
    } catch {}
    return 0;
  });

  const [answers, setAnswers] = useState<Record<number, QuestionAnswerState>>(() => {
    try {
      const saved = localStorage.getItem(STACK_QUIZ_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers && typeof parsed.answers === 'object') {
          return parsed.answers;
        }
      }
    } catch {}
    // Restore any previously scored questions from progress
    const initial: Record<number, QuestionAnswerState> = {};
    const saved = progress.quizQuestionScores || {};
    Object.entries(saved).forEach(([qIdxStr, score]) => {
      const qIdx = Number(qIdxStr);
      initial[qIdx] = {
        selectedOption: null,
        draggedOrder: [],
        isSubmitted: true,
        isCorrect: score === 4,
        isTimedOut: score === 0,
      };
    });
    return initial;
  });
  const [timeLeft, setTimeLeft] = useState<number>(QUESTION_TIME_LIMIT);
  const [quizFinished, setQuizFinished] = useState<boolean>(() => {
    if (progress.quizCompleted) return true;
    try {
      const saved = localStorage.getItem(STACK_QUIZ_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.quizFinished === 'boolean') {
          return parsed.quizFinished;
        }
      }
    } catch {}
    return false;
  });
  const [resultFilter, setResultFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [isQuizStarted, setIsQuizStarted] = useState<boolean>(() => {
    if (progress.quizCompleted) return true;
    try {
      const saved = localStorage.getItem(STACK_QUIZ_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.isQuizStarted === 'boolean') {
          return parsed.isQuizStarted;
        }
      }
    } catch {}
    const saved = progress.quizQuestionScores || {};
    return Object.keys(saved).length > 0;
  });
  const [showStartWarning, setShowStartWarning] = useState<boolean>(false);

  // Synchronize quiz session state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STACK_QUIZ_SESSION_KEY,
        JSON.stringify({
          currentIdx,
          answers,
          isQuizStarted,
          quizFinished,
        })
      );
    } catch {}
  }, [currentIdx, answers, isQuizStarted, quizFinished]);

  const currentQ: QuizQuestion = QUIZ_QUESTIONS[currentIdx];
  const currentAnswerState = answers[currentIdx] || {
    selectedOption: null,
    draggedOrder: [],
    isSubmitted: false,
    isCorrect: false,
    isTimedOut: false,
  };

  // Auto-dismiss the start quiz warning toast after 4.5 seconds
  useEffect(() => {
    if (showStartWarning) {
      const timer = setTimeout(() => {
        setShowStartWarning(false);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [showStartWarning]);

  // Timer countdown per question
  useEffect(() => {
    if (quizFinished || currentAnswerState.isSubmitted) return;

    // Only start countdown for question 1 if user clicked Start Quiz
    if (!isQuizStarted && currentIdx === 0) {
      setTimeLeft(QUESTION_TIME_LIMIT);
      return;
    }

    setTimeLeft(QUESTION_TIME_LIMIT);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIdx, currentAnswerState.isSubmitted, quizFinished, isQuizStarted]);

  const handleStartQuiz = () => {
    soundEffects.playClick();
    setIsQuizStarted(true);
    setShowStartWarning(false);
  };

  // Timeout handler: 0 points awarded
  const handleTimeout = () => {
    if (currentAnswerState.isSubmitted) return;
    soundEffects.playError();

    setAnswers((prev) => ({
      ...prev,
      [currentIdx]: {
        selectedOption: null,
        draggedOrder: [],
        isSubmitted: true,
        isCorrect: false,
        isTimedOut: true,
      },
    }));

    // Award 0 points on timeout, update immediately
    const prevScores = progress.quizQuestionScores || {};
    const updatedScores = { ...prevScores, [currentIdx]: 0 };
    onUpdateProgress((prev) => ({
      ...prev,
      quizQuestionScores: updatedScores,
      quizTotalQuestionsAnswered: Math.max(prev.quizTotalQuestionsAnswered || 0, Object.keys(updatedScores).length),
    }));
  };

  // Initialize drag order or answer state if not yet set
  useEffect(() => {
    if (!answers[currentIdx]) {
      if (currentQ.type === 'drag-order' && Array.isArray(currentQ.options)) {
        const shuffled = [...currentQ.options].sort(() => Math.random() - 0.5);
        setAnswers((prev) => ({
          ...prev,
          [currentIdx]: {
            selectedOption: null,
            draggedOrder: shuffled,
            isSubmitted: false,
            isCorrect: false,
          },
        }));
      } else {
        setAnswers((prev) => ({
          ...prev,
          [currentIdx]: {
            selectedOption: null,
            draggedOrder: [],
            isSubmitted: false,
            isCorrect: false,
          },
        }));
      }
    }
  }, [currentIdx, currentQ]);

  const handleSelectOption = (opt: string) => {
    if (currentAnswerState.isSubmitted) return;
    soundEffects.playClick();
    setAnswers((prev) => ({
      ...prev,
      [currentIdx]: {
        ...(prev[currentIdx] || {
          draggedOrder: [],
          isSubmitted: false,
          isCorrect: false,
        }),
        selectedOption: opt,
      },
    }));
  };

  const handleDragReorder = (sourceIdx: number, targetIdx: number) => {
    if (currentAnswerState.isSubmitted) return;
    const currentList =
      currentAnswerState.draggedOrder.length > 0
        ? [...currentAnswerState.draggedOrder]
        : [...(currentQ.options || [])];
    const [moved] = currentList.splice(sourceIdx, 1);
    currentList.splice(targetIdx, 0, moved);

    setAnswers((prev) => ({
      ...prev,
      [currentIdx]: {
        ...(prev[currentIdx] || {
          selectedOption: null,
          isSubmitted: false,
          isCorrect: false,
        }),
        draggedOrder: currentList,
      },
    }));
  };

  const handleSubmitAnswer = () => {
    if (currentAnswerState.isSubmitted) return;

    // Must start quiz on question 1 before submitting
    if (!isQuizStarted && currentIdx === 0) {
      soundEffects.playError();
      setShowStartWarning(true);
      return;
    }

    soundEffects.playClick();

    let isCorrect = false;
    if (currentQ.type === 'drag-order') {
      const correctArr = currentQ.correctAnswer as string[];
      const order = currentAnswerState.draggedOrder;
      isCorrect =
        order.length === correctArr.length &&
        order.every((val, idx) => val === correctArr[idx]);
    } else {
      isCorrect = currentAnswerState.selectedOption === currentQ.correctAnswer;
    }

    if (isCorrect) {
      soundEffects.playSuccess();
      triggerPointsToast(4, 'Correct Answer');
    } else {
      soundEffects.playError();
      triggerPointsToast(-2, 'Incorrect Answer');
    }

    setAnswers((prev) => ({
      ...prev,
      [currentIdx]: {
        ...(prev[currentIdx] || {
          selectedOption: null,
          draggedOrder: [],
        }),
        isSubmitted: true,
        isCorrect,
        isTimedOut: false,
      },
    }));

    // Award +4 pts for correct, deduct 2 pts for wrong (-2 pts), scored only once
    const questionScore = isCorrect ? 4 : -2;
    const prevScores = progress.quizQuestionScores || {};
    const updatedScores = { ...prevScores, [currentIdx]: questionScore };

    onUpdateProgress((prev) => ({
      ...prev,
      quizQuestionScores: updatedScores,
      quizTotalQuestionsAnswered: Math.max(prev.quizTotalQuestionsAnswered || 0, Object.keys(updatedScores).length),
    }));
  };

  const handlePreviousQuestion = () => {
    if (currentIdx > 0) {
      soundEffects.playClick();
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleNextQuestion = () => {
    soundEffects.playClick();

    if (currentIdx + 1 < QUIZ_QUESTIONS.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    const scores = progress.quizQuestionScores || {};
    let totalScoreSum = 0;
    let totalCorrectCount = 0;
    QUIZ_QUESTIONS.forEach((_, idx) => {
      const s = scores[idx] ?? 0;
      totalScoreSum += s;
      if (s === 4) totalCorrectCount++;
    });
    const finalPoints = Math.min(40, totalScoreSum);
    const totalScorePercent = Math.round((totalCorrectCount / QUIZ_QUESTIONS.length) * 100);

    setQuizFinished(true);

    if (totalScorePercent >= 70) {
      soundEffects.playSuccess();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore
      }
    }

    if (!progress.quizCompleted) {
      const { updated } = awardXP(
        progress,
        finalPoints,
        'quiz_completed',
        'Quiz Completed',
        `Earned ${finalPoints} pts on Assessment`
      );

      onUpdateProgress({
        ...updated,
        quizCompleted: true,
        quizHighScore: Math.max(updated.quizHighScore, totalScorePercent),
      });
    }
  };

  const handleRestartQuiz = () => {
    soundEffects.playClick();
    try {
      localStorage.removeItem(STACK_QUIZ_SESSION_KEY);
    } catch {}
    setAnswers({});
    setCurrentIdx(0);
    setQuizFinished(false);
    setIsQuizStarted(true);
    setTimeLeft(QUESTION_TIME_LIMIT);
  };

  const handleReviewQuestions = () => {
    soundEffects.playClick();
    setCurrentIdx(0);
    setQuizFinished(false);
    setResultFilter('all');
    setIsQuizStarted(true);
  };

  // Compute live score stats
  const quizScores = progress.quizQuestionScores || {};
  let liveQuizSum = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalTimedOut = 0;

  QUIZ_QUESTIONS.forEach((_, idx) => {
    if (quizScores[idx] !== undefined) {
      liveQuizSum += quizScores[idx];
      if (quizScores[idx] === 4) totalCorrect++;
      else if (quizScores[idx] === -2) totalIncorrect++;
      else if (quizScores[idx] === 0) totalTimedOut++;
    }
  });

  const currentQuizPoints = Math.min(40, liveQuizSum);
  const totalAnswered = Object.keys(quizScores).length;
  const finalScorePercent = Math.round((totalCorrect / QUIZ_QUESTIONS.length) * 100);

  const filteredQuestions = QUIZ_QUESTIONS.filter((_, idx) => {
    const isCorrect = quizScores[idx] === 4;
    if (resultFilter === 'correct') return isCorrect;
    if (resultFilter === 'incorrect') return quizScores[idx] !== undefined && quizScores[idx] !== 4;
    return true;
  });

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* ─── 1. TOP HEADER & BADGE (EXACT STRUCTURE FROM REFERENCE IMAGE) ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200/80 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-mono text-[11px] font-bold tracking-wider uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>KNOWLEDGE ASSESSMENT</span>
          </span>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Simple Stack Quiz ({QUIZ_QUESTIONS.length} Questions)
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Stack Knowledge Check
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-3xl">
            Test your understanding of LIFO principle, stack operations (Push, Pop, Peek), overflow &amp; underflow, array vs linked list implementations, and complexity.
          </p>
        </div>
      </div>

      {/* ─── 2. QUIZ SCORING RULES CARD (EXACT AMBER CARD FROM IMAGE) ─── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs space-y-2.5">
        <div className="font-extrabold text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 fill-amber-500 text-amber-500" />
          <span>Quiz Scoring Rules:</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
          <div className="flex items-center gap-1.5">
            <span>Correct answer:</span>
            <span className="px-2 py-0.5 rounded-md font-bold font-mono bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800">
              +4 pts
            </span>
          </div>

          <span className="text-amber-300 dark:text-amber-700 hidden sm:inline">|</span>

          <div className="flex items-center gap-1.5">
            <span>Wrong answer:</span>
            <span className="px-2 py-0.5 rounded-md font-bold font-mono bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800">
              -2 pts
            </span>
          </div>

          <span className="text-amber-300 dark:text-amber-700 hidden sm:inline">|</span>

          <div className="flex items-center gap-1.5">
            <span>Timeout or unanswered:</span>
            <span className="px-2 py-0.5 rounded-md font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              0 pts
            </span>
          </div>

          <span className="text-amber-300 dark:text-amber-700 hidden sm:inline">|</span>
        </div>

        <div className="flex items-center gap-2 pt-0.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
          <span>Maximum positive Quiz score:</span>
          <span className="px-2.5 py-0.5 rounded-md font-bold font-mono bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            40 pts
          </span>
        </div>
      </div>

      {/* ─── 3. PROGRESS ROW & QUESTION BUTTONS (EXACT REFERENCE LAYOUT) ─── */}
      {!quizFinished && (
        <div className="space-y-3">
          {/* Progress label */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
            <span>
              Progress: <strong className="text-blue-600 dark:text-blue-400 font-bold">{totalAnswered}</strong> / {QUIZ_QUESTIONS.length} Answered
            </span>
          </div>

          {/* Question buttons Q1..Q10 in 1 row (grid of 10) */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {QUIZ_QUESTIONS.map((q, idx) => {
              const ans = answers[idx];
              const score = quizScores[idx];
              const isCurrent = idx === currentIdx;
              const isAnswered = ans?.isSubmitted || score !== undefined;

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    soundEffects.playClick();
                    setCurrentIdx(idx);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex flex-col items-center justify-center min-h-[44px] shadow-2xs ${
                    isCurrent
                      ? 'bg-blue-600 text-white border border-blue-500 shadow-sm'
                      : isAnswered
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  title={`Question ${idx + 1}`}
                >
                  <span>Q{idx + 1}</span>
                  {isAnswered && (
                    <span className="text-[10px] leading-tight font-black mt-0.5">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── FLOATING TOAST: START QUIZ REQUIRED (EXACT STYLE FROM IMAGE 2) ─── */}
      {showStartWarning && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in-95 duration-200 w-[92%] max-w-md">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200/90 dark:border-rose-900/80 shadow-2xl shadow-rose-500/10">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold shrink-0">
              <AlertCircle className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-1.5 flex-1 min-w-0 text-xs sm:text-sm">
              <span className="font-extrabold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                Please Start Quiz
              </span>
              <span className="text-slate-300 dark:text-slate-600">—</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                Click "Start Quiz" to begin Question 1
              </span>
            </div>
            <button
              onClick={() => setShowStartWarning(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
              aria-label="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Quiz Question Card */}
      {!quizFinished ? (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
          {/* ─── QUESTION HEADER BAR (EXACT REFERENCE FROM IMAGE 1) ─── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Left: Question 01 of 10 & STK-01 */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs shadow-2xs">
                  Question {String(currentIdx + 1).padStart(2, '0')} of {QUIZ_QUESTIONS.length}
                </span>
                <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                  STK-{String(currentIdx + 1).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 hidden sm:inline-block">
                  {currentQ.type.replace('-', ' ')}
                </span>
              </div>

              {/* Right: Quiz Score, Start Quiz Button (Q1 only when not started), Timer Badge */}
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                {/* Quiz Score Box */}
                <div className="px-3 py-1.5 rounded-lg font-mono text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700 shadow-2xs">
                  Quiz Score: <span className="font-bold text-blue-600 dark:text-blue-400">{currentQuizPoints}</span> / 40 pts
                </div>

                {/* Start Quiz Button (ONLY on Question 1, when quiz has not started and not submitted) */}
                {!isQuizStarted && currentIdx === 0 && !currentAnswerState.isSubmitted && (
                  <button
                    onClick={handleStartQuiz}
                    className="px-3.5 py-1.5 rounded-lg font-bold text-xs bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer animate-pulse"
                    id="start-quiz-button"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Quiz</span>
                  </button>
                )}

                {/* Timer Badge (Image 1 style) */}
                {!currentAnswerState.isSubmitted && (
                  <div
                    className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs ${
                      timeLeft <= 5 && isQuizStarted
                        ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 animate-pulse'
                        : 'bg-blue-50/70 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timeLeft}s</span>
                  </div>
                )}

                {/* Status Badge after evaluation */}
                {currentAnswerState.isSubmitted && (
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-lg border ${
                      currentAnswerState.isTimedOut
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                        : currentAnswerState.isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                        : 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-700'
                    }`}
                  >
                    {currentAnswerState.isTimedOut
                      ? '⏱ Time Expired (0 pts)'
                      : currentAnswerState.isCorrect
                      ? '✓ Correct (+4 pts)'
                      : '✕ Incorrect (-2 pts)'}
                  </span>
                )}
              </div>
            </div>

            {/* Subtle Divider Line from Image 1 */}
            <div className="border-b border-slate-100 dark:border-slate-800" />

            {/* Timer Progress Bar (active during timed question) */}
            {!currentAnswerState.isSubmitted && isQuizStarted && (
              <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    timeLeft <= 5 ? 'bg-rose-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${(timeLeft / QUESTION_TIME_LIMIT) * 100}%` }}
                />
              </div>
            )}

            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed whitespace-pre-line pt-1">
              {currentQ.question}
            </h2>
          </div>

          {/* Options (MCQ, True/False, Scenario, Predict Output) */}
          {currentQ.type !== 'drag-order' && currentQ.options && (
            <div className="space-y-3">
              {currentQ.options.map((opt) => {
                const isSelected = currentAnswerState.selectedOption === opt;
                const isCorrect = opt === currentQ.correctAnswer;

                let optClass =
                  'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200';

                if (currentAnswerState.isSubmitted) {
                  if (isCorrect) {
                    optClass =
                      'border-emerald-500 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-100 font-bold ring-2 ring-emerald-200 dark:ring-emerald-900/50';
                  } else if (isSelected && !isCorrect) {
                    optClass =
                      'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/70 text-red-950 dark:text-red-100 ring-2 ring-red-200 dark:ring-red-900/50';
                  } else {
                    optClass =
                      'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 opacity-60 text-slate-400 dark:text-slate-500';
                  }
                } else if (isSelected) {
                  optClass =
                    'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 font-bold ring-2 ring-blue-200 dark:ring-blue-900/50';
                }

                return (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption(opt)}
                    disabled={currentAnswerState.isSubmitted}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-3 text-xs sm:text-sm cursor-pointer ${optClass}`}
                  >
                    <span>{opt}</span>
                    {currentAnswerState.isSubmitted && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                    {currentAnswerState.isSubmitted && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Drag and Drop Chronological Order */}
          {currentQ.type === 'drag-order' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Drag cards to rearrange them into the correct chronological sequence:
              </p>

              <div className="space-y-2">
                {(currentAnswerState.draggedOrder.length > 0
                  ? currentAnswerState.draggedOrder
                  : currentQ.options || []
                ).map((item, idx) => (
                  <div
                    key={item}
                    draggable={!currentAnswerState.isSubmitted}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', String(idx));
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const sourceIdx = Number(
                        e.dataTransfer.getData('text/plain')
                      );
                      handleDragReorder(sourceIdx, idx);
                    }}
                    className={`p-3.5 rounded-xl border-2 text-xs font-semibold flex items-center justify-between ${
                      currentAnswerState.isSubmitted
                        ? currentAnswerState.isCorrect
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    <span>
                      {idx + 1}. {item}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      {currentAnswerState.isSubmitted
                        ? 'Submitted'
                        : 'Drag to reorder'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Explanation Box after submission */}
          {currentAnswerState.isSubmitted && (
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs space-y-1.5 animate-fadeIn">
              <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Detailed Explanation:
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* ─── ACTION FOOTER WITH PREVIOUS BUTTON & SUBMIT / NEXT BUTTONS ─── */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* PREVIOUS BUTTON */}
            <button
              onClick={handlePreviousQuestion}
              disabled={currentIdx === 0}
              className="px-4 sm:px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {/* RIGHT SIDE: SUBMIT OR NEXT / FINISH BUTTON */}
            <div className="flex items-center gap-2">
              {!currentAnswerState.isSubmitted ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={
                    currentQ.type !== 'drag-order' &&
                    !currentAnswerState.selectedOption
                  }
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-500 hover:from-blue-800 hover:via-blue-700 hover:to-indigo-600 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>
                    {currentIdx + 1 < QUIZ_QUESTIONS.length
                      ? 'Next Question'
                      : 'View Final Results'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ─── HIGHLIGHTED SCORE RESULTS DASHBOARD AFTER COMPLETION ─── */
        <div className="space-y-6 animate-fadeIn">
          
          {/* 1. HERO HIGHLIGHT SCORE CARD */}
          <div
            className={`rounded-3xl p-8 sm:p-10 border shadow-lg text-center relative overflow-hidden transition-all ${
              finalScorePercent >= 80
                ? 'bg-gradient-to-b from-emerald-50 via-white to-emerald-50/40 dark:from-emerald-950/60 dark:via-slate-900 dark:to-emerald-950/30 border-emerald-300 dark:border-emerald-700/80 shadow-emerald-500/10'
                : finalScorePercent >= 60
                ? 'bg-gradient-to-b from-blue-50 via-white to-blue-50/40 dark:from-blue-950/60 dark:via-slate-900 dark:to-blue-950/30 border-blue-300 dark:border-blue-700/80 shadow-blue-500/10'
                : 'bg-gradient-to-b from-amber-50 via-white to-amber-50/40 dark:from-amber-950/60 dark:via-slate-900 dark:to-amber-950/30 border-amber-300 dark:border-amber-700/80 shadow-amber-500/10'
            }`}
          >
            {/* Background Glow accent */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-500/15 dark:bg-blue-500/20 blur-3xl rounded-full pointer-events-none" />

            {/* Trophy & Badge Icon */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-md mb-4 text-white ${
                  finalScorePercent >= 80
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-200 dark:shadow-emerald-950'
                    : finalScorePercent >= 60
                    ? 'bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 shadow-blue-200 dark:shadow-blue-950'
                    : 'bg-gradient-to-tr from-amber-500 to-orange-500 shadow-amber-200 dark:shadow-amber-950'
                }`}
              >
                <Trophy className="w-10 h-10" />
              </div>

              {/* Status Pill Badge */}
              <div
                className={`px-4 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider mb-2 border ${
                  finalScorePercent >= 80
                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                    : finalScorePercent >= 60
                    ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                    : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                }`}
              >
                {finalScorePercent >= 80
                  ? '★ OUTSTANDING MASTERY (GRADE A+) ★'
                  : finalScorePercent >= 60
                  ? '★ PROFICIENT (GRADE B) ★'
                  : 'PRACTICE RECOMMENDED (GRADE C)'}
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                QUIZ ASSESSMENT COMPLETED
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md">
                {finalScorePercent >= 80
                  ? 'Incredible performance! You demonstrated thorough command of Stack operations and algorithmic constraints.'
                  : finalScorePercent >= 60
                  ? 'Great job! You have a solid grasp of Stack fundamentals and lifecycle behavior.'
                  : 'Good effort! Review the detailed question explanations below to sharpen your Stack mechanics.'}
              </p>

              {/* ─── VIBRANT HIGHLIGHTED SCORE BADGE ─── */}
              <div className="my-6 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/90 border-2 border-blue-400/50 dark:border-blue-500/50 shadow-xl max-w-sm w-full mx-auto ring-4 ring-blue-500/10 dark:ring-blue-500/20">
                <span className="text-[11px] font-mono font-bold tracking-widest text-slate-400 dark:text-slate-400 uppercase block mb-1">
                  FINAL HIGHLIGHTED SCORE
                </span>
                
                {/* Big Bold Score Percentage */}
                <div className="flex items-baseline justify-center gap-1 font-mono font-black">
                  <span
                    className={`text-6xl sm:text-7xl font-black tracking-tight ${
                      finalScorePercent >= 80
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : finalScorePercent >= 60
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {finalScorePercent}%
                  </span>
                </div>

                {/* Question Score Ratio */}
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <span>{totalCorrect}</span>
                  <span className="text-slate-400">/</span>
                  <span>{QUIZ_QUESTIONS.length} Questions Correct</span>
                </div>
              </div>

              {/* ─── 4 HIGHLIGHT METRICS STATS ─── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-2xl mx-auto">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Correct</span>
                  <span className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                    <Check className="w-4 h-4 stroke-[3]" /> {totalCorrect}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Incorrect</span>
                  <span className="text-xl font-mono font-black text-rose-600 dark:text-rose-400">
                    {totalIncorrect}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Quiz Points</span>
                  <span className="text-xl font-mono font-black text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1">
                    <Sparkles className="w-4 h-4" /> {currentQuizPoints >= 0 ? `+${currentQuizPoints}` : currentQuizPoints} PTS
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Accuracy</span>
                  <span className="text-xl font-mono font-black text-slate-800 dark:text-slate-200">
                    {finalScorePercent}%
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 w-full max-w-lg mx-auto">
                <button
                  onClick={handleReviewQuestions}
                  className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-500 hover:from-blue-800 hover:via-blue-700 hover:to-indigo-600 text-white rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/25 active:scale-95"
                >
                  <Eye className="w-4 h-4" />
                  <span>Review Questions</span>
                </button>
                <button
                  onClick={handleRestartQuiz}
                  className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
                >
                  <RotateCcw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Retake Quiz</span>
                </button>
                {onNavigateHome && (
                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      onNavigateHome();
                    }}
                    className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Home className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Back to Home</span>
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* 2. QUESTION-BY-QUESTION REVIEW BREAKDOWN */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            {/* Header with Title and Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Question Breakdown & Answers
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Review your selected answers, the verified correct answers, and explanations for all questions.
                </p>
              </div>

              {/* Dynamic Filter Tabs: All (10) | Correct (X) | Incorrect (Y) */}
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setResultFilter('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    resultFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  All ({QUIZ_QUESTIONS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setResultFilter('correct')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    resultFilter === 'correct'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`}
                >
                  Correct ({totalCorrect})
                </button>
                <button
                  type="button"
                  onClick={() => setResultFilter('incorrect')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    resultFilter === 'incorrect'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
                  }`}
                >
                  Incorrect ({totalIncorrect})
                </button>
              </div>
            </div>

            {/* Question Cards List */}
            <div className="space-y-4">
              {filteredQuestions.map((q) => {
                const origIdx = QUIZ_QUESTIONS.findIndex((item) => item.id === q.id);
                const ans = answers[origIdx];
                const isCorrect = ans?.isCorrect ?? false;

                const formatQuestionType = (type: string) => {
                  switch (type) {
                    case 'multiple-choice':
                      return 'MULTIPLE CHOICE';
                    case 'predict-output':
                      return 'PREDICT OUTPUT';
                    case 'true-false':
                      return 'TRUE / FALSE';
                    case 'scenario':
                      return 'SCENARIO ANALYSIS';
                    case 'drag-order':
                      return 'SEQUENCE ORDER';
                    default:
                      return type.toUpperCase();
                  }
                };

                const getChosenAnswerText = () => {
                  if (!ans || !ans.isSubmitted) return 'No answer submitted';
                  if (q.type === 'drag-order') {
                    return ans.draggedOrder && ans.draggedOrder.length > 0
                      ? ans.draggedOrder.join(' ➔ ')
                      : 'No order submitted';
                  }
                  return ans.selectedOption || 'No answer selected';
                };

                const getCorrectAnswerText = () => {
                  if (Array.isArray(q.correctAnswer)) {
                    return q.correctAnswer.join(' ➔ ');
                  }
                  return String(q.correctAnswer);
                };

                const questionNumber = String(origIdx + 1).padStart(2, '0');

                return (
                  <div
                    key={q.id}
                    className="rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-2xs space-y-4 transition-all"
                  >
                    {/* Compact Header: 01   MULTIPLE CHOICE   ✓ Correct */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {questionNumber}
                        </span>
                        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                          {formatQuestionType(q.type)}
                        </span>
                      </div>

                      {/* Correct / Incorrect Status Pill */}
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Correct</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Incorrect</span>
                        </span>
                      )}
                    </div>

                    {/* Question Text */}
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {q.question}
                    </h4>

                    {/* Side-by-side Answer Comparison on desktop, stacked on mobile */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {/* Student's Chosen Answer Card */}
                      <div
                        className={`p-4 rounded-xl border flex flex-col justify-between transition-colors ${
                          isCorrect
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-800/50'
                            : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-800/50'
                        }`}
                      >
                        <div>
                          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase block mb-1.5">
                            THE ANSWER YOU CHOSE
                          </span>
                          <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed break-words">
                            {getChosenAnswerText()}
                          </p>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center">
                          {isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Your Choice (Correct)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-rose-700 dark:text-rose-400">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Your Choice (Incorrect)</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Verified Correct Answer Card */}
                      <div className="p-4 rounded-xl border bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-800/50 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase block mb-1.5">
                            CORRECT ANSWER
                          </span>
                          <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed break-words font-mono">
                            {getCorrectAnswerText()}
                          </p>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Verified Solution</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Educational Explanation */}
                    <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 text-xs sm:text-sm space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-200 text-xs font-mono uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Detailed Explanation</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs sm:text-sm">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                );
              })}

              {filteredQuestions.length === 0 && (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-mono text-xs">
                  No questions found in this filter category.
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

