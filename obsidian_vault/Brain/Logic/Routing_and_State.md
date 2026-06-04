# Logic & Routing

## Auto-Routing Algorithm
The auto-router selects the optimal model based on:
1. **Language**: `codestral-latest` (Mistral) for code-heavy tasks.
2. **Context Size**: Fast models (Groq) for small snippets, powerful models (Claude) for large ones.
3. **Availability**: Fallback chain for transient errors.

## State Management
- **URL Hash Sync**: real-time encoding of code/lang in `atob(json)` hash for deep linking.
- **Onboarding Persistence**: `rf_onboarding_seen` flag in LocalStorage.
- **Key Persistence**: `rf_api_keys` map in LocalStorage.
