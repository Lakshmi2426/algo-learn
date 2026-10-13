export type TabType = 'home' | 'theory' | 'lab' | 'game' | 'quiz' | 'progress';

export interface StackItem {
  id: string;
  value: number | string;
  color?: string;
  isTop?: boolean;
  addedAt: number;
}

export type OperationType =
  | 'PUSH'
  | 'POP'
  | 'ENQUEUE'
  | 'DEQUEUE'
  | 'PEEK'
  | 'PEEK_FRONT'
  | 'PEEK_REAR'
  | 'ISEMPTY'
  | 'ISFULL'
  | 'CLEAR'
  | 'SWAP'
  | 'DUP'
  | 'REVERSE'
  | 'SORT'
  | 'SEARCH'
  | 'ROTATE'
  | 'CYCLE'
  | 'RESIZE'
  | 'BATCH_PUSH'
  | 'BATCH_ENQUEUE';

export interface OperationLog {
  id: string;
  operation: OperationType;
  value?: number | string;
  success: boolean;
  message: string;
  timestamp: Date;
  stackSnapshot: (number | string)[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: string;
  category: 'beginner' | 'mastery' | 'speed' | 'quiz';
}

export interface UserProgress {
  xp: number;
  queueScore?: number;
  level: number;
  streakDays: number;
  lastActiveDate: string;
  completedGameLevels: number[];
  completedTheoryChapters: number[];
  quizCompleted: boolean;
  quizHighScore: number;
  quizTotalQuestionsAnswered: number;
  completedLabs?: number[];
  quizQuestionResults?: Record<number, 'correct' | 'incorrect' | 'timeout'>;
  quizSession?: {
    currentIdx: number;
    answers: Record<number, any>;
    quizStarted: boolean;
    quizFinished: boolean;
    timeRemaining: number;
  };
  queueDeductions?: number;
  totalPushes: number;
  totalPops: number;
  achievements: string[]; // achievement ids
  awardedEventKeys: string[]; // prevents duplicate XP rewards
  history: {
    title: string;
    description: string;
    xpEarned: number;
    timestamp: string;
  }[];
}

export type TheoryCategoryKey = '01' | '02' | '03' | '04' | '05';

export interface TheoryLesson {
  id: number;
  chapterNumber?: string;
  categoryLabel?: string;
  categoryId?: string;
  categoryTitle?: string;
  lessonNumber?: number;
  title: string;
  shortDesc: string;
  readTime: string;
  executiveDefinition?: string;
  content?: string;
  analogy?: {
    title: string;
    description: string;
    diagram?: string;
  };
  example?: {
    title: string;
    description: string;
    steps?: string[];
  };
  criticalSpecifications?: string[];
  visualDiagram?: {
    type: 'stack-ascii' | 'queue-ascii' | 'lifo-sequence' | 'fifo-sequence' | 'before-after' | 'array-table' | 'linked-list' | 'brackets' | 'callstack' | 'maze' | 'browser' | 'comparison' | 'complexity-table' | string;
    beforeState?: (string | number)[];
    afterState?: (string | number)[];
    operationLabel?: string;
    notes?: string;
    diagramText?: string;
  };
  algorithmSteps?: string[];
  pseudocode?: string;
  codeSnippet?: {
    c?: string;
    cpp?: string;
    java?: string;
    python?: string;
  };
  timeComplexity?: string;
  spaceComplexity?: string;
  keyTakeaway: string;
  interactiveDemoType?:
    | 'lifo'
    | 'push-pop-sandbox'
    | 'top-pointer'
    | 'mini-operations'
    | 'algorithm-flowchart'
    | 'overflow-underflow'
    | 'array-stack'
    | 'linkedlist-stack'
    | 'complexity-table'
    | 'problem-solving'
    | 'real-world'
    | 'quick-summary'
    | 'array-vs-list'
    | 'brackets'
    | 'expression-converter'
    | 'callstack'
    | 'browser-history'
    | 'undo-redo'
    | 'practice-problems'
    | 'queue-sandbox'
    | 'queue-fifo'
    | 'queue-pointers'
    | 'queue-enqueue'
    | 'queue-dequeue'
    | 'queue-circular'
    | 'queue-linkedlist'
    | 'queue-deque'
    | 'queue-priority'
    | 'queue-bfs'
    | 'queue-complexity'
    | 'queue-real-world'
    | 'queue-diagram'
    | 'queue-summary';
  practiceQuestions?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

// Backwards compatibility alias
export type TheoryChapter = TheoryLesson;

export interface TheoryCategoryMeta {
  id: TheoryCategoryKey;
  number: string;
  title: string;
  shortTitle: string;
  description: string;
  iconName: string;
  badge: string;
  lessons: TheoryLesson[];
}

export interface GameChallenge {
  id: string;
  challengeNumber: number;
  totalChallengesInLevel: number;
  mode:
    | 'pop'
    | 'push'
    | 'build'
    | 'predict'
    | 'debug'
    | 'speed'
    | 'enqueue'
    | 'dequeue'
    | 'peek'
    | 'identify_front'
    | 'identify_rear'
    | 'overflow'
    | 'underflow'
    | 'choice'
    | 'circular'
    | 'priority'
    | 'deque';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  question: string;
  instruction: string;
  initialStack: (number | string)[];
  availableElements?: (number | string)[];
  targetStack?: (number | string)[];
  targetValue?: number | string;
  capacity?: number;
  operationsTrace?: string[];
  debugSteps?: { id: string; text: string; isFaulty: boolean; errorType?: string; explanation: string }[];
  hint: {
    title: string;
    thoughtPrompt: string;
    clue: string;
  };
  guide: {
    ruleTitle: string;
    ruleDescription: string;
    example: string;
  };
  guidedSolve: {
    stepExplanation: string;
    sourceValue?: number | string;
    sourceType?: 'top' | 'available' | 'debug-step' | 'front' | 'rear';
    targetZone: 'pop-zone' | 'push-zone' | 'debug-zone' | 'dequeue-zone' | 'enqueue-zone';
    visualPathText: string;
  };
  feedback: {
    correctTitle: string;
    correctActionText: string;
    lifoReason: string;
    incorrectTip: string;
  };
  xpReward: number;
  choices?: { id: string; label: string; isCorrect: boolean; why: string }[];
  peekTarget?: number | string;
  expectedAction?: 'enqueue' | 'dequeue' | 'peek' | 'stop' | 'choice';
}

export interface GuidedSolveStep {
  stepNumber: number;
  totalSteps?: number;
  title: string;
  subtitle?: string;
  conceptBadge?: string;
  stackState: {
    items: (number | string)[];
    capacity: number;
    topIndex?: number;
    highlightTop?: boolean;
    highlightItem?: number | string;
    warningState?: 'overflow' | 'underflow' | null;
  };
  explanation: string;
  questionPrompt?: string;
  interactionType:
    | 'info-next'
    | 'click-push'
    | 'select-choice'
    | 'click-pop'
    | 'click-peek'
    | 'click-display'
    | 'yes-no'
    | 'underflow-action'
    | 'overflow-action';
  pushValue?: number | string;
  popExpectedValue?: number | string;
  peekExpectedValue?: number | string;
  choices?: { id: string; label: string; isCorrect: boolean; feedback: string }[];
  correctChoiceId?: string;
  displayOutput?: (number | string)[];
  hints: string[];
  correctFeedback: {
    title: string;
    explanation: string;
    actionResult?: string;
  };
  incorrectFeedback?: {
    title: string;
    explanation: string;
  };
  postActionStack?: (number | string)[];
}

export interface GameLevelConfig {
  id: number;
  levelNumber: number;
  title: string;
  subtitle: string;
  type:
    | 'lifo'
    | 'push'
    | 'pop'
    | 'peek'
    | 'status'
    | 'overflow'
    | 'underflow'
    | 'display'
    | 'sequence'
    | 'build'
    | 'predict'
    | 'debug'
    | 'speed'
    | 'master'
    | 'queue_basics'
    | 'enqueue_dequeue'
    | 'front_rear_peek'
    | 'capacity_overflow'
    | 'empty_underflow'
    | 'queue_master'
    | 'circular_queue'
    | 'priority_queue'
    | 'deque';
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  xpReward: number;
  stars: number;
  hints: [string, string, string]; // 1: Concept, 2: Direction, 3: Strong
  guidedSteps?: GuidedSolveStep[];
  challenges: GameChallenge[];
}

export interface QuizQuestion {
  id: number;
  type: 'multiple-choice' | 'predict-output' | 'true-false' | 'scenario' | 'drag-order';
  difficulty?: 'Basic' | 'Intermediate' | 'Hard';
  question: string;
  codeSnippet?: string;
  options?: string[];
  correctAnswer: string | string[]; // string for MCQ/TF, array for drag-order
  explanation: string;
  hints: [string, string, string];
}
