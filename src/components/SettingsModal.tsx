import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Key, Sliders, Keyboard, CheckCircle, AlertTriangle } from 'lucide-react';
import { PROVIDERS } from '../lib/constants';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const focusTrapRef = useFocusTrap<HTMLDivElement>(open, onClose);

  const [serverConfig, setServerConfig] = useState<Record<string, boolean>>({});
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [temperature, setTemperature] = useState<number>(0.1);
  const [maxTokens, setMaxTokens] = useState<number>(2000);
  const [loading, setLoading] = useState<boolean>(true);

  // Load configuration and server config on open
  useEffect(() => {
    if (!open) return;

    setLoading(true);
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        setServerConfig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Load locally saved keys
    const savedKeys = localStorage.getItem('rf_api_keys');
    if (savedKeys) {
      try {
        setKeys(JSON.parse(savedKeys));
      } catch (e) {
        console.error('Failed to parse rf_api_keys:', e);
      }
    } else {
      setKeys({});
    }

    // Load advanced settings
    const savedTemp = localStorage.getItem('rf_temperature');
    if (savedTemp) setTemperature(parseFloat(savedTemp));

    const savedTokens = localStorage.getItem('rf_max_tokens');
    if (savedTokens) setMaxTokens(parseInt(savedTokens, 10));
  }, [open]);

  const handleKeyChange = (provider: string, value: string) => {
    setKeys((prev) => {
      const next = { ...prev, [provider]: value };
      if (!value) delete next[provider];
      return next;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('rf_api_keys', JSON.stringify(keys));
    localStorage.setItem('rf_temperature', temperature.toString());
    localStorage.setItem('rf_max_tokens', maxTokens.toString());
    onClose();

    // Notify components that settings were updated
    window.dispatchEvent(new Event('rf_settings_updated'));
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop Fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[80]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[90] pointer-events-none">
            <motion.div
              ref={focusTrapRef}
              role="dialog"
              aria-modal="true"
              aria-label="Application Settings"
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="pointer-events-auto w-full max-w-[500px] max-h-[85vh] bg-[var(--rf-depth)] border border-[var(--rf-border)] rounded-lg flex flex-col overflow-hidden shadow-2xl"
            >
              {/* FIXED HEADER */}
              <div className="h-12 px-4 border-b border-[var(--rf-border)] bg-[var(--rf-void)] flex items-center justify-between shrink-0 select-none">
                <div className="flex items-center gap-2 text-[var(--rf-volt)]">
                  <Sliders size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest font-mono">
                    TERMINAL // CONFIGURATION
                  </span>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close settings"
                  className="p-1.5 hover:bg-[var(--rf-forest)] rounded transition-colors text-[var(--rf-mist)]/50 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* SCROLLABLE CONTENT BODY */}
              <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-5 space-y-6 diff-scrollbar bg-[var(--rf-depth)]">
                  
                  {/* Banner Info */}
                  <div className="bg-[var(--rf-forest)] p-3 rounded-lg flex gap-3 text-xs text-[var(--rf-mist)] border border-[var(--rf-border)] select-none">
                    <AlertTriangle className="text-[var(--rf-warn)] shrink-0 animate-pulse" size={16} />
                    <p className="leading-relaxed">
                      Provide your own API keys below. They are saved securely in your browser's local storage and sent only to the Refract proxy.
                    </p>
                  </div>

                  {/* Section: API Keys */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[var(--rf-mist)]/50 border-b border-[var(--rf-border)] pb-1.5 select-none">
                      <Key size={12} />
                      <h3 className="text-[10px] font-mono uppercase tracking-wider font-bold">API Credentials (BYOK)</h3>
                    </div>
                    
                    {loading ? (
                      <div className="animate-pulse flex items-center justify-center h-20 text-[var(--rf-mist)]/40 text-xs font-mono">
                        Configuring server parameters...
                      </div>
                    ) : (
                      PROVIDERS.filter((p) => p.value !== 'auto').map((p) => {
                        const Icon = p.icon;
                        const isServerConfigured = serverConfig[p.value];
                        
                        return (
                          <div key={p.value} className="flex flex-col gap-1.5">
                            <label htmlFor={`key-${p.value}`} className="flex items-center justify-between text-[10px] font-mono text-[var(--rf-mist)]/60 capitalize">
                              <span className="flex items-center gap-1.5">
                                <Icon className="w-3.5 h-3.5 text-[var(--rf-sky)]" />
                                {p.label} API Key
                              </span>
                              {isServerConfigured && (
                                <span className="flex items-center gap-1 text-[var(--rf-volt)] text-[9px] uppercase tracking-wider font-semibold">
                                  <CheckCircle size={10} /> Active on server
                                </span>
                              )}
                            </label>
                            <input
                              id={`key-${p.value}`}
                              type="password"
                              autoComplete="off"
                              placeholder={isServerConfigured ? 'Using server config (Override optional)' : `Enter ${p.label} API Key`}
                              value={keys[p.value] || ''}
                              onChange={(e) => handleKeyChange(p.value, e.target.value)}
                              className="w-full bg-[var(--rf-forest)] border border-[var(--rf-border)] rounded-[6px] px-3 py-1.5 text-xs font-mono text-white placeholder-[var(--rf-mist)]/20 focus:outline-none focus:border-[var(--rf-volt)]/50 focus:ring-1 focus:ring-[var(--rf-volt)]/50 transition-colors"
                            />
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Section: Model Parameters */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[var(--rf-mist)]/50 border-b border-[var(--rf-border)] pb-1.5 select-none">
                      <Sliders size={12} />
                      <h3 className="text-[10px] font-mono uppercase tracking-wider font-bold">Hyperparameters</h3>
                    </div>

                    {/* Temperature Slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-mono text-[10px] select-none">
                        <span className="text-[var(--rf-mist)]/60">Temperature: <strong className="text-[var(--rf-volt)]">{temperature.toFixed(1)}</strong></span>
                        <span className="text-[var(--rf-border)]">Precise ↔ Creative</span>
                      </div>
                      <input
                        type="range"
                        min="0.0"
                        max="1.0"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full h-1 bg-[var(--rf-forest)] rounded-lg appearance-none cursor-pointer accent-[var(--rf-volt)] border border-[var(--rf-border)]"
                      />
                    </div>

                    {/* Max Tokens Slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-mono text-[10px] select-none">
                        <span className="text-[var(--rf-mist)]/60">Max Response Tokens: <strong className="text-[var(--rf-sky)]">{maxTokens}</strong></span>
                      </div>
                      <input
                        type="range"
                        min="256"
                        max="4096"
                        step="128"
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                        className="w-full h-1 bg-[var(--rf-forest)] rounded-lg appearance-none cursor-pointer accent-[var(--rf-sky)] border border-[var(--rf-border)]"
                      />
                    </div>
                  </div>

                  {/* Section: Keyboard Shortcuts */}
                  <div className="space-y-2 select-none">
                    <div className="flex items-center gap-2 text-[var(--rf-mist)]/50 border-b border-[var(--rf-border)] pb-1.5">
                      <Keyboard size={12} />
                      <h3 className="text-[10px] font-mono uppercase tracking-wider font-bold">System Bindings</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {[
                        { key: 'Ctrl + Enter', desc: 'Execute Analysis' },
                        { key: 'Ctrl + H', desc: 'Toggle History' },
                        { key: 'Ctrl + F', desc: 'Toggle Focus Mode' },
                        { key: 'Ctrl + ,', desc: 'System Configuration' },
                      ].map((shortcut, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-[6px] border border-[var(--rf-border)] bg-[rgba(8,11,15,0.2)] font-mono text-[10px]">
                          <span className="text-[var(--rf-mist)]/40">{shortcut.desc}</span>
                          <kbd className="bg-[var(--rf-forest)] border border-[var(--rf-border)] px-1.5 py-0.5 rounded text-[9px] text-[var(--rf-volt)] font-semibold">
                            {shortcut.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* FIXED FOOTER ACTIONS */}
                <div className="h-14 px-4 border-t border-[var(--rf-border)] bg-[var(--rf-void)] flex items-center justify-end gap-2 shrink-0 select-none">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-1.5 rounded-[6px] border border-[var(--rf-border)] text-xs font-mono font-medium text-[var(--rf-mist)]/60 hover:text-white hover:bg-[var(--rf-forest)] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-1.5 rounded-[6px] bg-[var(--rf-volt)] text-[var(--rf-void)] text-xs font-mono font-bold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Save size={13} />
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
