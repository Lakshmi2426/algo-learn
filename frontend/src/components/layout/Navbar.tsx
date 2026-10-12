import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { BrandLogo } from '../common/BrandLogo';
import { UserAvatar } from '../common/UserAvatar';
import { NavigationTab } from '../../types';

interface NavbarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  onOpenAuth?: (mode: 'login' | 'signup' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAuth }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, role, isAuthenticated, logout, setShowAuthModal, setAuthModalMode } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: { id: NavigationTab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'topics', label: 'Topics' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'ask-teacher', label: 'Ask a Teacher' },
    { id: 'about', label: 'About' },
  ];

  // If authenticated as admin, include Admin Dashboard in the visible tabs
  const fullNavItems = (isAuthenticated && role === 'admin')
    ? [...navItems, { id: 'admin' as NavigationTab, label: 'Admin Dashboard' }]
    : navItems;

  const handleAuthClick = (mode: 'login' | 'signup' | 'admin') => {
    if (onOpenAuth) {
      onOpenAuth(mode);
    } else {
      setAuthModalMode(mode);
      setShowAuthModal(true);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-[#05070a]/90 backdrop-blur-md shadow-xs dark:shadow-slate-950/40 border-b border-slate-200 dark:border-slate-800/80 py-3'
          : 'bg-white/95 dark:bg-[#05070a]/50 backdrop-blur-sm py-4 border-b border-slate-200/60 dark:border-slate-800/40'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Pure AlgoLearn Brand Logo (Rectangular, no circular avatar wrapper, no box, no background) */}
        <button
          onClick={() => {
            setActiveTab('home');
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          className="flex items-center group text-left bg-transparent border-0 shadow-none p-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md shrink-0"
          style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}
          id="nav-logo-btn"
          aria-label="AlgoLearn Home"
        >
          <BrandLogo size="md" />
        </button>

        {/* Center: Clean Navigation */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {fullNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  window.scrollTo({ top: 0, behavior: 'instant' });
                }}
                className={`relative py-1 text-sm font-medium transition-colors duration-200 cursor-pointer ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                id={`nav-link-${item.id}`}
              >
                <span className="flex items-center gap-1.5">
                  {item.id === 'admin' && <Shield className="w-3.5 h-3.5 text-blue-500" />}
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeNavUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:to-blue-400 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Side: Theme Toggle + Auth / Profile */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Dark/Light Theme"
            className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
            id="theme-toggle-btn"
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === 'dark' ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center pointer-events-none"
            >
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-blue-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </motion.div>
          </button>

          {/* User Auth / Profile Avatar (Circular, strictly distinct from BrandLogo) */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-blue-500/40 transition-all focus:outline-none cursor-pointer"
                id="user-menu-btn"
                aria-label="User Account Menu"
              >
                <UserAvatar src={user.avatar} name={user.name} size="sm" />
              </button>

              {/* User Dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/90 dark:border-slate-800 shadow-xl p-2 z-50 backdrop-blur-xl text-left"
                  >
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                          {user.name}
                        </p>
                        {role === 'admin' && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[9px] font-bold">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                        {role === 'admin' ? 'Administrator' : (user.regdNo || user.username)}
                      </p>
                    </div>

                    <div className="py-1 space-y-0.5">
                      {role === 'admin' && (
                        <button
                          onClick={() => {
                            setActiveTab('admin');
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors text-left font-bold cursor-pointer"
                        >
                          <Shield className="w-4 h-4 text-blue-500" />
                          Admin Dashboard
                        </button>
                      )}
                    </div>

                    <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors text-left cursor-pointer"
                        id="navbar-signout-btn"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAuthClick('login')}
                className="px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                id="login-cta-btn"
              >
                Login
              </button>
              <button
                onClick={() => handleAuthClick('signup')}
                className="px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white shadow-sm shadow-blue-600/20 transition-all hover:scale-105 cursor-pointer"
                id="signup-cta-btn"
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Mobile Hamburger Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/95 dark:backdrop-blur-xl px-4 pt-3 pb-6 space-y-2"
            style={{ backgroundColor: theme === 'dark' ? undefined : '#ffffff' }}
          >
            {fullNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {item.id === 'admin' && <Shield className="w-4 h-4" />}
                    {item.label}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

