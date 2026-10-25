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
  Play,
  Clock,
} from 'lucide-react';
import { progressManager } from '../utils/progressManager';
import { soundManager } from '../utils/audio';
import { useScrollReveal } from '../hooks/useScrollReveal';

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
  isTimeout?: boolean;
  points?: number;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is a single linked list?',
    options: [
      'A collection of nodes where each node points to the next node',
      'A collection of elements stored only in consecutive memory locations',
      'A collection of nodes where every node points to every other node',
      'A collection that can store only one data value',
    ],
    correctIndex: 0,
    correctAnswerText: 'A collection of nodes where each node points to the next node',
    explanation:
      'Correct! A single linked list consists of nodes, and each node stores data and a pointer to the next node.',
    techniqueCode: 'CORE-01',
    targetChapterId: 'theory-01',
    targetLevelId: 1,
  },
  {
    id: 2,
    question: 'What are the main parts of a node in a single linked list?',
    options: [
      'Data and a pointer to the next node',
      'Data and two pointers to previous nodes',
      'Only a data value',
      'Index and array size',
    ],
    correctIndex: 0,
    correctAnswerText: 'Data and a pointer to the next node',
    explanation:
      'Every node in a single linked list contains two main parts: the DATA component (holding the value) and the NEXT pointer (holding the address of the next node).',
    techniqueCode: 'CORE-02',
    targetChapterId: 'theory-01',
    targetLevelId: 1,
  },
  {
    id: 3,
    question: 'What does HEAD represent in a single linked list?',
    options: [
      'The first node of the linked list',
      'The last node of the linked list',
      'The middle node of the linked list',
      'The number of nodes in the linked list',
    ],
    correctIndex: 0,
    correctAnswerText: 'The first node of the linked list',
    explanation:
      'HEAD is the pointer pointing to the first node of the linked list. If HEAD is NULL, the list is empty. Also, the last node in the list has its NEXT pointer set to NULL.',
    techniqueCode: 'CORE-03',
    targetChapterId: 'theory-01',
    targetLevelId: 1,
  },
  {
    id: 4,
    question:
      'When inserting a new node at the beginning of a single linked list, what should be done first with the new node\'s NEXT pointer?',
    options: [
      'Point it to the current HEAD',
      'Set it permanently to NULL',
      'Point it to the TAIL',
      'Delete the current HEAD',
    ],
    correctIndex: 0,
    correctAnswerText: 'Point it to the current HEAD',
    explanation:
      'The NEXT pointer connects a node to the following node, so the new node must point to the current HEAD when inserting at the beginning (new_node.next = HEAD) before moving HEAD.',
    techniqueCode: 'INS-01',
    targetChapterId: 'theory-02',
    targetLevelId: 1,
  },
  {
    id: 5,
    question:
      'When inserting a new node at the end of a non-empty single linked list, where should the new node be connected?',
    options: [
      'After the current last node',
      'Before the current first node',
      'Between HEAD and the second node',
      'Before the current last node',
    ],
    correctIndex: 0,
    correctAnswerText: 'After the current last node',
    explanation:
      'To insert at the end, the new node is connected after the current last node by updating the last node\'s NEXT pointer to point to the new node (tail.next = new_node).',
    techniqueCode: 'INS-02',
    targetChapterId: 'theory-02',
    targetLevelId: 1,
  },
  {
    id: 6,
    question:
      'What happens to HEAD when the first node of a single linked list is deleted?',
    options: [
      'HEAD moves to the second node',
      'HEAD remains on the deleted node',
      'HEAD becomes the last node',
      'HEAD is always set to the previous node',
    ],
    correctIndex: 0,
    correctAnswerText: 'HEAD moves to the second node',
    explanation:
      'When deleting the first node, HEAD is updated to point to the second node (HEAD = HEAD.next), and the first node\'s memory is freed.',
    techniqueCode: 'DEL-01',
    targetChapterId: 'theory-03',
    targetLevelId: 2,
  },
  {
    id: 7,
    question:
      'To delete the last node of a single linked list, what should the previous node\'s NEXT pointer become?',
    options: [
      'NULL',
      'HEAD',
      'The deleted node\'s address',
      'The first node\'s DATA',
    ],
    correctIndex: 0,
    correctAnswerText: 'NULL',
    explanation:
      'To delete the last node, traverse to the second-to-last node and set its NEXT pointer to NULL, making it the new end of the list before freeing the old last node.',
    techniqueCode: 'DEL-02',
    targetChapterId: 'theory-03',
    targetLevelId: 2,
  },
  {
    id: 8,
    question: 'How does traversal normally proceed in a single linked list?',
    options: [
      'Start at HEAD and follow NEXT pointers until NULL',
      'Start at TAIL and follow PREVIOUS pointers',
      'Start at the middle and move randomly',
      'Start at HEAD and stop after the first node',
    ],
    correctIndex: 0,
    correctAnswerText: 'Start at HEAD and follow NEXT pointers until NULL',
    explanation:
      'Traversal starts at HEAD and follows NEXT pointers (CURRENT = CURRENT.next) sequentially node by node until reaching NULL.',
    techniqueCode: 'TRAV-01',
    targetChapterId: 'theory-04',
    targetLevelId: 3,
  },
  {
    id: 9,
    question: 'How is an element normally searched for in a single linked list?',
    options: [
      'Visit nodes one by one and compare their DATA values',
      'Check only the first node',
      'Check only the last node',
      'Access any node directly using an array index',
    ],
    correctIndex: 0,
    correctAnswerText: 'Visit nodes one by one and compare their DATA values',
    explanation:
      'Searching in a single linked list requires linear traversal: inspect each node\'s DATA starting from HEAD until the matching value is found or the list terminates at NULL.',
    techniqueCode: 'SEARCH-01',
    targetChapterId: 'theory-05',
    targetLevelId: 4,
  },
  {
    id: 10,
    question:
      'Consider this linked list:\n\nHEAD → [10 | 2002] → [20 | 2003] → [30 | NULL]\n\nIf a new node containing 5 is inserted at the beginning, what should the new structure be?',
    options: [
      'HEAD → [5 | 2001] → [10 | 2002] → [20 | 2003] → [30 | NULL]',
      'HEAD → [10 | 2002] → [5 | 2001] → [20 | 2003] → [30 | NULL]',
      'HEAD → [5 | NULL] → [10 | 2002] → [20 | 2003] → [30 | NULL]',
      'HEAD → [30 | NULL] → [20 | 2003] → [10 | 2002] → [5 | 2001]',
    ],
    correctIndex: 0,
    correctAnswerText:
      'HEAD → [5 | 2001] → [10 | 2002] → [20 | 2003] → [30 | NULL]',
    explanation:
      'When inserting node 5 at the beginning, new_node.next points to address 2001 (containing 10), and HEAD updates to point to the new node 5, resulting in HEAD → [5 | 2001] → [10 | 2002] → [20 | 2003] → [30 | NULL].',
    techniqueCode: 'MASTER-01',
    targetChapterId: 'theory-02',
    targetLevelId: 5,
  },
];

/**
 * Standard Fisher-Yates (Knuth) shuffle algorithm.
 * Returns a new shuffled copy of the array without mutating the input.
 */
export function fisherYatesShuffle<T>(array: readonly T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

/**
 * Generates an independently shuffled set of options for each question
 * with a balanced distribution of correct answers across option slots (A, B, C, D).
 * Never mutates the original question bank.
 */
export function generateShuffledOptions(
  questions: QuizQuestion[]
): Record<number, string[]> {
  const result: Record<number, string[]> = {};
  const total = questions.length;

  // Build a balanced list of target slots for correct answers across the questions (0=A, 1=B, 2=C, 3=D).
  // E.g., for 10 questions: [0, 1, 2, 3, 0, 1, 2, 3, 0, 1]
  const targetSlots: number[] = [];
  for (let i = 0; i < total; i++) {
    targetSlots.push(i % 4);
  }
  // Shuffle the target slots using Fisher-Yates so their assignment to questions is randomized
  const randomizedSlots = fisherYatesShuffle(targetSlots);

  questions.forEach((q, idx) => {
    const numOptions = q.options.length;
    if (numOptions <= 1) {
      result[q.id] = [...q.options];
      return;
    }

    // Determine the target slot for this question's correct answer
    const assignedSlot =
      randomizedSlots[idx] !== undefined
        ? randomizedSlots[idx] % numOptions
        : Math.floor(Math.random() * numOptions);

    const correctText = q.correctAnswerText;
    // Extract distractors (all options except the correct answer)
    const distractors = q.options.filter((opt) => opt !== correctText);

    // Shuffle the distractors independently using Fisher-Yates
    const shuffledDistractors = fisherYatesShuffle(distractors);

    // Assemble the options array with the correct answer placed at assignedSlot
    const shuffled: string[] = new Array(numOptions);
    shuffled[assignedSlot] = correctText;

    let distractorIdx = 0;
    for (let slot = 0; slot < numOptions; slot++) {
      if (slot !== assignedSlot) {
        shuffled[slot] = shuffledDistractors[distractorIdx++];
      }
    }

    result[q.id] = shuffled;
  });

  return result;
}

export const QuizView: React.FC<QuizViewProps> = ({
  onNavigateToTheory,
  onNavigateToQuest,
  onNavigateToProgress,
  onNavigateToHome,
}) => {
  useScrollReveal();

  // Balanced shuffled options mapping: questionId -> array of options
  const [shuffledOptions, setShuffledOptions] = useState<Record<number, string[]>>(() => {
    const session = progressManager.getQuizSession();
    if (
      session.shuffledOptions &&
      typeof session.shuffledOptions === 'object' &&
      QUIZ_QUESTIONS.every(
        (q) =>
          Array.isArray(session.shuffledOptions?.[q.id]) &&
          session.shuffledOptions[q.id].length === q.options.length
      )
    ) {
      return session.shuffledOptions;
    }
    const generated = generateShuffledOptions(QUIZ_QUESTIONS);
    progressManager.saveQuizSession({ shuffledOptions: generated });
    return generated;
  });

  // Quiz active state: restore from progressManager so navigating away does not restart from first
  const [hasStarted, setHasStarted] = useState<boolean>(() => {
    const session = progressManager.getQuizSession();
    const recordedQuestions = progressManager.getAllQuizQuestions();
    const hasAnyRecorded = Object.keys(recordedQuestions).length > 0;
    return !!session.hasStarted || hasAnyRecorded;
  });

  const [isSubmitted, setIsSubmitted] = useState<boolean>(() => {
    const session = progressManager.getQuizSession();
    const central = progressManager.getCentralState();
    return !!session.isSubmitted || !!central.quizSubmitted;
  });

  const [studentAnswers, setStudentAnswers] = useState<Record<number, StudentAnswerRecord>>(() => {
    const session = progressManager.getQuizSession();
    const answers: Record<number, StudentAnswerRecord> = { ...(session.studentAnswers || {}) };
    const sessionShuffled = session.shuffledOptions || {};

    // Reconstruct / sync from progressManager recorded questions
    const recordedQuestions = progressManager.getAllQuizQuestions();
    Object.entries(recordedQuestions).forEach(([qIdStr, rec]) => {
      const qId = Number(qIdStr);
      if (!answers[qId] && rec.status !== 'unanswered') {
        const qDef = QUIZ_QUESTIONS.find((item) => item.id === qId);
        if (qDef) {
          const opts = sessionShuffled[qId] || qDef.options;
          const isTimeout = rec.status === 'timeout' || rec.selectedOptionIndex === -1;
          const isCorrect = rec.status === 'correct';
          const selIdx = rec.selectedOptionIndex !== undefined ? rec.selectedOptionIndex : -1;
          const correctShuffledIndex = opts.indexOf(qDef.correctAnswerText);
          const effectiveCorrectIdx = correctShuffledIndex >= 0 ? correctShuffledIndex : qDef.correctIndex;

          answers[qId] = {
            questionId: qId,
            selectedOptionIndex: selIdx,
            selectedAnswerText:
              selIdx >= 0 && opts[selIdx] ? opts[selIdx] : 'Not Answered',
            correctOptionIndex: effectiveCorrectIdx,
            correctAnswerText: qDef.correctAnswerText,
            isCorrect,
            isTimeout,
            points: rec.points,
          };
        }
      }
    });

    return answers;
  });

  // Navigation within Quiz (0-indexed current question) - restore last visited question
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(() => {
    const session = progressManager.getQuizSession();
    if (
      typeof session.currentQuestionIndex === 'number' &&
      session.currentQuestionIndex >= 0 &&
      session.currentQuestionIndex < QUIZ_QUESTIONS.length
    ) {
      return session.currentQuestionIndex;
    }
    return 0;
  });

  // 20-second independent countdown timer for each question
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const session = progressManager.getQuizSession();
    if (typeof session.timeLeft === 'number' && session.timeLeft > 0 && session.timeLeft <= 20) {
      return session.timeLeft;
    }
    return 20;
  });

  const [currentQuizScore, setCurrentQuizScore] = useState<number>(() =>
    progressManager.getCategoryScore('quiz')
  );

  // Subscribe to progressManager for real-time live score updates
  useEffect(() => {
    const unsub = progressManager.subscribe(() => {
      setCurrentQuizScore(progressManager.getCategoryScore('quiz'));
    });
    return unsub;
  }, []);

  const [pendingSelection, setPendingSelection] = useState<number | null>(null);

  // Helper to change question and persist session index
  const navigateToQuestion = useCallback((newIndex: number) => {
    if (newIndex < 0 || newIndex >= QUIZ_QUESTIONS.length) return;
    setCurrentQuestionIndex(newIndex);
    const targetQ = QUIZ_QUESTIONS[newIndex];
    const isAnswered = studentAnswers[targetQ?.id] !== undefined;
    if (!isAnswered) {
      setTimeLeft(20);
    }
    progressManager.saveQuizSession({
      hasStarted: true,
      currentQuestionIndex: newIndex,
      timeLeft: isAnswered ? 20 : 20,
      shuffledOptions,
    });
  }, [studentAnswers, shuffledOptions]);

  // Save session when unmounting / navigating away to another section
  useEffect(() => {
    return () => {
      if (hasStarted) {
        progressManager.saveQuizSession({
          hasStarted,
          currentQuestionIndex,
          timeLeft,
          isSubmitted,
          studentAnswers,
          shuffledOptions,
        });
      }
    };
  }, [hasStarted, currentQuestionIndex, timeLeft, isSubmitted, studentAnswers, shuffledOptions]);

  // Current question helper
  const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex] || QUIZ_QUESTIONS[0];
  const currentAnswerRecord = studentAnswers[currentQuestion.id];
  const isCurrentQuestionAnswered = currentAnswerRecord !== undefined;

  // Complete & finalize the examination
  const finishQuiz = useCallback((finalAnswers: Record<number, StudentAnswerRecord>) => {
    setIsSubmitted(true);

    const completeAnswers: Record<number, StudentAnswerRecord> = { ...finalAnswers };

    // Ensure every question has an authoritative answer record; any unvisited/skipped question is marked Not Answered (0 pts)
    QUIZ_QUESTIONS.forEach((q) => {
      if (!completeAnswers[q.id]) {
        const opts = shuffledOptions[q.id] || q.options;
        const correctShuffledIndex = opts.indexOf(q.correctAnswerText);
        const effectiveCorrectIdx = correctShuffledIndex >= 0 ? correctShuffledIndex : q.correctIndex;

        completeAnswers[q.id] = {
          questionId: q.id,
          selectedOptionIndex: -1,
          selectedAnswerText: 'Not Answered',
          correctOptionIndex: effectiveCorrectIdx,
          correctAnswerText: q.correctAnswerText,
          isCorrect: false,
          isTimeout: true,
          points: 0,
        };
        progressManager.recordQuizQuestion(q.id, 'timeout', -1);
      }
    });

    setStudentAnswers(completeAnswers);

    let calculatedCorrect = 0;
    QUIZ_QUESTIONS.forEach((q) => {
      const rec = completeAnswers[q.id];
      if (rec && rec.isCorrect) calculatedCorrect++;
    });

    const rawScoresMap: Record<number, number> = {};
    (Object.values(completeAnswers) as StudentAnswerRecord[]).forEach((rec) => {
      rawScoresMap[rec.questionId] = rec.selectedOptionIndex;
    });

    progressManager.recordQuizCompletion(rawScoresMap, calculatedCorrect, QUIZ_QUESTIONS.length);
    progressManager.saveQuizSession({
      hasStarted: true,
      isSubmitted: true,
      studentAnswers: completeAnswers,
      currentQuestionIndex,
      shuffledOptions,
    });

    if (calculatedCorrect >= 6) {
      soundManager.playQuizComplete();
    } else {
      soundManager.playQuizWrong();
    }
  }, [currentQuestionIndex, shuffledOptions]);

  // Automatic timeout handler when 20 seconds expire
  const handleTimeout = useCallback(() => {
    const q = QUIZ_QUESTIONS[currentQuestionIndex];
    if (!q || studentAnswers[q.id] !== undefined) return;

    soundManager.playError();

    const opts = shuffledOptions[q.id] || q.options;
    const correctShuffledIndex = opts.indexOf(q.correctAnswerText);
    const effectiveCorrectIdx = correctShuffledIndex >= 0 ? correctShuffledIndex : q.correctIndex;

    const newRecord: StudentAnswerRecord = {
      questionId: q.id,
      selectedOptionIndex: -1,
      selectedAnswerText: 'Not Answered',
      correctOptionIndex: effectiveCorrectIdx,
      correctAnswerText: q.correctAnswerText,
      isCorrect: false,
      isTimeout: true,
      points: 0,
    };

    const updatedAnswers = {
      ...studentAnswers,
      [q.id]: newRecord,
    };
    setStudentAnswers(updatedAnswers);

    // Record internally as timeout (awards exactly 0 points)
    progressManager.recordQuizQuestion(q.id, 'timeout', -1);

    // Automatically proceed to next question if one remains, or finish quiz if final question
    if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setTimeLeft(20);
      progressManager.saveQuizSession({
        hasStarted: true,
        currentQuestionIndex: nextIndex,
        timeLeft: 20,
        studentAnswers: updatedAnswers,
        shuffledOptions,
      });
    } else {
      finishQuiz(updatedAnswers);
    }
  }, [currentQuestionIndex, studentAnswers, shuffledOptions, finishQuiz]);

  // Start quiz action: freshly randomize options with balanced Fisher-Yates distribution
  const handleStartQuiz = () => {
    soundManager.playClick();
    const freshShuffled = generateShuffledOptions(QUIZ_QUESTIONS);
    setShuffledOptions(freshShuffled);
    setHasStarted(true);
    setCurrentQuestionIndex(0);
    setTimeLeft(20);
    setPendingSelection(null);
    setStudentAnswers({});
    progressManager.resetQuizSession();
    progressManager.saveQuizSession({
      hasStarted: true,
      currentQuestionIndex: 0,
      timeLeft: 20,
      isSubmitted: false,
      studentAnswers: {},
      shuffledOptions: freshShuffled,
    });
  };

  // Internal reset helper
  const handleRetakeQuiz = () => {
    soundManager.playNav();
    const freshShuffled = generateShuffledOptions(QUIZ_QUESTIONS);
    setShuffledOptions(freshShuffled);
    setHasStarted(false);
    setIsSubmitted(false);
    setStudentAnswers({});
    setCurrentQuestionIndex(0);
    setPendingSelection(null);
    setTimeLeft(20);
    progressManager.resetQuizSession();
    progressManager.saveQuizSession({
      shuffledOptions: freshShuffled,
    });
  };

  // Timer countdown effect: 20 seconds for each question once quiz starts
  useEffect(() => {
    if (!hasStarted || isSubmitted || isCurrentQuestionAnswered) {
      return;
    }

    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, isSubmitted, isCurrentQuestionAnswered, timeLeft, handleTimeout]);

  // Synchronize selection with current question record
  useEffect(() => {
    if (currentAnswerRecord !== undefined) {
      setPendingSelection(currentAnswerRecord.selectedOptionIndex);
    } else {
      setPendingSelection(null);
    }
  }, [currentQuestionIndex, currentAnswerRecord]);

  // Calculate score stats
  const { score, wrongCount, unansweredCount, totalQuestions, percentage } = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    QUIZ_QUESTIONS.forEach((q) => {
      const rec = studentAnswers[q.id];
      if (rec) {
        if (rec.isCorrect) {
          correct++;
        } else if (rec.isTimeout || rec.selectedOptionIndex < 0) {
          unanswered++;
        } else {
          wrong++;
        }
      }
    });

    const total = QUIZ_QUESTIONS.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return {
      score: correct,
      wrongCount: wrong,
      unansweredCount: unanswered,
      totalQuestions: total,
      percentage: pct,
      correctAnswersCount: correct,
    };
  }, [studentAnswers]);

  // Handle student selecting an option (disabled before Start Quiz)
  const handleSelectOption = (optionIndex: number) => {
    if (!hasStarted || isCurrentQuestionAnswered) return;
    soundManager.playQuizSelect();
    setPendingSelection(optionIndex);
  };

  // Handle confirming answer with IMMEDIATE evaluation and point update (+3 or -1)
  const handleConfirmAnswer = () => {
    if (!hasStarted || pendingSelection === null || isCurrentQuestionAnswered) return;

    const q = currentQuestion;
    const opts = shuffledOptions[q.id] || q.options;
    const selectedText = opts[pendingSelection] || '';
    const isCorrect = selectedText.trim() === q.correctAnswerText.trim();
    const correctShuffledIndex = opts.indexOf(q.correctAnswerText);
    const effectiveCorrectIdx = correctShuffledIndex >= 0 ? correctShuffledIndex : q.correctIndex;

    const newRecord: StudentAnswerRecord = {
      questionId: q.id,
      selectedOptionIndex: pendingSelection,
      selectedAnswerText: selectedText,
      correctOptionIndex: effectiveCorrectIdx,
      correctAnswerText: q.correctAnswerText,
      isCorrect,
      isTimeout: false,
      points: isCorrect ? 3 : -1,
    };

    const updatedAnswers = {
      ...studentAnswers,
      [q.id]: newRecord,
    };

    setStudentAnswers(updatedAnswers);

    // Immediately award (+3) or deduct (-1) points
    progressManager.recordQuizQuestion(q.id, isCorrect ? 'correct' : 'wrong', pendingSelection);

    // Persist session immediately so tab navigation preserves state
    progressManager.saveQuizSession({
      hasStarted: true,
      currentQuestionIndex,
      timeLeft,
      studentAnswers: updatedAnswers,
      shuffledOptions,
    });

    if (isCorrect) {
      soundManager.playQuizCorrect();
    } else {
      soundManager.playQuizWrong();
    }
  };

  // Handle submitting the entire examination when review is ready
  const handleSubmitExamination = () => {
    const updatedAnswers = { ...studentAnswers };
    if (pendingSelection !== null && !updatedAnswers[currentQuestion.id]) {
      const q = currentQuestion;
      const opts = shuffledOptions[q.id] || q.options;
      const selectedText = opts[pendingSelection] || '';
      const isCorrect = selectedText.trim() === q.correctAnswerText.trim();
      const correctShuffledIndex = opts.indexOf(q.correctAnswerText);
      const effectiveCorrectIdx = correctShuffledIndex >= 0 ? correctShuffledIndex : q.correctIndex;

      const newRecord: StudentAnswerRecord = {
        questionId: q.id,
        selectedOptionIndex: pendingSelection,
        selectedAnswerText: selectedText,
        correctOptionIndex: effectiveCorrectIdx,
        correctAnswerText: q.correctAnswerText,
        isCorrect,
        isTimeout: false,
        points: isCorrect ? 3 : -1,
      };
      updatedAnswers[q.id] = newRecord;
      setStudentAnswers(updatedAnswers);
      progressManager.recordQuizQuestion(q.id, isCorrect ? 'correct' : 'wrong', pendingSelection);
    }

    finishQuiz(updatedAnswers);
  };

  const getPerformanceFeedback = (score: number) => {
    if (score >= 9) {
      return {
        badge: 'OUTSTANDING MASTERY (GRADE A+)',
        message: 'Excellent! You have a strong understanding of Single Linked Lists.',
      };
    }
    if (score >= 7) {
      return {
        badge: 'GOOD WORK (GRADE B+)',
        message: 'Good work! Review a few operations to strengthen your understanding.',
      };
    }
    if (score >= 5) {
      return {
        badge: 'PROGRESSING (GRADE C)',
        message: "You're getting there! Review insertion, deletion, and traversal.",
      };
    }
    return {
      badge: 'REVIEW NEEDED',
      message: 'Keep learning! Review the basic structure and operations of Single Linked Lists.',
    };
  };

  const answeredCount = Object.keys(studentAnswers).length;
  const feedback = getPerformanceFeedback(score);

  const certificateTheme = useMemo(() => {
    if (percentage >= 80) {
      return {
        cardBorder: 'border-2 border-emerald-500/40 dark:border-emerald-500/40 shadow-emerald-500/5 dark:shadow-[0_8px_30px_rgba(16,185,129,0.15)]',
        trophyBg: 'bg-[#00A86B] dark:bg-emerald-600 shadow-emerald-500/20 dark:shadow-emerald-950/50',
        badge: 'border border-[#00A86B]/40 dark:border-emerald-500/40 bg-[#E6F8F0] dark:bg-emerald-950/60 text-[#008A54] dark:text-emerald-300',
        scoreCardBorder: 'border-2 border-emerald-300/80 dark:border-emerald-500/40 shadow-[0_8px_30px_rgba(16,185,129,0.12)] dark:shadow-[0_8px_30px_rgba(16,185,129,0.2)]',
        scoreTag: 'text-emerald-600 dark:text-emerald-400',
        scoreText: 'text-[#00A86B] dark:text-emerald-400',
        accuracyPill: 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200',
        correctStat: 'text-[#00A86B] dark:text-emerald-400',
      };
    } else if (percentage >= 40) {
      return {
        cardBorder: 'border-2 border-sky-400/50 dark:border-sky-500/40 shadow-sky-500/5 dark:shadow-[0_8px_30px_rgba(14,165,233,0.15)]',
        trophyBg: 'bg-sky-500 dark:bg-sky-600 shadow-sky-500/20 dark:shadow-sky-950/50',
        badge: 'border border-sky-400/50 dark:border-sky-500/40 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300',
        scoreCardBorder: 'border-2 border-sky-300/80 dark:border-sky-500/40 shadow-[0_8px_30px_rgba(14,165,233,0.12)] dark:shadow-[0_8px_30px_rgba(14,165,233,0.2)]',
        scoreTag: 'text-sky-600 dark:text-sky-400',
        scoreText: 'text-sky-500 dark:text-sky-400',
        accuracyPill: 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-200 dark:border-sky-500/30 text-sky-800 dark:text-sky-200',
        correctStat: 'text-sky-500 dark:text-sky-400',
      };
    } else {
      return {
        cardBorder: 'border-2 border-amber-400/50 dark:border-amber-500/40 shadow-amber-500/5 dark:shadow-[0_8px_30px_rgba(245,158,11,0.15)]',
        trophyBg: 'bg-amber-500 dark:bg-amber-600 shadow-amber-500/20 dark:shadow-amber-950/50',
        badge: 'border border-amber-400/50 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
        scoreCardBorder: 'border-2 border-amber-300/80 dark:border-amber-500/40 shadow-[0_8px_30px_rgba(245,158,11,0.12)] dark:shadow-[0_8px_30px_rgba(245,158,11,0.2)]',
        scoreTag: 'text-amber-600 dark:text-amber-400',
        scoreText: 'text-amber-500 dark:text-amber-400',
        accuracyPill: 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200',
        correctStat: 'text-amber-500 dark:text-amber-400',
      };
    }
  }, [percentage]);

  return (
    <div className="w-full max-w-4xl mx-auto py-4 px-4 font-sans text-slate-900 dark:text-white animate-page-enter">
      {/* =========================================================================
          1. QUIZ HEADER
         ========================================================================= */}
      <div className="bg-white dark:bg-[#0B1228] border border-slate-200/90 dark:border-blue-900/30 rounded-2xl p-4 sm:p-5 mb-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Quiz Assessment
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Validate your algorithmic Single Linked List reasoning and earn mastery points (Basic to Hard).
            </p>
          </div>
        </div>

        <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-xs sm:text-sm font-sans font-medium text-slate-700 dark:text-slate-300">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </div>
      </div>

      {/* =========================================================================
          2. QUIZ SCORING RULES PANEL (NO TIMER INDICATOR)
         ========================================================================= */}
      <div
        id="quiz-scoring-rules-panel"
        className="p-4 sm:p-5 rounded-2xl bg-[#EFF6FF] dark:bg-blue-950/20 border border-[#BFDBFE] dark:border-blue-800/40 shadow-xs mb-5 font-sans"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
            <span className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-[#1E3A8A] dark:text-blue-300">
              QUIZ SCORING RULES
            </span>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-white/90 dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/40 shadow-xs">
            Maximum positive Quiz score: 30 pts
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs font-mono">
          <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-[#070B18] border border-emerald-300 dark:border-emerald-500/40 flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400">Correct answer:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">+3 pts</span>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-[#070B18] border border-rose-300 dark:border-rose-500/40 flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400">Wrong answer:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">-1 pt</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. SLIM PROGRESS BAR
         ========================================================================= */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mb-4">
        <div
          className="bg-[#2563EB] h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.round((answeredCount / totalQuestions) * 100)}%` }}
        />
      </div>

      {/* =========================================================================
          4. Q1 TO Q10 NAVIGATION ROW
         ========================================================================= */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-6">
        {QUIZ_QUESTIONS.map((q, idx) => {
          const isCurrent = currentQuestionIndex === idx;
          const isAnswered = studentAnswers[q.id] !== undefined;

          return (
            <button
              key={q.id}
              id={`btn-quiz-jump-${q.id}`}
              disabled={!hasStarted}
              onClick={() => {
                soundManager.playNav();
                navigateToQuestion(idx);
              }}
              className={`py-2 text-center text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                !hasStarted
                  ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-[#0B1228] border-slate-200 dark:border-blue-900/30 text-slate-400'
                  : isCurrent
                  ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                  : isAnswered
                  ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-300'
                  : 'bg-white dark:bg-[#0B1228] border-slate-200 dark:border-blue-900/30 text-slate-700 dark:text-slate-300 hover:border-blue-300'
              }`}
            >
              <span>Q{idx + 1}</span>
            </button>
          );
        })}
      </div>

      {/* QUIZ COMPLETION REVIEW VIEW */}
      {isSubmitted ? (
        <div className="space-y-8">
          <div
            id="quiz-result-card"
            className={`p-6 sm:p-10 lg:p-12 bg-white dark:bg-[#0B1228] rounded-3xl flex flex-col items-center justify-center text-center animate-editorial-scale transition-all ${certificateTheme.cardBorder}`}
          >
            {/* Top Achievement Trophy Icon */}
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg mx-auto mb-4 sm:mb-5 ${certificateTheme.trophyBg}`}
            >
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-white stroke-[2.2]" />
            </div>

            {/* Achievement Badge */}
            <div
              className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full font-mono text-[11px] sm:text-xs font-bold tracking-wider uppercase mb-3 sm:mb-4 ${certificateTheme.badge}`}
            >
              ✦ {feedback.badge} ✦
            </div>

            {/* Main Completion Heading */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B192C] dark:text-white tracking-tight uppercase mb-3">
              Single Linked List Knowledge Check Complete!
            </h2>

            {/* Supporting Description */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed font-normal mb-6 sm:mb-8">
              {feedback.message}
            </p>

            {/* Highlighted Score Card */}
            <div
              className={`w-full max-w-md mx-auto p-6 sm:p-8 bg-white dark:bg-[#070B18] rounded-3xl flex flex-col items-center justify-center text-center mb-6 sm:mb-8 ${certificateTheme.scoreCardBorder}`}
            >
              <span
                className={`text-[11px] sm:text-xs font-mono font-bold tracking-[0.2em] uppercase mb-2 ${certificateTheme.scoreTag}`}
              >
                FINAL QUIZ SCORE
              </span>
              <div
                className={`text-5xl sm:text-6xl font-black font-sans tracking-tight leading-none my-2 ${certificateTheme.scoreText}`}
              >
                {currentQuizScore} / 30 pts
              </div>
              <div
                className={`mt-3 px-4 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-semibold border ${certificateTheme.accuracyPill}`}
              >
                Correct Answers: {score} of {totalQuestions} ({percentage}%)
              </div>
            </div>

            {/* Summary Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full max-w-2xl mx-auto">
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#070B18] border border-slate-200/90 dark:border-blue-900/40 shadow-xs flex flex-col items-center justify-center text-center">
                <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1.5">
                  CORRECT ANSWERS (+3)
                </span>
                <span
                  className={`text-xl sm:text-2xl font-extrabold font-mono flex items-center justify-center gap-1.5 ${certificateTheme.correctStat}`}
                >
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  {score}
                </span>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#070B18] border border-slate-200/90 dark:border-blue-900/40 shadow-xs flex flex-col items-center justify-center text-center">
                <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1.5">
                  INCORRECT (-1)
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-rose-500 dark:text-rose-400 font-mono">
                  {wrongCount}
                </span>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#070B18] border border-slate-200/90 dark:border-blue-900/40 shadow-xs flex flex-col items-center justify-center text-center">
                <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1.5">
                  ACCURACY
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {percentage}%
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-4 mt-8 w-full max-w-xl mx-auto">
              <button
                id="btn-quiz-review-answers"
                type="button"
                onClick={() => {
                  soundManager.playNav();
                  const el = document.getElementById('quiz-question-overview-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-2.5 rounded-xl bg-[#EFF6FF] dark:bg-blue-950/60 border border-[#BFDBFE] dark:border-blue-900/40 text-[#2563EB] dark:text-blue-300 font-sans text-xs sm:text-sm font-semibold shadow-xs hover:bg-[#DBEAFE] dark:hover:bg-blue-900/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ListOrdered className="w-4 h-4" />
                <span>Review Answers</span>
              </button>

              <button
                id="btn-quiz-continue-learning"
                type="button"
                onClick={() => {
                  soundManager.playNav();
                  if (onNavigateToQuest) {
                    onNavigateToQuest(1);
                  } else if (onNavigateToHome) {
                    onNavigateToHome();
                  }
                }}
                className="btn-modern-primary px-5 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Gamepad2 className="w-4 h-4 text-white" />
                <span>Continue Learning</span>
              </button>
            </div>
          </div>

          {/* QUESTION OVERVIEW SECTION */}
          <div id="quiz-question-overview-section" className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-blue-900/25">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 font-display">
                <ListOrdered className="w-5 h-5 text-[#2563EB] dark:text-blue-400" />
                <span>Full Question-by-Question Review</span>
              </h3>
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold font-mono">
                {score} of {totalQuestions} Correct • Final Score: {currentQuizScore} / 30 pts
              </span>
            </div>

            <div className="space-y-5">
              {QUIZ_QUESTIONS.map((q, idx) => {
                const rec = studentAnswers[q.id];
                const isCorrect = rec?.isCorrect || false;
                const isSkipped = !rec || rec.isTimeout || rec.selectedOptionIndex < 0;
                const cleanQuestionText = q.question.replace(/^\d+\.\s*/, '');
                const questionNumberStr = idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`;

                // Shuffled options for this question in this attempt
                const opts = shuffledOptions[q.id] || q.options;
                const correctShuffledIndex = opts.indexOf(q.correctAnswerText);
                const effectiveCorrectIdx =
                  correctShuffledIndex >= 0
                    ? correctShuffledIndex
                    : rec?.correctOptionIndex !== undefined && rec.correctOptionIndex >= 0
                    ? rec.correctOptionIndex
                    : q.correctIndex;
                const correctLetter = String.fromCharCode(65 + effectiveCorrectIdx);

                // User submission details
                const hasSelected = rec && rec.selectedOptionIndex >= 0;
                const userSelectedLetter = hasSelected
                  ? String.fromCharCode(65 + rec.selectedOptionIndex)
                  : '';
                const userSelectedText = hasSelected ? rec.selectedAnswerText : 'Not Answered';

                return (
                  <div
                    key={q.id}
                    id={`quiz-review-card-${q.id}`}
                    data-question-id={q.id}
                    className={`p-6 sm:p-7 rounded-[22px] sm:rounded-[24px] bg-white dark:bg-[#0B1228] transition-all shadow-xs dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] ${
                      isCorrect
                        ? 'border-2 border-emerald-400 dark:border-emerald-500/50'
                        : isSkipped
                        ? 'border-2 border-amber-300 dark:border-amber-500/50'
                        : 'border-2 border-rose-300 dark:border-rose-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="px-3 py-1 bg-[#2563EB] dark:bg-blue-600 text-white rounded-full text-xs font-bold font-mono tracking-wide shadow-xs inline-flex items-center justify-center">
                          Question {questionNumberStr}
                        </span>
                        <span className="text-xs font-bold text-[#2563EB] dark:text-blue-300 font-mono tracking-wider">
                          {q.techniqueCode}
                        </span>
                      </div>

                      <div>
                        {isCorrect ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E6F8F0] dark:bg-emerald-950/60 border border-[#00A86B]/30 dark:border-emerald-500/30 text-[#008A54] dark:text-emerald-300 rounded-lg text-xs font-bold font-sans">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Correct (+3 pts)</span>
                          </div>
                        ) : isSkipped ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-bold font-sans">
                            <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Not Answered (0 pts)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-bold font-sans">
                            <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Incorrect (-1 pt)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-3.5 mb-4 leading-snug break-words whitespace-pre-line">
                      {cleanQuestionText}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                      <div
                        className={`p-3.5 sm:p-4 rounded-xl border ${
                          isCorrect
                            ? 'bg-[#E8FAF0] dark:bg-emerald-950/40 border-[#A7F3D0] dark:border-emerald-500/30'
                            : isSkipped
                            ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40'
                            : 'bg-[#FEECEB] dark:bg-rose-950/40 border-rose-200 dark:border-rose-500/30'
                        }`}
                      >
                        <div
                          className={`text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase mb-1.5 font-sans ${
                            isCorrect
                              ? 'text-emerald-800 dark:text-emerald-300'
                              : isSkipped
                              ? 'text-amber-800 dark:text-amber-300'
                              : 'text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          YOUR SUBMISSION:
                        </div>
                        <div className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 break-words">
                          {hasSelected
                            ? `${userSelectedLetter}: ${userSelectedText}`
                            : 'Not Answered'}
                        </div>
                      </div>

                      <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-blue-900/30 bg-[#F8FAFC] dark:bg-[#070B18]">
                        <div className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400 mb-1.5 font-sans">
                          CORRECT ANSWER (+3 PTS):
                        </div>
                        <div className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 break-words">
                          {correctLetter}: {q.correctAnswerText}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] dark:bg-[#070B18] border border-slate-200 dark:border-blue-900/25 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-2">
                        <HelpCircle className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
                        <span>Technical Explanation:</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed mb-3 font-normal">
                        {q.explanation}
                      </p>

                      {q.exampleSnippet && (
                        <div className="mb-3 p-2.5 bg-white dark:bg-[#0B1228] border border-slate-200 dark:border-blue-900/40 rounded-lg font-mono text-xs text-[#1D4ED8] dark:text-blue-300 font-semibold">
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
                            className="text-[#2563EB] dark:text-blue-400 hover:text-[#1D4ED8] dark:hover:text-blue-300 font-semibold text-xs inline-flex items-center gap-1.5 hover:underline cursor-pointer"
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
                            <Gamepad2 className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" />
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
            className={`p-6 sm:p-8 border rounded-2xl transition-all bg-white dark:bg-[#0B1228] shadow-xs dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] animate-chapter-switch ${
              isCurrentQuestionAnswered
                ? currentAnswerRecord?.isCorrect
                  ? 'border-emerald-300 dark:border-emerald-500/40 ring-1 ring-emerald-200 dark:ring-emerald-500/30'
                  : 'border-rose-300 dark:border-rose-500/40 ring-1 ring-rose-200 dark:ring-rose-500/30'
                : 'border-slate-200 dark:border-blue-900/30'
            }`}
          >
            {/* =========================================================================
                1. START QUIZ BUTTON (PROMINENT BLUE BUTTON AT VERY TOP OF QUESTION CARD)
               ========================================================================= */}
            {!hasStarted && (
              <div id="quiz-start-header-bar" className="mb-6 pb-5 border-b border-slate-100 dark:border-blue-900/30 flex flex-wrap items-center justify-between gap-3">
                <button
                  id="btn-start-quiz"
                  type="button"
                  onClick={handleStartQuiz}
                  className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm sm:text-base rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                >
                  <Play className="w-5 h-5 fill-white text-white shrink-0" />
                  <span>Start Quiz</span>
                </button>
                <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-sans">
                  Click to start quiz and unlock answer choices
                </span>
              </div>
            )}

            {/* =========================================================================
                2. DIFFICULTY, QUESTION-TYPE LABELS & 20-SECOND COUNTDOWN TIMER
               ========================================================================= */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-mono border ${
                    currentQuestion.id <= 4
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                      : currentQuestion.id <= 7
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40'
                      : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40'
                  }`}
                >
                  {currentQuestion.id <= 4
                    ? '★ BASIC LEVEL'
                    : currentQuestion.id <= 7
                    ? '★★ INTERMEDIATE'
                    : '★★★ HARD LEVEL'}
                </span>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold font-mono">
                  MULTIPLE CHOICE
                </span>
              </div>

              {/* 20-Second Countdown Timer Display */}
              {hasStarted && !isCurrentQuestionAnswered && (
                <div
                  id="quiz-question-timer"
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-xs sm:text-sm shadow-xs transition-colors ${
                    timeLeft <= 5
                      ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 animate-pulse'
                      : 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  <Clock className={`w-4 h-4 shrink-0 ${timeLeft <= 5 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`} />
                  <span>Time: {timeLeft}s</span>
                </div>
              )}
            </div>

            {/* =========================================================================
                3. QUESTION TEXT
               ========================================================================= */}
            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-6 leading-snug break-words whitespace-pre-line">
              {currentQuestion.question}
            </p>

            {/* =========================================================================
                4. ANSWER OPTIONS
               ========================================================================= */}
            <div className="space-y-3">
              {(() => {
                const displayedOptions = shuffledOptions[currentQuestion.id] || currentQuestion.options;
                const correctOptionIndex = displayedOptions.indexOf(currentQuestion.correctAnswerText);
                const effectiveCorrectIndex =
                  correctOptionIndex >= 0 ? correctOptionIndex : currentQuestion.correctIndex;

                return displayedOptions.map((opt, optIdx) => {
                  const isSelected = pendingSelection === optIdx;
                  let optStyle = '';

                  if (!hasStarted) {
                    optStyle =
                      'bg-slate-50/70 dark:bg-[#080D1F]/60 border-slate-200/80 dark:border-blue-900/20 text-slate-400 dark:text-slate-500 opacity-60 cursor-not-allowed select-none';
                  } else if (isCurrentQuestionAnswered) {
                    if (optIdx === effectiveCorrectIndex) {
                      optStyle =
                        'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-bold ring-2 ring-emerald-400 dark:ring-emerald-500/40 cursor-default';
                    } else if (isSelected && !currentAnswerRecord?.isCorrect) {
                      optStyle =
                        'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-950 dark:text-rose-200 font-bold cursor-default';
                    } else {
                      optStyle =
                        'bg-white dark:bg-[#080D1F] opacity-40 border-slate-200 dark:border-blue-900/20 text-slate-400 dark:text-slate-500 cursor-not-allowed';
                    }
                  } else if (isSelected) {
                    optStyle =
                      'bg-[#EFF6FF] dark:bg-blue-950/60 border-[#2563EB] dark:border-blue-500 text-[#1D4ED8] dark:text-blue-200 font-semibold ring-2 ring-[#2563EB]/40 dark:ring-blue-500/30 cursor-pointer';
                  } else {
                    optStyle =
                      'bg-white dark:bg-[#080D1F] border-slate-200 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-[#0F1733] text-slate-800 dark:text-slate-200 cursor-pointer';
                  }

                  return (
                    <button
                      key={optIdx}
                      id={`quiz-q${currentQuestion.id}-opt${optIdx}`}
                      onClick={() => handleSelectOption(optIdx)}
                      disabled={!hasStarted || isCurrentQuestionAnswered}
                      style={{ animationDelay: `${(optIdx + 1) * 60}ms` }}
                      className={`w-full p-4 text-left text-sm font-sans rounded-xl border transition-all flex items-start gap-3.5 animate-chapter-switch ${optStyle}`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border text-xs font-bold font-mono ${
                          !hasStarted
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
                            : isCurrentQuestionAnswered
                            ? optIdx === effectiveCorrectIndex
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : isSelected
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-slate-100 dark:bg-[#0B1228] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-blue-900/40'
                            : isSelected
                            ? 'bg-[#2563EB] dark:bg-blue-600 text-white border-[#2563EB] dark:border-blue-500'
                            : 'bg-slate-100 dark:bg-[#0B1228] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-blue-900/40'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="flex-1 pt-0.5 leading-relaxed break-words">{opt}</span>
                    </button>
                  );
                });
              })()}
            </div>

            {/* =========================================================================
                5. EXISTING ANSWER SUBMISSION CONTROLS
               ========================================================================= */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-blue-900/20 flex flex-wrap items-center justify-between gap-3">
              {/* Previous Question Button */}
              <button
                disabled={currentQuestionIndex === 0 || !hasStarted}
                onClick={() => {
                  soundManager.playNav();
                  navigateToQuestion(Math.max(0, currentQuestionIndex - 1));
                }}
                className={`px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070B18] text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 transition-all ${
                  currentQuestionIndex === 0 || !hasStarted
                    ? 'opacity-40 cursor-not-allowed pointer-events-none'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-xs'
                }`}
              >
                ← Previous Question
              </button>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-3">
                {!hasStarted ? (
                  <button
                    disabled
                    className="bg-[#93C5FD] dark:bg-blue-900/40 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm cursor-not-allowed opacity-60"
                  >
                    Submit Answer
                  </button>
                ) : !isCurrentQuestionAnswered ? (
                  <button
                    id="btn-confirm-answer"
                    disabled={pendingSelection === null}
                    onClick={handleConfirmAnswer}
                    className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all flex items-center gap-2 ${
                      pendingSelection !== null
                        ? 'bg-[#2563EB] hover:bg-blue-700 shadow-xs cursor-pointer'
                        : 'bg-[#93C5FD] dark:bg-blue-900/40 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Submit Answer</span>
                  </button>
                ) : currentQuestionIndex < totalQuestions - 1 ? (
                  <button
                    id="btn-next-question"
                    onClick={() => {
                      soundManager.playClick();
                      navigateToQuestion(currentQuestionIndex + 1);
                    }}
                    className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    id="btn-finish-quiz"
                    onClick={handleSubmitExamination}
                    className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Award className="w-4 h-4" />
                    <span>Complete & Review</span>
                  </button>
                )}
              </div>
            </div>

            {/* Technical Explanation Panel (visible once answered) */}
            {isCurrentQuestionAnswered && (
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-blue-900/20 bg-slate-50 dark:bg-[#080D1F] rounded-xl p-4 sm:p-5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-2">
                  <HelpCircle className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
                  <span>Technical Explanation:</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3 font-normal text-sm">
                  {currentQuestion.explanation}
                </p>

                {currentQuestion.exampleSnippet && (
                  <div className="mb-3 p-3 bg-white dark:bg-[#0B1228] border border-slate-200 dark:border-blue-900/40 rounded-lg font-mono text-xs text-[#1D4ED8] dark:text-blue-300 font-semibold">
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
                      className="text-[#2563EB] dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
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
                      <Gamepad2 className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" />
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
