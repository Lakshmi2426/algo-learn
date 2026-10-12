import { LeaderboardUser, StudentProgressRecord, UserProfile } from '../types';
import { isRealStudent } from '../context/UserContext';
import { getAllTopicsProgress } from './topicProgress';

export function getTierFromXP(xp: number): 'Diamond' | 'Platinum' | 'Gold' {
  if (xp >= 800) return 'Diamond';
  if (xp >= 400) return 'Platinum';
  return 'Gold';
}

export interface BuildLeaderboardParams {
  serverLeaderboard?: LeaderboardUser[];
  studentsList?: StudentProgressRecord[];
  currentUser?: UserProfile;
  isAuthenticated?: boolean;
  role?: string;
}

/**
 * Single Authoritative Leaderboard Aggregator
 * Shared between Main Leaderboard, Home Preview, and Admin Dashboard.
 *
 * Rules:
 * 1. Only genuine registered students appear (mock students filtered out).
 * 2. Authenticated students appear immediately upon signing in.
 * 3. Deduplicated by stable identifier (regdNo.toUpperCase() or id).
 * 4. Ranks calculated strictly descending by total aggregated XP, with topicsCompleted as tie-breaker.
 * 5. Current student progress is synced from getAllTopicsProgress() to ensure immediate reactivity.
 */
export function buildAuthoritativeLeaderboard({
  serverLeaderboard = [],
  studentsList = [],
  currentUser,
  isAuthenticated = false,
  role = 'student',
}: BuildLeaderboardParams): LeaderboardUser[] {
  const map = new Map<string, LeaderboardUser>();

  const getKey = (item: { regdNo?: string; id?: string; email?: string; username?: string; name?: string }) => {
    if (item.regdNo && item.regdNo.trim()) return `REGD:${item.regdNo.trim().toUpperCase()}`;
    if (item.id && item.id.trim()) return `ID:${item.id.trim()}`;
    if (item.email && item.email.trim()) return `EMAIL:${item.email.trim().toLowerCase()}`;
    if (item.username && item.username.trim()) return `USER:${item.username.trim().toLowerCase()}`;
    return `NAME:${(item.name || '').trim().toLowerCase()}`;
  };

  // 1. Ingest server API leaderboard records
  serverLeaderboard.forEach((u) => {
    if (!isRealStudent(u)) return;
    const xp = u.xp || 0;
    const solvedCount = u.solvedCount || u.topicsCompleted || 0;
    const key = getKey(u);
    map.set(key, {
      ...u,
      xp,
      solvedCount,
      topicsCompleted: solvedCount,
      topicsStarted: u.topicsStarted || 0,
      overallProgress: u.overallProgress || 0,
      email: u.email || '',
      tier: getTierFromXP(xp),
      rank: 0,
      isCurrentUser: false,
    });
  });

  // 2. Ingest registered students list from context
  studentsList.forEach((std) => {
    if (!isRealStudent(std)) return;
    const key = getKey(std);
    const existing = map.get(key);
    const xp = Math.max(std.xp || 0, existing?.xp || 0);
    const solvedCount = Math.max(std.topicsCompleted || 0, existing?.solvedCount || 0);

    map.set(key, {
      id: std.id,
      rank: 0,
      name: std.name,
      username: std.email ? std.email.split('@')[0].toLowerCase() : (std.regdNo || std.name).toLowerCase().replace(/\s+/g, '_'),
      regdNo: std.regdNo,
      email: std.email || existing?.email || '',
      avatar: std.avatar || '',
      xp,
      streak: 1,
      level: Math.floor(xp / 350) + 1,
      tier: getTierFromXP(xp),
      countryCode: '🌐',
      solvedCount,
      topicsCompleted: solvedCount,
      topicsStarted: std.topicsStarted || (xp > 0 ? 1 : 0),
      overallProgress: std.overallProgress || existing?.overallProgress || 0,
      badgeTitle: 'Algo Scholar',
      isCurrentUser: false,
    });
  });

  // 3. Merge active current student with local aggregate progress
  const isStudentUser = isAuthenticated && role !== 'admin' && currentUser?.name && currentUser.name !== 'Guest Learner' && isRealStudent(currentUser);
  if (isStudentUser && currentUser) {
    const topicSummary = getAllTopicsProgress();
    const currKey = getKey(currentUser);
    const existing = map.get(currKey);

    const userXp = Math.max(currentUser.xp || 0, topicSummary.totalXP, existing?.xp || 0);
    const userCompleted = Math.max(topicSummary.topicsMasteredCount, currentUser.topicsMastered || 0, currentUser.problemsSolved || 0, existing?.solvedCount || 0);
    const userStarted = Math.max(topicSummary.topicsStartedCount, existing?.topicsStarted || 0);

    map.set(currKey, {
      id: currentUser.id || 'curr-user',
      rank: 0,
      name: `${currentUser.name} (You)`,
      username: currentUser.username || (currentUser.email ? currentUser.email.split('@')[0] : (currentUser.regdNo || 'learner').toLowerCase()),
      regdNo: currentUser.regdNo || existing?.regdNo,
      email: currentUser.email || existing?.email || '',
      avatar: currentUser.avatar || existing?.avatar || '',
      xp: userXp,
      streak: 1,
      level: Math.floor(userXp / 350) + 1,
      tier: getTierFromXP(userXp),
      countryCode: '🌐',
      solvedCount: userCompleted,
      topicsCompleted: userCompleted,
      topicsStarted: userStarted,
      overallProgress: topicSummary.overallPercentage || existing?.overallProgress || 0,
      badgeTitle: 'Algo Scholar',
      isCurrentUser: true,
    });
  }

  // 4. Sort strictly descending by XP, with completed count as tie breaker, then alphabetical by name
  const sorted = Array.from(map.values()).sort(
    (a, b) => (b.xp || 0) - (a.xp || 0) || (b.solvedCount || 0) - (a.solvedCount || 0) || a.name.localeCompare(b.name)
  );

  // 5. Assign definitive ranks
  sorted.forEach((u, idx) => {
    u.rank = idx + 1;
    u.tier = getTierFromXP(u.xp || 0);
  });

  return sorted;
}
