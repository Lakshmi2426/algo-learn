import React, { createContext, useContext, useEffect, useState } from 'react';
import { soundManager } from '../utils/audio';

export type ThemeMode = 'light' | 'dark';

export interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY_THEME = 'bst_theme_preference';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      if (typeof document !== 'undefined') {
        const isDomDark =
          document.documentElement.classList.contains('dark') ||
          document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDomDark) return 'dark';
      }
      const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) as ThemeMode;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    } catch {}
    return 'light';
  });

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'ALGOLEARN_THEME_CHANGE') {
        const next = e.data.theme === 'dark' ? 'dark' : 'light';
        setThemeState(next);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-transition');

    if (theme === 'dark') {
      root.classList.add('dark', 'dark-theme');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
      if (document.body) {
        document.body.classList.add('dark', 'dark-theme');
        document.body.setAttribute('data-theme', 'dark');
      }
    } else {
      root.classList.remove('dark', 'dark-theme');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
      if (document.body) {
        document.body.classList.remove('dark', 'dark-theme');
        document.body.setAttribute('data-theme', 'light');
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
      localStorage.setItem('algolearn_theme', theme);
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          { type: 'ALGOLEARN_MODULE_THEME_CHANGED', theme },
          '*'
        );
      }
    } catch {}

    const timer = setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 300);

    return () => clearTimeout(timer);
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    soundManager.playClick();
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    soundManager.playClick();
    const isCurrentlyDark =
      document.documentElement.classList.contains('dark') ||
      document.documentElement.getAttribute('data-theme') === 'dark' ||
      theme === 'dark';
    const nextTheme: ThemeMode = isCurrentlyDark ? 'light' : 'dark';
    setThemeState(nextTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
