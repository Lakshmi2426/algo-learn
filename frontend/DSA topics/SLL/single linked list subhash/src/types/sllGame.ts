export type AssistanceMode = 'guide_solve' | 'play' | 'concept' | 'guide' | 'solve';

export interface SLLTeacherStep {
  stepNumber: number;
  totalSteps: number;
  title: string;
  what: string;
  why: string;
  pointersUpdated?: string;
  actionType:
    | 'create_node'
    | 'set_head'
    | 'set_tail'
    | 'connect_next'
    | 'delete_node'
    | 'select_node'
    | 'highlight_target'
    | 'traverse_step'
    | 'search_step'
    | 'verify_null'
    | 'check_answer';
  targetAddress?: number | null;
  targetData?: number;
  targetPointer?: 'head' | 'tail' | 'next' | 'current';
  nextAddress?: number | null;
  createdNodeData?: { data: number; address: number };
  resultMessage: string;
  nextStepPreview: string;
  isCompleted: boolean;
  highlightAddresses?: number[];
  detachedAddress?: number | null;
}

export interface GuideStep {
  stepNumber: number;
  instruction: string;
  explanation: string;
  targetNodeAddress?: number | null; // which node to highlight
  targetAction?: 'create' | 'click_node' | 'select_node' | 'connect_next' | 'set_head' | 'set_tail' | 'delete' | 'search' | 'traverse' | 'choice';
  choiceOptions?: { label: string; value: any }[];
  highlightPointers?: ('head' | 'tail' | 'current' | 'next')[];
}

export interface SolveStep {
  stepNumber: number;
  title: string;
  description: string;
  cCode?: string;
  simulatedNodes: SLLNode[];
  simulatedPointers: SLLPointerState;
  highlightAddresses?: number[];
}

export interface HowItWorksInfo {
  title: string;
  steps: string[];
  diagram: string;
  keyRule: string;
}

export interface SLLNode {
  id: string;
  data: number;
  address: number; // e.g. 1001, 1002, 2001
  nextAddress: number | null; // e.g. 1002 or null (displayed as NULL)
  state?: 'idle' | 'highlighted' | 'created' | 'target' | 'visiting' | 'matched' | 'mismatched' | 'deleting' | 'inserting';
  highlightColor?: string;
  isStaged?: boolean;
}

export interface SLLPointerState {
  headAddress: number | null;
  tailAddress: number | null;
  currentAddress: number | null;
  tempAddress: number | null;
  prevAddress: number | null;
}

export interface SLLFeedback {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  explanation?: string;
}

export interface SLLGameStateSnapshot {
  nodes: SLLNode[];
  pointers: SLLPointerState;
  stagedNodes: SLLNode[];
  traversalOutput: number[];
  taskStepIndex: number;
  currentStep: number;
  completedSteps: number[];
  taskStatus?: 'in_progress' | 'completed';
  description?: string;
}

export type SLLActionModalType =
  | 'NONE'
  | 'CREATE_NODE'
  | 'CHANGE_NEXT'
  | 'SET_HEAD'
  | 'SET_TAIL'
  | 'DELETE_NODE'
  | 'SEARCH_STEP'
  | 'TRAVERSE_STEP'
  | 'HOW_IT_WORKS'
  | 'HINT';

export interface SLLTaskDef {
  id: string;
  levelId: number;
  taskIndex: number;
  title: string;
  objective: string;
  detailedInstructions: string;
  initialNodes: SLLNode[];
  initialPointers: SLLPointerState;
  initialStagedNodes: SLLNode[];
  conceptExplanation: string;
  codeEquivalent: string;
  hints: string[]; // 3-tier hints: Concept, Addresses/Pointers, Exact logic
  xpReward: number;
  guideSteps?: GuideStep[];
  solveSteps?: SolveStep[];
  howItWorks?: HowItWorksInfo;
  // Validation function criteria
  targetCondition: {
    expectedOrder?: number[]; // expected data sequence e.g. [10, 20, 30]
    expectedHead?: number | null;
    expectedTail?: number | null;
    expectedNodesCount?: number;
    expectedNodeNext?: Record<number, number | null>; // address -> nextAddress
    customValidator?: string; // key for custom validation logic
    nodeCount?: number;
    headAddress?: number | null;
    tailAddress?: number | null;
  };
  // Pre-configured input suggestions or initial defaults if appropriate
  defaultInputValues?: {
    data?: number | string;
    address?: number | string;
    next?: number | string;
    head?: number | string;
    tail?: number | string;
  };
}
