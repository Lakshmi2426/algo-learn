import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  Crown,
  Flame,
  Zap,
  ShieldCheck,
  Search,
  Users,
  Award,
  Sparkles,
} from 'lucide-react';
import { LEADERBOARD_USERS } from '../../data/leaderboardData';
import { LeaderboardUser } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import { useUser, isRealStudent } from '../../context/UserContext';
import { getAllTopicsProgress } from '../../utils/topicProgress';
import { buildAuthoritativeLeaderboard, getTierFromXP } from '../../utils/leaderboardHelper';
import { apiUrl } from '../../config/api';

export const LeaderboardView: React.FC = () => {
  const { studentsList, user: currentUser, isAuthenticated, role } = useUser();
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'allTime'>('weekly');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([]);
  const [topicSummary, setTopicSummary] = useState(() => getAllTopicsProgress());

  const fetchLeaderboard = React.useCallback(() => {
    fetch(apiUrl('/api/leaderboard'))
      .then((res) => {
        if (!res.ok) throw new Error('API not available');
        return res.json();
      })
      .then((data) => {
        if (data?.leaderboard && Array.isArray(data.leaderboard)) {
          const clean = data.leaderboard.filter(isRealStudent);
          setLeaderboardUsers(clean);
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    const handleProgress = (e: Event) => {
      if (e instanceof StorageEvent && e.key) {
        if (!e.key.startsWith('algolearn_topic') && !e.key.startsWith('algolearn_topics')) return;
      }
      setTopicSummary(getAllTopicsProgress());
      fetchLeaderboard();
    };
    window.addEventListener('algolearn_topic_progress_updated', handleProgress);
    window.addEventListener('storage', handleProgress);
    return () => {
      window.removeEventListener('algolearn_topic_progress_updated', handleProgress);
      window.removeEventListener('storage', handleProgress);
    };
  }, [fetchLeaderboard]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard, isAuthenticated, role, currentUser?.regdNo, currentUser?.id]);

  const tiers = ['All', 'Diamond', 'Platinum', 'Gold'];

  const effectiveLeaderboard = useMemo(() => {
    return buildAuthoritativeLeaderboard({
      serverLeaderboard: leaderboardUsers,
      studentsList,
      currentUser,
      isAuthenticated,
      role,
    });
  }, [leaderboardUsers, studentsList, currentUser, isAuthenticated, role, topicSummary]);

  const filteredUsers = useMemo(() => {
    return effectiveLeaderboard.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.regdNo && user.regdNo.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTier = selectedTier === 'All' || user.tier === selectedTier;
      return matchesSearch && matchesTier;
    });
  }, [effectiveLeaderboard, searchQuery, selectedTier]);

  const topThree = effectiveLeaderboard.slice(0, 3);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Diamond':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
      case 'Platinum':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
      case 'Gold':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-slate-500 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div className="relative pt-28 pb-20 min-h-screen">
      {/* Light Mode Soft Ambient Glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-r from-blue-500/8 via-indigo-500/6 to-violet-500/4 blur-[130px] pointer-events-none -z-10 rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/90 dark:bg-blue-950/80 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-400 text-xs font-mono font-bold uppercase tracking-wider mb-2 shadow-2xs">
            <Trophy className="w-4 h-4" />
            Global Learner Rankings
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Leaderboard
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
            Measure your study consistency, mastery of data structures, and daily practice streaks against learners worldwide.
          </p>
        </div>

        {/* Top 3 Podium Cards */}
        {topThree.some(Boolean) && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
            {[topThree[1], topThree[0], topThree[2]].map((user, idx) => {
              if (!user) return null;
              const isFirst = user.rank === 1;
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  whileHover={{ y: isFirst ? -8 : -4, scale: 1.01 }}
                  className={`relative rounded-3xl p-6 bg-white dark:bg-slate-900 border transition-all duration-300 shadow-[0_4px_20px_-2px_rgba(37,99,235,0.08),0_2px_8px_-1px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_32px_-4px_rgba(37,99,235,0.16),0_6px_14px_-2px_rgba(99,102,241,0.08)] dark:shadow-none ${isFirst
                    ? 'border-blue-400/90 dark:border-blue-500/50 md:-translate-y-4 ring-2 ring-blue-500/20'
                    : 'border-blue-200/80 hover:border-blue-300 dark:border-slate-800'
                    } flex flex-col items-center text-center`}
                >
                  {isFirst && (
                    <div className="absolute -top-5 w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                      <Crown className="w-5 h-5 fill-current" />
                    </div>
                  )}

                  <div className="relative mt-2 mb-4">
                    <UserAvatar
                      src={user.avatar}
                      name={user.name}
                      size="2xl"
                      className="shadow-md"
                    />
                    <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg bg-slate-900 text-white border border-slate-700 flex items-center justify-center font-mono font-bold text-xs shadow-sm">
                      #{user.rank}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {user.name}
                    </span>
                    <span>{user.countryCode}</span>
                  </div>
                  {user.regdNo && (
                    <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Regd No: {user.regdNo}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    @{user.username}
                  </span>

                  <div className={`mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border ${getTierColor(user.tier)} shadow-2xs`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{user.tier}</span>
                  </div>

                  <div className="w-full mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around text-xs font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] block">XP</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {user.xp.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">MASTERED</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {user.solvedCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">STARTED</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{user.topicsStarted || 0}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Compact Rankings Section: Controls & Table Grouped in max-w-5xl */}
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Controls & Filter Bar */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-blue-200/85 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(37,99,235,0.06),0_2px_6px_-1px_rgba(0,0,0,0.03)] dark:shadow-none flex flex-wrap items-center justify-between gap-4">
            {/* Timeframe Pills */}
            <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-transparent">
              {(['weekly', 'monthly', 'allTime'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${timeframe === tf
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
                    }`}
                >
                  {tf === 'allTime' ? 'All-Time' : tf}
                </button>
              ))}
            </div>

            {/* Tier Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {tiers.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTier(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${selectedTier === t
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-white'
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scholar or country..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50/80 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Full Rankings Table Card with tight, balanced column spacing */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-blue-200/85 dark:border-slate-800 shadow-[0_8px_30px_-4px_rgba(37,99,235,0.08),0_4px_12px_-2px_rgba(99,102,241,0.04)] dark:shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-16 sm:w-20 text-center">Rank</th>
                    <th className="py-3.5 px-4 min-w-[200px]">Scholar</th>
                    <th className="py-3.5 px-4 w-32 sm:w-36 text-center">Division Tier</th>
                    <th className="py-3.5 px-4 w-28 sm:w-32 text-center">Topics Started</th>
                    <th className="py-3.5 px-4 w-28 sm:w-32 text-center">Topics Mastered</th>
                    <th className="py-3.5 px-4 w-28 sm:w-32 text-right pr-6">Total XP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400 font-mono text-xs">
                        No students on the leaderboard yet. Sign in and start learning to appear here.
                      </td>
                    </tr>
                  )}
                  {filteredUsers.map((user) => {
                    const isCurrent = user.isCurrentUser;
                    return (
                      <tr
                        key={user.regdNo ? user.regdNo.toUpperCase() : user.id}
                        className={`transition-colors ${isCurrent
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 font-semibold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                      >
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-500 dark:text-slate-400">
                          #{user.rank}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              src={user.avatar}
                              name={user.name}
                              size="sm"
                              className="!w-8 !h-8 shrink-0"
                            />
                            <div>
                              <div className="flex items-center">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {user.name}
                                </span>
                                <span className="text-xs text-slate-400 font-mono ml-2">
                                  @{user.username} {user.countryCode}
                                </span>
                              </div>
                              {user.regdNo && (
                                <div className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                  Regd No: {user.regdNo}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${getTierColor(
                              user.tier
                            )}`}
                          >
                            {user.tier}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                          {user.topicsStarted || 0}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                          {user.solvedCount}
                        </td>
                        <td className="py-3.5 px-4 text-right pr-6 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {user.xp.toLocaleString()} XP
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
