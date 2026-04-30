import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { MARKETPLACE_NAV } from '@/constants';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import { useTheme } from '@/context/ThemeContext';
import { useCart } from '@/context/CartContext';
import { useOffline } from '@/context/OfflineContext';
import { useUser } from '@/context/UserContext';
import { useLanguage } from '@/context/LanguageContext';
import { NotificationCenter } from './NotificationCenter';

interface NavbarProps {
  onMenuClick?: () => void;
  title?: string;
}

export function Navbar({ onMenuClick, title }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { totalItems } = useCart();
  const { isOnline } = useOffline();
  const { user, logout } = useUser();
  const router = useRouter();
  const [showThemeConfirm, setShowThemeConfirm] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleTheme = () => {
    toggleTheme();
    setShowThemeConfirm(true);
    setTimeout(() => setShowThemeConfirm(false), 2000);
  };

  const { t } = useLanguage();

  const handleLogout = async () => {
    await logout();
  };

  const filteredNav = MARKETPLACE_NAV.filter(item => !item.roles || (user && item.roles.includes(user.user_type || '')));

  const pathname = usePathname();
  const isDashboard = pathname === '/';

  return (
    <header className="h-16 md:h-20 bg-white/70 dark:bg-background-dark/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 sticky top-0 z-40 transition-all duration-300">
      <div className="max-w-7xl mx-auto h-full px-2 sm:px-8 flex items-center justify-between gap-1 sm:gap-4">
        <div className="flex items-center gap-1 sm:gap-8 flex-1 min-w-0">
          {onMenuClick && (
            <button 
              onClick={onMenuClick}
              className="lg:hidden w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
          )}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary to-green-400 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:rotate-6 transition-transform">
            <span className="material-symbols-outlined text-[18px] md:text-[24px] font-bold">agriculture</span>
          </div>
          <h1 className="text-sm md:text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic hidden xs:block">
            Agri<span className="text-primary tracking-normal">Tech</span>
          </h1>
        </Link>

        {title ? (
          <h2 className="text-[10px] sm:text-lg font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-white/5 py-1 px-2 sm:px-3 rounded-[10px] sm:rounded-xl border border-slate-200 dark:border-white/10 uppercase italic tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px] sm:max-w-none ml-1 sm:ml-4">
            {title}
          </h2>
        ) : !isDashboard && (
          <div className="hidden sm:flex relative flex-1 max-w-[40px] focus-within:max-w-[200px] md:max-w-md transition-all duration-500 overflow-hidden group ml-4">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] z-10">search</span>
            <input
              id="navbar-search"
              type="text"
              placeholder={t('search')}
              className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-white/5 border-none rounded-xl w-full text-xs focus:ring-2 focus:ring-primary/20 outline-none dark:text-white transition-all opacity-0 focus:opacity-100 md:opacity-100"
            />
          </div>
        )}
        
        <nav className="hidden xl:flex items-center gap-6">
          {filteredNav.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 ${
                pathname === item.path ? 'text-primary' : 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {t(item.label.toLowerCase().replace(' ', '_')) || item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-1 md:gap-3 ml-2 relative">
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 text-red-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 dark:border-red-500/20"
            >
              <span className="material-symbols-outlined text-sm animate-pulse">cloud_off</span>
              Offline Mode
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showThemeConfirm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute -bottom-12 right-0 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-xl z-50"
            >
              {theme === 'light' ? t('theme_dark') : t('theme_light')}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-border-dark mr-1 sm:mr-2">
          <button 
            onClick={() => setLanguage('en')}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-[9px] font-black transition-all ${language === 'en' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            EN
          </button>
          <button 
            onClick={() => setLanguage('fr')}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-[9px] font-black transition-all ${language === 'fr' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            FR
          </button>
        </div>

        <button 
          id="theme-toggle"
          onClick={handleToggleTheme}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full hover:bg-slate-50 dark:hover:bg-surface-hover-dark flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          <span className="material-symbols-outlined text-[20px] sm:text-[24px]">
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </span>
        </button>
        <Link 
          href="/cart"
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full hover:bg-slate-50 dark:hover:bg-surface-hover-dark flex items-center justify-center text-slate-500 dark:text-slate-400 relative transition-colors"
          title="Shopping Cart"
        >
          <span className="material-symbols-outlined text-[20px] sm:text-[24px]">shopping_cart</span>
          {totalItems > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 sm:w-5 sm:h-5 bg-primary text-white text-[8px] sm:text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-background-dark">
              {totalItems}
            </span>
          )}
        </Link>
        
        <NotificationCenter />
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-slate-100 dark:border-border-dark hover:opacity-80 transition-opacity"
          >
            <div className="hidden md:block text-right">
              <p className="text-xs sm:text-sm font-bold truncate max-w-[80px] lg:max-w-none dark:text-white">
                {user?.full_name || 'Guest'}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 capitalize">
                {user?.user_type || 'Guest'}
              </p>
            </div>
            <ResponsiveImage
              src={user?.avatar_url || "https://picsum.photos/seed/guest/100/100"}
              alt={`Profile picture of ${user?.full_name || 'Guest'}`}
              className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-primary/20"
              baseWidth={100}
              baseHeight={100}
            />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-slate-100 dark:border-border-dark overflow-hidden z-50"
              >
                <div className="p-4 border-b border-slate-100 dark:border-border-dark">
                  <p className="text-sm font-black dark:text-white">{user?.full_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                  <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                    {user?.user_type}
                    {user?.is_admin && (
                      <span className="ml-2 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] uppercase font-bold tracking-wider">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-2">
                    <Link 
                    href="/profile" 
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-hover-dark rounded-xl transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">person</span>
                    {t('my_profile')}
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    {t('logout')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  </header>
  );
}
