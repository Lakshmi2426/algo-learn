import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Circle, Target, Award } from 'lucide-react';

export interface MissionItem {
  id: string;
  name: string;
  description: string;
}

export const LEVEL_5_MISSIONS: MissionItem[] = [
  { id: 'L5_M1', name: 'Create a 3-node list', description: 'Build 10 → 20 → 30' },
  { id: 'L5_M2', name: 'Insert in middle', description: 'Insert 15 between 10 and 20' },
  { id: 'L5_M3', name: 'Delete a node', description: 'Delete Node 30 from the list' },
  { id: 'L5_M4', name: 'Insert at beginning', description: 'Insert 5 before HEAD' },
  { id: 'L5_M5', name: 'Insert at end', description: 'Add 40 to the end as new TAIL' },
  { id: 'L5_M6', name: 'Search', description: 'Find target value 15' },
  { id: 'L5_M7', name: 'Traverse', description: 'Step through and print all nodes' },
];

interface SLLMissionBoardProps {
  currentTaskId: string;
  completedTaskIds: string[];
  onSelectMission?: (taskId: string) => void;
}

export const SLLMissionBoard: React.FC<SLLMissionBoardProps> = ({
  currentTaskId,
  completedTaskIds,
  onSelectMission,
}) => {
  return (
    <div className="w-full bg-white dark:bg-[#0B1228] border border-blue-200 dark:border-blue-900/40 rounded-3xl p-4 sm:p-5 shadow-xs font-sans">
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-blue-900/20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>MASTER MISSION BOARD</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#EFF6FF] dark:bg-blue-950 text-[#2563EB] dark:text-blue-300 font-mono">
                {LEVEL_5_MISSIONS.filter((m) => completedTaskIds.includes(m.id)).length} / {LEVEL_5_MISSIONS.length} Complete
              </span>
            </h4>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {LEVEL_5_MISSIONS.map((mission, idx) => {
          const isDone = completedTaskIds.includes(mission.id);
          const isCurrent = currentTaskId === mission.id;

          return (
            <div
              key={mission.id}
              onClick={() => onSelectMission && onSelectMission(mission.id)}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs cursor-pointer ${
                isCurrent
                  ? 'border-[#2563EB] bg-[#EFF6FF]/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20 shadow-xs'
                  : isDone
                  ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 text-slate-700 dark:text-slate-300'
                  : 'border-slate-200 dark:border-blue-900/20 bg-slate-50/50 dark:bg-[#070B19]/50 text-slate-500 dark:text-slate-400 opacity-80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : isCurrent ? (
                  <Target className="w-4 h-4 text-[#2563EB] animate-pulse shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                )}
                <div>
                  <span className={`font-bold block ${isCurrent ? 'text-[#1E40AF] dark:text-blue-200' : isDone ? 'text-slate-800 dark:text-slate-200' : ''}`}>
                    {mission.name}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {mission.description}
                  </span>
                </div>
              </div>

              {isCurrent && (
                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#2563EB] text-white shadow-2xs">
                  Active
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
