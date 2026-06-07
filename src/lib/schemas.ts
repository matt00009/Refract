import { z } from 'zod';

export const issueSchema = z.object({
  severity: z.preprocess(
    (val) => {
      const s = String(val).toLowerCase().trim();
      if (['critical', 'high', 'error', 'fatal'].includes(s)) return 'bug';
      if (['medium', 'notice'].includes(s)) return 'warning';
      if (['info', 'low', 'hint', 'suggestion'].includes(s)) return 'suggestion';
      return s;
    },
    z.enum(['bug', 'warning', 'suggestion'])
  ).describe('The severity of the issue: bug, warning, or suggestion.'),
  title: z.string().describe('Short, concise title of the issue.'),
  description: z.string().describe('Detailed explanation of why this is an issue.'),
  line: z.number().nullable().describe('Line number where the issue occurs, if applicable.'),
  vulnerable_code: z.string().nullable().describe('The exact lines of vulnerable code. No prose.'),
  fix_code: z.string().nullable().describe('The exact lines of code that fix the issue. No prose.'),
  fix: z.string().nullable().optional().describe('Legacy fix field, maps to fix_code.'),
  fix_explanation: z.string().nullable().describe('Clean, step-by-step structural instructions in French separated by newlines.'),
}); // Removed passthrough for strict validation

export const analysisResultSchema = z.object({
  score: z.number().min(0).max(100).describe('Overall security and quality score out of 100.'),
  complexity: z.enum(['low', 'medium', 'high', 'critical']).describe('Cyclomatic and structural complexity rating.'),
  summary: z.string().describe('A comprehensive one-paragraph summary of the code quality and security.'),
  issues: z.array(issueSchema).describe('List of detected issues, maximum 8.'),
  strengths: z.array(z.string()).describe('List of 2-3 key strengths in the code.'),
  insights: z.array(z.string()).optional().describe('Optional lateral insights or architectural advice.'),
  latency: z.number().optional().describe('Server-side analysis latency in milliseconds.'),
  routed: z.object({
    provider: z.string(),
    model: z.string(),
  }).optional().describe('Details about the AI provider and model used.'),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }).optional().describe('Token usage metrics for the analysis.'),
}); // Removed passthrough for strict validation

export const settingsSchema = z.object({
  temperature: z.number().min(0).max(2).default(0.1),
  maxTokens: z.number().min(1).max(32000).default(2048),
  provider: z.enum(['auto', 'groq', 'mistral', 'deepseek', 'anthropic', 'gemini']).default('auto'),
});

export const historyEntrySchema = z.object({
  id: z.string(),
  ts: z.number(),
  lang: z.string(),
  code: z.string(),
  score: z.number(),
  summary: z.string(),
  provider: z.enum(['auto', 'groq', 'mistral', 'deepseek', 'anthropic', 'gemini']),
  resultCache: analysisResultSchema,
});

export type ZodIssue = z.infer<typeof issueSchema>;
export type ZodAnalysisResult = z.infer<typeof analysisResultSchema>;
export type ZodHistoryEntry = z.infer<typeof historyEntrySchema>;
export type Settings = z.infer<typeof settingsSchema>;

export const errorResponseSchema = z.object({
  error: z.string(),
  code: z.enum(['INTERNAL_ERROR', 'PROVIDER_ERROR', 'MODEL_NOT_FOUND', 'TIMEOUT', 'RATE_LIMIT', 'AUTH_ERROR', 'INVALID_REQUEST']),
  status: z.number(),
  details: z.any().optional(),
  timestamp: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
