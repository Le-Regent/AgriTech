'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

export default function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Configure NProgress
    NProgress.configure({ 
      showSpinner: false,
      easing: 'ease',
      speed: 500,
      minimum: 0.3
    });
  }, []);

  useEffect(() => {
    // Start progress on route change
    NProgress.start();
    
    // Finish progress after a short delay to simulate loading
    const timer = setTimeout(() => {
      NProgress.done();
    }, 100);

    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [pathname, searchParams]);

  return null;
}
