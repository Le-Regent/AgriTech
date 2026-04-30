import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
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
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.scrollTop > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    // Find the scroll container (main)
    const main = document.querySelector('main');
    if (main) {
      main.addEventListener('scroll', handleScroll);
      return () => main.removeEventListener('scroll', handleScroll);
    }
  }, []);

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

  const pathname = usePathname();
  const isDashboard = pathname === '/';

  return (
    <header className={`h-16 md:h-20 bg-white/70 dark:bg-background-dark/70 backdrop-blur-xl border-b transition-all duration-500 sticky top-0 z-[100] ${
      isScrolled 
        ? 'border-slate-200 dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-white/5 h-14 md:h-16' 
        : 'border-transparent'
    }`}>
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
          <h2 className="text-[10px] sm:text-lg font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-white/5 py-1 px-2 sm:px-3 rounded-[10px] sm:rounded-xl border border-slate-200 dark:border-white/10 uppercase italic tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] sm:max-w-none ml-1 sm:ml-4 flex-shrink">
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
                <div className="p-2 space-y-1">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('settings')}</span>
                    <div className="flex bg-slate-50 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-100 dark:border-white/5">
                      <button 
                        onClick={() => setLanguage('en')}
                        className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${language === 'en' ? 'bg-primary text-white' : 'text-slate-400'}`}
                      >
                        EN
                      </button>
                      <button 
                        onClick={() => setLanguage('fr')}
                        className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${language === 'fr' ? 'bg-primary text-white' : 'text-slate-400'}`}
                      >
                        FR
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={handleToggleTheme}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-hover-dark rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px]">
                        {theme === 'light' ? 'dark_mode' : 'light_mode'}
                      </span>
                      <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-slate-200'}`}>
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                    </div>
                  </button>

                  <Link 
                    href="/profile" 
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-hover-dark rounded-xl transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">person</span>
                    {t('my_profile')}
                  </Link>
                  
                  <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />

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
