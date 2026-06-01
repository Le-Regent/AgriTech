import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useLanguage } from '@/context/LanguageContext';
import { motion } from 'motion/react';

const MOBILE_NAV = [
  { label: 'Home', icon: 'home', path: '/' },
  { label: 'Marketplace', icon: 'storefront', path: '/marketplace' },
  { label: 'Crop Doctor', icon: 'biotech', path: '/diagnosis', isFAB: true },
  { label: 'Orders', icon: 'receipt_long', path: '/orders' },
  { label: 'Profile', icon: 'account_circle', path: '/profile' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const { t } = useLanguage();

  if (!user) return null;

  return (
    <nav className="mobile-nav-bar md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-2xl border-t border-white/10 px-2 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.6)]">
      <div className="flex items-center justify-around h-20 max-w-lg mx-auto relative">
        {MOBILE_NAV.map((item) => {
          const isActive = pathname === item.path;
          
          if (item.isFAB) {
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className="relative flex flex-col items-center justify-center -top-4 z-50 group cursor-pointer"
                title="Quick Scan"
              >
                {/* Floating Action Button */}
                <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-primary to-emerald-500 rounded-full shadow-[0_8px_20px_rgba(16,185,129,0.4)] group-active:scale-90 transition-all duration-300 border border-emerald-400/20">
                  <span className="material-symbols-outlined text-[28px] text-white font-bold animate-pulse">
                    center_focus_strong
                  </span>
                  
                  {/* Floating active neon rings */}
                  {isActive && (
                    <motion.div 
                      layoutId="fabGlow"
                      className="absolute inset--1.5 border border-primary/40 rounded-full -z-10 blur-sm scale-105"
                      animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-primary mt-1.5">
                  Quick Scan
                </span>
              </Link>
            );
          }

          return (
            <Link 
              key={item.path} 
              href={item.path}
              className="relative flex flex-col items-center justify-center w-16 h-full group cursor-pointer"
            >
              <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                isActive ? 'text-primary' : 'text-slate-500 group-active:scale-90'
              }`}>
                <span className={`material-symbols-outlined text-[24px] ${isActive ? 'fill-1' : ''}`}>
                  {item.icon}
                </span>
                
                {isActive && (
                  <motion.div 
                    layoutId="activeTabGlow"
                    className="absolute inset-0 bg-primary/20 rounded-xl -z-10 blur-md"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-tighter mt-1 transition-colors ${
                isActive ? 'text-primary' : 'text-slate-600'
              }`}>
                {t(item.label.toLowerCase().replace(/\s+/g, '_'))}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
