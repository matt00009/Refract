import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { TopBar } from './components/TopBar';
import { Editor } from './components/Editor';
import { Results } from './components/Results';
import { ToastContainer } from './components/Toast';
import { useToasts } from './hooks/useToasts';
import { detectLanguage, DetectionResult } from './lib/detect';
import { analyzeCode } from './lib/api';
import { loadHistory, saveToHistory, clearHistory, LIMIT, syncLocalHistoryToCloud } from './lib/history';
import { pb, subscribeToHistory, isAuthenticated, createSharedReport } from './lib/db';
import type { HistoryEntry, AnalysisResult, Provider } from './types/analysis';

// Lazy load non-critical components for performance
const HistoryDrawer = lazy(() => import('./components/HistoryDrawer').then(m => ({ default: m.HistoryDrawer })));
const SettingsModal = lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));
const Onboarding = lazy(() => import('./components/Onboarding').then(m => ({ default: m.Onboarding })));

export default function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('auto');
  const [provider, setProvider] = useState<Provider>('auto');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [detection, setDetection] = useState<DetectionResult | null>(null);

  const { toasts, addToast, removeToast } = useToasts();

  const refreshHistory = useCallback(async () => {
    const data = await loadHistory();
    setHistory(data);
  }, []);

  // 1. Initial Data Loading & Auth Sync
  useEffect(() => {
    const init = async () => {
      await refreshHistory();

      // Load Draft
      const savedDraft = localStorage.getItem('rf_current_draft');
      if (savedDraft) {
        try {
          const decoded = JSON.parse(savedDraft);
          if (decoded.code) setCode(decoded.code);
          if (decoded.lang) setLanguage(decoded.lang);
        } catch (e) { console.error('Draft fail:', e); }
      }

      // Check Onboarding
      if (!localStorage.getItem('rf_onboarding_seen')) setShowOnboarding(true);
    };

    init();

    // Listen for Auth Changes
    const removeListener = pb.authStore.onChange(async () => {
      if (isAuthenticated()) {
        addToast('Cloud account connected', 'success');
        await syncLocalHistoryToCloud();
      } else {
        addToast('Cloud account disconnected', 'warning');
      }
      await refreshHistory();
    });

    return () => removeListener();
  }, [refreshHistory, addToast]);

  // 2. Real-time Cloud Subscriptions
  useEffect(() => {
    if (!isAuthenticated()) return;

    const unsubscribe = subscribeToHistory(async (e) => {
      if (e.action === 'create' || e.action === 'delete' || e.action === 'update') {
        await refreshHistory();
        if (e.action === 'create') addToast('History synced', 'success');
      }
    });

    return () => { unsubscribe(); };
  }, [refreshHistory, addToast]);

  // 3. Draft Persistence
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('rf_current_draft', JSON.stringify({ code, lang: language }));
    }, 500);
    return () => clearTimeout(timer);
  }, [code, language]);

  // 4. Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ',') { e.preventDefault(); setSettingsOpen(true); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') { e.preventDefault(); setHistoryOpen((v) => !v); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setFocusMode((prev) => {
          const next = !prev;
          addToast(next ? 'Focus Enabled' : 'Focus Disabled', 'success');
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addToast]);

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
      if (detectionResult) setDetection(detectionResult);
      else setDetection(null);

      const analysisResult = await analyzeCode(code, resolvedLang, provider);
      setResult(analysisResult);

      const entry = await saveToHistory({
        ts: Date.now(), lang: resolvedLang, code,
        score: analysisResult.score, summary: analysisResult.summary,
        provider, resultCache: analysisResult,
      });

      setHistory((prev) => [entry, ...prev].slice(0, LIMIT));
      addToast('Analysis complete', 'success');
    } catch (error) {
      console.error('Analysis failed:', error);
      addToast(error instanceof Error ? error.message : 'Error', 'error');
    } finally { setLoading(false); }
  };

  const handleHistorySelect = (entry: HistoryEntry) => {
    setCode(entry.code);
    setLanguage(entry.lang);
    setProvider(entry.provider);
    setResult(entry.resultCache);
    addToast('Loaded from history', 'success');
  };

  const handleClearHistory = async () => {
    await clearHistory();
    setHistory([]);
    addToast('History cleared', 'success');
  };

  const handleShare = useCallback(async () => {
    if (!result) return;
    
    if (isAuthenticated()) {
      try {
        addToast('Génération du lien cloud...', 'success');
        const record = await createSharedReport(result, language);
        const shareUrl = `${window.location.origin}/report/${record.id}`;
        await navigator.clipboard.writeText(shareUrl);
        addToast('Lien cloud copié !', 'success');
        return;
      } catch (err) {
        console.error('Cloud share fail:', err);
      }
    }

    // Fallback to Markdown sharing
    const report = `# Refract Analysis\n\nScore: ${result.score}\n\n## Summary\n${result.summary}`;
    await navigator.clipboard.writeText(report);
    addToast('Rapport Markdown copié', 'success');
  }, [result, language, addToast]);

  return (
    <div className={`min-h-screen bg-[var(--rf-void)] text-[var(--rf-mist)] selection:bg-[var(--rf-volt)] selection:text-[var(--rf-void)] rf-crt-effect ${focusMode ? 'rf-focus-mode' : ''}`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[var(--rf-volt)] focus:text-[var(--rf-void)] focus:font-bold focus:rounded-sm"
      >
        Aller au contenu principal
      </a>

      <TopBar provider={provider} onProviderChange={setProvider} onAnalyze={handleAnalyze} onHistoryClick={() => setHistoryOpen(true)} onSettingsClick={() => setSettingsOpen(true)} onShare={handleShare} isLoading={loading} />
      
      <main id="main-content" tabIndex={-1} className="pt-[52px] h-[calc(100vh)] flex overflow-hidden outline-none">
        <div className={`flex-1 transition-all duration-500 ease-in-out rf-net-grid ${focusMode ? 'max-w-full' : 'max-w-[55%]'}`}>
          <Editor code={code} language={language} onChange={setCode} onAnalyze={handleAnalyze} onLanguageChange={setLanguage} isFocusMode={focusMode} onFocusToggle={() => setFocusMode(!focusMode)} detection={detection} />
        </div>
        {!focusMode && (
          <div className="flex-1 border-l border-[var(--rf-border)] bg-[var(--rf-depth)] flex flex-col rf-net-grid">
            <Results result={result} loading={loading} onReset={() => setResult(null)} language={language} />
          </div>
        )}
      </main>

      <Suspense fallback={null}>
        <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} entries={history} onSelect={handleHistorySelect} onClear={handleClearHistory} onImport={(entries) => setHistory(entries)} />
        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      </Suspense>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
