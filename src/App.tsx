import { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { Editor } from './components/Editor';
import { Results } from './components/Results';
import { HistoryDrawer } from './components/HistoryDrawer';
import { analyzeCode } from './lib/api';
import { loadHistory, saveToHistory, clearHistory, LIMIT } from './lib/history';
import { detectLanguage } from './lib/detect';
import type { AnalysisResult, HistoryEntry, Provider } from './types/analysis';

export default function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('auto');
  const [provider, setProvider] = useState<Provider>('auto');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

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
    } catch (error) {
      console.error('Analysis failed:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Analysis failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleHistorySelect = (entry: HistoryEntry) => {
    setCode(entry.code);
    setLanguage(entry.lang);
    setProvider(entry.provider as Provider);
    setResult(entry.resultCache);
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const handleImport = (imported: HistoryEntry[]) => {
    setHistory(imported);
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
          <Results result={result} loading={loading} />
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
    </div>
  );
}
