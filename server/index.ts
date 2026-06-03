import 'dotenv/config';
import express from 'express';
import cors from 'cors';

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
    parse: (res: any) => res.choices[0].message.content,
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
    parse: (res: any) => res.choices[0].message.content,
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
    parse: (res: any) => res.choices[0].message.content,
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
    parse: (res: any) => res.content[0].text,
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',
    headers: (key) => ({ 'Content-Type': 'application/json', 'x-goog-api-key': key }),
    getBody: (code, lang) => ({
      contents: [{ parts: [{ text: `${systemPrompt}\n\nAnalyze this ${lang} code:\n\n${code}` }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
    parse: (res: any) => res.candidates[0].content.parts[0].text,
  },
};

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('No JSON object found in response');
  return JSON.parse(trimmed.substring(first, last + 1));
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

    const VALID_LANGS = [
      'auto',
      'javascript',
      'typescript',
      'python',
      'go',
      'rust',
      'php',
      'java',
      'html',
      'css',
      'json',
      'sql',
    ];
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
    const apiKey = process.env[envKey];
    if (!apiKey) {
      return res.status(500).json({ error: `Missing API key: ${envKey}` });
    }

    const response = await fetch(target.url, {
      method: 'POST',
      headers: target.headers(apiKey),
      body: JSON.stringify(target.getBody(code, language, model || '')),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Provider ${provider} returned ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const rawText = String(target.parse(data));
    const analysis = extractJson(rawText);

    return res.json(analysis);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Proxy routing failure:', msg);
    return res.status(500).json({ error: 'Failed to process AI payload', details: msg });
  }
});

app.listen(port, () => console.log(`Refract router on port ${port}`));
