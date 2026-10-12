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
  const { user, role, isAuthenticated } = useUser();
  const [questions, setQuestions] = useState<StudentQuestion[]>(() => {
    if (typeof window !== 'undefined' && user?.id) {
      const studentStorageKey = `algolearn_student_questions_${user.id}`;
      const saved = localStorage.getItem(studentStorageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    return INITIAL_QUESTIONS;
  });

  // Synchronize questions when authenticated student changes or logs out
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!isAuthenticated || !user?.id) {
      // Clear questions from state when not authenticated or logged out
      setQuestions([]);
      return;
    }

    const studentStorageKey = `algolearn_student_questions_${user.id}`;
    const token = localStorage.getItem('algolearn_token');

    // 1. Load this student's cached conversations if present
    const saved = localStorage.getItem(studentStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setQuestions(parsed);
        }
      } catch (e) {}
    }

    // 2. Fetch authenticated student's private conversations from backend
    fetch(apiUrl('/api/questions'), {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('API unavailable');
        return res.json();
      })
      .then((data) => {
        if (data?.questions && Array.isArray(data.questions)) {
          // Strictly ensure conversations belong to this student if not admin
          const filtered = role === 'admin'
            ? data.questions
            : data.questions.filter((q: StudentQuestion) => q.studentId === user.id);

          setQuestions(filtered);
          localStorage.setItem(studentStorageKey, JSON.stringify(filtered));
        }
      })
      .catch((err) => {
        console.log('Using local questions storage fallback', err);
      });
  }, [user?.id, isAuthenticated, role]);

  // Listen for student logout event to immediately clear chat state
  useEffect(() => {
    const handleLogout = () => {
      setQuestions([]);
    };

    window.addEventListener('algolearn_student_logged_out', handleLogout);
    return () => {
      window.removeEventListener('algolearn_student_logged_out', handleLogout);
    };
  }, []);

  // Save to private student storage whenever questions change
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.id && isAuthenticated) {
      const studentStorageKey = `algolearn_student_questions_${user.id}`;
      localStorage.setItem(studentStorageKey, JSON.stringify(questions));
    }
  }, [questions, user?.id, isAuthenticated]);

  const sendQuestion = async (params: {
    teacherId: string;
    teacherName: string;
    teacherSubject: string;
    topicTitle?: string;
    message: string;
    questionId?: string;
  }): Promise<StudentQuestion> => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const token = typeof window !== 'undefined' ? localStorage.getItem('algolearn_token') : null;

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
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: 'include',
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
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('algolearn_token') : null;

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
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
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
      targetQ.studentId === 'std-current';

    if (!isOwner) {
      console.warn('Unauthorized clearConversation: student does not own this conversation');
      return;
    }

    // Immediately remove from visible questions
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));

    const token = typeof window !== 'undefined' ? localStorage.getItem('algolearn_token') : null;
    try {
      await fetch(
        apiUrl(`/api/questions/${questionId}`),
        {
          method: 'DELETE',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
        }
      );
    } catch (e) {
      console.log('Cleared from local storage fallback');
    }
  };

  const getStudentQuestions = () => {
    // Return conversations belonging strictly to current student
    if (!user.id) return [];
    return questions.filter((q) => q.studentId === user.id);
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
