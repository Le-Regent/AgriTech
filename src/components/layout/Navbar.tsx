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
}

export function Navbar({ onMenuClick }: NavbarProps) {
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
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const filteredNav = MARKETPLACE_NAV.filter(item => !item.roles || (user && item.roles.includes(user.role)));

  const pathname = usePathname();
  const isDashboard = pathname === '/';

  return (
    <header className="h-20 bg-white dark:bg-background-dark border-b border-slate-200 dark:border-border-dark px-4 sm:px-8 flex items-center justify-between sticky top-0 z-10 transition-colors duration-300">
      <div className="flex items-center gap-4 lg:gap-8 flex-1">
        {onMenuClick && (
          <button 
            id="mobile-menu-trigger"
            onClick={onMenuClick}
            className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-surface-hover-dark rounded-xl transition-colors"
            title="Open Menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        )}
        
        {!isDashboard && (
          <div className="relative flex-1 max-w-[140px] xs:max-w-[180px] sm:max-w-sm md:max-w-md lg:max-w-lg transition-all duration-300">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] sm:text-[20px]">search</span>
            <input
              id="navbar-search"
              type="text"
              placeholder={t('search')}
              className="pl-9 sm:pl-10 pr-4 py-2 bg-slate-50 dark:bg-muted-dark border-none rounded-xl w-full text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white transition-colors"
            />
          </div>
        )}
        
        <nav className="hidden xl:flex items-center gap-6">
          {filteredNav.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              title={t(item.label.toLowerCase().replace(' ', '_')) || item.label}
              className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {t(item.label.toLowerCase().replace(' ', '_')) || item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-1 sm:gap-4 ml-2 sm:ml-4 relative">
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
                {user?.role || 'Guest'}
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
                    {user?.role}
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
    </header>
  );
}
