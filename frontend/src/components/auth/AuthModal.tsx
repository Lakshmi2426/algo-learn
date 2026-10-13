import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Sparkles,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Hash,
  GraduationCap,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { Logo } from '../common/Logo';
import { NavigationTab } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'admin';
  onNavigateTab?: (tab: NavigationTab) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onNavigateTab,
}) => {
  const { login, registerStudent, isRegdNoTaken, loginAsAdmin, recoverSession } = useUser();
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'admin'>(initialMode);

  // Student Sign Up Fields (Strictly: Name, Branch, Registration Number, Password)
  const [signUpName, setSignUpName] = useState('');
  const [signUpBranch, setSignUpBranch] = useState('');
  const [signUpRegdNo, setSignUpRegdNo] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  // Student Sign In Fields (Strictly: Registration Number, Password)
  const [signInRegdNo, setSignInRegdNo] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Admin Login Fields (Strictly: Name, Admin Code)
  const [adminName, setAdminName] = useState('');
  const [adminCode, setAdminCode] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAccountNotFound, setIsAccountNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminSuccess, setAdminSuccess] = useState(false);

  // Sync mode when initialMode changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setAuthMode(initialMode);
      setErrorMessage(null);
      setIsAccountNotFound(false);
      setAdminSuccess(false);
    }
  }, [isOpen, initialMode]);

  // Mode change handler
  const handleModeChange = (mode: 'login' | 'signup' | 'admin') => {
    setAuthMode(mode);
    setErrorMessage(null);
    setIsAccountNotFound(false);
    setAdminSuccess(false);
    if (mode === 'login' && signUpRegdNo.trim() && !signInRegdNo.trim()) {
      setSignInRegdNo(signUpRegdNo.trim().toUpperCase());
    } else if (mode === 'signup' && signInRegdNo.trim() && !signUpRegdNo.trim()) {
      setSignUpRegdNo(signInRegdNo.trim().toUpperCase());
    }
  };

  // Keep registration number and password fields independent
  const handleSignUpRegdNoChange = (val: string) => {
    const uppercaseVal = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setSignUpRegdNo(uppercaseVal);
    if (errorMessage) {
      setErrorMessage(null);
      setIsAccountNotFound(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsAccountNotFound(false);

    // -------------------------------------------------------------
    // ADMIN LOGIN
    // Required fields: Name, Admin Code
    // -------------------------------------------------------------
    if (authMode === 'admin') {
      const cleanAdminName = adminName.trim();
      if (!cleanAdminName) {
        setErrorMessage('Please enter your administrator or staff name.');
        return;
      }

      const cleanAdminCode = adminCode.trim();
      if (!cleanAdminCode) {
        setErrorMessage('Admin Access Code is strictly required.');
        return;
      }

      setIsSubmitting(true);
      const res = await loginAsAdmin(cleanAdminName, cleanAdminCode);
      setIsSubmitting(false);

      if (res.success) {
        setAdminSuccess(true);
        setTimeout(() => {
          setAdminSuccess(false);
          onClose();
          if (onNavigateTab) {
            if (res.role === 'teacher') {
              onNavigateTab('ask-teacher');
            } else {
              onNavigateTab('admin');
            }
          }
        }, 800);
      } else {
        setErrorMessage(res.message || 'Invalid administrator access code or Teacher ID. Access denied.');
      }
      return;
    }

    // -------------------------------------------------------------
    // STUDENT SIGN UP
    // Required fields in order: Name, Branch, Registration Number, Password
    // -------------------------------------------------------------
    if (authMode === 'signup') {
      const cleanName = signUpName.trim();
      if (!cleanName) {
        setErrorMessage('Please enter your full name.');
        return;
      }

      const cleanBranch = signUpBranch.trim();
      if (!cleanBranch) {
        setErrorMessage('Please enter your branch (e.g. 3/4-CSD-A).');
        return;
      }

      const cleanRegdNo = signUpRegdNo.trim().toUpperCase();
      if (!cleanRegdNo) {
        setErrorMessage('Registration Number is required.');
        return;
      }

      const regdRegex = /^[A-Z0-9]{10}$/;
      if (!regdRegex.test(cleanRegdNo) || cleanRegdNo.length !== 10) {
        setErrorMessage(
          'Registration Number must contain exactly 10 characters consisting only of uppercase letters (A–Z) and digits (0–9).'
        );
        return;
      }

      if (isRegdNoTaken(cleanRegdNo)) {
        setErrorMessage('Registration Number is already registered. Please switch to Sign In to access your account.');
        return;
      }

      const cleanPassword = signUpPassword.trim();
      if (!cleanPassword || cleanPassword.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      const password = cleanPassword;

      setIsSubmitting(true);
      const res = await registerStudent({
        name: cleanName,
        branch: cleanBranch,
        regdNo: cleanRegdNo,
        password,
      });
      setIsSubmitting(false);

      if (!res.success) {
        setErrorMessage(res.message || 'Registration failed.');
        return;
      }

      onClose();
      return;
    }

    // -------------------------------------------------------------
    // STUDENT SIGN IN
    // Required fields: Registration Number, Password
    // -------------------------------------------------------------
    if (authMode === 'login') {
      const cleanRegdNo = signInRegdNo.trim().toUpperCase();
      if (!cleanRegdNo) {
        setErrorMessage('Please enter your 10-character Registration Number.');
        return;
      }

      const regdRegex = /^[A-Z0-9]{10}$/;
      if (!regdRegex.test(cleanRegdNo) || cleanRegdNo.length !== 10) {
        setErrorMessage(
          'Registration Number must be exactly 10 uppercase characters (letters A–Z and digits 0–9).'
        );
        return;
      }

      const cleanPassword = signInPassword.trim();
      if (!cleanPassword) {
        setErrorMessage('Please enter your password.');
        return;
      }

      setIsSubmitting(true);
      const res = await login(cleanRegdNo, cleanPassword);
      setIsSubmitting(false);

      if (!res.success) {
        if (res.notFound) {
          setIsAccountNotFound(true);
          setErrorMessage('Account not found. Please sign up first.');
        } else {
          setErrorMessage(res.message || 'Invalid credentials. Please check your password.');
        }
        return;
      }

      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Authentication Modal"
          className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          id="auth-modal-close-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Visual Poster Panel (Col 1-5) */}
        <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 p-8 flex-col justify-between text-white relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-blue-400 mb-6">
              <Sparkles className="w-4 h-4" />
              AlgoLearn Access Portal
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight leading-snug">
              {authMode === 'admin'
                ? 'Institutional Administrator Portal'
                : 'Master algorithms with visual intuition.'}
            </h3>
            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              {authMode === 'admin'
                ? 'Monitor student progress, track cohort milestones, and manage DSA curriculum analytics.'
                : 'Join students and engineers mastering essential data structures and algorithms.'}
            </p>
          </div>

          <div className="relative z-10 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-blue-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>{authMode === 'admin' ? 'Administrative Privileges:' : 'Includes Full Access To:'}</span>
            </div>
            <ul className="text-[11px] text-slate-300 space-y-1">
              {authMode === 'admin' ? (
                <>
                  <li>• Student Learning Progress Dashboard</li>
                  <li>• Cohort Topic Mastery Statistics</li>
                  <li>• Student Question Management & Replies</li>
                </>
              ) : (
                <>
                  <li>• 18 Interactive Data Structure Modules</li>
                  <li>• Direct Ask a Teacher Question System</li>
                  <li>• Streak Tracker & Global Leaderboard</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Right Form Panel (Col 6-12) */}
        <div className="p-6 sm:p-10 md:col-span-7 flex flex-col justify-between text-left max-h-[90vh] overflow-y-auto">
          <div>
            <div className="mb-4 bg-transparent border-0 shadow-none p-0">
              <Logo size="sm" />
            </div>

            {/* Mode switch tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-6 max-w-sm">
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${authMode === 'login'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
                  }`}
                id="auth-tab-login"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('signup')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${authMode === 'signup'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
                  }`}
                id="auth-tab-signup"
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('admin')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${authMode === 'admin'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-blue-600'
                  }`}
                id="auth-tab-admin"
              >
                Admin
              </button>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {authMode === 'login' && 'Welcome Back, Learner'}
              {authMode === 'signup' && 'Create Your Student Account'}
              {authMode === 'admin' && 'Administrator Verification'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
              {authMode === 'login' && 'Sign in with your 10-character Registration Number and password to access your dashboard.'}
              {authMode === 'signup' && 'Register your details to begin tracking your mastery across 18 DSA modules.'}
              {authMode === 'admin' && 'Enter your institutional administrator name and access code.'}
            </p>

            {/* Error Alert */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium">{errorMessage}</span>
                </div>

                {/* Switch to Sign Up option for Account Not Found */}
                {isAccountNotFound && (
                  <button
                    type="button"
                    onClick={() => handleModeChange('signup')}
                    className="self-start ml-6 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    id="switch-to-signup-from-error"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Switch to Sign Up</span>
                  </button>
                )}
              </div>
            )}

            {/* Admin Success Alert */}
            {adminSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Admin credentials verified. Opening Admin Dashboard...</span>
              </div>
            )}

            {/* ======================================================= */}
            {/* FORM 1: STUDENT SIGN UP                                 */}
            {/* Required fields in order: Name, Branch, RegdNo, Password*/}
            {/* ======================================================= */}
            {authMode === 'signup' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Name */}
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5 block">
                    Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={signUpName}
                      onChange={(e) => {
                        setSignUpName(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Enter your full name"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      id="signup-name-input"
                    />
                  </div>
                </div>

                {/* 2. Branch */}
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5 block">
                    Branch
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={signUpBranch}
                      onChange={(e) => {
                        setSignUpBranch(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="e.g. 3/4-CSD-A"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      id="signup-branch-input"
                    />
                  </div>
                </div>

                {/* 3. Registration Number */}
                <div>
                  <label className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5 block">
                    Registration Number (10 Characters)
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={signUpRegdNo}
                      onChange={(e) => handleSignUpRegdNoChange(e.target.value)}
                      placeholder="e.g. 23A91A0501"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase tracking-wider"
                      id="signup-regdno-input"
                    />
                  </div>
                </div>

                {/* 4. Password */}
                <div>
                  <label className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={signUpPassword}
                      onChange={(e) => {
                        setSignUpPassword(e.target.value);
                        if (errorMessage) {
                          setErrorMessage(null);
                          setIsAccountNotFound(false);
                        }
                      }}
                      placeholder="Enter your password (min. 10 chacters)"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      id="signup-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] mt-3 cursor-pointer"
                  id="auth-submit-btn"
                >
                  <span>{isSubmitting ? 'Creating Account...' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-3">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      if (signUpRegdNo) setSignInRegdNo(signUpRegdNo.trim().toUpperCase());
                      handleModeChange('login');
                    }}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                    id="switch-to-login-link"
                  >
                    Sign In
                  </button>
                </p>
              </form>
            )}

            {/* ======================================================= */}
            {/* FORM 2: STUDENT SIGN IN                                 */}
            {/* Required fields: Registration Number, Password          */}
            {/* ======================================================= */}
            {authMode === 'login' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Registration Number */}
                <div>
                  <label className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5 block">
                    Registration Number
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={signInRegdNo}
                      onChange={(e) => {
                        const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
                        setSignInRegdNo(clean);
                        if (errorMessage) {
                          setErrorMessage(null);
                          setIsAccountNotFound(false);
                        }
                      }}
                      placeholder="e.g. 23A91A0501"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase tracking-wider"
                      id="signin-regdno-input"
                    />
                  </div>
                </div>

                {/* 2. Password */}
                <div>
                  <label className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={signInPassword}
                      onChange={(e) => {
                        setSignInPassword(e.target.value);
                        if (errorMessage) {
                          setErrorMessage(null);
                          setIsAccountNotFound(false);
                        }
                      }}
                      placeholder="Enter your password"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      id="signin-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Your password is initially your 10-character Registration Number. Contact your administrator if you need a reset.')}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] mt-3 cursor-pointer"
                  id="auth-submit-btn"
                >
                  <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-3">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      if (signInRegdNo) setSignUpRegdNo(signInRegdNo.trim().toUpperCase());
                      handleModeChange('signup');
                    }}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                    id="switch-to-signup-link"
                  >
                    Sign Up
                  </button>
                </p>
              </form>
            )}

            {/* ======================================================= */}
            {/* FORM 3: ADMIN LOGIN                                     */}
            {/* Required fields: Name, Admin Code                       */}
            {/* ======================================================= */}
            {authMode === 'admin' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Name */}
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5 block">
                    Staff / Teacher Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => {
                        setAdminName(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="e.g. Dr. Priya Sharma or Prof. Arjun Mehta"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      id="admin-name-input"
                    />
                  </div>
                </div>

                {/* 2. Admin Code */}
                <div>
                  <label className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase mb-1.5 block">
                    Admin Access Code
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={adminCode}
                      onChange={(e) => {
                        setAdminCode(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Enter admin access code"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      id="admin-access-code-input"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] mt-3 cursor-pointer"
                  id="auth-submit-btn"
                >
                  <span>{isSubmitting ? 'Verifying Admin...' : 'Verify & Access Admin Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Switch to Admin or Student */}
            <div className="mt-5 text-center">
              {authMode !== 'admin' ? (
                <button
                  type="button"
                  onClick={() => handleModeChange('admin')}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  id="switch-to-admin-link"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Institutional Staff? Login as Admin</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  id="switch-to-student-link"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Return to Student Login</span>
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400">
            By signing in, you agree to AlgoLearn's Terms of Pedagogy and Privacy Policy.
          </div>
        </div>
      </motion.div>
    </div>
  );
};
