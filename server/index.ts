import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import type { AnalysisResult } from '../src/types/analysis.js';
import { LANGUAGES } from '../src/lib/constants.js';

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));

// Simple in-memory rate limiter (10 req/min per IP)
const rateLimiter = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimiter.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);

  if (recent.length >= RATE_LIMIT_MAX) return false;

  recent.push(now);
  rateLimiter.set(ip, recent);
  return true;
}

// Cleanup stale rate limiter entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimiter.entries()) {
    const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
    if (recent.length === 0) rateLimiter.delete(ip);
    else rateLimiter.set(ip, recent);
  }
}, 5 * 60 * 1000);

// Config endpoint to tell frontend which keys are available server-side
app.get('/api/config', (req, res) => {
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
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const systemPrompt = `You are a senior software engineer performing a precise code review.
Respond ONLY with a valid JSON object. No markdown. No explanation outside JSON. No preamble.

Schema:
{
  "score": number,
  "complexity": "low" | "medium" | "high" | "critical",
  "summary": string,
  "issues": [{"severity": "bug" | "warning" | "suggestion", "title": string, "description": string, "line": number | null, "fix": string | null}],
  "strengths": string[]
}

Rules:
- Never hallucinate line numbers. Only cite lines you can count.
- If code is excellent, score 90+ and say so clearly.
- Fix snippets must be working code, not pseudocode.
- Be direct. No "consider" or "you might want to". State facts.
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
  getBody: (code: string, lang: string, model: string) => unknown;
  parse: (res: unknown) => string;
};

const API_MAP: Record<string, ProviderConfig> = {
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }),
    getBody: (code, lang, model) => ({
      model: model || 'llama-3.3-70b-versatile',
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
    getBody: (code, lang, model) => ({
      model: model || (['javascript', 'typescript', 'python', 'html', 'css', 'json'].includes(lang) ? 'codestral-latest' : 'mistral-large-latest'),
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
    getBody: (code, lang, model) => ({
      model: model || 'deepseek-chat',
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
    getBody: (code, lang, model) => ({
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Analyze this ${lang} code:\n\n${code}` }],
    }),
    parse: (res: unknown) => (res as AnthropicResponse).content[0].text,
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',
    headers: (key) => ({ 'Content-Type': 'application/json', 'x-goog-api-key': key }),
    getBody: (code, lang) => ({
      contents: [{ parts: [{ text: `${systemPrompt}\n\nAnalyze this ${lang} code:\n\n${code}` }] }],
      generationConfig: { responseMimeType: 'application/json' },
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

function validateAnalysisResult(data: any): AnalysisResult {
  if (typeof data !== 'object' || data === null) throw new Error('Result must be an object');
  if (typeof data.score !== 'number') throw new Error('score must be a number');
  if (!['low', 'medium', 'high', 'critical'].includes(data.complexity)) throw new Error('invalid complexity');
  if (typeof data.summary !== 'string') throw new Error('summary must be a string');
  if (!Array.isArray(data.issues)) throw new Error('issues must be an array');
  if (!Array.isArray(data.strengths) || !data.strengths.every((s: any) => typeof s === 'string')) throw new Error('strengths must be an array of strings');
  
  data.issues.forEach((issue: any, i: number) => {
    if (!['bug', 'warning', 'suggestion'].includes(issue.severity)) throw new Error(`issues[${i}].severity is invalid`);
    if (typeof issue.title !== 'string') throw new Error(`issues[${i}].title must be a string`);
    if (typeof issue.description !== 'string') throw new Error(`issues[${i}].description must be a string`);
    if (issue.line !== null && typeof issue.line !== 'number') throw new Error(`issues[${i}].line must be number or null`);
    if (issue.fix !== null && typeof issue.fix !== 'string') throw new Error(`issues[${i}].fix must be string or null`);
  });
  
  return data as AnalysisResult;
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

    let { code, language, provider, model } = req.body as {
      code: string;
      language: string;
      provider: string;
      model?: string;
    };

    if (!code?.trim()) {
      return res.status(400).json({ error: 'Code context is empty' });
    }

    if (code.length > 4000) {
      return res.status(400).json({ error: 'Code exceeds 4000 character limit' });
    }

    const VALID_LANGS = LANGUAGES;
    if (!VALID_LANGS.includes(language)) {
      return res.status(400).json({ error: 'Invalid language' });
    }

    const VALID_PROVIDERS = ['auto', ...Object.keys(API_MAP)];
    if (provider && !VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    // Auto-routing logic
    if (!provider || provider === 'auto') {
      const size = code.length;
      if (size < 3500 && ['javascript', 'typescript', 'python', 'html', 'css', 'json'].includes(language)) {
        provider = 'mistral';
        model = model || 'codestral-latest';
      } else if (size < 2000) {
        provider = 'groq';
        model = model || 'llama-3.3-70b-versatile';
      } else {
        provider = 'anthropic';
        model = model || 'claude-sonnet-4-20250514';
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

    const startTime = Date.now();
    
    const response = await fetchWithRetry(target.url, {
      method: 'POST',
      headers: target.headers(apiKey),
      body: JSON.stringify(target.getBody(code, language, model || '')),
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
    
    console.log(`Provider ${provider} took ${Date.now() - startTime}ms`);

    return res.json(validatedAnalysis);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Proxy routing failure:', msg);
    return res.status(500).json({ error: 'Failed to process AI payload', details: msg });
  }
});

app.listen(port, () => console.log(`Refract router on port ${port}`));