import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, Shield, Zap, Sparkles } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS = [
  {
    icon: <Sparkles className="w-10 h-10 text-[var(--rf-volt)]" />,
    title: 'Welcome to Refract',
    description: 'Refract is a lightning-fast, privacy-first code analysis tool. Get instant, expert-level code reviews directly in your browser.',
  },
  {
    icon: <Zap className="w-10 h-10 text-[var(--rf-sky)]" />,
    title: 'The Auto-Router',
    description: 'Not sure which AI to use? Leave the provider set to "Auto". Refract dynamically analyzes your code size and language to route the request to the fastest and smartest model available.',
  },
  {
    icon: <Shield className="w-10 h-10 text-[var(--rf-warn)]" />,
    title: 'Bring Your Own Keys',
    description: 'Refract connects directly to provider APIs via a lightweight proxy. If the server doesn\'t have keys configured, you can safely paste your own in the settings. Keys never leave your local storage.',
  },
  {
    icon: <CheckCircle2 className="w-10 h-10 text-[var(--rf-volt)]" />,
    title: 'Ready to code',
    description: 'Paste your code on the left, press Cmd/Ctrl + Enter, and start refracting.',
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);

  const nextStep = () => {
    if (step === STEPS.length - 1) {
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
            className="bg-[var(--rf-depth)] border border-[var(--rf-border)] rounded-[16px] p-8 shadow-2xl flex flex-col items-center text-center"
          >
            <div className="mb-6 bg-[var(--rf-forest)] p-4 rounded-full border border-[var(--rf-border)] shadow-inner">
              {STEPS[step].icon}
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">
              {STEPS[step].title}
            </h2>
            
            <p className="text-sm text-[var(--rf-mist)] leading-relaxed mb-8 max-w-[400px]">
              {STEPS[step].description}
            </p>

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
                className="flex items-center gap-2 px-6 py-2.5 bg-[var(--rf-volt)] text-[var(--rf-void)] font-bold rounded-lg hover:opacity-90 transition-opacity"
              >
                {step === STEPS.length - 1 ? 'Start Refracting' : 'Next'}
                {step !== STEPS.length - 1 && <ArrowRight size={16} />}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
