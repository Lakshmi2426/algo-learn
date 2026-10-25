import React from 'react';
import {
  ArrowRight,
  ArrowDown,
  Sparkles,
  Layers,
  Database,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  ShieldAlert,
  Cpu,
  Bookmark,
} from 'lucide-react';

interface TheoryVisualEnhancerProps {
  chapterId: string;
}

export const TheoryVisualEnhancer: React.FC<TheoryVisualEnhancerProps> = ({ chapterId }) => {
  // =========================================================================
  // CHAPTER 01: INTRODUCTION TO SINGLY LINKED LIST
  // =========================================================================
  if (chapterId === 'theory-01' || chapterId === '01') {
    return (
      <div className="space-y-4 font-sans text-slate-900 dark:text-white animate-fadeIn">
        <div className="bg-white dark:bg-[#0B1228] border border-slate-200 dark:border-blue-900/30 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider mb-4 flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Visual Concept // Node Architecture & Chain Structure</span>
          </div>

          {/* Node Anatomy Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="p-4 bg-slate-50 dark:bg-[#080D1F] border border-slate-200 dark:border-blue-900/25 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase font-mono">Node Anatomy</span>
              <div className="bg-[#F8FAFC] dark:bg-[#050816] border border-slate-200 dark:border-blue-900/30 rounded-lg p-3 font-mono text-center">
                <div className="inline-flex border-2 border-blue-600 dark:border-blue-500 rounded-lg overflow-hidden font-bold text-xs sm:text-sm">
                  <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600 dark:border-blue-500">
                    DATA
                  </div>
                  <div className="px-4 py-2 bg-slate-100 dark:bg-[#0F1733] text-slate-700 dark:text-blue-300">
                    NEXT
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-1">
                <div>• <strong className="text-slate-900 dark:text-white">DATA:</strong> Stores the actual value (integer, string, object).</div>
                <div>• <strong className="text-slate-900 dark:text-white">NEXT:</strong> Stores reference/address of the next node.</div>
              </div>
            </div>

            <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 rounded-xl space-y-2">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase font-mono">Head & Null Pointers</span>
              <div className="text-xs text-slate-700 dark:text-slate-300 space-y-2 pt-1">
                <div className="p-2.5 bg-white dark:bg-[#080D1F] rounded-lg border border-blue-100 dark:border-blue-900/25">
                  <strong className="text-blue-600 dark:text-blue-400 font-mono">HEAD:</strong> Pointer to the first node in the sequence.
                </div>
                <div className="p-2.5 bg-white dark:bg-[#080D1F] rounded-lg border border-blue-100 dark:border-blue-900/25">
                  <strong className="text-rose-600 dark:text-rose-400 font-mono">NULL:</strong> The final node points to NULL, marking the end.
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Chain Visual */}
          <div className="p-4 bg-slate-50 dark:bg-[#080D1F] border border-slate-200 dark:border-blue-900/25 rounded-xl">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 font-mono block mb-3">
              Linked Chain Example:
            </span>
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs sm:text-sm overflow-x-auto py-2">
              {/* Head label */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">HEAD</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">↓</span>
                <div className="flex border-2 border-blue-600 dark:border-blue-500 rounded-lg overflow-hidden bg-white dark:bg-[#0B1228] shadow-xs">
                  <span className="px-3 py-1.5 font-black text-slate-900 dark:text-white bg-blue-50 dark:bg-blue-950/60 border-r border-blue-300 dark:border-blue-500/40">10</span>
                  <span className="px-2.5 py-1.5 text-blue-600 dark:text-blue-400 font-bold">•</span>
                </div>
              </div>

              <span className="text-blue-600 dark:text-blue-400 font-black text-base">→</span>

              {/* Node 2 */}
              <div className="flex border-2 border-slate-300 dark:border-blue-900/40 rounded-lg overflow-hidden bg-white dark:bg-[#0B1228] shadow-xs">
                <span className="px-3 py-1.5 font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-[#0F1733] border-r border-slate-200 dark:border-blue-900/30">20</span>
                <span className="px-2.5 py-1.5 text-blue-600 dark:text-blue-400 font-bold">•</span>
              </div>

              <span className="text-blue-600 dark:text-blue-400 font-black text-base">→</span>

              {/* Node 3 */}
              <div className="flex border-2 border-slate-300 dark:border-blue-900/40 rounded-lg overflow-hidden bg-white dark:bg-[#0B1228] shadow-xs">
                <span className="px-3 py-1.5 font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-[#0F1733] border-r border-slate-200 dark:border-blue-900/30">30</span>
                <span className="px-2.5 py-1.5 text-rose-500 dark:text-rose-400 font-bold text-[11px]">NULL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CHAPTER 08: DELETION AT ANY POSITION (BYPASS DIAGRAM)
  // =========================================================================
  if (chapterId === 'theory-08' || chapterId === '08') {
    return (
      <div className="space-y-4 font-sans text-slate-900 dark:text-white animate-fadeIn">
        <div className="bg-white dark:bg-[#0B1228] border border-slate-200 dark:border-blue-900/30 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
          <div className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider flex items-center gap-1.5 font-mono">
            <Zap className="w-3.5 h-3.5" />
            <span>Pointer Bypass Mechanism</span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-[#080D1F] border border-slate-200 dark:border-blue-900/25 rounded-xl space-y-2 font-mono text-xs sm:text-sm">
            <div className="text-slate-500 dark:text-slate-400 text-xs">Before Deletion:</div>
            <div className="text-slate-800 dark:text-slate-200 font-bold">
              [20] ──→ <span className="text-rose-600 dark:text-rose-400 line-through">[30]</span> ──→ [40]
            </div>
            <div className="text-blue-600 dark:text-blue-400 text-xs font-bold pt-1">Pointer Reassignment (Bypass):</div>
            <div className="text-emerald-600 dark:text-emerald-400 font-black">
              [20] ───────────────────────→ [40]
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
            The node containing <strong>30</strong> is unlinked without moving any other elements in memory. Simply updating the pointer of <strong>20</strong> to point directly to <strong>40</strong> bypasses and deletes 30.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CHAPTER 15: QUICK REVISION
  // =========================================================================
  if (chapterId === 'theory-15' || chapterId === '15') {
    return (
      <div className="space-y-4 font-sans text-slate-900 dark:text-white animate-fadeIn">
        <div className="bg-white dark:bg-[#0B1228] border border-slate-200 dark:border-blue-900/30 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider flex items-center gap-1.5 font-mono">
            <Bookmark className="w-3.5 h-3.5" />
            <span>Master Summary Structure</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs font-mono">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/30 rounded-lg">
              <span className="text-blue-600 dark:text-blue-400 font-bold block text-[10px]">RULE 1</span>
              <span className="font-bold text-slate-900 dark:text-white">NODE = DATA + NEXT</span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-[#080D1F] border border-slate-200 dark:border-blue-900/25 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400 font-bold block text-[10px]">RULE 2</span>
              <span className="font-bold text-slate-900 dark:text-white">HEAD → FIRST</span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-[#080D1F] border border-slate-200 dark:border-blue-900/25 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400 font-bold block text-[10px]">RULE 3</span>
              <span className="font-bold text-slate-900 dark:text-white">LAST → NULL</span>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 rounded-lg">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold block text-[10px]">RULE 4</span>
              <span className="font-bold text-slate-900 dark:text-white">INSERT = CONNECT</span>
            </div>
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 rounded-lg">
              <span className="text-rose-600 dark:text-rose-400 font-bold block text-[10px]">RULE 5</span>
              <span className="font-bold text-slate-900 dark:text-white">DELETE = BYPASS</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
