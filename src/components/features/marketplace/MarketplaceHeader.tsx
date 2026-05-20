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
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      id="marketplace-header" 
      className="-mx-4 px-4 py-4 border-b border-slate-100 dark:border-white/5 sm:static sm:bg-transparent sm:backdrop-blur-none sm:p-0 sm:border-none"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="hidden sm:block">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight dark:text-white">{t('marketplace_explorer')}</h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">{t('marketplace_explorer_desc')}</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          {showAddButton && (
            <button 
              onClick={onAddProduct}
              className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 sm:w-auto"
            >
              <span className="material-symbols-outlined">add_circle</span>
              <span className="truncate">{t('sell_produce')}</span>
            </button>
          )}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              id="search-input"
              type="text"
              placeholder={t('search_products_placeholder')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-muted-dark border border-slate-200 dark:border-border-dark rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all"
            />
          </div>
          
          <div className="flex gap-2 sm:hidden">
             <button 
              onClick={onShowFilters}
              className="flex-1 bg-slate-900 dark:bg-slate-800 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">tune</span>
              {t('filters')}
            </button>
            <div className="relative flex-1">
              <button className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">sort</span>
                Sort
              </button>
              <select 
                className="absolute inset-0 opacity-0 cursor-pointer"
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
              >
                <option value="name-asc">A-Z</option>
                <option value="price-low">Price: Low-High</option>
                <option value="price-high">Price: High-Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketplaceHeader;
