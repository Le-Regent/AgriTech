import React from 'react';
import Image, { ImageProps } from 'next/image';

interface ResponsiveImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string;
  alt: string;
  className?: string;
  baseWidth?: number;
  baseHeight?: number;
}

/**
 * A reusable component for responsive, lazy-loaded, and accessible images.
 */
export default function ResponsiveImage({ 
  src, 
  alt, 
  className = '', 
  baseWidth,
  baseHeight,
  ...props 
}: ResponsiveImageProps) {
  if (!src) return null;
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        referrerPolicy="no-referrer"
        {...props}
      />
    </div>
  );
}
