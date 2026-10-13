import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  Award,
  CheckCircle2,
  XCircle,
  Lightbulb,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Trophy,
  Star,
  Check,
  AlertCircle,
  Eye,
  Home,
} from 'lucide-react';
import { QuizQuestion, UserProgress } from '../../types';
import { QUIZ_QUESTIONS } from '../../data/quizData';
import { soundEffects } from '../../services/sound';
import { QUEUE_SCORING } from '../../services/queueScoring';

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
}

const QUEUE_QUIZ_SESSION_KEY = 'queue_quiz_session_state';

export const QuizView: React.FC<QuizViewProps> = ({
  progress,
  onUpdateProgress,
  onNavigateHome,
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(QUEUE_QUIZ_SESSION_KEY);
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
      const saved = localStorage.getItem(QUEUE_QUIZ_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers && typeof parsed.answers === 'object') {
          return parsed.answers;
        }
      }
    } catch {}
    return {};
  });

  const [quizFinished, setQuizFinished] = useState<boolean>(() => {
    if (progress.quizCompleted) return true;
    try {
      const saved = localStorage.getItem(QUEUE_QUIZ_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.quizFinished === 'boolean') {
          return parsed.quizFinished;
        }
      }
    } catch {}
    return false;
  });

  const [reviewQuestionIdx, setReviewQuestionIdx] = useState<number | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(QUEUE_SCORING.quiz.timeLimitSeconds);

  const [quizStarted, setQuizStarted] = useState<boolean>(() => {
    if (progress.quizCompleted) return true;
    try {
      const saved = localStorage.getItem(QUEUE_QUIZ_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.quizStarted === 'boolean') {
          return parsed.quizStarted;
        }
      }
    } catch {}
    return false;
  });

  // Reconstruct answers if quiz completed previously but local answers cache was empty
  useEffect(() => {
    if (progress.quizCompleted && Object.keys(answers).length === 0 && progress.quizQuestionResults) {
      const reconstructed: Record<number, QuestionAnswerState> = {};
      QUIZ_QUESTIONS.forEach((q, idx) => {
        const res = progress.quizQuestionResults?.[q.id];
        if (res) {
          reconstructed[idx] = {
            selectedOption: res === 'correct' ? (typeof q.correctAnswer === 'string' ? q.correctAnswer : null) : null,
            draggedOrder: Array.isArray(q.correctAnswer) ? (res === 'correct' ? [...q.correctAnswer] : [...(q.options || [])]) : [],
            isSubmitted: true,
            isCorrect: res === 'correct',
          };
        }
      });
      if (Object.keys(reconstructed).length > 0) {
        setAnswers(reconstructed);
        setQuizFinished(true);
        setQuizStarted(true);
      }
    }
  }, [progress.quizCompleted, progress.quizQuestionResults]);

  // Save session state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        QUEUE_QUIZ_SESSION_KEY,
        JSON.stringify({
          answers,
          currentIdx,
          quizFinished,
          quizStarted,
        })
      );
    } catch {}
  }, [answers, currentIdx, quizFinished, quizStarted]);

  const currentQ: QuizQuestion = QUIZ_QUESTIONS[currentIdx];
  const currentAnswerState = answers[currentIdx] || {
    selectedOption: null,
    draggedOrder: [],
    isSubmitted: false,
    isCorrect: false,
  };

  const handleTimeoutAnswer = () => {
    if (!quizStarted || currentAnswerState.isSubmitted) return;
    soundEffects.playError();
    setAnswers((prev) => ({
      ...prev,
      [currentIdx]: {
        ...(prev[currentIdx] || { selectedOption: null, draggedOrder: [] }),
        isSubmitted: true,
        isCorrect: false,
      },
    }));
    onUpdateProgress((prev) => {
      if (prev.quizQuestionResults?.[currentQ.id]) return prev;
      return {
        ...prev,
        quizQuestionResults: { ...(prev.quizQuestionResults || {}), [currentQ.id]: 'timeout' },
        quizTotalQuestionsAnswered: (prev.quizTotalQuestionsAnswered || 0) + 1,
      };
    });
  };

  useEffect(() => {
    setTimeRemaining(QUEUE_SCORING.quiz.timeLimitSeconds);
    if (currentAnswerState.isSubmitted) return;
    const timer = window.setInterval(() => {
      setTimeRemaining((remaining) => {
        if (remaining <= 1) {
          window.clearInterval(timer);
          handleTimeoutAnswer();
          return 0;
        }
        return remaining - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [currentIdx, currentAnswerState.isSubmitted, quizStarted]);

  // Initialize drag order or answer state if not yet set
  useEffect(() => {
    if (!answers[currentIdx]) {
      if (currentQ.type === 'drag-order' && Array.isArray(currentQ.options)) {
        // Scramble options
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
    if (!quizStarted || currentAnswerState.isSubmitted) return;
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
    if (!quizStarted || currentAnswerState.isSubmitted) return;
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
    } else {
      soundEffects.playError();
    }

    onUpdateProgress((prev) => {
      if (prev.quizQuestionResults?.[currentQ.id]) return prev;
      return {
        ...prev,
        quizQuestionResults: {
          ...(prev.quizQuestionResults || {}),
          [currentQ.id]: isCorrect ? 'correct' : 'incorrect',
        },
        quizTotalQuestionsAnswered: (prev.quizTotalQuestionsAnswered || 0) + 1,
      };
    });

    setAnswers((prev) => ({
      ...prev,
      [currentIdx]: {
        ...(prev[currentIdx] || {
          selectedOption: null,
          draggedOrder: [],
        }),
        isSubmitted: true,
        isCorrect,
      },
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
      // Calculate final score
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    const totalCorrect = (Object.values(answers) as QuestionAnswerState[]).reduce(
      (acc, ans) => acc + (ans?.isCorrect ? 1 : 0),
      0
    );

    const totalScorePercent = Math.round(
      (totalCorrect / QUIZ_QUESTIONS.length) * 100
    );

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

    onUpdateProgress((prev) => ({
      ...prev,
      quizCompleted: true,
      quizHighScore: Math.max(prev.quizHighScore, totalScorePercent),
    }));
  };

  const handleRestartQuiz = () => {
    soundEffects.playClick();
    setCurrentIdx(0);
    setAnswers({});
    setQuizFinished(false);
    setQuizStarted(false);
    setReviewQuestionIdx(null);
    setExpandedQuestions({});
    try {
      localStorage.removeItem(QUEUE_QUIZ_SESSION_KEY);
    } catch {}
  };

  const allAreExpanded = QUIZ_QUESTIONS.every(
    (_, idx) => expandedQuestions[idx] !== false
  );

  const handleToggleAll = () => {
    soundEffects.playClick();
    const nextState = !allAreExpanded;
    const newMap: Record<number, boolean> = {};
    QUIZ_QUESTIONS.forEach((_, idx) => {
      newMap[idx] = nextState;
    });
    setExpandedQuestions(newMap);
  };

  const toggleQuestionExpand = (idx: number) => {
    soundEffects.playClick();
    setExpandedQuestions((prev) => ({
      ...prev,
      [idx]: !(prev[idx] !== undefined ? prev[idx] : true),
    }));
  };

  // Compute live score stats
  const answersList = Object.values(answers) as QuestionAnswerState[];
  const totalAnswered = answersList.filter((a) => a?.isSubmitted).length;
  const totalCorrect = answersList.filter((a) => a?.isCorrect).length;
  const totalIncorrect = totalAnswered - totalCorrect;
  const finalScorePercent = Math.round(
    (totalCorrect / QUIZ_QUESTIONS.length) * 100
  );

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <HelpCircle className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Quiz Assessment
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Validate your algorithmic Queue reasoning and earn mastery points (Basic to Hard).
          </p>
        </div>

        {/* Question Counter & Controls */}
        {!quizFinished && (
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono">
              Question {currentIdx + 1} of {QUIZ_QUESTIONS.length}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-amber-300 dark:border-amber-500/70 bg-amber-50 dark:bg-amber-950/30 text-xs font-bold text-amber-900 dark:text-amber-200">
        <span>Correct answer: +{QUEUE_SCORING.quiz.pointsPerCorrect} pts</span>
        <span className="text-amber-400 dark:text-amber-500">|</span>
        <span>Incorrect answer: −{Math.abs(QUEUE_SCORING.quiz.pointsPerIncorrect)} pts</span>
        {!quizFinished && <>
          <span className="ml-auto font-mono">Time: {quizStarted ? `${timeRemaining}s` : '20s'}</span>
          {!quizStarted && (
            <button
              onClick={() => {
                soundEffects.playClick();
                setQuizStarted(true);
              }}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-black text-white transition-colors hover:bg-blue-700"
            >
              Start Quiz
            </button>
          )}
        </>}
      </div>

      {/* Progress Bar & Question Step Pill Navigation */}
      {!quizFinished && (
        <div className="space-y-2">
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-500 transition-all duration-300"
              style={{
                width: `${((currentIdx + 1) / QUIZ_QUESTIONS.length) * 100}%`,
              }}
            />
          </div>

          {/* Quick Question Stepper Chips */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto py-1 px-0.5">
            {QUIZ_QUESTIONS.map((q, idx) => {
              const ans = answers[idx];
              const isCurrent = idx === currentIdx;
              let chipBg =
                'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';

              if (isCurrent) {
                chipBg =
                  'bg-blue-600 text-white border-blue-500 ring-2 ring-blue-300 dark:ring-blue-800 font-bold';
              } else if (ans?.isSubmitted) {
                if (ans.isCorrect) {
                  chipBg =
                    'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700';
                } else {
                  chipBg =
                    'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-700';
                }
              }

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    if (!quizStarted) return;
                    soundEffects.playClick();
                    setCurrentIdx(idx);
                  }}
                  disabled={!quizStarted}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${chipBg}`}
                  title={`Question ${idx + 1}: ${q.type}`}
                >
                  <span>Q{idx + 1}</span>
                  {ans?.isSubmitted && ans.isCorrect && (
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                  )}
                  {ans?.isSubmitted && !ans.isCorrect && (
                    <span className="text-[10px] text-rose-500 font-black leading-none">✕</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Quiz Question Card */}
      {!quizFinished ? (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
          {/* Question Category Badge & Text */}
          <div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {currentQ.difficulty && (
                  <span
                    className={`text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                      currentQ.difficulty === 'Basic'
                        ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                        : currentQ.difficulty === 'Intermediate'
                        ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800'
                        : 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800'
                    }`}
                  >
                    ★ {currentQ.difficulty} Level
                  </span>
                )}
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                  {currentQ.type.replace('-', ' ')}
                </span>
              </div>
              {currentAnswerState.isSubmitted && (
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    currentAnswerState.isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                      : 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-700'
                  }`}
                >
                  {currentAnswerState.isCorrect ? '✓ Correct' : '✕ Incorrect'}
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-2.5 leading-relaxed whitespace-pre-line">
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
                    draggable={quizStarted && !currentAnswerState.isSubmitted}
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
                  disabled={!quizStarted ||
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
                  ? 'Incredible performance! You demonstrated thorough command of Queue operations, circular buffers, and algorithmic constraints.'
                  : finalScorePercent >= 60
                  ? 'Great job! You have a solid grasp of Queue fundamentals, pointer mechanics, and FIFO lifecycle behavior.'
                  : 'Good effort! Review the detailed question explanations below to sharpen your Queue mechanics.'}
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
                    <Sparkles className="w-4 h-4" /> {totalCorrect * QUEUE_SCORING.quiz.pointsPerCorrect + totalIncorrect * QUEUE_SCORING.quiz.pointsPerIncorrect}
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
                <button
                  onClick={handleRestartQuiz}
                  className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake Quiz</span>
                </button>
              </div>

            </div>
          </div>

          {/* 2. QUESTION-BY-QUESTION REVIEW BREAKDOWN */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Question Breakdown & Answers
                </h3>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleToggleAll}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  {allAreExpanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Collapse All</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Expand All</span>
                    </>
                  )}
                </button>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  {totalCorrect} of {QUIZ_QUESTIONS.length} Correct
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {QUIZ_QUESTIONS.map((q, idx) => {
                const ans = answers[idx];
                const isCorrect = ans?.isCorrect ?? false;
                const isExpanded =
                  expandedQuestions[idx] !== undefined
                    ? expandedQuestions[idx]
                    : true;

                const userChoiceText =
                  q.type === 'drag-order'
                    ? ans?.draggedOrder && ans.draggedOrder.length > 0
                      ? ans.draggedOrder.join(' ➔ ')
                      : 'No order selected'
                    : ans?.selectedOption || 'No option selected';

                const correctOptionText = Array.isArray(q.correctAnswer)
                  ? q.correctAnswer.join(' ➔ ')
                  : q.correctAnswer;

                return (
                  <div
                    key={q.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isCorrect
                        ? 'border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                        : 'border-rose-200/80 dark:border-rose-800/60 bg-rose-50/20 dark:bg-rose-950/10'
                    }`}
                  >
                    {/* Collapsible Card Header */}
                    <div
                      onClick={() => toggleQuestionExpand(idx)}
                      className="p-4 flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 sm:mt-0 ${
                            isCorrect
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-rose-600 text-white shadow-xs'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {q.difficulty && (
                              <span
                                className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                                  q.difficulty === 'Basic'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                    : q.difficulty === 'Intermediate'
                                    ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800'
                                    : 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800'
                                }`}
                              >
                                {q.difficulty}
                              </span>
                            )}
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                              {q.question}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] font-mono">
                            <span
                              className={`font-semibold flex items-center gap-1 ${
                                isCorrect
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {isCorrect ? (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Solved Correctly</span>
                                </>
                              ) : (
                                <>
                                  <span className="font-black text-xs leading-none">✕</span>
                                  <span>Incorrect Answer</span>
                                </>
                              )}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                            <span className="text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-sm">
                              Your Choice: <span className={isCorrect ? 'text-emerald-700 dark:text-emerald-300 font-medium' : 'text-rose-700 dark:text-rose-300 font-medium'}>{userChoiceText}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleQuestionExpand(idx);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors flex items-center gap-1 shrink-0 ml-2"
                      >
                        <span>{isExpanded ? 'Hide' : 'Explain'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Expanded Detail Body */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-3 text-xs space-y-3 border-t border-slate-200/60 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
                        {/* Full Question Text */}
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80">
                          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                            Question Prompt:
                          </span>
                          <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-line">
                            {q.question}
                          </p>
                        </div>

                        {/* Side-by-Side Comparison: User Choice vs Correct Option */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Option User Chose */}
                          <div
                            className={`p-3.5 rounded-xl border-2 space-y-1.5 ${
                              isCorrect
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400/80 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100'
                                : 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                {isCorrect ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                )}
                                <span>Option You Chose</span>
                              </span>
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-rose-600 text-white'
                                }`}
                              >
                                {isCorrect ? '✓ Correct Choice' : '✕ Incorrect'}
                              </span>
                            </div>
                            <div className="font-mono text-xs sm:text-sm font-bold pt-1 break-words">
                              {userChoiceText}
                            </div>
                          </div>

                          {/* Option Which Is Correct */}
                          <div className="p-3.5 rounded-xl border-2 bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-400/80 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                                <span>Option Which Is Correct</span>
                              </span>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                                ✓ Correct Answer
                              </span>
                            </div>
                            <div className="font-mono text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200 pt-1 break-words">
                              {correctOptionText}
                            </div>
                          </div>
                        </div>

                        {/* Explain why the option is correct */}
                        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-200 font-bold">
                            <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                            <span className="font-mono uppercase text-[11px] tracking-wider">
                              Why this option is correct:
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line text-xs sm:text-[13px] pl-5">
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

