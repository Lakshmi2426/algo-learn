import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CheckCircle2,
  Clock,
  HardDrive,
  Sparkles,
  ArrowRight,
  BookOpen,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { DSATopic } from '../../types';
import { getIntegratedModuleForTopic } from '../../utils/moduleRoutes';
import { navigateAlgoLearn } from '../../utils/navigation';
import { getTopicIconComponent } from './DSATopicCard';
import { useUser } from '../../context/UserContext';

interface TopicDetailModalProps {
  topic: DSATopic | null;
  onClose: () => void;
  onAskTeacher?: (topicTitle: string) => void;
}

export const TopicDetailModal: React.FC<TopicDetailModalProps> = ({
  topic,
  onClose,
  onAskTeacher,
}) => {
  const { isAuthenticated, setShowAuthModal, setAuthModalMode } = useUser();
  const [activeSubtopicIndex, setActiveSubtopicIndex] = useState(0);

  if (!topic) return null;

  const TopicIcon = getTopicIconComponent(topic.iconName);
  const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;
  const currentSubtopic = hasSubtopics ? topic.subtopics![activeSubtopicIndex] : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-[#0B1224] rounded-3xl border border-blue-200/90 dark:border-[#243554] shadow-2xl overflow-hidden flex flex-col z-10 text-left"
          id={`topic-detail-modal-${topic.id}`}
        >
          {/* Header */}
          <div className="p-6 sm:p-7 border-b border-slate-100 dark:border-[#1E2E4A] bg-slate-50/60 dark:bg-[#0F172A]/80 flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1D4ED8] via-[#2563EB] to-[#6366F1] flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20">
                <TopicIcon style={{ width: '24px', height: '24px', strokeWidth: 2.2 }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#2563EB] dark:text-blue-400">
                    {topic.category}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                    {topic.difficulty}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827] dark:text-white tracking-tight">
                  {topic.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#A8B7D1] mt-1 max-w-xl">
                  {topic.shortDescription}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subtopic Tabs (if combined card like Sorting or Hashing & Collision Resolution) */}
          {hasSubtopics && (
            <div className="px-6 pt-4 bg-white dark:bg-[#0B1224] border-b border-slate-100 dark:border-[#1E2E4A] flex items-center gap-2 overflow-x-auto no-scrollbar">
              {topic.subtopics!.map((sub, idx) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubtopicIndex(idx)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    activeSubtopicIndex === idx
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  {sub.title}
                </button>
              ))}
            </div>
          )}

          {/* Content Body */}
          <div className="p-6 sm:p-7 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-slate-300">
            {/* Overview / Full Description */}
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                {currentSubtopic ? `${currentSubtopic.title} Overview` : 'Conceptual Overview'}
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {currentSubtopic?.fullDescription || currentSubtopic?.shortDescription || topic.fullDescription}
              </p>
            </div>

            {/* Key Operations & Complexities */}
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                Complexity & Key Operations
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(currentSubtopic?.keyOperations || topic.keyOperations).map((op, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#131D33] border border-slate-200/70 dark:border-[#1E2E4A] flex items-center justify-between"
                  >
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {op.name}
                    </span>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold">
                        <Clock className="w-3 h-3" />
                        {op.time}
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                        <HardDrive className="w-3 h-3" />
                        {op.space}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Covered Concepts */}
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                Included Concepts & Techniques
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(currentSubtopic?.concepts || topic.algorithms).map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50/60 dark:bg-[#131D33]/60 border border-slate-200/50 dark:border-[#1E2E4A]/60"
                  >
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {c}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-[#1E2E4A] bg-slate-50/60 dark:bg-[#0F172A]/80 flex flex-wrap items-center justify-between gap-3">
            {onAskTeacher && (
              <button
                onClick={() => {
                  onClose();
                  onAskTeacher(topic.title);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200/80 dark:border-blue-800/60 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
                Ask a Teacher about this
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              {(() => {
                const mod = getIntegratedModuleForTopic(topic.id) || getIntegratedModuleForTopic(topic.title);
                if (!mod) return null;
                return (
                  <button
                    onClick={() => {
                      onClose();
                      if (!isAuthenticated) {
                        sessionStorage.setItem('algolearn_pending_topic_module', mod.moduleId);
                        setAuthModalMode('login');
                        setShowAuthModal(true);
                        return;
                      }
                      navigateAlgoLearn('topics', mod.moduleId);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white transition-all cursor-pointer shadow-sm shadow-blue-600/20"
                  >
                    <span>Open Module</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                );
              })()}

              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
