'use client';

import React, { useState, useEffect, useRef } from 'react';

interface VirtualizedItemProps {
  children: React.ReactNode;
  estimatedHeight?: number;
  id: string;
}

export default function VirtualizedItem({ 
  children, 
  estimatedHeight = 350, 
  id 
}: VirtualizedItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        rootMargin: '400px 0px 400px 0px', // Pre-render elements 400px before they enter viewport
        threshold: 0,
      }
    );

    observer.observe(el);
    return () => {
      observer.unobserve(el);
    };
  }, []);

  return (
    <div 
      ref={ref} 
      data-virtual-id={id} 
      style={{ minHeight: isVisible ? undefined : `${estimatedHeight}px` }}
      className="transition-all duration-300"
    >
      {isVisible ? (
        children
      ) : (
        <div 
          className="w-full bg-slate-100/50 dark:bg-white/5 rounded-3xl animate-pulse" 
          style={{ height: `${estimatedHeight}px` }} 
        />
      )}
    </div>
  );
}
