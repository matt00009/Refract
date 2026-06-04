import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, CheckCircle, AlertTriangle } from 'lucide-react';
import { PROVIDERS } from '../lib/constants';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [serverConfig, setServerConfig] = useState<Record<string, boolean>>({});
  const [localKeys, setLocalKeys] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      // Fetch which keys are configured on the server
      fetch('/api/config')
        .then((res) => res.json())
        .then((data) => {
          setServerConfig(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));

      // Load locally saved keys
      const saved = localStorage.getItem('rf_api_keys');
      if (saved) {
        try {
          setLocalKeys(JSON.parse(saved));
        } catch {
          // ignore
        }
      }
    }
  }, [open]);

  const handleKeyChange = (provider: string, val: string) => {
    const newKeys = { ...localKeys, [provider]: val };
    if (!val) delete newKeys[provider];
    
    setLocalKeys(newKeys);
    localStorage.setItem('rf_api_keys', JSON.stringify(newKeys));
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-[var(--rf-depth)] border border-[var(--rf-border)] rounded-[12px] w-full max-w-md shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--rf-border)]">
                <div className="flex items-center gap-2 text-[var(--rf-volt)]">
                  <Key size={18} />
                  <h2 className="font-bold tracking-tight">API Providers</h2>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-[var(--rf-forest)] rounded-md transition-colors text-[var(--rf-mist)] hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="bg-[var(--rf-forest)] p-3 rounded-lg flex gap-3 text-sm text-[var(--rf-mist)] border border-[var(--rf-border)]">
                  <AlertTriangle className="text-[var(--rf-warn)] shrink-0" size={18} />
                  <p>
                    Provide your own API keys below. They are saved securely in your browser's local storage and sent only to the Refract proxy.
                  </p>
                </div>

                <div className="space-y-4 mt-6">
                  {loading ? (
                    <div className="animate-pulse flex gap-4 items-center justify-center h-20 text-[var(--rf-border)]">
                      Loading server config...
                    </div>
                  ) : (
                    PROVIDERS.filter((p) => p.value !== 'auto').map((p) => {
                      const Icon = p.icon;
                      const isServerConfigured = serverConfig[p.value];
                      
                      return (
                        <div key={p.value} className="flex flex-col gap-1.5">
                          <label className="flex items-center justify-between text-xs font-medium text-[var(--rf-mist)]">
                            <span className="flex items-center gap-1.5">
                              <Icon className="w-3.5 h-3.5" />
                              {p.label}
                            </span>
                            {isServerConfigured && (
                              <span className="flex items-center gap-1 text-[var(--rf-volt)] text-[10px] uppercase tracking-wider">
                                <CheckCircle size={10} /> Active on server
                              </span>
                            )}
                          </label>
                          <input
                            type="password"
                            placeholder={isServerConfigured ? 'Using server config (Override optional)' : `Enter ${p.label} API Key`}
                            value={localKeys[p.value] || ''}
                            onChange={(e) => handleKeyChange(p.value, e.target.value)}
                            className="w-full bg-[var(--rf-forest)] border border-[var(--rf-border)] rounded-md px-3 py-2 text-sm text-white placeholder-[var(--rf-border)] focus:outline-none focus:border-[var(--rf-volt)] focus:ring-1 focus:ring-[var(--rf-volt)] transition-all"
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-[var(--rf-forest)] border-t border-[var(--rf-border)] flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-[var(--rf-volt)] text-[var(--rf-void)] text-sm font-bold rounded-md hover:opacity-90 transition-opacity"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
