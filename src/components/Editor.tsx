import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Trash2, Check, Maximize2, Minimize2 } from 'lucide-react';
import { highlightCodeToTokens } from '../lib/highlight';
import { detectLanguage } from '../lib/detect';
import { LANGUAGES as CONST_LANGUAGES } from '../lib/constants';

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
}

/**
 * Text editor component with line numbers, code highlighting, language auto-detection,
 * and integrated language selector.
 */
export function Editor({
  code,
  language,
  onChange,
  onAnalyze,
  onLanguageChange,
  isFocusMode,
  onFocusToggle
}: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const lineNumRef = useRef<HTMLDivElement>(null);
  const [highlightHtml, setHighlightHtml] = useState('');
  const [showPlaceholder, setShowPlaceholder] = useState(code.length === 0);
  const [copied, setCopied] = useState(false);

  const charCount = code.length;
  const maxChars = 4000;
  const lines = useMemo(() => code.split('\n'), [code]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const highlightCode = async () => {
        if (code) {
          try {
            const tokens = await highlightCodeToTokens(code, language);
            let html = '';

            const tokenLines = Array.isArray(tokens) ? tokens : tokens.tokens || [];
            for (const line of tokenLines) {
              for (const token of line) {
                const color = token.color || '#E8F0E0';
                html += `<span style="color: ${color}">${token.content
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;')}</span>`;
              }
              html += '\n';
            }

            setHighlightHtml(html);
          } catch (error) {
            console.error('Highlight error:', error);
            const escapedCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            setHighlightHtml(escapedCode);
          }
        } else {
          setHighlightHtml('');
        }
        setShowPlaceholder(code.length === 0);
      };

      highlightCode();
    }, 150);

    return () => clearTimeout(timer);
  }, [code, language]);

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
        const detected = detectLanguage(fullCode);
        if (detected !== 'javascript') {
          onLanguageChange(detected);
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
      <div className="h-9 px-4 border-b border-[var(--rf-border)] bg-[var(--rf-void)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-widest text-[var(--rf-mist)]/50 font-mono font-bold">Input Buffer</span>
          
          <select
            aria-label="Select language"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="px-2 py-0.5 bg-[var(--rf-forest)] border border-[var(--rf-border)] rounded-[4px] text-[10px] font-mono text-[var(--rf-mist)] cursor-pointer hover:bg-[var(--rf-surface)] transition-colors focus:outline-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>

          {isFocusMode && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--rf-volt)]/10 text-[var(--rf-volt)] font-bold animate-pulse">
              FOCUS ACTIVE
            </span>
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
            {lines.map((_, i) => (
              <div
                key={i}
                className="h-[26px] text-right text-[11px] font-mono text-[var(--rf-border)] leading-[1.65]"
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Code editor */}
        <div className="flex-1 relative overflow-hidden">
          {/* Highlight layer */}
          <div
            ref={highlightRef}
            className="absolute inset-0 p-4 overflow-hidden pointer-events-none text-[13px] font-mono leading-[1.65] whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: highlightHtml }}
          />

          {/* Placeholder */}
          {showPlaceholder && (
            <div className="absolute inset-0 p-4 text-[13px] font-mono leading-[1.65] text-[var(--rf-mist)]/30 pointer-events-none whitespace-pre-wrap break-words">
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
        <div className="absolute bottom-0 right-0 px-2 py-1 text-[10px] font-mono text-[var(--rf-mist)]/50 bg-[var(--rf-depth)] border-t border-l border-[var(--rf-border)] rounded-tl-[8px] z-10 select-none">
          {charCount} / {maxChars}
        </div>
      </div>
    </div>
  );
}
