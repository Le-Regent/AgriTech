'use client';

import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { OnboardingTour } from '@/components/features/onboarding/OnboardingTour';
import { motion, AnimatePresence } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { user, isAuthReady } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Define routes where we don't want to show the layout (e.g., welcome, login)
  const noLayoutRoutes = ['/welcome', '/login'];
  const isNoLayoutRoute = noLayoutRoutes.includes(pathname);
  
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
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring' as const, damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-white dark:bg-background-dark z-[70] lg:hidden shadow-2xl"
            >
              <Sidebar onMobileClose={() => setIsMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 no-scrollbar scroll-smooth">
          <div className="max-w-7xl mx-auto w-full pb-32 lg:pb-8">
            {children}
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
