import React from 'react';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  index?: number;
  className?: string;
  children?: React.ReactNode;
  showBadges?: boolean;
}

export default function ProductCard({ product, className = '', children, showBadges = true }: ProductCardProps) {
  return (
    <div className={`group bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col ${className}`}>
      <div className="aspect-[4/3] relative overflow-hidden">
        <ResponsiveImage
          src={product.image_url || 'https://picsum.photos/seed/product/400/300'}
          alt={`Fresh ${product.name}`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 dark:opacity-80"
          baseWidth={400}
          baseHeight={300}
        />
        {showBadges && (
          <div className="absolute top-4 left-4 flex gap-2">
            {product.is_verified && (
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-primary text-[14px] fill-1">verified</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Verified</span>
              </div>
            )}
            {product.health_status && product.health_status !== 'N/A' && (
              <div className="bg-primary/90 backdrop-blur px-2 py-1 rounded-lg shadow-sm flex items-center gap-1 text-white">
                <span className="material-symbols-outlined text-[14px] fill-1">eco</span>
                <span className="text-[10px] font-black uppercase tracking-widest">{product.health_status}</span>
              </div>
            )}
          </div>
        )}
        {children}
      </div>
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-black text-lg group-hover:text-primary dark:text-white transition-colors truncate">{product.name}</h3>
            <p className="font-black text-primary whitespace-nowrap">{product.price.toLocaleString()}<span className="text-xs text-slate-400 dark:text-slate-500 font-bold"> CFA/{product.unit}</span></p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              <span className="text-xs font-bold truncate">{product.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 truncate max-w-[80px]">{product.profiles?.full_name || 'Unknown Farmer'}</span>
              {product.profiles?.is_verified && (
                <span className="material-symbols-outlined text-blue-500 text-[14px] fill-1" title="Verified Farmer">verified_user</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
