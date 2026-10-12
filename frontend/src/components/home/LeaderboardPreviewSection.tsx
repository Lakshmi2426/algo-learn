import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Flame, Zap, ArrowRight, ShieldCheck, Crown } from 'lucide-react';
import { LEADERBOARD_USERS } from '../../data/leaderboardData';
import { NavigationTab, LeaderboardUser } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import { useUser, isRealStudent } from '../../context/UserContext';
import { getAllTopicsProgress } from '../../utils/topicProgress';
import { buildAuthoritativeLeaderboard } from '../../utils/leaderboardHelper';

interface LeaderboardPreviewSectionProps {
  setActiveTab: (tab: NavigationTab) => void;
}

export const LeaderboardPreviewSection: React.FC<LeaderboardPreviewSectionProps> = ({
  setActiveTab,
}) => {
  const { studentsList, user: authUser, isAuthenticated, role } = useUser();
  const [leaderboardUsers, setLeaderboardUsers] = React.useState<LeaderboardUser[]>([]);
  const [topicSummary, setTopicSummary] = React.useState(() => getAllTopicsProgress());

  const fetchLeaderboard = React.useCallback(() => {
    fetch('/api/leaderboard')
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
      .catch(() => {});
  }, []);

  React.useEffect(() => {
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

  React.useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard, isAuthenticated, role, authUser?.regdNo, authUser?.id]);

  const effectiveLeaderboard = React.useMemo(() => {
    return buildAuthoritativeLeaderboard({
      serverLeaderboard: leaderboardUsers,
      studentsList,
      currentUser: authUser,
      isAuthenticated,
      role,
    });
  }, [leaderboardUsers, studentsList, authUser, isAuthenticated, role, topicSummary]);

  const topThree = effectiveLeaderboard.slice(0, 3);
  const currentUser = effectiveLeaderboard.find((u) => u.isCurrentUser);

  const getPodiumBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          title: 'Champion',
          color: 'from-blue-600 via-indigo-600 to-violet-600',
          ring: 'ring-blue-500',
          text: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:bg-blue-950',
          border: 'border-blue-300 dark:border-blue-700',
        };
      case 2:
        return {
          title: '2nd Place',
          color: 'from-blue-600 via-indigo-600 to-violet-600',
          ring: 'ring-blue-400',
          text: 'text-blue-500 dark:text-blue-400',
          bg: 'bg-blue-50/70 dark:bg-slate-800',
          border: 'border-blue-200 dark:border-slate-700',
        };
      case 3:
        return {
          title: '3rd Place',
          color: 'from-blue-600 via-indigo-600 to-violet-600',
          ring: 'ring-blue-400',
          text: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50/70 dark:bg-slate-800',
          border: 'border-blue-200 dark:border-slate-700',
        };
      default:
        return {
          title: 'Scholar',
          color: 'from-blue-600 via-indigo-600 to-violet-600',
          ring: 'ring-blue-400',
          text: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-950',
          border: 'border-blue-200 dark:border-blue-800',
        };
    }
  };

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
              <Trophy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Global Arena</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Weekly Leaderboard
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 max-w-xl">
              Solve problems, maintain streaks, and battle against top computer science scholars worldwide.
            </p>
          </div>

          <button
            onClick={() => {
              setActiveTab('leaderboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-indigo-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors self-start md:self-auto cursor-pointer"
            id="view-full-leaderboard-top-btn"
          >
            <span>View Full Leaderboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Top 3 Podium Cards */}
        {topThree.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 items-end">
            {[topThree[1], topThree[0], topThree[2]].map((user, idx) => {
              if (!user) return null;
              const isFirst = user.rank === 1;
              const badge = getPodiumBadge(user.rank);

              return (
                <motion.div
                  key={user.regdNo ? user.regdNo.toUpperCase() : user.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.12 }}
                  whileHover={{ y: isFirst ? -8 : -4, scale: 1.01 }}
                  className={`relative rounded-3xl p-6 bg-white dark:bg-slate-900 border transition-all duration-300 shadow-[0_8px_32px_-3px_rgba(37,99,235,0.12),0_4px_14px_-2px_rgba(124,58,237,0.06)] hover:shadow-[0_18px_36px_-4px_rgba(37,99,235,0.20),0_8px_18px_-2px_rgba(124,58,237,0.12)] dark:shadow-none ${
                    isFirst
                      ? 'border-blue-400/90 dark:border-blue-500/60 md:-translate-y-4 ring-2 ring-blue-500/25'
                      : 'border-blue-200/90 hover:border-blue-300 dark:border-slate-800'
                  } flex flex-col items-center text-center`}
                >
                  {/* Crown for #1 */}
                  {isFirst && (
                    <div className="absolute -top-5 w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                      <Crown className="w-5 h-5 fill-current" />
                    </div>
                  )}

                  {/* Avatar with rank badge */}
                  <div className="relative mt-2 mb-4">
                    <UserAvatar
                      src={user.avatar}
                      name={user.name}
                      size="2xl"
                      className="shadow-md"
                    />
                    <div
                      className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-lg ${badge.bg} ${badge.border} border flex items-center justify-center font-mono font-bold text-xs ${badge.text} shadow-sm backdrop-blur`}
                    >
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

                  <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:bg-blue-950/70 border border-blue-200/90 dark:border-blue-900/60 text-xs font-mono font-semibold text-blue-700 dark:text-blue-300 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-blue-400" />
                    <span>{user.tier}</span>
                  </div>

                  <div className="w-full mt-5 pt-4 border-t border-blue-100/90 dark:border-slate-800 flex items-center justify-around text-xs font-mono">
                    <div className="text-center">
                      <span className="text-slate-400 text-[10px] block">XP EARNED</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-indigo-500" />
                        {user.xp.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-slate-400 text-[10px] block">MASTERED</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {user.solvedCount}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-slate-400 text-[10px] block">STARTED</span>
                      <span className="font-bold text-indigo-600 dark:text-blue-400">{user.topicsStarted || 0}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-mono text-xs bg-white dark:bg-slate-900 rounded-3xl border border-blue-200/80 dark:border-slate-800 mb-10">
            No students on the leaderboard yet.
          </div>
        )}

        {/* Current User Standings Highlight Bar */}
        {currentUser && (
          <div className="p-4 rounded-2xl bg-white dark:bg-blue-950/40 border border-blue-200/90 dark:border-blue-800 shadow-[0_6px_24px_-2px_rgba(37,99,235,0.11),0_2px_10px_-1px_rgba(124,58,237,0.05)] dark:shadow-none flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                #{currentUser.rank}
              </span>
              <div className="flex items-center gap-2.5">
                <UserAvatar
                  src={currentUser.avatar}
                  name={currentUser.name}
                  size="sm"
                />
                <div>
                  <div className="flex items-center">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {currentUser.name}
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-300 font-mono ml-2">
                      {currentUser.badgeTitle}
                    </span>
                  </div>
                  {currentUser.regdNo && (
                    <div className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      Regd No: {currentUser.regdNo}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs font-mono">
              <span className="flex items-center gap-1 text-indigo-600 dark:text-blue-400 font-bold">
                <Zap className="w-3.5 h-3.5 text-indigo-500" />
                {currentUser.xp.toLocaleString()} XP
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">
                {currentUser.solvedCount} Topics Mastered
              </span>
              <button
                onClick={() => {
                  setActiveTab('leaderboard');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all hover:scale-105 cursor-pointer"
              >
                Climb Ranks →
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
