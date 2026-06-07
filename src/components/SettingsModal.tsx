import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Key, Sliders, Lock, Unlock, User, LogOut, Cloud } from 'lucide-react';
import { PROVIDERS } from '../lib/constants';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { encryptVault, decryptVault } from '../lib/crypto';
import { pb, isAuthenticated } from '../lib/db';
import { loadSettings, saveSettings } from '../lib/settings';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const focusTrapRef = useFocusTrap<HTMLDivElement>(open, onClose);

  const [serverConfig, setServerConfig] = useState<Record<string, boolean>>({});
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [vaultPassword, setVaultPassword] = useState<string>('');
  const [isVaultLocked, setIsVaultLocked] = useState<boolean>(true);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<number>(0.1);
  const [maxTokens, setMaxTokens] = useState<number>(2000);

  // Auth State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const tabLoginRef = useRef<HTMLButtonElement>(null);
  const tabRegisterRef = useRef<HTMLButtonElement>(null);

  const refreshData = useCallback(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        setServerConfig(data);
      })
      .catch(() => {});

    const sessionPass = sessionStorage.getItem('rf_vault_session_key');
    if (sessionPass) {
      setVaultPassword(sessionPass);
      loadAndDecryptKeys(sessionPass, true);
    } else {
      if (!localStorage.getItem('rf_vault_integrity')) setIsVaultLocked(false);
    }

    const settings = loadSettings();
    setTemperature(settings.temperature);
    setMaxTokens(settings.maxTokens);
  }, []);

  useEffect(() => {
    if (!open) return;
    refreshData();
  }, [open, refreshData]);

  const loadAndDecryptKeys = async (password: string, quiet = false) => {
    const integrityEncrypted = localStorage.getItem('rf_vault_integrity');
    const keysEncrypted = localStorage.getItem('rf_api_keys_encrypted');
    
    if (!integrityEncrypted) {
      setIsVaultLocked(false);
      return;
    }

    try {
      await decryptVault(integrityEncrypted, password);
      if (keysEncrypted) {
        const decrypted = await decryptVault(keysEncrypted, password);
        setKeys(JSON.parse(decrypted));
      }
      setIsVaultLocked(false);
      setUnlockError(null);
      sessionStorage.setItem('rf_vault_session_key', password);
    } catch {
      if (!quiet) setUnlockError('Incorrect Vault Password.');
      setIsVaultLocked(true);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (authMode === 'register') {
        await pb.collection('users').create({ email, password, passwordConfirm: password });
      }
      await pb.collection('users').authWithPassword(email, password);
      setAuthError(null);
      await syncVaultFromCloud();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const syncVaultFromCloud = async () => {
    if (!isAuthenticated()) return;
    try {
      const records = await pb.collection('settings').getList(1, 1);
      if (records.items.length > 0) {
        const cloudVault = records.items[0];
        localStorage.setItem('rf_vault_integrity', cloudVault.integrity);
        localStorage.setItem('rf_api_keys_encrypted', cloudVault.keys);
        const pass = sessionStorage.getItem('rf_vault_session_key');
        if (pass) loadAndDecryptKeys(pass, true);
      }
    } catch (e) { console.error('Cloud vault sync failed:', e); }
  };

  const handleLogout = () => {
    pb.authStore.clear();
    setEmail('');
    setPassword('');
    refreshData();
  };

  const handleKeyChange = (provider: string, value: string) => {
    setKeys((prev) => {
      const next = { ...prev, [provider]: value };
      if (!value) delete next[provider];
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultPassword) return;

    try {
      const integrityPayload = JSON.stringify({ version: "1.0", updated: Date.now() });
      const integrityEnc = await encryptVault(integrityPayload, vaultPassword);
      const keysEnc = await encryptVault(JSON.stringify(keys), vaultPassword);

      localStorage.setItem('rf_vault_integrity', integrityEnc);
      localStorage.setItem('rf_api_keys_encrypted', keysEnc);
      localStorage.removeItem('rf_api_keys'); // Clear legacy plaintext keys
      sessionStorage.setItem('rf_vault_session_key', vaultPassword);
      
      if (isAuthenticated()) {
        const existing = await pb.collection('settings').getList(1, 1).catch(() => ({ items: [] }));
        const data = { user: pb.authStore.model?.id, integrity: integrityEnc, keys: keysEnc };
        if (existing.items.length > 0) {
          await pb.collection('settings').update(existing.items[0].id, data);
        } else {
          await pb.collection('settings').create(data);
        }
      }

      saveSettings({ temperature, maxTokens });
      onClose();
      window.dispatchEvent(new Event('rf_settings_updated'));
    } catch (err) { console.error('Save failed:', err); }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[80]" />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[90] pointer-events-none">
            <motion.div ref={focusTrapRef} role="dialog" aria-modal="true" aria-label="Application Settings" initial={{ opacity: 0, y: 15, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} className="pointer-events-auto w-full max-w-[500px] max-h-[90vh] bg-[var(--rf-depth)] border border-[var(--rf-border)] rounded-sm flex flex-col overflow-hidden shadow-2xl">
              <div className="h-12 px-4 border-b border-[var(--rf-border)] bg-[var(--rf-void)] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-[var(--rf-volt)]">
                  <Sliders size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest font-mono">TERMINAL // CONFIGURATION</span>
                </div>
                <button onClick={onClose} aria-label="Close settings" className="p-1.5 hover:bg-[var(--rf-forest)] rounded-sm text-[var(--rf-mist)]/50 cursor-pointer focus-visible:ring-1 focus-visible:ring-[var(--rf-volt)] focus:outline-none"><X size={16} /></button>
              </div>

              {isVaultLocked && localStorage.getItem('rf_vault_integrity') ? (
                <div className="p-8 flex flex-col items-center justify-center space-y-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-[var(--rf-forest)] border border-[var(--rf-border)] flex items-center justify-center text-[var(--rf-volt)]"><Lock size={32} /></div>
                  <div>
                    <h2 className="rf-micro-caps text-lg tracking-wider">Vault Locked</h2>
                    <p className="text-xs text-[var(--rf-mist)]/60">Enter password to unlock your keys.</p>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); if (vaultPassword) loadAndDecryptKeys(vaultPassword); }} className="w-full max-w-[300px] space-y-4">
                    <input type="password" aria-label="Vault password" placeholder="Vault Password" value={vaultPassword} onChange={(e) => setVaultPassword(e.target.value)} autoFocus className={`w-full bg-[var(--rf-void)] border ${unlockError ? 'border-[var(--rf-ember)]' : 'border-[var(--rf-border)]'} rounded-sm px-4 py-2 text-sm font-mono text-white outline-none focus:border-[var(--rf-volt)]/50`}/>
                    {unlockError && <div className="text-[10px] text-[var(--rf-ember)] font-mono">{unlockError}</div>}
                    <button type="submit" className="w-full py-2 rounded-sm bg-[var(--rf-volt)] text-[var(--rf-void)] text-xs font-mono font-bold hover:opacity-90 transition-all"><Unlock size={14} className="inline mr-2"/> UNLOCK</button>
                    <button 
                      type="button" 
                      onClick={() => {
                        if (confirm('Are you sure? This will delete all your stored API keys. This action cannot be undone.')) {
                          localStorage.removeItem('rf_vault_integrity');
                          localStorage.removeItem('rf_api_keys_encrypted');
                          localStorage.removeItem('rf_onboarding_seen');
                          sessionStorage.removeItem('rf_vault_session_key');
                          window.location.reload();
                        }
                      }}
                      className="w-full py-2 text-[10px] font-mono text-[var(--rf-ember)]/60 hover:text-[var(--rf-ember)] transition-colors underline decoration-dotted"
                    >
                      FORGOT PASSWORD? RESET VAULT
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-5 space-y-8 diff-scrollbar">
                    
                    {/* SECTION: CLOUD AUTH */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-[var(--rf-border)] pb-1.5" id="section-cloud">
                          <div className="flex items-center gap-2 text-[var(--rf-mist)]/50">
                            <Cloud size={12} aria-hidden="true" />
                            <h3 className="text-[10px] font-mono uppercase tracking-wider font-bold">Cloud Persistence</h3>
                          </div>
                          {isAuthenticated() && <span className="text-[var(--rf-volt)] text-[9px] font-bold animate-pulse">CONNECTED</span>}
                        </div>

                        {isAuthenticated() ? (
                          <div className="bg-[var(--rf-forest)]/20 border border-[var(--rf-border)] rounded-sm p-4 flex items-center justify-between" aria-labelledby="section-cloud">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-sm bg-[var(--rf-volt)]/10 border border-[var(--rf-volt)]/30 flex items-center justify-center text-[var(--rf-volt)]"><User size={16} /></div>
                              <div>
                                <div className="text-xs font-bold text-white">{pb.authStore.model?.email}</div>
                                <div className="text-[9px] font-mono text-[var(--rf-mist)]/50">SOTA Sync Enabled</div>
                              </div>
                            </div>
                            <button onClick={handleLogout} aria-label="Sign out" className="p-2 hover:bg-[var(--rf-ember)]/10 rounded-sm text-[var(--rf-ember)]/60 hover:text-[var(--rf-ember)] transition-colors"><LogOut size={16}/></button>
                          </div>
                        ) : (
                          <div className="space-y-4" aria-labelledby="section-cloud">
                            <div role="tablist" aria-label="Authentication Mode" className="flex p-1 bg-[var(--rf-void)] rounded-sm border border-[var(--rf-border)] w-fit">
                              <button 
                                ref={tabLoginRef}
                                id="tab-login"
                                role="tab"
                                aria-selected={authMode === 'login'}
                                aria-controls="panel-auth"
                                tabIndex={authMode === 'login' ? 0 : -1}
                                onClick={() => setAuthMode('login')} 
                                onKeyDown={(e) => {
                                  if (e.key === 'ArrowRight') {
                                    setAuthMode('register');
                                    setTimeout(() => tabRegisterRef.current?.focus(), 0);
                                  }
                                }}
                                className={`px-4 py-1.5 rounded-sm text-[10px] font-mono font-bold transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--rf-sky)] ${authMode === 'login' ? 'bg-[var(--rf-forest)] text-[var(--rf-volt)]' : 'text-[var(--rf-mist)]/40 hover:text-white'}`}
                              >
                                LOGIN
                              </button>
                              <button 
                                ref={tabRegisterRef}
                                id="tab-register"
                                role="tab"
                                aria-selected={authMode === 'register'}
                                aria-controls="panel-auth"
                                tabIndex={authMode === 'register' ? 0 : -1}
                                onClick={() => setAuthMode('register')} 
                                onKeyDown={(e) => {
                                  if (e.key === 'ArrowLeft') {
                                    setAuthMode('login');
                                    setTimeout(() => tabLoginRef.current?.focus(), 0);
                                  }
                                }}
                                className={`px-4 py-1.5 rounded-sm text-[10px] font-mono font-bold transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--rf-sky)] ${authMode === 'register' ? 'bg-[var(--rf-forest)] text-[var(--rf-volt)]' : 'text-[var(--rf-mist)]/40 hover:text-white'}`}
                              >
                                REGISTER
                              </button>
                            </div>
                            <div 
                              id="panel-auth"
                              role="tabpanel"
                              aria-labelledby={authMode === 'login' ? 'tab-login' : 'tab-register'}
                              className="space-y-3"
                            >
                            <form onSubmit={handleAuth} className="space-y-3">
                              <input type="email" aria-label="Email address" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[var(--rf-forest)] border border-[var(--rf-border)] rounded-sm px-3 py-1.5 text-xs text-white outline-none focus:border-[var(--rf-sky)]/50" required />
                              <input type="password" aria-label="Password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[var(--rf-forest)] border border-[var(--rf-border)] rounded-sm px-3 py-1.5 text-xs text-white outline-none focus:border-[var(--rf-sky)]/50" required />
                              {authError && <div className="text-[9px] text-[var(--rf-ember)] font-mono">{authError}</div>}
                              <button type="submit" disabled={authLoading} className="w-full py-2 bg-[var(--rf-sky)] text-[var(--rf-void)] text-[10px] font-mono font-bold rounded-sm hover:opacity-90 disabled:opacity-30">{authLoading ? 'PROCESSING...' : (authMode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT')}</button>
                            </form>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SECTION: VAULT & KEYS */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-[var(--rf-mist)]/50 border-b border-[var(--rf-border)] pb-1.5"><Lock size={12} aria-hidden="true" /><h3 className="text-[10px] font-mono uppercase tracking-wider font-bold">Zero-Knowledge Vault</h3></div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono text-[var(--rf-mist)]/60">Vault Password (Required to sync keys)</label>
                        <input type="password" placeholder="Master Password" value={vaultPassword} onChange={(e) => setVaultPassword(e.target.value)} className="w-full bg-[var(--rf-forest)] border border-[var(--rf-border)] rounded-sm px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-[var(--rf-volt)]/50"/>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[var(--rf-mist)]/50 border-b border-[var(--rf-border)] pb-1.5"><Key size={12} aria-hidden="true" /><h3 className="text-[10px] font-mono uppercase tracking-wider font-bold">API Credentials (BYOK)</h3></div>
                        {PROVIDERS.filter(p => p.value !== 'auto').map(p => (
                          <div key={p.value} className="flex flex-col gap-1.5">
                            <label htmlFor={`key-${p.value}`} className="flex items-center justify-between text-[10px] font-mono text-[var(--rf-mist)]/60 capitalize">
                              <span className="flex items-center gap-1.5"><p.icon className="w-3.5 h-3.5" aria-hidden="true" /> {p.label} Key</span>
                            </label>
                            <input id={`key-${p.value}`} type="password" disabled={!vaultPassword && !serverConfig[p.value]} placeholder={!vaultPassword ? 'Set password first' : 'Enter key'} value={keys[p.value] || ''} onChange={(e) => handleKeyChange(p.value, e.target.value)} className="w-full bg-[var(--rf-forest)] border border-[var(--rf-border)] rounded-sm px-3 py-1.5 text-xs text-white outline-none focus:border-[var(--rf-volt)]/50 disabled:opacity-30"/>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="h-14 px-4 border-t border-[var(--rf-border)] bg-[var(--rf-void)] flex items-center justify-end gap-2 shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-1.5 rounded-sm border border-[var(--rf-border)] text-xs font-mono text-[var(--rf-mist)]/60 hover:text-white transition-all cursor-pointer">Cancel</button>
                    <button onClick={handleSave} disabled={!vaultPassword} className="flex items-center gap-2 px-6 py-1.5 rounded-sm bg-[var(--rf-volt)] text-[var(--rf-void)] text-xs font-mono font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-30"><Save size={13} /> Save & Sync</button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
