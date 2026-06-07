import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import { useTheme } from '@/context/ThemeContext';
import { useCart } from '@/context/CartContext';
import { useOffline } from '@/context/OfflineContext';
import { useUser } from '@/context/UserContext';
import { MARKETPLACE_NAV } from '@/constants';
import { useLanguage } from '@/context/LanguageContext';
import { NotificationCenter } from './NotificationCenter';
import { useNotifications } from '@/context/NotificationContext';

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
  const { unreadMessagesCount } = useNotifications();
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
  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboard = pathname === '/';

  // Key links for the navbar based on role
  const mainNavLinks = [
    { label: 'Marketplace', icon: 'storefront', path: '/marketplace' },
    { label: 'Basket', icon: 'shopping_cart', path: '/cart', showBadge: true },
    { label: 'My Boutique', icon: 'potted_plant', path: '/listings', roles: ['farmer'] },
    { label: 'Orders', icon: 'receipt_long', path: '/orders' },
    { label: 'Messages', icon: 'forum', path: '/messages', showBadge: true },
  ].filter(item => {
    if (isAdminRoute) return false; // Hide all standard nav in admin
    return !item.roles || (user && item.roles.includes(user.user_type || ''));
  });

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
              className="lg:hidden w-10 h-10 flex-shrink-0 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
          )}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary to-green-400 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:rotate-6 transition-transform">
              <span className="material-symbols-outlined text-[18px] md:text-[24px] font-bold">eco</span>
            </div>
            <h1 className="text-sm md:text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic hidden xs:block">
              {title ? '' : 'Kamer'}<span className={title ? 'hidden' : 'text-primary tracking-normal'}>Fresh</span>
            </h1>
          </Link>

          {title && (
            <h2 className="text-[10px] sm:text-lg font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-white/5 py-1 px-2 sm:px-3 rounded-[10px] sm:rounded-xl border border-slate-200 dark:border-white/10 uppercase italic tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px] sm:max-w-none ml-1 sm:ml-4 flex-shrink">
              {title}
            </h2>
          )}
          
          <nav className="hidden lg:flex items-center ml-4 gap-1">
            {mainNavLinks.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 relative ${
                  pathname === item.path 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="hidden xl:inline">{t(item.label.toLowerCase().replace(/\s+/g, '_')) || item.label}</span>
                {item.showBadge && item.label === 'Basket' && totalItems > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white dark:border-background-dark">
                    {totalItems}
                  </span>
                )}
                {item.showBadge && item.label === 'Messages' && unreadMessagesCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white dark:border-background-dark">
                    {unreadMessagesCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          {isAdminRoute && (
            <Link 
              href="/"
              className="bg-red-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center gap-2 shadow-lg shadow-red-500/20"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Exit Admin
            </Link>
          )}

          {/* Mobile Search Icon */}
          {!isAdminRoute && (
            <button 
              className="lg:hidden w-10 h-10 rounded-full hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400"
              onClick={() => router.push('/marketplace')}
            >
              <span className="material-symbols-outlined text-[22px]">search</span>
            </button>
          )}

          {!isAdminRoute && (
            <div className="hidden lg:flex items-center justify-center flex-1 max-w-md mx-4">
              <div className="relative w-full group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] transition-colors group-focus-within:text-primary">search</span>
                <input 
                  type="text" 
                  placeholder={t('search_placeholder') || "Search products..."}
                  onChange={(e) => {
                    if (pathname !== '/marketplace') {
                       // Simple redirect for now, or could be real shared search
                    }
                  }}
                  className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-xl py-2 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-1 md:gap-3">
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 text-red-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 dark:border-red-500/20"
            >
              <span className="material-symbols-outlined text-sm animate-pulse">cloud_off</span>
              Offline
            </motion.div>
          )}
        </AnimatePresence>
        
        <button 
          id="theme-toggle"
          onClick={handleToggleTheme}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full hover:bg-slate-50 dark:hover:bg-surface-hover-dark flex items-center justify-center text-slate-500 dark:text-slate-400 transition-all active:scale-90"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          <span className="material-symbols-outlined text-[20px] sm:text-[22px]">
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </span>
        </button>

        
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
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('language') || 'Language'}</span>
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

                  <Link 
                    href="/profile" 
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-hover-dark rounded-xl transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">person</span>
                    {t('my_profile')}
                  </Link>

                  <Link 
                    href="/settings" 
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-hover-dark rounded-xl transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">settings</span>
                    {t('settings') || 'Settings'}
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
  </div>
</header>
  );
}
