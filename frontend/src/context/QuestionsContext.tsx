import React, { createContext, useContext, useState, useEffect } from 'react';
import { StudentQuestion, TeacherMessage } from '../types';
import { useUser } from './UserContext';
import { apiUrl } from '../config/api';

const INITIAL_QUESTIONS: StudentQuestion[] = [];

interface QuestionsContextType {
  questions: StudentQuestion[];
  sendQuestion: (params: {
    teacherId: string;
    teacherName: string;
    teacherSubject: string;
    topicTitle?: string;
    message: string;
    questionId?: string;
  }) => Promise<StudentQuestion>;
  sendAnswer: (params: {
    questionId: string;
    answer: string;
    teacherName?: string;
  }) => Promise<void>;
  clearConversation: (questionId: string, studentId?: string) => Promise<void>;
  getStudentQuestions: () => StudentQuestion[];
}

const QuestionsContext = createContext<QuestionsContextType | undefined>(undefined);

export const QuestionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role } = useUser();
  const [questions, setQuestions] = useState<StudentQuestion[]>(() => {
    if (typeof window !== 'undefined') {
      // One-time purge of seeded mock questions from localStorage
      if (localStorage.getItem('algolearn_questions_purged_v2') !== 'true') {
        localStorage.removeItem('algolearn_student_questions');
        localStorage.setItem('algolearn_questions_purged_v2', 'true');
        return [];
      }

      const saved = localStorage.getItem('algolearn_student_questions');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const cleaned = parsed
              .filter(
                (q: StudentQuestion) =>
                  !['q-101', 'q-102', 'q-103', 'q-104'].includes(q.id) &&
                  !['Rahul Sharma', 'Ananya Patel', 'Marcus Vance'].includes(q.studentName)
              )
              .map((q: StudentQuestion) => ({
                ...q,
                studentAvatar: q.studentAvatar && q.studentAvatar.includes('unsplash.com') ? '' : q.studentAvatar,
              }));
            return cleaned;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    return INITIAL_QUESTIONS;
  });

  // Try to fetch questions from backend on mount
  useEffect(() => {
    fetch(apiUrl('/api/questions'))
      .then((res) => res.json())
      .then((data) => {
        if (data?.questions && Array.isArray(data.questions)) {
          const cleanServer = data.questions.filter(
            (q: StudentQuestion) =>
              !['q-101', 'q-102', 'q-103', 'q-104'].includes(q.id) &&
              !['Rahul Sharma', 'Ananya Patel', 'Marcus Vance'].includes(q.studentName)
          );
          setQuestions((prev) => {
            const ids = new Set(cleanServer.map((q: StudentQuestion) => q.id));
            const localOnly = prev.filter((q) => !ids.has(q.id));
            const merged = [...cleanServer, ...localOnly];
            localStorage.setItem('algolearn_student_questions', JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch((err) => {
        // Backend fallback - gracefully use local state
        console.log('Using local questions storage fallback', err);
      });
  }, []);

  // Save to localStorage whenever questions change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('algolearn_student_questions', JSON.stringify(questions));
    }
  }, [questions]);

  const sendQuestion = async (params: {
    teacherId: string;
    teacherName: string;
    teacherSubject: string;
    topicTitle?: string;
    message: string;
    questionId?: string;
  }): Promise<StudentQuestion> => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // If an existing conversation ID is provided and found, append the student's message
    if (params.questionId) {
      const existing = questions.find((q) => q.id === params.questionId);
      if (existing) {
        const studentMsg: TeacherMessage = {
          messageId: 'msg-' + Date.now(),
          conversationId: existing.id,
          senderId: user.id || 'std-current',
          senderRole: 'student',
          senderName: user.name || 'You',
          message: params.message,
          createdAt: timeStr,
        };

        const updatedQ: StudentQuestion = {
          ...existing,
          status: 'Pending',
          updatedAt: 'Today, ' + timeStr,
          messages: [...existing.messages, studentMsg],
        };

        setQuestions((prev) => prev.map((q) => (q.id === existing.id ? updatedQ : q)));

        try {
          await fetch(apiUrl('/api/questions'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questionId: existing.id,
              studentId: user.id,
              studentName: user.name,
              studentAvatar: user.avatar,
              teacherId: params.teacherId,
              teacherName: params.teacherName,
              teacherSubject: params.teacherSubject,
              topicTitle: params.topicTitle || existing.topicTitle,
              message: params.message,
            }),
          });
        } catch (e) {
          console.log('Saved to local storage fallback');
        }

        return updatedQ;
      }
    }

    const newId = 'q-' + Date.now();
    const newQuestion: StudentQuestion = {
      id: newId,
      studentId: user.id || 'std-current',
      studentName: user.name || 'Algo Learner',
      studentAvatar: user.avatar || '',
      teacherId: params.teacherId,
      teacherName: params.teacherName,
      teacherSubject: params.teacherSubject,
      topicTitle: params.topicTitle || 'DSA Question',
      status: 'Pending',
      createdAt: 'Today, ' + timeStr,
      updatedAt: 'Today, ' + timeStr,
      messages: [
        {
          messageId: 'msg-' + Date.now(),
          conversationId: newId,
          senderId: user.id || 'std-current',
          senderRole: 'student',
          senderName: user.name || 'You',
          message: params.message,
          createdAt: timeStr,
        },
      ],
    };

    // Update local state immediately for responsive UI
    setQuestions((prev) => [newQuestion, ...prev]);

    // Send to server backend
    try {
      await fetch(apiUrl('/api/questions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          studentName: user.name,
          studentAvatar: user.avatar,
          teacherId: params.teacherId,
          teacherName: params.teacherName,
          teacherSubject: params.teacherSubject,
          topicTitle: params.topicTitle,
          message: params.message,
        }),
      });
    } catch (e) {
      console.log('Saved to local storage fallback');
    }

    return newQuestion;
  };

  const sendAnswer = async (params: {
    questionId: string;
    answer: string;
    teacherName?: string;
  }): Promise<void> => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === params.questionId) {
          const teacherReply: TeacherMessage = {
            messageId: 'msg-reply-' + Date.now(),
            conversationId: q.id,
            senderId: q.teacherId,
            senderRole: 'teacher',
            senderName: params.teacherName || (user.name && user.name !== 'System Administrator' ? user.name : q.teacherName) || user.name,
            message: params.answer,
            createdAt: timeStr,
          };
          return {
            ...q,
            status: 'Answered',
            updatedAt: 'Today, ' + timeStr,
            messages: [...q.messages, teacherReply],
          };
        }
        return q;
      })
    );

    // Call server backend
    try {
      await fetch(apiUrl(`/api/questions/${params.questionId}/reply`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: params.answer,
          teacherName: params.teacherName || (user.name && user.name !== 'System Administrator' ? user.name : undefined),
        }),
      });
    } catch (e) {
      console.log('Answer saved to local storage fallback');
    }
  };

  const clearConversation = async (questionId: string, studentId?: string): Promise<void> => {
    const targetQ = questions.find((q) => q.id === questionId);
    if (!targetQ) return;

    // Validate ownership: student can only clear their own conversation, admin can clear any
    const effectiveStudentId = studentId || user.id;
    const isOwner =
      role === 'admin' ||
      targetQ.studentId === effectiveStudentId ||
      targetQ.studentName === user.name ||
      targetQ.studentId === 'std-current';

    if (!isOwner) {
      console.warn('Unauthorized clearConversation: student does not own this conversation');
      return;
    }

    // Immediately remove from visible questions
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));

    try {
      await fetch(
        apiUrl(`/api/questions/${questionId}?studentId=${encodeURIComponent(effectiveStudentId)}&studentName=${encodeURIComponent(user.name)}`),
        { method: 'DELETE' }
      );
    } catch (e) {
      console.log('Cleared from local storage fallback');
    }
  };

  const getStudentQuestions = () => {
    // Return all questions for the current user, or questions created by student
    return questions.filter((q) => q.studentId === user.id || q.studentName === user.name);
  };

  return (
    <QuestionsContext.Provider
      value={{
        questions,
        sendQuestion,
        sendAnswer,
        clearConversation,
        getStudentQuestions,
      }}
    >
      {children}
    </QuestionsContext.Provider>
  );
};

export const useQuestions = () => {
  const context = useContext(QuestionsContext);
  if (!context) {
    throw new Error('useQuestions must be used within a QuestionsProvider');
  }
  return context;
};
