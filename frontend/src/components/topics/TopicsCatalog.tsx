import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { DSA_TOPICS } from '../../data/dsaTopics';
import { DSATopicCard } from './DSATopicCard';
import { TopicDetailModal } from './TopicDetailModal';
import { DSATopic } from '../../types';
import { getIntegratedModuleForTopic } from '../../utils/moduleRoutes';
import { navigateAlgoLearn } from '../../utils/navigation';

interface TopicsCatalogProps {
  onAskTeacher?: (topicTitle: string) => void;
}

export const TopicsCatalog: React.FC<TopicsCatalogProps> = ({ onAskTeacher }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTopic, setSelectedTopic] = useState<DSATopic | null>(null);

  const categories = ['All', 'Linear', 'Tree & Graph', 'Algorithms'];

  // Filter topics
  const filteredTopics = useMemo(() => {
    return DSA_TOPICS.filter((topic) => {
      const matchesSearch =
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.shortDescription
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        topic.algorithms.some((a) =>
          a.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === 'All' || topic.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="relative pt-24 pb-20 min-h-screen">
      {/* Light Mode Soft Ambient Blue/Indigo Glows */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-500/10 via-indigo-500/8 to-violet-500/5 blur-[140px] pointer-events-none -z-10 rounded-full" />

      <div className="absolute top-96 right-10 w-[400px] h-[400px] bg-indigo-500/5 dark:bg-blue-600/5 blur-[120px] pointer-events-none -z-10 rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left space-y-10">
        {/* Page Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/90 dark:bg-blue-950/80 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span>Curated DSA Modules</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Explore DSA Topics
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Learn, understand, and master essential Data Structures and Algorithms through interactive experiences.
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-blue-200/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(37,99,235,0.06),0_2px_6px_-1px_rgba(0,0,0,0.03)] dark:shadow-none flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, concept, invariant..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-50/80 dark:bg-slate-950 border border-blue-100 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all"
              id="topics-search-input"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600'
                  }`}
                id={`filter-category-${cat
                  .toLowerCase()
                  .replace(/\s+/g, '-')}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* TOPIC CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredTopics.map((topic, index) => (
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

        {/* Topic Detail Modal */}
        <TopicDetailModal
          topic={selectedTopic}
          onClose={() => setSelectedTopic(null)}
          onAskTeacher={onAskTeacher}
        />

        {/* Empty State */}
        {filteredTopics.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-blue-200/80 dark:border-slate-800 shadow-md">
            <Search className="w-8 h-8 text-slate-400 mx-auto mb-3" />

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No matching DSA topics found
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search query or reset category filters.
            </p>

            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};