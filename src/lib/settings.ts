import { settingsSchema, type Settings } from '../types/schemas';

const SETTINGS_KEY = 'rf_settings';

// Legacy keys for migration
const LEGACY_TEMPERATURE = 'rf_temperature';
const LEGACY_MAX_TOKENS = 'rf_max_tokens';

/**
 * Loads and validates application settings from localStorage.
 * Includes a migration path from legacy individual keys.
 */
export function loadSettings(): Settings {
  const saved = localStorage.getItem(SETTINGS_KEY);
  let baseSettings: Partial<Settings> = {};

  if (saved) {
    try {
      baseSettings = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse settings:', e);
    }
  } else {
    // Migration from legacy keys
    const temp = localStorage.getItem(LEGACY_TEMPERATURE);
    const tokens = localStorage.getItem(LEGACY_MAX_TOKENS);
    if (temp) baseSettings.temperature = parseFloat(temp);
    if (tokens) baseSettings.maxTokens = parseInt(tokens, 10);
  }

  return settingsSchema.parse(baseSettings);
}

/**
 * Validates and saves application settings to localStorage.
 */
export function saveSettings(settings: Partial<Settings>): Settings {
  const current = loadSettings();
  const updated = settingsSchema.parse({ ...current, ...settings });
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  
  // Also sync to legacy keys for backward compatibility with server if needed
  localStorage.setItem(LEGACY_TEMPERATURE, updated.temperature.toString());
  localStorage.setItem(LEGACY_MAX_TOKENS, updated.maxTokens.toString());
  
  return updated;
}
