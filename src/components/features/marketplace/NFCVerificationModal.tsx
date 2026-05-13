'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '@/types';

interface NFCVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export default function NFCVerificationModal({ isOpen, onClose, product }: NFCVerificationModalProps) {
  const [step, setStep] = useState<'idle' | 'scanning' | 'success'>('idle');

  useEffect(() => {
    if (isOpen) {
      setStep('idle');
    }
  }, [isOpen]);

  const startScan = () => {
    setStep('scanning');
    setTimeout(() => {
      setStep('success');
    }, 2500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 overflow-hidden"
          >
            <div className="text-center space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black dark:text-white uppercase">NFC Verification</h3>
                <button onClick={onClose} className="text-slate-400">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {step === 'idle' && (
                <div className="space-y-8 py-4">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto">
                    <span className="material-symbols-outlined text-5xl">wifi_tethering</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-black dark:text-white">Ready to Scan</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px] mx-auto font-bold uppercase tracking-widest leading-relaxed">
                      Tap your phone against the product&apos;s physical KamerFresh tag to verify its origin and freshness.
                    </p>
                  </div>
                  <button
                    onClick={startScan}
                    className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                  >
                    Simulate Scan
                  </button>
                </div>
              )}

              {step === 'scanning' && (
                <div className="space-y-8 py-4">
                   <div className="relative w-32 h-32 mx-auto">
                      <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute inset-0 bg-primary/20 rounded-full"
                      />
                      <div className="absolute inset-4 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-5xl animate-pulse">sensors</span>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <p className="text-lg font-black dark:text-white animate-pulse">Reading Tag...</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Decrypting Secure Blockchain Ledger</p>
                   </div>
                </div>
              )}

              {step === 'success' && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="space-y-8 py-4"
                 >
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto shadow-xl shadow-green-500/30">
                      <span className="material-symbols-outlined text-5xl">verified</span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-2xl font-black text-green-600 uppercase tracking-tighter italic">Origin Authenticated</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">100% Genuine KamerFresh Produce</p>
                      </div>
                      
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-left border border-slate-100 dark:border-slate-700">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Farmer</p>
                            <p className="text-xs font-bold dark:text-white">{product.profiles?.full_name}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Batch ID</p>
                            <p className="text-xs font-bold dark:text-white font-mono uppercase">KF-{product.id.slice(0, 8)}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Location</p>
                            <p className="text-xs font-bold dark:text-white">{product.location}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Harvested</p>
                            <p className="text-xs font-bold dark:text-white">{new Date(product.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                    >
                      View Full Ledger
                    </button>
                 </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
