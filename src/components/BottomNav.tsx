import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MARKETPLACE_NAV } from '../constants';
import { useUser } from '../context/UserContext';

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();

  const filteredNav = MARKETPLACE_NAV.filter(item => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-around z-40 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      {filteredNav.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-200 ${
              isActive
                ? 'text-primary'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <span className={`material-symbols-outlined text-[24px] ${isActive ? 'fill-1' : ''}`}>
              {item.icon}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
