import React from 'react';
import {
  ArrowRight,
  ArrowDown,
  Target,
  Puzzle,
  Lightbulb,
  BookOpen,
  Star,
  Zap,
  Database,
  Globe,
  FileText,
  List,
  Plus,
  Minus,
  Settings,
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

  // State to highlight corresponding memory address pairs on hover (e.g. Node 1 NEXT 1002 <-> Node 2 ADDR 1002)
  const [hoveredAddr, setHoveredAddr] = React.useState<number | null>(null);

  const handleStartLearning = () => {
    soundManager.playPrimaryClick();
    onExploreTopics();
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 sm:gap-7 font-sans text-slate-900 dark:text-slate-100 animate-page-enter pb-10 select-text">
      {/* =========================================================================
          SECTION 01: HERO SECTION & SINGLE LINKED LIST DIAGRAM
          ========================================================================= */}
      <section className="reveal-on-scroll bg-white dark:bg-[#0B1228] p-6 sm:p-10 rounded-2xl border border-slate-200/90 dark:border-blue-900/30 shadow-xs dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-all">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* Left Side: Curriculum Label, Main Heading, & Educational Description */}
          <div className="lg:col-span-6 flex flex-col gap-3.5">
            {/* Small Curriculum Label */}
            <div className="flex items-center">
              <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider text-[#2563EB] dark:text-blue-400 uppercase">
                THEORY CURRICULUM • MODULE 01 • CHAPTER 01
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-[#0F172A] dark:text-white tracking-tight leading-[1.12]">
              Single Linked <br />
              <span>List</span>
            </h1>

            {/* Educational Description */}
            <p className="text-sm sm:text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg">
              Learn how a single linked list stores elements using nodes, how the nodes are connected, and the basic operations to traverse, insert, and delete elements.
            </p>
          </div>

          {/* Right Side: Visual Single Linked List Diagram (Head -> [10|1002] -> [20|1003] -> [30|NULL]) */}
          <div className="lg:col-span-6 flex items-center justify-center lg:justify-end overflow-x-auto py-1">
            <div className="flex flex-col items-start min-w-[340px] sm:min-w-[410px]">
              {/* Nodes Row with Head Pointer */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Node 1 with Head Label above */}
                <div
                  className="group flex flex-col items-center cursor-default"
                  onMouseEnter={() => setHoveredAddr(1001)}
                  onMouseLeave={() => setHoveredAddr(null)}
                >
                  {/* Head pointer indicator */}
                  <div className="flex flex-col items-center mb-1">
                    <div
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#2563EB] text-white text-[10px] font-bold font-mono shadow-[0_0_12px_rgba(37,99,235,0.4)] transition-all ${
                        hoveredAddr === 1001 ? 'scale-105 ring-2 ring-blue-300' : ''
                      }`}
                    >
                      <span>HEAD</span>
                      <span className="opacity-85 text-[9px] font-normal">→ 1001</span>
                    </div>
                    <ArrowDown className="w-3 h-3 text-[#2563EB] dark:text-blue-400 stroke-[3] -mt-0.5 animate-pulse" />
                  </div>

                  {/* Node 1 Card */}
                  <div
                    className={`w-[88px] sm:w-[98px] bg-white dark:bg-[#0B1228] border-2 rounded-xl overflow-hidden shadow-2xs transition-all duration-200 hover:-translate-y-0.5 ${
                      hoveredAddr === 1001
                        ? 'border-[#2563EB] ring-2 ring-blue-400/40 shadow-[0_0_14px_rgba(37,99,235,0.3)]'
                        : 'border-blue-300 dark:border-blue-500/70 hover:border-[#2563EB]'
                    }`}
                  >
                    {/* Address Header Pill */}
                    <div
                      className={`px-2 py-0.5 border-b transition-colors flex items-center justify-between ${
                        hoveredAddr === 1001
                          ? 'bg-[#DBEAFE] dark:bg-blue-900/60 border-blue-300 dark:border-blue-800'
                          : 'bg-[#EFF6FF] dark:bg-blue-950/70 border-blue-100 dark:border-blue-900/40'
                      }`}
                    >
                      <span className="text-[7.5px] font-mono font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
                        ADDR
                      </span>
                      <span className="text-[10px] font-mono font-extrabold text-[#2563EB] dark:text-blue-300">
                        1001
                      </span>
                    </div>

                    {/* Data & Next Row */}
                    <div className="grid grid-cols-2 divide-x divide-blue-100 dark:divide-blue-900/40 bg-white dark:bg-[#0E162E]">
                      {/* DATA field */}
                      <div className="p-1 sm:p-1.5 flex flex-col items-center justify-center">
                        <span className="text-[7px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                          DATA
                        </span>
                        <span className="font-mono font-black text-xs sm:text-sm text-[#0F172A] dark:text-white leading-tight">
                          10
                        </span>
                      </div>

                      {/* NEXT pointer field */}
                      <div
                        className={`p-1 sm:p-1.5 flex flex-col items-center justify-center transition-colors cursor-pointer ${
                          hoveredAddr === 1002
                            ? 'bg-blue-100 dark:bg-blue-900/60 ring-2 ring-inset ring-[#2563EB]'
                            : 'bg-[#EFF6FF]/70 dark:bg-blue-950/50 hover:bg-[#DBEAFE]'
                        }`}
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          setHoveredAddr(1002);
                        }}
                        onMouseLeave={() => setHoveredAddr(null)}
                        title="NEXT points to address 1002 (Node 2)"
                      >
                        <span className="text-[7px] font-bold text-[#2563EB] dark:text-blue-400 uppercase tracking-wider">
                          NEXT
                        </span>
                        <span className="font-mono font-black text-[10px] sm:text-[11px] text-[#1D4ED8] dark:text-blue-300 leading-tight">
                          1002
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Node Label Below */}
                  <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium mt-1">
                    Node 1
                  </span>
                </div>

                {/* Arrow 1 -> 2 with matching flow */}
                <div className="flex flex-col items-center justify-center -mt-3">
                  <div
                    className={`flex items-center transition-all ${
                      hoveredAddr === 1002 ? 'scale-110 text-[#1D4ED8]' : 'text-[#2563EB] dark:text-blue-400'
                    }`}
                  >
                    <div
                      className={`w-2.5 sm:w-3.5 h-[2.5px] rounded-full transition-all ${
                        hoveredAddr === 1002
                          ? 'bg-[#1D4ED8] dark:bg-blue-300 shadow-[0_0_8px_rgba(37,99,235,0.6)]'
                          : 'bg-[#2563EB] dark:bg-blue-400'
                      }`}
                    />
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 -ml-1 stroke-[3] animate-pulse" />
                  </div>
                  <span
                    className={`text-[8px] font-mono font-bold transition-opacity ${
                      hoveredAddr === 1002 ? 'text-[#2563EB] dark:text-blue-300 opacity-100' : 'opacity-0'
                    }`}
                  >
                    1002
                  </span>
                </div>

                {/* Node 2 [ 20 | 1003 ] */}
                <div
                  className="group flex flex-col items-center cursor-default"
                  onMouseEnter={() => setHoveredAddr(1002)}
                  onMouseLeave={() => setHoveredAddr(null)}
                >
                  {/* Spacer for Head height alignment */}
                  <div className="h-[27px] mb-1" />

                  {/* Node 2 Card */}
                  <div
                    className={`w-[88px] sm:w-[98px] bg-white dark:bg-[#0B1228] border-2 rounded-xl overflow-hidden shadow-2xs transition-all duration-200 hover:-translate-y-0.5 ${
                      hoveredAddr === 1002
                        ? 'border-[#2563EB] ring-2 ring-blue-400/40 shadow-[0_0_14px_rgba(37,99,235,0.3)]'
                        : 'border-blue-300 dark:border-blue-500/70 hover:border-[#2563EB]'
                    }`}
                  >
                    {/* Address Header Pill */}
                    <div
                      className={`px-2 py-0.5 border-b transition-colors flex items-center justify-between ${
                        hoveredAddr === 1002
                          ? 'bg-[#DBEAFE] dark:bg-blue-900/60 border-blue-300 dark:border-blue-800 ring-1 ring-blue-500'
                          : 'bg-[#EFF6FF] dark:bg-blue-950/70 border-blue-100 dark:border-blue-900/40'
                      }`}
                    >
                      <span className="text-[7.5px] font-mono font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
                        ADDR
                      </span>
                      <span className="text-[10px] font-mono font-extrabold text-[#2563EB] dark:text-blue-300">
                        1002
                      </span>
                    </div>

                    {/* Data & Next Row */}
                    <div className="grid grid-cols-2 divide-x divide-blue-100 dark:divide-blue-900/40 bg-white dark:bg-[#0E162E]">
                      {/* DATA field */}
                      <div className="p-1 sm:p-1.5 flex flex-col items-center justify-center">
                        <span className="text-[7px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                          DATA
                        </span>
                        <span className="font-mono font-black text-xs sm:text-sm text-[#0F172A] dark:text-white leading-tight">
                          20
                        </span>
                      </div>

                      {/* NEXT pointer field */}
                      <div
                        className={`p-1 sm:p-1.5 flex flex-col items-center justify-center transition-colors cursor-pointer ${
                          hoveredAddr === 1003
                            ? 'bg-blue-100 dark:bg-blue-900/60 ring-2 ring-inset ring-[#2563EB]'
                            : 'bg-[#EFF6FF]/70 dark:bg-blue-950/50 hover:bg-[#DBEAFE]'
                        }`}
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          setHoveredAddr(1003);
                        }}
                        onMouseLeave={() => setHoveredAddr(null)}
                        title="NEXT points to address 1003 (Node 3)"
                      >
                        <span className="text-[7px] font-bold text-[#2563EB] dark:text-blue-400 uppercase tracking-wider">
                          NEXT
                        </span>
                        <span className="font-mono font-black text-[10px] sm:text-[11px] text-[#1D4ED8] dark:text-blue-300 leading-tight">
                          1003
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Node Label Below */}
                  <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium mt-1">
                    Node 2
                  </span>
                </div>

                {/* Arrow 2 -> 3 with matching flow */}
                <div className="flex flex-col items-center justify-center -mt-3">
                  <div
                    className={`flex items-center transition-all ${
                      hoveredAddr === 1003 ? 'scale-110 text-[#1D4ED8]' : 'text-[#2563EB] dark:text-blue-400'
                    }`}
                  >
                    <div
                      className={`w-2.5 sm:w-3.5 h-[2.5px] rounded-full transition-all ${
                        hoveredAddr === 1003
                          ? 'bg-[#1D4ED8] dark:bg-blue-300 shadow-[0_0_8px_rgba(37,99,235,0.6)]'
                          : 'bg-[#2563EB] dark:bg-blue-400'
                      }`}
                    />
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 -ml-1 stroke-[3] animate-pulse" />
                  </div>
                  <span
                    className={`text-[8px] font-mono font-bold transition-opacity ${
                      hoveredAddr === 1003 ? 'text-[#2563EB] dark:text-blue-300 opacity-100' : 'opacity-0'
                    }`}
                  >
                    1003
                  </span>
                </div>

                {/* Node 3 [ 30 | NULL ] */}
                <div
                  className="group flex flex-col items-center cursor-default"
                  onMouseEnter={() => setHoveredAddr(1003)}
                  onMouseLeave={() => setHoveredAddr(null)}
                >
                  {/* Spacer for Head height alignment */}
                  <div className="h-[27px] mb-1" />

                  {/* Node 3 Card */}
                  <div
                    className={`w-[88px] sm:w-[98px] bg-white dark:bg-[#0B1228] border-2 rounded-xl overflow-hidden shadow-2xs transition-all duration-200 hover:-translate-y-0.5 ${
                      hoveredAddr === 1003
                        ? 'border-[#2563EB] ring-2 ring-blue-400/40 shadow-[0_0_14px_rgba(37,99,235,0.3)]'
                        : 'border-blue-300 dark:border-blue-500/70 hover:border-[#2563EB]'
                    }`}
                  >
                    {/* Address Header Pill */}
                    <div
                      className={`px-2 py-0.5 border-b transition-colors flex items-center justify-between ${
                        hoveredAddr === 1003
                          ? 'bg-[#DBEAFE] dark:bg-blue-900/60 border-blue-300 dark:border-blue-800 ring-1 ring-blue-500'
                          : 'bg-[#EFF6FF] dark:bg-blue-950/70 border-blue-100 dark:border-blue-900/40'
                      }`}
                    >
                      <span className="text-[7.5px] font-mono font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
                        ADDR
                      </span>
                      <span className="text-[10px] font-mono font-extrabold text-[#2563EB] dark:text-blue-300">
                        1003
                      </span>
                    </div>

                    {/* Data & Next Row */}
                    <div className="grid grid-cols-2 divide-x divide-blue-100 dark:divide-blue-900/40 bg-white dark:bg-[#0E162E]">
                      {/* DATA field */}
                      <div className="p-1 sm:p-1.5 flex flex-col items-center justify-center">
                        <span className="text-[7px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                          DATA
                        </span>
                        <span className="font-mono font-black text-xs sm:text-sm text-[#0F172A] dark:text-white leading-tight">
                          30
                        </span>
                      </div>

                      {/* NEXT pointer field */}
                      <div
                        className={`p-1 sm:p-1.5 flex flex-col items-center justify-center transition-colors cursor-pointer ${
                          hoveredAddr === 9999
                            ? 'bg-blue-100 dark:bg-blue-900/60 ring-2 ring-inset ring-[#2563EB]'
                            : 'bg-[#EFF6FF]/70 dark:bg-blue-950/50 hover:bg-[#DBEAFE]'
                        }`}
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          setHoveredAddr(9999);
                        }}
                        onMouseLeave={() => setHoveredAddr(null)}
                        title="NEXT points to NULL (End of list)"
                      >
                        <span className="text-[7px] font-bold text-[#2563EB] dark:text-blue-400 uppercase tracking-wider">
                          NEXT
                        </span>
                        <span className="font-mono font-black text-[9px] sm:text-[10px] text-slate-600 dark:text-slate-400 leading-tight">
                          NULL
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Node Label Below */}
                  <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium mt-1">
                    Node 3
                  </span>
                </div>

                {/* Arrow 3 -> NULL */}
                <div className="flex flex-col items-center justify-center -mt-3">
                  <div
                    className={`flex items-center transition-all ${
                      hoveredAddr === 9999 ? 'scale-110 text-[#1D4ED8]' : 'text-[#2563EB] dark:text-blue-400'
                    }`}
                  >
                    <div
                      className={`w-2 sm:w-2.5 h-[2.5px] rounded-full transition-all ${
                        hoveredAddr === 9999
                          ? 'bg-[#1D4ED8] dark:bg-blue-300 shadow-[0_0_8px_rgba(37,99,235,0.6)]'
                          : 'bg-[#2563EB] dark:bg-blue-400'
                      }`}
                    />
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 -ml-1 stroke-[3] animate-pulse" />
                  </div>
                </div>

                {/* NULL End Terminal */}
                <div
                  className={`flex flex-col items-center -mt-3 px-2 py-1.5 rounded-xl border-2 border-dashed transition-all duration-200 cursor-default ${
                    hoveredAddr === 9999
                      ? 'bg-blue-100 dark:bg-blue-900/50 border-[#2563EB] scale-105 shadow-[0_0_12px_rgba(37,99,235,0.3)]'
                      : 'bg-[#EFF6FF] dark:bg-blue-950/60 border-blue-300 dark:border-blue-800/60 hover:border-blue-400'
                  }`}
                  onMouseEnter={() => setHoveredAddr(9999)}
                  onMouseLeave={() => setHoveredAddr(null)}
                >
                  <span className="font-mono font-black text-xs sm:text-sm text-[#0F172A] dark:text-white uppercase tracking-wider">
                    NULL
                  </span>
                  <span className="text-[8px] font-mono text-[#2563EB] dark:text-blue-400 font-bold -mt-0.5">
                    End
                  </span>
                </div>
              </div>

              {/* Educational Concept Cue */}
              <div className="mt-2 w-full flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-lg bg-[#EFF6FF]/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 text-[10px] sm:text-[11px] font-mono text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] dark:bg-blue-400 animate-ping shrink-0" />
                  <span>
                    <strong className="text-[#2563EB] dark:text-blue-300 font-bold">NEXT</strong> = Address of next node
                  </span>
                </span>
                <span className="text-[9px] text-[#2563EB] dark:text-blue-400 font-semibold hidden sm:inline">
                  1002 → Node 2 • 1003 → Node 3
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 02: THREE SUMMARY CARDS
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-blue-900/25">
          {/* Card 1: Core Idea */}
          <div className="bg-white dark:bg-[#080D1F] border border-slate-200/90 dark:border-blue-900/30 rounded-2xl p-4.5 flex items-start gap-3.5 shadow-2xs hover:border-blue-300 dark:hover:border-blue-500/40 transition-all">
            <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] dark:bg-blue-950/70 border border-[#DBEAFE] dark:border-blue-900/30 flex items-center justify-center text-[#2563EB] dark:text-blue-300 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0F172A] dark:text-white">Core Idea</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Store elements in nodes linked using pointers.
              </p>
            </div>
          </div>

          {/* Card 2: Key Structure */}
          <div className="bg-white dark:bg-[#080D1F] border border-slate-200/90 dark:border-blue-900/30 rounded-2xl p-4.5 flex items-start gap-3.5 shadow-2xs hover:border-blue-300 dark:hover:border-blue-500/40 transition-all">
            <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] dark:bg-blue-950/70 border border-[#DBEAFE] dark:border-blue-900/30 flex items-center justify-center text-[#2563EB] dark:text-blue-300 shrink-0 font-serif font-bold text-xl">
              <span>Σ</span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-[#0F172A] dark:text-white">Key Structure</h2>
              <pre className="font-mono text-[11px] sm:text-xs text-slate-800 dark:text-slate-200 mt-1 leading-tight font-medium bg-transparent p-0 overflow-x-auto">
{`class Node {
  int data;
  Node next;
}`}
              </pre>
            </div>
          </div>

          {/* Card 3: Main Advantage */}
          <div className="bg-white dark:bg-[#080D1F] border border-slate-200/90 dark:border-blue-900/30 rounded-2xl p-4.5 flex items-start gap-3.5 shadow-2xs hover:border-blue-300 dark:hover:border-blue-500/40 transition-all">
            <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] dark:bg-blue-950/70 border border-[#DBEAFE] dark:border-blue-900/30 flex items-center justify-center text-[#2563EB] dark:text-blue-300 shrink-0">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0F172A] dark:text-white">Main Advantage</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Dynamic size with efficient insertions and deletions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 03: 1. THE MAIN IDEA
          ========================================================================= */}
      <section className="reveal-on-scroll bg-white dark:bg-[#0B1228] p-6 sm:p-9 rounded-2xl border border-slate-200/90 dark:border-blue-900/30 shadow-xs dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
        {/* Section Header */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-full bg-[#EFF6FF] dark:bg-blue-950/70 border border-[#DBEAFE] dark:border-blue-900/30 flex items-center justify-center text-[#2563EB] dark:text-blue-400">
            <Lightbulb className="w-4 h-4" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white">
            1. The Main Idea
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Left Column: Highlighted Statement & Explanation */}
          <div className="lg:col-span-5 flex flex-col gap-2.5">
            <h3 className="text-base sm:text-lg font-bold text-[#2563EB] dark:text-blue-300 leading-snug">
              A sequence of nodes connected by links (pointers).
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Each node contains data and a reference (pointer) to the next node in the list.
            </p>
          </div>

          {/* Right Column: Visual Explanation of a Single Node */}
          <div className="lg:col-span-7 bg-[#F8FAFC] dark:bg-[#080D1F] border border-slate-200/80 dark:border-blue-900/30 rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
              {/* Single Node with Column Labels */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  {/* Data & Next labels */}
                  <div className="flex justify-between w-full px-2 mb-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <span>Data</span>
                    <span>Next</span>
                  </div>

                  {/* Node Box [ 10 | ● ] */}
                  <div className="flex items-stretch bg-[#F8FAFF] dark:bg-[#0E162E] border-2 border-[#2563EB] dark:border-blue-500/70 rounded-xl p-1 shadow-2xs">
                    <div className="bg-white dark:bg-[#0B1228] px-4 py-2.5 rounded-lg border border-[#E2E8F0] dark:border-blue-900/40 flex items-center justify-center min-w-[48px]">
                      <span className="font-mono font-bold text-base text-[#0F172A] dark:text-white">10</span>
                    </div>
                    <div className="bg-[#EFF6FF] dark:bg-blue-950/60 px-3 py-2.5 rounded-lg flex items-center justify-center ml-1">
                      <div className="w-3 h-3 rounded-full bg-[#2563EB] dark:bg-blue-400" />
                    </div>
                  </div>

                  {/* Node Label Below */}
                  <span className="text-xs font-bold text-[#0F172A] dark:text-slate-300 mt-1.5">Node</span>
                </div>

                {/* Arrow pointing to "Points to the next node" */}
                <ArrowRight className="w-5 h-5 text-[#2563EB] dark:text-blue-400 stroke-[2.5] shrink-0" />

                {/* "Points to the next node" pill card */}
                <div className="bg-[#EFF6FF] dark:bg-blue-950/50 border border-[#BFDBFE] dark:border-blue-900/40 rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#2563EB] dark:text-blue-300 text-center max-w-[110px] leading-snug">
                  Points to the next node
                </div>
              </div>

              {/* End of list note card */}
              <div className="bg-[#EFF6FF]/60 dark:bg-blue-950/30 border border-[#DBEAFE] dark:border-blue-900/30 rounded-xl p-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-w-[200px]">
                The last node points to <span className="font-mono font-bold text-[#0F172A] dark:text-white">NULL</span> (indicating the end of the list).
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 04: 2. CONCEPT ROADMAP
          ========================================================================= */}
      <section className="reveal-on-scroll bg-white dark:bg-[#0B1228] p-6 sm:p-9 rounded-2xl border border-slate-200/90 dark:border-blue-900/30 shadow-xs dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
        {/* Section Header */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-full bg-[#EFF6FF] dark:bg-blue-950/70 border border-[#DBEAFE] dark:border-blue-900/30 flex items-center justify-center text-[#2563EB] dark:text-blue-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white">
            2. Concept Roadmap
          </h2>
        </div>

        {/* 5-Stage Progression */}
        <div className="relative">
          {/* Connected Dashed Line Across the 5 Steps (desktop) */}
          <div className="hidden md:block absolute top-5 left-[10%] right-[10%] h-0.5 border-t-2 border-dashed border-[#DBEAFE] dark:border-blue-900/40 z-0" />

          <div className="flex flex-col items-center md:grid md:grid-cols-5 md:gap-4 md:items-start relative z-10">
            {/* Stage 01: Node Structure */}
            <div
              onClick={() => {
                soundManager.playSelect();
                onNavigateToTab('THEORY', 'what-is-hashing');
              }}
              className="flex flex-col items-center text-center group cursor-pointer w-full max-w-[220px] md:max-w-none"
            >
              <div className="w-10 h-10 rounded-full bg-[#EFF6FF] dark:bg-blue-950 text-[#1D4ED8] dark:text-blue-300 border-2 border-white dark:border-[#0B1228] shadow-xs flex items-center justify-center font-mono font-extrabold text-xs mb-3 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                01
              </div>
              <div className="w-12 h-12 rounded-full bg-[#ECFDF5] dark:bg-[#131B38] border border-[#A7F3D0] dark:border-emerald-500/30 flex items-center justify-center text-[#10B981] dark:text-emerald-400 mb-2.5 shadow-2xs group-hover:border-emerald-400 transition-all">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white leading-snug">
                Node <br className="hidden md:inline" /> Structure
              </h3>
            </div>

            {/* Mobile Connector Line: 01 -> 02 */}
            <div className="md:hidden w-0.5 h-6 border-l-2 border-dashed border-[#DBEAFE] dark:border-blue-900/40 my-2" />

            {/* Stage 02: Traversal */}
            <div
              onClick={() => {
                soundManager.playSelect();
                onNavigateToTab('THEORY', 'hash-table');
              }}
              className="flex flex-col items-center text-center group cursor-pointer w-full max-w-[220px] md:max-w-none"
            >
              <div className="w-10 h-10 rounded-full bg-[#EFF6FF] dark:bg-blue-950 text-[#1D4ED8] dark:text-blue-300 border-2 border-white dark:border-[#0B1228] shadow-xs flex items-center justify-center font-mono font-extrabold text-xs mb-3 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                02
              </div>
              <div className="w-12 h-12 rounded-full bg-[#EFF6FF] dark:bg-[#131B38] border border-[#BFDBFE] dark:border-blue-500/30 flex items-center justify-center text-[#3B82F6] dark:text-blue-400 mb-2.5 shadow-2xs group-hover:border-blue-400 transition-all">
                <List className="w-5 h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white leading-snug">
                Traversal
              </h3>
            </div>

            {/* Mobile Connector Line: 02 -> 03 */}
            <div className="md:hidden w-0.5 h-6 border-l-2 border-dashed border-[#DBEAFE] dark:border-blue-900/40 my-2" />

            {/* Stage 03: Insertion */}
            <div
              onClick={() => {
                soundManager.playSelect();
                onNavigateToTab('THEORY', 'hash-function');
              }}
              className="flex flex-col items-center text-center group cursor-pointer w-full max-w-[220px] md:max-w-none"
            >
              <div className="w-10 h-10 rounded-full bg-[#EFF6FF] dark:bg-blue-950 text-[#1D4ED8] dark:text-blue-300 border-2 border-white dark:border-[#0B1228] shadow-xs flex items-center justify-center font-mono font-extrabold text-xs mb-3 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                03
              </div>
              <div className="w-12 h-12 rounded-full bg-[#E0F2FE] dark:bg-[#131B38] border border-[#BAE6FD] dark:border-sky-500/30 flex items-center justify-center text-[#0284C7] dark:text-sky-400 mb-2.5 shadow-2xs group-hover:border-sky-400 transition-all">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white leading-snug">
                Insertion
              </h3>
            </div>

            {/* Mobile Connector Line: 03 -> 04 */}
            <div className="md:hidden w-0.5 h-6 border-l-2 border-dashed border-[#DBEAFE] dark:border-blue-900/40 my-2" />

            {/* Stage 04: Deletion */}
            <div
              onClick={() => {
                soundManager.playSelect();
                onNavigateToTab('THEORY', 'what-is-a-collision');
              }}
              className="flex flex-col items-center text-center group cursor-pointer w-full max-w-[220px] md:max-w-none"
            >
              <div className="w-10 h-10 rounded-full bg-[#EFF6FF] dark:bg-blue-950 text-[#1D4ED8] dark:text-blue-300 border-2 border-white dark:border-[#0B1228] shadow-xs flex items-center justify-center font-mono font-extrabold text-xs mb-3 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                04
              </div>
              <div className="w-12 h-12 rounded-full bg-[#FEF2F2] dark:bg-[#131B38] border border-[#FECACA] dark:border-red-500/30 flex items-center justify-center text-[#EF4444] dark:text-red-400 mb-2.5 shadow-2xs group-hover:border-red-400 transition-all">
                <Minus className="w-5 h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white leading-snug">
                Deletion
              </h3>
            </div>

            {/* Mobile Connector Line: 04 -> 05 */}
            <div className="md:hidden w-0.5 h-6 border-l-2 border-dashed border-[#DBEAFE] dark:border-blue-900/40 my-2" />

            {/* Stage 05: Applications */}
            <div
              onClick={() => {
                soundManager.playSelect();
                onNavigateToTab('THEORY', 'separate-chaining');
              }}
              className="flex flex-col items-center text-center group cursor-pointer w-full max-w-[220px] md:max-w-none"
            >
              <div className="w-10 h-10 rounded-full bg-[#EFF6FF] dark:bg-blue-950 text-[#1D4ED8] dark:text-blue-300 border-2 border-white dark:border-[#0B1228] shadow-xs flex items-center justify-center font-mono font-extrabold text-xs mb-3 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                05
              </div>
              <div className="w-12 h-12 rounded-full bg-[#EFF6FF] dark:bg-[#131B38] border border-[#BFDBFE] dark:border-blue-900/40 flex items-center justify-center text-[#2563EB] dark:text-blue-400 mb-2.5 shadow-2xs group-hover:border-blue-400 transition-all">
                <Settings className="w-5 h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white leading-snug">
                Applications
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 05: 3. WHY THIS TOPIC MATTERS
          ========================================================================= */}
      <section className="reveal-on-scroll bg-white dark:bg-[#0B1228] p-6 sm:p-9 rounded-2xl border border-slate-200/90 dark:border-blue-900/30 shadow-xs dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
        {/* Section Header */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-full bg-[#EFF6FF] dark:bg-blue-950/70 border border-[#DBEAFE] dark:border-blue-900/30 flex items-center justify-center text-[#2563EB] dark:text-blue-400">
            <Star className="w-4 h-4" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white">
            3. Why This Topic Matters
          </h2>
        </div>

        {/* 3 Value Cards Matching Exact References */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Dynamic Size */}
          <div className="bg-[#F8FAFF] dark:bg-[#0E1326] border border-[#DBEAFE] dark:border-blue-900/25 rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-2xs">
            <div className="w-11 h-11 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A] dark:text-white mb-1.5">Dynamic Size</h3>
              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Can grow or shrink during runtime.
              </p>
            </div>
          </div>

          {/* Card 2: Efficient Updates (Soft green/mint tint) */}
          <div className="bg-[#F0FDF4] dark:bg-[#0E1326] border border-[#DCFCE7] dark:border-emerald-900/25 rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-2xs">
            <div className="w-11 h-11 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A] dark:text-white mb-1.5">Efficient Updates</h3>
              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Insertions and deletions are easier compared to arrays.
              </p>
            </div>
          </div>

          {/* Card 3: Real-World Use (Subtle Blue Tint) */}
          <div className="bg-[#EFF6FF] dark:bg-[#0E1326] border border-[#DBEAFE] dark:border-blue-900/25 rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-2xs">
            <div className="w-11 h-11 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A] dark:text-white mb-1.5">Real-World Use</h3>
              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Used in stacks, queues, graphs, hash tables, and many real-world systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 06: 4. READY TO START?
          ========================================================================= */}
      <section className="reveal-on-scroll bg-gradient-to-r from-[#EFF6FF] via-[#F8FAFF] to-[#EFF6FF] dark:from-[#0B1228] dark:via-[#0F1836] dark:to-[#0B1228] border border-[#BFDBFE] dark:border-blue-900/30 p-6 sm:p-8 rounded-2xl shadow-xs dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Side: Educational Rocket Visual & Supporting Text */}
          <div className="flex items-center gap-5 sm:gap-6">
            {/* 3D Diagonal Rocket Illustration */}
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
                    <stop offset="60%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#1D4ED8" />
                  </linearGradient>
                  <linearGradient id="blueFinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="85%" stopColor="#1D4ED8" />
                    <stop offset="100%" stopColor="#6366F1" />
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
                  <circle cx="24" cy="98" r="16" fill="#BFDBFE" opacity="0.45" />
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
                  {/* Left Fin */}
                  <path
                    d="M 54 58 C 42 64 38 74 42 78 C 50 76 56 70 58 64 Z"
                    fill="url(#blueFinGrad)"
                  />

                  {/* Right Fin */}
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

                  {/* 3D Porthole / Window */}
                  <circle cx="68" cy="46" r="8" fill="url(#blueNoseGrad)" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="68" cy="46" r="5" fill="#1E3A8A" />
                  <circle cx="66" cy="44" r="1.75" fill="#FFFFFF" opacity="0.9" />
                </g>
              </svg>
            </div>

            {/* Title & Description */}
            <div className="flex flex-col gap-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] dark:text-white">
                4. Ready to Start?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed">
                Explore the concept of single linked lists and build a strong foundation in data structures.
              </p>
            </div>
          </div>

          {/* Right Side: Start Learning Button */}
          <button
            id="btn-home-start-learning"
            onClick={handleStartLearning}
            className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#6366F1] hover:from-[#1E40AF] hover:via-[#1D4ED8] hover:to-[#4F46E5] text-white font-bold text-sm sm:text-base rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer shrink-0 group hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Start Learning</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>
    </div>
  );
};

