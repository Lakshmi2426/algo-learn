import React from 'react';
import {
  ArrowRight,
  Target,
  Key,
  MapPin,
  Database,
  Divide,
  AlertTriangle,
  Zap,
  Folder,
  Globe,
  Lightbulb,
  BookOpen,
  Star,
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { useScrollReveal } from '../hooks/useScrollReveal';

export interface HomePageProps {
  onContinueLearning: () => void;
  onExploreTopics: () => void;
  onNavigateToTab: (
    tab: 'THEORY' | 'VIDEO' | 'GAME' | 'QUEST' | 'LAB' | 'QUIZ' | 'PROGRESS',
    targetOption?: string | number
  ) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onExploreTopics,
  onNavigateToTab,
}) => {
  // Hook for smooth reveal animation on scroll
  useScrollReveal();

  const handleStartLearning = () => {
    soundManager.playPrimaryClick();
    onExploreTopics();
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 sm:gap-7 font-sans text-slate-900 dark:text-slate-100 animate-page-enter pb-10 select-text">
      {/* =========================================================================
          SECTION 01: HERO SECTION & HASH TABLE DIAGRAM
          ========================================================================= */}
      <section className="reveal-on-scroll bg-white dark:bg-[#111827] p-6 sm:p-10 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-all">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* Left Side: Curriculum Label, Main Heading, & Educational Description */}
          <div className="lg:col-span-7 flex flex-col gap-3.5">
            {/* Small Curriculum Label */}
            <div className="flex items-center">
              <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider text-[#2563EB] dark:text-[#3B82F6] uppercase">
                THEORY CURRICULUM • MODULE 01 • CHAPTER 01
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#111827] dark:text-white tracking-tight leading-[1.15]">
              Hashing &amp; <br />
              <span>Collision Resolution</span>
            </h1>

            {/* Educational Description */}
            <p className="text-sm sm:text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg">
              Learn how hashing maps keys to memory locations, why collisions happen, and the strategies that keep
              data fast, organized, and easy to access.
            </p>
          </div>

          {/* Right Side: Visual Hashing Diagram (Hash Symbol -> Mapping -> Hash Table) */}
          <div className="lg:col-span-5 flex items-center justify-center lg:justify-end">
            <div className="relative flex items-center gap-3 sm:gap-5 py-2">
              {/* 3D Glossy Royal Blue Hash Function Badge */}
              <div className="relative z-10 w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-[#1D4ED8] via-[#2563EB] to-[#4F46E5] text-white flex items-center justify-center shadow-lg dark:shadow-none border border-blue-200/40 dark:border-blue-500/30 transform -rotate-3 hover:rotate-0 transition-transform shrink-0">
                <span className="font-mono text-3xl sm:text-4xl font-extrabold select-none drop-shadow-sm">#</span>
              </div>

              {/* Connecting Curved Dashed Lines */}
              <div className="hidden sm:block absolute left-18 sm:left-20 top-1/2 -translate-y-1/2 w-16 h-56 pointer-events-none z-0">
                <svg className="w-full h-full" viewBox="0 0 60 220" fill="none">
                  {/* Branching from # icon */}
                  {/* Upper curve to Index 2 (22) */}
                  <path
                    d="M 2 110 C 25 110, 32 72, 58 72"
                    stroke="#3B82F6"
                    strokeWidth="1.75"
                    strokeDasharray="3.5 3.5"
                    strokeLinecap="round"
                    className="dark:stroke-[#3B82F6] opacity-90"
                  />
                  {/* Middle branch to Index 3 */}
                  <path
                    d="M 2 110 C 25 110, 35 110, 58 110"
                    stroke="#3B82F6"
                    strokeWidth="1.75"
                    strokeDasharray="3.5 3.5"
                    strokeLinecap="round"
                    className="dark:stroke-[#3B82F6] opacity-90"
                  />
                  {/* Lower curve to Index 4 (42) */}
                  <path
                    d="M 2 110 C 25 110, 32 148, 58 148"
                    stroke="#3B82F6"
                    strokeWidth="1.75"
                    strokeDasharray="3.5 3.5"
                    strokeLinecap="round"
                    className="dark:stroke-[#3B82F6] opacity-90"
                  />
                </svg>
              </div>

              {/* Hash Table Visual Structure */}
              <div className="flex items-center gap-2.5 z-10">
                {/* Index Labels Column (0, 1, 2, 3, 4, ..., n-1) */}
                <div className="flex flex-col justify-between h-[245px] text-right font-mono text-xs font-bold text-[#111827] dark:text-slate-300 py-1.5 select-none">
                  <span className="h-8 flex items-center justify-end">0</span>
                  <span className="h-8 flex items-center justify-end">1</span>
                  <span className="h-8 flex items-center justify-end">2</span>
                  <span className="h-8 flex items-center justify-end">3</span>
                  <span className="h-8 flex items-center justify-end">4</span>
                  <span className="h-4 flex items-center justify-end text-slate-400 dark:text-slate-500 font-bold">⋮</span>
                  <span className="h-8 flex items-center justify-end">n-1</span>
                </div>

                {/* Vertical Continuous Hash Table Structure */}
                <div className="w-32 sm:w-36 bg-[#F8FAFF] dark:bg-[#172033] border-2 border-[#DBEAFE] dark:border-blue-500/40 rounded-xl overflow-hidden flex flex-col shadow-xs">
                  {/* Row 0: Empty */}
                  <div className="h-8 flex border-b border-[#E2E8F0] dark:border-slate-800 bg-white/70 dark:bg-slate-900/40">
                    <div className="w-10 sm:w-11 bg-[#EFF6FF] dark:bg-blue-950/60 border-r border-[#E2E8F0] dark:border-slate-800 shrink-0" />
                    <div className="flex-1" />
                  </div>

                  {/* Row 1: Occupied (87) */}
                  <div className="h-8 flex items-center border-b border-[#E2E8F0] dark:border-slate-800 bg-white/70 dark:bg-slate-900/40">
                    <div className="w-10 sm:w-11 h-full bg-[#EFF6FF] dark:bg-blue-950/60 border-r border-[#E2E8F0] dark:border-slate-800 shrink-0" />
                    <div className="flex-1 flex items-center justify-center px-1.5 py-0.5">
                      <div className="w-full h-6 rounded-md bg-white dark:bg-[#111827] border border-[#DBEAFE] dark:border-blue-500/40 flex items-center justify-center shadow-2xs">
                        <span className="font-mono font-bold text-xs sm:text-sm text-[#2563EB] dark:text-[#3B82F6]">87</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Occupied (22) */}
                  <div className="h-8 flex items-center border-b border-[#E2E8F0] dark:border-slate-800 bg-white/70 dark:bg-slate-900/40">
                    <div className="w-10 sm:w-11 h-full bg-[#EFF6FF] dark:bg-blue-950/60 border-r border-[#E2E8F0] dark:border-slate-800 shrink-0" />
                    <div className="flex-1 flex items-center justify-center px-1.5 py-0.5">
                      <div className="w-full h-6 rounded-md bg-white dark:bg-[#111827] border border-[#DBEAFE] dark:border-blue-500/40 flex items-center justify-center shadow-2xs">
                        <span className="font-mono font-bold text-xs sm:text-sm text-[#2563EB] dark:text-[#3B82F6]">22</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Empty */}
                  <div className="h-8 flex border-b border-[#E2E8F0] dark:border-slate-800 bg-white/70 dark:bg-slate-900/40">
                    <div className="w-10 sm:w-11 bg-[#EFF6FF] dark:bg-blue-950/60 border-r border-[#E2E8F0] dark:border-slate-800 shrink-0" />
                    <div className="flex-1" />
                  </div>

                  {/* Row 4: Occupied (42) */}
                  <div className="h-8 flex items-center border-b border-[#E2E8F0] dark:border-slate-800 bg-white/70 dark:bg-slate-900/40">
                    <div className="w-10 sm:w-11 h-full bg-[#EFF6FF] dark:bg-blue-950/60 border-r border-[#E2E8F0] dark:border-slate-800 shrink-0" />
                    <div className="flex-1 flex items-center justify-center px-1.5 py-0.5">
                      <div className="w-full h-6 rounded-md bg-white dark:bg-[#111827] border border-[#DBEAFE] dark:border-blue-500/40 flex items-center justify-center shadow-2xs">
                        <span className="font-mono font-bold text-xs sm:text-sm text-[#2563EB] dark:text-[#3B82F6]">42</span>
                      </div>
                    </div>
                  </div>

                  {/* Row ⋮ */}
                  <div className="h-4 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs font-mono font-bold select-none border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFF] dark:bg-[#172033]">
                    ⋮
                  </div>

                  {/* Row n-1: Occupied (73) */}
                  <div className="h-8 flex items-center bg-white/70 dark:bg-slate-900/40">
                    <div className="w-10 sm:w-11 h-full bg-[#EFF6FF] dark:bg-blue-950/60 border-r border-[#E2E8F0] dark:border-slate-800 shrink-0" />
                    <div className="flex-1 flex items-center justify-center px-1.5 py-0.5">
                      <div className="w-full h-6 rounded-md bg-white dark:bg-[#111827] border border-[#DBEAFE] dark:border-blue-500/40 flex items-center justify-center shadow-2xs">
                        <span className="font-mono font-bold text-xs sm:text-sm text-[#2563EB] dark:text-[#3B82F6]">73</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 02: THREE CONCEPT CARDS
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
          {/* Card 1: Core Idea */}
          <div className="bg-white dark:bg-[#0B1120] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4.5 flex items-start gap-3.5 shadow-2xs hover:border-blue-300 dark:hover:border-blue-500/40 transition-all">
            <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] dark:bg-blue-950/70 border border-[#DBEAFE] dark:border-blue-500/30 flex items-center justify-center text-[#2563EB] dark:text-[#3B82F6] shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111827] dark:text-white">Core Idea</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Map data to an index using a hash function.
              </p>
            </div>
          </div>

          {/* Card 2: Key Formula */}
          <div className="bg-white dark:bg-[#0B1120] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4.5 flex items-start gap-3.5 shadow-2xs hover:border-blue-300 dark:hover:border-blue-500/40 transition-all">
            <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] dark:bg-blue-950/70 border border-[#DBEAFE] dark:border-blue-500/30 flex items-center justify-center text-[#2563EB] dark:text-[#3B82F6] shrink-0 font-serif font-bold text-xl">
              <span>Σ</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111827] dark:text-white">Key Formula</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">h[key] = index</span> <br />
                <span className="text-slate-500 dark:text-slate-400">(index in table)</span>
              </p>
            </div>
          </div>

          {/* Card 3: Main Challenge */}
          <div className="bg-white dark:bg-[#0B1120] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4.5 flex items-start gap-3.5 shadow-2xs hover:border-blue-300 dark:hover:border-blue-500/40 transition-all">
            <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] dark:bg-blue-950/70 border border-[#DBEAFE] dark:border-blue-500/30 flex items-center justify-center text-[#2563EB] dark:text-[#3B82F6] shrink-0">
              {/* Reference 6-point collision asterisk/flower icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v18" />
                <path d="M4.22 7.22l15.56 9.56" />
                <path d="M4.22 16.78l15.56-9.56" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111827] dark:text-white">Main Challenge</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Handle collisions and maintain efficiency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 03: 1. THE MAIN IDEA
          ========================================================================= */}
      <section className="reveal-on-scroll bg-white dark:bg-[#111827] p-6 sm:p-9 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
        {/* Section Header */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-full bg-[#EFF6FF] dark:bg-blue-950/70 border border-[#DBEAFE] dark:border-blue-500/30 flex items-center justify-center text-[#2563EB] dark:text-[#3B82F6]">
            <Lightbulb className="w-4 h-4" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#111827] dark:text-white">
            1. The Main Idea
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Left Column: Question & Explanation */}
          <div className="lg:col-span-4 flex flex-col gap-2">
            <h3 className="text-base sm:text-lg font-bold text-[#2563EB] dark:text-[#3B82F6] leading-snug">
              How can we find data without checking everything?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Hashing helps by calculating where data should be stored so we can find it quickly.
            </p>
          </div>

          {/* Right Column: Horizontal Flow (Key -> Hash Function -> Index -> Bucket) */}
          <div className="lg:col-span-8 bg-[#F8FAFC] dark:bg-[#0B1120] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6">
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 items-start sm:flex sm:flex-nowrap sm:items-center sm:justify-between sm:gap-2">
              {/* Step 1: Key */}
              <div className="flex flex-col items-center text-center w-full sm:w-auto sm:flex-1 sm:min-w-[85px]">
                <div className="w-13 h-13 rounded-full bg-white dark:bg-[#172033] border border-slate-200/80 dark:border-slate-700 text-[#2563EB] dark:text-[#3B82F6] flex items-center justify-center shadow-xs mb-2.5 shrink-0">
                  <svg className="w-7 h-7 fill-[#2563EB] dark:fill-[#3B82F6]" viewBox="0 0 24 24">
                    <g transform="rotate(-45 12 12)">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M17 7.2a4.8 4.8 0 1 1-4.45 6.6H11.5v1.7a.5.5 0 0 1-.5.5H9.4a.5.5 0 0 1-.5-.5v-1.7H5.5a1.8 1.8 0 0 1 0-3.6h7.05A4.8 4.8 0 0 1 17 7.2zm0 3.1a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zm-11.5.85a.85.85 0 1 0 0 1.7.85.85 0 0 0 0-1.7z"
                      />
                    </g>
                  </svg>
                </div>
                <span className="text-sm font-bold text-[#111827] dark:text-white">Key</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Input value</span>
              </div>

              {/* Arrow 1 */}
              <ArrowRight className="w-4 h-4 text-[#3B82F6] dark:text-[#3B82F6] shrink-0 hidden sm:block" />

              {/* Step 2: Hash Function */}
              <div className="flex flex-col items-center text-center w-full sm:w-auto sm:flex-1 sm:min-w-[85px]">
                <div className="w-13 h-13 rounded-full bg-white dark:bg-[#172033] border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shadow-xs mb-2.5 shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-[#2563EB] dark:bg-[#2563EB] flex items-center justify-center shadow-2xs">
                    <svg className="w-4.5 h-4.5 text-white stroke-white stroke-[2.5]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="9" x2="20" y2="9" />
                      <line x1="4" y1="15" x2="20" y2="15" />
                      <line x1="10" y1="3" x2="8" y2="21" />
                      <line x1="16" y1="3" x2="14" y2="21" />
                    </svg>
                  </div>
                </div>
                <span className="text-sm font-bold text-[#111827] dark:text-white">Hash Function</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Converts key to an index</span>
              </div>

              {/* Arrow 2 */}
              <ArrowRight className="w-4 h-4 text-[#3B82F6] dark:text-[#3B82F6] shrink-0 hidden sm:block" />

              {/* Step 3: Index */}
              <div className="flex flex-col items-center text-center w-full sm:w-auto sm:flex-1 sm:min-w-[85px]">
                <div className="w-13 h-13 rounded-full bg-white dark:bg-[#172033] border border-slate-200/80 dark:border-slate-700 text-[#2563EB] dark:text-[#3B82F6] flex items-center justify-center shadow-xs mb-2.5 shrink-0">
                  <svg className="w-6 h-6 fill-[#2563EB] dark:fill-[#3B82F6]" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7.15 11.45 7.45 11.71a.84.84 0 0 0 1.1 0C12.85 21.45 20 15.25 20 10c0-4.42-3.58-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-[#111827] dark:text-white">Index</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Points to a position in the table</span>
              </div>

              {/* Arrow 3 */}
              <ArrowRight className="w-4 h-4 text-[#3B82F6] dark:text-[#3B82F6] shrink-0 hidden sm:block" />

              {/* Step 4: Bucket */}
              <div className="flex flex-col items-center text-center w-full sm:w-auto sm:flex-1 sm:min-w-[85px]">
                <div className="w-13 h-13 rounded-full bg-white dark:bg-[#172033] border border-slate-200/80 dark:border-slate-700 text-[#2563EB] dark:text-[#3B82F6] flex items-center justify-center shadow-xs mb-2.5 shrink-0">
                  <svg className="w-6.5 h-6.5 fill-[#2563EB] dark:fill-[#3B82F6]" viewBox="0 0 24 24">
                    {/* Top handle pill */}
                    <rect x="8.5" y="2" width="7" height="2.2" rx="1.1" />
                    {/* Horizontal rim */}
                    <rect x="3.8" y="5.2" width="16.4" height="3.2" rx="1.6" />
                    {/* Tapered bucket body */}
                    <path d="M5.5 9.8h13l-1.35 10a2.5 2.5 0 0 1-2.48 2.2H9.33a2.5 2.5 0 0 1-2.48-2.2L5.5 9.8z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-[#111827] dark:text-white">Bucket</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Data is stored at that location</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 04: 2. CONCEPT ROADMAP
          ========================================================================= */}
      <section className="reveal-on-scroll bg-white dark:bg-[#111827] p-6 sm:p-9 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
        {/* Section Header */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-full bg-[#EFF6FF] dark:bg-blue-950/70 border border-[#DBEAFE] dark:border-blue-500/30 flex items-center justify-center text-[#2563EB] dark:text-[#3B82F6]">
            <BookOpen className="w-4 h-4" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#111827] dark:text-white">
            2. Concept Roadmap
          </h2>
        </div>

        {/* 5-Stage Progression */}
        <div className="relative">
          {/* Connected Dashed Line Across the 5 Steps (desktop) */}
          <div className="hidden md:block absolute top-5 left-[10%] right-[10%] h-0.5 border-t-2 border-dashed border-[#DBEAFE] dark:border-blue-500/30 z-0" />

          <div className="flex flex-col items-center md:grid md:grid-cols-5 md:gap-4 md:items-start relative z-10">
            {/* Stage 01: Hash Functions */}
            <div
              onClick={() => {
                soundManager.playSelect();
                onNavigateToTab('THEORY', 'what-is-hashing');
              }}
              className="flex flex-col items-center text-center group cursor-pointer w-full max-w-[220px] md:max-w-none"
            >
              <div className="w-10 h-10 rounded-full bg-[#EFF6FF] dark:bg-blue-950 text-[#2563EB] dark:text-[#3B82F6] border-2 border-white dark:border-[#111827] shadow-xs flex items-center justify-center font-mono font-extrabold text-xs mb-3 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                01
              </div>
              <div className="w-12 h-12 rounded-full bg-[#F8FAFF] dark:bg-[#172033] border border-[#DBEAFE] dark:border-blue-500/30 flex items-center justify-center text-[#2563EB] dark:text-[#3B82F6] mb-2.5 shadow-2xs group-hover:border-blue-400 transition-all font-mono font-bold text-lg">
                #
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-[#111827] dark:text-white leading-snug">
                Hash <br className="hidden md:inline" /> Functions
              </h3>
            </div>

            {/* Mobile Connector Line: 01 -> 02 */}
            <div className="md:hidden w-0.5 h-6 border-l-2 border-dashed border-[#DBEAFE] dark:border-blue-500/40 my-2" />

            {/* Stage 02: Direct Addressing */}
            <div
              onClick={() => {
                soundManager.playSelect();
                onNavigateToTab('THEORY', 'hash-table');
              }}
              className="flex flex-col items-center text-center group cursor-pointer w-full max-w-[220px] md:max-w-none"
            >
              <div className="w-10 h-10 rounded-full bg-[#EFF6FF] dark:bg-blue-950 text-[#2563EB] dark:text-[#3B82F6] border-2 border-white dark:border-[#111827] shadow-xs flex items-center justify-center font-mono font-extrabold text-xs mb-3 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                02
              </div>
              <div className="w-12 h-12 rounded-full bg-[#F8FAFF] dark:bg-[#172033] border border-[#DBEAFE] dark:border-blue-500/30 flex items-center justify-center text-[#2563EB] dark:text-[#3B82F6] mb-2.5 shadow-2xs group-hover:border-[#DBEAFE] transition-all">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-[#111827] dark:text-white leading-snug">
                Direct <br className="hidden md:inline" /> Addressing
              </h3>
            </div>

            {/* Mobile Connector Line: 02 -> 03 */}
            <div className="md:hidden w-0.5 h-6 border-l-2 border-dashed border-[#DBEAFE] dark:border-blue-500/40 my-2" />

            {/* Stage 03: Modulo Arithmetic */}
            <div
              onClick={() => {
                soundManager.playSelect();
                onNavigateToTab('THEORY', 'hash-function');
              }}
              className="flex flex-col items-center text-center group cursor-pointer w-full max-w-[220px] md:max-w-none"
            >
              <div className="w-10 h-10 rounded-full bg-[#EFF6FF] dark:bg-blue-950 text-[#2563EB] dark:text-[#3B82F6] border-2 border-white dark:border-[#111827] shadow-xs flex items-center justify-center font-mono font-extrabold text-xs mb-3 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                03
              </div>
              <div className="w-12 h-12 rounded-full bg-[#F8FAFF] dark:bg-[#172033] border border-[#DBEAFE] dark:border-blue-500/30 flex items-center justify-center text-[#2563EB] dark:text-[#3B82F6] mb-2.5 shadow-2xs group-hover:border-[#2563EB] transition-all">
                <Divide className="w-5 h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-[#111827] dark:text-white leading-snug">
                Modulo <br className="hidden md:inline" /> Arithmetic
              </h3>
            </div>

            {/* Mobile Connector Line: 03 -> 04 */}
            <div className="md:hidden w-0.5 h-6 border-l-2 border-dashed border-[#DBEAFE] dark:border-blue-500/40 my-2" />

            {/* Stage 04: Collisions */}
            <div
              onClick={() => {
                soundManager.playSelect();
                onNavigateToTab('THEORY', 'what-is-a-collision');
              }}
              className="flex flex-col items-center text-center group cursor-pointer w-full max-w-[220px] md:max-w-none"
            >
              <div className="w-10 h-10 rounded-full bg-[#EFF6FF] dark:bg-blue-950 text-[#2563EB] dark:text-[#3B82F6] border-2 border-white dark:border-[#111827] shadow-xs flex items-center justify-center font-mono font-extrabold text-xs mb-3 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                04
              </div>
              <div className="w-12 h-12 rounded-full bg-[#FFFBEB] dark:bg-[#172033] border border-[#FDE68A] dark:border-amber-500/30 flex items-center justify-center text-[#F59E0B] dark:text-amber-400 mb-2.5 shadow-2xs group-hover:border-amber-400 transition-all">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-[#111827] dark:text-white leading-snug">
                Collisions
              </h3>
            </div>

            {/* Mobile Connector Line: 04 -> 05 */}
            <div className="md:hidden w-0.5 h-6 border-l-2 border-dashed border-[#DBEAFE] dark:border-blue-500/40 my-2" />

            {/* Stage 05: Collision Resolution */}
            <div
              onClick={() => {
                soundManager.playSelect();
                onNavigateToTab('THEORY', 'separate-chaining');
              }}
              className="flex flex-col items-center text-center group cursor-pointer w-full max-w-[220px] md:max-w-none"
            >
              <div className="w-10 h-10 rounded-full bg-[#EFF6FF] dark:bg-blue-950 text-[#2563EB] dark:text-[#3B82F6] border-2 border-white dark:border-[#111827] shadow-xs flex items-center justify-center font-mono font-extrabold text-xs mb-3 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                05
              </div>
              <div className="w-12 h-12 rounded-full bg-[#F0FDF4] dark:bg-[#172033] border border-[#BBF7D0] dark:border-emerald-500/30 flex items-center justify-center text-[#10B981] dark:text-emerald-400 mb-2.5 shadow-2xs group-hover:border-emerald-400 transition-all">
                {/* Collision resolution switch icon matching reference */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 3h5v5" />
                  <path d="M4 20L21 3" />
                  <path d="M21 16v5h-5" />
                  <path d="M15 15l6 6" />
                  <path d="M4 4l5 5" />
                </svg>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-[#111827] dark:text-white leading-snug">
                Collision <br className="hidden md:inline" /> Resolution
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 05: 3. WHY THIS TOPIC MATTERS
          ========================================================================= */}
      <section className="reveal-on-scroll bg-white dark:bg-[#111827] p-6 sm:p-9 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
        {/* Section Header */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-full bg-[#EFF6FF] dark:bg-blue-950/70 border border-[#DBEAFE] dark:border-blue-500/30 flex items-center justify-center text-[#2563EB] dark:text-[#3B82F6]">
            <Star className="w-4 h-4" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#111827] dark:text-white">
            3. Why This Topic Matters
          </h2>
        </div>

        {/* 3 Value Cards Matching Exact References */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Fast Lookup */}
          <div className="bg-[#EFF6FF] dark:bg-[#172033] border border-[#DBEAFE] dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-2xs">
            <div className="w-11 h-11 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827] dark:text-white mb-1.5">Fast Lookup</h3>
              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Find data in constant time without scanning the entire collection.
              </p>
            </div>
          </div>

          {/* Card 2: Organized Data */}
          <div className="bg-[#F0FDF4] dark:bg-[#172033] border border-[#DCFCE7] dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-2xs">
            <div className="w-11 h-11 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-xs">
              <Folder className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827] dark:text-white mb-1.5">Organized Data</h3>
              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Convert large sets of keys into manageable memory locations.
              </p>
            </div>
          </div>

          {/* Card 3: Real-World Use */}
          <div className="bg-[#EFF6FF] dark:bg-[#172033] border border-[#DBEAFE] dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-2xs">
            <div className="w-11 h-11 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827] dark:text-white mb-1.5">Real-World Use</h3>
              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Used in databases, caches, password systems, and programming structures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 06: 4. READY TO START?
          ========================================================================= */}
      <section className="reveal-on-scroll bg-gradient-to-r from-[#EFF6FF] via-[#F8FAFF] to-[#EFF6FF] dark:from-[#0B1120] dark:via-[#111827] dark:to-[#0B1120] border border-[#DBEAFE] dark:border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xs dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Side: Educational Rocket Visual & Supporting Text */}
          <div className="flex items-center gap-5 sm:gap-6">
            {/* 3D Diagonal Rocket Illustration matching exact Reference Image (Static) */}
            <div className="w-18 h-18 sm:w-22 sm:h-22 shrink-0 flex items-center justify-center relative select-none">
              <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-md">
                <defs>
                  {/* Gradients for 3D Shading */}
                  <linearGradient id="rocketBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="65%" stopColor="#F8FAFC" />
                    <stop offset="100%" stopColor="#CBD5E1" />
                  </linearGradient>
                  <linearGradient id="blueNoseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="50%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#1E40AF" />
                  </linearGradient>
                  <linearGradient id="blueFinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#1D4ED8" />
                  </linearGradient>
                  <linearGradient id="exhaustBeamGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFEDD5" stopOpacity="0.95" />
                    <stop offset="50%" stopColor="#FED7AA" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                  </linearGradient>
                  <radialGradient id="cloudGrad" cx="35%" cy="30%" r="65%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="70%" stopColor="#F1F5F9" />
                    <stop offset="100%" stopColor="#E2E8F0" />
                  </radialGradient>
                  <radialGradient id="cloudShadowGrad" cx="40%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#E2E8F0" />
                    <stop offset="100%" stopColor="#CBD5E1" />
                  </radialGradient>
                </defs>

                {/* --- BILLOWING FLUFFY 3D CLOUDS (Background layers) --- */}
                <g>
                  {/* Deep shadow cloud base */}
                  <circle cx="24" cy="98" r="16" fill="#DBEAFE" opacity="0.45" />
                  <circle cx="44" cy="100" r="16" fill="#E2E8F0" opacity="0.8" />
                  <circle cx="68" cy="94" r="14" fill="#E2E8F0" opacity="0.7" />

                  {/* Mid-ground fluffy clouds */}
                  <circle cx="16" cy="90" r="14" fill="url(#cloudGrad)" />
                  <circle cx="34" cy="82" r="18" fill="url(#cloudGrad)" />
                  <circle cx="56" cy="84" r="17" fill="url(#cloudGrad)" />
                  <circle cx="76" cy="92" r="14" fill="url(#cloudGrad)" />
                  <circle cx="46" cy="96" r="16" fill="url(#cloudGrad)" />

                  {/* Highlights on cloud tops */}
                  <ellipse cx="32" cy="74" rx="9" ry="4.5" fill="#FFFFFF" opacity="0.9" />
                  <ellipse cx="54" cy="76" rx="8" ry="4" fill="#FFFFFF" opacity="0.9" />
                </g>

                {/* --- EXHAUST PLUME STREAM (Connecting engine to cloud base) --- */}
                <g>
                  <path
                    d="M 52 68 Q 36 82 28 92 Q 44 80 58 62 Z"
                    fill="url(#exhaustBeamGrad)"
                  />
                  {/* Small bright core flame */}
                  <path
                    d="M 50 67 Q 40 76 34 82 Q 44 75 54 63 Z"
                    fill="#FDBA74"
                    opacity="0.9"
                  />
                  <path
                    d="M 49 67 Q 43 72 38 77 Q 45 72 52 64 Z"
                    fill="#F97316"
                  />
                </g>

                {/* --- ROCKET STRUCTURE (Oriented ~45deg diagonally) --- */}
                <g transform="rotate(45, 68, 52)">
                  {/* Left Blue Fin (flared out) */}
                  <path
                    d="M 54 58 C 42 64 38 74 42 78 C 50 76 56 70 58 64 Z"
                    fill="url(#blueFinGrad)"
                  />

                  {/* Right Blue Fin (flared down/back) */}
                  <path
                    d="M 82 58 C 94 64 98 74 94 78 C 86 76 80 70 78 64 Z"
                    fill="url(#blueFinGrad)"
                  />

                  {/* Red Engine Base / Mounting Ring */}
                  <path
                    d="M 56 68 L 80 68 L 77 74 L 59 74 Z"
                    fill="#EF4444"
                  />
                  {/* Orange Flame Emitter Nozzle */}
                  <path
                    d="M 62 74 Q 68 82 68 83 Q 68 82 74 74 Z"
                    fill="#F97316"
                  />

                  {/* Rocket Fuselage Body */}
                  <path
                    d="M 68 16 C 52 30 52 60 56 68 L 80 68 C 84 60 84 30 68 16 Z"
                    fill="url(#rocketBodyGrad)"
                    stroke="#E2E8F0"
                    strokeWidth="0.5"
                  />

                  {/* Blue Nosecone */}
                  <path
                    d="M 68 16 C 60 23 55 31 54 37 L 82 37 C 81 31 76 23 68 16 Z"
                    fill="url(#blueNoseGrad)"
                  />

                  {/* Blue Dorsal Spine Fin */}
                  <path
                    d="M 66 37 Q 68 56 65 67 L 71 67 Q 68 56 70 37 Z"
                    fill="url(#blueFinGrad)"
                  />

                  {/* 3D Blue Porthole / Window */}
                  <circle cx="68" cy="46" r="8" fill="url(#blueNoseGrad)" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="68" cy="46" r="5" fill="#172554" />
                  <circle cx="66" cy="44" r="1.75" fill="#FFFFFF" opacity="0.9" />
                </g>
              </svg>
            </div>

            {/* Title & Description */}
            <div className="flex flex-col gap-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827] dark:text-white">
                4. Ready to Start?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed">
                Begin with the fundamental idea behind hashing: transforming a key into a memory location.
              </p>
            </div>
          </div>

          {/* Right Side: Start Learning Button */}
          <button
            id="btn-home-start-learning"
            onClick={handleStartLearning}
            className="w-full md:w-auto px-8 py-4 bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#2563EB] dark:hover:bg-[#1D4ED8] text-white font-bold text-sm sm:text-base rounded-xl shadow-xs dark:shadow-none transition-all flex items-center justify-center gap-2.5 cursor-pointer shrink-0 group hover:scale-[1.01] active:scale-[0.99]"
          >
            <span>Start Learning</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>
    </div>
  );
};
