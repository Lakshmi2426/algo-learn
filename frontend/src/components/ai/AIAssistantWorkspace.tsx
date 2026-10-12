import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Code2,
  BrainCircuit,
  Lightbulb,
  Mic,
  MicOff,
  AlertCircle,
  Terminal,
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { AlgoAIIcon } from '../common/AlgoAIIcon';
import { apiUrl } from '../../config/api';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
}

interface AIAssistantWorkspaceProps {
  initialPrompt?: string;
}

// Safe Markdown & Code Block Renderer (No dangerouslySetInnerHTML)
const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-700/60 bg-[#0d1326] text-slate-100 font-mono text-xs shadow-md">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#080c1a] border-b border-slate-800 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 text-blue-400 font-semibold uppercase tracking-wider">
          <Terminal className="w-3.5 h-3.5" />
          {language || 'code'}
        </span>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 text-[10px]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="text-[10px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Formats inline text (bold, inline code, complexity notation)
const renderFormattedText = (text: string): React.ReactNode => {
  // Regex to split by inline code `code`, bold **text**, or math $...$
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\$[^$]+\$)/g);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      const codeContent = part.slice(1, -1);
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-mono text-[11px] border border-blue-200 dark:border-blue-800/60"
        >
          {codeContent}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldContent = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-slate-900 dark:text-white">
          {boldContent}
        </strong>
      );
    }
    if (part.startsWith('$') && part.endsWith('$')) {
      const mathContent = part.slice(1, -1);
      return (
        <span
          key={index}
          className="px-1 py-0.5 mx-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-semibold"
        >
          {mathContent}
        </span>
      );
    }
    return part;
  });
};

const FormattedMarkdown: React.FC<{ content: string }> = ({ content }) => {
  // Split content into blocks: code blocks vs text blocks
  const blocks = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {blocks.map((block, i) => {
        if (block.startsWith('```') && block.endsWith('```')) {
          const firstLineEnd = block.indexOf('\n');
          const language = firstLineEnd !== -1 ? block.slice(3, firstLineEnd).trim() : '';
          const code = firstLineEnd !== -1 ? block.slice(firstLineEnd + 1, -3) : block.slice(3, -3);
          return <CodeBlock key={i} code={code} language={language} />;
        }

        // Process line-by-line for headings, lists, paragraphs
        const lines = block.split('\n');
        const elements: React.ReactNode[] = [];
        let listItems: React.ReactNode[] = [];
        let isNumberedList = false;

        const flushList = () => {
          if (listItems.length > 0) {
            if (isNumberedList) {
              elements.push(
                <ol key={`list-${elements.length}`} className="list-decimal list-inside space-y-1 my-2 pl-2">
                  {listItems}
                </ol>
              );
            } else {
              elements.push(
                <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2 pl-2">
                  {listItems}
                </ul>
              );
            }
            listItems = [];
          }
        };

        lines.forEach((line, lineIdx) => {
          const trimmed = line.trim();

          if (!trimmed) {
            flushList();
            return;
          }

          // Headings
          if (trimmed.startsWith('### ')) {
            flushList();
            elements.push(
              <h3 key={lineIdx} className="text-base font-bold text-slate-900 dark:text-white mt-3 mb-1">
                {renderFormattedText(trimmed.slice(4))}
              </h3>
            );
            return;
          }
          if (trimmed.startsWith('#### ')) {
            flushList();
            elements.push(
              <h4 key={lineIdx} className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2 mb-1">
                {renderFormattedText(trimmed.slice(5))}
              </h4>
            );
            return;
          }
          if (trimmed.startsWith('## ')) {
            flushList();
            elements.push(
              <h2 key={lineIdx} className="text-lg font-extrabold text-slate-900 dark:text-white mt-4 mb-2">
                {renderFormattedText(trimmed.slice(3))}
              </h2>
            );
            return;
          }

          // Bullet List Item
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            if (isNumberedList && listItems.length > 0) flushList();
            isNumberedList = false;
            listItems.push(<li key={lineIdx}>{renderFormattedText(trimmed.slice(2))}</li>);
            return;
          }

          // Numbered List Item
          const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
          if (numberedMatch) {
            if (!isNumberedList && listItems.length > 0) flushList();
            isNumberedList = true;
            listItems.push(<li key={lineIdx}>{renderFormattedText(numberedMatch[2])}</li>);
            return;
          }

          // Normal Paragraph
          flushList();
          elements.push(<p key={lineIdx}>{renderFormattedText(trimmed)}</p>);
        });

        flushList();

        return <React.Fragment key={i}>{elements}</React.Fragment>;
      })}
    </div>
  );
};

export const AIAssistantWorkspace: React.FC<AIAssistantWorkspaceProps> = ({
  initialPrompt = '',
}) => {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState(initialPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Web Speech API states
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Suggested DSA Questions
  const suggestions = [
    'Explain Binary Search',
    "Explain Dijkstra's algorithm",
    'Why does Binary Search run in O(log n)?',
    'Detect a cycle in a Linked List',
    'How does a Min Heap work?',
    'Explain Topological Sort',
    'How does an LRU Cache work?',
    'Help me understand Stack',
    'Explain BFS',
  ];

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setInputValue(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceError('Microphone permission denied.');
        } else if (event.error === 'no-speech') {
          setVoiceError('No speech detected. Try speaking again.');
        } else {
          setVoiceError(`Voice recognition: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Speech recognition init failed:', err);
      setVoiceSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const toggleVoiceRecognition = () => {
    if (!voiceSupported || !recognitionRef.current) {
      setVoiceError('Voice input is not supported in this browser.');
      setTimeout(() => setVoiceError(null), 4000);
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    } else {
      setVoiceError(null);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Speech recognition start error:', err);
        setIsListening(false);
      }
    }
  };

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim().length > 0) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isLoading) return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    }

    const userMessage: Message = {
      id: 'user-' + Date.now(),
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build history payload for server-side Gemini multi-turn conversation
      const historyPayload = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const res = await fetch(apiUrl('/api/ai'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
        }),
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        const assistantMessage: Message = {
          id: 'ai-' + Date.now(),
          sender: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage = data?.error || 'AI Assistant is temporarily unavailable. Please try again.';
        const assistantMessage: Message = {
          id: 'ai-err-' + Date.now(),
          sender: 'assistant',
          content: errorMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error('Fetch error calling /api/ai:', err);
      const assistantMessage: Message = {
        id: 'ai-err-' + Date.now(),
        sender: 'assistant',
        content: 'AI Assistant is temporarily unavailable. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-12 min-h-[calc(100vh-80px)] flex flex-col justify-between">
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-blue-200/80 dark:border-slate-800 text-left">
          <div className="flex items-center gap-3.5">
            <AlgoAIIcon size="lg" className="w-11 h-11 ring-2 ring-blue-400/40 dark:ring-blue-600/50 shadow-md shadow-blue-500/20" alt="Algo AI" />
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Algo AI
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800 text-[10px] font-mono font-semibold">
                  Online • Gemini Powered
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your AI Assistant for Algorithms, Data Structures &amp; Problem Solving
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-xl border border-blue-200/80 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Chat</span>
            </button>
          )}
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Welcome state when no messages */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 px-4"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <AlgoAIIcon size="2xl" className="w-16 h-16 shadow-lg shadow-blue-500/25 ring-2 ring-blue-300/70 dark:ring-blue-600/70" alt="Algo AI Mascot" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                How can I assist your DSA journey today?
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
                Ask any algorithmic concept, request a code breakdown, or get help debugging your data structures.
              </p>

              {/* Suggestion Chips */}
              <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(suggestion)}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:bg-slate-800 border border-blue-200/85 dark:border-slate-800 hover:border-blue-400 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 text-xs font-medium transition-all shadow-[0_2px_8px_-1px_rgba(37,99,235,0.06)] hover:shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Messages list */}
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 text-left ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'assistant' && (
                <div className="shrink-0 mt-0.5">
                  <AlgoAIIcon size="sm" className="w-8 h-8 ring-1 ring-blue-300/50 shadow-xs" alt="Algo AI" />
                </div>
              )}

              <div
                className={`relative max-w-[88%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : msg.isError
                    ? 'bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                    : 'bg-white dark:bg-slate-900 border border-blue-200/85 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-[0_4px_20px_-2px_rgba(37,99,235,0.08),0_2px_8px_-1px_rgba(99,102,241,0.04)] dark:shadow-none'
                }`}
              >
                {/* Assistant Copy Button */}
                {msg.sender === 'assistant' && !msg.isError && (
                  <button
                    onClick={() => handleCopy(msg.content, msg.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    aria-label="Copy message"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {/* Content formatting */}
                {msg.sender === 'user' ? (
                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                ) : msg.isError ? (
                  <div className="flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{msg.content}</span>
                  </div>
                ) : (
                  <FormattedMarkdown content={msg.content} />
                )}

                <div
                  className={`mt-2 text-[10px] font-mono ${
                    msg.sender === 'user'
                      ? 'text-blue-100 text-right'
                      : 'text-slate-400 text-left'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:bg-slate-800 text-blue-700 dark:text-slate-300 border border-blue-200/70 flex items-center justify-center shrink-0 shadow-xs mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 justify-start text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white dark:bg-slate-900 border border-blue-200/85 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                <span
                  className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                />
                <span className="text-xs text-slate-500 font-mono ml-1">Analyzing algorithm...</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Voice Input Feedback Bar */}
        {isListening && (
          <div className="mb-2 px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 flex items-center justify-between text-xs text-red-700 dark:text-red-200 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="font-semibold">Listening to your voice... Speak your DSA question</span>
            </div>
            <button
              type="button"
              onClick={toggleVoiceRecognition}
              className="px-2 py-0.5 rounded bg-red-600 text-white hover:bg-red-700 text-[11px] font-mono cursor-pointer"
            >
              Stop Recording
            </button>
          </div>
        )}

        {/* Voice Error Banner */}
        {voiceError && (
          <div className="mb-2 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>{voiceError}</span>
          </div>
        )}

        {/* Input Bar */}
        <div className="pt-4 border-t border-blue-100/80 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-blue-300/80 dark:border-slate-700 shadow-[0_4px_16px_rgba(37,99,235,0.10),0_10px_30px_rgba(37,99,235,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:border-blue-400/90 hover:shadow-[0_6px_20px_rgba(37,99,235,0.14),0_12px_32px_rgba(37,99,235,0.10)] focus-within:border-blue-600 dark:focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-blue-500/15 focus-within:shadow-[0_8px_24px_rgba(37,99,235,0.16),0_12px_36px_rgba(37,99,235,0.11)] transition-all duration-200 px-3 py-1.5"
          >
            {/* Microphone Voice Button */}
            <button
              type="button"
              onClick={toggleVoiceRecognition}
              title={
                voiceSupported
                  ? isListening
                    ? 'Stop Voice Input'
                    : 'Ask with Voice (Speech to Text)'
                  : 'Voice input is not supported in this browser'
              }
              aria-label="Voice input microphone"
              className={`p-2 rounded-xl transition-all duration-200 cursor-pointer shrink-0 flex items-center justify-center ${
                isListening
                  ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse'
                  : 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 border border-blue-200 dark:border-slate-700'
              }`}
              id="ai-workspace-mic-btn"
            >
              {isListening ? (
                <Mic className="w-4 h-4 animate-bounce" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                isListening
                  ? 'Listening... (Speak your DSA question)'
                  : 'Ask anything about algorithms, time complexity, data structures...'
              }
              rows={1}
              className="w-full py-2.5 text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none resize-none"
              id="ai-assistant-chat-input"
            />

            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:hover:from-blue-600 disabled:hover:to-violet-600 text-white transition-all shadow-md shadow-blue-600/25 hover:shadow-blue-600/35 hover:scale-105 active:scale-95 focus:outline-none cursor-pointer shrink-0"
              id="ai-assistant-send-btn"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[11px] text-slate-400 text-center mt-2.5">
            AlgoLearn AI can make mistakes. Verify complex mathematical proofs and invariants.
          </p>
        </div>
      </div>
    </div>
  );
};
