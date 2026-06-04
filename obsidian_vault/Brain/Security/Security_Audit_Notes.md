# Security Philosophy

## Mandates
- **Zero-Key Storage**: Server-side storage of user keys is strictly forbidden.
- **Header-Only Transmission**: Client keys are sent via `X-Provider-Key` and never logged.
- **XSS Immunity**: All raw LLM output and fallback code blocks must be HTML-escaped.
- **Input Sanitization**: Client-side character limits (4000) and server-side validation.

## Current Measures
- **CORS**: Restricted to approved origins (configured via `process.env.CORS_ORIGIN`).
- **Rate Limiting**: In-memory IP tracking (10 req/min).
- **Runtime Validation**: Strict schema checking of AI responses to prevent injection or malformed data.
- **Secrets Scanning**: Continuous monitoring for hardcoded keys in the repository.
