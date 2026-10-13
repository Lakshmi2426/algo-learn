import React, { useState, useEffect } from 'react';
import {
  Zap,
  BookOpen,
  Layers,
  ShieldAlert,
  Link as LinkIcon,
  Search,
  Sparkles,
  BarChart3,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  RotateCcw,
  Activity,
  Cpu,
  Database,
  Lock,
  ExternalLink,
  Award,
} from 'lucide-react';
import { TechniqueType } from '../types/game';
import { progressManager, normalizeTheoryChapterId } from '../utils/progressManager';
import { soundManager } from '../utils/audio';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { TheoryVisualEnhancer } from './TheoryVisualEnhancer';

export interface LearnHashingSectionProps {
  initialTopic?: string;
  onStartLevel: (levelId: number) => void;
  onOpenSandbox: (technique?: TechniqueType, size?: number) => void;
}

export interface TheoryChapter {
  id: string; // 'theory-01' to 'theory-12'
  legacySlug: string;
  number: string;
  category: string;
  title: string;
  shortTitle: string;
  readTime: string;
  moduleId: string;
  definition: string;
  analogy: string;
  specifications: string[];
  formula?: string;
  formulaLabel?: string;
  relatedLevel?: number;
  relatedTechnique?: TechniqueType;
}

export const THEORY_CHAPTERS: TheoryChapter[] = [
  {
    id: 'theory-01',
    legacySlug: 'what-is-hashing',
    number: '01',
    category: 'FUNDAMENTALS',
    title: 'WHAT IS HASHING?',
    shortTitle: 'What is Hashing?',
    readTime: '2 MIN',
    moduleId: 'fn-01-basics',
    definition:
      'A high-speed storage and retrieval technique that transforms an input key into a direct array index using a deterministic mathematical rule.',
    analogy:
      'Imagine a locker room with 10 numbered lockers. Instead of inspecting every single locker one-by-one (linear search, O(N)), a smart sign tells you: "Your locker number is Key % 10". You walk straight to your locker in O(1) time.',
    specifications: [
      'Transforms arbitrarily large keys into fixed-range memory indices.',
      'Achieves average-case O(1) time complexity for Search, Insert, and Delete operations.',
      'Eliminates the need for sequential scanning or binary search tree traversals.',
      'Deterministic: The exact same key will ALWAYS hash to the exact same starting index.',
    ],
    formula: 'Index = h(key) = key mod TableSize',
    formulaLabel: 'FUNDAMENTAL HASH MAPPING FORMULA',
    relatedLevel: 1,
    relatedTechnique: 'basic',
  },
  {
    id: 'theory-02',
    legacySlug: 'hash-function',
    number: '02',
    category: 'MATHEMATICS',
    title: 'THE HASH FUNCTION',
    shortTitle: 'The Hash Function',
    readTime: '3 MIN',
    moduleId: 'fn-02-modulo',
    definition:
      'A mathematical algorithm that compresses data of arbitrary length into a fixed-size integer within the boundary of array capacity [0, m - 1].',
    analogy:
      'Think of an analog 12-hour clock. When 15 hours pass after 12:00, you compute 15 mod 12 = 3:00. The modulo operator creates a circular dial that guarantees the output always fits inside the clock.',
    specifications: [
      'Division Method: h(k) = k mod m (where m is table size, ideally a prime number).',
      'Multiplication Method: h(k) = floor(m × (k × A mod 1)) using Knuth\'s golden ratio A ≈ 0.618033.',
      'Must be ultra-fast: O(1) computation time with minimal CPU instructions.',
      'Uniform Distribution: Must spread keys evenly across all available buckets to prevent hot-spots.',
    ],
    formula: 'h(k) = k mod m   (or for strings: h(s) = ∑ (s[i] × pⁱ) mod m)',
    formulaLabel: 'DIVISION METHOD & POLYNOMIAL ROLLING HASH',
    relatedLevel: 1,
    relatedTechnique: 'basic',
  },
  {
    id: 'theory-03',
    legacySlug: 'hash-table',
    number: '03',
    category: 'DATA STRUCTURES',
    title: 'THE HASH TABLE',
    shortTitle: 'The Hash Table',
    readTime: '3 MIN',
    moduleId: 'fn-02-modulo',
    definition:
      'An associative data structure that implements an abstract dictionary interface mapping keys to values using direct array indexing.',
    analogy:
      'A library catalog index card system. Instead of sorting 1,000,000 physical books alphabetically every time a new one arrives, each book title maps to a fixed catalog shelf coordinate.',
    specifications: [
      'Array Backing: Elements are stored in contiguous memory slots for hardware cache friendliness.',
      'Key-Value Pairs: Stores (K, V) records where K determines the slot address and V is payload data.',
      'Direct Address Translation: Eliminates search comparisons on average.',
      'Dynamic Resizing: Doubles capacity when load factor exceeds threshold α > 0.70.',
    ],
    formula: 'Array[h(key)] = Value',
    formulaLabel: 'DIRECT MEMORY ACCESS',
    relatedLevel: 1,
    relatedTechnique: 'basic',
  },
  {
    id: 'theory-04',
    legacySlug: 'hashing-lifecycle',
    number: '04',
    category: 'EXECUTION FLOW',
    title: 'THE HASHING LIFECYCLE',
    shortTitle: 'The Hashing Lifecycle',
    readTime: '2 MIN',
    moduleId: 'fn-03-level1-basic',
    definition:
      'The step-by-step pipeline an engine executes for every Insertion, Search, and Deletion operation.',
    analogy:
      'An automated parking garage: (1) Vehicle approaches and scans license plate, (2) System calculates assigned floor & spot, (3) Checks if spot is free, (4) If taken, follows reroute arrows to the next designated parking bay.',
    specifications: [
      'Step 1 (Hash Evaluation): Compute base index h(k) = k mod m.',
      'Step 2 (Occupancy Inspection): Check if target slot is empty, occupied, or deleted marker.',
      'Step 3 (Resolution Execution): If occupied by a different key, trigger collision probe.',
      'Step 4 (Final Placement / Return): Store key or return stored record once matching key found.',
    ],
    formula: 'Input Key → Hash(Key) → Index → [Check Collision] → Read/Write',
    formulaLabel: 'PIPELINE ARCHITECTURE',
    relatedLevel: 2,
    relatedTechnique: 'basic',
  },
  {
    id: 'theory-05',
    legacySlug: 'what-is-a-collision',
    number: '05',
    category: 'ANOMALY MECHANICS',
    title: 'WHAT IS A COLLISION?',
    shortTitle: 'What is a Collision?',
    readTime: '3 MIN',
    moduleId: 'fn-03-level1-basic',
    definition:
      'A phenomenon where two distinct keys produce the exact same index remainder: h(k₁) = h(k₂) where k₁ ≠ k₂.',
    analogy:
      'The Birthday Paradox: In a room of just 23 people, there is a 50% chance two people share the exact same birthday! Even with 365 available days, collisions occur far sooner than intuition suggests.',
    specifications: [
      'Pigeonhole Principle: If n items are put into m slots and n > m, at least one slot must contain > 1 item.',
      'Infinite Domain to Finite Range: Key space is virtually infinite (2⁶⁴ integers), but memory array is finite.',
      'Collisions are NOT bugs: They are mathematically inevitable in every hash table design.',
      'Resolution Engines: Require systematic strategies (Chaining or Open Addressing) to handle collisions gracefully.',
    ],
    formula: 'h(23) % 10 = 3   and   h(53) % 10 = 3   ⇒ Collision at Slot [3]',
    formulaLabel: 'COLLISION EQUATION',
    relatedLevel: 1,
    relatedTechnique: 'basic',
  },
  {
    id: 'theory-06',
    legacySlug: 'separate-chaining',
    number: '06',
    category: 'RESOLUTION STRATEGY',
    title: 'SEPARATE CHAINING',
    shortTitle: 'Separate Chaining',
    readTime: '4 MIN',
    moduleId: 'fn-04-level2-chaining',
    definition:
      'A closed-addressing collision resolution strategy where each array bucket maintains a linked list of all colliding key-value records.',
    analogy:
      'A filing cabinet with 10 lettered drawers. If drawer "B" already has a document for "Baker", you don\'t put "Barnes" in drawer "C"—you simply clip "Barnes" behind "Baker" on the same drawer\'s folder rail.',
    specifications: [
      'Closed Addressing: Colliding keys remain in their home bucket list rather than wandering into other buckets.',
      'Infinite Capacity: The table never becomes physically full; it can hold more elements than table size m (α > 1.0).',
      'Simple Deletion: Removing an item is just standard linked-list node unlinking (O(1) pointer adjustment).',
      'Memory Overhead: Requires extra memory for forward pointers and has lower CPU cache locality.',
    ],
    formula: 'Bucket[i] → [Key A] → [Key B] → [Key C] → NULL',
    formulaLabel: 'LINKED BUCKET TRAVERSAL',
    relatedLevel: 2,
    relatedTechnique: 'chaining',
  },
  {
    id: 'theory-07',
    legacySlug: 'linear-probing',
    number: '07',
    category: 'OPEN ADDRESSING',
    title: 'LINEAR PROBING',
    shortTitle: 'Linear Probing',
    readTime: '3 MIN',
    moduleId: 'fn-05-level3-linear',
    definition:
      'An open-addressing method that resolves collisions by sequentially inspecting the immediately adjacent consecutive slots (+1, +2, +3...) modulo m.',
    analogy:
      'Theater seating: You are assigned Seat 5. When you arrive, someone is sitting in Seat 5. You check Seat 6, then Seat 7, then Seat 8, until you find the very first unoccupied chair.',
    specifications: [
      'Probe Sequence: probe(i) = (h(key) + i) mod m for i = 0, 1, 2, 3...',
      'Zero Pointer Overhead: All elements reside directly inside the contiguous flat array.',
      'Superb Cache Locality: Modern CPU prefetchers excel at sequential memory sweeps.',
      'Primary Clustering Flaw: Occupied slots coalesce into long unbroken blocks, causing severe cascading delays.',
    ],
    formula: 'P(k, i) = (h(k) + i) mod m',
    formulaLabel: 'LINEAR PROBING FORMULA',
    relatedLevel: 3,
    relatedTechnique: 'linear',
  },
  {
    id: 'theory-08',
    legacySlug: 'quadratic-probing',
    number: '08',
    category: 'OPEN ADDRESSING',
    title: 'QUADRATIC PROBING',
    shortTitle: 'Quadratic Probing',
    readTime: '3 MIN',
    moduleId: 'fn-06-level4-quadratic',
    definition:
      'An open-addressing method that increases the probe step size quadratically on each collision attempt (+1², +2², +3²...) to leap over clusters.',
    analogy:
      'A frog jumping along a numbered pond. Instead of hopping 1 lily pad at a time, it jumps +1 pad on attempt 1, +4 pads on attempt 2, +9 pads on attempt 3, leaping right over crowded groups.',
    specifications: [
      'Probe Sequence: probe(i) = (h(key) + c₁·i + c₂·i²) mod m (commonly i²: +1, +4, +9, +16...).',
      'Eliminates Primary Clustering: Breaks up contiguous clump formations by leaping quadratically.',
      'Secondary Clustering: Keys with the exact same initial hash still trace the exact same quadratic jump path.',
      'Table Size Requirement: Table size m must be prime and load factor α ≤ 0.5 to guarantee finding empty slots.',
    ],
    formula: 'P(k, i) = (h(k) + i²) mod m',
    formulaLabel: 'QUADRATIC PROBE SEQUENCE',
    relatedLevel: 4,
    relatedTechnique: 'quadratic',
  },
  {
    id: 'theory-09',
    legacySlug: 'double-hashing',
    number: '09',
    category: 'OPTIMAL OPEN ADDRESSING',
    title: 'DOUBLE HASHING',
    shortTitle: 'Double Hashing',
    readTime: '4 MIN',
    moduleId: 'fn-07-level5-double',
    definition:
      'The gold standard open-addressing technique that utilizes a secondary hash function h₂(k) to calculate an individualized probe jump step for each key.',
    analogy:
      'Two different cars have a breakdown at Milestone 10. Car A has jump gear = 3 (checks 13, 16, 19). Car B has jump gear = 7 (checks 17, 24, 31). Even though both collided at 10, their paths diverge completely!',
    specifications: [
      'Dual Engines: h₁(k) = k mod m (base address) and h₂(k) = R - (k mod R) (step size, where R < m is prime).',
      'Non-Zero Step: h₂(k) must NEVER evaluate to 0, or the search would loop in an infinite freeze.',
      'Zero Clustering: Eliminates both primary and secondary clustering entirely.',
      'Theoretical Uniformity: Closest practical approximation to ideal uniform hashing.',
    ],
    formula: 'P(k, i) = (h₁(k) + i × h₂(k)) mod m   [where h₂(k) > 0 and gcd(h₂, m) = 1]',
    formulaLabel: 'DOUBLE HASHING FORMULA',
    relatedLevel: 5,
    relatedTechnique: 'double_hashing',
  },
  {
    id: 'theory-10',
    legacySlug: 'real-world-applications',
    number: '10',
    category: 'PRODUCTION SYSTEMS',
    title: 'REAL-WORLD APPLICATIONS',
    shortTitle: 'Real-World Applications',
    readTime: '3 MIN',
    moduleId: 'fn-08-load-factor',
    definition:
      'How modern operating systems, high-throughput web databases, compilers, and routers utilize hash tables in mission-critical infrastructure.',
    analogy:
      'A global telephone directory with 8 billion numbers. When you place a call, telecommunication switches locate the recipient routing circuit in sub-millisecond O(1) hash time.',
    specifications: [
      'In-Memory Caches: Redis and Memcached use hash dictionaries for sub-millisecond key-value storage.',
      'Language Runtimes: JavaScript Objects / Maps, Python Dictionaries (dict), Java HashMaps, C++ std::unordered_map.',
      'Database Indexing: PostgreSQL and MySQL Hash Indexes for ultra-fast point equality lookups.',
      'Compilers & Interpreters: Symbol tables storing variable identifiers, function scopes, and memory pointers.',
    ],
    formula: 'Redis / Python / Java: Key → MurmurHash3 / SipHash → Bucket Address',
    formulaLabel: 'INDUSTRIAL ENGINE EXAMPLES',
    relatedLevel: 5,
    relatedTechnique: 'double_hashing',
  },
  {
    id: 'theory-11',
    legacySlug: 'core-advantages',
    number: '11',
    category: 'BENCHMARK ANALYSIS',
    title: 'CORE ADVANTAGES',
    shortTitle: 'Core Advantages',
    readTime: '2 MIN',
    moduleId: 'fn-08-load-factor',
    definition:
      'The foundational mathematical and operational reasons why Hash Tables are the most widely deployed data structure in computer science.',
    analogy:
      'Comparing a supersonic bullet train directly to an elevator: An elevator moves floor-by-floor sequentially, whereas hashing teleports directly to your target destination.',
    specifications: [
      'Constant Time Complexity: O(1) average case Search, Insertion, and Deletion.',
      'Scale Independence: Lookup time for 1,000,000,000 items is nearly identical to lookup time for 10 items.',
      'Flexibility: Can index arbitrary key data types (strings, UUIDs, coordinates, binary blobs).',
      'Predictable Memory Footprint: When sized properly, delivers high density with minimal operational overhead.',
    ],
    formula: 'Time Complexity: Average O(1) Search, O(1) Insert, O(1) Delete',
    formulaLabel: 'ASYMPTOTIC SPECIFICATION',
    relatedLevel: 1,
    relatedTechnique: 'basic',
  },
  {
    id: 'theory-12',
    legacySlug: 'limitations-tradeoffs',
    number: '12',
    category: 'ENGINEERING TRADEOFFS',
    title: 'LIMITATIONS & TRADE-OFFS',
    shortTitle: 'Limitations & Trade-offs',
    readTime: '3 MIN',
    moduleId: 'fn-09-quiz',
    definition:
      'The physical engineering constraints, worst-case scenarios, and ordering trade-offs every software architect must understand.',
    analogy:
      'A sports car tuned exclusively for straight-line velocity. It shatters speed records on flat highway, but cannot handle off-road rocky mountain terrain (ordered range queries).',
    specifications: [
      'No Ordering: Hash tables cannot perform efficient min, max, or range queries (e.g., "all users aged 20 to 30").',
      'Worst-Case O(N) Degradation: Under severe pathological collisions or hash DOS attacks, performance collapses.',
      'Rehash Cost: Resizing the table is an O(N) operation that temporarily spikes latency.',
      'Memory Overhead: Unused empty array slots and linked node pointers consume extra RAM.',
    ],
    formula: 'Worst Case: O(N) when all keys hash to the same bucket',
    formulaLabel: 'PATHOLOGICAL DEGRADATION',
    relatedLevel: 5,
    relatedTechnique: 'double_hashing',
  },
];

export const LearnHashingSection: React.FC<LearnHashingSectionProps> = ({
  initialTopic = 'theory-01',
  onStartLevel,
  onOpenSandbox,
}) => {
  useScrollReveal();

  // Active Chapter State (resolves slugs or numbers to normalized IDs)
  const [activeChapterId, setActiveChapterId] = useState<string>(() =>
    normalizeTheoryChapterId(initialTopic)
  );

  // Mini-Widget State: Modulo Interactive Workbench
  const [calcKey, setCalcKey] = useState<number>(43);
  const [calcTableSize, setCalcTableSize] = useState<number>(10);

  // Mini-Widget State: Speed Benchmark O(N) vs O(1)
  const [raceRunning, setRaceRunning] = useState<boolean>(false);
  const [linearSteps, setLinearSteps] = useState<number>(0);
  const [hashSteps, setHashSteps] = useState<number>(0);
  const [raceTarget, setRaceTarget] = useState<number>(78);

  // Progress State from Single Source of Truth
  const [pState, setPState] = useState(() => progressManager.getState());

  useEffect(() => {
    if (initialTopic) {
      const normalized = normalizeTheoryChapterId(initialTopic);
      setActiveChapterId(normalized);
    }
  }, [initialTopic]);

  useEffect(() => {
    const unsub = progressManager.subscribe((state) => {
      setPState(state);
    });
    return () => unsub();
  }, []);

  const activeChapterIndex = THEORY_CHAPTERS.findIndex(
    (c) => c.id === activeChapterId || c.legacySlug === activeChapterId
  );
  const activeChapter =
    activeChapterIndex >= 0 ? THEORY_CHAPTERS[activeChapterIndex] : THEORY_CHAPTERS[0];

  const completedChapters = pState.completedTheoryChapters || [];
  const isCurrentChapterCompleted = completedChapters.includes(activeChapter.id);
  const totalCompletedCount = completedChapters.length;
  const theoryPercentage = Math.round((totalCompletedCount / 12) * 100);

  // Hook for automatic scroll-to-reveal animations on chapter and tab updates
  useScrollReveal([activeChapter.id]);

  // Selecting a chapter in the sidebar or reviewing
  const handleSelectChapter = (chapterId: string) => {
    soundManager.playSelect();
    const normalized = normalizeTheoryChapterId(chapterId);
    setActiveChapterId(normalized);
    progressManager.setCurrentTheoryChapter(normalized);
  };

  // Idempotent "Mark As Completed" Action
  const handleMarkCompleted = () => {
    if (isCurrentChapterCompleted) {
      // Already completed, do not replay sound or modify state
      return;
    }
    const newlyCompleted = progressManager.completeTheoryChapter(activeChapter.id);
    if (newlyCompleted) {
      soundManager.playTheoryComplete();
    }
  };

  // "Next" Action: Auto-marks current chapter if uncompleted, then advances
  const handleNextChapter = () => {
    soundManager.playNav();
    // Ensure current chapter is completed when clicking Next
    if (!isCurrentChapterCompleted) {
      const newlyCompleted = progressManager.completeTheoryChapter(activeChapter.id);
      if (newlyCompleted) {
        soundManager.playTheoryComplete();
      }
    }

    if (activeChapterIndex < THEORY_CHAPTERS.length - 1) {
      const nextChapter = THEORY_CHAPTERS[activeChapterIndex + 1];
      setActiveChapterId(nextChapter.id);
      progressManager.setCurrentTheoryChapter(nextChapter.id);
    }
  };

  const handlePrevChapter = () => {
    soundManager.playNav();
    if (activeChapterIndex > 0) {
      const prevChapter = THEORY_CHAPTERS[activeChapterIndex - 1];
      setActiveChapterId(prevChapter.id);
      progressManager.setCurrentTheoryChapter(prevChapter.id);
    }
  };

  // Run the O(N) vs O(1) Speed Race
  const runSpeedRace = () => {
    if (raceRunning) return;
    setRaceRunning(true);
    setLinearSteps(0);
    setHashSteps(1);

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep += 1;
      setLinearSteps(currentStep);
      if (currentStep >= raceTarget) {
        clearInterval(interval);
        setRaceRunning(false);
      }
    }, 20);
  };

  const calculatedMod = calcKey % calcTableSize;
  const quotient = Math.floor(calcKey / calcTableSize);

  return (
    <div className="w-full max-w-7xl mx-auto py-2 sm:py-4 px-2 sm:px-4 space-y-6 font-sans text-slate-900 dark:text-white animate-page-enter">
      {/* =========================================================================
          1. HEADER SECTION
          ========================================================================= */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl pt-5 pb-6 px-6 sm:px-8 bg-white dark:bg-[#111827] shadow-xs dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] reveal-on-scroll">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#3B82F6] border border-blue-100 dark:border-blue-500/30 rounded-md text-xs font-semibold uppercase tracking-wider font-mono">
              CURRICULUM // VOL. 01
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-sans">
              Theory & Mathematical Foundations
            </span>
          </div>
          <div className="text-xs font-mono text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#0B1120] px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
            Progress: <span className="text-[#2563EB] dark:text-[#3B82F6] font-bold">{totalCompletedCount}</span> / 12 Chapters ({theoryPercentage}%)
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight animate-heading-enter">
          Theory of Hashing & Collision Resolutions
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl mt-2 leading-relaxed font-normal">
          An intuitive and rigorous technical guide covering keys, hash functions, memory buckets, collision phenomena, and mathematical resolution engines.
        </p>
      </div>

      {/* =========================================================================
          2. TWO-COLUMN INTERFACE:
             Left Sidebar: Chapter Directory (12 Chapters)
             Right Main: Active Chapter Content
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =========================================================================
            LEFT COLUMN: CHAPTER DIRECTORY (12 CHAPTERS)
            ========================================================================= */}
        <aside className="lg:col-span-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] overflow-hidden">
          {/* Directory Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0B1120] flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
              Table of Contents
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium">
              12 Chapters
            </span>
          </div>

          {/* List of 12 Selectable Chapter Rows */}
          <nav className="divide-y divide-slate-100 dark:divide-slate-800" aria-label="Table of Contents">
            {THEORY_CHAPTERS.map((chap) => {
              const isSelected = activeChapter.id === chap.id;
              const isCompleted = completedChapters.includes(chap.id);

              return (
                <button
                  key={chap.id}
                  id={`btn-chapter-${chap.id}`}
                  onClick={() => handleSelectChapter(chap.id)}
                  className={`w-full text-left px-4 py-3 transition-all flex items-center justify-between gap-2 cursor-pointer group select-none ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#3B82F6] font-semibold border-l-4 border-l-[#2563EB] dark:border-l-[#3B82F6]'
                      : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1E293B] font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className={`text-xs font-mono font-bold shrink-0 ${
                        isSelected ? 'text-[#2563EB] dark:text-[#3B82F6]' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                      }`}
                    >
                      {chap.number}
                    </span>
                    <span className="text-sm leading-snug font-sans break-words">
                      {chap.shortTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCompleted ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs" title="Completed">
                        ✓
                      </span>
                    ) : isSelected ? (
                      <span className="text-[#2563EB] dark:text-[#3B82F6] text-xs font-bold" title="Current">
                        ●
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600 text-xs font-normal" title="Available">
                        ○
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer Progress Summary */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#0B1120] border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-sans">
            <span>Status:</span>
            <span className="font-semibold text-slate-900 dark:text-white font-mono">
              {totalCompletedCount} / 12 Completed
            </span>
          </div>
        </aside>

        {/* =========================================================================
            RIGHT COLUMN: ACTIVE CHAPTER VIEWER
            ========================================================================= */}
        <main
          key={activeChapter.id}
          className="lg:col-span-8 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] space-y-6 animate-chapter-switch"
        >
          {/* Chapter Metadata Header Tag & Read Time */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-500/30 text-[#2563EB] dark:text-[#3B82F6] rounded-md text-xs font-semibold uppercase tracking-wider font-mono">
                Chapter {activeChapter.number} // {activeChapter.category}
              </span>
              {isCurrentChapterCompleted && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-md text-xs font-semibold font-sans">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                  <span>Completed</span>
                </span>
              )}
            </div>
            <div className="text-xs font-sans text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
              <span>Est. Read: {activeChapter.readTime}</span>
            </div>
          </div>

          {/* Chapter Big Heading */}
          <div className="mb-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {parseInt(activeChapter.number, 10)}. {activeChapter.title}
            </h2>
          </div>

          {/* 1. EXECUTIVE DEFINITION */}
          <div className="space-y-2 reveal-on-scroll">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-mono">
              Executive Definition
            </span>
            <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed max-w-3xl">
              {activeChapter.definition}
            </p>
          </div>

          {/* 2. FIELD ANALOGY */}
          <div className="bg-blue-50/60 dark:bg-blue-950/30 border-l-4 border-l-[#2563EB] dark:border-l-[#3B82F6] border border-blue-100 dark:border-blue-500/20 rounded-r-xl p-4 sm:p-5 text-slate-800 dark:text-slate-200 leading-relaxed space-y-1.5 shadow-xs reveal-on-scroll stagger-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#3B82F6] block font-mono">
              Core Intuition // Analogy
            </span>
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed italic">
              "{activeChapter.analogy}"
            </p>
          </div>

          {/* 3. CRITICAL SPECIFICATIONS */}
          <div className="space-y-3 reveal-on-scroll stagger-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-mono">
              Critical Specifications
            </span>
            <ul className="space-y-2.5 text-sm sm:text-base text-slate-700 dark:text-slate-300 max-w-3xl">
              {activeChapter.specifications.map((spec, sIdx) => {
                const colonIndex = spec.indexOf(':');
                if (colonIndex > 0 && colonIndex < 40) {
                  const lead = spec.slice(0, colonIndex + 1);
                  const rest = spec.slice(colonIndex + 1);
                  return (
                    <li key={sIdx} className="flex items-start gap-3 leading-relaxed">
                      <span className="w-2 h-2 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] mt-2 shrink-0" />
                      <span>
                        <strong className="font-semibold text-slate-900 dark:text-white">{lead}</strong>
                        <span className="font-normal text-slate-600 dark:text-slate-300">{rest}</span>
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={sIdx} className="flex items-start gap-3 leading-relaxed">
                    <span className="w-2 h-2 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] mt-2 shrink-0" />
                    <span className="font-normal text-slate-600 dark:text-slate-300">{spec}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* 4. FORMULA CARD */}
          {activeChapter.formula && (
            <div className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl p-4 font-mono shadow-xs reveal-on-scroll stagger-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2 font-mono">
                {activeChapter.formulaLabel || 'Mathematical Formula'}
              </span>
              <div className="bg-[#F8FAFC] dark:bg-[#060913] text-[#111827] dark:text-[#3B82F6] p-3 rounded-lg text-xs sm:text-sm font-semibold overflow-x-auto border border-[#E5E7EB] dark:border-slate-800 border-l-4 border-l-[#2563EB] dark:border-l-blue-500">
                <code>{activeChapter.formula}</code>
              </div>
            </div>
          )}

          {/* 4.5. EDUCATIONAL DIAGRAMS, FORMULAS & WORKED EXAMPLES */}
          <TheoryVisualEnhancer chapterId={activeChapter.id} />

          {/* 5. INTERACTIVE WORKBENCHES FOR KEY TOPICS */}
          {activeChapter.id === 'theory-01' && (
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 font-mono space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs sm:text-sm font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" /> Speed Benchmark: O(N) vs O(1)
                </span>
                <button
                  id="btn-run-speed-benchmark"
                  onClick={runSpeedRace}
                  disabled={raceRunning}
                  className="btn-modern-primary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  {raceRunning ? 'Computing...' : 'Run Benchmark'}
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-medium mb-1 text-slate-700 dark:text-slate-300">
                    <span>Array Linear Search:</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">{linearSteps} ops (O(N))</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all duration-75 rounded-full"
                      style={{ width: `${(linearSteps / 100) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1 text-slate-700 dark:text-slate-300">
                    <span>Hash Table Direct Access:</span>
                    <span className="text-[#2563EB] dark:text-[#3B82F6] font-bold">{hashSteps} op (O(1))</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2563EB] dark:bg-[#3B82F6] transition-all duration-150 rounded-full"
                      style={{ width: hashSteps > 0 ? '100%' : '0%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeChapter.id === 'theory-02' && (
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 font-mono space-y-4 shadow-xs">
              <div className="text-xs sm:text-sm font-bold uppercase text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                <span>Interactive Modulo Workbench</span>
                <span className="text-xs text-[#2563EB] dark:text-[#3B82F6] font-bold">Live Solver</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Key (k):</label>
                  <input
                    type="number"
                    value={calcKey}
                    onChange={(e) => setCalcKey(Number(e.target.value))}
                    className="w-full p-2.5 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-blue-500/30 text-slate-900 dark:text-white rounded-lg font-bold text-base focus:ring-2 focus:ring-[#2563EB] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Table Size (m):</label>
                  <input
                    type="number"
                    value={calcTableSize}
                    min={2}
                    max={50}
                    onChange={(e) => setCalcTableSize(Math.max(2, Number(e.target.value)))}
                    className="w-full p-2.5 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-blue-500/30 text-slate-900 dark:text-white rounded-lg font-bold text-base focus:ring-2 focus:ring-[#2563EB] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 text-xs space-y-1.5">
                <div className="text-slate-600 dark:text-slate-300">
                  1. Division: {calcKey} ÷ {calcTableSize} = {quotient} with remainder {calculatedMod}
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  2. Proof: {calcKey} = ({calcTableSize} × {quotient}) + <strong className="text-slate-900 dark:text-white font-bold">{calculatedMod}</strong>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between font-medium">
                  <span className="text-xs text-slate-600 dark:text-slate-300">Target Array Index:</span>
                  <span className="text-base bg-[#2563EB] dark:bg-[#3B82F6] text-white px-3 py-0.5 rounded-md font-bold font-mono shadow-xs">
                    [{calculatedMod < 10 ? `0${calculatedMod}` : calculatedMod}]
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeChapter.id === 'theory-06' && (
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 font-mono text-xs space-y-3 shadow-xs">
              <div className="text-xs font-bold text-slate-900 dark:text-white uppercase">Bucket Linked List Traversal:</div>
              <div className="flex items-center gap-2 overflow-x-auto py-2">
                <span className="bg-[#2563EB] dark:bg-[#3B82F6] text-white px-3 py-1.5 rounded-lg font-bold">Slot [3]</span>
                <span className="text-[#2563EB] dark:text-[#3B82F6] font-black">→</span>
                <span className="bg-slate-100 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg font-bold text-slate-800 dark:text-white">[Key: 23]</span>
                <span className="text-[#2563EB] dark:text-[#3B82F6] font-black">→</span>
                <span className="bg-slate-100 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg font-bold text-slate-800 dark:text-white">[Key: 33]</span>
                <span className="text-[#2563EB] dark:text-[#3B82F6] font-black">→</span>
                <span className="bg-slate-100 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg font-bold text-slate-800 dark:text-white">[Key: 73]</span>
                <span className="text-slate-400 dark:text-slate-500 font-bold">→ NULL</span>
              </div>
            </div>
          )}

          {/* 6. BOTTOM NAVIGATION AND IDEMPOTENT COMPLETION ACTIONS */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Prev Button */}
              <button
                id="btn-prev-chapter"
                onClick={handlePrevChapter}
                disabled={activeChapterIndex === 0}
                className="btn-modern-secondary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              {/* Idempotent Mark Completed Button */}
              <button
                id="btn-mark-chapter-completed"
                onClick={handleMarkCompleted}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isCurrentChapterCompleted
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 cursor-default'
                    : 'btn-modern-primary'
                }`}
              >
                <Check className={`w-3.5 h-3.5 ${isCurrentChapterCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-white'}`} />
                <span>{isCurrentChapterCompleted ? 'Completed' : 'Mark Completed'}</span>
              </button>

              {/* Next Button */}
              {activeChapterIndex < THEORY_CHAPTERS.length - 1 ? (
                <button
                  id="btn-next-chapter"
                  onClick={handleNextChapter}
                  className="btn-modern-secondary px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  id="btn-complete-theory-to-game"
                  onClick={() => {
                    handleMarkCompleted();
                    onStartLevel(1);
                  }}
                  className="btn-modern-primary px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Start Game Mode</span>
                </button>
              )}
            </div>

            {/* Quick launch to Game Mode */}
            {activeChapter.relatedLevel && (
              <button
                id={`btn-launch-game-level-${activeChapter.relatedLevel}`}
                onClick={() => {
                  soundManager.playClick();
                  onStartLevel(activeChapter.relatedLevel || 1);
                }}
                className="btn-modern-secondary px-4 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Try Level {activeChapter.relatedLevel}</span>
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LearnHashingSection;
