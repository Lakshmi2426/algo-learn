import React from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Code2,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Info,
  Layers,
  Link as LinkIcon,
  Plus,
  Trash2,
  Eye,
  Search,
} from 'lucide-react';
import { SLLTaskDef, SLLNode, SLLPointerState, SLLFeedback, AssistanceMode } from '../../types/sllGame';
import { getAllTaskSteps } from '../../utils/sllStepAssistant';

interface SLLTaskPanelProps {
  task: SLLTaskDef;
  nodes: SLLNode[];
  pointers: SLLPointerState;
  selectedNode: SLLNode | null;
  currentStep?: number;
  completedSteps?: number[];
  onOpenCreateNode: () => void;
  onOpenChangeNext: (address?: number) => void;
  onOpenSetHead: () => void;
  onOpenSetTail: () => void;
  onOpenDeleteNode: (address?: number) => void;
  onOpenHint?: () => void;
  onCheckAnswer: () => void;
  onOpenHowItWorks?: () => void;
  assistanceMode?: AssistanceMode;
  onSelectAssistanceMode?: (mode: AssistanceMode) => void;
  feedback: SLLFeedback | null;
  isCompleted: boolean;
  onNextTask: () => void;
  hasNextTask: boolean;
  // Traversal & Search Interactive Props
  currentTraversalStep?: number;
  onTraversalAnswer?: (answer: string) => void;
  traversalOutput?: number[];
  traversalNextExpectedAddr?: number | null;
  onTraversalNullClick?: () => void;
  searchStepPrompt?: {
    currentData: number;
    targetData: number;
  } | null;
  onSearchAnswer?: (isMatch: boolean) => void;
  deletePosition?: number;
  insertPosition?: number;
  baseScore?: number;
  scoreBreakdown?: {
    baseScore: number;
    hintPenalty: number;
    guidePenalty: number;
    finalScore: number;
    hintUsed: boolean;
    guideUsed: boolean;
  } | null;
}

export const SLLTaskPanel: React.FC<SLLTaskPanelProps> = ({
  task,
  nodes,
  pointers,
  selectedNode,
  currentStep = 1,
  completedSteps = [],
  onOpenCreateNode,
  onOpenChangeNext,
  onOpenSetHead,
  onOpenSetTail,
  onOpenDeleteNode,
  onOpenHint,
  onCheckAnswer,
  onOpenHowItWorks,
  assistanceMode = 'play',
  onSelectAssistanceMode,
  feedback,
  isCompleted,
  onNextTask,
  hasNextTask,
  currentTraversalStep,
  onTraversalAnswer,
  traversalOutput,
  traversalNextExpectedAddr,
  onTraversalNullClick,
  searchStepPrompt,
  onSearchAnswer,
  deletePosition = 2,
  insertPosition = 3,
  baseScore,
  scoreBreakdown,
}) => {
  // Check target condition completion in real time for beginner feedback
  const target = task?.targetCondition || {};
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safePointers = pointers && typeof pointers === 'object' ? pointers : { headAddress: null, tailAddress: null, currentAddress: null, tempAddress: null, prevAddress: null };
  let targetExpectedCount = target.nodeCount ?? target.expectedNodesCount ?? target.expectedOrder?.length;
  let targetExpectedHead = target.headAddress !== undefined ? target.headAddress : target.expectedHead;
  let targetExpectedTail = target.tailAddress !== undefined ? target.tailAddress : target.expectedTail;

  if (task.id === 'L4_T1') {
    targetExpectedCount = 6;
    targetExpectedHead = insertPosition === 1 ? 1006 : 1001;
    targetExpectedTail = insertPosition === 6 ? 1006 : 1005;
  }

  const isCountOk = targetExpectedCount === undefined || safeNodes.length === targetExpectedCount;
  const isHeadOk = targetExpectedHead === undefined || safePointers.headAddress === targetExpectedHead;
  const isTailOk = targetExpectedTail === undefined || safePointers.tailAddress === targetExpectedTail;
  const activePos = task.id === 'L4_T1' ? insertPosition : deletePosition;
  const allSteps = getAllTaskSteps(task, safeNodes, safePointers, activePos);

  return (
    <div className="w-full flex flex-col gap-4 font-sans">
      {/* Task Objective Card */}
      <div className="bg-white dark:bg-[#0B1228] border border-slate-200 dark:border-blue-900/30 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2 pb-2.5 border-b border-slate-100 dark:border-blue-900/20">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-[#EFF6FF] dark:bg-blue-950 text-[#2563EB] dark:text-blue-300 font-mono text-[11px] font-bold">
              Task #{task.taskIndex}
            </span>
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
              +{baseScore || task.xpReward} XP
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenHowItWorks && (
              <button
                type="button"
                onClick={onOpenHowItWorks}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#EFF6FF] dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/30 text-[#2563EB] dark:text-blue-300 text-xs font-bold hover:bg-[#DBEAFE] transition-colors cursor-pointer"
                title="View visual step explanation"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Concept</span>
              </button>
            )}
          </div>
        </div>

        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1.5">
          {task.title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          {task.objective}
        </p>

        {/* Real-time Target Criteria Checklist */}
        <div className="mt-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-[#070B19] border border-slate-200 dark:border-blue-900/20">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Target Verification Checklist:
          </span>
          <div className="space-y-1 text-xs">
            {targetExpectedCount !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Total Nodes in List:</span>
                <span className={`font-mono font-bold flex items-center gap-1 ${isCountOk ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {isCountOk ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <span className="w-3 h-3 rounded-full border border-slate-400" />}
                  {safeNodes.length} / {targetExpectedCount}
                </span>
              </div>
            )}
            {targetExpectedHead !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">HEAD Pointer:</span>
                <span className={`font-mono font-bold flex items-center gap-1 ${isHeadOk ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {isHeadOk ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <span className="w-3 h-3 rounded-full border border-slate-400" />}
                  {safePointers.headAddress !== null ? safePointers.headAddress : 'NULL'} (Target: {targetExpectedHead !== null ? targetExpectedHead : 'NULL'})
                </span>
              </div>
            )}
            {targetExpectedTail !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">TAIL Pointer:</span>
                <span className={`font-mono font-bold flex items-center gap-1 ${isTailOk ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {isTailOk ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <span className="w-3 h-3 rounded-full border border-slate-400" />}
                  {safePointers.tailAddress !== null ? safePointers.tailAddress : 'NULL'} (Target: {targetExpectedTail !== null ? targetExpectedTail : 'NULL'})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Step-by-Step State Machine Progression */}
        <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#070B19] border border-slate-200 dark:border-blue-900/20 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Step-by-Step Task Progress:</span>
            </span>
            <span className="font-mono text-[10px] font-bold text-[#2563EB] dark:text-blue-400">
              {isCompleted ? 'ALL STEPS COMPLETED' : `STEP ${currentStep} OF ${allSteps.length}`}
            </span>
          </div>

          <div className="space-y-1.5">
            {allSteps.map((s) => {
              const isDone = completedSteps.includes(s.stepNumber) || isCompleted;
              const isCurrent = s.stepNumber === currentStep && !isCompleted;
              return (
                <div
                  key={s.stepNumber}
                  className={`p-2 rounded-xl border transition-all flex items-start gap-2 ${
                    isDone
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                      : isCurrent
                      ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/50 text-slate-950 dark:text-white shadow-xs'
                      : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-60'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : isCurrent ? (
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-[10px] animate-pulse">
                        {s.stepNumber}
                      </span>
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px]">
                        {s.stepNumber}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold leading-tight ${isCurrent ? 'text-amber-950 dark:text-amber-200' : ''}`}>
                      {s.title}
                    </p>
                    <p className="text-[11px] leading-tight opacity-80 mt-0.5">
                      {s.what}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* C Code Equivalent Box */}
        <div className="mt-3 p-3 rounded-2xl bg-slate-900 text-slate-200 font-mono text-[11px] border border-slate-800">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider">
            <Code2 className="w-3 h-3 text-blue-400" />
            <span>C / C++ Pointer Equivalent:</span>
          </div>
          <code className="text-emerald-400 leading-tight block whitespace-pre-wrap">
            {task.codeEquivalent}
          </code>
        </div>
      </div>

      {/* Selected Node Inspector (Stable container to prevent layout shift) */}
      <div className="bg-white dark:bg-[#0B1228] border border-slate-200 dark:border-blue-900/30 rounded-3xl p-4 shadow-xs min-h-[162px] flex flex-col justify-between">
        {selectedNode ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-[#2563EB] dark:text-blue-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span>SELECTED NODE INSPECTOR</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#EFF6FF] dark:bg-blue-950 text-[#2563EB] dark:text-blue-300">
                ADDR: {selectedNode.address}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#070B19] border border-slate-200 dark:border-blue-900/20">
                <span className="text-[9px] text-slate-400 block">DATA VALUE</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedNode.data}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#070B19] border border-slate-200 dark:border-blue-900/20">
                <span className="text-[9px] text-slate-400 block">NEXT POINTER</span>
                <span className="font-bold text-[#2563EB] dark:text-blue-400 text-sm">
                  {selectedNode.nextAddress !== null ? selectedNode.nextAddress : 'NULL'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onOpenChangeNext(selectedNode.address)}
                className="px-2.5 py-1.5 rounded-xl bg-[#EFF6FF] dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/30 text-[#2563EB] dark:text-blue-300 text-xs font-bold hover:bg-[#DBEAFE] flex items-center justify-center gap-1 cursor-pointer"
              >
                <LinkIcon className="w-3 h-3" />
                <span>Edit NEXT</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenDeleteNode(selectedNode.address)}
                className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete Node</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center my-auto py-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-blue-950/60 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2">
              <Layers className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">NODE INSPECTOR</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 max-w-[220px]">
              Select any node in RAM to inspect its memory address, value, and NEXT pointer.
            </p>
          </div>
        )}
      </div>

      {/* Traversal Step Guide & Output Stream (Level 3 / Mission 7) */}
      {(task.targetCondition.customValidator === 'L3_TRAVERSAL_COMPLETE' || task.id === 'L3_T1') && (
        <div className="p-4 rounded-3xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-500/30 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 font-mono font-bold text-xs text-cyan-800 dark:text-cyan-300">
              <Eye className="w-4 h-4" />
              <span>STEP-BY-STEP TRAVERSAL:</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-200/70 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200">
              {pointers.currentAddress === null && traversalOutput && traversalOutput.length > 0
                ? 'COMPLETED'
                : `STEP ${currentStep} OF 5`}
            </span>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-200 mb-3 font-medium">
            {pointers.currentAddress === null
              ? traversalOutput && traversalOutput.length > 0
                ? '✓ Traversal complete! All nodes were visited and streamed in order.'
                : 'Click the HEAD node (Node 10) directly in the RAM workspace to begin traversal.'
              : `CURRENT is at Node ${nodes.find((n) => n.address === pointers.currentAddress)?.data ?? pointers.currentAddress}. Follow its NEXT pointer and click the next node in the workspace.`}
          </p>

          {/* Live Output Stream */}
          {traversalOutput && traversalOutput.length > 0 && (
            <div className="mb-3 p-2.5 rounded-2xl bg-white dark:bg-[#0B1228] border border-cyan-200 dark:border-cyan-900/40">
              <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 block mb-1">
                OUTPUT STREAM:
              </span>
              <div className="flex items-center flex-wrap gap-1.5 font-mono text-xs font-bold text-cyan-700 dark:text-cyan-300">
                {traversalOutput.map((val, idx) => (
                  <React.Fragment key={idx}>
                    <span className="px-2 py-0.5 rounded-lg bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-800">
                      {val}
                    </span>
                    {idx < traversalOutput.length - 1 && <span className="text-slate-400">→</span>}
                  </React.Fragment>
                ))}
                {isCompleted && <span className="text-rose-500 font-mono">→ NULL</span>}
              </div>
            </div>
          )}

          {/* Option to select NULL if at last node */}
          {pointers.currentAddress !== null &&
            nodes.find((n) => n.address === pointers.currentAddress)?.nextAddress === null && (
              <button
                type="button"
                onClick={() => {
                  if (onTraversalNullClick) {
                    onTraversalNullClick();
                  } else if (onTraversalAnswer) {
                    onTraversalAnswer('NULL');
                  }
                }}
                className="w-full py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-mono font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5 animate-pulse cursor-pointer"
              >
                <span>Select NULL (Finish Traversal)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
        </div>
      )}

      {/* Search Step Q&A Prompt (Level 4 Task 4 / Mission 6) */}
      {searchStepPrompt && onSearchAnswer && (
        <div className="p-4 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 shadow-xs">
          <div className="flex items-center gap-2 mb-1.5 font-mono font-bold text-xs text-emerald-800 dark:text-emerald-300">
            <Search className="w-4 h-4" />
            <span>LINEAR SEARCH STEP:</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-200 mb-3">
            CURRENT Node contains <strong>DATA = {searchStepPrompt.currentData}</strong>. Does this node match target <strong>{searchStepPrompt.targetData}</strong>?
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSearchAnswer(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>YES (Match Found)</span>
            </button>
            <button
              onClick={() => onSearchAnswer(false)}
              className="px-4 py-2 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md"
            >
              <span>NO (Advance Next)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Completed Task Score Breakdown */}
      {isCompleted && scoreBreakdown && (
        <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200 shadow-xs">
          <div className="flex items-center gap-1.5 font-bold text-xs font-mono uppercase tracking-wider mb-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>TASK COMPLETED</span>
          </div>
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span>Base Score:</span>
              <span className="font-bold">{scoreBreakdown.baseScore} XP</span>
            </div>
            <div className={`flex items-center justify-between ${scoreBreakdown.hintUsed ? 'text-amber-700 dark:text-amber-300' : 'text-slate-600 dark:text-slate-400'}`}>
              <span>Hint Penalty:</span>
              <span className="font-bold">{scoreBreakdown.hintUsed ? '-2 XP' : '0 XP'}</span>
            </div>
            <div className={`flex items-center justify-between ${scoreBreakdown.guideUsed ? 'text-amber-700 dark:text-amber-300' : 'text-slate-600 dark:text-slate-400'}`}>
              <span>Guide & Solve Penalty:</span>
              <span className="font-bold">{scoreBreakdown.guideUsed ? '-3 XP' : '0 XP'}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-emerald-200 dark:border-emerald-700/50 text-emerald-900 dark:text-emerald-100 font-bold text-sm">
              <span>Final Score:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">+{scoreBreakdown.finalScore} XP</span>
            </div>
          </div>
        </div>
      )}

      {/* Validation Feedback Banner */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-3xl border ${
            feedback.type === 'success'
              ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
              : feedback.type === 'warning'
              ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-200'
              : 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/40 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm mb-1">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.title}</span>
          </div>
          <p className="text-xs leading-relaxed font-medium mb-1">{feedback.message}</p>
          {feedback.explanation && (
            <p className="text-[11px] opacity-85 italic">{feedback.explanation}</p>
          )}
        </motion.div>
      )}

      {/* Primary Action Button: CHECK ANSWER / NEXT TASK */}
      <div className="mt-1">
        {isCompleted ? (
          <button
            onClick={onNextTask}
            className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
          >
            <span>{hasNextTask ? 'Continue to Next Task' : 'Complete Level!'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            id="sll-check-answer-btn"
            onClick={onCheckAnswer}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>CHECK ANSWER</span>
          </button>
        )}
      </div>
    </div>
  );
};
