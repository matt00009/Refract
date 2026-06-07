import React, { useEffect, useMemo, useRef, useState, memo, useDeferredValue } from 'react';
import { Copy, Trash2, Check, Maximize2, Minimize2 } from 'lucide-react';
import { type ThemedToken } from 'shiki';
import { highlightCodeToTokens, ensureLanguageLoaded } from '../lib/highlight';
import { LANGUAGES as CONST_LANGUAGES } from '../lib/constants';
import { DetectionResult, detectLanguage } from '../lib/detect';

const LANGUAGES = CONST_LANGUAGES.map(l => ({
  label: l === 'auto'
    ? 'Auto'
    : l === 'javascript'
      ? 'JS'
      : l === 'typescript'
        ? 'TS'
        : l.charAt(0).toUpperCase() + l.slice(1),
  value: l
}));

interface EditorProps {
  code: string;
  language: string;
  onChange: (code: string) => void;
  onAnalyze: () => void;
  onLanguageChange: (lang: string) => void;
  isFocusMode?: boolean;
  onFocusToggle?: () => void;
  detection?: DetectionResult | null;
}

/**
 * Text editor component with line numbers, code highlighting, language auto-detection,
 * and integrated language selector.
 * Optimized with React.memo and useDeferredValue for fluid typing performance.
 */
export const Editor = memo(function Editor({
  code,
  language,
  onChange,
  onAnalyze,
  onLanguageChange,
  isFocusMode,
  onFocusToggle,
  detection
}: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const lineNumRef = useRef<HTMLDivElement>(null);
  const [highlightHtml, setHighlightHtml] = useState('');
  const [showPlaceholder, setShowPlaceholder] = useState(code.length === 0);
  const [copied, setCopied] = useState(false);

  // Defer highlighting to keep input responsive
  const deferredCode = useDeferredValue(code);
  const deferredLanguage = useDeferredValue(language);

  // Pre-load language grammar when it changes to improve responsiveness
  useEffect(() => {
    if (language && language !== 'auto') {
      ensureLanguageLoaded(language);
    }
  }, [language]);

  const charCount = code.length;
  const maxChars = 4000;
  
  // High-performance line count calculation
  const lineCount = useMemo(() => {
    let count = 1;
    for (let i = 0; i < code.length; i++) {
      if (code[i] === '\n') count++;
    }
    return count;
  }, [code]);

  // Pre-calculate line number elements to avoid expensive Array.from on each render
  const lineNumberElements = useMemo(() => {
    const nums = [];
    for (let i = 1; i <= lineCount; i++) {
      nums.push(
        <div
          key={i}
          className="h-[26px] text-right text-[11px] font-mono text-[var(--rf-border)] leading-[1.65]"
        >
          {i}
        </div>
      );
    }
    return nums;
  }, [lineCount]);

  useEffect(() => {
    const highlightCode = async () => {
      if (deferredCode) {
        try {
          const tokens = await highlightCodeToTokens(deferredCode, deferredLanguage);
          const htmlParts: string[] = [];

          // Support both direct array and wrapped response if Shiki changes
          // Strictly typed to avoid 'any'
          const tokenLines = (Array.isArray(tokens) ? tokens : (tokens as { tokens: ThemedToken[][] }).tokens) as ThemedToken[][];
          
          for (const line of tokenLines) {
            for (const token of line) {
              const color = token.color || '#E8F0E0';
              htmlParts.push(`<span style="color: ${color}">`);
              htmlParts.push(token.content
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;'));
              htmlParts.push('</span>');
            }
            htmlParts.push('\n');
          }

          setHighlightHtml(htmlParts.join(''));
        } catch (error) {
          console.error('Highlight error:', error);
          const escapedCode = deferredCode.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          setHighlightHtml(escapedCode);
        }
      } else {
        setHighlightHtml('');
      }
      setShowPlaceholder(deferredCode.length === 0);
    };

    highlightCode();
  }, [deferredCode, deferredLanguage]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newCode = e.target.value;
    if (newCode.length > maxChars) {
      newCode = newCode.substring(0, maxChars);
    }
    onChange(newCode);
  };

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleClear = () => {
    onChange('');
    textareaRef.current?.focus();
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    const available = maxChars - code.length;

    if (pasted.length > available) {
      e.preventDefault();
      const truncated = pasted.substring(0, available);
      const start = textareaRef.current?.selectionStart || 0;
      const end = textareaRef.current?.selectionEnd || 0;
      const newCode = code.substring(0, start) + truncated + code.substring(end);
      onChange(newCode);
      return;
    }

    if (language === 'auto' || language === '') {
      setTimeout(() => {
        const fullCode = code + pasted;
        const detectionResult = detectLanguage(fullCode);
        if (detectionResult.lang !== 'javascript') {
          onLanguageChange(detectionResult.lang);
        }
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onAnalyze();
    }
  };

  const handleScroll = () => {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
    }
    if (lineNumRef.current && textareaRef.current) {
      lineNumRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--rf-depth)] border-r border-[var(--rf-border)] relative">
      {/* Editor Toolbar */}
      <div className="h-9 px-4 border-b border-[var(--rf-border)] bg-[var(--rf-void)] flex items-center justify-between shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <span className="rf-micro-caps text-[var(--rf-mist)]/50 font-bold">Input Buffer</span>
          
          <select
            aria-label="Select language"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="px-2 py-0.5 bg-[var(--rf-forest)] border border-[var(--rf-border)] rounded-sm text-[10px] font-mono text-[var(--rf-mist)] cursor-pointer hover:bg-[var(--rf-surface)] hover:border-[var(--rf-volt)]/40 transition-all focus:outline-none focus:ring-1 focus:ring-[var(--rf-volt)]/30"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>

          {isFocusMode && (
            <span className="text-[9px] px-2 py-0.5 border border-[var(--rf-volt)]/30 bg-[var(--rf-volt)]/10 text-[var(--rf-volt)] font-bold tracking-[0.1em] animate-pulse">
              FOCUS_ACTIVE
            </span>
          )}

          {language === 'auto' && detection && detection.confidence > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--rf-forest)] border border-[var(--rf-border)] ml-2 group relative cursor-help">
              <div 
                className="h-1 w-1 rounded-full animate-ping" 
                style={{ backgroundColor: detection.confidence > 0.7 ? 'var(--rf-volt)' : 'var(--rf-warn)' }}
              />
              <span className="text-[9px] font-mono text-[var(--rf-mist)] uppercase tracking-tighter">
                {Math.round(detection.confidence * 100)}% Match
              </span>
              
              {/* Tooltip Diagnostics */}
              <div className="absolute top-full left-0 mt-2 w-48 bg-[var(--rf-depth)] border border-[var(--rf-border)] rounded-md p-3 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60]">
                <h4 className="text-[9px] font-bold text-[var(--rf-volt)] uppercase mb-2 border-b border-[var(--rf-border)] pb-1">Heuristic Diagnostics</h4>
                <div className="space-y-1">
                  {Object.entries(detection.scores)
                    .filter(([, score]) => (score as number) > 0)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 5)
                    .map(([lang, score]) => (
                      <div key={lang} className="flex justify-between text-[9px] font-mono">
                        <span className="text-[var(--rf-mist)] capitalize">{lang}</span>
                        <span className="text-[var(--rf-border)]">+{score}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onFocusToggle}
            className="p-1.5 hover:bg-[var(--rf-forest)] rounded-md transition-colors text-[var(--rf-mist)]/40 hover:text-[var(--rf-volt)] cursor-pointer"
            title={isFocusMode ? "Exit Focus Mode (Ctrl+F)" : "Enter Focus Mode (Ctrl+F)"}
            aria-label="Toggle Focus Mode"
          >
            {isFocusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <div className="w-px h-4 bg-[var(--rf-border)] mx-1" />
          <button
            onClick={handleCopy}
            disabled={!code}
            className="p-1.5 hover:bg-[var(--rf-forest)] rounded-md transition-colors text-[var(--rf-mist)]/40 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Copy code"
            aria-label="Copy code"
          >
            {copied ? <Check size={14} className="text-[var(--rf-volt)]" /> : <Copy size={14} />}
          </button>
          <button
            onClick={handleClear}
            disabled={!code}
            className="p-1.5 hover:bg-[var(--rf-forest)] rounded-md transition-colors text-[var(--rf-mist)]/40 hover:text-[var(--rf-ember)] disabled:opacity-30 cursor-pointer"
            title="Clear editor"
            aria-label="Clear editor"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Line numbers + code */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Line numbers */}
        <div className="w-12 border-r border-[var(--rf-border)] flex flex-col overflow-hidden select-none bg-[var(--rf-void)] shrink-0">
          <div ref={lineNumRef} className="flex-1 overflow-hidden pt-4 pr-3">
            {lineNumberElements}
          </div>
        </div>

        {/* Code editor */}
        <div className="flex-1 relative overflow-hidden">
          {/* Highlight layer */}
          <div
            ref={highlightRef}
            aria-hidden="true"
            className="absolute inset-0 p-4 overflow-hidden pointer-events-none text-[13px] font-mono leading-[1.65] whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: highlightHtml }}
          />

          {/* Placeholder */}
          {showPlaceholder && (
            <div 
              aria-hidden="true"
              className="absolute inset-0 p-4 text-[13px] font-mono leading-[1.65] text-[var(--rf-mist)]/30 pointer-events-none whitespace-pre-wrap break-words"
            >
              {`function analyzeCode(code) {
  // Paste your code here
  return review;
}`}
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            onPaste={handlePaste}
            aria-label="Code input"
            className="absolute inset-0 p-4 w-full h-full text-[13px] font-mono leading-[1.65] bg-transparent text-transparent caret-[var(--rf-volt)] resize-none outline-none"
            spellCheck="false"
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>

        {/* Character counter (Floating in bottom-right corner of editor pane) */}
        <div className={`absolute bottom-0 right-0 px-3 py-1 text-[9px] font-mono border-t border-l border-[var(--rf-border)] rounded-tl-sm z-10 select-none transition-colors ${charCount > maxChars * 0.9 ? 'text-[var(--rf-ember)] bg-[var(--rf-ember)]/10 animate-pulse' : 'text-[var(--rf-mist)]/30 bg-[var(--rf-void)]'}`}>
          <span className="tracking-widest uppercase mr-2">Buffer:</span>
          {charCount.toLocaleString()} / {maxChars}
        </div>
      </div>
    </div>
  );
});
