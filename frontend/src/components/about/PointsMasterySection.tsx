import React from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  Eye,
  Gamepad2,
  BrainCircuit,
  Target,
  Workflow,
  Sliders,
  Star,
  ArrowDown,
  XCircle,
  Lightbulb,
} from 'lucide-react';

export const PointsMasterySection: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#030718] border border-blue-200/90 dark:border-blue-600/50 p-5 sm:p-6 lg:p-7 shadow-[0_10px_30px_rgba(30,58,138,0.08)] dark:shadow-[0_0_35px_rgba(30,58,138,0.22)] relative overflow-hidden text-[#0F172A] dark:text-white transition-colors duration-300"
    >
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-600/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-violet-600/10 dark:bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* ─── 1. SECTION HEADER ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        {/* Royal Blue & Violet Trophy Icon Badge */}
        <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-[1px] shadow-[0_0_18px_rgba(37,99,235,0.35)] shrink-0 flex items-center justify-center">
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        {/* Header Typography */}
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight flex items-center gap-2 flex-wrap">
            <span className="text-[#0F172A] dark:text-white">Points &amp;</span>{' '}
            <span className="text-blue-600 dark:text-blue-400">Mastery</span>{' '}
            <span className="text-violet-600 dark:text-violet-400">Rules</span>
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1">
            Every topic is worth{' '}
            <span className="text-blue-600 dark:text-blue-400 font-extrabold">100 points.</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Points are distributed across visualizations, games, and quizzes based on the structure of each topic.
          </p>
        </div>
      </div>

      {/* ─── 2. MAIN GRID (TWO PANELS + FULL-WIDTH DEDUCTION STRIP) ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">

        {/* ─── LEFT PANEL — TOPIC POINTS OVERVIEW ─────────────────────── */}
        <div className="lg:col-span-6 rounded-2xl bg-slate-50/70 dark:bg-[#070c20] border border-blue-200/80 dark:border-blue-900/60 p-4.5 sm:p-5 flex flex-col justify-between relative overflow-hidden shadow-xs">
          {/* Top Panel Title */}
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-[0_0_8px_rgba(37,99,235,0.8)]">
              01
            </span>
            <h3 className="text-blue-600 dark:text-blue-400 font-bold text-xs sm:text-sm tracking-wide">
              Topic Points Overview
            </h3>
          </div>

          {/* Panel Content (Circle Graphic + SVG Connectors + 3 Activity Cards) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-auto">
            
            {/* Circular Glowing Points Visual */}
            <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full flex items-center justify-center shrink-0 my-2">
              {/* Outer Dotted Decorative Ring */}
              <div className="absolute inset-0 rounded-full border border-dashed border-blue-400/30 dark:border-blue-500/30 animate-[spin_60s_linear_infinite]" />
              
              {/* Dots on outer ring */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_6px_#8b5cf6]" />
              <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_6px_#8b5cf6]" />

              {/* Royal Blue to Violet Gradient Ring */}
              <div className="w-[124px] h-[124px] sm:w-[138px] sm:h-[138px] rounded-full p-[3px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 shadow-[0_0_22px_rgba(37,99,235,0.35)] flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-white dark:bg-[#050919] flex flex-col items-center justify-center text-center p-2 shadow-inner">
                  <Star className="w-4 h-4 text-blue-600 dark:text-blue-400 mb-0.5 stroke-[1.8]" />
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] dark:text-white tracking-tight leading-none">
                    100
                  </span>
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400 tracking-wider mt-0.5">
                    POINTS
                  </span>
                  <span className="text-[9px] font-mono tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                    PER TOPIC
                  </span>
                </div>
              </div>
            </div>

            {/* SVG Connecting Lines (Visible on Tablet/Desktop) */}
            <div className="hidden sm:block relative w-7 h-40 shrink-0">
              <svg className="w-full h-full" viewBox="0 0 28 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Connector from circle center-right to vertical line */}
                <path d="M 0 80 H 12" stroke="url(#lineGradStemCompact)" strokeWidth="1.5" strokeDasharray="2 2" />
                <circle cx="12" cy="80" r="2.5" fill="#2563eb" />
                
                {/* Vertical distribution stem */}
                <path d="M 12 18 V 142" stroke="url(#lineGradVertCompact)" strokeWidth="1.2" />

                {/* Horizontal branches to each card */}
                <path d="M 12 18 H 28" stroke="#2563eb" strokeWidth="1.2" />
                <circle cx="12" cy="18" r="2" fill="#2563eb" />

                <path d="M 12 80 H 28" stroke="#7c3aed" strokeWidth="1.2" />
                <circle cx="12" cy="80" r="2" fill="#7c3aed" />

                <path d="M 12 142 H 28" stroke="#7c3aed" strokeWidth="1.2" />
                <circle cx="12" cy="142" r="2" fill="#7c3aed" />

                <defs>
                  <linearGradient id="lineGradStemCompact" x1="0" y1="80" x2="12" y2="80" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#2563eb" />
                    <stop offset="1" stopColor="#7c3aed" />
                  </linearGradient>
                  <linearGradient id="lineGradVertCompact" x1="12" y1="18" x2="12" y2="142" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#2563eb" />
                    <stop offset="1" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* 3 Vertically Stacked Point-Contributing Activities */}
            <div className="flex flex-col gap-2.5 w-full">
              {/* Visualizations / Videos */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-[#0b1330] border border-blue-100 dark:border-blue-900/70 flex items-center gap-3 shadow-xs hover:border-violet-400/60 transition-all">
                <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/90 border border-violet-200 dark:border-violet-800/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 shadow-xs">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A] dark:text-white leading-tight">
                    Visualizations / Videos
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none mt-1">
                    Contribute to your topic score.
                  </p>
                </div>
              </div>

              {/* Game Levels */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-[#0b1330] border border-blue-100 dark:border-blue-900/70 flex items-center gap-3 shadow-xs hover:border-blue-400/60 transition-all">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/90 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A] dark:text-white leading-tight">
                    Game Levels
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none mt-1">
                    Contribute to your topic score.
                  </p>
                </div>
              </div>

              {/* Quizzes */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-[#0b1330] border border-blue-100 dark:border-blue-900/70 flex items-center gap-3 shadow-xs hover:border-violet-400/60 transition-all">
                <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/90 border border-violet-200 dark:border-violet-800/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 shadow-xs">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A] dark:text-white leading-tight">
                    Quizzes
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none mt-1">
                    Contribute to your topic score.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT PANEL — IMPORTANT RULES ─────────────────────────── */}
        <div className="lg:col-span-6 rounded-2xl bg-slate-50/70 dark:bg-[#070c20] border border-blue-200/80 dark:border-blue-900/60 p-4.5 sm:p-5 flex flex-col justify-between space-y-3 shadow-xs">
          
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-violet-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-[0_0_8px_rgba(124,58,237,0.8)]">
                02
              </span>
              <h3 className="text-violet-600 dark:text-violet-400 font-bold text-xs sm:text-sm tracking-wide">
                Important Rules
              </h3>
            </div>

            {/* Rule Card 1 */}
            <div className="w-full p-2.5 sm:p-3 rounded-xl bg-white dark:bg-[#0b1330] border border-blue-100 dark:border-blue-900/70 flex items-start gap-3 hover:border-blue-400/60 transition-all shadow-xs">
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/90 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0F172A] dark:text-white leading-tight">
                  Each topic is worth 100 points.
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-1">
                  You can earn a maximum of 100 points in every topic.
                </p>
              </div>
            </div>

            {/* Rule Card 2 */}
            <div className="w-full p-2.5 sm:p-3 rounded-xl bg-white dark:bg-[#0b1330] border border-blue-100 dark:border-blue-900/70 flex items-start gap-3 hover:border-violet-400/60 transition-all shadow-xs">
              <div className="w-8 h-8 rounded-full bg-violet-50 dark:bg-violet-950/90 border border-violet-200 dark:border-violet-800/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Workflow className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0F172A] dark:text-white leading-tight">
                  Points are distributed dynamically.
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-1">
                  The 100 points are divided across visualizations, game levels, and quizzes in that topic.
                </p>
              </div>
            </div>

            {/* Rule Card 3 */}
            <div className="w-full p-2.5 sm:p-3 rounded-xl bg-white dark:bg-[#0b1330] border border-blue-100 dark:border-blue-900/70 flex items-start gap-3 hover:border-blue-400/60 transition-all shadow-xs">
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/90 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0F172A] dark:text-white leading-tight">
                  Different topics have different distributions.
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-1">
                  Not every topic has the same number of visualizations, game levels, or quizzes.
                </p>
              </div>
            </div>

            {/* Rule Card 4 */}
            <div className="w-full p-2.5 sm:p-3 rounded-xl bg-white dark:bg-[#0b1330] border border-blue-100 dark:border-blue-900/70 flex items-start gap-3 hover:border-violet-400/60 transition-all shadow-xs">
              <div className="w-8 h-8 rounded-full bg-violet-50 dark:bg-violet-950/90 border border-violet-200 dark:border-violet-800/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Star className="w-4 h-4 stroke-[1.8]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0F172A] dark:text-white leading-tight">
                  Complete all available activities to earn points.
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-1">
                  Finish the available visualizations, game levels, and quizzes to get the full 100 points.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* ─── 3. FULL-WIDTH DEDUCTION STRIP (NO CLIPPING, RED ACCENTS) ─── */}
        <div className="lg:col-span-12 rounded-2xl bg-red-50/80 dark:bg-gradient-to-r dark:from-[#1c080e] dark:via-[#14060b] dark:to-[#1c080e] border border-red-200/90 dark:border-red-900/60 p-4 sm:p-4.5 shadow-xs transition-colors duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            
            {/* Header / Title Item (Left 4 cols on lg) */}
            <div className="lg:col-span-4 flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/90 border border-red-300 dark:border-red-700/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 shadow-xs">
                <ArrowDown className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-red-700 dark:text-red-400 leading-tight">
                  Points can be deducted.
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-none mt-1">
                  Some actions may reduce points.
                </p>
              </div>
            </div>

            {/* 3 Deduction Items (Right 8 cols on lg with dedicated 3-column subgrid) */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:pl-6 lg:border-l lg:border-red-200/80 dark:lg:border-red-900/50">
              
              {/* Item 1 */}
              <div className="flex items-center gap-2.5 p-2 sm:p-0 rounded-lg bg-white/70 dark:bg-transparent sm:bg-transparent border sm:border-none border-red-100 dark:border-red-950">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/90 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 shadow-2xs">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-[#0F172A] dark:text-white leading-tight">
                    Incorrect Answer
                  </h5>
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 leading-none mt-1">
                    Loses points
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-center gap-2.5 p-2 sm:p-0 rounded-lg bg-white/70 dark:bg-transparent sm:bg-transparent border sm:border-none border-red-100 dark:border-red-950">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/90 border border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-[#0F172A] dark:text-white leading-tight">
                    Use Hint
                  </h5>
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 leading-none mt-1">
                    Loses points
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-center gap-2.5 p-2 sm:p-0 rounded-lg bg-white/70 dark:bg-transparent sm:bg-transparent border sm:border-none border-red-100 dark:border-red-950">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/90 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 shadow-2xs">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-[#0F172A] dark:text-white leading-tight">
                    Use Guided Solve
                  </h5>
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 leading-none mt-1">
                    Loses points
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </motion.div>
  );
};
