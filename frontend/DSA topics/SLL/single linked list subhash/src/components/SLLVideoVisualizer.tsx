import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  ArrowRight,
  ArrowDown,
  Layers,
  Database,
  Cpu,
  Search,
  PlusCircle,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  Check,
  Eye,
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { progressManager } from '../utils/progressManager';

export interface SLLVideoVisualizerProps {
  lessonId?: 'lesson-01' | 'lesson-02';
  onComplete?: () => void;
}

export type VisualizeActivityId =
  | 'visualize_node'
  | 'visualize_linking'
  | 'visualize_traversal'
  | 'visualize_insertion'
  | 'visualize_deletion';

interface StepInfo {
  stepNumber: number;
  title: string;
  description: string;
  highlightPart: string;
  diagramState: string;
  activePointers?: string[];
}

interface ActivityConfig {
  id: VisualizeActivityId;
  title: string;
  subtitle: string;
  description: string;
  steps: StepInfo[];
}

const ACTIVITIES: ActivityConfig[] = [
  // 1. NODE VISUALIZATION
  {
    id: 'visualize_node',
    title: 'Node Visualization',
    subtitle: 'Node creation, DATA, NEXT, HEAD, NULL structure',
    description:
      'A Node is dynamically created on the Heap. It contains two distinct components: a DATA field and a NEXT pointer field.',
    steps: [
      {
        stepNumber: 1,
        title: 'Memory Heap Allocation (malloc / new)',
        description: 'Allocating sizeof(Node) bytes on Heap memory at address 0x1000.',
        highlightPart: 'allocation',
        diagramState: 'allocating',
        activePointers: [],
      },
      {
        stepNumber: 2,
        title: 'Initializing DATA field',
        description: 'Storing the actual payload value (e.g., DATA = 10) in the data partition.',
        highlightPart: 'data',
        diagramState: 'data-set',
        activePointers: [],
      },
      {
        stepNumber: 3,
        title: 'Setting NEXT pointer to NULL',
        description: 'Since this is a newly isolated node, its NEXT reference points to NULL (0x0000).',
        highlightPart: 'next',
        diagramState: 'null-term',
        activePointers: ['next'],
      },
      {
        stepNumber: 4,
        title: 'Assigning HEAD pointer',
        description: 'The external reference variable HEAD points to address 0x1000, establishing the list entry point.',
        highlightPart: 'head',
        diagramState: 'head-set',
        activePointers: ['head'],
      },
    ],
  },

  // 2. LINKING NODES
  {
    id: 'visualize_linking',
    title: 'Linking Nodes',
    subtitle: 'Unidirectional Pointer Links between Memory Addresses',
    description:
      'Nodes in a Singly Linked List are chained together by assigning the NEXT pointer of Node A to the heap address of Node B.',
    steps: [
      {
        stepNumber: 1,
        title: 'Two Separate Disconnected Nodes',
        description: 'Node A at 0x1000 (DATA: 10, NEXT: NULL) and Node B at 0x2000 (DATA: 20, NEXT: NULL) exist independently.',
        highlightPart: 'separated',
        diagramState: 'separate',
        activePointers: ['head'],
      },
      {
        stepNumber: 2,
        title: 'Assigning NodeA->next = NodeB',
        description: 'The NEXT pointer of Node A is updated to store address 0x2000 instead of NULL.',
        highlightPart: 'linking',
        diagramState: 'linking-arrow',
        activePointers: ['next-link'],
      },
      {
        stepNumber: 3,
        title: 'Unidirectional Forward Chain Formed',
        description: 'HEAD points to Node A (0x1000), which points to Node B (0x2000), terminating at NULL: HEAD → 10 → 20 → NULL.',
        highlightPart: 'chain',
        diagramState: 'chain-done',
        activePointers: ['head', 'arrow'],
      },
    ],
  },

  // 3. TRAVERSAL VISUALIZATION
  {
    id: 'visualize_traversal',
    title: 'Traversal Visualization',
    subtitle: 'Sequential Traversal from HEAD to NULL Sentinel',
    description:
      'Traversal sequentially moves a temporary pointer (CURRENT) through each node following the NEXT references until reaching NULL.',
    steps: [
      {
        stepNumber: 1,
        title: 'CURRENT = HEAD (Start at Node 1)',
        description: 'Initialize CURRENT pointer to HEAD (address 0x1000, DATA = 10). Process/print 10.',
        highlightPart: 'node-0',
        diagramState: 'curr-node-1',
        activePointers: ['current-0'],
      },
      {
        stepNumber: 2,
        title: 'CURRENT = CURRENT->next (Advance to Node 2)',
        description: 'Follow NEXT pointer (0x2000). CURRENT now points to Node 2 (DATA = 20). Process/print 20.',
        highlightPart: 'node-1',
        diagramState: 'curr-node-2',
        activePointers: ['current-1'],
      },
      {
        stepNumber: 3,
        title: 'CURRENT = CURRENT->next (Advance to Node 3)',
        description: 'Follow NEXT pointer (0x3000). CURRENT now points to Node 3 (DATA = 30). Process/print 30.',
        highlightPart: 'node-2',
        diagramState: 'curr-node-3',
        activePointers: ['current-2'],
      },
      {
        stepNumber: 4,
        title: 'CURRENT Reaches NULL (End of Traversal)',
        description: 'Node 3->next is NULL. CURRENT becomes NULL. Traversal halts in O(N) time.',
        highlightPart: 'null',
        diagramState: 'curr-null',
        activePointers: ['current-null'],
      },
    ],
  },

  // 4. INSERTION VISUALIZATION
  {
    id: 'visualize_insertion',
    title: 'Insertion Visualization',
    subtitle: 'Prepend at HEAD, Append at End, and Insert Between',
    description:
      'Inserting a node involves creating the node, rewiring the predecessor NEXT pointer to the new node, and connecting the new node to the successor.',
    steps: [
      {
        stepNumber: 1,
        title: 'Create & Stage New Node [ 5 ]',
        description: 'New node with DATA = 5 allocated at 0x0500. Existing list: HEAD → [ 10 ] → [ 20 ] → NULL.',
        highlightPart: 'new-node',
        diagramState: 'ins-stage',
        activePointers: [],
      },
      {
        stepNumber: 2,
        title: 'Connect newNode->next = HEAD',
        description: 'Point newNode->next to current first node (0x1000) BEFORE moving HEAD to prevent losing list reference.',
        highlightPart: 'ins-link',
        diagramState: 'ins-link-first',
        activePointers: ['new-next'],
      },
      {
        stepNumber: 3,
        title: 'Update HEAD = newNode in O(1) Time',
        description: 'Reassign HEAD to address 0x0500. The new list is: HEAD → [ 5 ] → [ 10 ] → [ 20 ] → NULL.',
        highlightPart: 'ins-head',
        diagramState: 'ins-complete',
        activePointers: ['head'],
      },
    ],
  },

  // 5. DELETION VISUALIZATION
  {
    id: 'visualize_deletion',
    title: 'Deletion Visualization',
    subtitle: 'Bypass Target Node & Release Memory',
    description:
      'Deleting a node requires bypassing the target node by updating the predecessor pointer (prev->next = target->next) and calling free(target).',
    steps: [
      {
        stepNumber: 1,
        title: 'Identify Target Node [ 20 ] to Delete',
        description: 'Current list: HEAD → [ 10 ] (prev) → [ 20 ] (target) → [ 30 ] (next) → NULL.',
        highlightPart: 'del-identify',
        diagramState: 'del-identify',
        activePointers: ['prev', 'target'],
      },
      {
        stepNumber: 2,
        title: 'Bypass Pointer: prev->next = target->next',
        description: 'Update Node 10->next to store 0x3000 directly, bypassing Node 20. The chain remains intact.',
        highlightPart: 'del-bypass',
        diagramState: 'del-bypass',
        activePointers: ['prev-next'],
      },
      {
        stepNumber: 3,
        title: 'Free Target Memory: free(target)',
        description: 'Deallocate Node 20 from heap memory to prevent memory leaks. List is now: HEAD → [ 10 ] → [ 30 ] → NULL.',
        highlightPart: 'del-free',
        diagramState: 'del-free',
        activePointers: ['head'],
      },
    ],
  },
];

export const SLLVideoVisualizer: React.FC<SLLVideoVisualizerProps> = ({ onComplete }) => {
  const [activeActivityIndex, setActiveActivityIndex] = useState<number>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [, setUpdateTrigger] = useState<number>(0);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsub = progressManager.subscribe(() => {
      setUpdateTrigger((v) => v + 1);
    });
    return unsub;
  }, []);

  const activeActivity = ACTIVITIES[activeActivityIndex] || ACTIVITIES[0];
  const steps = activeActivity.steps;
  const currentStep = steps[currentStepIndex] || steps[0];
  const isActivityCompleted = progressManager.isCompleted(activeActivity.id);

  // Animation Autoplay
  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      return;
    }

    playTimerRef.current = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          soundManager.playSuccess();
          return prev;
        }
        soundManager.playStep();
        return prev + 1;
      });
    }, 2400);

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, steps.length]);

  const handleSelectActivity = (idx: number) => {
    soundManager.playClick();
    setActiveActivityIndex(idx);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const handleStepForward = () => {
    if (currentStepIndex < steps.length - 1) {
      soundManager.playStep();
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleStepBack = () => {
    if (currentStepIndex > 0) {
      soundManager.playStep();
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    soundManager.playClick();
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const handleCompleteActivity = () => {
    if (isActivityCompleted) return;
    const result = progressManager.completeInteractiveVisualizerActivity(activeActivity.id);
    if (result.newlyCompleted) {
      soundManager.playCelebrate();
      if (onComplete) onComplete();
    }
  };

  return (
    <div className="w-full bg-[#050A1A] rounded-3xl border border-blue-900/50 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_30px_rgba(37,99,235,0.15)] overflow-hidden text-white select-none font-sans">
      {/* 1. VISUALIZER TOP BAR HUD */}
      <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-[#0B1533] via-[#091026] to-[#0B1533] border-b border-blue-800/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center font-bold">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase block">
              VISUALIZATION LAB • CONCEPT ANIMATION
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-white">
              Single Linked List Interactive Visualizer
            </h3>
          </div>
        </div>
      </div>

      {/* 2. THE FIVE SELECTABLE VISUALIZE ACTIVITY TABS */}
      <div className="px-3 sm:px-6 py-2.5 bg-[#070D22] border-b border-blue-900/40 flex items-center gap-2 overflow-x-auto">
        {ACTIVITIES.map((act, idx) => {
          const isSelected = activeActivityIndex === idx;
          const isDone = progressManager.isCompleted(act.id);

          return (
            <button
              key={act.id}
              onClick={() => handleSelectActivity(idx)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold ring-1 ring-blue-400'
                  : 'bg-blue-950/40 hover:bg-blue-900/40 text-slate-300 hover:text-white border border-blue-900/30'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[10px] font-mono">
                {idx + 1}
              </span>
              <span>{act.title}</span>
              {isDone && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* 3. MAIN VISUALIZATION STAGE */}
      <div className="relative p-5 sm:p-8 min-h-[380px] flex flex-col justify-between overflow-hidden bg-radial-grid">
        {/* Subtle Cyber Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(37,99,235,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.06)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6">
          {/* Header of Active Activity */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  ACTIVITY {activeActivityIndex + 1} OF 5
                </span>
                <span className="text-xs text-slate-400 font-mono">• {activeActivity.subtitle}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide mt-0.5">
                {activeActivity.title}
              </h2>
            </div>

            {/* Completion Status Badge */}
            {isActivityCompleted && (
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Activity Completed</span>
                </span>
              </div>
            )}
          </div>

          {/* VISUAL DIAGRAM DISPLAY */}
          <div className="py-8 px-4 bg-[#08122E]/80 border border-blue-900/60 rounded-2xl flex items-center justify-center overflow-x-auto shadow-inner">
            {/* Visual Linked List Architecture dynamically responding to step */}
            {activeActivity.id === 'visualize_node' && (
              <div className="flex items-center gap-4 animate-scale-enter">
                <div className="flex flex-col items-center">
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-cyan-600 text-white shadow-md">
                    HEAD
                  </span>
                  <ArrowDown className="w-5 h-5 text-cyan-400 mt-1 animate-bounce" />
                  <span className="text-[10px] font-mono text-cyan-300 mt-0.5">0x1000</span>
                </div>

                <div className="flex items-center rounded-2xl overflow-hidden border-2 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)] ring-2 ring-cyan-500/30">
                  <div className="px-5 py-4 bg-[#0B1A40] flex flex-col items-center justify-center min-w-[80px] border-r border-blue-800">
                    <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase">DATA</span>
                    <span className="text-2xl font-mono font-black text-white">10</span>
                  </div>
                  <div className="px-4 py-4 bg-[#07112B] flex flex-col items-center justify-center min-w-[80px]">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">NEXT</span>
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      {currentStep.diagramState === 'null-term' || currentStep.diagramState === 'head-set'
                        ? 'NULL'
                        : '0x0000'}
                    </span>
                  </div>
                </div>

                <div className="text-slate-500 font-mono font-bold text-xs">→ NULL</div>
              </div>
            )}

            {activeActivity.id === 'visualize_linking' && (
              <div className="flex items-center gap-3 sm:gap-4 animate-scale-enter">
                {/* Node A */}
                <div className="flex items-center rounded-2xl overflow-hidden border-2 border-blue-500 shadow-md">
                  <div className="px-4 py-3.5 bg-[#0B1A40] flex flex-col items-center min-w-[70px] border-r border-blue-800">
                    <span className="text-[9px] font-mono text-blue-300">DATA</span>
                    <span className="text-xl font-mono font-bold text-white">10</span>
                  </div>
                  <div className="px-3.5 py-3.5 bg-[#07112B] flex flex-col items-center min-w-[75px]">
                    <span className="text-[9px] font-mono text-cyan-400">NEXT</span>
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      {currentStepIndex >= 1 ? '0x2000' : 'NULL'}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight
                  className={`w-6 h-6 transition-all ${
                    currentStepIndex >= 1 ? 'text-cyan-400 scale-125' : 'text-slate-600'
                  }`}
                />

                {/* Node B */}
                <div className="flex items-center rounded-2xl overflow-hidden border-2 border-blue-500 shadow-md">
                  <div className="px-4 py-3.5 bg-[#0B1A40] flex flex-col items-center min-w-[70px] border-r border-blue-800">
                    <span className="text-[9px] font-mono text-blue-300">DATA</span>
                    <span className="text-xl font-mono font-bold text-white">20</span>
                  </div>
                  <div className="px-3.5 py-3.5 bg-[#07112B] flex flex-col items-center min-w-[75px]">
                    <span className="text-[9px] font-mono text-cyan-400">NEXT</span>
                    <span className="text-xs font-mono font-bold text-cyan-300">NULL</span>
                  </div>
                </div>

                <div className="text-slate-500 font-mono font-bold text-xs">→ NULL</div>
              </div>
            )}

            {activeActivity.id === 'visualize_traversal' && (
              <div className="flex items-center gap-3 sm:gap-4 animate-scale-enter">
                {[10, 20, 30].map((val, idx) => {
                  const isCurrent = currentStepIndex === idx;
                  return (
                    <React.Fragment key={val}>
                      <div className="flex flex-col items-center">
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500 text-slate-900 mb-1 animate-bounce">
                            CURRENT
                          </span>
                        )}
                        <div
                          className={`flex items-center rounded-2xl overflow-hidden border-2 transition-all ${
                            isCurrent
                              ? 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)] ring-2 ring-amber-500/40'
                              : 'border-blue-800 bg-[#08122E]'
                          }`}
                        >
                          <div className="px-4 py-3 bg-[#0B1A40] flex flex-col items-center min-w-[60px] border-r border-blue-800">
                            <span className="text-[9px] font-mono text-blue-300">DATA</span>
                            <span className="text-lg font-mono font-bold text-white">{val}</span>
                          </div>
                          <div className="px-3 py-3 bg-[#07112B] flex flex-col items-center min-w-[65px]">
                            <span className="text-[9px] font-mono text-cyan-400">NEXT</span>
                            <span className="text-xs font-mono font-bold text-cyan-300">
                              {idx < 2 ? `0x${(idx + 2) * 1000}` : 'NULL'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-blue-400" />
                    </React.Fragment>
                  );
                })}

                <div
                  className={`px-3 py-2 rounded-xl border text-xs font-mono font-bold ${
                    currentStepIndex === 3
                      ? 'border-emerald-400 bg-emerald-950/60 text-emerald-300 ring-2 ring-emerald-500'
                      : 'border-slate-700 text-slate-500'
                  }`}
                >
                  NULL
                </div>
              </div>
            )}

            {activeActivity.id === 'visualize_insertion' && (
              <div className="flex items-center gap-3 sm:gap-4 animate-scale-enter">
                {/* Prepend Node 5 */}
                <div
                  className={`flex flex-col items-center transition-all ${
                    currentStepIndex >= 1 ? 'scale-100 opacity-100' : 'scale-90 opacity-75'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-emerald-400 mb-1">
                    newNode [0x0500]
                  </span>
                  <div className="flex items-center rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                    <div className="px-4 py-3 bg-emerald-950/70 border-r border-emerald-800 flex flex-col items-center min-w-[60px]">
                      <span className="text-[9px] font-mono text-emerald-300">DATA</span>
                      <span className="text-lg font-mono font-bold text-white">5</span>
                    </div>
                    <div className="px-3 py-3 bg-[#07112B] flex flex-col items-center min-w-[65px]">
                      <span className="text-[9px] font-mono text-emerald-400">NEXT</span>
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        {currentStepIndex >= 1 ? '0x1000' : 'NULL'}
                      </span>
                    </div>
                  </div>
                </div>

                <ArrowRight className="w-5 h-5 text-emerald-400" />

                {/* Node 10 */}
                <div className="flex items-center rounded-2xl overflow-hidden border-2 border-blue-500">
                  <div className="px-4 py-3 bg-[#0B1A40] border-r border-blue-800 flex flex-col items-center min-w-[60px]">
                    <span className="text-[9px] font-mono text-blue-300">DATA</span>
                    <span className="text-lg font-mono font-bold text-white">10</span>
                  </div>
                  <div className="px-3 py-3 bg-[#07112B] flex flex-col items-center min-w-[65px]">
                    <span className="text-[9px] font-mono text-cyan-400">NEXT</span>
                    <span className="text-xs font-mono font-bold text-cyan-300">0x2000</span>
                  </div>
                </div>

                <ArrowRight className="w-5 h-5 text-blue-400" />

                {/* Node 20 */}
                <div className="flex items-center rounded-2xl overflow-hidden border-2 border-blue-500">
                  <div className="px-4 py-3 bg-[#0B1A40] border-r border-blue-800 flex flex-col items-center min-w-[60px]">
                    <span className="text-[9px] font-mono text-blue-300">DATA</span>
                    <span className="text-lg font-mono font-bold text-white">20</span>
                  </div>
                  <div className="px-3 py-3 bg-[#07112B] flex flex-col items-center min-w-[65px]">
                    <span className="text-[9px] font-mono text-cyan-400">NEXT</span>
                    <span className="text-xs font-mono font-bold text-cyan-300">NULL</span>
                  </div>
                </div>
              </div>
            )}

            {activeActivity.id === 'visualize_deletion' && (
              <div className="flex items-center gap-3 sm:gap-4 animate-scale-enter">
                {/* Node 10 (prev) */}
                <div className="flex items-center rounded-2xl overflow-hidden border-2 border-blue-500">
                  <div className="px-4 py-3 bg-[#0B1A40] border-r border-blue-800 flex flex-col items-center min-w-[60px]">
                    <span className="text-[9px] font-mono text-blue-300">DATA</span>
                    <span className="text-lg font-mono font-bold text-white">10</span>
                  </div>
                  <div className="px-3 py-3 bg-[#07112B] flex flex-col items-center min-w-[65px]">
                    <span className="text-[9px] font-mono text-cyan-400">NEXT</span>
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      {currentStepIndex >= 1 ? '0x3000' : '0x2000'}
                    </span>
                  </div>
                </div>

                <ArrowRight className="w-5 h-5 text-blue-400" />

                {/* Node 20 (Target) */}
                <div
                  className={`flex flex-col items-center transition-all ${
                    currentStepIndex >= 2 ? 'opacity-20 line-through scale-90' : 'opacity-100'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-rose-400 mb-1">
                    {currentStepIndex >= 2 ? 'free(node 20)' : 'target (0x2000)'}
                  </span>
                  <div className="flex items-center rounded-2xl overflow-hidden border-2 border-rose-500 shadow-md">
                    <div className="px-4 py-3 bg-rose-950/70 border-r border-rose-800 flex flex-col items-center min-w-[60px]">
                      <span className="text-[9px] font-mono text-rose-300">DATA</span>
                      <span className="text-lg font-mono font-bold text-white">20</span>
                    </div>
                    <div className="px-3 py-3 bg-[#07112B] flex flex-col items-center min-w-[65px]">
                      <span className="text-[9px] font-mono text-rose-400">NEXT</span>
                      <span className="text-xs font-mono font-bold text-cyan-300">0x3000</span>
                    </div>
                  </div>
                </div>

                <ArrowRight className="w-5 h-5 text-blue-400" />

                {/* Node 30 (Next) */}
                <div className="flex items-center rounded-2xl overflow-hidden border-2 border-blue-500">
                  <div className="px-4 py-3 bg-[#0B1A40] border-r border-blue-800 flex flex-col items-center min-w-[60px]">
                    <span className="text-[9px] font-mono text-blue-300">DATA</span>
                    <span className="text-lg font-mono font-bold text-white">30</span>
                  </div>
                  <div className="px-3 py-3 bg-[#07112B] flex flex-col items-center min-w-[65px]">
                    <span className="text-[9px] font-mono text-cyan-400">NEXT</span>
                    <span className="text-xs font-mono font-bold text-cyan-300">NULL</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. STEP EXPLANATION PANEL */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0B1A40]/80 border border-blue-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-mono text-xs font-bold">
                  Step {currentStep.stepNumber} of {steps.length}
                </span>
                <span className="text-sm font-bold text-white">{currentStep.title}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                {currentStep.description}
              </p>
            </div>

            {/* Complete Activity Action Button */}
            <div className="shrink-0">
              <button
                type="button"
                id={`btn-complete-vis-${activeActivity.id}`}
                onClick={handleCompleteActivity}
                disabled={isActivityCompleted}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all ${
                  isActivityCompleted
                    ? 'bg-emerald-600/40 text-emerald-300 border border-emerald-500/50 cursor-default'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 cursor-pointer active:scale-95'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  {isActivityCompleted
                    ? 'ACTIVITY COMPLETED'
                    : 'COMPLETE ACTIVITY'}
                </span>
              </button>
            </div>
          </div>

          {/* 5. INTERACTIVE CONTROLS (Back, Play/Pause, Next, Reset) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-blue-900/40">
            <div className="flex items-center gap-2">
              <button
                onClick={handleStepBack}
                disabled={currentStepIndex === 0}
                className="px-3.5 py-1.5 rounded-xl bg-blue-950/80 hover:bg-blue-900/80 disabled:opacity-40 text-xs font-semibold text-slate-300 hover:text-white border border-blue-800/60 cursor-pointer disabled:cursor-not-allowed transition-all"
              >
                Prev Step
              </button>
              <button
                onClick={handleStepForward}
                disabled={currentStepIndex >= steps.length - 1}
                className="px-3.5 py-1.5 rounded-xl bg-blue-950/80 hover:bg-blue-900/80 disabled:opacity-40 text-xs font-semibold text-slate-300 hover:text-white border border-blue-800/60 cursor-pointer disabled:cursor-not-allowed transition-all"
              >
                Next Step
              </button>
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPlaying ? 'Pause' : 'Auto-Play'}</span>
              </button>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
};

export default SLLVideoVisualizer;
