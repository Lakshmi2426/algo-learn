import React from 'react';
import { motion } from 'motion/react';
import { PlusCircle, Trash2, Waypoints, Crown, Play } from 'lucide-react';
import { SLLTopicId, SLL_TOPICS } from '../../data/sllTopics';
import { soundManager } from '../../utils/audio';

interface SLLTopicSelectMenuProps {
  onSelectTopic: (topicId: SLLTopicId) => void;
  completedTasks: string[];
  totalScore: number;
}

export const SLLTopicSelectMenu: React.FC<SLLTopicSelectMenuProps> = ({
  onSelectTopic,
  completedTasks,
  totalScore,
}) => {
  const topicsList: SLLTopicId[] = ['insertion', 'deletion', 'traversal'];

  const getTopicIcon = (topicId: SLLTopicId) => {
    switch (topicId) {
      case 'insertion':
        return <PlusCircle className="w-7 h-7 text-[#2563EB] dark:text-blue-400" />;
      case 'deletion':
        return <Trash2 className="w-7 h-7 text-[#2563EB] dark:text-blue-400" />;
      case 'traversal':
        return <Waypoints className="w-7 h-7 text-[#2563EB] dark:text-blue-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full font-sans">
      {/* 1. HEADER SECTION: CLEAN TOPIC SELECTION TITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Choose a Topic to Play
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Select an operation to practice node allocations, pointer manipulation, and traversal.
          </p>
        </div>

        {/* Global XP & Completed Counter (subtle blue theme) */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#EFF6FF] dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/40 text-xs font-mono font-bold text-[#2563EB] dark:text-blue-400">
            {totalScore} XP
          </div>
        </div>
      </div>

      {/* 2. THE THREE MAIN TOPIC CARDS: INSERTION | DELETION | TRAVERSAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topicsList.map((topicId) => {
          const topic = SLL_TOPICS[topicId];
          const completedCount = topic.tasks.filter((t) => completedTasks.includes(t.id)).length;

          return (
            <motion.div
              key={topic.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="group flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0B1228] border border-blue-200/90 dark:border-blue-900/40 hover:border-[#2563EB] dark:hover:border-blue-500 shadow-xs hover:shadow-lg hover:shadow-blue-600/10 transition-all duration-200"
            >
              <div className="flex flex-col items-start gap-4">
                {/* Blue Icon in Rounded Container */}
                <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-900/40 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
                  {getTopicIcon(topic.id)}
                </div>

                {/* Master Level Badge with Vector Crown Icon & Level Reward Badge */}
                <div className="flex items-center justify-between w-full">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/40">
                    <Crown className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" />
                    <span>Master Level</span>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 shadow-xs">
                    {topic.id === 'traversal' ? '+10 pts' : '+25 pts'}
                  </span>
                </div>

                {/* Topic Title */}
                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
                    {topic.title}
                  </h3>

                  {/* Short Description */}
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {topic.description}
                  </p>
                </div>
              </div>

              {/* Card Footer: Play Button */}
              <div className="mt-6 pt-4 border-t border-blue-100/70 dark:border-blue-900/30 flex flex-col gap-2.5">
                {completedCount > 0 && (
                  <div className="flex items-center justify-between text-xs font-mono text-[#2563EB] dark:text-blue-400 font-semibold px-0.5">
                    <span>Progress</span>
                    <span>
                      {completedCount} / {topic.tasks.length} Completed
                    </span>
                  </div>
                )}

                <button
                  id={`play-topic-${topic.id}`}
                  onClick={() => {
                    soundManager.play('click');
                    onSelectTopic(topic.id);
                  }}
                  className="w-full py-3 px-5 rounded-xl font-bold text-sm bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm hover:shadow-md hover:shadow-blue-600/25"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
