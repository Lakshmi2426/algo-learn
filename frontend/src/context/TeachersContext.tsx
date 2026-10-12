import React, { createContext, useContext, useState, useEffect } from 'react';
import { Teacher } from '../types';
import { TEACHERS as DEFAULT_TEACHERS } from '../data/teachersData';

interface TeachersContextType {
  teachers: Teacher[];
  addTeacher: (data: {
    name: string;
    email?: string;
    subject: string;
    description?: string;
    avatarUrl?: string;
  }) => Promise<Teacher>;
  updateTeacher: (id: string, updates: Partial<Teacher>) => Promise<Teacher>;
  deleteTeacher: (id: string) => Promise<boolean>;
  getTeacherById: (id: string) => Teacher | undefined;
}

const TeachersContext = createContext<TeachersContextType | undefined>(undefined);

const GRADIENTS = [
  'from-blue-600 via-indigo-600 to-violet-600',
  'from-blue-700 via-indigo-600 to-indigo-500',
  'from-indigo-600 via-blue-600 to-blue-500',
  'from-blue-600 to-violet-600',
  'from-indigo-700 via-indigo-600 to-violet-600',
  'from-violet-600 via-purple-600 to-indigo-600',
  'from-blue-600 via-cyan-600 to-teal-600',
];

export const TeachersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    if (typeof window !== 'undefined') {
      // One-time purge of seeded mock teachers from localStorage
      if (localStorage.getItem('algolearn_teachers_purged_v2') !== 'true') {
        localStorage.removeItem('algolearn_teachers');
        localStorage.setItem('algolearn_teachers_purged_v2', 'true');
        return [];
      }

      const saved = localStorage.getItem('algolearn_teachers');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter(
              (t: Teacher) =>
                !['teacher-priya', 'teacher-arjun', 'teacher-kavitha', 'teacher-ravi', 'teacher-meera'].includes(t.id) &&
                !['Dr. Priya Sharma', 'Prof. Arjun Mehta', 'Ms. Kavitha Reddy', 'Dr. Ravi Kumar', 'Ms. Meera Nair'].includes(t.name)
            );
            return cleaned;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    return DEFAULT_TEACHERS;
  });

  // Sync from server API on mount
  useEffect(() => {
    fetch('/api/teachers')
      .then((res) => {
        if (!res.ok) throw new Error('API not available');
        return res.json();
      })
      .then((data) => {
        if (data?.teachers && Array.isArray(data.teachers)) {
          const cleaned = data.teachers.filter(
            (t: Teacher) =>
              !['teacher-priya', 'teacher-arjun', 'teacher-kavitha', 'teacher-ravi', 'teacher-meera'].includes(t.id) &&
              !['Dr. Priya Sharma', 'Prof. Arjun Mehta', 'Ms. Kavitha Reddy', 'Dr. Ravi Kumar', 'Ms. Meera Nair'].includes(t.name)
          );
          setTeachers(cleaned);
          localStorage.setItem('algolearn_teachers', JSON.stringify(cleaned));
        }
      })
      .catch((err) => {
        console.log('Using local teachers fallback', err);
      });
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('algolearn_teachers', JSON.stringify(teachers));
    }
  }, [teachers]);

  const addTeacher = async (data: {
    name: string;
    email?: string;
    subject: string;
    description?: string;
    avatarUrl?: string;
  }): Promise<Teacher> => {
    const initials = data.name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'T';

    const randomGradient = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];

    const newTeacher: Teacher = {
      id: 'teacher-' + Date.now(),
      name: data.name.trim(),
      email: data.email?.trim() || `${data.name.toLowerCase().replace(/\s+/g, '.')}@algolearn.edu`,
      subject: data.subject.trim(),
      description: data.description?.trim() || '',
      avatarInitials: initials,
      avatarGradient: randomGradient,
      avatarUrl: data.avatarUrl?.trim() || '',
      createdAt: 'Just now',
    };

    setTeachers((prev) => [newTeacher, ...prev]);

    // Send to backend
    try {
      await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeacher),
      });
    } catch (e) {
      console.log('Teacher saved locally');
    }

    return newTeacher;
  };

  const updateTeacher = async (id: string, updates: Partial<Teacher>): Promise<Teacher> => {
    let updatedObj: Teacher | null = null;

    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const initials = updates.name
            ? updates.name
                .split(' ')
                .filter(Boolean)
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase()
            : t.avatarInitials;

          updatedObj = {
            ...t,
            ...updates,
            avatarInitials: initials || t.avatarInitials,
          };
          return updatedObj;
        }
        return t;
      })
    );

    // Send to backend
    try {
      await fetch(`/api/teachers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.log('Updated locally');
    }

    return updatedObj || (teachers.find((t) => t.id === id) as Teacher);
  };

  const deleteTeacher = async (id: string): Promise<boolean> => {
    // Preserve existing conversations / questions, just delete from active teachers list
    setTeachers((prev) => prev.filter((t) => t.id !== id));

    try {
      await fetch(`/api/teachers/${id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.log('Teacher removed locally');
    }

    return true;
  };

  const getTeacherById = (id: string) => {
    return teachers.find((t) => t.id === id);
  };

  return (
    <TeachersContext.Provider
      value={{
        teachers,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        getTeacherById,
      }}
    >
      {children}
    </TeachersContext.Provider>
  );
};

export const useTeachers = () => {
  const context = useContext(TeachersContext);
  if (!context) {
    throw new Error('useTeachers must be used within a TeachersProvider');
  }
  return context;
};
