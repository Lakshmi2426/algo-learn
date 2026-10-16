import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  Crown,
  Search,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react';
import { LEADERBOARD_USERS } from '../../data/leaderboardData';
import { LeaderboardUser } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import { DivisionTierBadge } from '../common/DivisionTierBadge';
import { useUser, isRealStudent } from '../../context/UserContext';
import { getAllTopicsProgress } from '../../utils/topicProgress';
import { buildAuthoritativeLeaderboard, getTierFromXP } from '../../utils/leaderboardHelper';
import { apiUrl } from '../../config/api';

export const LeaderboardView: React.FC = () => {
  const { studentsList, user: currentUser, isAuthenticated, role } = useUser();
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [pageNumber, setPageNumber] = useState(1);
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([]);
  const [topicSummary, setTopicSummary] = useState(() => getAllTopicsProgress());
  const isFetchingRef = React.useRef(false);

  const fetchLeaderboard = React.useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await fetch(apiUrl('/api/leaderboard'));
      if (!res.ok) throw new Error('API not available');
      const data = await res.json();
      if (data?.leaderboard && Array.isArray(data.leaderboard)) {
        const clean = data.leaderboard.filter((u: any) => isRealStudent(u) && u.role !== 'admin');
        setLeaderboardUsers((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(clean)) {
            return prev;
          }
          return clean;
        });
      }
    } catch {
      // keep current state
    } finally {
      isFetchingRef.current = false;
    }
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

  // Auto-refresh every 5 seconds without duplicate requests or memory leaks
  useEffect(() => {
    fetchLeaderboard();
    const intervalId = setInterval(() => {
      fetchLeaderboard();
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchLeaderboard]);

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
        (user.branch && user.branch.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.regdNo && user.regdNo.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTier = selectedTier === 'All' || user.tier === selectedTier;
      return matchesSearch && matchesTier;
    });
  }, [effectiveLeaderboard, searchQuery, selectedTier]);

  const topThree = effectiveLeaderboard.slice(0, 3);
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pageUsers = filteredUsers.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
  const rangeStart = filteredUsers.length === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const rangeEnd = Math.min(pageNumber * pageSize, filteredUsers.length);
  const currentStudent = isAuthenticated && role === 'student'
    ? effectiveLeaderboard.find((student) => student.id === currentUser?.id)
    : undefined;
  const displayUsers = currentStudent && !pageUsers.some((student) => student.id === currentStudent.id)
    ? [...pageUsers, currentStudent]
    : pageUsers;
  const setPage = (nextPage: number) => setPageNumber(Math.max(1, Math.min(totalPages, nextPage)));

  useEffect(() => {
    if (pageNumber > totalPages) setPageNumber(totalPages);
  }, [pageNumber, totalPages]);

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

        {/* Overall XP rankings */}
        {topThree.some(Boolean) && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-4 items-end">
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
                  className={`relative rounded-3xl ${isFirst ? 'pt-8 pb-6 px-6 md:-translate-y-4' : 'pt-7 pb-6 px-6'} bg-white dark:bg-slate-900 border transition-colors duration-300 ${isFirst
                    ? 'border-blue-500 dark:border-violet-400'
                    : 'border-blue-200 dark:border-slate-700'
                    } flex flex-col items-center text-center`}
                >
                  {isFirst && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-violet-700 text-white border-2 border-white dark:border-slate-900 flex items-center justify-center">
                      <Crown className="w-6 h-6 fill-current" />
                    </div>
                  )}

                  <div className="relative mt-2 mb-2">
                    <UserAvatar
                      src={user.avatar}
                      name={user.name}
                      size="2xl"
                    />
                    <div className="absolute -bottom-2 -right-2 min-w-9 h-9 px-1.5 rounded-xl bg-slate-900 dark:bg-slate-950 text-white border border-blue-300 dark:border-blue-500 flex items-center justify-center font-mono font-bold text-sm">
                      #{user.rank}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {user.name}
                    </span>
                    {user.branch && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/50">
                        {user.branch}
                      </span>
                    )}
                  </div>
                  <span className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono tracking-wider">
                    {user.regdNo || (user.username ? `@${user.username}` : '')}
                  </span>

                  <DivisionTierBadge tier={user.tier} className="mt-3" />

                  <div className="w-full mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 text-center text-xs font-mono">
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

        {/* Tier and search filters */}
        <div className="max-w-5xl mx-auto mb-4">
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/85 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(37,99,235,0.06),0_2px_6px_-1px_rgba(0,0,0,0.03)] dark:shadow-none flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {tiers.map((t) => (
                <button
                  key={t}
                  onClick={() => { setSelectedTier(t); setPageNumber(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${selectedTier === t
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-white'
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPageNumber(1); }}
                placeholder="Search scholar or country..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50/80 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Full Rankings Table */}
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
                  <th className="py-3.5 px-4 w-28 sm:w-32 text-right pr-6">Total POINTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400 font-mono text-xs">
                      {currentStudent ? 'No scholars match these filters. Your row is shown below.' : 'No students on the leaderboard yet. Sign in and start learning to appear here.'}
                    </td>
                  </tr>
                )}
                {displayUsers.map((user) => {
                  const isCurrent = Boolean(currentStudent && user.id === currentStudent.id);
                  return (
                    <tr
                      key={user.regdNo ? user.regdNo.toUpperCase() : user.id}
                      className={`transition-colors ${isCurrent
                        ? 'bg-gradient-to-r from-blue-100/90 via-blue-50/90 to-blue-100/90 hover:from-blue-100 hover:via-blue-50 hover:to-blue-100 dark:from-blue-900/45 dark:via-blue-950/40 dark:to-blue-900/45 dark:hover:from-blue-900/55 dark:hover:via-blue-950/50 dark:hover:to-blue-900/55 font-semibold shadow-[0_2px_12px_rgba(37,99,235,0.16),inset_0_0_0_1px_rgba(37,99,235,0.3)] dark:shadow-[0_2px_12px_rgba(30,64,175,0.2),inset_0_0_0_1px_rgba(96,165,250,0.32)]'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                    >
                      <td className={`py-3.5 px-4 text-center font-mono font-bold text-slate-500 dark:text-slate-400 ${isCurrent ? 'shadow-[inset_4px_0_0_0_#1d4ed8] dark:shadow-[inset_4px_0_0_0_#60a5fa]' : ''}`}>
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
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {user.name}{isCurrent ? ' (You)' : ''}
                              </span>
                              {user.branch && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/50">
                                  {user.branch}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tracking-wider block mt-0.5">
                              {user.regdNo || (user.username ? `@${user.username}` : '')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <DivisionTierBadge tier={user.tier} size="compact" />
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
          <div className="overflow-x-auto rounded-b-3xl border border-t-0 border-slate-200 bg-white px-4 py-3 shadow-[0_8px_15px_-8px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_8px_15px_-8px_rgba(0,0,0,0.8)]">
            <div className="flex min-w-max flex-nowrap items-center justify-between gap-6 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex shrink-0 items-center gap-5">
                <label className="flex shrink-0 items-center gap-2 font-medium">
                  <span>Items per page:</span>
                  <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPageNumber(1); }} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500" aria-label="Items per page">
                    {[10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                </label>
                <span aria-live="polite" className="whitespace-nowrap font-medium tabular-nums text-slate-600 dark:text-slate-300">{rangeStart} {'\u2013'} {rangeEnd} of {filteredUsers.length.toLocaleString()}</span>
              </div>
              <nav className="flex shrink-0 items-center gap-5 pr-1" aria-label="Leaderboard pagination">
                <button type="button" onClick={() => setPage(1)} disabled={pageNumber <= 1} aria-label="First page" title="First page" className="text-slate-700 transition-colors hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-slate-200 dark:hover:text-white dark:disabled:text-slate-600"><ChevronsLeft className="h-6 w-6" /></button>
                <button type="button" onClick={() => setPage(pageNumber - 1)} disabled={pageNumber <= 1} aria-label="Previous page" title="Previous page" className="text-slate-700 transition-colors hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-slate-200 dark:hover:text-white dark:disabled:text-slate-600"><ChevronLeft className="h-6 w-6" /></button>
                <button type="button" onClick={() => setPage(pageNumber + 1)} disabled={pageNumber >= totalPages} aria-label="Next page" title="Next page" className="text-slate-700 transition-colors hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-slate-200 dark:hover:text-white dark:disabled:text-slate-600"><ChevronRight className="h-6 w-6" /></button>
                <button type="button" onClick={() => setPage(totalPages)} disabled={pageNumber >= totalPages} aria-label="Last page" title="Last page" className="text-slate-700 transition-colors hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-slate-200 dark:hover:text-white dark:disabled:text-slate-600"><ChevronsRight className="h-6 w-6" /></button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
