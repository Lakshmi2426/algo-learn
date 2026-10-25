import React, { useState } from 'react';
import {
  LayoutGrid,
  BookOpen,
  Sparkles,
  Gamepad2,
  HelpCircle,
  TrendingUp,
  X,
} from 'lucide-react';
import { MainViewTab } from '../types/game';
import { progressManager } from '../utils/progressManager';
import { soundManager } from '../utils/audio';
import { useTheme } from '../utils/themeContext';
import { AlgoLearnLogo } from './AlgoLearnLogo';

export interface SidebarNavProps {
  activeTab: MainViewTab;
  onChangeTab: (tab: MainViewTab) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isDesktopOpen?: boolean;
  onToggleDesktopCollapse?: () => void;
  onOpenHelpModal?: () => void;
  onOpenSettingsModal?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onChangeTab,
  isOpenMobile = false,
  onCloseMobile,
  isDesktopOpen = true,
  onToggleDesktopCollapse,
}) => {
  const { theme } = useTheme();
  const [stats, setStats] = React.useState(() => progressManager.getStats());
  const [isProgressHovered, setIsProgressHovered] = useState(false);

  React.useEffect(() => {
    const unsub = progressManager.subscribe(() => {
      setStats(progressManager.getStats());
    });
    return unsub;
  }, []);

  const navItems = [
    {
      id: 'HOME' as MainViewTab,
      label: 'Overview',
      icon: LayoutGrid,
      badge: 'Overview',
      badgeClass: 'bg-slate-100 dark:bg-blue-950/40 text-slate-600 dark:text-blue-300 border border-slate-200 dark:border-blue-900/30',
      alwaysShowBadge: false,
    },
    {
      id: 'THEORY' as MainViewTab,
      label: 'Learn',
      icon: BookOpen,
      badge: `${stats.theory.completed} / 15`,
      badgeClass: 'bg-[#EFF6FF] dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-300 border border-[#DBEAFE] dark:border-blue-900/30 font-mono',
      alwaysShowBadge: false,
    },
    {
      id: 'VIDEO' as MainViewTab,
      label: 'Visualize',
      icon: Sparkles,
      badge: `${progressManager.getCategoryScore('visualize')} / 10`,
      badgeClass: 'bg-[#EFF6FF] dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-300 border border-[#DBEAFE] dark:border-blue-900/30 font-mono',
      alwaysShowBadge: false,
    },
    {
      id: 'GAME' as MainViewTab,
      label: 'Game',
      icon: Gamepad2,
      badge: `${progressManager.getCategoryScore('game')} / 60`,
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20 font-mono',
      alwaysShowBadge: false,
    },
    {
      id: 'QUIZ' as MainViewTab,
      label: 'Quiz',
      icon: HelpCircle,
      badge: `${progressManager.getCategoryScore('quiz')} / 30`,
      badgeClass: 'bg-[#EFF6FF] dark:bg-blue-900/40 text-[#2563EB] dark:text-blue-300 border border-[#DBEAFE] dark:border-blue-900/30 font-mono',
      alwaysShowBadge: false,
    },
    {
      id: 'PROGRESS' as MainViewTab,
      label: 'Progress',
      icon: TrendingUp,
      badge: `${stats.percentage}%`,
      badgeClass: 'bg-[#EFF6FF] dark:bg-blue-800/40 text-[#2563EB] dark:text-blue-200 font-bold border border-[#DBEAFE] dark:border-blue-900/40 font-mono',
      alwaysShowBadge: false,
    },
  ];

  const handleSelect = (tab: MainViewTab) => {
    soundManager.playNav();
    onChangeTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleClose = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
    if (onToggleDesktopCollapse) {
      onToggleDesktopCollapse();
    }
  };

  const content = (
    <aside
      id="app-sidebar-navigation"
      className="w-64 h-full h-[100vh] min-h-[100vh] flex flex-col bg-white dark:bg-[#070B18] border-r border-slate-200 dark:border-blue-900/30 select-none shadow-xs transition-colors duration-300 m-0 p-0"
    >
      {/* Top Sidebar Header with Brand Logo (left) & Close Button (right) - Aligned with TopHeader height */}
      <div className="h-14 sm:h-16 px-4 border-b border-slate-200 dark:border-blue-900/30 flex items-center justify-between shrink-0 bg-white dark:bg-[#070B18] m-0">
        <div className="flex items-center min-w-0 pr-2">
          <AlgoLearnLogo
            theme={theme}
            onClick={() => handleSelect('HOME')}
            className="h-8 w-auto"
            imgClassName="h-7 sm:h-8 w-auto"
          />
        </div>
        {/* Close Button in Top-Right Corner of Navigation */}
        <button
          id="btn-sidebar-close"
          onClick={handleClose}
          className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100/80 hover:bg-slate-200/80 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 border border-slate-200/90 dark:border-blue-900/40 rounded-xl transition-all duration-150 cursor-pointer shadow-xs flex items-center justify-center shrink-0"
          aria-label="Close navigation menu"
          title="Close Navigation (✕)"
        >
          <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>
      </div>

      {/* Navigation Item List - Fills remaining vertical space to bottom of viewport */}
      <div
        className="flex-1 px-3 py-3 space-y-1 overflow-y-auto overflow-x-hidden m-0"
        onMouseEnter={() => setIsProgressHovered(true)}
        onMouseLeave={() => setIsProgressHovered(false)}
      >
        {/* SINGLE NAVIGATION MENU HEADING */}
        <div className="px-3 pb-2 pt-1 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase font-mono">
          NAVIGATION MENU
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === 'GAME' && activeTab === 'QUEST');

          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id.toLowerCase()}`}
              onClick={() => handleSelect(item.id)}
              className={`group w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-[#EFF6FF] dark:bg-blue-950/40 text-[#2563EB] dark:text-blue-300 font-semibold shadow-xs dark:shadow-[0_0_14px_rgba(37,99,235,0.18)] border border-[#BFDBFE] dark:border-blue-700/40'
                  : 'text-[#475569] dark:text-slate-400 hover:bg-[#F8FAFF] dark:hover:bg-blue-950/20 hover:text-[#2563EB] dark:hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-1.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-blue-950/30 text-slate-500 dark:text-slate-400 group-hover:text-[#2563EB] dark:group-hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-sans">{item.label}</span>
              </div>

              {/* Detailed progress values are hidden by default and smoothly fade in on hover */}
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition-opacity duration-200 ease-in-out ${item.badgeClass} ${
                  item.alwaysShowBadge ? 'opacity-100' : isProgressHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                {item.badge}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar - Full height panel spanning top-0 to bottom-0 */}
      <div
        id="app-sidebar-container"
        className={`hidden lg:block fixed top-0 left-0 bottom-0 h-screen h-[100vh] min-h-[100vh] z-30 transition-all duration-300 ease-in-out m-0 p-0 ${
          isDesktopOpen
            ? 'w-64 opacity-100 translate-x-0 pointer-events-auto'
            : 'w-0 opacity-0 -translate-x-full pointer-events-none overflow-hidden'
        }`}
      >
        {content}
      </div>

      {/* Mobile Drawer Overlay - Fixed to viewport */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex m-0 p-0">
          <div
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-xs animate-fadeIn"
            onClick={onCloseMobile}
          />
          <div
            id="app-sidebar-container"
            className="relative z-10 w-64 h-full h-[100vh] min-h-[100vh] bg-white dark:bg-[#070B18] shadow-xl animate-slideRight flex flex-col m-0 p-0"
          >
            {content}
          </div>
        </div>
      )}
    </>
  );
};
