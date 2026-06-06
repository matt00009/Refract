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
}).passthrough(); // Allow AI to add extra fields per issue

export const analysisResultSchema = z.object({
  score: z.number().min(0).max(100).describe('Overall security and quality score out of 100.'),
  complexity: z.enum(['low', 'medium', 'high', 'critical']).describe('Cyclomatic and structural complexity rating.'),
  summary: z.string().describe('A comprehensive one-paragraph summary of the code quality and security.'),
  issues: z.array(issueSchema).describe('List of detected issues, maximum 8.'),
  strengths: z.array(z.string()).describe('List of 2-3 key strengths in the code.'),
  insights: z.array(z.string()).optional().describe('Optional lateral insights or architectural advice.'),
}).passthrough(); // Allow AI to return entirely new top-level keys

export type ZodIssue = z.infer<typeof issueSchema>;
export type ZodAnalysisResult = z.infer<typeof analysisResultSchema>;
