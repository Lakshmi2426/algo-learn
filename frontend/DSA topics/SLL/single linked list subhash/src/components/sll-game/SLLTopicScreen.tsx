import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  PlusCircle,
  Trash2,
  Waypoints,
  Crown,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { SLLTopicId, SLL_TOPICS } from '../../data/sllTopics';
import { soundManager } from '../../utils/audio';
import { progressManager } from '../../utils/progressManager';

interface SLLTopicScreenProps {
  topicId: SLLTopicId;
  onBackToTopics: () => void;
  onSelectTask: (taskId: string) => void;
  completedTasks: string[];
}

export const SLLTopicScreen: React.FC<SLLTopicScreenProps> = ({
  topicId,
  onBackToTopics,
  onSelectTask,
  completedTasks,
}) => {
  const topic = SLL_TOPICS[topicId];

  const getTopicIcon = () => {
    switch (topicId) {
      case 'insertion':
        return <PlusCircle className="w-6 h-6 text-[#2563EB] dark:text-blue-400" />;
      case 'deletion':
        return <Trash2 className="w-6 h-6 text-[#2563EB] dark:text-blue-400" />;
      case 'traversal':
        return <Waypoints className="w-6 h-6 text-[#2563EB] dark:text-blue-400" />;
    }
  };

  const completedCount = topic.tasks.filter((t) => completedTasks.includes(t.id)).length;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full font-sans">
      {/* 1. TOP NAVIGATION: BACK BUTTON & TOPIC BANNER */}
      <div className="flex flex-col gap-4">
        {/* Back Button */}
        <div>
          <button
            type="button"
            id="btn-back-to-topics"
            onClick={() => {
              soundManager.play('click');
              onBackToTopics();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#0B1228] border border-blue-200/90 dark:border-blue-900/40 text-slate-700 dark:text-slate-200 hover:text-[#2563EB] dark:hover:text-blue-400 hover:border-[#2563EB] text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Topics</span>
          </button>
        </div>

        {/* Topic Header Card */}
        <div className="bg-white dark:bg-[#0B1228] border border-blue-200/90 dark:border-blue-900/40 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-900/40 flex items-center justify-center shrink-0 shadow-xs">
              {getTopicIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EFF6FF] dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/40">
                  <Crown className="w-3 h-3 text-[#2563EB] dark:text-blue-400" />
                  <span>Master Level</span>
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                  {topicId === 'traversal' ? '+10 pts' : '+25 pts'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                  {completedCount} / {topic.tasks.length} Done
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
                {topic.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed font-medium">
                {topic.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TASKS SECTION */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
            Hands-on Tasks
          </h3>
          <span className="text-xs font-mono font-semibold text-[#2563EB] dark:text-blue-400">
            {topic.tasks.length} Task{topic.tasks.length !== 1 ? 's' : ''} Available
          </span>
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {topic.tasks.map((task) => {
            const taskState = progressManager.getGameTaskState(task.id);
            const isDone = taskState.completed || completedTasks.includes(task.id) || progressManager.isCompleted(task.id);
            const earnedFinalScore = taskState.completed ? taskState.finalScore : task.xpReward;

            return (
              <motion.div
                key={task.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                className="group flex flex-col justify-between p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0B1228] border border-blue-200/90 dark:border-blue-900/40 hover:border-[#2563EB] dark:hover:border-blue-500 shadow-xs hover:shadow-lg hover:shadow-blue-600/10 transition-all duration-200"
              >
                <div>
                  {/* Task Header: Icon, Number, & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-900/40 text-[#2563EB] dark:text-blue-400 flex items-center justify-center shadow-xs">
                        {getTopicIcon()}
                      </div>
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Task #{task.taskNumber}
                      </span>
                    </div>

                    {/* Completion or XP Pill */}
                    {isDone ? (
                      <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>+{earnedFinalScore} XP</span>
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-bold text-[#2563EB] dark:text-blue-300 bg-[#EFF6FF] dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200/70 dark:border-blue-900/40">
                        +{task.xpReward} XP
                      </span>
                    )}
                  </div>

                  {/* Task Title & Objective */}
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 leading-snug">
                    {task.taskNumber}. {task.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {task.description}
                  </p>
                </div>

                {/* Play Button */}
                <button
                  id={`play-task-${task.id}`}
                  onClick={() => {
                    soundManager.play('click');
                    onSelectTask(task.id);
                  }}
                  className="w-full mt-5 py-2.5 px-4 rounded-xl font-bold text-xs bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm hover:shadow-md hover:shadow-blue-600/20"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isDone ? 'Replay Task' : 'Play Task'}</span>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
