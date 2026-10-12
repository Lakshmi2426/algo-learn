import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageCircle,
  Send,
  User,
  X,
  Clock,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Shield,
  LogIn,
  UserPlus,
  Compass,
  Sparkles,
  Award,
  Trash2,
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useQuestions } from '../../context/QuestionsContext';
import { useTeachers } from '../../context/TeachersContext';
import { Teacher, NavigationTab } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import { AdminTeacherQuestionsView } from './AdminTeacherQuestionsView';

interface TeacherWorkspaceProps {
  initialTopicTitle?: string;
  setActiveTab?: (tab: NavigationTab) => void;
}

export const TeacherWorkspace: React.FC<TeacherWorkspaceProps> = ({
  initialTopicTitle,
  setActiveTab,
}) => {
  const { user, role, isAuthenticated, setShowAuthModal, setAuthModalMode } = useUser();
  const { teachers } = useTeachers();
  const { questions, sendQuestion, sendAnswer, clearConversation } = useQuestions();

  // If authenticated user is ADMIN, render the Admin/Teacher Questions Management View
  if (role === 'admin') {
    return (
      <div className="pt-24 pb-20 min-h-screen text-left max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-semibold">
            <Shield className="w-4 h-4 shrink-0" />
            <span>
              You are viewing as Administrator. Review and reply to student questions below.
            </span>
          </div>

          <button
            onClick={() => setActiveTab?.('admin')}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
          >
            Go to Admin Dashboard
          </button>
        </div>

        <AdminTeacherQuestionsView showHeader={true} />
      </div>
    );
  }

  // ── STUDENT VIEW ──────────────────────────────────────────────────────────
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(
    () => teachers[0] || null
  );
  const [showTeacherModal, setShowTeacherModal] = useState<boolean>(false);
  const [showAuthGateModal, setShowAuthGateModal] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSimulatingReply, setIsSimulatingReply] = useState(false);
  const [sentSuccessMsg, setSentSuccessMsg] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Track active conversation id
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Keep selected teacher synced if teachers array updates and current is null
  useEffect(() => {
    if (!selectedTeacher && teachers.length > 0) {
      setSelectedTeacher(teachers[0]);
    }
  }, [teachers, selectedTeacher]);

  // Filter student's existing conversations
  const studentConversations = questions.filter(
    (q) =>
      isAuthenticated &&
      (q.studentId === user.id || q.studentName === user.name)
  );

  // Find active conversation
  const activeConversation = activeConversationId
    ? questions.find((q) => q.id === activeConversationId) || null
    : studentConversations.length > 0 && selectedTeacher
    ? studentConversations.find((q) => q.teacherId === selectedTeacher.id) || null
    : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const handleSelectTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowTeacherModal(false);

    // Switch to existing conversation with this teacher if one exists
    const existing = studentConversations.find(
      (q) => q.teacherId === teacher.id
    );

    if (existing) {
      setActiveConversationId(existing.id);
    } else {
      setActiveConversationId(null);
    }

    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    // Gate unauthenticated visitors
    if (!isAuthenticated) {
      setShowAuthGateModal(true);
      return;
    }

    if (!selectedTeacher) {
      setShowTeacherModal(true);
      return;
    }

    const text = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    const questionResult = await sendQuestion({
      teacherId: selectedTeacher.id,
      teacherName: selectedTeacher.name,
      teacherSubject: selectedTeacher.subject,
      topicTitle: initialTopicTitle || 'Data Structures & Algorithms',
      message: text,
      questionId: activeConversation?.id,
    });

    setIsSending(false);

    if (questionResult && questionResult.id) {
      setActiveConversationId(questionResult.id);
    }

    setSentSuccessMsg(
      `Question delivered to ${selectedTeacher.name}. Awaiting teacher response.`
    );

    setTimeout(() => setSentSuccessMsg(null), 5000);
  };

  // Helper to simulate a realistic educator response for interactive review
  const handleSimulateTeacherReply = async () => {
    if (!activeConversation || isSimulatingReply) return;

    setIsSimulatingReply(true);

    const teacherName =
      activeConversation.teacherName ||
      selectedTeacher?.name ||
      'Instructor';

    const lastStudentMsg =
      [...activeConversation.messages]
        .reverse()
        .find((m) => m.senderRole === 'student')?.message ||
      'your question';

    let answer = `Hello ${
      user.name ? user.name.split(' ')[0] : 'there'
    }! Great question regarding ${
      activeConversation.topicTitle
    }. Here is how to conceptualize it step by step:

1. Always start by verifying the edge invariants—check for null pointers or empty boundaries first.
2. In ${activeConversation.topicTitle}, pay close attention to time complexity trade-offs between linear scans and logarithmic lookups.
3. Trace through with a small input (e.g., [3, 1, 4]) to build intuition before writing code.

Feel free to ask follow-up questions if any part of the proof remains unclear!`;

    if (
      lastStudentMsg.toLowerCase().includes('bst') ||
      lastStudentMsg.toLowerCase().includes('tree')
    ) {
      answer = `Excellent question! In a Binary Search Tree, operations depend directly on the tree height h. For a balanced tree, h = O(log n), but if elements are inserted in sorted order, the tree degenerates into a linear chain of height O(n). That is why we say BST search is strictly O(h). Self-balancing trees like AVL or Red-Black trees prevent this skew.`;
    } else if (
      lastStudentMsg.toLowerCase().includes('linked list') ||
      lastStudentMsg.toLowerCase().includes('cycle')
    ) {
      answer = `Great question! Floyd's Cycle-Finding Algorithm uses two pointers: slow moving 1 step and fast moving 2 steps. If a cycle exists, the relative speed between them is 1 step per iteration, ensuring fast must eventually catch slow inside the loop in O(n) time and O(1) auxiliary space without extra node allocations.`;
    }

    await new Promise((r) => setTimeout(r, 1200));

    await sendAnswer({
      questionId: activeConversation.id,
      answer,
      teacherName,
    });

    setIsSimulatingReply(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Sample prompt buttons
  const SAMPLE_STARTERS = [
    'Why is BST search O(h) instead of strictly O(log n)?',
    'How does cycle detection in a Linked List work using Floyd’s algorithm?',
    'Can you explain the difference between BFS and DFS traversal with an example?',
  ];

  return (
    <div className="pt-20 min-h-[calc(100vh-80px)] flex flex-col justify-between text-left">
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 flex-1 flex flex-col pb-6">

        {/* ── CHAT HEADER: ONE SINGLE CLEAR TEACHER IDENTITY ───────────────── */}
        <div className="py-3 px-4 sm:px-6 mb-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-blue-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md sticky top-20 z-20 flex flex-wrap items-center justify-between gap-3 text-left">

          {/* Feature Badge */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <MessageCircle className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Ask a Teacher
                </h1>

                {initialTopicTitle && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px]">
                    <BookOpen className="w-3 h-3" />
                    {initialTopicTitle}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Direct mentorship from expert educators · No automated AI bots
              </p>
            </div>
          </div>

          {/* Active Teacher Card */}
          {selectedTeacher ? (
            <div className="flex items-center gap-3 p-1.5 pl-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 shadow-2xs">

              <div className="flex flex-col text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                    title="Active & Available"
                  />

                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {selectedTeacher.name}
                  </span>
                </div>

                <span className="text-[10px] text-blue-600 dark:text-blue-400 truncate max-w-[170px]">
                  {selectedTeacher.subject}
                </span>
              </div>

              <UserAvatar
                src={selectedTeacher.avatarUrl}
                name={selectedTeacher.name}
                size="sm"
              />

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowTeacherModal(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-600"
                  id="change-teacher-btn"
                  title="Change Teacher"
                >
                  Change
                </button>

                {activeConversation && activeConversation.messages.length > 0 && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 text-[11px] font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-600 flex items-center gap-1"
                    id="clear-chat-btn"
                    title="Clear this conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-500" />
                    <span>Clear Chat</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowTeacherModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              id="header-select-teacher-btn"
            >
              <User className="w-3.5 h-3.5" />
              <span>Select a Teacher</span>
            </button>
          )}
        </div>

        {/* ── CHAT MESSAGES CONTAINER ──────────────────────────────────────── */}
        <div className="flex-1 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-blue-200/60 dark:border-slate-800 p-4 sm:p-6 overflow-y-auto min-h-[380px] max-h-[calc(100vh-320px)] flex flex-col justify-between text-left shadow-xs">

          {/* Active Conversation Messages */}
          {activeConversation && activeConversation.messages.length > 0 ? (
            <div className="space-y-4 mb-4">

              {/* Clean conversation status bar */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">

                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />

                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Topic: {activeConversation.topicTitle}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      activeConversation.status === 'Answered'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300'
                    }`}
                  >
                    {activeConversation.status === 'Answered'
                      ? 'Answered'
                      : 'Waiting for Teacher'}
                  </span>

                  {/* Fast test/simulation helper */}
                  {activeConversation.status === 'Pending' && (
                    <button
                      onClick={handleSimulateTeacherReply}
                      disabled={isSimulatingReply}
                      className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                      title="Simulate educator answer immediately"
                    >
                      <Sparkles className="w-2.5 h-2.5" />

                      {isSimulatingReply
                        ? 'Teacher replying...'
                        : 'Simulate Reply'}
                    </button>
                  )}
                </div>
              </div>

              {/* Message bubbles */}
              {activeConversation.messages.map((msg) => {
                const isStudent = msg.senderRole === 'student';

                return (
                  <motion.div
                    key={msg.messageId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-start gap-2.5 ${
                      isStudent ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >

                    {/* Avatar */}
                    {isStudent ? (
                      <UserAvatar
                        src={user.avatar}
                        name={user.name}
                        size="sm"
                      />
                    ) : (
                      <UserAvatar
                        src={selectedTeacher?.avatarUrl}
                        name={msg.senderName || selectedTeacher?.name || 'Teacher'}
                        size="sm"
                      />
                    )}

                    {/* Content */}
                    <div
                      className={`flex flex-col ${
                        isStudent ? 'items-end' : 'items-start'
                      } max-w-xl`}
                    >

                      {/* Sender label */}
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-sans">
                          {isStudent ? 'You' : msg.senderName}
                        </span>

                        {!isStudent && (
                          <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-bold">
                            INSTRUCTOR
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400">
                          {msg.createdAt}
                        </span>
                      </div>

                      {/* Chat Bubble */}
                      <div
                        className={`p-4 rounded-2xl text-sm leading-relaxed ${
                          isStudent
                            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white rounded-tr-xs shadow-sm shadow-blue-600/20 font-medium'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-tl-xs shadow-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">
                          {msg.message}
                        </p>
                      </div>

                      {/* Status indicator under student message */}
                      {isStudent && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                          {activeConversation.status === 'Answered' ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Answered
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Awaiting teacher reply
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* ── GREETING & STARTER LANDING SCREEN ─────────────────────── */
            <div className="my-auto py-8 px-4 text-center">

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white mx-auto mb-4 shadow-md shadow-blue-500/20">
                <MessageCircle className="w-7 h-7" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                👋 Hi
                {isAuthenticated && user?.name
                  ? `, ${user.name.split(' ')[0]}`
                  : ''}
                !
              </h2>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
                {selectedTeacher
                  ? `Have a DSA question? Ask ${selectedTeacher.name} below for direct educator guidance.`
                  : teachers.length > 0
                  ? 'What DSA concept would you like help with? Select a teacher to get started.'
                  : 'No educators are currently available. Teachers added by administrators in the Admin Dashboard will appear here.'}
              </p>

              {/* Sample starters */}
              <div className="max-w-lg mx-auto space-y-2 text-left">

                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center mb-2">
                  Sample questions:
                </p>

                {SAMPLE_STARTERS.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputValue(sample);
                      inputRef.current?.focus();
                    }}
                    className="w-full p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 text-left transition-colors flex items-center justify-between gap-2 group cursor-pointer shadow-2xs"
                  >
                    <span className="truncate font-medium">
                      {sample}
                    </span>

                    <ArrowRight className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Success Alert */}
        <AnimatePresence>
          {sentSuccessMsg && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="my-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{sentSuccessMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── QUESTION COMPOSER ────────────────────────────────────────────── */}
        <div className="mt-3">

          <div className="p-[1.5px] rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 shadow-sm">

            <form
              onSubmit={handleSend}
              className="relative flex items-end gap-2 p-2 rounded-[14.5px] bg-white dark:bg-slate-900"
            >
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  selectedTeacher
                    ? `Type your question for ${selectedTeacher.name}...`
                    : teachers.length > 0
                    ? 'Select a teacher first to ask a question...'
                    : 'No educators currently available to accept questions...'
                }
                rows={1}
                className="flex-1 py-2 px-3 text-sm bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none max-h-32"
                id="ask-teacher-input"
                style={{ lineHeight: '1.5' }}
              />

              <button
                type="submit"
                disabled={!inputValue.trim() || isSending || !selectedTeacher}
                className="p-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 disabled:opacity-40 text-white transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer shrink-0 disabled:cursor-not-allowed"
                id="ask-teacher-send-btn"
                aria-label="Send question"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          <p className="text-[11px] text-slate-400 text-center mt-1.5">
            Enter to send · Direct response from{' '}
            {selectedTeacher ? selectedTeacher.name : 'educator'} · Sign in required to ask questions
          </p>
        </div>
      </div>

      {/* ── TEACHER SELECTION MODAL ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showTeacherModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-blue-200 dark:border-slate-800 shadow-2xl p-6 text-left max-h-[85vh] flex flex-col"
            >

              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Select a Teacher
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose an instructor to answer your DSA questions.
                  </p>
                </div>

                <button
                  onClick={() => setShowTeacherModal(false)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Minimal Teachers List */}
              <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                {teachers.length === 0 ? (
                  <div className="py-10 text-center text-slate-500 dark:text-slate-400">
                    <User className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                      No teachers available yet
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                      Teachers added by administrators in the Admin Dashboard will appear here.
                    </p>
                  </div>
                ) : (
                  teachers.map((teacher) => {
                    const isCurrent = selectedTeacher?.id === teacher.id;

                  return (
                    <div
                      key={teacher.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500/80 shadow-xs'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-700'
                      }`}
                      id={`teacher-option-${teacher.id}`}
                    >

                      {/* Photo / Avatar Initials */}
                      <div className="flex items-center gap-3 min-w-0">

                        <UserAvatar
                          src={teacher.avatarUrl}
                          name={teacher.name}
                          size="md"
                        />

                        <div className="min-w-0">

                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {teacher.name}
                          </h4>

                          <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                            {teacher.subject}
                          </p>

                        </div>
                      </div>

                      {/* Select Button */}
                      <button
                        onClick={() => handleSelectTeacher(teacher)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          isCurrent
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-700 hover:bg-gradient-to-r hover:from-blue-600 hover:via-indigo-600 hover:to-violet-600 hover:text-white text-slate-700 dark:text-slate-200'
                        }`}
                        id={`select-btn-${teacher.id}`}
                      >
                        {isCurrent ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  );
                })
              )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── AUTH GATE MODAL ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAuthGateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm text-left">

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-blue-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7"
            >

              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Sign in to ask a teacher
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Create an account or sign in to send questions and receive answers from teachers.
              </p>

              <div className="space-y-2.5">

                <button
                  onClick={() => {
                    setShowAuthGateModal(false);
                    setAuthModalMode('login');
                    setShowAuthModal(true);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  id="auth-gate-signin-btn"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>

                <button
                  onClick={() => {
                    setShowAuthGateModal(false);
                    setAuthModalMode('signup');
                    setShowAuthModal(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  id="auth-gate-signup-btn"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </button>

                <button
                  onClick={() => setShowAuthGateModal(false)}
                  className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer pt-2"
                  id="auth-gate-explore-btn"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Continue Exploring</span>
                </button>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear Chat Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && activeConversation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 text-left shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                Clear this chat?
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                This will delete your conversation history with{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedTeacher?.name || 'this teacher'}
                </span>
                . This action only clears your conversation and cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await clearConversation(activeConversation.id, user.id);
                    setActiveConversationId(null);
                    setShowClearConfirm(false);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-rose-600/20"
                  id="confirm-clear-chat-modal-btn"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Chat</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeacherWorkspace;