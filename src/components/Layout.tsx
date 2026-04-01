'use client';

import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { OnboardingTour } from './OnboardingTour';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  showNavbar?: boolean;
  showBottomNav?: boolean;
}

export default function Layout({ children, showSidebar = true, showNavbar = true, showBottomNav = true }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
      <OnboardingTour />
      {/* Desktop Sidebar */}
      {showSidebar && (
        <div className="hidden lg:block">
          <Sidebar />
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-white dark:bg-background-dark z-50 lg:hidden shadow-2xl"
            >
              <Sidebar onMobileClose={() => setIsMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        {showNavbar && <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 ${showBottomNav ? 'pb-24 lg:pb-8' : ''}`}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </main>
        {showBottomNav && <BottomNav />}
      </div>
    </div>
  );
}
