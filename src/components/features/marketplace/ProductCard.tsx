import React from 'react';
import { motion } from 'motion/react';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import { Product } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  
  return (
    <div 
      onClick={onClick}
      className={`group bg-white dark:bg-surface-dark rounded-2xl sm:rounded-[2.5rem] border border-slate-100 dark:border-border-dark shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="aspect-square lg:aspect-[4/5] relative overflow-hidden">
        <ResponsiveImage
          src={product.image_url || 'https://picsum.photos/seed/product/800/1000'}
          alt={`Fresh ${product.name}`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 dark:opacity-80"
          baseWidth={600}
          baseHeight={800}
        />
        {showBadges && (
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-col gap-1 sm:gap-2">
            {product.is_verified && (
              <div className="bg-white/90 dark:bg-surface-dark/90 backdrop-blur px-1 py-0.5 rounded-lg shadow-sm flex items-center gap-1 w-fit">
                <span className="material-symbols-outlined text-primary text-[10px] sm:text-[14px] fill-1">verified</span>
                <span className="text-[7px] sm:text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Verified</span>
              </div>
            )}
            {product.health_status && product.health_status !== 'N/A' && (
              <div className={`backdrop-blur px-1 py-0.5 rounded-lg shadow-sm flex items-center gap-1 text-white w-fit ${
                product.health_status === 'Critical' ? 'bg-red-600/90 animate-pulse' : 
                product.health_status === 'Warning' ? 'bg-amber-500/90' : 
                'bg-primary/90'
              }`}>
                <span className="material-symbols-outlined text-[10px] sm:text-[14px] fill-1">
                  {product.health_status === 'Critical' ? 'timer_off' : 
                   product.health_status === 'Warning' ? 'warning' : 'eco'}
                </span>
                <span className="text-[7px] sm:text-[10px] font-black uppercase tracking-widest">
                  {product.health_status === 'Critical' ? 'Last chance' : 
                   product.health_status === 'Warning' ? 'Soon' : 
                   product.health_status}
                </span>
              </div>
            )}
            <div className="bg-emerald-500/90 backdrop-blur px-1 py-0.5 rounded-lg shadow-sm flex items-center gap-1 text-white w-fit">
              <span className="material-symbols-outlined text-[10px] sm:text-[14px] fill-1">inventory</span>
              <span className="text-[7px] sm:text-[10px] font-black uppercase tracking-widest leading-none">
                {product.stock_quantity > 0 ? `${product.stock_quantity} ${product.unit}` : 'Out'}
              </span>
            </div>
          </div>
        )}
        {product.is_perishable && product.expiry_date && (
          <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 bg-black/20 backdrop-blur-sm overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ 
                width: `${Math.max(0, Math.min(100, 
                  ((new Date(product.expiry_date).getTime() - Date.now()) / 
                  (new Date(product.expiry_date).getTime() - new Date(product.created_at).getTime())) * 100
                ))}%` 
              }}
              className={`h-full transition-all duration-1000 ${
                product.health_status === 'Critical' ? 'bg-red-500' :
                product.health_status === 'Warning' ? 'bg-amber-500' :
                'bg-primary'
              }`}
            />
          </div>
        )}
        {children}
      </div>
      <div className="p-2 sm:p-5 space-y-1 sm:space-y-4 flex-1 flex flex-col min-h-[85px] sm:min-h-[140px]">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-0.5 gap-0.5">
            <h3 className="font-black text-xs sm:text-lg group-hover:text-primary dark:text-white transition-colors truncate pr-1" title={product.name}>
              {product.name}
            </h3>
            <p className="font-black text-primary text-xs sm:text-base whitespace-nowrap">
              {product.price.toLocaleString()}
              <span className="text-[7px] sm:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase"> FCFA</span>
            </p>
          </div>
          <div className="flex flex-col gap-1 mt-1 sm:mt-2">
            <div className="hidden sm:flex items-center gap-1 text-slate-400 dark:text-slate-500">
              <span className="material-symbols-outlined text-[14px] sm:text-[18px]">location_on</span>
              <span className="text-[10px] sm:text-xs font-bold truncate">{product.location}</span>
            </div>
            <div 
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/farmer/${product.farmer_id}`);
              }}
              className="flex items-center gap-1 flex-wrap hover:opacity-70 transition-opacity cursor-pointer"
            >
              <div className="flex items-center gap-0.5">
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 truncate max-w-[55px] sm:max-w-none">
                  {product.profiles?.full_name?.split(' ')[0] || 'Farmer'}
                </span>
                {product.profiles?.is_verified && (
                  <span className="material-symbols-outlined text-blue-500 text-[10px] sm:text-[14px] fill-1" title="Verified Farmer">verified_user</span>
                )}
              </div>
              <span className="hidden sm:block w-0.5 h-0.5 bg-slate-300 dark:bg-slate-700 rounded-full shrink-0" />
              <span className="hidden sm:block text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate">
                {product.category}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
