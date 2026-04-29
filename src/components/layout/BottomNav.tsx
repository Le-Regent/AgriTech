import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { motion } from 'motion/react';

const MOBILE_NAV = [
  { label: 'Home', icon: 'home', path: '/' },
  { label: 'Market', icon: 'storefront', path: '/marketplace' },
  { label: 'Diagnose', icon: 'biotech', path: '/diagnosis', role: 'farmer' },
  { label: 'Orders', icon: 'receipt_long', path: '/orders' },
  { label: 'Profile', icon: 'account_circle', path: '/profile' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();

  if (!user) return null;

  const filteredNav = MOBILE_NAV.filter(item => !item.role || (user.user_type === item.role));

  return (
    <nav className="md:hidden fixed bottom-6 left-4 right-4 z-50 pointer-events-none">
      <div className="flex items-center justify-around h-16 bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] px-4 shadow-2xl shadow-black/50 pointer-events-auto">
        {filteredNav.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className="relative flex flex-col items-center justify-center w-full h-full group"
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
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
