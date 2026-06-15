import React from 'react';
import { motion } from 'motion/react';
import { Product } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

interface MarketplaceHeaderProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onAddProduct: () => void;
  showAddButton: boolean;
  onShowFilters: () => void;
  sortBy: string;
  onSortChange: (val: any) => void;
  t: (key: string) => string;
}

const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
  searchTerm,
  onSearchChange,
  onAddProduct,
  showAddButton,
  onShowFilters,
  sortBy,
  onSortChange,
  t
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      id="marketplace-header" 
      className="w-full"
    >
      {/* Mobile-optimized single row: ultra compact */}
      <div className="flex items-center gap-2 sm:hidden w-full h-10">
        <div className="relative flex-1 h-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input
            id="search-input-mobile"
            type="text"
            placeholder={t('search_products_placeholder')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-full pl-9 pr-3 py-1.5 bg-white dark:bg-muted-dark border border-slate-200 dark:border-border-dark rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all placeholder:text-[11px]"
          />
        </div>

        {/* Sell Button if farmer (Plus icon only on mobile) */}
        {showAddButton && (
          <button 
            onClick={onAddProduct}
            aria-label={t('sell_produce')}
            title={t('sell_produce')}
            className="w-10 h-10 bg-primary hover:bg-primary/95 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
          </button>
        )}

        {/* Filter Button */}
        <button 
          onClick={onShowFilters}
          aria-label={t('filters')}
          title={t('filters')}
          className="w-10 h-10 bg-slate-900 dark:bg-slate-800 text-white rounded-xl flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
        </button>

        {/* Sort Button with hidden select */}
        <div className="relative w-10 h-10 shrink-0">
          <button 
            className="w-full h-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Sort products"
          >
            <span className="material-symbols-outlined text-[18px]">sort</span>
          </button>
          <select 
            className="absolute inset-0 opacity-0 cursor-pointer"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="Sort parameter"
          >
            <option value="name-asc">A-Z</option>
            <option value="price-low">Price: Low-High</option>
            <option value="price-high">Price: High-Low</option>
          </select>
        </div>
      </div>

      {/* Compact Desktop/Tablet Header Layout */}
      <div className="hidden sm:flex items-center justify-between gap-4 h-11 py-0.5">
        <div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight dark:text-white leading-none">{t('marketplace_explorer')}</h2>
        </div>
        <div className="flex items-center gap-3 max-w-xl flex-1 justify-end">
          {showAddButton && (
            <button 
              onClick={onAddProduct}
              className="bg-primary hover:bg-primary/95 text-white h-9 px-4 rounded-xl font-black text-xs shadow-md shadow-primary/10 hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span className="truncate">{t('sell_produce')}</span>
            </button>
          )}
          <div className="relative flex-1 max-w-xs h-9">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input
              id="search-input"
              type="text"
              placeholder={t('search_products_placeholder')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-full pl-9 pr-3 bg-white dark:bg-muted-dark border border-slate-200 dark:border-border-dark rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all placeholder:text-[11px]"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketplaceHeader;
