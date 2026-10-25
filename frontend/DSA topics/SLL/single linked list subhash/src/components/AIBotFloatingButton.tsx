import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Sparkles, RotateCcw, ChevronDown } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'assistant',
    text: "Hello! I'm your AlgoLearn AI Teaching Assistant. I'm here to help you master Singly Linked Lists, Hash Tables, collision resolutions, time complexities, and interactive algorithm modules. What would you like to explore or need help with?",
    timestamp: 'Just now',
  },
];

const SUGGESTED_QUESTIONS = [
  'How does Singly Linked List deletion work?',
  'Explain Linear vs Quadratic Probing in Hash Tables',
  'How do HEAD and TAIL pointers update?',
  'What are the time complexities of basic operations?',
];

/**
 * Knowledge Base responses for AlgoLearn algorithm teaching
 */
const getAssistantResponse = (query: string): string => {
  const q = query.toLowerCase();

  if (q.includes('delet') || q.includes('remove')) {
    return (
      "### Singly Linked List Deletion Steps:\n\n" +
      "1. **Identify the Target Node**: Determine whether you're deleting the HEAD, TAIL, or an intermediate node.\n" +
      "2. **Find the Previous Node (`prev`)**: For any position $k > 1$, traverse from `HEAD` until `prev.next === target`.\n" +
      "3. **Bypass the Target**: Re-link pointers by setting `prev.next = target.next`.\n" +
      "4. **Update Pointers (if edge case)**:\n" +
      "   - If deleting HEAD: `HEAD = HEAD.next`\n" +
      "   - If deleting TAIL: `TAIL = prev`, and `prev.next = NULL`\n" +
      "5. **Free Memory**: Deallocate the isolated target node to avoid memory leaks."
    );
  }

  if (q.includes('probe') || q.includes('linear') || q.includes('quadratic') || q.includes('hash')) {
    return (
      "### Hash Table Collision Resolution:\n\n" +
      "- **Linear Probing**: $h(k, i) = (h(k) + i) \\pmod M$\n" +
      "  Checks consecutive memory slots $i = 0, 1, 2, \\dots$. Simple and cache-friendly, but prone to **primary clustering**.\n\n" +
      "- **Quadratic Probing**: $h(k, i) = (h(k) + c_1 i + c_2 i^2) \\pmod M$\n" +
      "  Jumps quadratically to reduce primary clustering, but requires careful table size selection (e.g. prime $M$) to guarantee insertion.\n\n" +
      "- **Separate Chaining**: Each bucket points to a Singly Linked List holding all collided keys."
    );
  }

  if (q.includes('head') || q.includes('tail') || q.includes('pointer')) {
    return (
      "### HEAD & TAIL Pointers in Singly Linked Lists:\n\n" +
      "- **`HEAD`**: Holds the memory address of the first node in the list. If `HEAD === NULL`, the list is empty.\n" +
      "- **`TAIL`**: Holds the memory address of the final node whose `.next` pointer is always `NULL`.\n" +
      "- **Single-node list**: When exactly one node exists, both `HEAD` and `TAIL` point to that same memory address.\n" +
      "- **Empty list**: Both `HEAD` and `TAIL` must point to `NULL`."
    );
  }

  if (q.includes('time') || q.includes('complexity') || q.includes('big o') || q.includes('o(')) {
    return (
      "### Big-O Time Complexities in Singly Linked Lists:\n\n" +
      "- **Insert at Head**: $O(1)$ constant time\n" +
      "- **Insert at Tail (with TAIL pointer)**: $O(1)$ constant time\n" +
      "- **Delete at Head**: $O(1)$ constant time\n" +
      "- **Delete at Tail**: $O(N)$ linear time (must traverse to locate node preceding TAIL)\n" +
      "- **Search / Access by Index**: $O(N)$ linear sequential scan\n" +
      "- **Space Complexity**: $O(N)$ with 1 pointer overhead per node."
    );
  }

  if (q.includes('insert') || q.includes('add')) {
    return (
      "### Inserting a Node in Singly Linked Lists:\n\n" +
      "1. **Allocate New Node**: Set `newNode.data = value` and `newNode.next = NULL`.\n" +
      "2. **Insert at Head**:\n" +
      "   `newNode.next = HEAD`\n" +
      "   `HEAD = newNode`\n" +
      "3. **Insert at Tail**:\n" +
      "   `TAIL.next = newNode`\n" +
      "   `TAIL = newNode`\n" +
      "4. **Insert between A and B**:\n" +
      "   `newNode.next = A.next`\n" +
      "   `A.next = newNode`"
    );
  }

  return (
    `Great question about **${query.trim()}**! Here are the core algorithmic principles:\n\n` +
    `• **Memory Layout**: In linked data structures, elements are stored in non-contiguous heap memory locations linked by pointer addresses.\n` +
    `• **Pointer Discipline**: Always update the incoming connection before breaking the old link to avoid losing references (orphaned nodes).\n` +
    `• **Interactive Practice**: Try using the step-by-step GUIDE & SOLVE features in the AlgoLearn workspace to practice this directly with real-time pointer inspection!`
  );
};

/**
 * AIBotFloatingButton Component
 *
 * Renders the clean circular chat floating button fixed to the bottom-right corner.
 * Features a modern blue-to-purple gradient background with a pure white outlined
 * chat bubble icon in the center, strictly matching the reference image.
 *
 * Clicking toggles the interactive AlgoLearn AI Teaching Assistant chat panel.
 */
export const AIBotFloatingButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages, isTyping]);

  const handleToggle = () => {
    soundManager.play('click');
    setIsOpen((prev) => !prev);
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query) return;

    soundManager.play('step');
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI Teaching Assistant processing
    setTimeout(() => {
      const replyText = getAssistantResponse(query);
      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
      soundManager.play('success');
    }, 450);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    soundManager.play('click');
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <>
      {/* Interactive AI Teaching Assistant Chat Dialog */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.94 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-20 right-4 sm:bottom-24 sm:right-5 lg:bottom-24 lg:right-6 z-50 w-[calc(100vw-32px)] sm:w-[400px] md:w-[420px] max-h-[580px] h-[520px] bg-white dark:bg-[#0A1024] border border-slate-200/90 dark:border-blue-900/40 rounded-3xl shadow-[0_20px_50px_-10px_rgba(15,23,42,0.3),0_0_24px_rgba(59,130,246,0.18)] flex flex-col overflow-hidden font-sans backdrop-blur-md"
          >
            {/* Header */}
            <div className="px-4 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                {/* Mini Chat Badge */}
                <div className="w-8 h-8 rounded-full bg-white/20 p-1 flex items-center justify-center shrink-0 border border-white/30 backdrop-blur-xs">
                  <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full block"
                  >
                    <path
                      d="M 45.0 67.8 C 40.5 68.5, 36.0 70.5, 33.0 70.2 C 31.2 69.8, 31.0 66.8, 32.6 64.0 C 33.4 62.8, 34.2 62.0, 35.1 61.5 A 19.5 19.5 0 1 1 45.0 67.8 Z"
                      stroke="#FFFFFF"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold leading-none tracking-tight">AlgoLearn AI Assistant</h3>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                  <p className="text-[11px] text-blue-100 font-medium mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Teaching Assistant • Online
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleClearChat}
                  title="Reset conversation"
                  aria-label="Reset conversation"
                  className="p-1.5 rounded-xl hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleToggle}
                  title="Close AI Assistant"
                  aria-label="Close AI Assistant"
                  className="p-1.5 rounded-xl hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message Thread Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs text-slate-800 dark:text-slate-200">
              {messages.map((msg) => {
                const isAssistant = msg.sender === 'assistant';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-2xs ${
                        isAssistant
                          ? 'bg-slate-100 dark:bg-blue-950/40 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-blue-900/40'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium'
                      }`}
                    >
                      <div className="whitespace-pre-line break-words">{msg.text}</div>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[11px] font-medium py-1 px-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.3s]" />
                  <span className="ml-1">AI Assistant is thinking...</span>
                </div>
              )}

              {/* Quick suggestion pills (only when chat has few messages) */}
              {messages.length <= 2 && !isTyping && (
                <div className="pt-2">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 font-mono">
                    Suggested Questions
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {SUGGESTED_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(q)}
                        className="text-left px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/50 border border-blue-200/80 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 text-xs font-medium transition-all cursor-pointer hover:translate-x-0.5"
                      >
                        👉 {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-slate-50 dark:bg-[#070C1E] border-t border-slate-200 dark:border-blue-900/30">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about linked lists, hash tables, pointers..."
                  className="flex-1 bg-white dark:bg-[#0B1228] border border-slate-200 dark:border-blue-900/50 rounded-2xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim()}
                  title="Send question"
                  aria-label="Send question"
                  className="w-9 h-9 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Circular AI Assistant Chat Button */}
      <button
        id="ai-bot-floating-button"
        type="button"
        aria-label="AlgoLearn AI Assistant"
        onClick={handleToggle}
        className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 lg:bottom-6 lg:right-6 z-40 w-[56px] h-[56px] sm:w-[60px] sm:h-[60px] lg:w-[64px] lg:h-[64px] rounded-full p-0 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_8px_25px_rgba(59,130,246,0.38),0_4px_12px_rgba(139,92,246,0.28)] hover:shadow-[0_12px_32px_rgba(59,130,246,0.5),0_6px_16px_rgba(139,92,246,0.38)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900 select-none"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full rounded-full overflow-hidden block"
        >
          <defs>
            {/* Blue to Purple Gradient matching master reference image */}
            <linearGradient id="aiChatBgGrad" x1="15%" y1="12%" x2="85%" y2="88%">
              <stop offset="0%" stopColor="#2264F6" />
              <stop offset="48%" stopColor="#5542EE" />
              <stop offset="100%" stopColor="#8726E8" />
            </linearGradient>
          </defs>

          {/* 1. Base Circular Gradient Background */}
          <circle cx="50" cy="50" r="50" fill="url(#aiChatBgGrad)" />

          {/* 2. White Outlined Chat Bubble Symbol matching reference image */}
          <path
            d="M 45.0 67.8 C 40.5 68.5, 36.0 70.5, 33.0 70.2 C 31.2 69.8, 31.0 66.8, 32.6 64.0 C 33.4 62.8, 34.2 62.0, 35.1 61.5 A 19.5 19.5 0 1 1 45.0 67.8 Z"
            stroke="#FFFFFF"
            strokeWidth="5.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>

        {/* Small active indicator if chat is currently open */}
        {isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white dark:border-[#0A1024] shadow-xs" />
        )}
      </button>
    </>
  );
};
