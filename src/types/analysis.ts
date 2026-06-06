/** Severity levels for code review issues. */
export type Severity = 'bug' | 'warning' | 'suggestion';

/** Complexity rating for analyzed code. */
export type Complexity = 'low' | 'medium' | 'high' | 'critical';

/** Supported AI provider identifiers. */
export type Provider = 'auto' | 'groq' | 'mistral' | 'deepseek' | 'anthropic' | 'gemini';

/** A single issue found during code analysis. */
export interface Issue {
  severity: Severity;
  title: string;
  description: string;
  line: number | null;
  vulnerable_code: string | null;
  fix: string | null;
  fix_code: string | null;
  fix_explanation: string | null;
  [key: string]: unknown; // Allow for unmapped creative fields from the AI (Zod passthrough)
}

/** The result of an AI-powered code analysis. */
export interface AnalysisResult {
  score: number;
  complexity: Complexity;
  summary: string;
  issues: Issue[];
  strengths: string[];
  insights?: string[]; // Optional lateral insights or architectural advice
  latency?: number;
  routed?: {
    provider: string;
    model: string;
  };
  [key: string]: unknown; // Allow for unmapped creative fields from the AI (Zod passthrough)
}

/** A saved history entry for a past code analysis. */
export interface HistoryEntry {
  id: string;
  ts: number;
  lang: string;
  code: string;
  score: number;
  summary: string;
  provider: Provider;
  resultCache: AnalysisResult;
}
