import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { DSA_TOPICS } from '../../data/dsaTopics';
import { NavigationTab, DSATopic } from '../../types';
import { getIntegratedModuleForTopic } from '../../utils/moduleRoutes';
import { navigateAlgoLearn } from '../../utils/navigation';
import { DSATopicCard } from '../topics/DSATopicCard';
import { TopicDetailModal } from '../topics/TopicDetailModal';

interface FeaturedTopicsSectionProps {
  setActiveTab: (tab: NavigationTab) => void;
}

export const FeaturedTopicsSection: React.FC<FeaturedTopicsSectionProps> = ({
  setActiveTab,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<DSATopic | null>(null);

  // Home page preview: exactly 4 featured topic cards
  const featuredTopics = DSA_TOPICS.filter((t) => t.featuredOnHome).slice(0, 4);

  return (
    <section className="relative py-16 bg-transparent" id="explore-topics-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 text-left gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50/90 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border border-blue-200/90 dark:border-blue-800/80 text-xs font-mono font-semibold uppercase tracking-wider mb-2 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Core Curriculum</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Explore by Topic &amp; Algorithm
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Master essential Data Structures and Algorithms with structured learning paths, operational breakdowns, and hands-on challenges.
            </p>
          </div>

          {/* View All Topics Catalog Button */}
          <button
            onClick={() => {
              setActiveTab('topics');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white font-semibold text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 hover:-translate-y-0.5 self-start md:self-auto group cursor-pointer"
            id="view-all-topics-top-btn"
          >
            <span>Explore All Topics</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* RESPONSIVE FIXED GRID OF FEATURED TOPIC CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredTopics.map((topic, index) => (
            <DSATopicCard
              key={topic.id}
              topic={topic}
              index={index}
              onSelect={(t) => {
                const mod = getIntegratedModuleForTopic(t.id) || getIntegratedModuleForTopic(t.title);
                if (mod) {
                  navigateAlgoLearn('topics', mod.moduleId);
                  return;
                }
                setSelectedTopic(t);
              }}
            />
          ))}
        </div>
      </div>

      {/* Topic Detail Modal */}
      <TopicDetailModal
        topic={selectedTopic}
        onClose={() => setSelectedTopic(null)}
        onAskTeacher={() => {
          setActiveTab('ask-teacher');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </section>
  );
};
