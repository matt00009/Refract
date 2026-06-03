import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const systemPrompt = `You are a senior software engineer performing a precise code review.
Respond ONLY with a valid JSON object. No markdown. No explanation outside JSON. No preamble.

Schema:
{
  "score": number,          // 0-100 quality score
  "complexity": "low" | "medium" | "high" | "critical",
  "summary": string,        // max 100 chars, direct, no fluff
  "issues": [
    {
      "severity": "bug" | "warning" | "suggestion",
      "title": string,      // max 60 chars
      "description": string,// 1-2 sentences
      "line": number | null,
      "fix": string | null  // code snippet fixing the issue
    }
  ],                        // max 8 issues
  "strengths": string[]     // 2-3 items, genuine positives only
}

Rules:
- Never hallucinate line numbers. Only cite lines you can count.
- If code is excellent, score 90+ and say so clearly.
- Fix snippets must be working code, not pseudocode.
- Be direct. No "consider" or "you might want to". State facts.`;

interface AnalyzeRequest {
  code: string;
  language: string;
}

app.post('/api/analyze', async (req: express.Request<{}, {}, AnalyzeRequest>, res: express.Response) => {
  try {
    const { code, language } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const userMessage = `Analyze this ${language || 'code'}:\n\n${code}`;

    let analysisText = '';

    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
        system: systemPrompt,
      });

      if (message.content[0].type === 'text') {
        analysisText = message.content[0].text;
      }
    } catch (apiError) {
      console.error('Claude API error:', apiError);
      return res.status(500).json({ error: 'Claude API failed' });
    }

    let analysis;
    let parseAttempts = 0;
    const maxParseAttempts = 1;

    while (parseAttempts <= maxParseAttempts) {
      try {
        analysis = JSON.parse(analysisText);
        break;
      } catch {
        parseAttempts++;
        if (parseAttempts > maxParseAttempts) {
          return res.status(400).json({ error: 'parse_failed' });
        }
      }
    }

    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Refract server running on http://localhost:${port}`);
});
