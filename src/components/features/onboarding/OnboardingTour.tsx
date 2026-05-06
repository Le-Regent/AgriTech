import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface Step {
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: Step[] = [
  {
    target: 'diagnosis-nav',
    title: 'AI Diagnosis',
    content: 'Upload photos of your crops to get instant health reports and treatment advice.',
    position: 'bottom'
  },
  {
    target: 'marketplace-nav',
    title: 'Global Marketplace',
    content: 'Connect directly with farmers and buyers worldwide. Compare products and trade securely.',
    position: 'bottom'
  },
  {
    target: 'theme-toggle',
    title: 'Dark Mode',
    content: 'Switch between light and dark themes for a comfortable viewing experience.',
    position: 'bottom'
  }
];

export function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('agritech_tour_seen');
    if (!hasSeenTour) {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    if (isVisible) {
      const updateRect = () => {
        const target = document.getElementById(STEPS[currentStep].target);
        if (target) {
          setTargetRect(target.getBoundingClientRect());
        }
      };
      updateRect();
      window.addEventListener('resize', updateRect);
      return () => window.removeEventListener('resize', updateRect);
    }
  }, [isVisible, currentStep]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('agritech_tour_seen', 'true');
  };

  if (!isVisible || !targetRect) return null;

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] pointer-events-auto" onClick={handleComplete} />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          className="absolute pointer-events-auto bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 w-72 sm:w-80 z-[101]"
          style={{
            top: step.position === 'bottom' ? targetRect.bottom + 20 : targetRect.top - 20,
            left: Math.max(20, Math.min(window.innerWidth - 300, targetRect.left + (targetRect.width / 2) - 150)),
            transform: step.position === 'top' ? 'translateY(-100%)' : 'none'
          }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded-full">
                Step {currentStep + 1} of {STEPS.length}
              </span>
              <button onClick={handleComplete} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            <div>
              <h4 className="text-lg font-black dark:text-white">{step.title}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                {step.content}
              </p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <button 
                onClick={handleComplete}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Skip Tour
              </button>
              <button 
                onClick={handleNext}
                className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                {currentStep === STEPS.length - 1 ? 'Get Started' : 'Next Step'}
              </button>
            </div>
          </div>
          
          {/* Arrow */}
          <div 
            className={`absolute w-4 h-4 bg-white dark:bg-slate-900 border-t border-l border-slate-100 dark:border-slate-800 rotate-45 ${step.position === 'bottom' ? '-top-2' : '-bottom-2'}`}
            style={{ left: 'calc(50% - 8px)' }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Spotlight */}
      <div 
        className="absolute border-[4px] border-primary rounded-2xl shadow-[0_0_0_9999px_rgba(15,23,42,0.4)] transition-all duration-300"
        style={{
          top: targetRect.top - 8,
          left: targetRect.left - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16
        }}
      />
    </div>
  );
}
