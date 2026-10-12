import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserPlus,
  Edit2,
  Trash2,
  X,
  Mail,
  BookOpen,
  Check,
  AlertTriangle,
  GraduationCap,
  Users,
} from 'lucide-react';
import { useTeachers } from '../../context/TeachersContext';
import { Teacher } from '../../types';

interface AdminTeacherManagementViewProps {
  onBackToDashboard?: () => void;
}

export const AdminTeacherManagementView: React.FC<AdminTeacherManagementViewProps> = () => {
  const { teachers, addTeacher, updateTeacher, deleteTeacher } = useTeachers();

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Dialog state
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenAddModal = () => {
    setEditingTeacher(null);
    setName('');
    setEmail('');
    setSubject('');
    setDescription('');
    setAvatarUrl('');
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setName(teacher.name);
    setEmail(teacher.email || '');
    setSubject(teacher.subject);
    setDescription(teacher.description || '');
    setAvatarUrl(teacher.avatarUrl || '');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please provide the teacher full name.');
      return;
    }
    if (!subject.trim()) {
      setFormError('Please specify the subject or domain expertise.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingTeacher) {
        await updateTeacher(editingTeacher.id, {
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          description: description.trim(),
          avatarUrl: avatarUrl.trim(),
        });
      } else {
        await addTeacher({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          description: description.trim(),
          avatarUrl: avatarUrl.trim(),
        });
      }
      setModalOpen(false);
    } catch (err) {
      setFormError('Failed to save teacher. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!teacherToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTeacher(teacherToDelete.id);
      setTeacherToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Teachers
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-xs font-bold border border-blue-200 dark:border-blue-800">
              {teachers.length} Active
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage expert educators available for student questions. Added teachers instantly appear in the Ask a Teacher workspace.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
          id="admin-add-teacher-btn"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Teacher</span>
        </button>
      </div>

      {/* Teachers Cards Grid */}
      {teachers.length === 0 ? (
        <div className="py-16 px-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            No Teachers Added Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
            There are currently no educators in the system. Click the button below to add faculty members for student questions.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm hover:scale-105"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Teacher</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((teacher) => (
            <motion.div
              key={teacher.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              id={`admin-teacher-card-${teacher.id}`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${teacher.avatarGradient} flex items-center justify-center text-white font-bold text-sm font-mono shadow-xs shrink-0 overflow-hidden`}
                    >
                      {teacher.avatarUrl ? (
                        <img src={teacher.avatarUrl} alt={teacher.name} className="w-full h-full object-cover" />
                      ) : (
                        teacher.avatarInitials
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                        {teacher.name}
                      </h3>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-mono font-semibold flex items-center gap-1 mt-0.5">
                        <BookOpen className="w-3 h-3" />
                        {teacher.subject}
                      </p>
                    </div>
                  </div>
                </div>

                {teacher.email && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono mb-2">
                    <Mail className="w-3 h-3" />
                    {teacher.email}
                  </p>
                )}

                {teacher.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic mb-4">
                    "{teacher.description}"
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEditModal(teacher)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  id={`edit-teacher-${teacher.id}`}
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setTeacherToDelete(teacher)}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  id={`remove-teacher-${teacher.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── ADD / EDIT MODAL ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-blue-200 dark:border-slate-800 shadow-2xl p-6 text-left"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {editingTeacher
                        ? 'Update teacher profile and subject expertise'
                        : 'Introduce an expert educator to the AlgoLearn platform'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveTeacher} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono mb-1.5">
                    Teacher Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Priya Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. priya.sharma@algolearn.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono mb-1.5">
                    Subject / Expertise *
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Data Structures & Algorithms, Binary Search Trees"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono mb-1.5">
                    Optional Profile Photo URL
                  </label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://... (leave blank for generated monogram avatar)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono mb-1.5">
                    Bio / Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief background or areas of mentorship..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    {editingTeacher ? 'Save Changes' : 'Add Teacher'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRMATION DIALOG ─────────────────────────────────────── */}
      <AnimatePresence>
        {teacherToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Remove this teacher?
              </h3>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                {teacherToDelete.name} ({teacherToDelete.subject})
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Existing student conversations will be preserved. This teacher will no longer be available in the student selection menu.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setTeacherToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                  id="confirm-remove-teacher-btn"
                >
                  {isDeleting ? 'Removing...' : 'Remove Teacher'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminTeacherManagementView;
