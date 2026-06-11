import { type ZodAnalysisResult, type ZodIssue, type ZodHistoryEntry } from './schemas';

/** Severity levels for code review issues. */
export type Severity = 'bug' | 'warning' | 'suggestion';

/** Complexity rating for analyzed code. */
export type Complexity = 'low' | 'medium' | 'high' | 'critical';

/** Supported AI provider identifiers. */
export type Provider = 'auto' | 'groq' | 'mistral' | 'deepseek' | 'anthropic' | 'gemini';

/** A single issue found during code analysis. */
export type Issue = ZodIssue;

/** The result of an AI-powered code analysis. */
export type AnalysisResult = ZodAnalysisResult;

/** A saved history entry for a past code analysis. */
export type HistoryEntry = ZodHistoryEntry;
