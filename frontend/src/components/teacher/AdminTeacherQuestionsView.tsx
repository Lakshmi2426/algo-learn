import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  MessageSquare,
  ArrowLeft,
  Send,
  User,
  CheckCircle2,
  BookOpen,
  Search,
  Check,
  Trash2,
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useQuestions } from '../../context/QuestionsContext';
import { UserAvatar } from '../common/UserAvatar';
import { NavigationTab } from '../../types';

interface AdminTeacherQuestionsViewProps {
  setActiveTab?: (tab: NavigationTab) => void;
  showHeader?: boolean;
}

export const AdminTeacherQuestionsView: React.FC<AdminTeacherQuestionsViewProps> = ({
  showHeader = false,
}) => {
  const { user } = useUser();
  const { questions, sendAnswer, clearConversation } = useQuestions();

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Answered'>('All');

  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId) || null;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topicTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.messages.some((m) => m.message.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = questions.filter((q) => q.status === 'Pending').length;
  const answeredCount = questions.filter((q) => q.status === 'Answered').length;

  const handleOpenQuestion = (questionId: string) => {
    setSelectedQuestionId(questionId);
    setAnswerText('');
    setSentSuccess(false);
  };

  const handleSendAnswer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!answerText.trim() || !selectedQuestion || isSubmitting) return;

    setIsSubmitting(true);
    await sendAnswer({
      questionId: selectedQuestion.id,
      answer: answerText.trim(),
      teacherName: user.name && user.name.trim() ? user.name : (selectedQuestion.teacherName || 'Instructor'),
    });

    setIsSubmitting(false);
    setAnswerText('');
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendAnswer();
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Optional Standalone Header (without duplicate avatar) */}
      {showHeader && (
        <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Student Questions
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Questions asked by students. Review student queries, view conversation history, and reply directly.
          </p>
        </div>
      )}

      {/* ── CONVERSATION / ANSWER VIEW ────────────────────────────────────── */}
      {selectedQuestion ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/90 dark:border-slate-800 shadow-sm overflow-hidden"
        >
          {/* Conversation Header */}
          <div className="p-5 sm:p-6 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedQuestionId(null)}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                id="back-to-questions-btn"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Questions</span>
              </button>

              <UserAvatar
                src={selectedQuestion.studentAvatar}
                name={selectedQuestion.studentName}
                size="md"
              />

              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Student: {selectedQuestion.studentName}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      selectedQuestion.status === 'Answered'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30'
                    }`}
                  >
                    {selectedQuestion.status}
                  </span>
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                    <BookOpen className="w-3 h-3" /> Topic: {selectedQuestion.topicTitle}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Asked to: {selectedQuestion.teacherName}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (confirm('Delete this question conversation?')) {
                  clearConversation(selectedQuestion.id);
                  setSelectedQuestionId(null);
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
              title="Delete Question"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Question</span>
            </button>
          </div>

          {/* Conversation Messages */}
          <div className="p-5 sm:p-6 space-y-4 max-h-[480px] overflow-y-auto bg-[#fafcff] dark:bg-[#060b17]">
            {selectedQuestion.messages.map((msg) => {
              const isStudent = msg.senderRole === 'student';
              return (
                <div
                  key={msg.messageId}
                  className={`flex flex-col ${isStudent ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">
                      {isStudent ? `Student: ${msg.senderName}` : `Teacher: ${msg.senderName}`}
                    </span>
                    <span className="text-[10px] text-slate-400">{msg.createdAt}</span>
                  </div>

                  <div
                    className={`p-4 rounded-2xl max-w-2xl text-sm leading-relaxed ${
                      isStudent
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-2xs rounded-tl-sm'
                        : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xs rounded-tr-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Teacher Reply Input */}
          <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            {sentSuccess && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Answer delivered successfully! The student can now see your reply.</span>
              </div>
            )}

            <form onSubmit={handleSendAnswer} className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Reply as {user.name || 'Teacher'}
              </label>
              <textarea
                ref={textareaRef}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write your explanation or answer to this student's question..."
                rows={3}
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                id="teacher-reply-textarea"
              />

              <div className="flex items-center justify-between">
                <p className="text-[11px] text-slate-400">
                  Press Enter to send · Shift + Enter for new line
                </p>

                <button
                  type="submit"
                  disabled={!answerText.trim() || isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                  id="admin-send-answer-btn"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Answer</span>
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      ) : (
        /* ── QUESTIONS LIST VIEW ─────────────────────────────────────────── */
        <div className="space-y-6">
          {/* Quick Metrics & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Filter tabs */}
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 max-w-sm">
              <button
                onClick={() => setStatusFilter('All')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'All'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                All ({questions.length})
              </button>
              <button
                onClick={() => setStatusFilter('Pending')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'Pending'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter('Answered')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'Answered'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Answered ({answeredCount})
              </button>
            </div>

            {/* Search input */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions by student, topic..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Questions Cards List */}
          {filteredQuestions.length > 0 ? (
            <div className="space-y-3">
              {filteredQuestions.map((q) => {
                const firstStudentMsg =
                  q.messages.find((m) => m.senderRole === 'student')?.message || '';
                return (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition-all text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    id={`question-card-${q.id}`}
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      {/* Student info & Topic */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <UserAvatar
                          src={q.studentAvatar}
                          name={q.studentName}
                          size="xs"
                        />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Student: {q.studentName}
                        </h3>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-semibold flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          Topic: {q.topicTitle}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            q.status === 'Answered'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30'
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>

                      {/* Question excerpt */}
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 italic font-sans pl-2.5 border-l-2 border-blue-500/50">
                        "{firstStudentMsg}"
                      </p>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Asked to: {q.teacherName}
                        </span>
                        <span>•</span>
                        <span>{q.createdAt}</span>
                        <span>•</span>
                        <span>
                          {q.messages.length} {q.messages.length === 1 ? 'message' : 'messages'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenQuestion(q.id)}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                      >
                        View Question
                      </button>
                      <button
                        onClick={() => handleOpenQuestion(q.id)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-xs transition-all hover:scale-105 cursor-pointer"
                      >
                        {q.status === 'Answered' ? 'View Conversation' : 'Answer'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this question?')) {
                            clearConversation(q.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Delete question"
                        id={`delete-question-${q.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No student questions found.
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                New questions asked by students will appear here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminTeacherQuestionsView;
