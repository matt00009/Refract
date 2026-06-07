import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { generateObject, streamObject, NoSuchModelError, APICallError } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { createGroq } from '@ai-sdk/groq';
import { analysisResultSchema, type ErrorResponse } from '../src/lib/schemas.js';
import { z } from 'zod';

const app = express();
const port = 3001;

const analyzeRequestSchema = z.object({
  code: z.string(),
  language: z.string(),
  provider: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
});

// ── Security Headers (Helmet) ───────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Handled by Vite in dev
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json({ limit: '1mb' })); // Increased for large SOTA context windows
app.use(cors({ 
  origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : ['http://localhost:5173', 'http://localhost:5174'] 
}));

// ── Prompt Injection Guard ──────────────────────────────────
/* eslint-disable no-control-regex */
const INJECTION_PATTERNS = [
  /ignore\s+previous\s+instructions/i,
  /system\s+override/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /\[INST\]/i,
  /<<SYS>>/i,
  /forget\s+(all|everything|previous)/i,
  /new\s+role/i,
  /you\s+are\s+now/i,
  /act\s+as/i,
  /stop\s+being/i,
  /reveal\s+(your|system)\s+prompt/i,
  /translate\s+this/i,
  /echo\s+back/i,
  /---/, // Markdown horizontal rule often used to break context
  /\*\*\*/,
  /\x1b/i, // ANSI escape sequences
  /\u001b/i,
  /user\s+:\s+/i,
  /assistant\s+:\s+/i,
  /system\s+:\s+/i,
];

function detectPromptInjection(code: string): boolean {
  // Check for typical injection patterns
  if (INJECTION_PATTERNS.some((p) => p.test(code))) return true;

  // Check for XML tag closure attempts if we use <user_code>
  if (code.includes('</user_code>')) return true;

  return false;
}

/** 
 * Strip null bytes and dangerous control characters from user input to prevent attacks.
 */
function sanitizeInput(str: string): string {
  return str
    .replace(/\x00/g, '')            // null bytes
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control chars (keep \t\n\r)
    .trim();
}
/* eslint-enable no-control-regex */

const promptInjectionGuard = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.method !== 'POST' || !req.body || !req.body.code) return next();
  
  const rawCode = sanitizeInput(req.body.code);
  if (detectPromptInjection(rawCode)) {
    console.warn(`[SECURITY] Prompt injection blocked from IP: ${req.ip}`);
    return res.status(400).json({ 
      error: 'Security policy violation: Potential prompt injection detected.',
      code: 'INVALID_REQUEST',
      status: 400 
    });
  }
  next();
};

// Enterprise-grade sliding window rate limiter
const rateLimiter = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(ip: string): { allowed: boolean, remaining: number } {
  const now = Date.now();
  const timestamps = rateLimiter.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }
  
  validTimestamps.push(now);
  rateLimiter.set(ip, validTimestamps);
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - validTimestamps.length };
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

// ── Error Handling Helpers ─────────────────────────────────
function handleApiError(error: unknown, res: express.Response) {
  // Redact potentially sensitive info from logs
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error(`[API Error] ${errorMessage}`);
  
  let errorResponse: ErrorResponse;

  if (NoSuchModelError.isInstance(error)) {
    errorResponse = {
      error: `Le modèle [${error.modelId}] est introuvable pour ce fournisseur.`,
      code: 'MODEL_NOT_FOUND',
      status: 404,
      timestamp: new Date().toISOString()
    };
  } else if (APICallError.isInstance(error)) {
    errorResponse = {
      error: 'Erreur de communication avec le fournisseur AI.',
      code: 'PROVIDER_ERROR',
      status: error.statusCode ?? 502,
      details: errorMessage,
      timestamp: new Date().toISOString()
    };
  } else if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
    errorResponse = {
      error: 'La requête a expiré (limite de 30s dépassée).',
      code: 'TIMEOUT',
      status: 504,
      timestamp: new Date().toISOString()
    };
  } else {
    const status = (error as { status?: number })?.status || 500;
    errorResponse = {
      error: errorMessage,
      code: 'INTERNAL_ERROR',
      status,
      timestamp: new Date().toISOString()
    };
  }

  return res.status(errorResponse.status).json(errorResponse);
}

// ── Provider Selection Helpers ──────────────────────────────
interface AIModelConfig {
  provider: string;
  model: string;
  apiKey: string;
}

function resolveProviderConfig(req: express.Request): AIModelConfig {
  const { code, language } = req.body;
  let { provider, model } = req.body;
  const rawCode = sanitizeInput(code);

  const availableKeys = new Set<string>();
  let clientKeys: Record<string, string> = {};
  
  const clientKeysHeader = req.headers['x-provider-keys'];
  if (typeof clientKeysHeader === 'string') {
    try { clientKeys = JSON.parse(clientKeysHeader); } catch { /* ignore */ }
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
    if (availableKeys.size === 0) {
      const err = new Error('Aucune clé API configurée.') as Error & { status?: number };
      err.status = 401;
      throw err;
    }
    const routed = routeIntelligent(rawCode, language, availableKeys);
    provider = routed.provider;
    model = routed.model;
    console.log(`Intelligent Router selected: ${provider} (${model})`);
  } else if (!model) {
    model = selectModelForProvider(provider, rawCode, isAlgorithmic);
    console.log(`Provider routing selected: ${provider} (${model})`);
  }

  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`] || clientKeys[provider] || (typeof clientKey === 'string' ? clientKey.trim() : '');
  if (!apiKey) {
    const err = new Error(`Missing API key for ${provider}.`) as Error & { status?: number };
    err.status = 401;
    throw err;
  }

  return { provider, model, apiKey };
}

function getModelInstance(config: AIModelConfig) {
  const { provider, model, apiKey } = config;
  switch (provider) {
    case 'anthropic':
      return createAnthropic({ apiKey })(model);
    case 'gemini':
      return createGoogleGenerativeAI({ apiKey })(model);
    case 'mistral':
      return createMistral({ apiKey })(model);
    case 'groq':
      return createGroq({ apiKey })(model);
    case 'deepseek':
      return createOpenAI({ baseURL: 'https://api.deepseek.com/v1', apiKey })(model);
    default:
      const err = new Error(`Provider [${provider}] unsupported`) as Error & { status?: number };
      err.status = 400;
      throw err;
  }
}


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

STRICT FIELD RULES:
- "vulnerable_code": ONLY raw bad code lines. NO prose, NO markdown blocks.
- "fix_code": ONLY raw fixed code lines. NO prose, NO markdown blocks.
- "fix_explanation": Step-by-step resolution steps in French. NO markdown code blocks, NO backticks. Focus on the "how" and "why".
- "description": General context about the issue.

IMPORTANT: You MUST use "bug", "warning", or "suggestion" for severity.
LIBERTY: You are encouraged to provide "insights" (architectural philosophy, meta-analysis) and you may add custom fields to the JSON if you find something exceptionally interesting.`;

/**
 * Intelligent Router targeting 2026 SOTA models.
 * Heuristics balanced between Context Window, Reasoning Depth, and Latency.
 */
function routeIntelligent(code: string, language: string, availableKeys: Set<string>): { provider: string, model: string } {
  const size = code.length;
  const isAlgorithmic = ['python', 'rust', 'go', 'cpp', 'java'].includes(language);
  const isWeb = ['javascript', 'typescript', 'html', 'css', 'jsx', 'tsx'].includes(language);
  const isConfig = ['json', 'yaml', 'toml', 'dockerfile'].includes(language);
  const hasKey = (p: string) => availableKeys.has(p);

  // 1. MASSIVE CONTEXT TIER (Gemini 2.5 Pro)
  if (size > 20000 && hasKey('gemini')) {
    return { provider: 'gemini', model: 'gemini-2.5-pro-latest' };
  }
  
  // 2. ELITE REASONING TIER (Claude 4.6 Sonnet or DeepSeek Reasoner)
  if (isAlgorithmic && size > 1500) {
    if (hasKey('anthropic')) return { provider: 'anthropic', model: 'claude-4-6-sonnet-latest' };
    if (hasKey('deepseek')) return { provider: 'deepseek', model: 'deepseek-reasoner' };
  }

  // 3. UI/UX & WEB ARCHITECTURE TIER (Claude 4.6 Sonnet)
  if (isWeb && size > 2000 && hasKey('anthropic')) {
    return { provider: 'anthropic', model: 'claude-4-6-sonnet-latest' };
  }
  
  // 4. SPEED-FIRST TIER (Groq Llama 3.3)
  if (hasKey('groq') && (size < 1200 || isConfig)) {
    return { provider: 'groq', model: 'llama-3.3-70b-versatile' };
  }

  // 5. CODING SPECIALIST TIER (Codestral)
  if (hasKey('mistral') && isAlgorithmic) {
    return { provider: 'mistral', model: 'codestral-latest' };
  }

  // 6. VERSATILE HIGH-QUALITY TIER (Mistral Large)
  if (hasKey('mistral')) {
    return { provider: 'mistral', model: 'mistral-large-latest' };
  }

  // 7. INTELLIGENT FLASH TIER (Gemini 2.0 Flash)
  if (hasKey('gemini')) return { provider: 'gemini', model: 'gemini-2.0-flash' };

  // 8. FALLBACKS
  if (hasKey('groq')) return { provider: 'groq', model: 'llama-3.3-70b-versatile' };
  if (hasKey('anthropic')) return { provider: 'anthropic', model: 'claude-4-5-haiku-latest' };

  return { provider: 'gemini', model: 'gemini-2.0-flash' };
}

function selectModelForProvider(provider: string, code: string, isAlgorithmic: boolean): string {
  const isComplex = code.length > 1500 || isAlgorithmic;
  switch (provider) {
    case 'anthropic': return isComplex ? 'claude-4-6-sonnet-latest' : 'claude-4-5-haiku-latest';
    case 'gemini': return code.length > 4000 ? 'gemini-2.5-pro-latest' : (isComplex ? 'gemini-2.0-pro-exp-02-05' : 'gemini-2.0-flash');
    case 'mistral': return isComplex ? 'mistral-large-latest' : 'mistral-small-latest';
    case 'deepseek': return isComplex ? 'deepseek-reasoner' : 'deepseek-chat';
    case 'groq': return isComplex ? 'llama-3.3-70b-versatile' : 'llama-3.1-8b-instant';
    default: return '';
  }
}

app.post('/api/analyze', promptInjectionGuard, async (req: express.Request, res: express.Response) => {
  try {
    const ip = req.ip || 'unknown';
    const { allowed, remaining } = checkRateLimit(ip);
    
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    
    if (!allowed) return res.status(429).json({ error: 'Rate limit exceeded' });

    const bodyParse = analyzeRequestSchema.safeParse(req.body);
    if (!bodyParse.success) {
      return res.status(400).json({ error: 'Invalid request body', details: bodyParse.error.format() });
    }

    const { code, language, temperature } = bodyParse.data;
    const rawCode = sanitizeInput(code);
    if (!rawCode) return res.status(400).json({ error: 'Code context is empty' });

    // ── Diagnostic Mode ───────────────────────────────────────
    if (req.headers['x-diagnostic-test']) {
      return res.json({
        score: 100,
        complexity: 'low',
        summary: 'Diagnostic test active. Routing logic bypassed.',
        issues: [],
        strengths: ['E2E Testing'],
        latency: 0,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
      });
    }

    // Resolve configuration and create model instance
    const config = resolveProviderConfig(req);
    const aiModel = getModelInstance(config);

    const startTime = Date.now();

    // This handles the prompt and guarantees structured JSON output via Zod Schema
    const { object, usage } = await generateObject({
      model: aiModel,
      schema: analysisResultSchema,
      mode: (config.provider === 'groq' || config.provider === 'mistral') ? 'json' : undefined,
      system: systemPrompt,
      prompt: `Analyze the following ${language} code.

<user_code>
${rawCode}
</user_code>`,
      temperature: temperature ?? 0.1,
      maxRetries: 3,
      abortSignal: AbortSignal.timeout(30000), // 30s strict timeout
    });

    const latency = Date.now() - startTime;
    console.log(`[${config.provider}/${config.model}] Analysis complete in ${latency}ms. Tokens: ${usage.totalTokens}`);

    // ── Post-processing: Clean prose from code blocks ──
    if (object.issues) {
      object.issues.forEach((issue) => {
        if (issue.fix_explanation) {
          // Remove markdown code blocks and backticks from prose
          issue.fix_explanation = issue.fix_explanation
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`/g, '')
            .trim();
        }
      });
    }
    
    return res.json({ 
      ...object, 
      latency, 
      routed: { provider: config.provider, model: config.model },
      usage: {
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens
      }
    });
  } catch (error: unknown) {
    return handleApiError(error, res);
  }
});

/**
 * EXPERIMENTAL: Streaming analysis for enhanced UX.
 */
app.post('/api/analyze-stream', async (req: express.Request, res: express.Response) => {
  try {
    const ip = req.ip || 'unknown';
    const { allowed, remaining } = checkRateLimit(ip);
    
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    
    if (!allowed) return res.status(429).json({ error: 'Rate limit exceeded' });

    const bodyParse = analyzeRequestSchema.safeParse(req.body);
    if (!bodyParse.success) return res.status(400).json({ error: 'Invalid body' });

    const { code, language, temperature, max_tokens } = bodyParse.data;
    const rawCode = sanitizeInput(code);
    if (!rawCode) return res.status(400).json({ error: 'Code context is empty' });

    // Resolve configuration and create model instance
    const config = resolveProviderConfig(req);
    const aiModel = getModelInstance(config);

    const result = await streamObject({
      model: aiModel,
      schema: analysisResultSchema,
      system: systemPrompt,
      prompt: `Analyze the following ${language} code.

<user_code>
${rawCode}
</user_code>`,
      temperature: temperature ?? 0.1,
      maxTokens: max_tokens ?? 2048,
      maxRetries: 2,
      abortSignal: AbortSignal.timeout(45000), // Slightly longer for streaming
    });

    return result.pipeTextStreamToResponse(res);
  } catch (error) {
    return handleApiError(error, res);
  }
});

function startServer(retries = 5, delay = 1000) {
  const server = app.listen(port, () => {
    console.log(`Refract SOTA router on port ${port}`);
  });

  server.on('error', (error: Error & { code?: string }) => {
    if (error.code === 'EADDRINUSE') {
      if (retries > 0) {
        console.warn(`Port ${port} is in use, retrying in ${delay}ms... (${retries} retries left)`);
        setTimeout(() => {
          server.close();
          startServer(retries - 1, delay);
        }, delay);
      } else {
        console.error(`Port ${port} is busy. Failed after maximum retries.`);
        process.exit(1);
      }
    } else {
      console.error('Server error:', error);
    }
  });
}

startServer();
