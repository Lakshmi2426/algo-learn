import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Trophy,
  Check,
  AlertCircle,
  Eye,
  Home,
  Flame,
  HelpCircle,
} from 'lucide-react';
import { QuizQuestion, UserProgress, QuizQuestionOutcome } from '../../types';
import { QUIZ_QUESTIONS } from '../../data/quizData';
import { soundEffects } from '../../services/sound';
import { recordQuizQuestionOutcome, getInitialTopicData } from '../../services/storage';

interface QuizViewProps {
  progress: UserProgress;
  onUpdateProgress: (updated: UserProgress | ((prev: UserProgress) => UserProgress)) => void;
  onNavigateHome?: () => void;
}

interface QuestionAnswerDraft {
  selectedOption: string | null;
  draggedOrder: string[];
}

export const QuizView: React.FC<QuizViewProps> = ({
  progress,
  onUpdateProgress,
  onNavigateHome,
}) => {
  // Authoritative topic scoring data
  const topicData = progress.topicData || getInitialTopicData(progress.completedLabs || []);
  const recordedQuestions = topicData.quizQuestions || {};
  const isAllQuestionsFinished = topicData.answeredOrTimedOutQuizCount >= QUIZ_QUESTIONS.length;

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [drafts, setDrafts] = useState<Record<number, QuestionAnswerDraft>>({});
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect' | 'unanswered'>('all');

  // Quiz started state (activates the 20s countdown upon clicking Start Quiz or answering)
  const [isQuizStarted, setIsQuizStarted] = useState<boolean>(
    () => Object.keys(recordedQuestions).length > 0
  );

  // Per-question 20-second timer state
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [isTimeExpiring, setIsTimeExpiring] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());
  const isAutoAdvancingRef = useRef<boolean>(false);

  const currentQ: QuizQuestion = QUIZ_QUESTIONS[currentIdx];
  const currentOutcome: QuizQuestionOutcome | undefined = recordedQuestions[currentQ.id];
  const isQuestionLocked = Boolean(currentOutcome);

  // Start / restart the 20-second quiz countdown timer
  const handleStartQuiz = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    event?.stopPropagation();
    soundEffects.playClick();
    setIsQuizStarted(true);
    setTimeLeft(20);
    setIsTimeExpiring(false);
    questionStartTimeRef.current = Date.now();
  };

  // Initialize drag order or option draft for current question
  useEffect(() => {
    if (!drafts[currentQ.id]) {
      if (currentQ.type === 'drag-order' && Array.isArray(currentQ.options)) {
        const shuffled = [...currentQ.options].sort(() => Math.random() - 0.5);
        setDrafts((prev) => ({
          ...prev,
          [currentQ.id]: {
            selectedOption: null,
            draggedOrder: currentOutcome?.draggedOrder || shuffled,
          },
        }));
      } else {
        setDrafts((prev) => ({
          ...prev,
          [currentQ.id]: {
            selectedOption: currentOutcome?.selectedOption || null,
            draggedOrder: [],
          },
        }));
      }
    }
  }, [currentIdx, currentQ.id, currentOutcome]);

  // 20-second timer countdown management
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    isAutoAdvancingRef.current = false;

    // If quiz is not started yet or question is already answered or timed out, do not run countdown
    if (!isQuizStarted || isQuestionLocked || isAllQuestionsFinished) {
      if (!isQuizStarted) {
        setTimeLeft(20);
      } else {
        setTimeLeft(0);
      }
      setIsTimeExpiring(false);
      return;
    }

    // Fresh 20-second countdown
    setTimeLeft(20);
    setIsTimeExpiring(false);
    questionStartTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
      const remaining = Math.max(0, 20 - elapsedSeconds);

      setTimeLeft(remaining);
      if (remaining <= 5) {
        setIsTimeExpiring(true);
      }

      if (remaining <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        handleQuestionTimeout();
      }
    }, 500);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentIdx, isQuizStarted, isQuestionLocked, isAllQuestionsFinished]);

  // Handle automatic timeout when timer expires (0 points awarded)
  const handleQuestionTimeout = () => {
    if (isQuestionLocked || isAutoAdvancingRef.current) return;
    isAutoAdvancingRef.current = true;

    soundEffects.playError();

    const { updated, recorded } = recordQuizQuestionOutcome(progress, {
      questionId: currentQ.id,
      status: 'unanswered',
      selectedOption: null,
      pointsAwarded: 0,
      submittedAt: Date.now(),
    });

    if (recorded) {
      onUpdateProgress(updated);
    }

    // Automatically move to the next question after recording the timeout
    setTimeout(() => {
      if (currentIdx + 1 < QUIZ_QUESTIONS.length) {
        setCurrentIdx((prev) => prev + 1);
      }
    }, 1500);
  };

  const handleSelectOption = (opt: string) => {
    if (isQuestionLocked) return;
    if (!isQuizStarted) {
      setIsQuizStarted(true);
      questionStartTimeRef.current = Date.now();
    }
    soundEffects.playClick();
    setDrafts((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...(prev[currentQ.id] || { draggedOrder: [] }),
        selectedOption: opt,
      },
    }));
  };

  const handleDragReorder = (sourceIdx: number, targetIdx: number) => {
    if (isQuestionLocked) return;
    const currentList =
      drafts[currentQ.id]?.draggedOrder?.length > 0
        ? [...drafts[currentQ.id].draggedOrder]
        : [...(currentQ.options || [])];
    const [moved] = currentList.splice(sourceIdx, 1);
    currentList.splice(targetIdx, 0, moved);

    setDrafts((prev) => ({
      ...prev,
      [currentQ.id]: {
        selectedOption: null,
        draggedOrder: currentList,
      },
    }));
  };

  // Submit Answer evaluation: +5 for correct, -2 for incorrect
  const handleSubmitAnswer = () => {
    if (isQuestionLocked || isAutoAdvancingRef.current) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    let isCorrect = false;
    const currentDraft = drafts[currentQ.id] || {
      selectedOption: null,
      draggedOrder: [],
    };

    if (currentQ.type === 'drag-order') {
      const correctArr = currentQ.correctAnswer as string[];
      const order = currentDraft.draggedOrder;
      isCorrect =
        order.length === correctArr.length &&
        order.every((val, idx) => val === correctArr[idx]);
    } else {
      isCorrect = currentDraft.selectedOption === currentQ.correctAnswer;
    }

    if (isCorrect) {
      soundEffects.playSuccess();
    } else {
      soundEffects.playError();
    }

    const { updated, recorded } = recordQuizQuestionOutcome(progress, {
      questionId: currentQ.id,
      status: isCorrect ? 'correct' : 'incorrect',
      selectedOption: currentQ.type === 'drag-order' ? null : currentDraft.selectedOption,
      draggedOrder: currentQ.type === 'drag-order' ? currentDraft.draggedOrder : undefined,
      pointsAwarded: isCorrect ? 5 : -2,
      submittedAt: Date.now(),
    });

    if (recorded) {
      onUpdateProgress(updated);
    }
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
    }
  };

  // Trigger celebration on initial completion if high score
  useEffect(() => {
    if (isAllQuestionsFinished && topicData.quizScore >= 35) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  }, [isAllQuestionsFinished, topicData.quizScore]);

  const currentDraft = drafts[currentQ.id] || {
    selectedOption: currentOutcome?.selectedOption || null,
    draggedOrder: currentOutcome?.draggedOrder || [],
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* ─── QUIZ ASSESSMENT HEADER CARD (MATCHING REFERENCE UI) ─── */}
      {!isAllQuestionsFinished && (
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
              <HelpCircle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Quiz Assessment
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Validate your algorithmic reasoning and earn mastery points (Basic to Hard).
              </p>
            </div>
          </div>

          <div className="self-end sm:self-center shrink-0">
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs">
              Question {currentIdx + 1} of 10
            </span>
          </div>
        </div>
      )}

      {/* ─── SCORING AND START TIMER BOX (ONE COMPACT HORIZONTAL BOX - ONLY SHOWN DURING QUIZ) ─── */}
      {!isAllQuestionsFinished && (
        <div className="bg-[#fef9c3] dark:bg-amber-950/40 border border-[#fde047] dark:border-amber-700/70 rounded-2xl px-5 py-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          {/* Left side: Scoring rules in clear, readable dark brown font */}
          <div className="flex items-center gap-4 sm:gap-6 font-semibold text-[#78350f] dark:text-amber-200 text-xs sm:text-sm">
            <span>Correct answer: +5 points</span>
            <span>Incorrect answer: -2 points</span>
          </div>

          {/* Right side: Time : 20s and blue Start Quiz Button */}
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[#78350f] dark:text-amber-200 font-mono text-xs sm:text-sm">
              Time: {isQuizStarted && !isQuestionLocked ? `${timeLeft}s` : '20s'}
            </span>
            {!isQuizStarted && (
              <button
                type="button"
                onClick={handleStartQuiz}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                id="start-quiz-btn"
              >
                Start Quiz
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── LIVE STEPPER & TIMER ROW (When quiz in progress or viewing questions) ─── */}
      {!isAllQuestionsFinished && (
        <div className="space-y-3">
          {/* Active Question Stepper Bar */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto py-1 px-0.5">
            {QUIZ_QUESTIONS.map((q, idx) => {
              const outcome = recordedQuestions[q.id];
              const isCurrent = idx === currentIdx;
              let chipBg =
                'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';

              if (isCurrent) {
                chipBg =
                  'bg-indigo-600 text-white border-indigo-500 ring-2 ring-indigo-300 dark:ring-indigo-800 font-bold';
              } else if (outcome) {
                if (outcome.status === 'correct') {
                  chipBg =
                    'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700';
                } else if (outcome.status === 'incorrect') {
                  chipBg =
                    'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-700';
                } else {
                  chipBg =
                    'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700';
                }
              }

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    soundEffects.playClick();
                    setCurrentIdx(idx);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${chipBg}`}
                  title={`Question ${idx + 1}`}
                >
                  <span>Q{idx + 1}</span>
                  {outcome?.status === 'correct' && (
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                  )}
                  {outcome?.status === 'incorrect' && (
                    <span className="text-[10px] text-rose-500 font-black leading-none">✕</span>
                  )}
                  {outcome?.status === 'unanswered' && (
                    <Clock className="w-3 h-3 text-amber-500 stroke-[2]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── ACTIVE QUESTION CARD (Shown while quiz has uncompleted questions or user reviews) ─── */}
      {!isAllQuestionsFinished ? (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
          {/* Header Row: Category Badge + Question Outcome */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 font-mono">
                {currentQ.type.replace('-', ' ')}
              </span>
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                Question {currentIdx + 1} of 10
              </span>
            </div>

            {/* Question Outcome Badge (if already completed) */}
            {isQuestionLocked && (
              <div className="flex items-center gap-1.5">
                {currentOutcome?.status === 'correct' && (
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> +5 pts (Correct)
                  </span>
                )}
                {currentOutcome?.status === 'incorrect' && (
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> −2 pts (Incorrect)
                  </span>
                )}
                {currentOutcome?.status === 'unanswered' && (
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> 0 pts (Timed Out)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Question Text */}
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
            {currentQ.question}
          </h2>

          {/* MCQ, True/False, Scenario Options */}
          {currentQ.type !== 'drag-order' && currentQ.options && (
            <div className="space-y-3">
              {currentQ.options.map((opt) => {
                const isSelected = (currentDraft.selectedOption || currentOutcome?.selectedOption) === opt;
                const isCorrect = opt === currentQ.correctAnswer;

                let optClass =
                  'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-600 text-slate-800 dark:text-slate-200';

                if (isQuestionLocked) {
                  if (isCorrect) {
                    optClass =
                      'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-100 font-bold ring-2 ring-emerald-300 dark:ring-emerald-800';
                  } else if (isSelected && !isCorrect) {
                    optClass =
                      'border-rose-400 bg-rose-50 dark:bg-rose-950/70 text-rose-950 dark:text-rose-100 ring-2 ring-rose-200 dark:ring-rose-900';
                  } else {
                    optClass =
                      'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 opacity-50 text-slate-400';
                  }
                } else if (isSelected) {
                  optClass =
                    'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200 font-bold ring-2 ring-indigo-200 dark:ring-indigo-900';
                }

                return (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption(opt)}
                    disabled={isQuestionLocked}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 text-xs sm:text-sm cursor-pointer ${optClass}`}
                  >
                    <span>{opt}</span>
                    {isQuestionLocked && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                    {isQuestionLocked && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Drag-Order Chronological Sequence */}
          {currentQ.type === 'drag-order' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Arrange cards in correct hierarchical order (lowest level hardware to highest abstraction):
              </p>

              <div className="space-y-2">
                {(currentDraft.draggedOrder.length > 0
                  ? currentDraft.draggedOrder
                  : currentQ.options || []
                ).map((item, idx) => {
                  const listLen = (currentDraft.draggedOrder.length > 0
                    ? currentDraft.draggedOrder
                    : currentQ.options || []).length;
                  return (
                    <div
                      key={item}
                      draggable={!isQuestionLocked}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', String(idx));
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const sourceIdx = Number(e.dataTransfer.getData('text/plain'));
                        handleDragReorder(sourceIdx, idx);
                      }}
                      className={`p-3.5 rounded-2xl border-2 text-xs font-semibold flex items-center justify-between ${
                        isQuestionLocked
                          ? currentOutcome?.status === 'correct'
                            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200'
                            : 'border-rose-300 bg-rose-50 dark:bg-rose-950/60 text-rose-950 dark:text-rose-200'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-grab active:cursor-grabbing'
                      }`}
                    >
                      <span className="break-words">
                        {idx + 1}. {item}
                      </span>
                      {!isQuestionLocked && (
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (idx > 0) handleDragReorder(idx, idx - 1);
                            }}
                            disabled={idx === 0}
                            className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-100 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (idx < listLen - 1) handleDragReorder(idx, idx + 1);
                            }}
                            disabled={idx === listLen - 1}
                            className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-100 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Explanation Box once question is locked */}
          {isQuestionLocked && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs space-y-1.5 animate-fadeIn">
              <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Explanation:
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Action Footer: Navigation & Submit */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentIdx === 0}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div>
              {!isQuestionLocked ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={currentQ.type !== 'drag-order' && !currentDraft.selectedOption}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  disabled={currentIdx + 1 >= QUIZ_QUESTIONS.length}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ─── FINAL QUIZ RESULTS DASHBOARD (SECTION 4.D) ─── */
        <div className="space-y-6 animate-fadeIn">
          {/* Hero Results Card */}
          <div className="rounded-3xl p-8 sm:p-10 border shadow-lg text-center relative overflow-hidden bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4">
                <Trophy className="w-10 h-10" />
              </div>

              <div className="px-4 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider mb-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                QUIZ RESULTS
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                QUIZ COMPLETED
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md">
                Review your validated quiz answers and quiz score.
              </p>

              {/* ─── QUIZ METRICS ─── */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 w-full max-w-3xl mx-auto my-6">
                {/* 1. Total questions */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                    Total Questions
                  </span>
                  <span className="text-2xl font-mono font-black text-slate-800 dark:text-slate-100">
                    10
                  </span>
                </div>

                {/* 2. Correct answers */}
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 uppercase block font-bold">
                    Correct (+5 pts ea)
                  </span>
                  <span className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                    <Check className="w-5 h-5 stroke-[3]" /> {topicData.quizCorrectCount}
                  </span>
                </div>

                {/* 3. Wrong answers */}
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                  <span className="text-[10px] font-mono text-rose-700 dark:text-rose-400 uppercase block font-bold">
                    Wrong (−2 pts ea)
                  </span>
                  <span className="text-2xl font-mono font-black text-rose-600 dark:text-rose-400">
                    {topicData.quizWrongCount}
                  </span>
                </div>

                {/* 4. Unanswered questions */}
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 uppercase block font-bold">
                    Unanswered (0 pts)
                  </span>
                  <span className="text-2xl font-mono font-black text-amber-600 dark:text-amber-400">
                    {topicData.quizUnansweredCount}
                  </span>
                </div>

                {/* 5. Quiz score, including negative deductions */}
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                  <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-400 uppercase block font-bold">
                    Quiz Score
                  </span>
                  <span className={`text-2xl font-mono font-black ${
                    topicData.quizScore < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'
                  }`}>
                    {topicData.quizScore} / 50 pts
                  </span>
                </div>

                {/* 6. Maximum possible quiz points */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                    Max Quiz Points
                  </span>
                  <span className="text-2xl font-mono font-black text-slate-800 dark:text-slate-100">
                    50 pts
                  </span>
                </div>

              </div>

              {/* Home Navigation (No Reset or Refresh buttons) */}
              {onNavigateHome && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      onNavigateHome();
                    }}
                    className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-500/25 active:scale-95 mx-auto"
                  >
                    <Home className="w-4 h-4" />
                    <span>Back to Topic Overview</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ─── QUESTION-BY-QUESTION REVIEW BREAKDOWN ─── */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-50 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-slate-800">
                  <Eye className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Question-by-Question Solution Breakdown
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Verified answers, point changes (+5, −2, 0), and detailed algorithmic explanations.
                  </p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setReviewFilter('all');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reviewFilter === 'all'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  All (10)
                </button>
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setReviewFilter('correct');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reviewFilter === 'correct'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Correct ({topicData.quizCorrectCount})
                </button>
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setReviewFilter('incorrect');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reviewFilter === 'incorrect'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Wrong ({topicData.quizWrongCount})
                </button>
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setReviewFilter('unanswered');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reviewFilter === 'unanswered'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Timed Out ({topicData.quizUnansweredCount})
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {QUIZ_QUESTIONS.map((q, idx) => ({ q, idx }))
                .filter(({ q }) => {
                  const outcome = recordedQuestions[q.id];
                  if (reviewFilter === 'correct') return outcome?.status === 'correct';
                  if (reviewFilter === 'incorrect') return outcome?.status === 'incorrect';
                  if (reviewFilter === 'unanswered') return outcome?.status === 'unanswered';
                  return true;
                })
                .map(({ q, idx }) => {
                  const outcome = recordedQuestions[q.id];
                  const isCorrect = outcome?.status === 'correct';
                  const isUnanswered = outcome?.status === 'unanswered';

                  let chosenDisplay: React.ReactNode = null;
                  if (q.type === 'drag-order') {
                    const order = outcome?.draggedOrder || [];
                    chosenDisplay = (
                      <div className="space-y-1 font-mono text-xs">
                        {order.map((step, sIdx) => (
                          <div key={sIdx} className="truncate">
                            {sIdx + 1}. {step}
                          </div>
                        ))}
                      </div>
                    );
                  } else if (outcome?.selectedOption) {
                    chosenDisplay = <span>{outcome.selectedOption}</span>;
                  } else {
                    chosenDisplay = <span className="italic text-slate-400">(No answer - timed out)</span>;
                  }

                  let correctDisplay: React.ReactNode = null;
                  if (Array.isArray(q.correctAnswer)) {
                    correctDisplay = (
                      <div className="space-y-1 font-mono text-xs text-emerald-800 dark:text-emerald-300">
                        {q.correctAnswer.map((step, sIdx) => (
                          <div key={sIdx} className="truncate">
                            {sIdx + 1}. {step}
                          </div>
                        ))}
                      </div>
                    );
                  } else {
                    correctDisplay = <span>{q.correctAnswer}</span>;
                  }

                  return (
                    <div
                      key={q.id}
                      className={`rounded-2xl border-2 p-5 sm:p-6 transition-all space-y-4 ${
                        isCorrect
                          ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-slate-950'
                          : isUnanswered
                          ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-slate-950'
                          : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-slate-950'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/60 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs text-white ${
                              isCorrect
                                ? 'bg-emerald-600'
                                : isUnanswered
                                ? 'bg-amber-600'
                                : 'bg-rose-600'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                            {q.type.replace('-', ' ')}
                          </span>
                        </div>

                        <div>
                          {isCorrect && (
                            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              +5 pts (Correct)
                            </span>
                          )}
                          {!isCorrect && !isUnanswered && (
                            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                              −2 pts (Wrong)
                            </span>
                          )}
                          {isUnanswered && (
                            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              0 pts (Timed Out)
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                        {q.question}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                        <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 space-y-1">
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                            Your Submission:
                          </span>
                          <div className="text-xs font-semibold">{chosenDisplay}</div>
                        </div>

                        <div className="p-4 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 space-y-1">
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                            Correct Answer:
                          </span>
                          <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                            {correctDisplay}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 block">
                          Detailed Explanation:
                        </span>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {q.explanation}
                        </p>
                      </div>
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
