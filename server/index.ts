import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { analysisResultSchema } from '../src/lib/schemas.js';

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

function detectPromptInjection(code: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(code));
}

/** 
 * Strip null bytes and dangerous control characters from user input to prevent attacks.
 */
/* eslint-disable no-control-regex */
function sanitizeInput(str: string): string {
  return str
    .replace(/\x00/g, '')            // null bytes
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control chars (keep \t\n\r)
    .trim();
}
/* eslint-enable no-control-regex */

// Enterprise-grade sliding window rate limiter
const rateLimiter = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimiter.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) return false;
  validTimestamps.push(now);
  rateLimiter.set(ip, validTimestamps);
  return true;
}

const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimiter.entries()) {
    if (timestamps.length === 0 || now - timestamps[timestamps.length - 1] > RATE_LIMIT_WINDOW_MS) {
      rateLimiter.delete(ip);
    }
  }
}, 5 * 60 * 1000);

process.on('SIGTERM', () => { clearInterval(cleanupInterval); process.exit(0); });
process.on('SIGINT', () => { clearInterval(cleanupInterval); process.exit(0); });

app.get('/api/config', (_req, res) => {
  res.json({
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    mistral: !!process.env.MISTRAL_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    deepseek: !!process.env.DEEPSEEK_API_KEY,
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const systemPrompt = `You are a senior software engineer performing a precise, helpful code review.
Focus on identifying security vulnerabilities, performance bottlenecks, and structural code quality issues.
Ensure all code snippets provided in the fix are runnable and exact.
Provide step-by-step structural instructions in French for the fix_explanation.`;

/**
 * Intelligent Router targeting 2025/2026 SOTA models.
 */
function routeIntelligent(code: string, language: string, availableKeys: Set<string>): { provider: string, model: string } {
  const size = code.length;
  const isAlgorithmic = ['python', 'rust', 'go', 'cpp', 'java'].includes(language);
  const isWeb = ['javascript', 'typescript', 'html', 'css'].includes(language);
  const hasKey = (p: string) => availableKeys.has(p);

  if (size > 4000 && hasKey('gemini')) return { provider: 'gemini', model: 'gemini-2.5-pro-latest' };
  
  if (isAlgorithmic && size > 1000) {
    if (hasKey('deepseek')) return { provider: 'deepseek', model: 'deepseek-reasoner' };
    if (hasKey('anthropic')) return { provider: 'anthropic', model: 'claude-3-7-sonnet-latest' };
  }

  if (isWeb && size > 1200 && hasKey('anthropic')) return { provider: 'anthropic', model: 'claude-3-7-sonnet-latest' };
  
  if (['javascript', 'typescript', 'python'].includes(language) && hasKey('mistral')) {
    return { provider: 'mistral', model: 'codestral-latest' };
  }

  if (hasKey('groq')) return { provider: 'groq', model: 'llama-3.3-70b-versatile' };
  if (hasKey('gemini')) return { provider: 'gemini', model: 'gemini-2.0-flash' };
  if (hasKey('mistral')) return { provider: 'mistral', model: 'mistral-large-latest' };
  if (hasKey('anthropic')) return { provider: 'anthropic', model: 'claude-3-5-haiku-latest' };
  if (hasKey('deepseek')) return { provider: 'deepseek', model: 'deepseek-chat' };
  
  return { provider: 'gemini', model: 'gemini-2.0-flash' };
}

function selectModelForProvider(provider: string, code: string, isAlgorithmic: boolean): string {
  const isComplex = code.length > 1500 || isAlgorithmic;
  switch (provider) {
    case 'anthropic': return isComplex ? 'claude-3-7-sonnet-latest' : 'claude-3-5-haiku-latest';
    case 'gemini': return code.length > 4000 ? 'gemini-2.5-pro-latest' : (isComplex ? 'gemini-2.0-pro-exp-02-05' : 'gemini-2.0-flash');
    case 'mistral': return isComplex ? 'mistral-large-latest' : 'mistral-small-latest';
    case 'deepseek': return isComplex ? 'deepseek-reasoner' : 'deepseek-chat';
    case 'groq': return isComplex ? 'llama-3.3-70b-versatile' : 'llama-3.1-8b-instant';
    default: return '';
  }
}

app.post('/api/analyze', async (req: express.Request, res: express.Response) => {
  try {
    const ip = req.ip || 'unknown';
    if (!checkRateLimit(ip)) return res.status(429).json({ error: 'Rate limit exceeded' });

    const { code, language } = req.body;
    let { provider, model } = req.body;
    const { temperature, max_tokens } = req.body;

    const rawCode = typeof code === 'string' ? sanitizeInput(code) : '';
    if (!rawCode) return res.status(400).json({ error: 'Code context is empty' });
    if (detectPromptInjection(rawCode)) return res.status(400).json({ error: 'Security policy violation' });

    const availableKeys = new Set<string>();
    let clientKeys: Record<string, string> = {};
    if (typeof req.headers['x-provider-keys'] === 'string') {
      try { clientKeys = JSON.parse(req.headers['x-provider-keys']); } catch { /* ignore */ }
    }

    ['anthropic', 'gemini', 'mistral', 'groq', 'deepseek'].forEach(p => {
      const envKey = `${p.toUpperCase()}_API_KEY`;
      if (process.env[envKey] || (clientKeys[p] && clientKeys[p].trim())) availableKeys.add(p);
    });

    const clientKey = req.headers['x-provider-key'];
    if (provider && provider !== 'auto' && typeof clientKey === 'string' && clientKey.trim()) {
      availableKeys.add(provider);
    }

    const isAlgorithmic = ['python', 'rust', 'go', 'cpp', 'java'].includes(language);

    if (!provider || provider === 'auto') {
      if (availableKeys.size === 0) return res.status(401).json({ error: 'Aucune clé API configurée.' });
      const routed = routeIntelligent(rawCode, language, availableKeys);
      provider = routed.provider;
      model = routed.model;
      console.log(`Intelligent Router selected: ${provider} (${model})`);
    } else if (!model) {
      model = selectModelForProvider(provider, rawCode, isAlgorithmic);
      console.log(`Provider routing selected: ${provider} (${model})`);
    }

    let apiKey = process.env[`${provider.toUpperCase()}_API_KEY`] || clientKeys[provider];
    if (!apiKey && typeof clientKey === 'string' && clientKey.trim()) apiKey = clientKey.trim();
    if (!apiKey) return res.status(401).json({ error: `Missing API key for ${provider}.` });

    const startTime = Date.now();

    // Vercel AI SDK Provider instances
    // We use createOpenAI for OpenAI compatible endpoints (Mistral, Groq, DeepSeek)
    let aiModel;
    switch (provider) {
      case 'anthropic':
        aiModel = createAnthropic({ apiKey })(model);
        break;
      case 'gemini':
        aiModel = createGoogleGenerativeAI({ apiKey })(model);
        break;
      case 'mistral':
        aiModel = createOpenAI({ baseURL: 'https://api.mistral.ai/v1', apiKey })(model);
        break;
      case 'groq':
        aiModel = createOpenAI({ baseURL: 'https://api.groq.com/openai/v1', apiKey })(model);
        break;
      case 'deepseek':
        aiModel = createOpenAI({ baseURL: 'https://api.deepseek.com/v1', apiKey })(model);
        break;
      default:
        return res.status(400).json({ error: `Provider [${provider}] unsupported` });
    }

    // This handles the prompt and guarantees structured JSON output via Zod Schema
    const { object } = await generateObject({
      model: aiModel,
      schema: analysisResultSchema,
      system: systemPrompt,
      prompt: `Analyze this ${language} code:\n\n${rawCode}`,
      temperature: temperature ?? 0.1,
      maxTokens: max_tokens ?? 2048,
    });
    
    return res.json({ ...object, latency: Date.now() - startTime, routed: { provider, model } });
  } catch (error: unknown) {
    console.error('Analysis error:', error);
    // Extract actual message from AI SDK error or standard error
    const msg = error instanceof Error ? error.message : 'Unknown error occurred during AI processing';
    return res.status(500).json({ error: msg });
  }
});

app.listen(port, () => console.log(`Refract SOTA router on port ${port}`));
