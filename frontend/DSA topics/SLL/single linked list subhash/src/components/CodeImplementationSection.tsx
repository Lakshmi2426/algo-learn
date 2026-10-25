import React, { useState } from 'react';
import { Check, Copy, Code2 } from 'lucide-react';
import { soundManager } from '../utils/audio';

export type SupportedLanguage = 'c' | 'cpp' | 'java' | 'python';

export interface CodeImplementationProps {
  cCode?: string;
  cppCode?: string;
  javaCode?: string;
  pythonCode?: string;
  defaultLang?: SupportedLanguage;
  sectionTitle?: string;
}

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  c: 'C',
  cpp: 'C++',
  java: 'Java',
  python: 'Python',
};

// Syntax highlighter tokenizer for C, C++, Java, and Python
function highlightSyntax(code: string, lang: SupportedLanguage): React.ReactNode[] {
  const lines = code.split('\n');

  return lines.map((line, lineIdx) => {
    // Empty line
    if (!line.trim()) {
      return (
        <div key={lineIdx} className="leading-relaxed">
          {'\n'}
        </div>
      );
    }

    // Check for full line comments
    const trimmed = line.trimStart();
    const leadingWhitespace = line.slice(0, line.length - trimmed.length);

    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || (lang === 'python' && trimmed.startsWith('#'))) {
      return (
        <div key={lineIdx} className="leading-relaxed">
          <span className="select-none text-slate-600 dark:text-slate-500 mr-4 font-mono text-[11px] w-6 inline-block text-right">
            {lineIdx + 1}
          </span>
          <span>{leadingWhitespace}</span>
          <span className="text-slate-400 dark:text-slate-500 italic">{trimmed}</span>
        </div>
      );
    }

    // Check for preprocessor directives (#include, #define, etc.)
    if (trimmed.startsWith('#include') || trimmed.startsWith('#define') || trimmed.startsWith('#ifndef') || trimmed.startsWith('#endif')) {
      const match = trimmed.match(/^(#[a-zA-Z_]+)\s*(<[^>]+>|"[^"]+")?/);
      if (match) {
        return (
          <div key={lineIdx} className="leading-relaxed">
            <span className="select-none text-slate-600 dark:text-slate-500 mr-4 font-mono text-[11px] w-6 inline-block text-right">
              {lineIdx + 1}
            </span>
            <span>{leadingWhitespace}</span>
            <span className="text-pink-400 font-semibold">{match[1]}</span>
            {match[2] && <span className="text-emerald-400"> {match[2]}</span>}
            {trimmed.slice((match[1] + (match[2] ? ' ' + match[2] : '')).length)}
          </div>
        );
      }
    }

    // Tokenize line with regex matching strings, comments, words, numbers, and symbols
    // Keywords for C, C++, Java, Python
    const keywords = new Set([
      'using', 'namespace', 'struct', 'class', 'public', 'private', 'protected',
      'template', 'typename', 'virtual', 'override', 'static', 'const', 'return',
      'if', 'else', 'while', 'for', 'do', 'switch', 'case', 'break', 'continue',
      'new', 'delete', 'nullptr', 'NULL', 'null', 'sizeof', 'typedef', 'import',
      'package', 'def', 'elif', 'in', 'is', 'not', 'and', 'or', 'True', 'False',
      'None', 'self', 'this', 'throw', 'try', 'catch', 'finally', 'extends', 'implements'
    ]);

    const types = new Set([
      'int', 'void', 'char', 'float', 'double', 'bool', 'boolean', 'long', 'size_t',
      'Node', 'SinglyLinkedList', 'Stack', 'String', 'auto', 'int32_t', 'uint32_t'
    ]);

    const stdBuiltins = new Set([
      'std', 'cout', 'cin', 'endl', 'printf', 'malloc', 'free', 'System', 'out',
      'println', 'print', 'range', 'len'
    ]);

    // Tokenizer regex matching strings, comments, words, numbers, and operators
    const tokenRegex = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\/[^\n]*|\/\*[\s\S]*?\*\/|\b\d+\b|[a-zA-Z_]\w*|->|::|==|!=|<=|>=|&&|\|\||[{}()[\];,.<>+\-*\/%=!&|~^?:])/g;

    const tokens: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        tokens.push(
          <span key={`ws-${lastIndex}`} className="text-slate-200">
            {line.slice(lastIndex, match.index)}
          </span>
        );
      }

      const token = match[0];
      const key = `tok-${lineIdx}-${match.index}`;

      if (token.startsWith('//') || token.startsWith('/*')) {
        tokens.push(
          <span key={key} className="text-slate-400 dark:text-slate-500 italic">
            {token}
          </span>
        );
      } else if (token.startsWith('"') || token.startsWith("'")) {
        tokens.push(
          <span key={key} className="text-emerald-400">
            {token}
          </span>
        );
      } else if (/^\d+$/.test(token)) {
        tokens.push(
          <span key={key} className="text-amber-300">
            {token}
          </span>
        );
      } else if (keywords.has(token)) {
        tokens.push(
          <span key={key} className="text-pink-400 font-semibold">
            {token}
          </span>
        );
      } else if (types.has(token)) {
        tokens.push(
          <span key={key} className="text-yellow-300 font-medium">
            {token}
          </span>
        );
      } else if (stdBuiltins.has(token)) {
        tokens.push(
          <span key={key} className="text-cyan-300 font-medium">
            {token}
          </span>
        );
      } else if (token === '->' || token === '::') {
        tokens.push(
          <span key={key} className="text-rose-400 font-bold">
            {token}
          </span>
        );
      } else if (line.slice(match.index + token.length).trimStart().startsWith('(')) {
        // Function call / declaration
        tokens.push(
          <span key={key} className="text-blue-300 font-medium">
            {token}
          </span>
        );
      } else {
        tokens.push(
          <span key={key} className="text-slate-200">
            {token}
          </span>
        );
      }

      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < line.length) {
      tokens.push(
        <span key={`ws-end-${lineIdx}`} className="text-slate-200">
          {line.slice(lastIndex)}
        </span>
      );
    }

    return (
      <div key={lineIdx} className="leading-relaxed">
        <span className="select-none text-slate-600 dark:text-slate-500 mr-4 font-mono text-[11px] w-6 inline-block text-right">
          {lineIdx + 1}
        </span>
        {tokens}
      </div>
    );
  });
}

export const CodeImplementationSection: React.FC<CodeImplementationProps> = ({
  cCode,
  cppCode,
  javaCode,
  pythonCode,
  defaultLang = 'cpp' as SupportedLanguage,
  sectionTitle = 'CODE IMPLEMENTATIONS',
}) => {
  // Available languages for this specific topic
  const availableLangs: SupportedLanguage[] = [];
  if (cCode) availableLangs.push('c');
  if (cppCode) availableLangs.push('cpp');
  if (javaCode) availableLangs.push('java');
  if (pythonCode) availableLangs.push('python');

  // Fallback if none provided
  if (availableLangs.length === 0 && cppCode) {
    availableLangs.push('cpp');
  }

  // Active language state: prioritize C++ as requested
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(() => {
    if (cppCode && defaultLang === 'cpp') return 'cpp';
    if (availableLangs.some((lang) => lang === defaultLang)) return defaultLang;
    if (cppCode) return 'cpp';
    return availableLangs[0] || 'cpp';
  });

  const [copied, setCopied] = useState<boolean>(false);

  // Retrieve code string based on selected language
  const currentCode = (() => {
    switch (selectedLang) {
      case 'c':
        return cCode || cppCode || '';
      case 'cpp':
        return cppCode || cCode || '';
      case 'java':
        return javaCode || '';
      case 'python':
        return pythonCode || '';
      default:
        return cppCode || '';
    }
  })();

  const handleCopy = () => {
    if (!currentCode) return;
    navigator.clipboard.writeText(currentCode);
    soundManager.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectLang = (lang: SupportedLanguage) => {
    setSelectedLang(lang);
    soundManager.playSelect();
  };

  if (!cCode && !cppCode && !javaCode && !pythonCode) {
    return null;
  }

  // Generate subtitle labels (e.g. "C / C++ / JAVA / PYTHON")
  const subtitleLangs = availableLangs
    .map((l) => LANGUAGE_LABELS[l].toUpperCase())
    .join(' / ');

  return (
    <section className="code-implementations mt-6 mb-3 font-mono reveal-on-scroll">
      {/* 1. Header Section */}
      <div className="code-section-header flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            {sectionTitle}
          </span>
        </div>
        <small className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 tracking-wide">
          ({subtitleLangs || 'C / C++ / JAVA / PYTHON'})
        </small>
      </div>

      {/* 2. Language Tabs Bar with Copy Button */}
      <div className="code-tabs flex items-center justify-between gap-2 px-3 py-2 bg-slate-200/90 dark:bg-[#070D1F] border border-slate-300 dark:border-blue-900/40 rounded-t-2xl shadow-xs">
        {/* Language Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['c', 'cpp', 'java', 'python'] as SupportedLanguage[]).map((lang) => {
            const hasCode =
              (lang === 'c' && cCode) ||
              (lang === 'cpp' && cppCode) ||
              (lang === 'java' && javaCode) ||
              (lang === 'python' && pythonCode);

            if (!hasCode) return null;

            const isActive = selectedLang === lang;

            return (
              <button
                key={lang}
                id={`btn-code-tab-${lang}`}
                type="button"
                onClick={() => handleSelectLang(lang)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-xs'
                    : 'bg-white/80 dark:bg-[#0E1736] text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-[#15234E] hover:text-slate-900 dark:hover:text-white border border-slate-300/70 dark:border-blue-900/30'
                }`}
              >
                {LANGUAGE_LABELS[lang]}
              </button>
            );
          })}
        </div>

        {/* Copy Button */}
        <button
          id="btn-copy-code"
          type="button"
          onClick={handleCopy}
          className="copy-code flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/90 dark:bg-[#0F1838] hover:bg-white dark:hover:bg-[#182656] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-blue-900/40 text-xs font-mono font-medium transition-all shadow-xs cursor-pointer active:scale-95"
          title="Copy only code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* 3. Dark Code Editor Container */}
      <div className="code-editor bg-[#0D1117] border-x border-b border-slate-800 dark:border-blue-950/60 rounded-b-2xl overflow-hidden shadow-md">
        {/* Mini Editor Toolbar */}
        <div className="code-toolbar flex items-center justify-between px-4 py-2 bg-[#161B22] border-b border-slate-800/80 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              <span className="text-slate-300 font-bold text-xs">
                {LANGUAGE_LABELS[selectedLang]} Implementation
              </span>
            </span>
            {selectedLang === 'cpp' && (
              <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono">
                Compilable C++
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline-block">
            Standard Output / UTF-8
          </span>
        </div>

        {/* Syntax-Highlighted Code Pre Block */}
        <pre className="p-4 sm:p-5 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed text-slate-100 bg-[#0D1117] selection:bg-blue-600 selection:text-white">
          <code>{highlightSyntax(currentCode, selectedLang)}</code>
        </pre>
      </div>
    </section>
  );
};

export default CodeImplementationSection;
