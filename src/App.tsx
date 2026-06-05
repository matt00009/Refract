import { useState, useEffect, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { Editor } from './components/Editor';
import { Results } from './components/Results';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SettingsModal } from './components/SettingsModal';
import { Onboarding } from './components/Onboarding';
import { ToastContainer, ToastType } from './components/Toast';
import { analyzeCode } from './lib/api';
import { loadHistory, saveToHistory, clearHistory, LIMIT } from './lib/history';
import { detectLanguage, type DetectionResult } from './lib/detect';
import type { AnalysisResult, HistoryEntry, Provider } from './types/analysis';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export default function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('auto');
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [provider, setProvider] = useState<Provider>('auto');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    setHistory(loadHistory());

    // Load draft from LocalStorage
    const savedDraft = localStorage.getItem('rf_current_draft');
    if (savedDraft) {
      try {
        const decoded = JSON.parse(savedDraft);
        if (decoded.code) setCode(decoded.code);
        if (decoded.lang) setLanguage(decoded.lang);
      } catch (e) {
        console.error('Failed to parse saved draft:', e);
      }
    }

    // Check if onboarding was seen
    const seen = localStorage.getItem('rf_onboarding_seen');
    if (!seen) {
      setShowOnboarding(true);
    }
  }, []);

  // Persist code to LocalStorage (debounced to avoid blocking on every keystroke)
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('rf_current_draft', JSON.stringify({ code, lang: language }));
    }, 500);
    return () => clearTimeout(timer);
  }, [code, language]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setSettingsOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setHistoryOpen((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setFocusMode((v) => !v);
        addToast(focusMode ? 'Focus Mode Disabled' : 'Focus Mode Enabled', 'success');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusMode, addToast]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('rf_onboarding_seen', 'true');
    setShowOnboarding(false);
    addToast('Welcome to Refract!', 'success');
  };

  const handleAnalyze = async () => {
    if (!code.trim()) return;

    setLoading(true);
    try {
      const detectionResult = language === 'auto' ? detectLanguage(code) : null;
      const resolvedLang = detectionResult ? detectionResult.lang : language;
      
      if (detectionResult) {
        setDetection(detectionResult);
      } else {
        setDetection(null);
      }

      const analysisResult = await analyzeCode(code, resolvedLang, provider);

      setResult(analysisResult);

      const entry = saveToHistory({
        ts: Date.now(),
        lang: resolvedLang,
        code,
        score: analysisResult.score,
        summary: analysisResult.summary,
        provider,
        resultCache: analysisResult,
      });

      setHistory((prev) => [entry, ...prev].slice(0, LIMIT));
      addToast('Analysis complete', 'success');
    } catch (error) {
      console.error('Analysis failed:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleHistorySelect = (entry: HistoryEntry) => {
    setCode(entry.code);
    setLanguage(entry.lang);
    setProvider(entry.provider);
    setResult(entry.resultCache);
    addToast('Loaded from history', 'success');
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
    addToast('History cleared', 'success');
  };

  const handleImport = (imported: HistoryEntry[]) => {
    setHistory(imported);
    addToast(`Imported ${imported.length} entries`, 'success');
  };

  const handleShare = async () => {
    if (!result) {
      addToast('Analyze code first to share report', 'error');
      return;
    }

    try {
      const markdown = `
# Refract Analysis Report
**Score:** ${result.score}/100
**Complexity:** ${result.complexity}

## Summary
${result.summary}

## Issues
${result.issues.map(i => `- [${i.severity.toUpperCase()}] ${i.title}: ${i.description}${i.line ? ` (Line ${i.line})` : ''}`).join('\n')}

## Strengths
${result.strengths.map(s => `- ${s}`).join('\n')}

---
Generated by Refract
      `.trim();

      await navigator.clipboard.writeText(markdown);
      addToast('Markdown report copied to clipboard!', 'success');
    } catch {
      addToast('Failed to copy report', 'error');
    }
  };

  return (
    <div className={`min-w-[400px] h-screen bg-[var(--rf-void)] flex flex-col overflow-hidden transition-all duration-500 ${focusMode ? 'rf-focus-active' : ''}`}>
      {!focusMode && (
        <TopBar
          provider={provider}
          onProviderChange={setProvider}
          onAnalyze={handleAnalyze}
          onHistoryClick={() => setHistoryOpen(true)}
          onSettingsClick={() => setSettingsOpen(true)}
          onShare={handleShare}
          isLoading={loading}
        />
      )}

      <div className={`flex-1 flex overflow-hidden md:flex-row flex-col ${!focusMode ? 'pt-[52px]' : ''}`}>
        <div className={`transition-all duration-500 flex flex-col overflow-hidden ${focusMode ? 'w-full h-full' : 'md:w-1/2 w-full md:h-full h-1/2'}`}>
          <Editor
            code={code}
            language={language}
            onChange={setCode}
            onAnalyze={handleAnalyze}
            onLanguageChange={setLanguage}
            isFocusMode={focusMode}
            onFocusToggle={() => setFocusMode(!focusMode)}
            detection={detection}
          />
        </div>

        {!focusMode && (
          <div className="md:w-1/2 w-full md:h-full h-1/2 flex flex-col overflow-hidden bg-[var(--rf-void)] md:border-l border-t md:border-t-0 border-[var(--rf-border)]">
            <Results result={result} loading={loading} onReset={() => setResult(null)} />
          </div>
        )}
      </div>

      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        entries={history}
        onSelect={handleHistorySelect}
        onClear={handleClearHistory}
        onImport={handleImport}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {showOnboarding && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
