import { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { Editor } from './components/Editor';
import { Results } from './components/Results';
import { HistoryDrawer } from './components/HistoryDrawer';
import { analyzeCode } from './lib/api';
import { loadHistory, saveToHistory, clearHistory } from './lib/history';
import { detectLanguage } from './lib/detect';
import type { AnalysisResult, HistoryEntry } from './types/analysis';

export default function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('auto');
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
      const detectedLang = language === 'auto' ? detectLanguage(code) : language;
      const analysisResult = await analyzeCode(code, detectedLang);

      setResult(analysisResult);

      // Save to history
      const entry = saveToHistory({
        ts: Date.now(),
        lang: detectedLang,
        code: code.substring(0, 200),
        score: analysisResult.score,
        summary: analysisResult.summary,
      });

      setHistory((prev) => [entry, ...prev].slice(0, 10));
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleHistorySelect = (entry: HistoryEntry) => {
    setCode(entry.code);
    setLanguage(entry.lang);
    setResult(null);
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
  };

  const handleLanguageDetect = (detectedLang: string) => {
    setLanguage(detectedLang);
  };

  return (
    <div className="min-w-[400px] h-screen bg-[var(--rf-void)] flex flex-col overflow-hidden">
      <TopBar
        language={language}
        onLanguageChange={handleLanguageChange}
        onAnalyze={handleAnalyze}
        onHistoryClick={() => setHistoryOpen(true)}
        isLoading={loading}
      />

      <div className="flex-1 flex gap-0 pt-[52px] overflow-hidden md:flex-row flex-col">
        {/* Editor pane */}
        <div className="md:w-1/2 w-full md:h-full h-1/2 flex flex-col overflow-hidden">
          <Editor code={code} language={language} onChange={setCode} onAnalyze={handleAnalyze} onLanguageDetect={handleLanguageDetect} />
        </div>

        {/* Results pane */}
        <div className="md:w-1/2 w-full md:h-full h-1/2 flex flex-col overflow-hidden bg-[var(--rf-forest)] md:border-l border-t md:border-t-0 border-[var(--rf-border)]">
          <Results result={result} loading={loading} />
        </div>
      </div>

      <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} entries={history} onSelect={handleHistorySelect} onClear={handleClearHistory} />
    </div>
  );
}
