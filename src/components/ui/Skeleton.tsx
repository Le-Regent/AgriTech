'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export default function Skeleton({ className = '', variant = 'rect' }: SkeletonProps) {
  const baseClass = "animate-pulse bg-slate-200 dark:bg-slate-800";
  
  const variantClasses = {
    text: "h-4 w-full rounded",
    rect: "rounded-xl",
    circle: "rounded-full"
  };

  return <div className={`${baseClass} ${variantClasses[variant]} ${className}`} />;
}
