import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type { AnalysisResult } from '../src/types/analysis.js';
import { LANGUAGES } from '../src/lib/constants.js';

const app = express();
const port = 3001;

// ── Security Headers (Helmet) ───────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Handled by Vite in dev
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json({ limit: '16kb' })); // Prevent large body attacks
app.use(cors({ 
  origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : ['http://localhost:5173', 'http://localhost:5174'] 
}));

// ── Prompt Injection Guard ──────────────────────────────────
const INJECTION_PATTERNS = [
  /ignore\s+previous\s+instructions/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /\[INST\]/i,
  /<<SYS>>/i,
  /forget\s+(all|everything|previous)/i,
];

/**
 * Scans a code string for common prompt injection patterns used to hijack LLM behavior.
 * Checks against the INJECTION_PATTERNS regex list.
 *
 * @param code - The code or text to analyze
 * @returns true if an injection pattern is detected
 */
function detectPromptInjection(code: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(code));
}

/** 
 * Strip null bytes and dangerous control characters from user input to prevent attacks.
 * Preserves standard whitespace like tabs and newlines.
 * 
 * @param str - The raw user input string
 * @returns The sanitized string
 */
/* eslint-disable no-control-regex */
function sanitizeInput(str: string): string {
  return str
    .replace(/\x00/g, '')            // null bytes
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control chars (keep \t\n\r)
    .trim();
}
/* eslint-enable no-control-regex */

/** Validate API key format per provider (basic sanity check) */
const KEY_PATTERNS: Record<string, RegExp> = {
  anthropic: /^sk-ant-/,
  groq:      /^gsk_/,
  mistral:   /^[A-Za-z0-9]{32,}/,
  deepseek:  /^sk-/,
  gemini:    /^AI[za-zA-Z0-9_-]{30,}/,
};

/** 
 * Validates that an API key matches the expected format for its provider.
 * Performs a lightweight regex-based sanity check before making external calls.
 * 
 * @param provider - The provider identifier (e.g., 'anthropic')
 * @param key - The API key to validate
 * @returns true if the key format is valid or unknown
 */
function isValidKeyFormat(provider: string, key: string): boolean {
  const pattern = KEY_PATTERNS[provider];
  if (!pattern) return true; // Unknown provider — allow and let the API decide
  return pattern.test(key);
}

// Enterprise-grade sliding window rate limiter
const rateLimiter = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

/**
 * Enforces a sliding window rate limit based on the requester's IP.
 * Defaults to 10 requests per minute.
 * 
 * @param ip - The client's IP address
 * @returns true if the request is allowed, false if limited
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimiter.get(ip) || [];
  
  // Clean old entries from the current request's window
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  validTimestamps.push(now);
  rateLimiter.set(ip, validTimestamps);
  return true;
}

// Background cleanup: Remove IPs that haven't requested in the last window
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimiter.entries()) {
    if (timestamps.length === 0 || now - timestamps[timestamps.length - 1] > RATE_LIMIT_WINDOW_MS) {
      rateLimiter.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// Clean up interval on process exit to prevent memory leaks during hot reload
process.on('SIGTERM', () => { clearInterval(cleanupInterval); process.exit(0); });
process.on('SIGINT', () => { clearInterval(cleanupInterval); process.exit(0); });

// Config endpoint to tell frontend which keys are available server-side
app.get('/api/config', (_req, res) => {
  const config = {
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    mistral: !!process.env.MISTRAL_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    deepseek: !!process.env.DEEPSEEK_API_KEY,
  };
  res.json(config);
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const systemPrompt = `You are a senior software engineer performing a precise, helpful code review.
Respond ONLY with a valid JSON object following this exact schema without markdown wrap:

{
  "score": number,
  "complexity": "low" | "medium" | "high" | "critical",
  "summary": string,
  "issues": [
    {
      "severity": "bug" | "warning" | "suggestion",
      "title": string,
      "description": string,
      "line": number | null,
      "vulnerable_code": string | null,
      "fix_code": string | null,
      "fix_explanation": string | null
    }
  ],
  "strengths": string[]
}

STRICT FORMATTING RULES — NEVER BREAK THESE:
- "vulnerable_code" MUST contain EXCLUSIVELY the exact bad code lines (1-4 lines), never prose. Set null if no specific snippet.
- "fix_code" MUST contain EXCLUSIVELY clean, valid, runnable code lines that fix the issue. NEVER write plain prose explanation inside "fix_code". Set null if no fix.
- "fix_explanation" MUST contain clean, multi-step structural instructions in French detailing the exact procedure to solve the issue (separated by newlines, do not use bullet points or numbering prefix inside the string, just return clean steps separated by newlines).
- "description" is the ONLY field where you can write general explanation prose.
- Never hallucinate line numbers. Only cite lines you can count.
- If code is excellent, score 90+ and say so clearly.
- max 8 issues, 2-3 strengths.`;

// Provider Response Interfaces
interface OpenAIFormatResponse {
  choices: { message: { content: string } }[];
}

interface AnthropicResponse {
  content: { text: string }[];
}

interface GeminiResponse {
  candidates: { content: { parts: { text: string }[] } }[];
}

type ProviderConfig = {
  url: string;
  headers: (key: string) => Record<string, string>;
  getBody: (code: string, lang: string, model: string, temperature?: number, max_tokens?: number) => unknown;
  parse: (res: unknown) => string;
};

const API_MAP: Record<string, ProviderConfig> = {
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }),
    getBody: (code, lang, model, temperature, max_tokens) => ({
      model: model || 'llama-3.3-70b-versatile',
      temperature: temperature ?? 0.1,
      max_tokens: max_tokens ?? 2000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this ${lang} code:\n\n${code}` },
      ],
    }),
    parse: (res: unknown) => (res as OpenAIFormatResponse).choices[0].message.content,
  },
  mistral: {
    url: 'https://api.mistral.ai/v1/chat/completions',
    headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }),
    getBody: (code, lang, model, temperature, max_tokens) => ({
      model: model || (['javascript', 'typescript', 'python', 'html', 'css', 'json'].includes(lang) ? 'codestral-latest' : 'mistral-large-latest'),
      temperature: temperature ?? 0.1,
      max_tokens: max_tokens ?? 2000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this ${lang} code:\n\n${code}` },
      ],
    }),
    parse: (res: unknown) => (res as OpenAIFormatResponse).choices[0].message.content,
  },
  deepseek: {
    url: 'https://api.deepseek.com/v1/chat/completions',
    headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }),
    getBody: (code, lang, model, temperature, max_tokens) => ({
      model: model || 'deepseek-chat',
      temperature: temperature ?? 0.1,
      max_tokens: max_tokens ?? 2000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this ${lang} code:\n\n${code}` },
      ],
    }),
    parse: (res: unknown) => (res as OpenAIFormatResponse).choices[0].message.content,
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    headers: (key) => ({ 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' }),
    getBody: (code, lang, model, temperature, max_tokens) => ({
      model: model || 'claude-3-5-sonnet-20240620',
      max_tokens: max_tokens ?? 2000,
      temperature: temperature ?? 0,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Analyze this ${lang} code:\n\n${code}` }],
    }),
    parse: (res: unknown) => (res as AnthropicResponse).content[0].text,
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
    headers: (key) => ({ 'Content-Type': 'application/json', 'x-goog-api-key': key }),
    getBody: (code, lang, model, temperature, max_tokens) => ({
      contents: [{ parts: [{ text: `${systemPrompt}\n\nAnalyze this ${lang} code:\n\n${code}` }] }],
      generationConfig: { 
        responseMimeType: 'application/json',
        temperature: temperature ?? 0.1,
        maxOutputTokens: max_tokens ?? 2048,
      },
    }),
    parse: (res: unknown) => (res as GeminiResponse).candidates[0].content.parts[0].text,
  },
};

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('No JSON object found in response');
  return JSON.parse(trimmed.substring(first, last + 1));
}

function validateAnalysisResult(data: unknown): AnalysisResult {
  const obj = data as Record<string, unknown>;
  if (typeof data !== 'object' || data === null) throw new Error('Result must be an object');
  if (typeof obj.score !== 'number') throw new Error('score must be a number');
  if (!['low', 'medium', 'high', 'critical'].includes(obj.complexity as string)) throw new Error('invalid complexity');
  if (typeof obj.summary !== 'string') throw new Error('summary must be a string');
  if (!Array.isArray(obj.issues)) throw new Error('issues must be an array');
  if (!Array.isArray(obj.strengths) || !obj.strengths.every((s: unknown) => typeof s === 'string')) throw new Error('strengths must be an array of strings');

  (obj.issues as Record<string, unknown>[]).forEach((issue, i: number) => {
    if (!['bug', 'warning', 'suggestion'].includes(issue.severity as string)) throw new Error(`issues[${i}].severity is invalid`);
    if (typeof issue.title !== 'string') throw new Error(`issues[${i}].title must be a string`);
    if (typeof issue.description !== 'string') throw new Error(`issues[${i}].description must be a string`);
    if (issue.line !== null && typeof issue.line !== 'number') throw new Error(`issues[${i}].line must be number or null`);
    if (issue.vulnerable_code !== null && issue.vulnerable_code !== undefined && typeof issue.vulnerable_code !== 'string') throw new Error(`issues[${i}].vulnerable_code must be string or null`);
    
    // Validate fix, fix_code, fix_explanation
    if (issue.fix !== undefined && issue.fix !== null && typeof issue.fix !== 'string') throw new Error(`issues[${i}].fix must be string or null`);
    if (issue.fix_code !== undefined && issue.fix_code !== null && typeof issue.fix_code !== 'string') throw new Error(`issues[${i}].fix_code must be string or null`);
    if (issue.fix_explanation !== undefined && issue.fix_explanation !== null && typeof issue.fix_explanation !== 'string') throw new Error(`issues[${i}].fix_explanation must be string or null`);

    // Ensure fields default to null if missing, mapping compatibility
    if (issue.vulnerable_code === undefined) issue.vulnerable_code = null;
    if (issue.fix_code === undefined) issue.fix_code = (issue.fix as string | null) || null;
    if (issue.fix_explanation === undefined) issue.fix_explanation = null;
    if (issue.fix === undefined) issue.fix = (issue.fix_code as string | null) || null;
  });

  return obj as unknown as AnalysisResult;
}

// Retry fetch with backoff
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, backoff = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.status === 429 && i < retries - 1) {
        // Rate limited, wait and retry
        await new Promise(r => setTimeout(r, backoff * (i + 1)));
        continue;
      }

      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, backoff * (i + 1)));
    }
  }
  throw new Error('Max retries reached');
}

app.post('/api/analyze', async (req: express.Request, res: express.Response) => {
  try {
    const ip = req.ip || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    const { code, language } = req.body as { code: string; language: string };
    let { provider, model } = req.body as {
      provider: string;
      model?: string;
    };
    // temperature and max_tokens are forwarded to getBody for provider customisation
    const { temperature, max_tokens } = req.body as {
      temperature?: number;
      max_tokens?: number;
    };

    // ── Input Validation ──────────────────────────────────────
    if (model !== undefined && (typeof model !== 'string' || model.length > 100)) {
      return res.status(400).json({ error: 'Invalid model name' });
    }

    if (temperature !== undefined && (typeof temperature !== 'number' || temperature < 0 || temperature > 2)) {
      return res.status(400).json({ error: 'Temperature must be between 0 and 2' });
    }

    if (max_tokens !== undefined && (typeof max_tokens !== 'number' || max_tokens < 1 || max_tokens > 8000)) {
      return res.status(400).json({ error: 'max_tokens must be between 1 and 8000' });
    }

    const rawCode = typeof code === 'string' ? sanitizeInput(code) : '';

    if (!rawCode) {
      return res.status(400).json({ error: 'Code context is empty' });
    }

    if (rawCode.length > 4000) {
      return res.status(400).json({ error: 'Code exceeds 4000 character limit' });
    }

    if (detectPromptInjection(rawCode)) {
      return res.status(400).json({ error: 'Invalid input detected' });
    }

    const VALID_LANGS: readonly string[] = LANGUAGES;
    if (!VALID_LANGS.includes(language)) {
      return res.status(400).json({ error: 'Invalid language' });
    }

    const VALID_PROVIDERS = ['auto', ...Object.keys(API_MAP)];
    if (provider && !VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    // Auto-routing logic
    if (!provider || provider === 'auto') {
      const size = rawCode.length;
      if (size < 3500 && ['javascript', 'typescript', 'python', 'html', 'css', 'json'].includes(language)) {
        provider = 'mistral';
        model = model || 'codestral-latest';
      } else if (size < 2000) {
        provider = 'groq';
        model = model || 'llama-3.3-70b-versatile';
      } else {
        provider = 'anthropic';
        model = model || 'claude-3-5-sonnet-20240620';
      }
    }

    const target = API_MAP[provider];
    if (!target) {
      return res.status(400).json({ error: `Provider [${provider}] unsupported` });
    }

    const envKey = `${provider.toUpperCase()}_API_KEY`;
    let apiKey = process.env[envKey];

    // Fallback to client-provided key
    if (!apiKey) {
      const clientKey = req.headers['x-provider-key'];
      if (typeof clientKey === 'string' && clientKey.trim()) {
        apiKey = clientKey.trim();
      }
    }

    if (!apiKey) {
      return res.status(401).json({ error: `Missing API key for ${provider}. Please configure it in settings.` });
    }

    // Validate key format before sending to provider
    if (!isValidKeyFormat(provider, apiKey)) {
      return res.status(401).json({ error: `Invalid API key format for ${provider}.` });
    }

    const startTime = Date.now();

    const response = await fetchWithRetry(target.url, {
      method: 'POST',
      headers: target.headers(apiKey),
      body: JSON.stringify(target.getBody(rawCode, language, model || '', temperature, max_tokens)),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Provider ${provider} returned ${response.status}: ${errText}`);
      throw new Error(`Provider API error (${response.status})`);
    }

    const data = await response.json();
    const rawText = String(target.parse(data));
    const analysis = extractJson(rawText);
    const validatedAnalysis = validateAnalysisResult(analysis);
    
    const latency = Date.now() - startTime;
    console.log(`Provider ${provider} took ${latency}ms`);

    return res.json({ ...validatedAnalysis, latency });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Proxy routing failure:', error);
    return res.status(500).json({ error: `Analysis failed: ${msg}` });
  }
});

app.listen(port, () => console.log(`Refract router on port ${port}`));
