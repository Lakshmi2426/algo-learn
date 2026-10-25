import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play,
  Layers,
  Star,
  Timer as TimerIcon,
  Activity,
  Check,
  Zap,
  Info,
  Link as LinkIcon,
  PlusCircle,
  Trash2,
  Eye,
  Search,
  BookOpen,
  Award,
  Code2,
} from 'lucide-react';
import {
  SLLNode,
  SLLPointerState,
  SLLFeedback,
  SLLGameStateSnapshot,
  SLLActionModalType,
  SLLTaskDef,
  AssistanceMode,
  SLLTeacherStep,
} from '../../types/sllGame';
import { SLL_TASKS, LEVEL_TASK_IDS, LEVEL_METADATA } from '../../data/sllTasks';
import { SLLWorkspace } from './SLLWorkspace';
import { SLLInfoPanels } from './SLLInfoPanels';
import { SLLTaskPanel } from './SLLTaskPanel';
import { SLLBottomControls } from './SLLBottomControls';
import { SLLActionModal } from './SLLActionModal';
import { SLLHowItWorksModal } from './SLLHowItWorksModal';
import { SLLSolveWalkthrough } from './SLLSolveWalkthrough';
import { SLLMissionBoard } from './SLLMissionBoard';
import { SLLTeacherBanner } from './SLLTeacherBanner';
import { SLLHowToPlayModal } from './SLLHowToPlayModal';
import {
  getNextTeacherStep,
  executeSingleTeacherStep,
  getTaskStep,
  getTaskTotalSteps,
  getAllTaskSteps,
  getNextUncompletedStepNumber,
  getInsertionNewNodeSpec,
} from '../../utils/sllStepAssistant';
import { validateTaskAnswer } from '../../utils/sllValidator';
import { soundManager } from '../../utils/audio';
import { progressManager } from '../../utils/progressManager';
import { Compass, X, Lightbulb } from 'lucide-react';

interface SLLOperationGameScreenProps {
  taskId: string;
  onBackToMenu: () => void;
  onCompleteTask: (taskId: string, nextTaskId?: string) => void;
  onSelectLevel?: (lvlId: number) => void;
  onSelectTask?: (taskId: string) => void;
  totalScore: number;
  topicTitle?: string;
  topicId?: 'insertion' | 'deletion' | 'traversal';
  taskTitleOverride?: string;
  taskNumberOverride?: number;
}

export const SLLOperationGameScreen: React.FC<SLLOperationGameScreenProps> = ({
  taskId,
  onBackToMenu,
  onCompleteTask,
  onSelectLevel,
  onSelectTask,
  totalScore,
  topicTitle,
  topicId,
  taskTitleOverride,
  taskNumberOverride,
}) => {
  const activeTask: SLLTaskDef = SLL_TASKS[taskId] || SLL_TASKS.L1_T1;
  const currentLevelId = activeTask.levelId;
  const levelTaskIds = LEVEL_TASK_IDS[currentLevelId] || [];
  const currentTaskIndex = levelTaskIds.indexOf(taskId);
  const nextTaskId = currentTaskIndex >= 0 && currentTaskIndex < levelTaskIds.length - 1 ? levelTaskIds[currentTaskIndex + 1] : undefined;

  const gameCategory: 'insertion' | 'deletion' | 'traversal' = useMemo(() => {
    if (topicId) return topicId;
    if (topicTitle?.toLowerCase().includes('insert') || activeTask.id.startsWith('L1') || activeTask.id === 'L4_T1') {
      return 'insertion';
    }
    if (topicTitle?.toLowerCase().includes('delete') || activeTask.id.startsWith('L2') || activeTask.id === 'L4_T2') {
      return 'deletion';
    }
    return 'traversal';
  }, [topicId, topicTitle, activeTask.id]);

  const baseScore = gameCategory === 'traversal' ? 10 : 15;

  // Assistance Mode: 'guide_solve' | 'play'
  const [assistanceMode, setAssistanceMode] = useState<AssistanceMode>('guide_solve');
  const [isGuidedSolveActive, setIsGuidedSolveActive] = useState<boolean>(false);
  const [displayScore, setDisplayScore] = useState<number>(() => progressManager.getTotalPoints());

  useEffect(() => {
    setDisplayScore(totalScore);
  }, [totalScore]);

  useEffect(() => {
    const unsub = progressManager.subscribe((state) => {
      setDisplayScore(state.totalPoints);
    });
    return () => unsub();
  }, []);

  // Floating Point Deduction Toast (Guided Solve / Hint)
  const [deductionToast, setDeductionToast] = useState<{
    id: number;
    points: number;
    reason: string;
  } | null>(null);

  useEffect(() => {
    const unsub = progressManager.onPointDeduction((notif) => {
      setDeductionToast({
        id: notif.id,
        points: notif.points,
        reason: notif.reason,
      });
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!deductionToast) return;
    const timer = setTimeout(() => {
      setDeductionToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [deductionToast]);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [taskStatus, setTaskStatus] = useState<'in_progress' | 'completed'>('in_progress');
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState<boolean>(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);
  const [showMissionBoard, setShowMissionBoard] = useState<boolean>(false);
  const [teacherLastActionResult, setTeacherLastActionResult] = useState<string | null>(null);

  // Direct Workspace Interaction Modes
  const [pendingConnectFrom, setPendingConnectFrom] = useState<number | null>(null);
  const [isSettingHeadMode, setIsSettingHeadMode] = useState<boolean>(false);
  const [isSettingTailMode, setIsSettingTailMode] = useState<boolean>(false);
  const [isDeletingNodeMode, setIsDeletingNodeMode] = useState<boolean>(false);
  const [isConnectingNextMode, setIsConnectingNextMode] = useState<boolean>(false);

  // Local RAM State
  const [nodes, setNodes] = useState<SLLNode[]>(() => {
    try {
      return Array.isArray(activeTask?.initialNodes) ? JSON.parse(JSON.stringify(activeTask.initialNodes)) : [];
    } catch {
      return [];
    }
  });
  const [pointers, setPointers] = useState<SLLPointerState>(() => {
    try {
      return activeTask?.initialPointers
        ? JSON.parse(JSON.stringify(activeTask.initialPointers))
        : { headAddress: null, tailAddress: null, currentAddress: null, tempAddress: null, prevAddress: null };
    } catch {
      return { headAddress: null, tailAddress: null, currentAddress: null, tempAddress: null, prevAddress: null };
    }
  });
  const [stagedNodes, setStagedNodes] = useState<SLLNode[]>(() => {
    try {
      return Array.isArray(activeTask?.initialStagedNodes) ? JSON.parse(JSON.stringify(activeTask.initialStagedNodes)) : [];
    } catch {
      return [];
    }
  });
  const [traversalOutput, setTraversalOutput] = useState<number[]>([]);
  const [isTraversing, setIsTraversing] = useState<boolean>(false);

  // Search state
  const [searchTarget, setSearchTarget] = useState<number | null>(40);
  const [searchResult, setSearchResult] = useState<'idle' | 'searching' | 'found' | 'not_found'>('idle');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchStepIndex, setSearchStepIndex] = useState<number>(0);

  // Traversal interactive state for Level 3
  const [currentTraversalAddress, setCurrentTraversalAddress] = useState<number | null>(null);

  // Undo / Redo History
  const [history, setHistory] = useState<SLLGameStateSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<SLLGameStateSnapshot[]>([]);

  // Modals & Inspector
  const [activeModal, setActiveModal] = useState<SLLActionModalType>('NONE');
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [hintLevel, setHintLevel] = useState<number>(0);

  // Dynamic position for L4_T2 ("Delete at Any Position")
  const [deletePosition, setDeletePosition] = useState<number>(2);

  const handleSelectDeletePosition = (pos: number) => {
    // 1. Reset all previous states completely (Rule 5)
    setSelectedAddress(null);
    setPendingConnectFrom(null);
    setIsSettingHeadMode(false);
    setIsSettingTailMode(false);
    setIsDeletingNodeMode(false);
    setIsConnectingNextMode(false);
    setCurrentStep(1);
    setCompletedSteps([]);
    setTaskStatus('in_progress');
    setIsCompleted(false);
    setTeacherLastActionResult(null);
    setIsGuidedSolveActive(false);
    setHistory([]);
    setRedoStack([]);

    // 2. Reset nodes and pointers to initial fresh list
    const initialNodes = Array.isArray(activeTask?.initialNodes) ? JSON.parse(JSON.stringify(activeTask.initialNodes)) : [];
    const initialPointers = activeTask?.initialPointers
      ? JSON.parse(JSON.stringify(activeTask.initialPointers))
      : { headAddress: null, tailAddress: null, currentAddress: null, tempAddress: null, prevAddress: null };
    setNodes(initialNodes);
    setPointers(initialPointers);

    // 3. Set new position
    setDeletePosition(pos);
    soundManager.play('click');
    setFeedback({
      type: 'info',
      title: `Position ${pos} Selected`,
      message: `Target updated dynamically to Position ${pos}. Click the target node card to begin deletion.`,
    });
  };

  // Dynamic position for L4_T1 ("Insert at Any Position")
  const [insertPosition, setInsertPosition] = useState<number>(3);

  const handleSelectInsertPosition = (pos: number) => {
    setSelectedAddress(null);
    setPendingConnectFrom(null);
    setIsSettingHeadMode(false);
    setIsSettingTailMode(false);
    setIsDeletingNodeMode(false);
    setIsConnectingNextMode(false);
    setCurrentStep(1);
    setCompletedSteps([]);
    setTaskStatus('in_progress');
    setIsCompleted(false);
    setTeacherLastActionResult(null);
    setIsGuidedSolveActive(false);
    setHistory([]);
    setRedoStack([]);

    const initialNodes = Array.isArray(activeTask?.initialNodes) ? JSON.parse(JSON.stringify(activeTask.initialNodes)) : [];
    const initialPointers = activeTask?.initialPointers
      ? JSON.parse(JSON.stringify(activeTask.initialPointers))
      : { headAddress: null, tailAddress: null, currentAddress: null, tempAddress: null, prevAddress: null };
    setNodes(initialNodes);
    setPointers(initialPointers);

    setInsertPosition(pos);
    soundManager.play('click');
    const desc = pos === 1 ? 'Beginning Insertion' : pos === 6 ? 'End Insertion' : 'Middle Insertion';
    setFeedback({
      type: 'info',
      title: `Position ${pos} Selected (${desc})`,
      message: `Target updated dynamically to Position ${pos}. Follow the step guidance or click Guided Solve to proceed.`,
    });
  };

  // Evaluation & HUD
  const [feedback, setFeedback] = useState<SLLFeedback | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(1);

  const clockTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset/Initialize task
  const resetTaskState = () => {
    const initialNodes = Array.isArray(activeTask?.initialNodes) ? JSON.parse(JSON.stringify(activeTask.initialNodes)) : [];
    const initialPointers = activeTask?.initialPointers
      ? JSON.parse(JSON.stringify(activeTask.initialPointers))
      : { headAddress: null, tailAddress: null, currentAddress: null, tempAddress: null, prevAddress: null };
    const initialStaged = Array.isArray(activeTask?.initialStagedNodes) ? JSON.parse(JSON.stringify(activeTask.initialStagedNodes)) : [];

    setNodes(initialNodes);
    setPointers(initialPointers);
    setStagedNodes(initialStaged);
    setTraversalOutput([]);
    setIsTraversing(false);
    setSearchResult('idle');
    setIsSearching(false);
    setSearchStepIndex(0);
    setCurrentTraversalAddress(null);
    setSelectedAddress(null);
    setPendingConnectFrom(null);
    setIsSettingHeadMode(false);
    setIsSettingTailMode(false);
    setIsDeletingNodeMode(false);
    setIsConnectingNextMode(false);
    setFeedback(null);
    setIsCompleted(false);
    setHintLevel(0);
    setTeacherLastActionResult(null);
    setIsGuidedSolveActive(false);
    setCurrentStep(1);
    setCompletedSteps([]);
    setTaskStatus('in_progress');
    setHistory([]);
    setRedoStack([]);
    if (taskId === 'L4_T2') {
      setDeletePosition(2);
    }
    if (taskId === 'L4_T1') {
      setInsertPosition(3);
    }
  };

  useEffect(() => {
    resetTaskState();
  }, [taskId]);

  // Live Timer
  useEffect(() => {
    if (clockTimerRef.current) clearInterval(clockTimerRef.current);
    clockTimerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (clockTimerRef.current) clearInterval(clockTimerRef.current);
    };
  }, [taskId]);

  // Record Snapshot for Undo
  const pushSnapshot = () => {
    const snapshot: SLLGameStateSnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      pointers: JSON.parse(JSON.stringify(pointers)),
      stagedNodes: JSON.parse(JSON.stringify(stagedNodes)),
      traversalOutput: [...traversalOutput],
      taskStepIndex: 0,
      currentStep,
      completedSteps: [...completedSteps],
      taskStatus,
    };
    setHistory((prev) => [...prev, snapshot]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    const current: SLLGameStateSnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      pointers: JSON.parse(JSON.stringify(pointers)),
      stagedNodes: JSON.parse(JSON.stringify(stagedNodes)),
      traversalOutput: [...traversalOutput],
      taskStepIndex: 0,
      currentStep,
      completedSteps: [...completedSteps],
      taskStatus,
    };

    setRedoStack((prev) => [...prev, current]);
    setHistory((prev) => prev.slice(0, prev.length - 1));

    setNodes(previous.nodes);
    setPointers(previous.pointers);
    setStagedNodes(previous.stagedNodes);
    setTraversalOutput(previous.traversalOutput);
    if (previous.currentStep !== undefined) setCurrentStep(previous.currentStep);
    if (previous.completedSteps !== undefined) setCompletedSteps(previous.completedSteps);
    if (previous.taskStatus !== undefined) setTaskStatus(previous.taskStatus);
    setFeedback(null);
    soundManager.play('step');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    const current: SLLGameStateSnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      pointers: JSON.parse(JSON.stringify(pointers)),
      stagedNodes: JSON.parse(JSON.stringify(stagedNodes)),
      traversalOutput: [...traversalOutput],
      taskStepIndex: 0,
      currentStep,
      completedSteps: [...completedSteps],
      taskStatus,
    };

    setHistory((prev) => [...prev, current]);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));

    setNodes(nextState.nodes);
    setPointers(nextState.pointers);
    setStagedNodes(nextState.stagedNodes);
    setTraversalOutput(nextState.traversalOutput);
    if (nextState.currentStep !== undefined) setCurrentStep(nextState.currentStep);
    if (nextState.completedSteps !== undefined) setCompletedSteps(nextState.completedSteps);
    if (nextState.taskStatus !== undefined) setTaskStatus(nextState.taskStatus);
    setFeedback(null);
    soundManager.play('step');
  };

  // Node & Pointer Operations
  const handleCreateNode = (data: number, address: number, nextAddress: number | null) => {
    pushSnapshot();
    const newNode: SLLNode = {
      id: `node-${address}`,
      data,
      address,
      nextAddress,
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedAddress(address);
    soundManager.play('allocate');
    setFeedback({
      type: 'info',
      title: 'Node Allocated in Heap RAM',
      message: `Node [ DATA: ${data} | ADDR: ${address} | NEXT: ${nextAddress !== null ? nextAddress : 'NULL'} ] was placed in memory.`,
    });
    advanceStepIfActionMatches('create_node', address, data);
  };

  const handleChangeNext = (fromAddress: number, toNextAddress: number | null) => {
    pushSnapshot();
    setNodes((prev) =>
      prev.map((n) => (n.address === fromAddress ? { ...n, nextAddress: toNextAddress } : n))
    );
    soundManager.play('link');
    setFeedback({
      type: 'info',
      title: 'NEXT Pointer Updated',
      message: `Node at Address ${fromAddress} now points to NEXT = ${toNextAddress !== null ? toNextAddress : 'NULL'}.`,
    });
    advanceStepIfActionMatches('connect_next', fromAddress, toNextAddress);
  };

  const handleSetHead = (address: number | null) => {
    pushSnapshot();
    setPointers((prev) => ({ ...prev, headAddress: address }));
    soundManager.play('link');
    setFeedback({
      type: 'info',
      title: 'HEAD Pointer Updated',
      message: `HEAD pointer is now pointing to Address ${address !== null ? address : 'NULL'}.`,
    });
    advanceStepIfActionMatches('set_head', address);
  };

  const handleSetTail = (address: number | null) => {
    pushSnapshot();
    setPointers((prev) => ({ ...prev, tailAddress: address }));
    soundManager.play('link');
    setFeedback({
      type: 'info',
      title: 'TAIL Pointer Updated',
      message: `TAIL pointer is now pointing to Address ${address !== null ? address : 'NULL'}.`,
    });
    advanceStepIfActionMatches('set_tail', address);
  };

  const handleDeleteNode = (address: number) => {
    pushSnapshot();
    setNodes((prev) =>
      prev
        .filter((n) => n.address !== address)
        .map((n) => (n.nextAddress === address ? { ...n, nextAddress: null } : n))
    );
    if (selectedAddress === address) setSelectedAddress(null);
    if (pointers.headAddress === address) setPointers((prev) => ({ ...prev, headAddress: null }));
    if (pointers.tailAddress === address) setPointers((prev) => ({ ...prev, tailAddress: null }));
    if (pendingConnectFrom === address) setPendingConnectFrom(null);
    setIsDeletingNodeMode(false);

    soundManager.play('free');
    setFeedback({
      type: 'info',
      title: 'Node Memory Deallocated (free)',
      message: `Node at Address ${address} has been freed from memory and all incoming pointers cleared.`,
    });
    advanceStepIfActionMatches('delete_node', address);
  };

  // Traversal Step Interaction (Level 3 & Level 5 Traversal)
  const isTraversalTask =
    activeTask.targetCondition.customValidator === 'L3_TRAVERSAL_COMPLETE' ||
    activeTask.id === 'L3_T1' ||
    activeTask.targetCondition.customValidator === 'L5_FINAL_TRAVERSAL_5';

  const traversalNextExpectedAddr: number | null = (() => {
    if (!isTraversalTask) return null;
    if (pointers.currentAddress === null) {
      return pointers.headAddress;
    }
    const curr = nodes.find((n) => n.address === pointers.currentAddress);
    return curr ? curr.nextAddress : null;
  })();

  const handleTraversalNodeClick = (address: number) => {
    if (taskStatus === 'completed' || isCompleted) return;

    if (pointers.currentAddress === null) {
      // Traversal must start at HEAD
      if (address === pointers.headAddress) {
        pushSnapshot();
        const headNode = nodes.find((n) => n.address === address);
        setPointers((prev) => ({ ...prev, currentAddress: address }));
        if (headNode) {
          setTraversalOutput([headNode.data]);
        }
        setSelectedAddress(address);
        soundManager.play('step');
        setCompletedSteps([1]);
        setCurrentStep(2);
        const nextNode = headNode?.nextAddress
          ? nodes.find((n) => n.address === headNode.nextAddress)
          : null;
        setFeedback({
          type: 'info',
          title: 'CURRENT Initialized to HEAD',
          message: `✓ CURRENT = Node ${headNode?.data ?? address}. Streamed DATA: ${headNode?.data ?? address}. Follow NEXT pointer to Node ${nextNode?.data ?? 'NULL'}.`,
        });
      } else {
        soundManager.play('error');
        setFeedback({
          type: 'error',
          title: 'Incorrect Selection',
          message: 'Incorrect. Follow the NEXT pointer. Traversal must start at HEAD.',
        });
      }
      return;
    }

    const currNode = nodes.find((n) => n.address === pointers.currentAddress);
    if (!currNode) return;

    if (currNode.nextAddress !== null) {
      if (address === currNode.nextAddress) {
        pushSnapshot();
        const nextNode = nodes.find((n) => n.address === address);
        setPointers((prev) => ({ ...prev, currentAddress: address }));
        if (nextNode) {
          setTraversalOutput((prev) => [...prev, nextNode.data]);
        }
        setSelectedAddress(address);
        soundManager.play('step');
        const nextStepNum = currentStep + 1;
        setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
        setCurrentStep(nextStepNum);

        const followingNode = nextNode?.nextAddress
          ? nodes.find((n) => n.address === nextNode.nextAddress)
          : null;
        setFeedback({
          type: 'info',
          title: 'CURRENT Advanced',
          message: `✓ CURRENT moved to Node ${nextNode?.data ?? address}. Streamed DATA: ${nextNode?.data ?? address}. ${
            followingNode
              ? `Follow NEXT pointer to Node ${followingNode.data}.`
              : 'Now follow NEXT pointer to NULL to complete traversal.'
          }`,
        });
      } else {
        soundManager.play('error');
        setFeedback({
          type: 'error',
          title: 'Incorrect Selection',
          message: 'Incorrect. Follow the NEXT pointer.',
        });
      }
    } else {
      soundManager.play('error');
      setFeedback({
        type: 'error',
        title: 'End of List',
        message: 'Current node has NEXT = NULL. Select NULL to complete traversal.',
      });
    }
  };

  const handleTraversalNullClick = () => {
    if (taskStatus === 'completed' || isCompleted) return;
    if (!isTraversalTask) return;

    const currNode = nodes.find((n) => n.address === pointers.currentAddress);
    if (currNode && currNode.nextAddress === null) {
      pushSnapshot();
      setPointers((prev) => ({ ...prev, currentAddress: null }));
      setCompletedSteps([1, 2, 3, 4, 5]);
      setCurrentStep(5);
      triggerTaskCompletion(
        'Traversal Completed! 🎉',
        'CURRENT reached NULL. All nodes visited in sequence: 10 → 20 → 30 → 40 → NULL.'
      );
    } else {
      soundManager.play('error');
      setFeedback({
        type: 'error',
        title: 'Incorrect Selection',
        message: 'Incorrect. Follow the NEXT pointer. CURRENT has not reached the end of the list yet.',
      });
    }
  };

  const handleNodeClickDirect = (address: number) => {
    if (isDeletingNodeMode) {
      handleDeleteNode(address);
    } else if (pendingConnectFrom && pendingConnectFrom !== address) {
      handleConnectNextDirect(pendingConnectFrom, address);
    } else if (isConnectingNextMode && pendingConnectFrom === null) {
      setPendingConnectFrom(address);
    } else if (isSettingHeadMode) {
      handleSetHeadDirect(address);
    } else if (isSettingTailMode) {
      handleSetTailDirect(address);
    } else if (currentTeacherStep?.actionType === 'delete_node' && currentTeacherStep.targetAddress === address) {
      handleDeleteNode(address);
    } else if (isTraversalTask) {
      handleTraversalNodeClick(address);
    } else if (activeTask.id === 'L4_T2' && currentStep === 1) {
      if (currentTeacherStep?.targetAddress === address) {
        soundManager.play('step');
        setFeedback({
          type: 'success',
          title: 'Correct! This is the target node.',
          message: `Target node (Address ${address}) identified at Position ${deletePosition}. Proceed to Step 2.`,
        });
        setSelectedAddress(address);
        advanceStepIfActionMatches('select_node', address);
      } else {
        soundManager.play('error');
        setFeedback({
          type: 'error',
          title: 'Incorrect Target Selection',
          message: `Incorrect. Select the node at Position ${deletePosition}.`,
        });
      }
    } else {
      setSelectedAddress(address);
      advanceStepIfActionMatches('select_node', address);
    }
  };

  // Direct Workspace Pointer Actions (No typing required)
  const handleSetHeadDirect = (address: number) => {
    pushSnapshot();
    setPointers((prev) => ({ ...prev, headAddress: address }));
    setIsSettingHeadMode(false);
    soundManager.play('link');
    setFeedback({
      type: 'info',
      title: 'HEAD Connected!',
      message: `HEAD pointer now points to Node at Address ${address}.`,
    });
    advanceStepIfActionMatches('set_head', address);
  };

  const handleSetTailDirect = (address: number) => {
    pushSnapshot();
    setPointers((prev) => ({ ...prev, tailAddress: address }));
    setIsSettingTailMode(false);
    soundManager.play('link');
    setFeedback({
      type: 'info',
      title: 'TAIL Connected!',
      message: `TAIL pointer now points to Node at Address ${address}.`,
    });
    advanceStepIfActionMatches('set_tail', address);
  };

  const handleConnectNextDirect = (fromAddr: number, toAddr: number | null) => {
    pushSnapshot();
    setNodes((prev) =>
      prev.map((n) => (n.address === fromAddr ? { ...n, nextAddress: toAddr } : n))
    );
    setPendingConnectFrom(null);
    setIsConnectingNextMode(false);
    soundManager.play('link');
    setFeedback({
      type: 'info',
      title: 'Pointers Linked!',
      message: `Node ${fromAddr}'s NEXT pointer connects to ${toAddr !== null ? `Node ${toAddr}` : 'NULL'}.`,
    });
    advanceStepIfActionMatches('connect_next', fromAddr, toAddr);
  };

  const handleInsertBetween = (prevAddr: number | null, nextAddr: number | null) => {
    setSelectedAddress(prevAddr);
    setActiveModal('CREATE_NODE');
  };

  // Quick Create Node handler for toolbar in RAM Heap Workspace
  const handleQuickCreateNode = () => {
    // 1. Determine next data value compatible with task
    let nextData = 10;
    if (activeTask.id === 'L1_T1') {
      if (!nodes.some((n) => n.data === 10)) {
        nextData = 10;
      } else if (!nodes.some((n) => n.data === 20)) {
        nextData = 20;
      } else {
        nextData = Math.max(...nodes.map((n) => n.data), 20) + 10;
      }
    } else if (
      activeTask.defaultInputValues?.data !== undefined &&
      !nodes.some((n) => n.data === Number(activeTask.defaultInputValues?.data))
    ) {
      nextData = Number(activeTask.defaultInputValues.data);
    } else {
      const existing = nodes.map((n) => n.data);
      const standardSequence = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const candidate = standardSequence.find((val) => !existing.includes(val));
      nextData = candidate !== undefined ? candidate : (existing.length > 0 ? Math.max(...existing) + 10 : 10);
    }

    // 2. Determine unique memory address
    const existingAddrs = new Set(nodes.map((n) => n.address));
    let nextAddress = 1001;
    while (existingAddrs.has(nextAddress)) {
      nextAddress++;
    }

    handleCreateNode(nextData, nextAddress, null);
  };

  const handleToggleHeadMode = () => {
    setIsDeletingNodeMode(false);
    setIsConnectingNextMode(false);
    setPendingConnectFrom(null);
    setIsSettingTailMode(false);
    setIsSettingHeadMode((prev) => !prev);
  };

  const handleToggleTailMode = () => {
    setIsDeletingNodeMode(false);
    setIsConnectingNextMode(false);
    setPendingConnectFrom(null);
    setIsSettingHeadMode(false);
    setIsSettingTailMode((prev) => !prev);
  };

  const handleToggleNextMode = () => {
    setIsDeletingNodeMode(false);
    setIsSettingHeadMode(false);
    setIsSettingTailMode(false);
    if (isConnectingNextMode || pendingConnectFrom !== null) {
      setIsConnectingNextMode(false);
      setPendingConnectFrom(null);
    } else {
      setIsConnectingNextMode(true);
      if (selectedAddress !== null) {
        setPendingConnectFrom(selectedAddress);
      } else {
        setPendingConnectFrom(null);
      }
    }
  };

  const handleToggleDeleteMode = () => {
    setIsSettingHeadMode(false);
    setIsSettingTailMode(false);
    setIsConnectingNextMode(false);
    setPendingConnectFrom(null);
    setIsDeletingNodeMode((prev) => !prev);
  };

  const handleCancelDirectMode = () => {
    setIsSettingHeadMode(false);
    setIsSettingTailMode(false);
    setIsConnectingNextMode(false);
    setPendingConnectFrom(null);
    setIsDeletingNodeMode(false);
  };

  const handleSetNextToNull = () => {
    if (pendingConnectFrom !== null) {
      handleConnectNextDirect(pendingConnectFrom, null);
      setPendingConnectFrom(null);
      setIsConnectingNextMode(false);
    }
  };

  // Assistance Mode switcher: Concept vs Workspace
  const handleSelectAssistanceMode = (mode: AssistanceMode) => {
    soundManager.play('click');
    if (mode === 'concept') {
      progressManager.recordGameTaskAssistance(taskId, 'concept');
    }
    if (mode === 'play') {
      const hasSeen = localStorage.getItem('sll_has_seen_how_to_play');
      if (!hasSeen) {
        setIsHowToPlayOpen(true);
      }
    }
    setAssistanceMode(mode);
  };

  const handleOpenHint = () => {
    soundManager.play('click');
    // Only records hint used (applied once during final score calculation)
    progressManager.recordGameTaskAssistance(taskId, 'hint');
    setActiveModal('HINT');
  };

  const [scoreBreakdown, setScoreBreakdown] = useState<{
    baseScore: number;
    hintPenalty: number;
    guidePenalty: number;
    finalScore: number;
    hintUsed: boolean;
    guideUsed: boolean;
  } | null>(null);

  const triggerTaskCompletion = (customTitle?: string, customMessage?: string) => {
    if (taskStatus === 'completed' || isCompleted) return;
    setIsCompleted(true);
    setTaskStatus('completed');
    soundManager.play('celebrate');

    const completion = progressManager.completeGameTask(taskId);
    const scoreCalc = progressManager.calculateGameScore(gameCategory, taskId);

    setScoreBreakdown({
      baseScore: scoreCalc.baseScore,
      hintPenalty: scoreCalc.hintPenalty,
      guidePenalty: scoreCalc.guidePenalty,
      finalScore: scoreCalc.finalScore,
      hintUsed: scoreCalc.hintUsed,
      guideUsed: scoreCalc.guideUsed,
    });

    const parts: string[] = [
      `Base Score: ${scoreCalc.baseScore} XP`,
      `Hint Penalty: ${scoreCalc.hintUsed ? '-2 XP' : '0 XP'}`,
      `Guide & Solve Penalty: ${scoreCalc.guideUsed ? '-3 XP' : '0 XP'}`,
      `Final Score: +${scoreCalc.finalScore} XP`,
    ];

    if (completion.alreadyCompleted) {
      parts.push(`(Replay Practice: +0 XP — Already Completed)`);
    }

    setFeedback({
      type: 'success',
      title: customTitle || 'TASK COMPLETED! 🎉',
      message: `${customMessage ? customMessage + ' • ' : ''}${parts.join(' • ')}`,
      explanation: activeTask.conceptExplanation,
    });
  };

  // Traversal Step Interaction (Adapter for direct input or buttons)
  const handleTraversalAnswer = (answer: string) => {
    if (answer.toUpperCase() === 'NULL') {
      handleTraversalNullClick();
    } else {
      const addr = Number(answer);
      if (!isNaN(addr)) {
        handleTraversalNodeClick(addr);
      }
    }
  };

  // Search Step Interaction (Level 4 Task 4)
  const currentSearchNode = nodes.find((n) => n.address === pointers.currentAddress);

  // Execution lock to prevent rapid clicks and race conditions
  const [isExecutingStep, setIsExecutingStep] = useState<boolean>(false);

  // Active position for dynamic position tasks (L4_T1 / L4_T2)
  const activePosition = activeTask.id === 'L4_T2' ? deletePosition : insertPosition;

  // Dynamic task overrides for L4_T1 (Insert at Any Position)
  const currentTaskView = useMemo(() => {
    if (activeTask.id !== 'L4_T1') return activeTask;

    const newSpec = getInsertionNewNodeSpec(nodes, pointers, insertPosition);
    let title = 'Task 1: Insert in the Middle';
    let objective = '';
    let codeEquivalent = '';

    if (insertPosition === 1) {
      title = 'Task 1: Insert at Beginning';
      objective = `Insert Node ${newSpec.data} (at ${newSpec.address}) at Position 1, before Node 10. Connect the new node to the original head, then update HEAD to the new node.`;
      codeEquivalent = `newNode->next = head;\nhead = newNode;\n\nif (tail == nullptr) {\n    tail = newNode;\n}`;
    } else if (insertPosition === 6) {
      title = 'Task 1: Insert at the End';
      objective = `Insert Node ${newSpec.data} (at ${newSpec.address}) at Position 6, after Node 50. Connect the current tail to the new node, then update TAIL to the new node.`;
      codeEquivalent = `newNode->next = nullptr;\n\nif (head == nullptr) {\n    head = tail = newNode;\n} else {\n    tail->next = newNode;\n    tail = newNode;\n}`;
    } else {
      const initialChain = [10, 20, 30, 40, 50];
      const prevVal = initialChain[insertPosition - 2];
      const succVal = initialChain[insertPosition - 1];
      title = 'Task 1: Insert in the Middle';
      objective = `Insert Node ${newSpec.data} (at ${newSpec.address}) at Position ${insertPosition}, between Node ${prevVal} and Node ${succVal}. First connect the new node to Node ${succVal}, then connect Node ${prevVal} to Node ${newSpec.data}.`;
      codeEquivalent = `newNode->next = prev->next;\nprev->next = newNode;`;
    }

    return {
      ...activeTask,
      title,
      objective,
      codeEquivalent,
      defaultInputValues: {
        data: newSpec.data,
        address: newSpec.address,
        next: insertPosition === 6 ? null : (insertPosition === 1 ? 1001 : 1000 + insertPosition),
      },
    };
  }, [activeTask, insertPosition, nodes, pointers]);

  // Dynamically derive the exact uncompleted step from live workspace state
  const currentStepDerived = useMemo(() => {
    return getNextUncompletedStepNumber(
      activeTask,
      nodes,
      pointers,
      traversalOutput,
      searchResult === 'found',
      activePosition
    );
  }, [activeTask, nodes, pointers, traversalOutput, searchResult, activePosition]);

  const activeStepNumber = isGuidedSolveActive ? currentStepDerived : currentStep;
  const currentTeacherStep = getTaskStep(activeTask, activeStepNumber, nodes, pointers, activePosition);
  const totalTaskSteps = getTaskTotalSteps(activeTask, nodes, pointers, activePosition);

  // Dynamic Node Role Labels for L4_T2 ("Delete at Any Position") & L4_T1 ("Insert at Any Position")
  const nodeRoleLabels = useMemo(() => {
    if (activeTask.id === 'L4_T2') {
      const labels: Record<number, string> = {};
      if (currentTeacherStep?.highlightAddresses && currentTeacherStep.highlightAddresses.length === 3) {
        const [prevAddr, tgtAddr, nextAddr] = currentTeacherStep.highlightAddresses;
        if (prevAddr) labels[prevAddr] = 'PREVIOUS';
        if (tgtAddr) labels[tgtAddr] = 'TARGET';
        if (nextAddr) labels[nextAddr] = 'NEXT';
      } else if (currentTeacherStep?.targetAddress) {
        labels[currentTeacherStep.targetAddress] = 'TARGET';
      }
      return labels;
    }
    if (activeTask.id === 'L4_T1') {
      const labels: Record<number, string> = {};
      const newSpec = getInsertionNewNodeSpec(nodes, pointers, insertPosition);
      const newNode = nodes.find((n) => n.address === newSpec.address || n.data === newSpec.data);
      if (newNode) {
        labels[newNode.address] = 'NEW NODE';
      }
      if (insertPosition === 1) {
        const headNode = nodes.find((n) => n.address === pointers.headAddress && n.address !== newNode?.address);
        if (headNode) labels[headNode.address] = 'HEAD';
      } else if (insertPosition === 6) {
        const tailNode = nodes.find((n) => n.address === pointers.tailAddress && n.address !== newNode?.address);
        if (tailNode) labels[tailNode.address] = 'TAIL';
      } else {
        const defaultChain = [
          { address: 1001, data: 10 },
          { address: 1002, data: 20 },
          { address: 1003, data: 30 },
          { address: 1004, data: 40 },
          { address: 1005, data: 50 },
        ];
        const prev = defaultChain[insertPosition - 2];
        const succ = defaultChain[insertPosition - 1];
        if (prev) labels[prev.address] = 'PREVIOUS';
        if (succ) labels[succ.address] = 'SUCCESSOR';
      }
      return labels;
    }
    return undefined;
  }, [activeTask.id, currentTeacherStep, insertPosition, nodes, pointers]);

  // Active Highlight Addresses: during traversal, enforce strict 2-node maximum highlighting:
  // [Current visited node, Next target node] or [HEAD node]
  const activeHighlightAddresses = (() => {
    if (isTraversalTask) {
      if (pointers.currentAddress === null) {
        return pointers.headAddress !== null ? [pointers.headAddress] : [];
      }
      const curr = nodes.find((n) => n.address === pointers.currentAddress);
      if (curr?.nextAddress !== null && curr?.nextAddress !== undefined) {
        return [pointers.currentAddress, curr.nextAddress];
      }
      return [pointers.currentAddress];
    }
    return currentTeacherStep?.highlightAddresses;
  })();

  // Helper to advance the step machine on successful user action in PLAY mode
  const advanceStepIfActionMatches = (
    actionType: SLLTeacherStep['actionType'],
    targetAddr?: number | null,
    targetVal?: number | null
  ) => {
    if (taskStatus === 'completed' || isCompleted) return;
    const step = currentTeacherStep || getTaskStep(activeTask, activeStepNumber, nodes, pointers, activePosition);
    if (!step) return;

    let matched = false;
    if (step.actionType === actionType) {
      if (actionType === 'create_node') {
        matched = true;
      } else if (actionType === 'set_head' || actionType === 'set_tail') {
        matched = step.targetAddress === undefined || step.targetAddress === targetAddr;
      } else if (actionType === 'connect_next') {
        matched = step.targetAddress === undefined || step.targetAddress === targetAddr;
      } else if (actionType === 'delete_node') {
        matched = step.targetAddress === undefined || step.targetAddress === targetAddr;
      } else if (actionType === 'select_node' || actionType === 'highlight_target') {
        matched = step.targetAddress === undefined || step.targetAddress === targetAddr;
      } else {
        matched = true;
      }
    }

    if (matched) {
      const stepJustFinished = activeStepNumber;
      const newCompleted = [...new Set([...completedSteps, stepJustFinished])];
      setCompletedSteps(newCompleted);

      const isLastStep = stepJustFinished >= totalTaskSteps || step.isCompleted;
      if (isLastStep) {
        triggerTaskCompletion(
          'TASK COMPLETED! 🎉',
          'All steps completed! You built the linked list correctly.'
        );
      } else {
        const nextStepNum = stepJustFinished + 1;
        setCurrentStep(nextStepNum);
      }
    }
  };

  // TEACHER STEP: Executes exactly ONE logical action in the live workspace
  const handleExecuteSingleStep = (stepNumberToRun?: number) => {
    if (taskStatus === 'completed' || isCompleted || isExecutingStep) return;

    const stepNum = typeof stepNumberToRun === 'number'
      ? stepNumberToRun
      : getNextUncompletedStepNumber(activeTask, nodes, pointers, traversalOutput, searchResult === 'found', activePosition);

    if (stepNum > totalTaskSteps) {
      triggerTaskCompletion(
        'TASK COMPLETED! 🎉',
        'All steps completed! You built the linked list correctly.'
      );
      return;
    }

    const stepToExecute = getTaskStep(activeTask, stepNum, nodes, pointers, activePosition);
    if (!stepToExecute) return;

    setIsExecutingStep(true);
    try {
      pushSnapshot();
      const result = executeSingleTeacherStep(stepToExecute, {
        nodes,
        pointers,
        traversalOutput,
      });

      setNodes(result.nodes);
      setPointers(result.pointers);
      setTraversalOutput(result.traversalOutput);
      setTeacherLastActionResult(result.feedbackMessage);

      const newCompleted = [...new Set([...completedSteps, stepNum])];
      setCompletedSteps(newCompleted);
      soundManager.play('link');

      // Authoritative task validation
      const val = validateTaskAnswer(
        activeTask,
        result.nodes,
        result.pointers,
        result.traversalOutput,
        searchResult === 'found' || stepToExecute.isCompleted,
        activePosition
      );

      const nextUncompleted = getNextUncompletedStepNumber(
        activeTask,
        result.nodes,
        result.pointers,
        result.traversalOutput,
        searchResult === 'found' || stepToExecute.isCompleted,
        activePosition
      );

      const isLastStep = isGuidedSolveActive
        ? (stepNum >= totalTaskSteps || stepToExecute.isCompleted)
        : (stepToExecute.isCompleted || val.isValid || nextUncompleted > totalTaskSteps);

      if (isLastStep) {
        triggerTaskCompletion(
          'TASK COMPLETED! 🎉',
          result.feedbackMessage || 'All steps completed! You built the linked list correctly.'
        );
      } else {
        const nextStep = isGuidedSolveActive ? stepNum + 1 : nextUncompleted;
        setCurrentStep(nextStep);
        const nextStepDef = getTaskStep(activeTask, nextStep, result.nodes, result.pointers, activePosition);
        setFeedback({
          type: 'info',
          title: `✓ Step ${stepNum} Completed!`,
          message: `${result.feedbackMessage} Next: Step ${nextStep} - ${nextStepDef?.title || 'Next step'}`,
        });
      }
    } finally {
      setTimeout(() => {
        setIsExecutingStep(false);
      }, 200);
    }
  };

  // GUIDED SOLVE: Starts guided solve mode, deducts 3 points once per session, detects current step, executes one step
  const handleStartGuidedSolve = () => {
    if (taskStatus === 'completed' || isCompleted || isExecutingStep) return;
    soundManager.play('click');
    progressManager.deductGuidedSolvePoints(taskId);
    setIsGuidedSolveActive(true);

    const stepToStart = getNextUncompletedStepNumber(
      activeTask,
      nodes,
      pointers,
      traversalOutput,
      searchResult === 'found',
      activePosition
    );

    if (stepToStart > totalTaskSteps) {
      triggerTaskCompletion(
        'TASK COMPLETED! 🎉',
        'All steps completed! You built the linked list correctly.'
      );
      return;
    }

    setCurrentStep(stepToStart);
    handleExecuteSingleStep(stepToStart);
  };

  // STOP GUIDED SOLVE: Preserves current workspace, pointers, and memory; returns to normal gameplay immediately
  const handleStopGuidedSolve = () => {
    soundManager.play('click');
    setIsGuidedSolveActive(false);
    setFeedback({
      type: 'info',
      title: 'Guided Solve Stopped',
      message: 'Workspace preserved! You can continue playing manually or activate Guided Solve again anytime.',
    });
  };

  // NEXT STEP: Executes exactly ONE guided step with 0 additional points deducted
  const handleNextStepClick = () => {
    if (taskStatus === 'completed' || isCompleted || isExecutingStep) return;
    soundManager.play('step');

    const nextStepToExec = currentStep <= totalTaskSteps
      ? currentStep
      : getNextUncompletedStepNumber(
          activeTask,
          nodes,
          pointers,
          traversalOutput,
          searchResult === 'found',
          activePosition
        );

    if (nextStepToExec > totalTaskSteps) {
      triggerTaskCompletion(
        'TASK COMPLETED! 🎉',
        'All steps completed! You built the linked list correctly.'
      );
      return;
    }

    handleExecuteSingleStep(nextStepToExec);
  };

  const handleSearchAnswer = (isMatchAnswer: boolean) => {
    if (!currentSearchNode) return;
    const target = 40;
    const actualMatch = currentSearchNode.data === target;

    if (isMatchAnswer === actualMatch) {
      if (actualMatch) {
        setSearchResult('found');
        triggerTaskCompletion(
          'Target Element 40 Found! 🎯',
          `Matched at Address ${currentSearchNode.address}! Search halts in O(k) steps.`
        );
      } else {
        // Advance to next
        if (currentSearchNode.nextAddress !== null) {
          setPointers((prev) => ({ ...prev, currentAddress: currentSearchNode.nextAddress }));
          soundManager.play('step');
          setFeedback({
            type: 'info',
            title: 'Advancing CURRENT',
            message: `${currentSearchNode.data} ≠ ${target}. Moving to Address ${currentSearchNode.nextAddress}.`,
          });
        }
      }
    } else {
      soundManager.play('error');
      setFeedback({
        type: 'error',
        title: 'Comparison Error',
        message: actualMatch
          ? `Current node data is ${currentSearchNode.data}, which matches ${target}!`
          : `Current node data is ${currentSearchNode.data}, which does not match ${target}.`,
      });
    }
  };

  // "CHECK ANSWER" Primary Validation
  const handleCheckAnswer = () => {
    progressManager.incrementGameAttempt(gameCategory);
    progressManager.incrementGameAttempt(taskId);
    setAttempts((prev) => prev + 1);
    const searchDone = isCompleted || searchResult === 'found';
    const result = validateTaskAnswer(activeTask, nodes, pointers, traversalOutput, searchDone, activePosition);

    if (result.isValid) {
      triggerTaskCompletion('CORRECT! Linked list verified.');
    } else {
      soundManager.play('error');
      setFeedback(result.feedback);
    }
  };

  const handleNextTaskClick = () => {
    if (nextTaskId) {
      soundManager.play('click');
      onCompleteTask(taskId, nextTaskId);
    } else {
      // Completed level!
      soundManager.play('levelUp');
      onCompleteTask(taskId);
    }
  };

  const selectedNode = nodes.find((n) => n.address === selectedAddress) || null;

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto w-full font-sans animate-chapter-switch relative">
      {/* Floating Point Deduction Toast (Matching Reference Image) */}
      <div className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex justify-center w-full px-4 max-w-md">
        <AnimatePresence>
          {deductionToast && (
            <motion.div
              key={deductionToast.id}
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="pointer-events-auto"
            >
              <div className="bg-white dark:bg-[#0E172E] border border-rose-200/90 dark:border-rose-900/50 rounded-2xl sm:rounded-3xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-[0_10px_35px_rgba(244,63,94,0.16)] flex items-center gap-3 sm:gap-3.5 font-sans backdrop-blur-md">
                {/* Exclamation badge */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200/80 dark:border-rose-900/50 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 stroke-[2.2]" />
                </div>

                {/* Deduction & Reason */}
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-extrabold text-rose-600 dark:text-rose-400 font-sans tracking-tight whitespace-nowrap">
                    -{deductionToast.points} Points
                  </span>
                  <span className="text-slate-300 dark:text-slate-600 font-bold">—</span>
                  <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 font-sans whitespace-nowrap">
                    {deductionToast.reason}
                  </span>
                </div>

                {/* Dismiss Button */}
                <button
                  type="button"
                  onClick={() => setDeductionToast(null)}
                  className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
                  title="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 1. TOP HEADER HUD */}
      <div className="bg-white dark:bg-[#0B1228] border border-slate-200 dark:border-blue-900/30 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundManager.play('click');
              onBackToMenu();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-blue-950/60 border border-slate-200 dark:border-blue-900/30 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tasks</span>
          </button>

          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2563EB] dark:text-blue-400 block">
              {topicTitle ? `${topicTitle.toUpperCase()} • TASK #${taskNumberOverride || activeTask.taskIndex}` : `TASK #${activeTask.taskIndex}`}
            </span>
            <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white leading-tight">
              {taskTitleOverride || activeTask.title}
            </h2>
          </div>
        </div>

        {/* Center: Concept Reference Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="sll-concept-btn"
            onClick={() => handleSelectAssistanceMode(assistanceMode === 'concept' ? 'guide_solve' : 'concept')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl transition-all cursor-pointer font-bold text-xs ${
              assistanceMode === 'concept'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-[#070B19] border border-slate-200 dark:border-blue-900/20 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-2xs'
            }`}
            title="Concept: Current Objective, Pointer Tools info, Pointer Rule, RAM Memory State"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>CONCEPT</span>
          </button>

          {/* Level 5 Master Mission Board Button */}
          {currentLevelId === 5 && (
            <button
              type="button"
              onClick={() => setShowMissionBoard(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#EFF6FF] dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/30 text-[#2563EB] dark:text-blue-300 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
              title="View Master Mission Board"
            >
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Missions</span>
            </button>
          )}
        </div>

        {/* Right: HUD Stats */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#070B19] border border-slate-200 dark:border-blue-900/20 text-slate-700 dark:text-slate-300 font-bold">
            <TimerIcon className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" />
            <span>
              {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:
              {String(elapsedSeconds % 60).padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#070B19] border border-slate-200 dark:border-blue-900/20 text-amber-600 font-bold">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>{displayScore} XP</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#070B19] border border-slate-200 dark:border-blue-900/20 text-slate-600 dark:text-slate-400 font-bold">
            <Activity className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" />
            <span>Attempt #{attempts}</span>
          </div>
        </div>
      </div>

      {/* 2. CONDITIONAL VIEW: CONCEPT SECTION vs MAIN GAMEPLAY BODY */}
      {assistanceMode === 'concept' ? (
        <div id="sll-concept-section" className="flex flex-col gap-5 font-sans">
          {/* Concept Header Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl bg-[#EFF6FF]/70 dark:bg-[#0B1228] border border-blue-200 dark:border-blue-900/30 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2563EB] dark:text-blue-300">
                    Concept & Educational Reference
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white dark:bg-blue-950/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-blue-900/30">
                    Task #{taskNumberOverride || activeTask.taskIndex}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {taskTitleOverride || activeTask.title} — Conceptual Foundations
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectAssistanceMode('guide_solve')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Workspace</span>
              </button>
            </div>
          </div>

          {/* THE FOUR MOVED SECTIONS (Reference Only Mode) */}
          <SLLInfoPanels
            task={activeTask}
            nodes={nodes}
            pointers={pointers}
            isReferenceOnly={true}
          />

          {/* DEEP-DIVE CONCEPT: Visual Flow & Algorithm */}
          {activeTask.howItWorks && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* ASCII Diagram & Visual Pointer Flow */}
              <div className="lg:col-span-7 p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0B1228] border border-slate-200 dark:border-blue-900/30 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-blue-900/20">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        Memory Pointer Flow Architecture
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">RAM Pointer Trace</span>
                  </div>

                  <div className="mt-3 p-3.5 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
                    <pre className="whitespace-pre leading-relaxed font-semibold">
                      {activeTask.howItWorks.diagram}
                    </pre>
                  </div>

                  <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Golden Rule to Remember</span>
                    </div>
                    <p className="text-xs leading-relaxed font-medium">
                      {activeTask.howItWorks.keyRule}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-[11px] text-slate-500 dark:text-slate-400">
                  Linked lists require explicit sequential pointer traversal. Breaking a link before updating it causes immediate memory disconnect.
                </p>
              </div>

              {/* Step-by-Step Algorithmic Logic */}
              <div className="lg:col-span-5 p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0B1228] border border-slate-200 dark:border-blue-900/30 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-blue-900/20">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        Execution Steps Breakdown
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#2563EB] dark:text-blue-300">
                      {activeTask.howItWorks.steps.length} Steps
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {activeTask.howItWorks.steps.map((stepText, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-2xl bg-slate-50 dark:bg-[#070B19] border border-slate-200 dark:border-blue-900/20 flex items-start gap-2.5"
                      >
                        <span className="w-5 h-5 rounded-lg bg-blue-100 dark:bg-blue-950 text-[#1D4ED8] dark:text-blue-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="text-xs">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">{stepText}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-blue-900/20 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500">Practice Now:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAssistanceMode('guide_solve')}
                      className="px-3 py-1.5 rounded-xl bg-[#FFF3E0] hover:bg-[#FFE8C2] dark:bg-[#2A1D0D] dark:hover:bg-[#382611] border border-[#FDBA5A] text-[#7C3F00] dark:text-[#FDBA5A] text-xs font-bold cursor-pointer transition-all shadow-xs"
                    >
                      Return to Workspace
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* MAIN GAMEPLAY BODY: Reflowed directly without the 4 cards */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Interactive RAM Workspace + Teacher Assistant + Bottom Controls */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* GUIDE & SOLVE TEACHER BANNER: Live Node Diagram + RAM Matrix + 2-3 Bullet Points + Next Step / Stop */}
            <SLLTeacherBanner
              step={currentTeacherStep}
              lastActionResult={teacherLastActionResult}
              isTaskComplete={isCompleted || taskStatus === 'completed'}
              completedSteps={completedSteps}
              isGuidedSolveActive={isGuidedSolveActive}
              isExecuting={isExecutingStep}
              onStartGuidedSolve={handleStartGuidedSolve}
              onExecuteNextStep={handleNextStepClick}
              onStopGuidedSolve={handleStopGuidedSolve}
              onNextTask={handleNextTaskClick}
              hasNextTask={Boolean(nextTaskId)}
              nodes={nodes}
              pointers={pointers}
            />

          {/* DYNAMIC POSITION SELECTOR FOR L4_T1 ("Insert at Any Position") */}
          {activeTask.id === 'L4_T1' && (
            <div className="bg-white dark:bg-[#0B1228] border border-slate-200 dark:border-blue-900/30 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider font-mono">
                  Insert Position:
                </span>
                <span className="text-xs font-semibold text-[#2563EB] dark:text-blue-400 font-mono">
                  Position {insertPosition} {insertPosition === 1 ? '(Beginning Insertion)' : insertPosition === 6 ? '(End Insertion)' : '(Middle Insertion)'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[1, 2, 3, 4, 5, 6].map((pos) => {
                  const isSelected = insertPosition === pos;
                  return (
                    <button
                      key={pos}
                      id={`insert-pos-${pos}-btn`}
                      type="button"
                      onClick={() => handleSelectInsertPosition(pos)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-blue-900/40'
                      }`}
                    >
                      Pos {pos}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* DYNAMIC POSITION SELECTOR FOR L4_T2 ("Delete at Any Position") */}
          {activeTask.id === 'L4_T2' && (
            <div className="bg-white dark:bg-[#0B1228] border border-slate-200 dark:border-blue-900/30 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider font-mono">
                  Delete Position:
                </span>
                <span className="text-xs font-semibold text-[#2563EB] dark:text-blue-400 font-mono">
                  Position {deletePosition} {deletePosition === 1 ? '(HEAD Node)' : deletePosition === 5 ? '(LAST Node)' : '(Middle Node)'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[1, 2, 3, 4, 5].map((pos) => {
                  const isSelected = deletePosition === pos;
                  return (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => handleSelectDeletePosition(pos)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-blue-900/40'
                      }`}
                    >
                      Pos {pos}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <SLLWorkspace
            nodes={nodes}
            pointers={pointers}
            stagedNodes={stagedNodes}
            traversalOutput={traversalOutput}
            searchTarget={searchTarget}
            searchResult={searchResult}
            selectedAddress={selectedAddress}
            onSelectNode={(addr) => setSelectedAddress(addr)}
            onOpenChangeNext={(addr) => {
              setSelectedAddress(addr);
              setActiveModal('CHANGE_NEXT');
            }}
            isTraversing={isTraversing}
            isSearching={isSearching}
            levelId={currentLevelId}
            nodeRoleLabels={nodeRoleLabels}
            // Direct interactive workspace props
            pendingConnectFrom={pendingConnectFrom}
            isSettingHeadMode={isSettingHeadMode}
            isSettingTailMode={isSettingTailMode}
            isDeletingNodeMode={isDeletingNodeMode}
            isConnectingNextMode={isConnectingNextMode}
            onSetHeadDirect={handleSetHeadDirect}
            onSetTailDirect={handleSetTailDirect}
            onConnectNextDirect={handleConnectNextDirect}
            onDeleteNodeDirect={handleDeleteNode}
            onNodeClickDirect={handleNodeClickDirect}
            onInsertBetween={handleInsertBetween}
            guideTargetAddress={currentTeacherStep?.targetAddress ?? activeTask.targetCondition.expectedHead ?? undefined}
            highlightAddresses={activeHighlightAddresses}
            detachedAddress={currentTeacherStep?.detachedAddress}
            isTraversalTask={isTraversalTask}
            traversalNextExpectedAddr={traversalNextExpectedAddr}
            onTraversalNullClick={handleTraversalNullClick}
            // Integrated Workspace Pointer Toolbar props
            onCreateNode={handleQuickCreateNode}
            onOpenCreateNodeModal={() => setActiveModal('CREATE_NODE')}
            onToggleHeadMode={handleToggleHeadMode}
            onToggleTailMode={handleToggleTailMode}
            onToggleNextMode={handleToggleNextMode}
            onToggleDeleteMode={handleToggleDeleteMode}
            onCancelDirectMode={handleCancelDirectMode}
            onSetNextToNull={handleSetNextToNull}
          />

          {/* Bottom Interactive Controls */}
          <SLLBottomControls
            onOpenCreateNode={() => setActiveModal('CREATE_NODE')}
            onOpenChangeNext={() => setActiveModal('CHANGE_NEXT')}
            onOpenSetHead={() => setActiveModal('SET_HEAD')}
            onOpenSetTail={() => setActiveModal('SET_TAIL')}
            onOpenDeleteNode={() => setActiveModal('DELETE_NODE')}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onResetTask={resetTaskState}
            onOpenHint={handleOpenHint}
            onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
            canUndo={history.length > 0}
            canRedo={redoStack.length > 0}
            nodeCount={nodes.length}
            isSettingHeadMode={isSettingHeadMode}
            isSettingTailMode={isSettingTailMode}
            pendingConnectFrom={pendingConnectFrom}
            onToggleSetHeadMode={() => setIsSettingHeadMode((prev) => !prev)}
            onToggleSetTailMode={() => setIsSettingTailMode((prev) => !prev)}
            onCancelDirectMode={() => {
              setIsSettingHeadMode(false);
              setIsSettingTailMode(false);
              setPendingConnectFrom(null);
            }}
            assistanceMode={assistanceMode}
            isGuidedSolveActive={isGuidedSolveActive}
            isTaskComplete={isCompleted || taskStatus === 'completed'}
            currentStep={activeStepNumber}
            task={activeTask}
            nodes={nodes}
            pointers={pointers}
            onExecuteTeacherStep={handleNextStepClick}
            onStartGuidedSolve={handleStartGuidedSolve}
            onStopGuidedSolve={handleStopGuidedSolve}
            isExecutingStep={isExecutingStep}
          />
        </div>

          {/* Right Column: Task Instructions & Evaluation Panel */}
          <div className="lg:col-span-4">
            <SLLTaskPanel
              task={currentTaskView}
              nodes={nodes}
              pointers={pointers}
              selectedNode={selectedNode}
              currentStep={currentStep}
              completedSteps={completedSteps}
              onOpenCreateNode={() => setActiveModal('CREATE_NODE')}
              onOpenChangeNext={(addr) => {
                if (addr) setSelectedAddress(addr);
                setActiveModal('CHANGE_NEXT');
              }}
              onOpenSetHead={() => setActiveModal('SET_HEAD')}
              onOpenSetTail={() => setActiveModal('SET_TAIL')}
              onOpenDeleteNode={(addr) => {
                if (addr) setSelectedAddress(addr);
                setActiveModal('DELETE_NODE');
              }}
              onOpenHint={handleOpenHint}
              onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
              assistanceMode={assistanceMode}
              onSelectAssistanceMode={handleSelectAssistanceMode}
              onCheckAnswer={handleCheckAnswer}
              feedback={feedback}
              isCompleted={isCompleted}
              onNextTask={handleNextTaskClick}
              hasNextTask={Boolean(nextTaskId)}
              // Traversal props
              traversalOutput={traversalOutput}
              traversalNextExpectedAddr={traversalNextExpectedAddr}
              onTraversalNullClick={handleTraversalNullClick}
              onTraversalAnswer={activeTask.targetCondition.customValidator === 'L3_TRAVERSAL_COMPLETE' ? handleTraversalAnswer : undefined}
              // Search props
              searchStepPrompt={
                (activeTask.targetCondition.customValidator === 'L4_SEARCH_COMPLETE' || activeTask.targetCondition.customValidator === 'L5_SEARCH_25') &&
                currentSearchNode
                  ? { currentData: currentSearchNode.data, targetData: 40 }
                  : null
              }
              onSearchAnswer={handleSearchAnswer}
              deletePosition={activePosition}
              insertPosition={insertPosition}
              baseScore={baseScore}
              scoreBreakdown={scoreBreakdown}
            />
          </div>
        </div>
      )}

      {/* 4. MODAL DIALOGS FOR CREATING, EDITING & HINTS */}
      <SLLActionModal
        modalType={activeModal}
        onClose={() => setActiveModal('NONE')}
        nodes={nodes}
        pointers={pointers}
        activeTask={currentTaskView}
        selectedAddress={selectedAddress}
        onCreateNode={handleCreateNode}
        onChangeNext={handleChangeNext}
        onSetHead={handleSetHead}
        onSetTail={handleSetTail}
        onDeleteNode={handleDeleteNode}
        hintLevel={hintLevel}
        onAdvanceHint={() => setHintLevel((prev) => Math.min(2, prev + 1))}
      />

      {/* 5. CONCEPT GUIDE MODAL (SEE -> UNDERSTAND) */}
      <SLLHowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        info={activeTask.howItWorks}
        taskTitle={activeTask.title}
      />

      {/* 6. LEVEL 5 MISSION BOARD OVERLAY */}
      {showMissionBoard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-sans">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            className="bg-white dark:bg-[#0B1228] border border-slate-200 dark:border-blue-900/30 rounded-3xl p-5 sm:p-6 w-full max-w-2xl shadow-2xl overflow-hidden relative"
          >
            <button
              type="button"
              onClick={() => setShowMissionBoard(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <SLLMissionBoard
              currentTaskId={taskId}
              completedTaskIds={[]}
              onSelectMission={(missionId) => {
                if (onSelectTask) {
                  onSelectTask(missionId);
                }
                setShowMissionBoard(false);
              }}
            />
          </motion.div>
        </div>
      )}

      {/* 7. HOW TO PLAY ONBOARDING MODAL (PLAY MODE) */}
      <SLLHowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => {
          setIsHowToPlayOpen(false);
          localStorage.setItem('sll_has_seen_how_to_play', 'true');
        }}
      />
    </div>
  );
};
