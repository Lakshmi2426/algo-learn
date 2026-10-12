import React from 'react';
import { motion } from 'motion/react';
import {
  Boxes,
  LayoutGrid,
  Search,
  Split,
  SlidersHorizontal,
  ArrowDownToLine,
  ArrowRightLeft,
  Target,
  Layers,
  Link2,
  UnfoldHorizontal,
  CircleDot,
  MoveRight,
  RotateCw,
  ListOrdered,
  Radio,
  FolderTree,
  Binary,
  Hash,
  Shuffle,
  GitMerge,
  ChevronsLeftRight,
  Network,
  CornerDownRight,
  BarChart3,
  FileText,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { DSATopic } from '../../types';
import { getIntegratedModuleForTopic } from '../../utils/moduleRoutes';
import { getTopicScore, normalizeToModuleId } from '../../utils/topicProgress';
import { navigateAlgoLearn } from '../../utils/navigation';

import { useUser } from '../../context/UserContext';

interface DSATopicCardProps {
  topic: DSATopic;
  index?: number;
  onSelect: (topic: DSATopic) => void;
}

// Topic Icon Resolver
export const getTopicIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Boxes':
    case 'LayoutGrid':
      return Boxes;
    case 'Search':
      return Search;
    case 'Split':
    case 'SlidersHorizontal':
      return Split;
    case 'ArrowDownToLine':
    case 'ArrowUpDown':
      return ArrowDownToLine;
    case 'ArrowRightLeft':
      return ArrowRightLeft;
    case 'Target':
    case 'CheckCircle':
      return Target;
    case 'Layers':
      return Layers;
    case 'Link2':
    case 'Link':
      return Link2;
    case 'UnfoldHorizontal':
    case 'ArrowLeftRight':
      return UnfoldHorizontal;
    case 'CircleDot':
    case 'RotateCcw':
      return CircleDot;
    case 'MoveRight':
    case 'ArrowRight':
      return MoveRight;
    case 'RotateCw':
    case 'RefreshCw':
      return RotateCw;
    case 'ListOrdered':
      return ListOrdered;
    case 'Radio':
    case 'Share2':
    case 'Maximize2':
      return Radio;
    case 'FolderTree':
      return FolderTree;
    case 'Binary':
    case 'GitFork':
      return Binary;
    case 'Hash':
      return Hash;
    case 'Shuffle':
    case 'ShieldAlert':
      return Shuffle;
    case 'GitMerge':
      return GitMerge;
    case 'ChevronsLeftRight':
      return ChevronsLeftRight;
    case 'Network':
      return Network;
    case 'CornerDownRight':
      return CornerDownRight;
    case 'BarChart3':
      return BarChart3;
    default:
      return Boxes;
  }
};

// Map raw category values to human-readable display labels
const getCategoryLabel = (category: string): string => {
  switch (category) {
    case 'Linear':
      return 'DATA STRUCTURES';
    case 'Tree & Graph':
      return 'TREES & GRAPHS';
    case 'Algorithms':
      return 'ALGORITHMS';
    case 'Advanced':
      return 'ADVANCED';
    default:
      return category.toUpperCase();
  }
};

export const DSATopicCard: React.FC<DSATopicCardProps> = ({
  topic,
  index = 0,
  onSelect,
}) => {
  const { user, isAuthenticated, setShowAuthModal, setAuthModalMode } = useUser();
  const TopicIcon = getTopicIconComponent(topic.iconName);

  // Use algorithms[] for CONCEPTS COVERED — show up to 4
  const concepts = topic.algorithms.slice(0, 4);

  const [liveScore, setLiveScore] = React.useState<number>(() => (isAuthenticated ? getTopicScore(topic.id) : 0));

  React.useEffect(() => {
    setLiveScore(isAuthenticated ? getTopicScore(topic.id) : 0);

    const handleUpdate = (e: Event) => {
      if (!isAuthenticated) {
        setLiveScore(0);
        return;
      }
      const targetMod = normalizeToModuleId(topic.id);
      if (e instanceof CustomEvent) {
        if (!e.detail || !e.detail.moduleId || e.detail.moduleId === targetMod) {
          setLiveScore(getTopicScore(topic.id));
        }
      } else if (e instanceof StorageEvent) {
        if (!e.key || (targetMod && e.key.includes(targetMod)) || e.key.includes('algolearn_topics_progress')) {
          setLiveScore(getTopicScore(topic.id));
        }
      }
    };

    window.addEventListener('algolearn_topic_progress_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('algolearn_topic_progress_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [topic.id, isAuthenticated]);

  // Derive real progress from user context or inner module storage
  const userTopic = user.exploredTopics?.find(
    (t) => t.id === topic.id || t.title.toLowerCase() === topic.title.toLowerCase()
  );
  const currentFallback = isAuthenticated ? getTopicScore(topic.id) : 0;
  const progressPercent = isAuthenticated
    ? Math.max(userTopic?.progress || 0, liveScore, currentFallback)
    : 0;

  // Mastered concept count derived from real progress %
  const masteredConcepts = Math.round((progressPercent / 100) * topic.conceptsCount);

  // Circular progress ring geometry (radius 16)
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const categoryLabel = getCategoryLabel(topic.category);
  const integratedModule = getIntegratedModuleForTopic(topic.id) || getIntegratedModuleForTopic(topic.title);

  const handleCardClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (integratedModule) {
      if (!isAuthenticated) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('algolearn_pending_module', integratedModule.moduleId);
        }
        setAuthModalMode('login');
        setShowAuthModal(true);
        return;
      }
      navigateAlgoLearn('topics', integratedModule.moduleId);
      return;
    }
    if (!isAuthenticated) {
      setAuthModalMode('login');
      setShowAuthModal(true);
      return;
    }
    onSelect(topic);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.02 }}
      whileHover={{ y: -3 }}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick(e);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={
        integratedModule
          ? `Explore ${topic.title} module`
          : `View ${topic.title} details`
      }
      className="group relative rounded-2xl p-[1px] bg-gradient-to-b from-[#D8E2F5] to-[#C4D0E8] hover:from-blue-500 hover:to-indigo-500 dark:from-[#243554]/80 dark:to-[#1a2640]/60 dark:hover:from-blue-500/70 dark:hover:to-indigo-500/70 transition-all duration-200 select-none cursor-pointer text-left h-full focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      id={`topic-card-${topic.id}`}
    >
      <div className="bg-white dark:bg-[#0B1224] rounded-[15px] p-5 h-full flex flex-col relative overflow-hidden transition-colors duration-200">

        {/* TOP: CATEGORY + CONCEPT COUNT */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#2563EB] dark:text-blue-400">
            {categoryLabel}
          </span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EFF6FF] dark:bg-[#162238] border border-[#D8E2F5] dark:border-[#243554] text-[#111827] dark:text-[#A8B7D1] text-[10px] font-semibold">
            <FileText className="w-3 h-3 text-[#2563EB] dark:text-blue-400 shrink-0" />
            <span>{topic.conceptsCount} Concepts</span>
          </div>
        </div>

        {/* ICON + TOPIC TITLE */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1D4ED8] via-[#2563EB] to-[#6366F1] flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-sm shadow-blue-500/20">
            <TopicIcon style={{ width: '18px', height: '18px', strokeWidth: 2.2 }} />
          </div>
          <h3 className="text-sm sm:text-[15px] font-bold text-[#111827] dark:text-[#F8FAFC] leading-tight line-clamp-2 group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">
            {topic.title}
          </h3>
        </div>

        {/* DESCRIPTION */}
        <p className="text-[12px] text-[#64748B] dark:text-[#A8B7D1] leading-relaxed line-clamp-2 mb-3">
          {topic.shortDescription}
        </p>

        {/* CONCEPTS COVERED */}
        <div className="flex-1 mb-3">
          <div className="text-[9px] font-mono font-bold tracking-widest text-[#64748B] dark:text-[#8FA1BA] uppercase mb-1.5">
            Concepts Covered
          </div>
          <ul className="space-y-1">
            {concepts.map((concept, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-[#2563EB] dark:text-blue-400 shrink-0 mt-[1px]" />
                <span className="text-[11px] text-[#111827] dark:text-[#A8B7D1] leading-tight line-clamp-1">
                  {concept}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* BOTTOM: PROGRESS + ARROW */}
        <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#243554] flex items-center justify-between mt-auto">

          {/* Circular Progress + Mastery Label */}
          <div className="flex items-center gap-2">
            <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
              <svg className="w-9 h-9 -rotate-90" viewBox="0 0 40 40">
                <circle
                  cx="20"
                  cy="20"
                  r={radius}
                  className="stroke-current text-slate-200 dark:text-[#1E2E4A]"
                  strokeWidth="3"
                  fill="none"
                />
                <circle
                  cx="20"
                  cy="20"
                  r={radius}
                  className="stroke-current transition-all duration-700 ease-out"
                  stroke={`url(#pg-${topic.id})`}
                  strokeWidth="3"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                />
                <defs>
                  <linearGradient id={`pg-${topic.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1D4ED8" />
                    <stop offset="75%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute text-[9px] font-mono font-bold text-[#111827] dark:text-[#F8FAFC]">
                {progressPercent}%
              </span>
            </div>

            <div>
              <div className="text-[11px] font-bold text-[#111827] dark:text-[#F8FAFC] leading-none">
                Mastered
              </div>
            </div>
          </div>

          {/* Arrow Action Button */}
          <div
            className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#6366F1] hover:from-[#1E40AF] hover:to-[#2563EB] text-white flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-sm shadow-blue-600/20"
            id={`open-topic-btn-${topic.id}`}
          >
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
