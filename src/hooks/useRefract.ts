import { useState, useEffect, useCallback } from 'react';
import { useToasts } from './useToasts';
import { detectLanguage, DetectionResult } from '../lib/detect';
import { analyzeCode } from '../lib/api';
import { loadHistory, saveToHistory, clearHistory, LIMIT, syncLocalHistoryToCloud } from '../lib/history';
import { pb, subscribeToHistory, isAuthenticated, createSharedReport } from '../lib/db';
import type { HistoryEntry, AnalysisResult, Provider } from '../types/analysis';

export function useRefract() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('auto');
  const [provider, setProvider] = useState<Provider>('auto');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [detection, setDetection] = useState<DetectionResult | null>(null);

  const { addToast } = useToasts();

  const refreshHistory = useCallback(async () => {
    const data = await loadHistory();
    setHistory(data);
  }, []);

  // Initialization
  useEffect(() => {
    const init = async () => {
      await refreshHistory();
      const savedDraft = localStorage.getItem('rf_current_draft');
      if (savedDraft) {
        try {
          const decoded = JSON.parse(savedDraft);
          if (decoded.code) setCode(decoded.code);
          if (decoded.lang) setLanguage(decoded.lang);
        } catch (e) { console.error('Draft_Restoration_Failed', e); }
      }
      if (!localStorage.getItem('rf_onboarding_seen')) setShowOnboarding(true);
    };
    init();

    const removeListener = pb.authStore.onChange(async () => {
      if (isAuthenticated()) {
        addToast('Cloud_Link_Established', 'success');
        await syncLocalHistoryToCloud();
      } else {
        addToast('Cloud_Link_Severed', 'warning');
      }
      await refreshHistory();
    });
    return () => removeListener();
  }, [refreshHistory, addToast]);

  // Sync
  useEffect(() => {
    if (!isAuthenticated()) return;
    const unsubscribe = subscribeToHistory(async (e) => {
      if (['create', 'delete', 'update'].includes(e.action)) {
        await refreshHistory();
        if (e.action === 'create') addToast('Vector_Registry_Synced', 'success');
      }
    });
    return () => unsubscribe();
  }, [refreshHistory, addToast]);

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('rf_current_draft', JSON.stringify({ code, lang: language }));
    }, 500);
    return () => clearTimeout(timer);
  }, [code, language]);

  const handleAnalyze = async () => {
    if (!code.trim()) {
      addToast('Buffer_Empty: Input required', 'warning');
      return;
    }
    if (code.length < 20) {
      addToast('Payload_Too_Small: Minimum 20 chars', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      const detectionResult = language === 'auto' ? detectLanguage(code) : null;
      const resolvedLang = detectionResult ? detectionResult.lang : language;
      setDetection(detectionResult);

      const analysisResult = await analyzeCode(code, resolvedLang, provider);
      setResult(analysisResult);

      const entry = await saveToHistory({
        ts: Date.now(), lang: resolvedLang, code,
        score: analysisResult.score, summary: analysisResult.summary,
        provider, resultCache: analysisResult,
      });

      setHistory((prev) => [entry, ...prev].slice(0, LIMIT));
      addToast('Analysis_Success', 'success');
    } catch (err: any) {
      console.error('Analysis_Protocol_Failure', err);
      const msg = err.message || 'Unknown protocol error';
      if (msg.includes('rate limit')) {
        addToast('Rate_Limit_Exceeded: Protocol throttled', 'error');
      } else if (msg.includes('timeout')) {
        addToast('Request_Timeout: Remote core unresponsive', 'error');
      } else {
        addToast(`Analysis_Protocol_Failure: ${msg}`, 'error');
      }
    } finally { setLoading(false); }
  };

  const handleHistorySelect = (entry: HistoryEntry) => {
    setCode(entry.code);
    setLanguage(entry.lang);
    setProvider(entry.provider);
    setResult(entry.resultCache);
    addToast('Buffer_Restored_From_Registry', 'success');
  };

  const handleClearHistory = async () => {
    await clearHistory();
    setHistory([]);
    addToast('Vector_Registry_Purged', 'success');
  };

  const handleShare = useCallback(async () => {
    if (!result) return;
    if (isAuthenticated()) {
      try {
        addToast('Establishing_Cloud_Link...', 'success');
        const record = await createSharedReport(result, language);
        const shareUrl = `${window.location.origin}/report/${record.id}`;
        await navigator.clipboard.writeText(shareUrl);
        addToast('Cloud_Link_Exported', 'success');
        return;
      } catch (err) { console.error('Cloud_Export_Error', err); }
    }
    const report = `# Refract Analysis\n\nScore: ${result.score}\n\n## Summary\n${result.summary}`;
    await navigator.clipboard.writeText(report);
    addToast('Markdown_Telemetry_Exported', 'success');
  }, [result, language, addToast]);

  return {
    code, setCode,
    language, setLanguage,
    provider, setProvider,
    result, setResult,
    loading,
    history, setHistory,
    historyOpen, setHistoryOpen,
    settingsOpen, setSettingsOpen,
    statsOpen, setStatsOpen,
    showOnboarding, setShowOnboarding,
    focusMode, setFocusMode,
    detection,
    handleAnalyze,
    handleHistorySelect,
    handleClearHistory,
    handleShare,
    handleOnboardingComplete: () => {
      localStorage.setItem('rf_onboarding_seen', 'true');
      setShowOnboarding(false);
      addToast('System_Initialization_Complete', 'success');
    }
  };
}
