import React from 'react';
import { BookOpen, Compass, Settings, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import logoLight from '../../assets/images/logo-light.png';
import logoDark from '../../assets/images/logo-dark.png';
import { NavigationTab } from '../../types';

interface FooterProps {
  setActiveTab: (tab: NavigationTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const navigateTo = (tab: NavigationTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      className="relative bg-[#f8faff] dark:bg-[#030817] text-slate-600 dark:text-[#A5B4CC] pt-16 pb-14 sm:pb-12 overflow-hidden text-left border-t border-slate-200/80 dark:border-[#131b32]/90 shadow-[0_-4px_24px_rgba(37,99,235,0.03)] dark:shadow-[0_-12px_32px_-16px_rgba(3,8,23,0.9)] transition-colors duration-200"
      style={{ backgroundColor: isDark ? '#030817' : '#f8faff' }}
    >
      {/* Top Edge Ambient Highlight Line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#2563EB]/25 dark:via-[#2563EB]/40 to-transparent pointer-events-none" />

      {/* Subtle Radial Blue & Violet Background Glows */}
      <div
        className="absolute inset-0 pointer-events-none -z-0"
        style={{
          backgroundImage: isDark
            ? `
                radial-gradient(circle at 12% 25%, rgba(37, 99, 235, 0.12) 0%, transparent 48%),
                radial-gradient(circle at 88% 75%, rgba(101, 46, 255, 0.10) 0%, transparent 48%),
                radial-gradient(circle at 50% 8%, rgba(22, 139, 255, 0.05) 0%, transparent 55%)
              `
            : `
                radial-gradient(circle at 12% 25%, rgba(37, 99, 235, 0.06) 0%, transparent 50%),
                radial-gradient(circle at 88% 75%, rgba(101, 46, 255, 0.05) 0%, transparent 50%),
                radial-gradient(circle at 50% 8%, rgba(22, 139, 255, 0.03) 0%, transparent 55%)
              `,
        }}
      />

      {/* DSA-Inspired Abstract Graph / Network Connections (Left Edge) */}
      <svg
        className="absolute top-6 left-3 w-64 h-64 pointer-events-none select-none -z-0 opacity-20 dark:opacity-25 hidden sm:block"
        viewBox="0 0 240 240"
        fill="none"
        aria-hidden="true"
      >
        <line x1="20" y1="40" x2="85" y2="85" stroke="#2563EB" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="85" y1="85" x2="160" y2="45" stroke="#2563EB" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="85" y1="85" x2="105" y2="165" stroke="#652EFF" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="160" y1="45" x2="215" y2="105" stroke="#168BFF" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="105" y1="165" x2="185" y2="185" stroke="#2563EB" strokeWidth="1" strokeDasharray="3 3" />

        <circle cx="20" cy="40" r="3.5" fill="#2563EB" fillOpacity="0.6" />
        <circle cx="85" cy="85" r="4.5" fill="#168BFF" fillOpacity="0.8" />
        <circle cx="160" cy="45" r="3" fill="#652EFF" fillOpacity="0.7" />
        <circle cx="105" cy="165" r="3.5" fill="#2563EB" fillOpacity="0.6" />
        <circle cx="215" cy="105" r="2.5" fill="#168BFF" fillOpacity="0.5" />
        <circle cx="185" cy="185" r="3" fill="#652EFF" fillOpacity="0.6" />

        <circle cx="85" cy="85" r="1.5" fill={isDark ? '#FFFFFF' : '#2563EB'} />
        <circle cx="160" cy="45" r="1" fill={isDark ? '#FFFFFF' : '#652EFF'} />
      </svg>

      {/* DSA-Inspired Abstract Graph / Network Connections (Right Edge) */}
      <svg
        className="absolute top-10 right-4 w-64 h-64 pointer-events-none select-none -z-0 opacity-20 dark:opacity-25 hidden sm:block"
        viewBox="0 0 240 240"
        fill="none"
        aria-hidden="true"
      >
        <line x1="215" y1="55" x2="145" y2="95" stroke="#652EFF" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="145" y1="95" x2="75" y2="65" stroke="#2563EB" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="145" y1="95" x2="165" y2="175" stroke="#168BFF" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="75" y1="65" x2="25" y2="125" stroke="#652EFF" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="165" y1="175" x2="105" y2="195" stroke="#2563EB" strokeWidth="1" strokeDasharray="3 3" />

        <circle cx="215" cy="55" r="3" fill="#652EFF" fillOpacity="0.7" />
        <circle cx="145" cy="95" r="4" fill="#2563EB" fillOpacity="0.8" />
        <circle cx="75" cy="65" r="3" fill="#168BFF" fillOpacity="0.6" />
        <circle cx="165" cy="175" r="3.5" fill="#652EFF" fillOpacity="0.7" />
        <circle cx="25" cy="125" r="2.5" fill="#2563EB" fillOpacity="0.5" />
        <circle cx="105" cy="195" r="3" fill="#168BFF" fillOpacity="0.6" />

        <circle cx="145" cy="95" r="1.5" fill={isDark ? '#FFFFFF' : '#652EFF'} />
        <circle cx="165" cy="175" r="1" fill={isDark ? '#FFFFFF' : '#2563EB'} />
      </svg>

      {/* Bottom Abstract Waves (Left: Royal Blue, Right: Dark Violet) */}
      <svg
        className="absolute bottom-0 left-0 w-full md:w-1/2 h-36 pointer-events-none select-none -z-0 opacity-25 dark:opacity-30"
        viewBox="0 0 600 150"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="leftWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity={isDark ? '0.30' : '0.08'} />
            <stop offset="60%" stopColor="#168BFF" stopOpacity={isDark ? '0.10' : '0.04'} />
            <stop offset="100%" stopColor={isDark ? '#030817' : '#f8faff'} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,150 L0,90 Q140,40 300,95 T600,70 L600,150 Z" fill="url(#leftWaveGrad)" />
      </svg>

      <svg
        className="absolute bottom-0 right-0 w-full md:w-1/2 h-36 pointer-events-none select-none -z-0 opacity-25 dark:opacity-30"
        viewBox="0 0 600 150"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="rightWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#652EFF" stopOpacity={isDark ? '0.25' : '0.08'} />
            <stop offset="60%" stopColor="#2563EB" stopOpacity={isDark ? '0.08' : '0.03'} />
            <stop offset="100%" stopColor={isDark ? '#030817' : '#f8faff'} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M600,150 L600,80 Q460,130 300,75 T0,105 L0,150 Z" fill="url(#rightWaveGrad)" />
      </svg>

      {/* Main Four-Column Content Container (91% width, centered) */}
      <div className="w-[91%] max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 items-start pb-10">
          
          {/* COLUMN 1: ALGOLEARN BRANDING */}
          <div className="sm:col-span-2 lg:col-span-5 space-y-5">
            {/* Logo & Tagline */}
            <button
              onClick={() => navigateTo('home')}
              className="group text-left bg-transparent border-0 shadow-none p-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-lg inline-block select-none"
              style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}
              aria-label="AlgoLearn Home"
            >
              {/* Light Mode Logo */}
              <img
                src={logoLight}
                alt="AlgoLearn - YOUR DSA JOURNEY"
                className={`h-10 w-auto object-contain select-none pointer-events-none transition-transform duration-200 group-hover:scale-[1.02] ${isDark ? 'hidden' : 'block'}`}
                style={{ height: '40px', width: 'auto' }}
                draggable={false}
              />
              {/* Dark Mode Logo */}
              <img
                src={logoDark}
                alt="AlgoLearn - YOUR DSA JOURNEY"
                className={`h-10 w-auto object-contain select-none pointer-events-none transition-transform duration-200 group-hover:scale-[1.02] ${isDark ? 'block' : 'hidden'}`}
                style={{ height: '40px', width: 'auto' }}
                draggable={false}
              />
            </button>

            {/* Description */}
            <p className="text-[15.5px] sm:text-[16px] text-slate-600 dark:text-[#A5B4CC] leading-[1.7] max-w-[500px]">
              Interactive Data Structures & Algorithms platform designed for deep conceptual intuition, step-by-step visualizations, and AI-accelerated mastery.
            </p>

            {/* Platform Indicator */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2.5 text-[14px] sm:text-[14.5px] font-semibold text-[#2563EB] dark:text-[#168BFF]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2563EB] dark:bg-[#168BFF] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2563EB] dark:bg-[#168BFF] shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
                </span>
                <span>Core DSA Learning Platform</span>
              </div>
              <div className="w-28 h-[2px] bg-gradient-to-r from-[#2563EB] to-[#652EFF] rounded-full shadow-[0_0_6px_rgba(37,99,235,0.4)]" />
            </div>
          </div>

          {/* COLUMN 2: CURRICULUM */}
          <div className="sm:col-span-1 lg:col-span-3 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-[#08122a] border border-blue-200/80 dark:border-[#2563EB]/35 text-[#2563EB] dark:text-[#168BFF] flex items-center justify-center shadow-xs dark:shadow-[0_0_12px_rgba(37,99,235,0.2)] transition-colors">
                  <BookOpen className="w-4 h-4 text-[#2563EB] dark:text-[#168BFF]" />
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-[1px] uppercase font-mono">
                  CURRICULUM
                </h3>
              </div>
              <div className="w-12 h-[2px] bg-gradient-to-r from-[#2563EB] to-[#652EFF] rounded-full shadow-[0_0_6px_rgba(37,99,235,0.5)]" />
            </div>

            <ul className="space-y-3 pt-1">
              {[
                { label: 'Linear & Binary Search', tab: 'topics' as NavigationTab },
                { label: 'Stack & Queue', tab: 'topics' as NavigationTab },
                { label: 'SLL, DLL & Circular Lists', tab: 'topics' as NavigationTab },
                { label: 'Trees & Binary Search Tree', tab: 'topics' as NavigationTab },
                { label: 'Hashing & Collision Resolution', tab: 'topics' as NavigationTab },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => navigateTo(item.tab)}
                    className="group flex items-center justify-between w-full text-left text-[15px] sm:text-[15.5px] text-slate-600 dark:text-[#A5B4CC] hover:text-[#2563EB] dark:hover:text-[#168BFF] focus-visible:text-[#2563EB] dark:focus-visible:text-white transition-colors duration-200 cursor-pointer py-0.5 outline-none focus-visible:ring-1 focus-visible:ring-[#2563EB] rounded"
                  >
                    <span className="transition-colors duration-200">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-[#652EFF]/80 group-hover:text-[#652EFF] group-hover:translate-x-1 group-hover:drop-shadow-[0_0_6px_rgba(101,46,255,0.7)] transition-all duration-200 shrink-0 ml-2" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMN 3: EXPLORE */}
          <div className="sm:col-span-1 lg:col-span-2 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-[#08122a] border border-blue-200/80 dark:border-[#2563EB]/35 text-[#2563EB] dark:text-[#168BFF] flex items-center justify-center shadow-xs dark:shadow-[0_0_12px_rgba(37,99,235,0.2)] transition-colors">
                  <Compass className="w-4 h-4 text-[#2563EB] dark:text-[#168BFF]" />
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-[1px] uppercase font-mono">
                  EXPLORE
                </h3>
              </div>
              <div className="w-12 h-[2px] bg-gradient-to-r from-[#2563EB] to-[#652EFF] rounded-full shadow-[0_0_6px_rgba(37,99,235,0.5)]" />
            </div>

            <ul className="space-y-3 pt-1">
              {[
                { label: 'All DSA Topics', tab: 'topics' as NavigationTab },
                { label: 'Ask a Teacher', tab: 'ask-teacher' as NavigationTab },
                { label: 'Learner Leaderboard', tab: 'leaderboard' as NavigationTab },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => navigateTo(item.tab)}
                    className="group flex items-center justify-between w-full text-left text-[15px] sm:text-[15.5px] text-slate-600 dark:text-[#A5B4CC] hover:text-[#2563EB] dark:hover:text-[#168BFF] focus-visible:text-[#2563EB] dark:focus-visible:text-white transition-colors duration-200 cursor-pointer py-0.5 outline-none focus-visible:ring-1 focus-visible:ring-[#2563EB] rounded"
                  >
                    <span className="transition-colors duration-200">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-[#652EFF]/80 group-hover:text-[#652EFF] group-hover:translate-x-1 group-hover:drop-shadow-[0_0_6px_rgba(101,46,255,0.7)] transition-all duration-200 shrink-0 ml-2" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMN 4: PLATFORM (ONLY About AlgoLearn) */}
          <div className="sm:col-span-1 lg:col-span-2 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-[#08122a] border border-blue-200/80 dark:border-[#2563EB]/35 text-[#2563EB] dark:text-[#168BFF] flex items-center justify-center shadow-xs dark:shadow-[0_0_12px_rgba(37,99,235,0.2)] transition-colors">
                  <Settings className="w-4 h-4 text-[#2563EB] dark:text-[#168BFF]" />
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-[1px] uppercase font-mono">
                  PLATFORM
                </h3>
              </div>
              <div className="w-12 h-[2px] bg-gradient-to-r from-[#2563EB] to-[#652EFF] rounded-full shadow-[0_0_6px_rgba(37,99,235,0.5)]" />
            </div>

            <ul className="space-y-3 pt-1">
              <li>
                <button
                  onClick={() => navigateTo('about')}
                  className="group flex items-center justify-between w-full text-left text-[15px] sm:text-[15.5px] text-slate-600 dark:text-[#A5B4CC] hover:text-[#2563EB] dark:hover:text-[#168BFF] focus-visible:text-[#2563EB] dark:focus-visible:text-white transition-colors duration-200 cursor-pointer py-0.5 outline-none focus-visible:ring-1 focus-visible:ring-[#2563EB] rounded"
                >
                  <span className="transition-colors duration-200">About AlgoLearn</span>
                  <ChevronRight className="w-4 h-4 text-[#652EFF]/80 group-hover:text-[#652EFF] group-hover:translate-x-1 group-hover:drop-shadow-[0_0_6px_rgba(101,46,255,0.7)] transition-all duration-200 shrink-0 ml-2" />
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* 7. FOOTER DIVIDER */}
        <div className="relative w-full h-[1px] my-8 sm:my-10 bg-slate-200 dark:bg-[#16203a] overflow-hidden transition-colors">
          <div className="absolute inset-x-[15%] sm:inset-x-[25%] top-0 h-[1px] bg-gradient-to-r from-transparent via-[#2563EB] to-[#652EFF] to-transparent opacity-75 dark:opacity-80 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
        </div>

        {/* 8. COPYRIGHT SECTION */}
        <div className="text-center pt-1 pb-4 sm:pb-2">
          <p className="text-[13.5px] text-slate-500 dark:text-[#A5B4CC] font-normal tracking-normal select-none transition-colors">
            © 2026 AlgoLearn. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
