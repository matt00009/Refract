import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, Shield, Sparkles, Lock, Key } from 'lucide-react';
import { encryptVault } from '../lib/crypto';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [vaultPass, setVaultPass] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const focusTrapRef = useFocusTrap<HTMLDivElement>(true);

  const STEPS = [
    {
      icon: <Sparkles className="w-10 h-10 text-[var(--rf-volt)]" />,
      title: 'Welcome to Refract',
      description: 'Refract is an industrial-grade code analysis terminal. Get instant, expert-level security and quality reviews directly in your browser.',
    },
    {
      icon: <Lock className="w-10 h-10 text-[var(--rf-sky)]" />,
      title: 'Secure Your Terminal',
      description: 'Refract uses Zero-Knowledge encryption. To store your API keys locally, you must create a Master Vault Password. This password is never stored on any server.',
      isVaultInit: true
    },
    {
      icon: <Shield className="w-10 h-10 text-[var(--rf-warn)]" />,
      title: 'Confidentiality First',
      description: 'Once set, your API keys are encrypted using AES-GCM (military grade). Only your password can unlock them in your browser\'s memory during analysis.',
    },
    {
      icon: <CheckCircle2 className="w-10 h-10 text-[var(--rf-volt)]" />,
      title: 'Ready to Secure',
      description: 'Your terminal is now ready. Paste your code, press Ctrl + Enter, and let the swarm analyze your architecture.',
    },
  ];

  const currentStepData = STEPS[step];

  const initializeVault = async () => {
    if (!vaultPass || vaultPass.length < 4) return;
    
    setIsInitializing(true);
    try {
      // Create an initial empty encrypted vault to verify password later (Integrity Check)
      const integrityPayload = JSON.stringify({ version: "1.0", created: Date.now(), initialized: true });
      const encrypted = await encryptVault(integrityPayload, vaultPass);
      
      localStorage.setItem('rf_vault_integrity', encrypted);
      localStorage.setItem('rf_api_keys_encrypted', await encryptVault('{}', vaultPass));
      localStorage.removeItem('rf_api_keys'); // Clear legacy plaintext keys
      sessionStorage.setItem('rf_vault_session_key', vaultPass);
      
      setStep(step + 1);
    } catch (err) {
      console.error('Failed to init vault:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  const nextStep = () => {
    if (currentStepData.isVaultInit) {
      initializeVault();
    } else if (step === STEPS.length - 1) {
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <motion.div
      ref={focusTrapRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-description"
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
    >
      <div className="w-full max-w-[500px] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-[var(--rf-depth)] border border-[var(--rf-border)] rounded-[10px] p-8 flex flex-col items-center text-center"
            aria-live="polite"
          >
            <div className="mb-6 bg-[var(--rf-forest)] p-4 rounded-full border border-[var(--rf-border)]" aria-hidden="true">
              {currentStepData.icon}
            </div>
            
            <h2 id="onboarding-title" className="text-2xl font-bold text-white mb-2 tracking-tight">
              {currentStepData.title}
            </h2>
            
            <p id="onboarding-description" className="text-sm text-[var(--rf-mist)] leading-relaxed mb-6 max-w-[400px]">
              {currentStepData.description}
            </p>

            {currentStepData.isVaultInit && (
              <div className="w-full max-w-[320px] space-y-3 mb-6">
                <div className="relative">
                  <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--rf-mist)]/40" />
                  <input
                    type="password"
                    placeholder="Create Vault Password (min. 4 chars)"
                    value={vaultPass}
                    onChange={(e) => setVaultPass(e.target.value)}
                    autoFocus
                    className="w-full bg-[var(--rf-void)] border border-[var(--rf-border)] rounded-[6px] pl-10 pr-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-[var(--rf-volt)]/50 transition-colors"
                  />
                </div>
                <p className="text-[10px] text-[var(--rf-ember)] font-mono text-left opacity-70 italic">
                  * Warning: If you lose this password, your stored API keys cannot be recovered.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between w-full mt-4">
              <div className="flex gap-2">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === step ? 'w-6 bg-[var(--rf-volt)]' : 'w-1.5 bg-[var(--rf-border)]'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextStep}
                disabled={(currentStepData.isVaultInit && vaultPass.length < 4) || isInitializing}
                className="flex items-center gap-2 px-6 py-2.5 bg-[var(--rf-volt)] text-[var(--rf-void)] font-bold rounded-[6px] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {step === STEPS.length - 1 ? 'Enter Terminal' : (isInitializing ? 'Securing...' : 'Next')}
                {!isInitializing && step !== STEPS.length - 1 && <ArrowRight size={16} />}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
