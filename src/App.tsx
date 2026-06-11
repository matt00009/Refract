import { lazy, Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBar } from './components/ui/TopBar';
import { Editor } from './components/editor/Editor';
import { Results } from './components/results/Results';
import { ToastContainer } from './components/ui/Toast';
import { useToasts } from './hooks/useToasts';
import { StatsForge } from './components/StatsForge';
import { useRefract } from './hooks/useRefract';
import { SmartHUD } from './components/ui/SmartHUD';

// Lazy load non-critical components
const HistoryDrawer = lazy(() => import('./components/history/HistoryDrawer').then(m => ({ default: m.HistoryDrawer })));
const SettingsModal = lazy(() => import('./components/ui/SettingsModal').then(m => ({ default: m.SettingsModal })));
const Onboarding = lazy(() => import('./components/ui/Onboarding').then(m => ({ default: m.Onboarding })));

export default function App() {
  const {
    code, setCode,
    language, setLanguage,
    provider, setProvider,
    result, setResult,
    loading,
    history, setHistory,
    historyOpen, setHistoryOpen,
    settingsOpen, setSettingsOpen,
    statsOpen, setStatsOpen,
    showOnboarding,
    focusMode, setFocusMode,
    detection,
    handleAnalyze,
    handleHistorySelect,
    handleClearHistory,
    handleShare,
    handleOnboardingComplete
  } = useRefract();

  const { toasts, removeToast } = useToasts();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      
      if (isMod && e.key === 'h') {
        e.preventDefault();
        setHistoryOpen((prev: boolean) => !prev);
      } else if (isMod && e.key === ',') {
        e.preventDefault();
        setSettingsOpen((prev: boolean) => !prev);
      } else if (isMod && e.key === 'g') {
        e.preventDefault();
        setStatsOpen((prev: boolean) => !prev);
      } else if (isMod && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        setResult(null);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [setHistoryOpen, setSettingsOpen, setStatsOpen, setResult]);

  return (
    <div className={`min-h-screen bg-[var(--rf-void)] text-[var(--rf-mist)] selection:bg-[var(--rf-volt)] selection:text-[var(--rf-void)] rf-crt-effect ${focusMode ? 'rf-focus-mode' : ''}`}>
      <TopBar 
        provider={provider} 
        onProviderChange={setProvider} 
        onAnalyze={handleAnalyze} 
        onHistoryClick={() => setHistoryOpen(true)} 
        onSettingsClick={() => setSettingsOpen(true)} 
        onShare={handleShare}
        onStatsClick={() => setStatsOpen(true)}
        isLoading={loading} 
      />
      
      <main id="main-content" className="pt-[52px] h-screen flex overflow-hidden outline-none">
        <motion.div 
          initial={false}
          animate={{ flex: focusMode ? '1 1 100%' : '1 1 55%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative rf-net-grid border-r-2 border-[var(--rf-border)] overflow-hidden"
        >
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
        </motion.div>

        <AnimatePresence mode="popLayout">
          {!focusMode && (
            <motion.div 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              className="flex-1 bg-[var(--rf-depth)] flex flex-col relative z-10 shadow-[-20px_0_60px_rgba(0,0,0,0.8)]"
            >
              <Results result={result} loading={loading} onReset={() => setResult(null)} language={language} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <SmartHUD loading={loading} />

      <AnimatePresence>
        {statsOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="fixed inset-0 z-[60] bg-[var(--rf-void)]/80 flex items-center justify-center p-12"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-6xl h-full max-h-[85vh] bg-[var(--rf-depth)] border-2 border-[var(--rf-border)] shadow-2xl relative overflow-hidden"
            >
              <StatsForge onClose={() => setStatsOpen(false)} history={history} currentResult={result} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} entries={history} onSelect={handleHistorySelect} onClear={handleClearHistory} onImport={(entries) => setHistory(entries)} />
        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      </Suspense>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

