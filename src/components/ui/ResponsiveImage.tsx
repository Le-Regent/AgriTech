import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface ResponsiveImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string;
  alt: string;
  className?: string;
  baseWidth?: number;
  baseHeight?: number;
}

/**
 * A reusable component for responsive, lazy-loaded, and accessible images
 * with a high-performance shimmer placeholder for slow connections.
 */
export default function ResponsiveImage({ 
  src, 
  alt, 
  className = '', 
  baseWidth,
  baseHeight,
  ...props 
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!src) return null;
  
  return (
    <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${className}`}>
      {/* Shimmer Effect */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent"></div>
        </div>
      )}
      
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
    </div>
  );
}
