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
import { detectLanguage } from './lib/detect';
import type { AnalysisResult, HistoryEntry, Provider } from './types/analysis';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export default function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('auto');
  const [provider, setProvider] = useState<Provider>('auto');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  // Persist code to LocalStorage
  useEffect(() => {
    localStorage.setItem('rf_current_draft', JSON.stringify({ code, lang: language }));
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('rf_onboarding_seen', 'true');
    setShowOnboarding(false);
    addToast('Welcome to Refract!', 'success');
  };

  const handleAnalyze = async () => {
    if (!code.trim()) return;

    setLoading(true);
    try {
      const resolvedLang = language === 'auto' ? detectLanguage(code) : language;
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
    setProvider(entry.provider as Provider);
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

  const handleShare = () => {
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

      navigator.clipboard.writeText(markdown);
      addToast('Markdown report copied to clipboard!', 'success');
    } catch {
      addToast('Failed to copy report', 'error');
    }
  };

  return (
    <div className="min-w-[400px] h-screen bg-[var(--rf-void)] flex flex-col overflow-hidden">
      <TopBar
        language={language}
        onLanguageChange={setLanguage}
        provider={provider}
        onProviderChange={setProvider}
        onAnalyze={handleAnalyze}
        onHistoryClick={() => setHistoryOpen(true)}
        onSettingsClick={() => setSettingsOpen(true)}
        onShare={handleShare}
        isLoading={loading}
      />

      <div className="flex-1 flex pt-[52px] overflow-hidden md:flex-row flex-col">
        <div className="md:w-1/2 w-full md:h-full h-1/2 flex flex-col overflow-hidden">
          <Editor
            code={code}
            language={language}
            onChange={setCode}
            onAnalyze={handleAnalyze}
            onLanguageDetect={setLanguage}
          />
        </div>

        <div className="md:w-1/2 w-full md:h-full h-1/2 flex flex-col overflow-hidden bg-[var(--rf-forest)] md:border-l border-t md:border-t-0 border-[var(--rf-border)]">
          <Results result={result} loading={loading} onReset={() => setResult(null)} />
        </div>
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
