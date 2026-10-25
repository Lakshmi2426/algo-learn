import React from 'react';
import { X, BookOpen, Link as LinkIcon, Search, Sparkles, Zap, Layers } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface TheoryModalProps {
  onClose: () => void;
  onOpenFullLearn?: () => void;
}

export const TheoryModal: React.FC<TheoryModalProps> = ({ onClose, onOpenFullLearn }) => {
  const topics = [
    {
      title: '1. Node Architecture (Data + Next)',
      desc: 'Each node stores its data value and a next pointer referencing the next node in sequence. The chain starts at HEAD and ends with NULL.',
      formula: 'NODE = [ DATA | NEXT ] → [ DATA | NULL ]',
      icon: <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
    },
    {
      title: '2. Insertion at Beginning',
      desc: 'Create new node, point its next to current HEAD, and update HEAD to the new node.',
      formula: 'newNode->next = head; head = newNode;  // O(1)',
      icon: <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      title: '3. Insertion at End',
      desc: 'Traverse until temp->next is NULL, then set temp->next to newNode.',
      formula: 'while(temp->next != NULL) temp = temp->next; temp->next = newNode;  // O(n)',
      icon: <LinkIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
    },
    {
      title: '4. Deletion by Pointer Bypass',
      desc: 'Move to position - 1, save deleteNode, and bypass it by linking to deleteNode->next.',
      formula: 'temp->next = deleteNode->next; free(deleteNode);  // O(n)',
      icon: <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
    },
    {
      title: '5. Searching & Display',
      desc: 'Linear sequential traversal starting from HEAD checking each node or printing its data.',
      formula: 'while(temp != NULL) { if(temp->data == key) return 1; temp = temp->next; }  // O(n)',
      icon: <Search className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="bg-white dark:bg-[#0B1228] w-full max-w-2xl border border-slate-200 dark:border-blue-900/40 rounded-2xl shadow-xl dark:shadow-[0_0_30px_rgba(37,99,235,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-blue-900/30 bg-slate-50 dark:bg-[#080D1F] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Singly Linked List Reference Guide
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">Quick Reference Operations</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playModalClose();
              onClose();
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-4 bg-white dark:bg-[#0B1228]">
          {topics.map((topic, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-50/70 dark:bg-[#0F1733] border border-slate-200/80 dark:border-blue-900/25 rounded-xl shadow-2xs dark:shadow-[0_0_12px_rgba(0,0,0,0.3)]"
            >
              <div className="flex items-center gap-2 mb-1.5">
                {topic.icon}
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{topic.title}</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2.5">{topic.desc}</p>
              <div className="flex items-center gap-2 bg-white dark:bg-[#050816] border border-slate-200 dark:border-blue-900/30 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-blue-300 shadow-2xs">
                <span className="text-blue-600 dark:text-blue-400 text-[11px] uppercase tracking-wider font-sans">Syntax:</span>
                <span>{topic.formula}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-blue-900/30 bg-slate-50 dark:bg-[#080D1F] flex items-center justify-between">
          {onOpenFullLearn ? (
            <button
              onClick={() => {
                soundManager.playPrimaryClick();
                onClose();
                onOpenFullLearn();
              }}
              className="btn-modern-secondary px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Open Complete SLL Notes (15 Chapters)</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={() => {
              soundManager.playModalClose();
              onClose();
            }}
            className="btn-modern-primary px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
