import React from 'react';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  index?: number;
  className?: string;
  children?: React.ReactNode;
  showBadges?: boolean;
  onClick?: () => void;
}

export default function ProductCard({ 
  product, 
  className = '', 
  children, 
  showBadges = true,
  onClick 
}: ProductCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`group bg-white dark:bg-surface-dark rounded-[2.5rem] border border-slate-100 dark:border-border-dark shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        <ResponsiveImage
          src={product.image_url || 'https://picsum.photos/seed/product/400/300'}
          alt={`Fresh ${product.name}`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 dark:opacity-80"
          baseWidth={400}
          baseHeight={300}
        />
        {showBadges && (
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.is_verified && (
              <div className="bg-white/90 dark:bg-surface-dark/90 backdrop-blur px-2 py-1 rounded-lg shadow-sm flex items-center gap-1 w-fit">
                <span className="material-symbols-outlined text-primary text-[14px] fill-1">verified</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Verified</span>
              </div>
            )}
            {product.health_status && product.health_status !== 'N/A' && (
              <div className={`backdrop-blur px-2 py-1 rounded-lg shadow-sm flex items-center gap-1 text-white w-fit ${
                product.health_status === 'Critical' ? 'bg-red-600/90 animate-pulse' : 
                product.health_status === 'Warning' ? 'bg-amber-500/90' : 
                'bg-primary/90'
              }`}>
                <span className="material-symbols-outlined text-[14px] fill-1">
                  {product.health_status === 'Critical' ? 'timer_off' : 
                   product.health_status === 'Warning' ? 'warning' : 'eco'}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {product.health_status === 'Critical' ? 'Last Chance' : 
                   product.health_status === 'Warning' ? 'Expiring Soon' : 
                   product.health_status}
                </span>
              </div>
            )}
            <div className="bg-emerald-500/90 backdrop-blur px-2 py-1 rounded-lg shadow-sm flex items-center gap-1 text-white w-fit">
              <span className="material-symbols-outlined text-[14px] fill-1">inventory</span>
              <span className="text-[10px] font-black uppercase tracking-widest">{product.stock_quantity > 0 ? `${product.stock_quantity} ${product.unit}` : 'Out of Stock'}</span>
            </div>
          </div>
        )}
        {children}
      </div>
      <div className="p-3 sm:p-6 space-y-2 sm:space-y-4 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
            <h3 className="font-black text-sm sm:text-lg group-hover:text-primary dark:text-white transition-colors truncate">{product.name}</h3>
            <p className="font-black text-primary text-xs sm:text-base whitespace-nowrap">{product.price.toLocaleString()}<span className="text-[8px] sm:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase"> CFA</span></p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
              <span className="material-symbols-outlined text-[14px] sm:text-[16px]">location_on</span>
              <span className="text-[10px] sm:text-xs font-bold truncate">{product.location}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 truncate max-w-[60px] sm:max-w-[80px]">{product.profiles?.full_name?.split(' ')[0] || 'Farmer'}</span>
              {product.profiles?.is_verified && (
                <span className="material-symbols-outlined text-blue-500 text-[12px] sm:text-[14px] fill-1" title="Verified Farmer">verified_user</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
