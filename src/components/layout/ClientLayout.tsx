'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { OnboardingTour } from '@/components/features/onboarding/OnboardingTour';
import { motion, AnimatePresence } from 'motion/react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { user, isAuthReady } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Pull-to-refresh state
  const [startY, setStartY] = useState<number | null>(null);
  const [pullDist, setPullDist] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Reset scroll container of <main> on page navigation to prevent empty/half-loaded feel
  useEffect(() => {
    const main = document.querySelector('main');
    if (main) {
      main.scrollTop = 0;
    }
  }, [pathname]);

  // Touch handlers for pull-to-refresh on mobile device interfaces
  const handleTouchStart = (e: React.TouchEvent) => {
    const mainElement = e.currentTarget as HTMLElement;
    if (mainElement && mainElement.scrollTop === 0 && !isRefreshing) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === null || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;

    if (diff > 0) {
      // Elastic resistance algorithm
      const resistVal = Math.min(80, diff * 0.4);
      setPullDist(resistVal);
    }
  };

  const handleTouchEnd = () => {
    if (startY === null || isRefreshing) return;
    setStartY(null);

    if (pullDist >= 55) {
      setIsRefreshing(true);
      setPullDist(55); // Lock pull visual in loading position

      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(10); // Native physical trigger vibration
        } catch {
          // Ignored
        }
      }

      // Trigger Next.js App Router background data/state revalidation
      router.refresh();

      setTimeout(() => {
        setIsRefreshing(false);
        setPullDist(0);
      }, 1000);
    } else {
      setPullDist(0);
    }
  };

  // Define routes where we don't want to show the layout (e.g., welcome, login)
  const noLayoutRoutes = ['/welcome', '/login'];
  const isNoLayoutRoute = noLayoutRoutes.includes(pathname) || pathname.startsWith('/admin');
  
  // Also hide layout if not logged in on the root route (which will show LandingPage)
  const showLayout = !isNoLayoutRoute && (user !== null || pathname !== '/');

  if (!showLayout || !isAuthReady) {
    return <div className="h-screen overflow-y-auto no-scrollbar scroll-smooth">{children}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark transition-colors duration-300">
      <OnboardingTour />
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] lg:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring' as const, damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-white dark:bg-background-dark z-[120] lg:hidden shadow-2xl"
            >
              <Sidebar onMobileClose={() => setIsMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 no-scrollbar scroll-smooth relative"
        >
          {/* Pull-to-refresh Loader */}
          {(pullDist > 0 || isRefreshing) && (
            <div 
              style={{ height: `${pullDist}px` }} 
              className="flex items-center justify-center overflow-hidden transition-all duration-150 w-full mb-3"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl shadow-green-500/5">
                <svg 
                  className={`w-5 h-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`}
                  style={{ transform: !isRefreshing ? `rotate(${pullDist * 4}deg)` : undefined }}
                  viewBox="0 0 24 24"
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="3"
                >
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  {isRefreshing ? 'Refreshing...' : 'Pull to Refresh'}
                </span>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="max-w-7xl mx-auto w-full pb-32 lg:pb-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
