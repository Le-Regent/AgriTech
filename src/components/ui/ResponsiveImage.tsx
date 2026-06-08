import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface ResponsiveImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string;
  alt: string;
  className?: string;
  baseWidth?: number;
  baseHeight?: number;
  priority?: boolean;
}

/**
 * A reusable component for responsive, lazy-loaded, and accessible images
 * with a high-performance shimmer placeholder for slow connections.
 * Automatically routes remote images through an API proxy for web caching.
 */
export default function ResponsiveImage({ 
  src, 
  alt, 
  className = '', 
  baseWidth,
  baseHeight,
  priority = false,
  ...props 
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!src) return null;

  const isExternal = src.startsWith('http://') || src.startsWith('https://');
  const imageUrl = isExternal ? `/api/image-proxy?url=${encodeURIComponent(src)}` : src;
  
  // For remote proxied images, render a standard browser image element
  // to bypass Next.js static builder query-string constraints on local-route requests.
  if (isExternal) {
    return (
      <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${className}`}>
        {/* Shimmer Effect */}
        {!isLoaded && !priority && (
          <div className="absolute inset-0 z-10 overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent"></div>
          </div>
        )}
        <img
          src={imageUrl}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-500 absolute inset-0 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          referrerPolicy="no-referrer"
          loading={priority ? "eager" : "lazy"}
          onLoad={() => setIsLoaded(true)}
          {...(props as any)}
        />
      </div>
    );
  }

  // Fallback to Next.js `<Image>` optimized loader for standard relative path assets
  return (
    <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${className}`}>
      {/* Shimmer Effect */}
      {!isLoaded && !priority && (
        <div className="absolute inset-0 z-10 overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent"></div>
        </div>
      )}
      
      <Image
        src={imageUrl}
        alt={alt}
        fill
        priority={priority}
        className={`object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        {...props}
      />
    </div>
  );
}
