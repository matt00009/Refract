import { useEffect, useRef, useState } from 'react';
import { Copy, Trash2, Check } from 'lucide-react';
import { highlightCodeToTokens } from '../lib/highlight';
import { detectLanguage } from '../lib/detect';

interface EditorProps {
  code: string;
  language: string;
  onChange: (code: string) => void;
  onAnalyze: () => void;
  onLanguageDetect: (lang: string) => void;
}

export function Editor({ code, language, onChange, onAnalyze, onLanguageDetect }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const lineNumRef = useRef<HTMLDivElement>(null);
  const [highlightHtml, setHighlightHtml] = useState('');
  const [showPlaceholder, setShowPlaceholder] = useState(code.length === 0);
  const [copied, setCopied] = useState(false);

  const charCount = code.length;
  const maxChars = 4000;

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
                html += `<span style="color: ${color}">${token.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`;
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

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

    // Detect language from pasted content
    if (language === 'auto' || language === '') {
      setTimeout(() => {
        const fullCode = code + pasted;
        const detected = detectLanguage(fullCode);
        if (detected !== 'javascript') {
          onLanguageDetect(detected);
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
    <div className="h-full flex flex-col bg-[var(--rf-depth)] border-r border-[var(--rf-border)]">
      {/* Editor container */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Editor Toolbar */}
        <div className="h-9 px-4 border-b border-[var(--rf-border)] bg-[var(--rf-forest)]/30 flex items-center justify-between shrink-0">
          <span className="text-[10px] uppercase tracking-widest text-[var(--rf-border)] font-bold">Input Buffer</span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              disabled={!code}
              className="p-1.5 hover:bg-[var(--rf-forest)] rounded-md transition-colors text-[var(--rf-border)] hover:text-white disabled:opacity-30"
              title="Copy code"
            >
              {copied ? <Check size={14} className="text-[var(--rf-volt)]" /> : <Copy size={14} />}
            </button>
            <button
              onClick={handleClear}
              disabled={!code}
              className="p-1.5 hover:bg-[var(--rf-forest)] rounded-md transition-colors text-[var(--rf-border)] hover:text-[var(--rf-ember)] disabled:opacity-30"
              title="Clear editor"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Line numbers + code */}
        <div className="flex flex-1 overflow-hidden">
          {/* Line numbers */}
          <div className="w-8 bg-[var(--rf-forest)] border-r border-[var(--rf-border)] flex flex-col overflow-hidden">
            <div ref={lineNumRef} className="flex-1 overflow-hidden pt-4 pr-2">
              {code
                .split('\n')
                .map((_, i) => (
                  <div
                    key={i}
                    className="h-[26px] text-right text-[11px] rf-mono text-[var(--rf-border)] leading-[1.65] opacity-50"
                  >
                    {i + 1}
                  </div>
                ))
                .slice(0, Math.max(code.split('\n').length || 1))}
            </div>
          </div>

          {/* Code editor */}
          <div className="flex-1 relative overflow-hidden">
            {/* Highlight layer */}
            <div
              ref={highlightRef}
              className="absolute inset-0 p-4 overflow-hidden pointer-events-none text-[13px] rf-mono leading-[1.65] whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: highlightHtml }}
            />

            {/* Placeholder */}
            {showPlaceholder && (
              <div className="absolute inset-0 p-4 text-[13px] rf-mono leading-[1.65] text-[var(--rf-border)] pointer-events-none opacity-40 whitespace-pre-wrap break-words">
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
              className="absolute inset-0 p-4 w-full h-full text-[13px] rf-mono leading-[1.65] bg-transparent text-transparent caret-[var(--rf-volt)] resize-none outline-none"
              spellCheck="false"
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>
        </div>
      </div>

      {/* Character counter */}
      <div className="px-6 py-2 text-right text-[11px] text-[var(--rf-border)] border-t border-[var(--rf-border)]">
        {charCount} / {maxChars}
      </div>
    </div>
  );
}

