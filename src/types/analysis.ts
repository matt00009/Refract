export type Severity = 'bug' | 'warning' | 'suggestion';
export type Complexity = 'low' | 'medium' | 'high' | 'critical';

export interface Issue {
  severity: Severity;
  title: string;
  description: string;
  line: number | null;
  fix: string | null;
}

export interface AnalysisResult {
  score: number;
  complexity: Complexity;
  summary: string;
  issues: Issue[];
  strengths: string[];
}

export interface HistoryEntry {
  id: string;
  ts: number;
  lang: string;
  code: string;
  score: number;
  summary: string;
}
