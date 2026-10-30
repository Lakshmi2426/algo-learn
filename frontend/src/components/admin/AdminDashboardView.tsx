import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  UserCheck,
  BookOpen,
  TrendingUp,
  Activity,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  ExternalLink,
  Shield,
  Layers,
  GraduationCap,
  Sparkles,
  BarChart3,
  Calendar,
  Mail,
  Award,
  LogOut,
  User as UserIcon,
  MessageSquare,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useUser, isRealStudent } from '../../context/UserContext';
import { useTeachers } from '../../context/TeachersContext';
import { useQuestions } from '../../context/QuestionsContext';
import { AdminTeacherQuestionsView } from '../teacher/AdminTeacherQuestionsView';
import { AdminTeacherManagementView } from './AdminTeacherManagementView';
import { DivisionTierBadge } from '../common/DivisionTierBadge';
import { StudentProgressRecord, NavigationTab, LeaderboardUser } from '../../types';
import { DSA_TOPICS } from '../../data/dsaTopics';
import { buildAuthoritativeLeaderboard } from '../../utils/leaderboardHelper';
import { apiUrl } from '../../config/api';

const getStudentInitial = (name: string): string => {
  if (!name || typeof name !== 'string') return 'S';
  const trimmed = name.trim();
  if (!trimmed) return 'S';
  return trimmed.charAt(0).toUpperCase();
};

interface AdminDashboardViewProps {
  setActiveTab: (tab: NavigationTab) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ setActiveTab }) => {
  const { studentsList, user, role, isAuthenticated, setShowAuthModal, setAuthModalMode, deleteStudent } = useUser();
  const { teachers } = useTeachers();
  const { questions } = useQuestions();
  const [adminSection, setAdminSection] = useState<'curriculum' | 'questions' | 'teachers'>('curriculum');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgressFilter, setSelectedProgressFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [sortBy, setSortBy] = useState<'progress' | 'streak' | 'name' | 'lastActive'>('streak');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([]);

  // Permanent Delete Modal States
  const [studentToDelete, setStudentToDelete] = useState<LeaderboardUser | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLeaderboard = React.useCallback(() => {
    fetch(apiUrl('/api/leaderboard'))
      .then((res) => {
        if (!res.ok) throw new Error('API not available');
        return res.json();
      })
      .then((data) => {
        if (data?.leaderboard && Array.isArray(data.leaderboard)) {
          setLeaderboardUsers(data.leaderboard.filter(isRealStudent));
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleConfirmDelete = async () => {
    if (!studentToDelete || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const targetIdentifier = studentToDelete.id || studentToDelete.regdNo;
      const result = await deleteStudent(targetIdentifier);

      if (!result.success) {
        setDeleteError(result.message || 'Failed to permanently delete student.');
        setIsDeleting(false);
        return;
      }

      const deletedName = studentToDelete.name;
      const deletedRegd = studentToDelete.regdNo;
      const deletedId = studentToDelete.id;

      // Immediately purge from local leaderboard state
      setLeaderboardUsers((prev) =>
        prev.filter(
          (u) =>
            u.id !== deletedId &&
            (!deletedRegd || (u.regdNo && u.regdNo.toUpperCase() !== deletedRegd.toUpperCase()))
        )
      );

      // Close student drawer if currently viewing this student
      if (
        selectedStudent &&
        (selectedStudent.id === deletedId || selectedStudent.regdNo === deletedRegd)
      ) {
        setSelectedStudent(null);
      }

      // Close modal & reset deleting state
      setStudentToDelete(null);
      setIsDeleting(false);

      // Display success banner
      setActionNotice({
        type: 'success',
        text: result.message || `Student ${deletedName} (${deletedRegd}) and all associated records have been permanently deleted.`,
      });
      setTimeout(() => {
        setActionNotice(null);
      }, 6000);

      // Refresh server leaderboard to ensure accurate live sync
      fetchLeaderboard();
    } catch (err: any) {
      setDeleteError(err?.message || 'An unexpected error occurred during deletion.');
      setIsDeleting(false);
    }
  };

  const authoritativeLeaderboard = useMemo(() => {
    return buildAuthoritativeLeaderboard({
      serverLeaderboard: leaderboardUsers,
      studentsList,
      currentUser: user,
      isAuthenticated,
    });
  }, [leaderboardUsers, studentsList, user, isAuthenticated]);

  const pendingQuestionsCount = questions.filter((q) => q.status === 'Pending').length;

  // Overview metrics computed dynamically from authoritative student records
  const totalStudents = studentsList.length;
  const activeStudents = authoritativeLeaderboard.length;
  const totalTopics = DSA_TOPICS.length;
  const averageProgress = studentsList.length > 0
    ? Math.round(studentsList.reduce((acc, std) => acc + (std.overallProgress || 0), 0) / studentsList.length)
    : 0;

  // Filter & sort authoritative students
  const filteredStudents = useMemo(() => {
    return authoritativeLeaderboard
      .filter((std) => {
        const matchesSearch =
          std.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          std.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (std.regdNo && std.regdNo.toLowerCase().includes(searchQuery.toLowerCase()));

        let matchesFilter = true;
        const progressPct = std.overallProgress || 0;
        if (selectedProgressFilter === 'High') {
          matchesFilter = progressPct >= 75;
        } else if (selectedProgressFilter === 'Medium') {
          matchesFilter = progressPct >= 40 && progressPct < 75;
        } else if (selectedProgressFilter === 'Low') {
          matchesFilter = progressPct < 40;
        }

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'progress') {
          diff = (a.overallProgress || 0) - (b.overallProgress || 0);
        } else if (sortBy === 'streak') {
          diff = (a.xp || 0) - (b.xp || 0);
        } else if (sortBy === 'name') {
          diff = a.name.localeCompare(b.name);
        } else {
          diff = (a.solvedCount || 0) - (b.solvedCount || 0);
        }
        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [authoritativeLeaderboard, searchQuery, selectedProgressFilter, sortBy, sortOrder]);

  const toggleSort = (column: 'progress' | 'streak' | 'name' | 'lastActive') => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  if (!isAuthenticated || role !== 'admin') {
    return (
      <div className="pt-28 pb-20 min-h-screen flex items-center justify-center px-4 text-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-blue-200/80 dark:border-slate-800 shadow-xl text-left">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Administrator Access Restricted
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            This administrative control center is restricted to authorized faculty and staff. Please sign in with your administrative credentials to continue.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setAuthModalMode('admin');
                setShowAuthModal(true);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              Sign In as Administrator
            </button>
            <button
              onClick={() => setActiveTab('home')}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-center"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 min-h-screen text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Header & Admin Section Navigation Tabs (NO duplicate profile avatar) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2 font-mono">
              <Shield className="w-3.5 h-3.5" />
              Administrative Control Center
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {adminSection === 'curriculum' && 'Student Progress & Curriculum Monitor'}
              {adminSection === 'questions' && 'Student Questions'}
              {adminSection === 'teachers' && 'Teacher Management'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {adminSection === 'curriculum' && 'Track student engagement, topic completion rates, and learning streaks across 18 DSA modules.'}
              {adminSection === 'questions' && 'Questions asked by students. Review student queries, view conversation history, and reply directly.'}
              {adminSection === 'teachers' && 'Manage expert educators available for student questions. Added teachers instantly appear in the Ask a Teacher workspace.'}
            </p>
          </div>

          {/* Admin Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 w-fit shrink-0">
            <button
              onClick={() => setAdminSection('curriculum')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                adminSection === 'curriculum'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              id="admin-tab-curriculum"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Curriculum Monitor</span>
            </button>
            <button
              onClick={() => setAdminSection('questions')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                adminSection === 'questions'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              id="admin-tab-questions"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Student Questions</span>
              {pendingQuestionsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-mono font-bold">
                  {pendingQuestionsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setAdminSection('teachers')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                adminSection === 'teachers'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              id="admin-tab-teachers"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Teachers</span>
              <span className="px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold border border-blue-200 dark:border-blue-800">
                {teachers.length}
              </span>
            </button>
          </div>
        </div>

        {/* ── SECTION CONTENT ──────────────────────────────────────────────── */}
        {adminSection === 'questions' && (
          <AdminTeacherQuestionsView showHeader={false} />
        )}

        {adminSection === 'teachers' && (
          <AdminTeacherManagementView />
        )}

        {adminSection === 'curriculum' && (
          <div className="space-y-8">


        {/* 4 OVERVIEW STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Students */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/85 hover:border-blue-400 dark:border-slate-800 shadow-[0_4px_18px_-2px_rgba(37,99,235,0.08)] hover:shadow-[0_10px_24px_-4px_rgba(37,99,235,0.14)] dark:shadow-none hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider">Total Students</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-transparent flex items-center justify-center shadow-2xs">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalStudents.toLocaleString()}
            </div>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> {totalStudents} registered scholar{totalStudents === 1 ? '' : 's'}
            </span>
          </div>

          {/* Active Students */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/85 hover:border-blue-400 dark:border-slate-800 shadow-[0_4px_18px_-2px_rgba(37,99,235,0.08)] hover:shadow-[0_10px_24px_-4px_rgba(37,99,235,0.14)] dark:shadow-none hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider">Active Students</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-transparent flex items-center justify-center shadow-2xs">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {activeStudents.toLocaleString()}
            </div>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 mt-1">
              <Activity className="w-3 h-3" /> {totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0}% active engagement
            </span>
          </div>

          {/* Total Topics */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/85 hover:border-blue-400 dark:border-slate-800 shadow-[0_4px_18px_-2px_rgba(37,99,235,0.08)] hover:shadow-[0_10px_24px_-4px_rgba(37,99,235,0.14)] dark:shadow-none hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider">Total Modules</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-transparent flex items-center justify-center shadow-2xs">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalTopics}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1 block">
              6 Progressive Phases
            </span>
          </div>

          {/* Overall Learning Progress */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/85 hover:border-blue-400 dark:border-slate-800 shadow-[0_4px_18px_-2px_rgba(37,99,235,0.08)] hover:shadow-[0_10px_24px_-4px_rgba(37,99,235,0.14)] dark:shadow-none hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider">Avg Completion</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-transparent flex items-center justify-center shadow-2xs">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {averageProgress}%
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-full" style={{ width: `${averageProgress}%` }} />
            </div>
          </div>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/85 dark:border-slate-800 shadow-[0_4px_18px_-2px_rgba(37,99,235,0.06)] dark:shadow-none flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student name, email, stage..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-blue-100 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="admin-search-input"
            />
          </div>

          {/* Progress Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">Filter:</span>
            {(['All', 'High', 'Medium', 'Low'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedProgressFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedProgressFilter === filter
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700'
                }`}
              >
                {filter === 'All' ? 'All Progress' : filter === 'High' ? '>75%' : filter === 'Medium' ? '40-75%' : '<40%'}
              </button>
            ))}
          </div>
        </div>

        {/* SUCCESS / ERROR ACTION BANNER */}
        {actionNotice && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold transition-all ${
              actionNotice.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-900/60 shadow-sm'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200/90 dark:border-rose-900/60 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{actionNotice.text}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              aria-label="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STUDENT PROGRESS TABLE */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-blue-200/85 dark:border-slate-800 shadow-[0_8px_30px_-4px_rgba(37,99,235,0.08)] dark:shadow-none overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Individual Student Tracking
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                Showing {filteredStudents.length} ranked scholars from the authoritative leaderboard.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6 text-center font-bold">RANK</th>
                  <th
                    onClick={() => toggleSort('name')}
                    className="py-4 px-6 cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>STUDENT</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-4 px-6 font-bold">DIVISION TIER</th>
                  <th className="py-4 px-6 text-center font-bold">MODULES STARTED</th>
                  <th className="py-4 px-6 text-center font-bold">MODULES MASTERED</th>
                  <th
                    onClick={() => toggleSort('streak')}
                    className="py-4 px-6 text-right cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5 font-bold">
                      <span>TOTAL XP</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('progress')}
                    className="py-4 px-6 text-right cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5 font-bold">
                      <span>OVERALL PROGRESS</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-4 px-6 text-center font-bold">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400 font-mono text-xs">
                      No students on the leaderboard yet.
                    </td>
                  </tr>
                )}
                {filteredStudents.map((std) => (
                  <tr
                    key={std.regdNo ? std.regdNo.toUpperCase() : std.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Rank */}
                    <td className="py-4 px-6 text-center whitespace-nowrap font-mono font-bold text-slate-500 dark:text-slate-400">
                      #{std.rank}
                    </td>

                    {/* Student Info */}
                    <td
                      onClick={() => setSelectedStudent(std)}
                      className="py-4 px-6 whitespace-nowrap cursor-pointer hover:opacity-90"
                      title="Click to view student details"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm ring-2 ring-blue-500/20 dark:ring-blue-400/20">
                          {getStudentInitial(std.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight leading-snug">
                              {std.name}
                            </span>
                            {std.branch && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/50">
                                {std.branch}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tracking-wider flex items-center gap-1 mt-0.5">
                            <span className="truncate">{std.regdNo || std.username || std.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Tier */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <DivisionTierBadge tier={std.tier} size="compact" />
                    </td>

                    {/* Started */}
                    <td className="py-4 px-6 text-center whitespace-nowrap font-mono font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60">
                        {std.topicsStarted || 0} / 13
                      </span>
                    </td>

                    {/* Mastered */}
                    <td className="py-4 px-6 text-center whitespace-nowrap font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40">
                        {std.solvedCount || std.topicsCompleted || 0} / 13
                      </span>
                    </td>

                    {/* Total XP */}
                    <td className="py-4 px-6 text-right whitespace-nowrap font-mono font-bold text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
                      {std.xp.toLocaleString()} XP
                    </td>

                    {/* Progress Bar & % */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex flex-col items-end min-w-[110px]">
                        <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
                          {std.overallProgress || 0}%
                        </span>
                        <div className="w-28 h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-full transition-all duration-300"
                            style={{ width: `${std.overallProgress || 0}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* ACTIONS: Delete Button */}
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStudentToDelete(std);
                          setDeleteError(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-900/50 transition-all shadow-2xs hover:shadow active:scale-95 cursor-pointer"
                        title={`Permanently delete ${std.name}`}
                        aria-label={`Delete student ${std.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* STUDENT DETAILS MODAL / DRAWER */}
        <AnimatePresence>
          {selectedStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto text-left"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white font-extrabold text-xl flex items-center justify-center shrink-0 shadow-md ring-4 ring-blue-500/20 dark:ring-blue-400/20">
                      {getStudentInitial(selectedStudent.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                          {selectedStudent.name}
                        </h2>
                        <DivisionTierBadge tier={selectedStudent.tier || 'Gold'} />
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        {selectedStudent.email || selectedStudent.username} {selectedStudent.regdNo ? `• Regd No: ${selectedStudent.regdNo}` : ''}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Metrics Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block">RANK</span>
                    <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                      #{selectedStudent.rank || 1}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">TOTAL XP</span>
                    <span className="text-base font-bold text-indigo-600 dark:text-blue-400">
                      {(selectedStudent.xp || 0).toLocaleString()} XP
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">MODULES MASTERED</span>
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedStudent.solvedCount || selectedStudent.topicsCompleted || 0} / 13
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">OVERALL PROGRESS</span>
                    <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                      {selectedStudent.overallProgress || 0}%
                    </span>
                  </div>
                </div>

                {/* Explored Modules Progress Breakdown */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    Module Mastery Breakdown
                  </h3>
                  {selectedStudent.exploredTopics && selectedStudent.exploredTopics.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedStudent.exploredTopics.map((topic) => (
                        <div
                          key={topic.id}
                          className="p-3 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              {topic.title}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Last accessed: {topic.lastAccessed}
                            </div>
                          </div>

                          <div className="text-right">
                            <span
                              className={`text-xs font-mono font-bold ${
                                topic.status === 'completed'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-blue-600 dark:text-blue-400'
                              }`}
                            >
                              {topic.progress}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs font-mono text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      No topic progress recorded for this student yet.
                    </div>
                  )}
                </div>

                {/* Recent Activities Log */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Recent Telemetry Activities
                  </h3>
                  {selectedStudent.recentActivities && selectedStudent.recentActivities.length > 0 ? (
                    <div className="space-y-2">
                      {selectedStudent.recentActivities.map((act) => (
                        <div
                          key={act.id}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                            <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                            <span>{act.title}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {act.timestamp}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs font-mono text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      No telemetry activities recorded for this student yet.
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStudentToDelete(selectedStudent);
                      setDeleteError(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/50 text-xs font-bold transition-all shadow-2xs hover:shadow active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Student</span>
                  </button>

                  <div className="flex items-center gap-2 ml-auto">
                    {exportNotice && (
                      <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold mr-2">
                        {exportNotice}
                      </span>
                    )}
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Close Drawer
                    </button>
                    <button
                      onClick={() => {
                        setExportNotice(`Progress report exported for ${selectedStudent.name}`);
                        setTimeout(() => setExportNotice(null), 3500);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
                    >
                      Export Progress Report
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* PERMANENT DELETE CONFIRMATION DIALOG MODAL */}
        <AnimatePresence>
          {studentToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-rose-200/80 dark:border-rose-900/60 shadow-2xl p-6 sm:p-7 space-y-5 text-left"
                role="dialog"
                aria-labelledby="delete-dialog-title"
                aria-modal="true"
              >
                {/* Modal Header */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 id="delete-dialog-title" className="text-lg font-bold text-slate-900 dark:text-white">
                      Permanently Delete Student?
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Warning: This action is permanent and cannot be undone.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => {
                      if (!isDeleting) {
                        setStudentToDelete(null);
                        setDeleteError(null);
                      }
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                    aria-label="Close dialog"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Selected Student Details Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Student Name</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                      {studentToDelete.name}
                    </span>
                  </div>
                  {studentToDelete.regdNo && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Registration No.</span>
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                        {studentToDelete.regdNo}
                      </span>
                    </div>
                  )}
                  {studentToDelete.branch && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Branch</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {studentToDelete.branch}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Leaderboard Points</span>
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {(studentToDelete.xp || 0).toLocaleString()} XP
                    </span>
                  </div>
                </div>

                {/* Warning Card */}
                <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 space-y-1.5">
                  <div className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <span>The following will be permanently removed from the database:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700/90 dark:text-rose-300/90 pl-1">
                    <li>Authentication account & login credentials (cannot log in)</li>
                    <li>Student profile, registration details, and rank</li>
                    <li>Total XP and topic-wise scores across all 18 modules</li>
                    <li>Module learning progress, quiz answers, and activity records</li>
                    <li>All submitted questions and teacher message threads</li>
                  </ul>
                </div>

                {/* Error Banner */}
                {deleteError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400 font-medium">
                    {deleteError}
                  </div>
                )}

                {/* Dialog Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => {
                      setStudentToDelete(null);
                      setDeleteError(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleConfirmDelete}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        <span>Deleting Account...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 shrink-0" />
                        <span>Confirm Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
