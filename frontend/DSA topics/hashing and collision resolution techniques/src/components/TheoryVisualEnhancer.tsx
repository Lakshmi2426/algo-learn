import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowDown,
  CornerDownRight,
  ShieldAlert,
  Link as LinkIcon,
  Play,
  RotateCcw,
  Check,
  AlertTriangle,
  Zap,
  Cpu,
  Database,
  Lock,
  Search,
  Layers,
  Sparkles,
  Server,
  FileCode,
} from 'lucide-react';

interface TheoryVisualEnhancerProps {
  chapterId: string;
}

export const TheoryVisualEnhancer: React.FC<TheoryVisualEnhancerProps> = ({ chapterId }) => {
  // Topic 03 state for insertion demo
  const [topic3Step, setTopic3Step] = useState<number>(0);

  // =========================================================================
  // TOPIC 01: WHAT IS HASHING?
  // =========================================================================
  if (chapterId === 'theory-01' || chapterId === 'what-is-hashing') {
    return (
      <div className="space-y-4 font-sans text-slate-900 dark:text-white animate-fadeIn">
        {/* Concept Flow Diagram */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="text-xs font-bold uppercase text-[#2563EB] dark:text-[#3B82F6] tracking-wider mb-4 flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Architecture Diagram // Hashing Concept</span>
          </div>

          {/* Desktop & Mobile Responsive Flow */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2 text-center">
            {/* Step 1: Input Key */}
            <div className="w-full sm:w-auto flex-1 p-3.5 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase font-mono">1. Input Key</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">23</span>
            </div>

            <div className="text-[#2563EB] dark:text-[#3B82F6] font-black text-lg rotate-90 sm:rotate-0">➔</div>

            {/* Step 2: Hash Function */}
            <div className="w-full sm:w-auto flex-1 p-3.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-500/30 rounded-xl shadow-xs">
              <span className="text-[10px] text-[#2563EB] dark:text-[#3B82F6] font-bold block uppercase font-mono">2. Hash Function</span>
              <span className="text-sm sm:text-base font-bold text-blue-900 dark:text-[#3B82F6] font-mono">23 % 10</span>
            </div>

            <div className="text-[#2563EB] dark:text-[#3B82F6] font-black text-lg rotate-90 sm:rotate-0">➔</div>

            {/* Step 3: Array Index */}
            <div className="w-full sm:w-auto flex-1 p-3.5 bg-[#2563EB] dark:bg-[#2563EB] text-white rounded-xl shadow-xs">
              <span className="text-[10px] text-blue-100 font-bold block uppercase font-mono">3. Target Index</span>
              <span className="text-xl sm:text-2xl font-black font-mono">[03]</span>
            </div>

            <div className="text-[#2563EB] dark:text-[#3B82F6] font-black text-lg rotate-90 sm:rotate-0">➔</div>

            {/* Step 4: Storage */}
            <div className="w-full sm:w-auto flex-1 p-3.5 bg-blue-50 dark:bg-[#1E293B] text-blue-900 dark:text-white border border-blue-200 dark:border-blue-500/30 rounded-xl shadow-xs">
              <span className="text-[10px] text-[#2563EB] dark:text-slate-400 font-bold block uppercase font-mono">4. Hash Table</span>
              <span className="text-sm font-bold font-mono">Bucket 3</span>
            </div>
          </div>

          {/* Visual Hash Table Representation */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 block font-mono">
              Hash Table Memory Slots (Size = 10):
            </span>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 text-center">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border transition-all ${
                    idx === 3
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-[#2563EB] dark:border-[#2563EB] shadow-sm scale-105'
                      : 'bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">[{idx}]</div>
                  <div className={`text-sm font-black mt-0.5 font-mono ${idx === 3 ? 'text-[#2563EB] dark:text-[#3B82F6]' : 'text-slate-300 dark:text-slate-600'}`}>
                    {idx === 3 ? '23' : '—'}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#2563EB] dark:text-[#3B82F6] font-semibold pt-2">
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Key 23 stored directly at index 3 in O(1) time</span>
            </div>
          </div>
        </div>

        {/* Worked Example & How it Works Sequence */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 font-mono">Worked Example</span>
            <div className="bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#3B82F6] p-3.5 rounded-xl text-sm font-bold font-mono border border-[#E5E7EB] dark:border-slate-800 border-l-4 border-l-[#2563EB] dark:border-l-blue-500">
              <code>23 % 10 = 3</code>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans pt-1">
              Key <strong>23</strong> divided by table size <strong>10</strong> gives quotient 2 and remainder <strong>3</strong>. Hence slot index = 3.
            </p>
          </div>

          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 font-mono">Why O(1) Matters</span>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-medium space-y-1">
              <div className="font-bold">Linear Array Search: O(N)</div>
              <div>Hash Table Lookup: <strong>O(1) Constant Time</strong></div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans pt-1">
              With 1,000,000 items, linear search takes ~500,000 ops. Hashing takes exactly 1 operation!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TOPIC 02: THE HASH FUNCTION
  // =========================================================================
  if (chapterId === 'theory-02' || chapterId === 'hash-function') {
    return (
      <div className="space-y-4 font-sans text-slate-900 dark:text-white animate-fadeIn">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="text-xs font-bold uppercase text-[#2563EB] dark:text-[#3B82F6] tracking-wider flex items-center gap-1.5 font-mono">
            <Cpu className="w-4 h-4" />
            <span>Mathematical Proof & Modulo Boundaries</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="p-3.5 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold font-mono">1. DIVISION METHOD</span>
              <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-1">h(k) = k mod m</div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Best with prime table size m</span>
            </div>

            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-500/30 rounded-xl shadow-xs">
              <span className="text-[10px] text-[#2563EB] dark:text-[#3B82F6] font-bold font-mono">2. BOUNDARY GUARANTEE</span>
              <div className="text-sm font-bold text-blue-900 dark:text-[#3B82F6] font-mono mt-1">0 ≤ h(k) &lt; m</div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Output never exceeds array bounds</span>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold font-mono">3. UNIFORM DISPERSAL</span>
              <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-1">P(h(k) = i) = 1/m</div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Minimizes clustered hot-spots</span>
            </div>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#3B82F6] p-4 rounded-xl text-xs font-mono space-y-1.5 border border-[#E5E7EB] dark:border-slate-800 border-l-4 border-l-[#2563EB] dark:border-l-blue-500">
            <div>// Modulo Division Examples (Table Size m = 7):</div>
            <div>h(15) = 15 % 7 = 1  → Bucket [01]</div>
            <div>h(22) = 22 % 7 = 1  → Bucket [01] (COLLISION!)</div>
            <div>h(35) = 35 % 7 = 0  → Bucket [00]</div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TOPIC 03: THE HASH TABLE
  // =========================================================================
  if (chapterId === 'theory-03' || chapterId === 'hash-table') {
    const tableKeys = [
      { key: 12, slot: 2 },
      { key: 45, slot: 5 },
      { key: 78, slot: 8 },
    ];

    return (
      <div className="space-y-4 font-sans text-slate-900 dark:text-white animate-fadeIn">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#2563EB] dark:text-[#3B82F6] tracking-wider font-mono">
              Memory Slot Array (Buckets 0 to 9)
            </span>
            <button
              onClick={() => setTopic3Step((prev) => (prev + 1) % 4)}
              className="btn-modern-primary px-3 py-1.5 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Step Insertion ({topic3Step}/3)</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center font-mono">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((slotIdx) => {
              const matched = tableKeys.find((tk, idx) => tk.slot === slotIdx && idx < topic3Step);
              return (
                <div
                  key={slotIdx}
                  className={`p-3 rounded-xl border transition-all ${
                    matched
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-[#2563EB] dark:border-[#2563EB] shadow-xs'
                      : 'bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Slot [{slotIdx}]</div>
                  <div className="text-base font-black mt-1 text-slate-900 dark:text-white">
                    {matched ? matched.key : 'EMPTY'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 font-mono">
            {topic3Step === 0 && 'Click "Step Insertion" to populate the hash table sequentially.'}
            {topic3Step === 1 && 'Inserted Key 12 at Index 12 % 10 = [02] in O(1) time.'}
            {topic3Step === 2 && 'Inserted Key 45 at Index 45 % 10 = [05] in O(1) time.'}
            {topic3Step === 3 && 'Inserted Key 78 at Index 78 % 10 = [08]. Table load factor = 0.3.'}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TOPIC 05: WHAT IS A COLLISION?
  // =========================================================================
  if (chapterId === 'theory-05' || chapterId === 'what-is-a-collision') {
    return (
      <div className="space-y-4 font-sans text-slate-900 dark:text-white animate-fadeIn">
        <div className="bg-white dark:bg-[#111827] border border-rose-200 dark:border-rose-500/30 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="text-xs font-bold uppercase text-rose-600 dark:text-rose-400 tracking-wider flex items-center gap-1.5 font-mono">
            <ShieldAlert className="w-4 h-4" />
            <span>Collision Demonstration // Two Keys Target Same Slot</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">Existing Key</span>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono">Key: 15</div>
              <div className="text-xs font-mono text-[#2563EB] dark:text-[#3B82F6] font-bold">15 % 10 = Index [05]</div>
            </div>

            <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/40 rounded-xl text-center space-y-1">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 font-mono">Incoming Key</span>
              <div className="text-xl font-black text-rose-700 dark:text-rose-300 font-mono">Key: 25</div>
              <div className="text-xs font-mono text-rose-600 dark:text-rose-400 font-bold">25 % 10 = Index [05] (COLLISION!)</div>
            </div>
          </div>

          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border-l-4 border-l-rose-500 border border-rose-200 dark:border-rose-500/20 rounded-r-xl text-xs text-rose-900 dark:text-rose-200 font-sans leading-relaxed">
            <strong>Pigeonhole Principle:</strong> When inserting more keys than table capacity (or randomly across limited slots), collisions are mathematically guaranteed. Collision resolution algorithms determine where to place the second key.
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TOPIC 06: SEPARATE CHAINING
  // =========================================================================
  if (chapterId === 'theory-06' || chapterId === 'separate-chaining') {
    return (
      <div className="space-y-4 font-sans text-slate-900 dark:text-white animate-fadeIn">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="text-xs font-bold uppercase text-[#2563EB] dark:text-[#3B82F6] tracking-wider flex items-center gap-1.5 font-mono">
            <LinkIcon className="w-4 h-4" />
            <span>Closed Addressing // Linked Bucket Architecture</span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-[#0B1120] rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="bg-[#2563EB] dark:bg-[#1E293B] text-white px-2.5 py-1 rounded-md font-bold">Bucket [0]</span>
              <span className="text-slate-400">→ NULL</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-500/30 overflow-x-auto">
              <span className="bg-[#2563EB] dark:bg-[#3B82F6] text-white px-2.5 py-1 rounded-md font-bold">Bucket [3]</span>
              <span className="text-[#2563EB] dark:text-[#3B82F6] font-black">→</span>
              <span className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-md font-bold text-slate-800 dark:text-white">[23]</span>
              <span className="text-[#2563EB] dark:text-[#3B82F6] font-black">→</span>
              <span className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-md font-bold text-slate-800 dark:text-white">[33]</span>
              <span className="text-[#2563EB] dark:text-[#3B82F6] font-black">→</span>
              <span className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-md font-bold text-slate-800 dark:text-white">[73]</span>
              <span className="text-slate-400">→ NULL</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-[#0B1120] rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="bg-[#2563EB] dark:bg-[#1E293B] text-white px-2.5 py-1 rounded-md font-bold">Bucket [7]</span>
              <span className="text-slate-400">→</span>
              <span className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-md font-bold text-slate-800 dark:text-white">[47]</span>
              <span className="text-slate-400">→ NULL</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TOPIC 07: LINEAR PROBING
  // =========================================================================
  if (chapterId === 'theory-07' || chapterId === 'linear-probing') {
    return (
      <div className="space-y-4 font-sans text-slate-900 dark:text-white animate-fadeIn">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="text-xs font-bold uppercase text-[#2563EB] dark:text-[#3B82F6] tracking-wider flex items-center gap-1.5 font-mono">
            <Search className="w-4 h-4" />
            <span>Open Addressing // Sequential Step Scanning (+1, +2, +3...)</span>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#3B82F6] p-4 rounded-xl text-xs font-mono border border-[#E5E7EB] dark:border-slate-800 border-l-4 border-l-[#2563EB] dark:border-l-blue-500">
            <code>h(k, i) = (h(k) + i) mod m</code>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-center font-mono text-xs">
            <div className="p-3 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="text-slate-500 dark:text-slate-400 block font-bold">Step i = 0</span>
              <span className="text-sm font-black text-slate-900 dark:text-white mt-1 block">Slot [3] (Full)</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="text-slate-500 dark:text-slate-400 block font-bold">Step i = 1</span>
              <span className="text-sm font-black text-slate-900 dark:text-white mt-1 block">Slot [4] (Full)</span>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-500/30 rounded-xl">
              <span className="text-[#2563EB] dark:text-[#3B82F6] block font-bold">Step i = 2</span>
              <span className="text-sm font-black text-[#2563EB] dark:text-[#3B82F6] mt-1 block">Slot [5] (Empty ✓)</span>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 rounded-xl">
              <span className="text-emerald-700 dark:text-emerald-300 block font-bold">Placed</span>
              <span className="text-sm font-black text-emerald-800 dark:text-emerald-200 mt-1 block">Key Stored in [5]</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TOPIC 08: QUADRATIC PROBING
  // =========================================================================
  if (chapterId === 'theory-08' || chapterId === 'quadratic-probing') {
    return (
      <div className="space-y-4 font-sans text-slate-900 dark:text-white animate-fadeIn">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="text-xs font-bold uppercase text-[#2563EB] dark:text-[#3B82F6] tracking-wider flex items-center gap-1.5 font-mono">
            <Zap className="w-4 h-4" />
            <span>Open Addressing // Parabolic Jump Sequence (+1, +4, +9, +16...)</span>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#3B82F6] p-4 rounded-xl text-xs font-mono border border-[#E5E7EB] dark:border-slate-800 border-l-4 border-l-[#2563EB] dark:border-l-blue-500">
            <code>h(k, i) = (h(k) + i²) mod m</code>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center font-mono text-xs">
            <div className="p-3 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="text-slate-500 dark:text-slate-400 block font-bold">i = 0 (+0)</span>
              <span className="text-sm font-black text-slate-900 dark:text-white mt-1 block">Slot [3]</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="text-slate-500 dark:text-slate-400 block font-bold">i = 1 (+1²)</span>
              <span className="text-sm font-black text-slate-900 dark:text-white mt-1 block">Slot [4]</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="text-slate-500 dark:text-slate-400 block font-bold">i = 2 (+2² = +4)</span>
              <span className="text-sm font-black text-slate-900 dark:text-white mt-1 block">Slot [7]</span>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-500/30 rounded-xl">
              <span className="text-[#2563EB] dark:text-[#3B82F6] block font-bold">i = 3 (+3² = +9)</span>
              <span className="text-sm font-black text-[#2563EB] dark:text-[#3B82F6] mt-1 block">Slot [2]</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TOPIC 09: DOUBLE HASHING
  // =========================================================================
  if (chapterId === 'theory-09' || chapterId === 'double-hashing') {
    return (
      <div className="space-y-4 font-sans text-slate-900 dark:text-white animate-fadeIn">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="text-xs font-bold uppercase text-[#2563EB] dark:text-[#3B82F6] tracking-wider flex items-center gap-1.5 font-mono">
            <Layers className="w-4 h-4" />
            <span>Optimal Open Addressing // Dual Hash Functions</span>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#3B82F6] p-4 rounded-xl text-xs font-mono border border-[#E5E7EB] dark:border-slate-800 border-l-4 border-l-[#2563EB] dark:border-l-blue-500 space-y-1">
            <div>h₁(k) = k mod m (Primary Starting Slot)</div>
            <div>h₂(k) = 1 + (k mod (m - 1)) (Non-Zero Key-Specific Jump Stride)</div>
            <div>h(k, i) = (h₁(k) + i × h₂(k)) mod m</div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
            Because each key gets a unique stride computed by h₂(k), double hashing eliminates both primary and secondary clustering completely.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TOPIC 10: REAL-WORLD APPLICATIONS
  // =========================================================================
  if (chapterId === 'theory-10' || chapterId === 'real-world-applications') {
    const apps = [
      { name: 'Database Indexing', tech: 'PostgreSQL, MySQL B-Tree / Hash Indexes', icon: Database },
      { name: 'In-Memory Caching', tech: 'Redis, Memcached key-value lookups', icon: Server },
      { name: 'Cryptographic Security', tech: 'SHA-256 password hashing & blockchains', icon: Lock },
      { name: 'Compiler Symbol Tables', tech: 'Fast variable and function name lookups', icon: FileCode },
    ];

    return (
      <div className="space-y-4 font-sans text-slate-900 dark:text-white animate-fadeIn">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {apps.map((app, idx) => {
            const Icon = app.icon;
            return (
              <div key={idx} className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#2563EB] dark:text-[#3B82F6] shrink-0 border border-blue-100 dark:border-blue-500/25">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{app.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{app.tech}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Default fallback
  return null;
};
